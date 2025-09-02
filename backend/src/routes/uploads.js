// backend/src/routes/uploads.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const mime = require("mime-types");

const router = express.Router();

// Ensure uploads dir exists
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const ext = mime.extension(file.mimetype) || "bin";
        const base = path.basename(file.originalname, path.extname(file.originalname))
            .replace(/[^a-zA-Z0-9_-]+/g, "_")
            .slice(0, 50) || "file";
        const stamp = Date.now();
        cb(null, `${base}_${stamp}.${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    // Accept common image types
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Unsupported file type"));
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
        files: 10
    }
});

// Auth middleware hook point (reuse your session check if desired)
function requireAuth(req, res, next) {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    next();
}

// POST /uploads  (multipart/form-data, field name: files)
router.post("/", requireAuth, upload.array("files"), async (req, res) => {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const urls = (req.files || []).map(f => ({
        filename: f.filename,
        url: `${baseUrl}/uploads/${encodeURIComponent(f.filename)}`,
        size: f.size,
        mimeType: f.mimetype
    }));
    res.json({ uploaded: urls });
});

module.exports = router;