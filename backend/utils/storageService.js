const path = require("path");
const fs = require("fs");

require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
});

const SPACEBYTE_ENDPOINT = (
  process.env.SPACEBYTE_ENDPOINT || "https://spacebyte.in/api/v1"
).replace(/\/+$/, "");

const SPACEBYTE = {
  ENDPOINT: SPACEBYTE_ENDPOINT,

  API_TOKEN:
    process.env.SPACEBYTE_API_TOKEN ||
    process.env.SPACEBYTE_ACCESS_KEY ||
    process.env.SPACEBITE_ACCESS_KEY ||
    "",

  PARENT_ID: process.env.SPACEBYTE_PARENT_ID || "",

  UPLOAD_TIMEOUT_MS: Number(process.env.SPACEBYTE_UPLOAD_TIMEOUT_MS || 120000),

  MAX_FILE_SIZE_BYTES: Number(
    process.env.SPACEBYTE_MAX_FILE_SIZE_BYTES || 50 * 1024 * 1024,
  ),
};

const isSpaceByteConfigured = Boolean(
  SPACEBYTE.ENDPOINT && SPACEBYTE.API_TOKEN,
);

const localUploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(localUploadDir)) {
  fs.mkdirSync(localUploadDir, { recursive: true });
}

const sanitizeName = (name = "file") =>
  String(name)
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^[-_.]+|[-_.]+$/g, "") || "file";

const humanSize = (bytes = 0) => {
  const value = Number(bytes);

  if (!Number.isFinite(value) || value <= 0) {
    return "0 B";
  }

  const sizes = ["B", "KB", "MB", "GB", "TB"];

  const index = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    sizes.length - 1,
  );

  return `${parseFloat(
    (value / Math.pow(1024, index)).toFixed(2),
  )} ${sizes[index]}`;
};

const buildStorageKey = (
  patientId,
  recordId = "records",
  originalName = "file",
  patientName = "",
  documentNumber = 1,
) => {
  const safePatient = sanitizeName(
    String(patientName || "").trim() || patientId || "unknown",
  ).slice(0, 80);

  const safeRecord = sanitizeName(recordId || "records");

  const safeName = sanitizeName(originalName);

  const safeNumber =
    Number.isInteger(documentNumber) && documentNumber > 0 ? documentNumber : 1;

  return `${safePatient}/${safeRecord}/${safePatient}_${safeNumber}_${safeName}`;
};

const getNextDocumentNumber = (patientName, patientId = "unknown") => {
  const safePatient = sanitizeName(String(patientName || "").trim() || patientId).slice(0, 80);
  const patientDir = path.join(localUploadDir, safePatient);
  if (!fs.existsSync(patientDir)) return 1;

  let highest = 0;
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(entryPath);
        continue;
      }
      const match = entry.name.match(new RegExp(`^${safePatient}_(\\d+)_`));
      if (match) highest = Math.max(highest, Number(match[1]));
    }
  };
  visit(patientDir);
  return highest + 1;
};

const ensureLocalDir = (storageKey) => {
  fs.mkdirSync(path.join(localUploadDir, path.dirname(storageKey)), { recursive: true });
};

const getUploadUrl = () => `${SPACEBYTE.ENDPOINT}/uploads`;

const getAuthHeaders = () => {
  if (!SPACEBYTE.API_TOKEN) {
    throw new Error("SPACEBYTE_API_TOKEN is not configured");
  }

  return {
    Accept: "application/json",
    Authorization: `Bearer ${SPACEBYTE.API_TOKEN}`,
    "X-API-Key": SPACEBYTE.API_TOKEN,
  };
};

