require("dotenv").config();

const SPACEBITE = {
  ENDPOINT: process.env.SPACEBYTE_S3_ENDPOINT || process.env.SPACEBYTE_ENDPOINT || "",
  ACCESS_KEY: process.env.SPACEBYTE_ACCESS_KEY || process.env.SPACEBITE_ACCESS_KEY || "",
  SECRET_KEY: process.env.SPACEBYTE_SECRET_KEY || process.env.SPACEBITE_SECRET_KEY || "",
  BUCKET: process.env.SPACEBYTE_BUCKET || process.env.SPACEBITE_BUCKET || "Creadent",
  REGION: process.env.SPACEBYTE_REGION || process.env.SPACEBITE_REGION || "auto",
  BASE_URL: process.env.SPACEBYTE_BASE_URL || process.env.SPACEBITE_BASE_URL || "",
};

const AWS = (() => {
  try {
    return require("@aws-sdk/client-s3");
  } catch (e) {
    return null;
  }
})();

const fs = require("fs");
const path = require("path");

const localUploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(localUploadDir)) {
  try { fs.mkdirSync(localUploadDir, { recursive: true }); } catch (e) {}
}

const isSpaceBiteConfigured =
  !!SPACEBITE.ENDPOINT && !!SPACEBITE.ACCESS_KEY && !!SPACEBITE.SECRET_KEY && !!AWS;

let s3Client = null;
if (isSpaceBiteConfigured) {
  try {
    s3Client = new AWS.S3Client({
      endpoint: SPACEBITE.ENDPOINT,
      region: SPACEBITE.REGION,
      credentials: {
        accessKeyId: SPACEBITE.ACCESS_KEY,
        secretAccessKey: SPACEBITE.SECRET_KEY,
      },
      forcePathStyle: true,
    });
  } catch (e) {
    console.warn("Failed to initialize SpaceBite client:", e.message);
    s3Client = null;
  }
}

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

const createPrivateUrl = async (storageKey) => {
  if (s3Client && AWS && AWS.GetObjectCommand) {
    try {
      const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
      const command = new AWS.GetObjectCommand({
        Bucket: SPACEBITE.BUCKET,
        Key: storageKey,
      });
      return await getSignedUrl(s3Client, command, { expiresIn: 86400 });
    } catch (e) {
      console.warn("Failed to create SpaceBite download URL:", e.message);
    }
  }
  return `/files/${encodeURIComponent(storageKey)}`;
};

const uploadFile = async ({ file, storageKey }) => {
  if (isSpaceBiteConfigured && s3Client) {
    let body;
    if (file.buffer && Buffer.isBuffer(file.buffer)) {
      body = file.buffer;
    } else {
      body = fs.createReadStream(file.path || file.tempFilePath);
    }
    const command = new AWS.PutObjectCommand({
      Bucket: SPACEBITE.BUCKET,
      Key: storageKey,
      Body: body,
      ContentType: file.mimetype || "application/octet-stream",
    });
    await s3Client.send(command);
    return {
      storageKey,
      name: path.basename(storageKey),
      originalName: file.originalname || file.name || path.basename(storageKey),
      size: file.size,
      type: file.mimetype || "application/octet-stream",
      url: await createPrivateUrl(storageKey),
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
  if (isSpaceBiteConfigured && s3Client && AWS && AWS.GetObjectCommand) {
    try {
      const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
      const command = new AWS.GetObjectCommand({
        Bucket: SPACEBITE.BUCKET,
        Key: storageKey,
      });
      return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
    } catch (e) {
      return `/files/${encodeURIComponent(storageKey)}`;
    }
  }
  return `/files/${encodeURIComponent(storageKey)}`;
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
};
