// 📁 backend/api/movie/video.js

const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { getRootPath } = require("../../utils/config");
const { resolveInsideRoot } = require("../../utils/pathSafety");
const { streamFile } = require("../../utils/streamFile");

router.get("/video", (req, res) => {
  const key = req.query.key;
  const relPath = req.query.file;
  const rootPath = getRootPath(key);

  if (!key || !relPath || !rootPath) {
    return res.status(400).json({ error: "Thiếu key hoặc file" });
  }

  const absPath = resolveInsideRoot(rootPath, relPath);
  if (!absPath) {
    return res.status(403).json({ error: "Đường dẫn không hợp lệ" });
  }
  if (!fs.existsSync(absPath)) {
    return res.status(404).json({ error: "Không tìm thấy video" });
  }

  const stat = fs.statSync(absPath);
  const fileSize = stat.size;
  const ext = path.extname(absPath).toLowerCase();

  // MIME
  let mime = "video/mp4";
  if (ext === ".mkv") mime = "video/x-matroska";
  else if (ext === ".webm") mime = "video/webm";
  else if (ext === ".avi") mime = "video/x-msvideo";
  else if (ext === ".ts") mime = "video/mp2t"; // Chuẩn MIME của .ts
else if (ext === ".wmv") mime = "video/x-ms-wmv";

  // Header stream chuẩn
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Last-Modified", stat.mtime.toUTCString());
  res.setHeader("Content-Type", mime);
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Stream trực tiếp từ ổ đĩa, không đọc cả file vào RAM (ISSUES P1)
  return streamFile(req, res, absPath, fileSize);
});

module.exports = router;
