const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const os = require("os");
const storageService = require("../utils/storageService");
const MedicalRecord = require("../models/MedicalRecord");
const User = require("../models/User");

const tmpDir = fs.existsSync(os.tmpdir()) ? os.tmpdir() : path.join(__dirname, "..", "uploads", "_tmp");
const maxUploadSizeMb = Number(process.env.UPLOAD_MAX_FILE_SIZE_MB || 50);
const maxUploadSizeBytes = Number.isFinite(maxUploadSizeMb) && maxUploadSizeMb > 0
  ? maxUploadSizeMb * 1024 * 1024
  : 50 * 1024 * 1024;
if (!fs.existsSync(tmpDir)) {
  try { fs.mkdirSync(tmpDir, { recursive: true }); } catch (e) {}
}

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, tmpDir);
    },
    filename: function (req, file, cb) {
      const ts = Date.now();
      const rnd = Math.floor(Math.random() * 99999);
      const clean = (file.originalname || file.name || "file").replace(/[^a-zA-Z0-9._-]/g, "_");
      cb(null, `${ts}_${rnd}_${clean}`);
    },
  }),
  limits: { fileSize: maxUploadSizeBytes },
});

const parseUpload = (req, res, next) => {
  const ct = req.headers["content-type"] || "";
  console.log("[PARSE-UPLOAD] Before multer: ct=%s cl=%s", ct, req.headers["content-length"]);
  if (!/multipart\/form-data/i.test(ct)) {
    console.warn("[PARSE-UPLOAD] Content-type is NOT multipart/form-data — multer will find no files.");
  }
  // Accept "files" array or "file" single so legacy clients work too
  upload.fields([
    { name: "files", maxCount: 20 },
    { name: "file", maxCount: 10 },
    { name: "files[]", maxCount: 20 },
    { name: "documents", maxCount: 20 },
  ])(req, res, (error) => {
    // Flatten to req.files array (like array() behavior) so rest of the code is unchanged
    if (!error) {
      const flat = [];
      const obj = req.files || {};
      if (Array.isArray(obj)) {
        req.files = obj;
      } else {
        for (const key of Object.keys(obj)) {
          for (const f of obj[key]) {
            f.fieldname = f.fieldname || key;
            flat.push(f);
          }
        }
        req.files = flat;
      }
      console.log("[PARSE-UPLOAD] After multer: fileCount=%d fileFields=%s",
        (req.files || []).length,
        Object.keys(obj || {}).join(","));
      return next();
    }
    console.error("[PARSE-UPLOAD] Multer error:", error);
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        error: `Each file must be ${maxUploadSizeMb} MB or smaller`,
      });
    }
    return res.status(400).json({ error: error.message || "Invalid upload" });
  });
};

const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ error: "Invalid token" });
    if (!["admin", "doctor"].includes(user.role)) {
      return res.status(403).json({ error: "Permission denied" });
    }
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Unauthorized: " + e.message });
  }
};

router.post(
  "/upload",
  requireAuth,
  parseUpload,
  async (req, res) => {
    console.log("[STORAGE-UPLOAD] hit:", {
      method: req.method,
      path: req.path,
      originalUrl: req.originalUrl,
      user: req.user?._id ? String(req.user._id) : "NO_USER",
      role: req.user?.role,
      patientId: req.body?.patientId,
      recordId: req.body?.recordId,
      patientName: req.body?.patientName,
      filesCount: req.files?.length || 0,
      files: (req.files || []).map((f, idx) => ({
        idx,
        fieldname: f.fieldname,
        originalname: f.originalname,
        encoding: f.encoding,
        mimetype: f.mimetype,
        size: f.size,
        bytesOnDisk: f.path && require("fs").existsSync(f.path) ? require("fs").statSync(f.path).size : 0,
      })),
      bodyKeys: Object.keys(req.body || {}),
      body: req.body,
      contentLength: req.headers["content-length"],
      contentType: req.headers["content-type"],
    });
    try {
      const { patientId, recordId } = req.body;
      if (!patientId) {
        console.log("[STORAGE-UPLOAD] missing patientId");
        return res.status(400).json({ error: "patientId is required" });
      }
      const files = req.files || [];
      if (files.length === 0) {
        console.log("[STORAGE-UPLOAD] FATAL no files received after multer parse - raw body inspection:");
        // Log buffer size via streams if possible
        console.log("[STORAGE-UPLOAD] Headers at upload:", JSON.stringify({
          "content-type": req.headers["content-type"],
          "content-length": req.headers["content-length"],
          "transfer-encoding": req.headers["transfer-encoding"],
          "content-disposition": req.headers["content-disposition"],
        }, null, 2));
        return res.status(400).json({
          error: "No files provided",
          debug: {
            body: req.body,
            contentType: req.headers["content-type"],
            contentLength: req.headers["content-length"],
          },
        });
      }
      const results = [];
      for (const f of files) {
        console.log("[STORAGE-UPLOAD] processing file:", {
          originalname: f.originalname,
          size: f.size,
          mimetype: f.mimetype,
          path: f.path,
        });
        const storageKey = storageService.buildStorageKey(
          patientId,
          recordId || "medical-records",
          f.originalname || f.name || "file",
          req.body?.patientName || "",
        );
        const meta = await storageService.uploadFile({
          file: f,
          storageKey,
        });
        console.log("[STORAGE-UPLOAD] uploaded:", {
          storageKey: meta.storageKey,
          url: meta.url,
        });
        results.push(meta);
        try {
          if (f.path) fs.unlinkSync(f.path);
        } catch (_) {}
      }
      console.log("[STORAGE-UPLOAD] success:", results.length, "file(s)");
      return res.json({
        success: true,
        attachments: results,
      });
    } catch (e) {
      console.error("[STORAGE-UPLOAD] ERROR:", e);
      return res.status(500).json({ error: e.message || "Upload failed" });
    }
  },
);

router.post(
  "/attach-to-record/:recordId",
  requireAuth,
  async (req, res) => {
    try {
      const { attachments } = req.body || {};
      const recordId = req.params.recordId;
      const record = await MedicalRecord.findById(recordId);
      if (!record) return res.status(404).json({ error: "Record not found" });
      const existing = Array.isArray(record.attachments) ? record.attachments : [];
      record.attachments = [...existing, ...(Array.isArray(attachments) ? attachments : [])];
      await record.save();
      return res.json({ success: true, record });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  },
);

router.get("/record-attachments/:recordId", requireAuth, async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.recordId);
    if (!record) return res.status(404).json({ error: "Record not found" });
    if (req.user.role === "patient") {
      const Patient = require("../models/Patient");
      const patient = await Patient.findOne({ userId: req.user._id });
      if (!patient || String(patient._id) !== String(record.patientId)) {
        return res.status(403).json({ error: "Permission denied" });
      }
    }
    const list = Array.isArray(record.attachments) ? record.attachments : [];
    const withUrls = [];
    for (const att of list) {
      const item = (att && att.toObject ? att.toObject() : { ...(att || {}) });
      item.url = att.url || await storageService.getPresignedUrl(att.storageKey);
      withUrls.push(item);
    }
    return res.json({ attachments: withUrls });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;
