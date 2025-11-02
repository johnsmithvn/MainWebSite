// 📁 backend/api/music/download.js
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { getRootPath } = require("../../utils/config");

router.get("/download", (req, res) => {
  const key = req.query.key;
  const relPath = req.query.file;
  const rootPath = getRootPath(key);

  if (!key || !relPath || !rootPath) {
    return res.status(400).json({ error: "Thiếu key hoặc file" });
  }

  const absPath = path.join(rootPath, relPath);
  if (!fs.existsSync(absPath)) {
    return res.status(404).json({ error: "Không tìm thấy file" });
  }

  const stat = fs.statSync(absPath);
  const fileSize = stat.size;
  const fileName = path.basename(absPath);
  const ext = path.extname(absPath).toLowerCase();

  // Determine MIME type
  let mime = "audio/mpeg";
  if (ext === ".flac") mime = "audio/flac";
  else if (ext === ".wav") mime = "audio/wav";
  else if (ext === ".ogg") mime = "audio/ogg";
  else if (ext === ".m4a") mime = "audio/mp4";
  else if (ext === ".aac") mime = "audio/aac";

  // Set headers for download
  res.setHeader("Content-Type", mime);
  res.setHeader("Content-Length", fileSize);
  res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
  res.setHeader("Cache-Control", "no-cache");

  // Stream file to response
  const stream = fs.createReadStream(absPath);
  stream.on("error", (err) => {
    console.error("Download error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Lỗi khi download file" });
    }
  });

  stream.pipe(res);
});

module.exports = router;
