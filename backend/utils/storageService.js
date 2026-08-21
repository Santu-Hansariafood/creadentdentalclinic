const path = require("path");
const fs = require("fs");

require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
});

const SPACEBYTE = {
  ENDPOINT: (
    process.env.SPACEBYTE_ENDPOINT ||
    "https://spacebyte.in/api/v1"
  ).replace(/\/+$/, ""),

  API_TOKEN:
    process.env.SPACEBYTE_API_TOKEN ||
    process.env.SPACEBYTE_ACCESS_KEY ||
    process.env.SPACEBITE_ACCESS_KEY ||
    "",

  PARENT_ID:
    process.env.SPACEBYTE_PARENT_ID || "",

  UPLOAD_TIMEOUT_MS: Number(
    process.env.SPACEBYTE_UPLOAD_TIMEOUT_MS || 120000
  ),
};

const fsUploadDir = path.join(
  __dirname,
  "..",
  "uploads"
);

if (!fs.existsSync(fsUploadDir)) {
  fs.mkdirSync(fsUploadDir, {
    recursive: true,
  });
}

const isSpaceByteConfigured =
  Boolean(
    SPACEBYTE.ENDPOINT &&
    SPACEBYTE.API_TOKEN
  );

const sanitizeName = (name = "file") =>
  String(name)
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_");

const humanSize = (bytes) => {
  if (!bytes) return "0 B";

  const k = 1024;
  const sizes = [
    "B",
    "KB",
    "MB",
    "GB",
    "TB",
  ];

  const i = Math.floor(
    Math.log(bytes) / Math.log(k)
  );

  return (
    parseFloat(
      (bytes / Math.pow(k, i)).toFixed(2)
    ) +
    " " +
    sizes[i]
  );
};

const buildStorageKey = (
  patientId,
  recordId = "records",
  originalName = "file",
  patientName = "",
  documentNumber = 1
) => {
  const safePatient = sanitizeName(
    String(patientName || "").trim() ||
      patientId ||
      "unknown"
  ).slice(0, 80);

  const safeRecord = sanitizeName(
    recordId || "records"
  );

  const safeName = sanitizeName(
    originalName
  );

  const safeNumber =
    Number.isInteger(documentNumber) &&
    documentNumber > 0
      ? documentNumber
      : 1;

  return `${safePatient}/${safeRecord}/${safePatient}_${safeNumber}_${safeName}`;
};

const getNextDocumentNumber = (
  patientName,
  patientId = "unknown"
) => {
  const safePatient = sanitizeName(
    String(patientName || "").trim() ||
      patientId
  ).slice(0, 80);

  const patientDir = path.join(
    fsUploadDir,
    safePatient
  );

  if (!fs.existsSync(patientDir)) {
    return 1;
  }

  let highest = 0;

  const visit = (dir) => {
    const entries = fs.readdirSync(dir, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      const entryPath = path.join(
        dir,
        entry.name
      );

      if (entry.isDirectory()) {
        visit(entryPath);
        continue;
      }

      const escapedPatient =
        safePatient.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );

      const regex = new RegExp(
        `^${escapedPatient}_(\\d+)_`
      );

      const match =
        entry.name.match(regex);

      if (match) {
        highest = Math.max(
          highest,
          Number(match[1])
        );
      }
    }
  };

  visit(patientDir);

  return highest + 1;
};

const ensureLocalDir = (storageKey) => {
  const fullPath = path.join(
    fsUploadDir,
    path.dirname(storageKey)
  );

  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, {
      recursive: true,
    });
  }
};

const getUploadUrl = () =>
  `${SPACEBYTE.ENDPOINT}/uploads`;

const getAuthHeaders = () => ({
  Accept: "application/json",
  Authorization: `Bearer ${SPACEBYTE.API_TOKEN}`,
});

const readFileBuffer = async (file) => {
  if (
    file?.buffer &&
    Buffer.isBuffer(file.buffer)
  ) {
    return file.buffer;
  }

  const filePath =
    file?.path ||
    file?.tempFilePath;

  if (!filePath) {
    throw new Error(
      "Uploaded file buffer/path is missing"
    );
  }

  return fs.promises.readFile(
    filePath
  );
};

