// 📁 backend/api/music/audio.js
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { getRootPath } = require("../../utils/config");
const { resolveInsideRoot } = require("../../utils/pathSafety");
const { streamFile } = require("../../utils/streamFile");

router.get("/audio", (req, res) => {
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
    return res.status(404).json({ error: "Không tìm thấy file audio" });
  }

  const stat = fs.statSync(absPath);
  const ext = path.extname(absPath).toLowerCase();

  let mime = "audio/mpeg";
  if (ext === ".flac") mime = "audio/flac";
  else if (ext === ".wav") mime = "audio/wav";
  else if (ext === ".ogg") mime = "audio/ogg";

  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Content-Type", mime);
  // Trước đây không có header cache nào → nghe lại/lặp bài là tải lại cả file (PF6)
  res.setHeader("Cache-Control", "private, max-age=3600");

  // Stream trực tiếp từ ổ đĩa, không đọc cả file vào RAM (ISSUES P1)
  return streamFile(req, res, absPath, stat);
});

module.exports = router;