const readFileBuffer = async (file) => {
  if (file?.buffer && Buffer.isBuffer(file.buffer)) {
    return file.buffer;
  }

  const filePath = file?.path || file?.tempFilePath;

  if (!filePath) {
    throw new Error("Uploaded file data is missing");
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

const getSpaceByteError = (payload, status) => {
  if (!payload) {
    return `HTTP ${status}`;
  }

  if (typeof payload === "string") {
    return payload;
  }

  return (
    payload.message ||
    payload.error ||
    payload.detail ||
    payload.title ||
    payload.errors?.[0]?.message ||
    `HTTP ${status}`
  );
};

const normalizeRelativePath = (storageKey) => {
  if (!storageKey) {
    return "";
  }

  return String(storageKey)
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/");
};

const uploadToSpaceByte = async (file, storageKey = "") => {
  if (!SPACEBYTE.API_TOKEN) {
    throw new Error("SPACEBYTE_API_TOKEN is not configured");
  }

  const bytes = await readFileBuffer(file);

  if (!bytes.length) {
    throw new Error("Uploaded file is empty");
  }

  if (bytes.length > SPACEBYTE.MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `File size ${humanSize(
        bytes.length,
      )} exceeds the maximum allowed size of ${humanSize(
        SPACEBYTE.MAX_FILE_SIZE_BYTES,
      )}`,
    );
  }

  const originalName = sanitizeName(
    path.basename(storageKey) || file.originalname || file.name || "file",
  );

  const mimeType = file.mimetype || "application/octet-stream";

  const form = new FormData();

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

  const relativePath = normalizeRelativePath(storageKey);

  if (relativePath) {
    form.append("relativePath", relativePath);
  }

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, SPACEBYTE.UPLOAD_TIMEOUT_MS);

  let response;

  try {
    response = await fetch(getUploadUrl(), {
      method: "POST",
      headers: getAuthHeaders(),
      body: form,
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(
        `SpaceByte upload timed out after ${Math.round(
          SPACEBYTE.UPLOAD_TIMEOUT_MS / 1000,
        )} seconds`,
      );
    }

    throw new Error(
      `SpaceByte upload request failed: ${error?.message || "Network error"}`,
    );
  } finally {
    clearTimeout(timeout);
  }

  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      `SpaceByte upload failed (${response.status}): ${getSpaceByteError(
        payload,
        response.status,
      )}`,
    );
  }

  if (payload?.success !== true) {
    throw new Error(
      `SpaceByte upload was not successful: ${getSpaceByteError(
        payload,
        response.status,
      )}`,
    );
  }

  const attachments = Array.isArray(payload.attachments)
    ? payload.attachments
    : [];

  if (!attachments.length) {
    throw new Error("SpaceByte upload succeeded but returned no attachment");
  }

  const uploaded = attachments[0];

  const url = uploaded?.url || uploaded?.downloadUrl || uploaded?.link || "";

  if (!url) {
    throw new Error("SpaceByte upload succeeded but returned no file URL");
  }

  let fileEntryId = null;

  const match = String(url).match(/\/file-entries\/([^/?#]+)/i);

  if (match) {
    fileEntryId = match[1];
  }

  return {
    payload,
    uploaded,
    url,
    fileEntryId,
  };
};

const uploadFile = async ({ file, storageKey }) => {
  if (!file) {
    throw new Error("File is required");
  }

  if (!isSpaceByteConfigured) {
    throw new Error("SpaceByte storage is not configured. Set SPACEBYTE_API_TOKEN or SPACEBYTE_ACCESS_KEY.");
  }

  const result = await uploadToSpaceByte(file, storageKey);
  const uploaded = result.uploaded || {};

  return {
    storageKey: uploaded.storageKey || storageKey,
    name: uploaded.name || uploaded.originalName || path.basename(storageKey),
    originalName: file.originalname || file.name || path.basename(storageKey),
    size: uploaded.size ?? file.size ?? 0,
    type: uploaded.type || file.mimetype || "application/octet-stream",
    url: result.url,
    fileEntryId: result.fileEntryId,
    uploadedAt: uploaded.uploadedAt || new Date().toISOString(),
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
  void expiresInSeconds;
  return storedUrl || `/files/${encodeURIComponent(storageKey)}`;
};

const fetchProviderFile = async (rawUrl) => {
  if (!rawUrl) {
    throw new Error("Storage file URL is required");
  }

  let url;

  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Invalid storage file URL");
  }

  const endpoint = new URL(SPACEBYTE.ENDPOINT);

  if (
    url.protocol !== endpoint.protocol ||
    url.hostname !== endpoint.hostname ||
    url.port !== endpoint.port
  ) {
    throw new Error("Invalid storage file URL");
  }

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const payload = await parseResponse(response);

    throw new Error(
      `Storage file request failed (${response.status}): ${getSpaceByteError(
        payload,
        response.status,
      )}`,
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
  getNextDocumentNumber,
  uploadFile,
  getPresignedUrl,
  fetchProviderFile,
  getSpaceByteFileUrl,
};
