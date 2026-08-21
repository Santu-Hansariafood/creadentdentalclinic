const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const SPACEBITE = {
  ENDPOINT: process.env.SPACEBYTE_ENDPOINT || "",
  ACCESS_KEY: process.env.SPACEBYTE_ACCESS_KEY || process.env.SPACEBITE_ACCESS_KEY || "",
  SECRET_KEY: process.env.SPACEBYTE_SECRET_KEY || process.env.SPACEBITE_SECRET_KEY || "",
  BUCKET: process.env.SPACEBYTE_BUCKET || process.env.SPACEBITE_BUCKET || "Creadent",
  REGION: process.env.SPACEBYTE_REGION || process.env.SPACEBITE_REGION || "auto",
  BASE_URL: process.env.SPACEBYTE_BASE_URL || process.env.SPACEBITE_BASE_URL || "",
  PARENT_ID: process.env.SPACEBYTE_PARENT_ID || "",
};

const fs = require("fs");

const localUploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(localUploadDir)) {
  try { fs.mkdirSync(localUploadDir, { recursive: true }); } catch (e) {}
}

const isSpaceBiteConfigured =
  !!SPACEBITE.ENDPOINT && !!SPACEBITE.ACCESS_KEY;

const sanitizeName = (name = "file") =>
  name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_");

const humanSize = (bytes) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const buildStorageKey = (patientId, recordId = "records", originalName = "file", patientName = "") => {
  const safePatient = sanitizeName(patientId || "unknown");
  const safeRecord = sanitizeName(recordId || "records");
  const safeName = sanitizeName(originalName);
  let namePrefix = "";
  if (patientName && String(patientName).trim()) {
    namePrefix = sanitizeName(patientName).slice(0, 40) + "_";
  }
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 10000);
  return `medical-records/${safePatient}/${safeRecord}/${namePrefix}${ts}_${rand}_${safeName}`;
};

const ensureLocalDir = (key) => {
  const full = path.join(localUploadDir, path.dirname(key));
  if (!fs.existsSync(full)) {
    fs.mkdirSync(full, { recursive: true });
  }
};

const providerUploadUrl = () => `${SPACEBITE.ENDPOINT.replace(/\/$/, "")}/uploads`;

const getProviderFile = (payload) =>
  payload?.fileEntry || payload?.file || payload?.data?.file || payload?.upload || payload?.data || payload;

const uploadToSpaceByte = async (file) => {
  const bytes = file.buffer && Buffer.isBuffer(file.buffer)
    ? file.buffer
    : await fs.promises.readFile(file.path || file.tempFilePath);
  const form = new FormData();
  form.append("file", new Blob([bytes], {
    type: file.mimetype || "application/octet-stream",
  }), file.originalname || file.name || "file");
  if (SPACEBITE.PARENT_ID) form.append("parentId", SPACEBITE.PARENT_ID);

  const response = await fetch(providerUploadUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SPACEBITE.ACCESS_KEY}`,
      "X-API-Key": SPACEBITE.ACCESS_KEY,
    },
    body: form,
  });
  const text = await response.text();
  let payload;
  try { payload = text ? JSON.parse(text) : {}; } catch (_) { payload = { message: text }; }
  if (!response.ok) {
    const detail = payload?.message || payload?.error || `HTTP ${response.status}`;
    throw new Error(`SpaceByte upload failed (${response.status}): ${detail}`);
  }

  const uploaded = getProviderFile(payload);
  const rawUrl = uploaded?.url || uploaded?.downloadUrl || uploaded?.path || uploaded?.link;
  const url = rawUrl && /^https?:\/\//i.test(rawUrl)
    ? rawUrl
    : rawUrl
      ? `${SPACEBITE.ENDPOINT.replace(/\/api\/v1\/?$/, "")}/${String(rawUrl).replace(/^\//, "")}`
      : "";
  if (!url) throw new Error("SpaceByte upload returned no file URL");
  return { payload, uploaded, url };
};

const uploadFile = async ({ file, storageKey }) => {
  if (isSpaceBiteConfigured) {
    const result = await uploadToSpaceByte(file);
    const uploaded = result.uploaded || {};
    return {
      storageKey,
      name: uploaded.name || uploaded.file_name || uploaded.originalName || file.originalname || path.basename(storageKey),
      originalName: file.originalname || file.name || path.basename(storageKey),
      size: uploaded.size || uploaded.file_size || file.size,
      type: uploaded.mimeType || uploaded.mimetype || uploaded.mime || file.mimetype || "application/octet-stream",
      url: result.url,
      uploadedAt: new Date().toISOString(),
    };
  }

  ensureLocalDir(storageKey);
  const fullPath = path.join(localUploadDir, storageKey);
  if (file.buffer && Buffer.isBuffer(file.buffer)) {
    fs.writeFileSync(fullPath, file.buffer);
  } else if (file.path || file.tempFilePath) {
    fs.copyFileSync(file.path || file.tempFilePath, fullPath);
  }

  const size = file.size || (fs.existsSync(fullPath) ? fs.statSync(fullPath).size : 0);
  return {
    storageKey,
    name: path.basename(storageKey),
    originalName: file.originalname || file.name || path.basename(storageKey),
    size,
    type: file.mimetype || "application/octet-stream",
    url: `/files/${encodeURIComponent(storageKey)}`,
    uploadedAt: new Date().toISOString(),
  };
};

const getPresignedUrl = async (storageKey, expiresInSeconds = 86400) => {
  return `/files/${encodeURIComponent(storageKey)}`;
};

const fetchProviderFile = async (rawUrl) => {
  const url = new URL(rawUrl);
  const endpoint = new URL(SPACEBITE.ENDPOINT);
  if (url.protocol !== "https:" || url.hostname !== endpoint.hostname) {
    throw new Error("Invalid storage file URL");
  }
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${SPACEBITE.ACCESS_KEY}`,
      "X-API-Key": SPACEBITE.ACCESS_KEY,
    },
  });
  if (!response.ok) {
    throw new Error(`Storage file request failed (${response.status})`);
  }
  return response;
};

module.exports = {
  SPACEBITE,
  isSpaceBiteConfigured,
  localUploadDir,
  sanitizeName,
  humanSize,
  buildStorageKey,
  uploadFile,
  getPresignedUrl,
  fetchProviderFile,
};
