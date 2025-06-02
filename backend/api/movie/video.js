// 📁 backend/api/movie/video.js

const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const os = require("os");
const { getRootPath } = require("../../utils/config");
const { LRUCache } = require("lru-cache");

// 🧠 Tính toán RAM khả dụng
const totalRAM = os.totalmem(); // byte
const usableRAM = totalRAM * 0.5; // dùng 50%
const maxVideoCount = 5; // tối đa 5 video RAM
const MAX_VIDEO_SIZE = usableRAM / maxVideoCount; // ~3.2GB nếu RAM 32GB

// 🧠 RAM cache video
const videoCache = new LRUCache({
  maxSize: usableRAM,
  sizeCalculation: (val, key) => val?.length || 0, // Tránh lỗi nếu val null
  ttl: 1000 * 60 * 60, // 1 tiếng
});

router.get("/video", (req, res) => {
  const key = req.query.key;
  const relPath = req.query.file;
  const rootPath = getRootPath(key);

  if (!key || !relPath || !rootPath) {
    return res.status(400).json({ error: "Thiếu key hoặc file" });
  }

  const absPath = path.join(rootPath, relPath);
  if (!fs.existsSync(absPath)) {
    return res.status(404).json({ error: "Không tìm thấy video" });
  }

  const stat = fs.statSync(absPath);
  const fileSize = stat.size;
  const range = req.headers.range;
  const ext = path.extname(absPath).toLowerCase();

  // MIME
  let mime = "video/mp4";
  if (ext === ".mkv") mime = "video/x-matroska";
  else if (ext === ".webm") mime = "video/webm";
  else if (ext === ".avi") mime = "video/x-msvideo";

  // Header stream chuẩn
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Last-Modified", stat.mtime.toUTCString());
  res.setHeader("Content-Type", mime);
  res.setHeader("X-Content-Type-Options", "nosniff");

  // 🧠 Nếu đủ nhỏ → cache RAM
  let buffer = null;
  const useRAM = fileSize <= MAX_VIDEO_SIZE && fileSize < 2 * 1024 * 1024 * 1024; // < 2GB

  if (useRAM) {
    buffer = videoCache.get(absPath);
    if (!buffer) {
      try {
        buffer = fs.readFileSync(absPath);
        if (buffer) {
          videoCache.set(absPath, buffer);
        }
      } catch (err) {
        console.warn("⚠️ File quá lớn, không cache RAM:", absPath);
        buffer = null;
      }
    }
  }

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    if (start >= fileSize || end >= fileSize) {
      return res.status(416).send("Range Not Satisfiable");
    }

    res.status(206).setHeader("Content-Range", `bytes ${start}-${end}/${fileSize}`);
    res.setHeader("Content-Length", chunkSize);

    if (buffer) {
      return res.end(buffer.slice(start, end + 1));
    } else {
      return fs.createReadStream(absPath, { start, end }).pipe(res);
    }
  }

  // Nếu không có range: stream toàn bộ
  res.status(200).setHeader("Content-Length", fileSize);
  if (buffer) {
    return res.end(buffer);
  } else {
    return fs.createReadStream(absPath).pipe(res);
  }
});

module.exports = router;
