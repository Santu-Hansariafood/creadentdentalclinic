const path = require("path");
const fs = require("fs");

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

  UPLOAD_TIMEOUT_MS: Number(process.env.SPACEBYTE_UPLOAD_TIMEOUT_MS || 120000),
};

const localUploadDir = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(localUploadDir)) {
  fs.mkdirSync(localUploadDir, {
    recursive: true,
  });
}

const isSpaceByteConfigured = Boolean(
  SPACEBYTE.ENDPOINT && SPACEBYTE.API_TOKEN,
);

const sanitizeName = (name = "file") =>
  String(name)
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_");

const humanSize = (bytes) => {
  if (!bytes) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const buildStorageKey = (
  patientId,
  recordId = "records",
  originalName = "file",
  patientName = "",
) => {
  const safePatient = sanitizeName(patientId || "unknown");
  const safeRecord = sanitizeName(recordId || "records");
  const safeName = sanitizeName(originalName);

  let namePrefix = "";

  if (patientName && String(patientName).trim()) {
    namePrefix = sanitizeName(patientName).slice(0, 40) + "_";
  }

  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);

  return `medical-records/${safePatient}/${safeRecord}/${namePrefix}${timestamp}_${random}_${safeName}`;
};

const ensureLocalDir = (storageKey) => {
  const fullPath = path.join(localUploadDir, path.dirname(storageKey));

  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, {
      recursive: true,
    });
  }
};

const getUploadUrl = () => `${SPACEBYTE.ENDPOINT}/uploads`;

const getAuthorizationHeaders = () => ({
  Accept: "application/json",
  Authorization: `Bearer ${SPACEBYTE.API_TOKEN}`,
});