const parseResponse = async (
  response
) => {
  const text =
    await response.text();

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

const uploadToSpaceByte = async (
  file
) => {
  if (!SPACEBYTE.API_TOKEN) {
    throw new Error(
      "SPACEBYTE_API_TOKEN is not configured"
    );
  }

  const bytes =
    await readFileBuffer(file);

  const originalName =
    file.originalname ||
    file.name ||
    "file";

  const mimeType =
    file.mimetype ||
    "application/octet-stream";

  const form = new FormData();

  form.append(
    "file",
    new Blob([bytes], {
      type: mimeType,
    }),
    originalName
  );

  if (SPACEBYTE.PARENT_ID) {
    form.append(
      "parentId",
      String(SPACEBYTE.PARENT_ID)
    );
  }

  const controller =
    new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, SPACEBYTE.UPLOAD_TIMEOUT_MS);

  let response;

  try {
    response = await fetch(
      getUploadUrl(),
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: form,
        signal: controller.signal,
      }
    );
  } catch (error) {
    if (
      error.name === "AbortError"
    ) {
      throw new Error(
        `SpaceByte upload timed out after ${Math.round(
          SPACEBYTE.UPLOAD_TIMEOUT_MS / 1000
        )} seconds`
      );
    }

    throw new Error(
      `SpaceByte upload request failed: ${error.message}`
    );
  } finally {
    clearTimeout(timeout);
  }

  const payload =
    await parseResponse(response);

  if (!response.ok) {
    const detail =
      payload?.message ||
      payload?.error ||
      `HTTP ${response.status}`;

    throw new Error(
      `SpaceByte upload failed (${response.status}): ${detail}`
    );
  }

  if (payload?.success !== true) {
    throw new Error(
      payload?.message ||
        "SpaceByte upload was not successful"
    );
  }

  /*
   * SpaceByte response:
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

  const attachments =
    Array.isArray(
      payload.attachments
    )
      ? payload.attachments
      : [];

  if (!attachments.length) {
    throw new Error(
      "SpaceByte upload succeeded but returned no attachment"
    );
  }

  const uploaded =
    attachments[0];

  const url =
    uploaded.url ||
    uploaded.downloadUrl ||
    uploaded.link ||
    "";

  if (!url) {
    throw new Error(
      "SpaceByte upload succeeded but returned no file URL"
    );
  }

  let fileEntryId = null;

  const match = url.match(
    /\/file-entries\/([^/?#]+)/i
  );

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

const saveLocalFile = async (
  file,
  storageKey
) => {
  ensureLocalDir(storageKey);

  const fullPath = path.join(
    fsUploadDir,
    storageKey
  );

  if (
    file.buffer &&
    Buffer.isBuffer(file.buffer)
  ) {
    await fs.promises.writeFile(
      fullPath,
      file.buffer
    );
  } else {
    const sourcePath =
      file.path ||
      file.tempFilePath;

    if (!sourcePath) {
      throw new Error(
        "Uploaded file data is missing"
      );
    }

    await fs.promises.copyFile(
      sourcePath,
      fullPath
    );
  }

  if (
    !fs.existsSync(fullPath)
  ) {
    throw new Error(
      "Uploaded file was not saved"
    );
  }

  const stat =
    await fs.promises.stat(
      fullPath
    );

  if (!stat.isFile()) {
    throw new Error(
      "Uploaded path is not a file"
    );
  }

  if (
    file.size > 0 &&
    stat.size !== file.size
  ) {
    throw new Error(
      `Uploaded file size mismatch. Expected ${file.size}, got ${stat.size}`
    );
  }

  return {
    storageKey,
    name: path.basename(
      storageKey
    ),
    originalName:
      file.originalname ||
      file.name ||
      path.basename(storageKey),
    size: stat.size,
    type:
      file.mimetype ||
      "application/octet-stream",
    url:
      `/files/${encodeURIComponent(
        storageKey
      )}`,
    fileEntryId: null,
    uploadedAt:
      new Date().toISOString(),
  };
};

const uploadFile = async ({
  file,
  storageKey,
}) => {
  if (!file) {
    throw new Error(
      "File is required"
    );
  }

  /*
   * IMPORTANT:
   * Upload to SpaceByte when configured.
   */
  if (isSpaceByteConfigured) {
    const result =
      await uploadToSpaceByte(
        file
      );

    const uploaded =
      result.uploaded || {};

    return {
      storageKey:
        uploaded.storageKey ||
        storageKey,

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

      size:
        uploaded.size ??
        file.size ??
        0,

      type:
        uploaded.type ||
        file.mimetype ||
        "application/octet-stream",

      url: result.url,

      fileEntryId:
        result.fileEntryId,

      uploadedAt:
        uploaded.uploadedAt ||
        new Date().toISOString(),
    };
  }

  /*
   * Local fallback
   */
  return saveLocalFile(
    file,
    storageKey
  );
};

const getSpaceByteFileUrl = (
  fileEntryId
) => {
  if (!fileEntryId) {
    return null;
  }

  return `${SPACEBYTE.ENDPOINT}/file-entries/${encodeURIComponent(
    String(fileEntryId)
  )}`;
};

const getPresignedUrl = async (
  storageKey,
  expiresInSeconds = 86400,
  fileEntryId = null,
  storedUrl = null
) => {
  /*
   * SpaceByte doesn't use S3 presigned URLs.
   */

  if (storedUrl) {
    return storedUrl;
  }

  if (fileEntryId) {
    return getSpaceByteFileUrl(
      fileEntryId
    );
  }

  /*
   * Local fallback
   */
  return `/files/${encodeURIComponent(
    storageKey
  )}`;
};

const fetchProviderFile = async (
  rawUrl
) => {
  if (!rawUrl) {
    throw new Error(
      "Storage file URL is required"
    );
  }

  const url =
    new URL(rawUrl);

  const endpoint =
    new URL(
      SPACEBYTE.ENDPOINT
    );

  /*
   * Only allow SpaceByte HTTPS URLs.
   */
  if (
    url.protocol !== "https:" ||
    url.hostname !==
      endpoint.hostname
  ) {
    throw new Error(
      "Invalid storage file URL"
    );
  }

  const response =
    await fetch(url, {
      method: "GET",
      headers:
        getAuthHeaders(),
    });

  if (!response.ok) {
    const payload =
      await parseResponse(
        response
      );

    throw new Error(
      `Storage file request failed (${response.status}): ${
        payload?.message ||
        payload?.error ||
        "Unknown error"
      }`
    );
  }

  return response;
};

module.exports = {
  SPACEBYTE,
  isSpaceByteConfigured,
  localUploadDir:
    fsUploadDir,
  sanitizeName,
  humanSize,
  buildStorageKey,
  getNextDocumentNumber,
  uploadFile,
  getPresignedUrl,
  fetchProviderFile,
  getSpaceByteFileUrl,
};