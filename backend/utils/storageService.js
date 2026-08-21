const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
});

const SPACEBYTE = {
  ENDPOINT: (
    process.env.SPACEBYTE_ENDPOINT || "https://spacebyte.in/api/v1"
  ).replace(/\/+$/, ""),

  API_TOKEN:
    process.env.SPACEBYTE_API_TOKEN ||
    process.env.SPACEBYTE_ACCESS_KEY ||
    process.env.SPACEBITE_ACCESS_KEY ||
    "",

  PARENT_ID: process.env.SPACEBYTE_PARENT_ID || "",
  UPLOAD_TIMEOUT: Number(process.env.SPACEBYTE_UPLOAD_TIMEOUT_MS) || 120000,
  MAX_FILE_SIZE:
    Number(process.env.SPACEBYTE_MAX_FILE_SIZE_BYTES) || 50 * 1024 * 1024,
};

const isConfigured = () => {
  return Boolean(SPACEBYTE.ENDPOINT && SPACEBYTE.API_TOKEN);
};

const sanitizeName = (name = "file") => {
  return (
    String(name)
      .trim()
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^[-_.]+|[-_.]+$/g, "")
      .slice(0, 150) || "file"
  );
};

const buildStoragePath = ({ folder = "files", fileName = "file" }) => {
  const safeFolder = String(folder)
    .split("/")
    .map(sanitizeName)
    .filter(Boolean)
    .join("/");

  const originalFileName = path.basename(String(fileName || "file")).trim();
  if (!originalFileName || originalFileName === "." || originalFileName === "..") {
    throw new Error("A valid file name is required");
  }
  return safeFolder ? `${safeFolder}/${originalFileName}` : originalFileName;
};

const getHeaders = () => {
  if (!SPACEBYTE.API_TOKEN) {
    throw new Error("SPACEBYTE_API_TOKEN is not configured");
  }

  return {
    Accept: "application/json",
    Authorization: `Bearer ${SPACEBYTE.API_TOKEN}`,
    "X-API-Key": SPACEBYTE.API_TOKEN,
  };
};

const getFileBuffer = async (file) => {
  if (!file) {
    throw new Error("File is required");
  }

  if (file.buffer && Buffer.isBuffer(file.buffer)) {
    return file.buffer;
  }

  if (file.path) {
    const fs = require("fs");
    return fs.promises.readFile(file.path);
  }

  if (file.tempFilePath) {
    const fs = require("fs");
    return fs.promises.readFile(file.tempFilePath);
  }
  throw new Error("Unable to read uploaded file");
};

const parseResponse = async (response) => {
  const text = await response.text();
  if (!text) {
    return {};
  }
  try {
    return JSON.parse(text);
  } catch {
    return {
      message: text,
    };
  }
};

const getErrorMessage = (data, status) => {
  if (!data) {
    return `HTTP ${status}`;
  }

  if (typeof data === "string") {
    return data;
  }

  return (
    data.message ||
    data.error ||
    data.detail ||
    data.title ||
    data.errors?.[0]?.message ||
    data.errors?.[0] ||
    "SpaceByte request failed"
  );
};

const extractUploadedFile = (data) => {
  if (!data) {
    return null;
  }
  if (data.file) {
    return data.file;
  }
  if (data.data?.file) {
    return data.data.file;
  }
  if (Array.isArray(data.attachments) && data.attachments.length) {
    return data.attachments[0];
  }
  if (Array.isArray(data.data?.attachments) && data.data.attachments.length) {
    return data.data.attachments[0];
  }
  if (data.data) {
    return data.data;
  }
  return null;
};