const readFileBuffer = async (file) => {
  if (file?.buffer && Buffer.isBuffer(file.buffer)) {
    return file.buffer;
  }

  const filePath = file?.path || file?.tempFilePath;

  if (!filePath) {
    throw new Error("No file buffer or file path provided");
  }

  return fs.promises.readFile(filePath);
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

const uploadToSpaceByte = async (file) => {
  if (!SPACEBYTE.API_TOKEN) {
    throw new Error("SPACEBYTE_API_TOKEN is not configured");
  }

  const bytes = await readFileBuffer(file);

  const form = new FormData();

  const originalName = file.originalname || file.name || "file";

  const mimeType = file.mimetype || "application/octet-stream";

  form.append(
    "file",
    new Blob([bytes], {
      type: mimeType,
    }),
    originalName,
  );

  if (SPACEBYTE.PARENT_ID) {
    form.append("parentId", String(SPACEBYTE.PARENT_ID));
  }

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, SPACEBYTE.UPLOAD_TIMEOUT_MS);

  let response;

  try {
    response = await fetch(getUploadUrl(), {
      method: "POST",
      headers: getAuthorizationHeaders(),
      body: form,
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(
        `SpaceByte upload timed out after ${Math.round(
          SPACEBYTE.UPLOAD_TIMEOUT_MS / 1000,
        )} seconds`,
      );
    }

    throw new Error(`SpaceByte upload request failed: ${error.message}`);
  } finally {
    clearTimeout(timeout);
  }

  const payload = await parseResponse(response);

  if (!response.ok) {
    const message =
      payload?.message || payload?.error || `HTTP ${response.status}`;

    throw new Error(`SpaceByte upload failed (${response.status}): ${message}`);
  }

  if (payload?.success !== true) {
    throw new Error(payload?.message || "SpaceByte upload was not successful");
  }

  /*
   * SpaceByte returns:
   *
   * {
   *   success: true,
   *   attachments: [
   *     {
   *       name,
   *       originalName,
   *       size,
   *       storageKey,
   *       type,
   *       uploadedAt,
   *       url
   *     }
   *   ]
   * }
   */

  const attachments = Array.isArray(payload.attachments)
    ? payload.attachments
    : [];

  if (!attachments.length) {
    throw new Error("SpaceByte upload succeeded but returned no attachment");
  }

  const uploaded = attachments[0];

  const rawUrl = uploaded.url || uploaded.downloadUrl || uploaded.link || "";

  if (!rawUrl) {
    throw new Error("SpaceByte upload succeeded but returned no file URL");
  }

  let fileEntryId = null;

  const match = rawUrl.match(/\/file-entries\/(\d+)(?:\/)?$/i);

  if (match) {
    fileEntryId = match[1];
  }

  return {
    payload,
    uploaded,
    fileEntryId,
    url: rawUrl,
  };
};

const uploadFile = async ({ file, storageKey }) => {
  if (!file) {
    throw new Error("File is required");
  }

  if (isSpaceByteConfigured) {
    const result = await uploadToSpaceByte(file);

    const uploaded = result.uploaded || {};

    return {
      storageKey: uploaded.storageKey || storageKey,

      name:
        uploaded.name ||
        uploaded.originalName ||
        file.originalname ||
        file.name ||
        path.basename(storageKey),

      originalName:
        uploaded.originalName ||
        file.originalname ||
        file.name ||
        path.basename(storageKey),

      size: uploaded.size ?? file.size ?? 0,

      type: uploaded.type || file.mimetype || "application/octet-stream",

      url: result.url,

      fileEntryId: result.fileEntryId,

      uploadedAt: uploaded.uploadedAt || new Date().toISOString(),
    };
  }

  ensureLocalDir(storageKey);

  const fullPath = path.join(localUploadDir, storageKey);

  if (file.buffer && Buffer.isBuffer(file.buffer)) {
    await fs.promises.writeFile(fullPath, file.buffer);
  } else {
    const sourcePath = file.path || file.tempFilePath;

    if (!sourcePath) {
      throw new Error("No file buffer or source file path provided");
    }

    await fs.promises.copyFile(sourcePath, fullPath);
  }

  const stat = await fs.promises.stat(fullPath);

  return {
    storageKey,

    name: path.basename(storageKey),

    originalName: file.originalname || file.name || path.basename(storageKey),

    size: file.size || stat.size,

    type: file.mimetype || "application/octet-stream",

    url: `/files/${encodeURIComponent(storageKey)}`,

    fileEntryId: null,

    uploadedAt: new Date().toISOString(),
  };
};

const getSpaceByteFileUrl = (fileEntryId) => {
  if (!fileEntryId) {
    return null;
  }

  return `${SPACEBYTE.ENDPOINT}/file-entries/${encodeURIComponent(
    String(fileEntryId),
  )}`;
};

const getPresignedUrl = async (
  storageKey,
  expiresInSeconds = 86400,
  fileEntryId = null,
  storedUrl = null,
) => {
  if (storedUrl) {
    return storedUrl;
  }

  if (fileEntryId) {
    return getSpaceByteFileUrl(fileEntryId);
  }

  return `/files/${encodeURIComponent(storageKey)}`;
};

const fetchProviderFile = async (rawUrl) => {
  if (!rawUrl) {
    throw new Error("Storage file URL is required");
  }

  const url = new URL(rawUrl);
  const endpoint = new URL(SPACEBYTE.ENDPOINT);

  if (url.protocol !== "https:" || url.hostname !== endpoint.hostname) {
    throw new Error("Invalid storage file URL");
  }

  const response = await fetch(url, {
    method: "GET",

    headers: getAuthorizationHeaders(),
  });

  if (!response.ok) {
    const payload = await parseResponse(response);

    throw new Error(
      `Storage file request failed (${response.status}): ${
        payload?.message || payload?.error || "Unknown error"
      }`,
    );
  }
  return response;
};

module.exports = {
  SPACEBYTE,
  isSpaceByteConfigured,
  localUploadDir,
  sanitizeName,
  humanSize,
  buildStorageKey,
  uploadFile,
  getPresignedUrl,
  fetchProviderFile,
  getSpaceByteFileUrl,
};
