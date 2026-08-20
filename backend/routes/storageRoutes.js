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
  upload.array("files")(req, res, (error) => {
    if (!error) return next();
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
    try {
      const { patientId, recordId } = req.body;
      if (!patientId) {
        return res.status(400).json({ error: "patientId is required" });
      }
      const files = req.files || [];
      if (files.length === 0) {
        return res.status(400).json({ error: "No files provided" });
      }
      const results = [];
      for (const f of files) {
        const storageKey = storageService.buildStorageKey(
          patientId,
          recordId || "medical-records",
          f.originalname || f.name || "file",
        );
        const meta = await storageService.uploadFile({
          file: f,
          storageKey,
        });
        results.push(meta);
        try {
          if (f.path) fs.unlinkSync(f.path);
        } catch (_) {}
      }
      return res.json({
        success: true,
        attachments: results,
      });
    } catch (e) {
      console.error("Upload error:", e);
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