const uploadFile = async ({
  file,
  folder = "files",
  fileName,
  storagePath,
}) => {
  if (!isConfigured()) {
    throw new Error(
      "SpaceByte is not configured. Please set SPACEBYTE_API_TOKEN.",
    );
  }
  const buffer = await getFileBuffer(file);
  if (!buffer.length) {
    throw new Error("File is empty");
  }
  if (buffer.length > SPACEBYTE.MAX_FILE_SIZE) {
    throw new Error(
      `File exceeds maximum size of ${
        SPACEBYTE.MAX_FILE_SIZE / 1024 / 1024
      } MB`,
    );
  }

  const originalName = fileName || file.originalname || file.name || "file";
  const safeFileName = path.basename(String(originalName)).trim();
  const destination =
    storagePath ||
    buildStoragePath({
      folder,
      fileName: safeFileName,
    });
  const form = new FormData();

  form.append(
    "file",
    new Blob([buffer], {
      type: file.mimetype || "application/octet-stream",
    }),
    safeFileName,
  );

  if (SPACEBYTE.PARENT_ID) {
    form.append("parentId", SPACEBYTE.PARENT_ID);
  }

  if (destination) {
    form.append("relativePath", destination);
  }

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, SPACEBYTE.UPLOAD_TIMEOUT);

  let response;

  try {
    response = await fetch(`${SPACEBYTE.ENDPOINT}/uploads`, {
      method: "POST",
      headers: getHeaders(),
      body: form,
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("SpaceByte upload timed out");
    }

    throw new Error(
      `SpaceByte upload failed: ${error.message || "Network error"}`,
    );
  } finally {
    clearTimeout(timeout);
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      `SpaceByte upload failed (${response.status}): ${getErrorMessage(
        data,
        response.status,
      )}`,
    );
  }

  const uploaded = extractUploadedFile(data);

  if (!uploaded) {
    throw new Error(
      "SpaceByte upload completed but no file information was returned",
    );
  }

  const url = uploaded.url || uploaded.downloadUrl || uploaded.link || null;

  const fileEntryId =
    uploaded.fileEntryId || uploaded.id || uploaded._id || null;

  return {
    success: true,

    id: fileEntryId,

    fileEntryId,

    name: originalName,

    originalName,

    storageKey: uploaded.storageKey || uploaded.path || destination,

    url,

    size: uploaded.size ?? file.size ?? buffer.length,

    type:
      uploaded.type ||
      uploaded.mimeType ||
      file.mimetype ||
      "application/octet-stream",

    uploadedAt: uploaded.uploadedAt || new Date().toISOString(),

    raw: data,
  };
};

const downloadFile = async (fileUrl) => {
  if (!fileUrl) {
    throw new Error("SpaceByte file URL is required");
  }

  if (!isConfigured()) {
    throw new Error("SpaceByte is not configured");
  }

  let url;

  try {
    url = new URL(fileUrl);
  } catch {
    throw new Error("Invalid SpaceByte file URL");
  }

  const endpoint = new URL(SPACEBYTE.ENDPOINT);

  if (url.hostname !== endpoint.hostname) {
    throw new Error("Invalid SpaceByte file host");
  }

  const response = await fetch(url, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    const data = await parseResponse(response);

    throw new Error(
      `SpaceByte download failed (${response.status}): ${getErrorMessage(
        data,
        response.status,
      )}`,
    );
  }

  return response;
};

const getFileById = async (fileEntryId) => {
  if (!fileEntryId) {
    throw new Error("SpaceByte file ID is required");
  }

  const url = `${SPACEBYTE.ENDPOINT}/file-entries/${encodeURIComponent(
    fileEntryId,
  )}`;

  return downloadFile(url);
};

const getPresignedUrl = async (storageKey, expiresInSeconds = 86400, fileEntryId, storedUrl) => {
  void expiresInSeconds;
  if (storedUrl) return storedUrl;
  if (fileEntryId) {
    return `${SPACEBYTE.ENDPOINT}/file-entries/${encodeURIComponent(fileEntryId)}`;
  }
  return storageKey || null;
};

const fetchProviderFile = downloadFile;

module.exports = {
  SPACEBYTE,
  isConfigured,
  sanitizeName,
  buildStoragePath,
  uploadFile,
  downloadFile,
  getFileById,
  getPresignedUrl,
  fetchProviderFile,
};
