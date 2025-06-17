// 📁 backend/api/music/audio.js
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const os = require("os");
const { getRootPath } = require("../../utils/config");
const { LRUCache } = require("lru-cache");

const totalRAM = os.totalmem();
const usableRAM = totalRAM * 0.5;
const maxAudioCount = 30;
const MAX_AUDIO_SIZE = usableRAM / maxAudioCount;

const audioCache = new LRUCache({
  maxSize: usableRAM,
  sizeCalculation: (val) => val?.length || 0,
  ttl: 1000 * 60 * 60,
});

router.get("/audio", (req, res) => {
  const key = req.query.key;
  const relPath = req.query.file;
  const rootPath = getRootPath(key);

  if (!key || !relPath || !rootPath) {
    return res.status(400).json({ error: "Thiếu key hoặc file" });
  }

  try {
    const absPath = path.join(rootPath, relPath);
    if (!fs.existsSync(absPath)) {
      return res.status(404).json({ error: "Không tìm thấy file audio" });
    }

    const stat = fs.statSync(absPath);
    const fileSize = stat.size;
    const range = req.headers.range;
    const ext = path.extname(absPath).toLowerCase();

  let mime = "audio/mpeg";
  if (ext === ".flac") mime = "audio/flac";
  else if (ext === ".wav") mime = "audio/wav";
  else if (ext === ".ogg") mime = "audio/ogg";

  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Content-Type", mime);

  let buffer = null;
  const useRAM = fileSize <= MAX_AUDIO_SIZE && fileSize < 512 * 1024 * 1024;

  if (useRAM) {
    buffer = audioCache.get(absPath);
    if (!buffer) {
      try {
        buffer = fs.readFileSync(absPath);
        if (buffer) {
          audioCache.set(absPath, buffer);
        }
      } catch (err) {
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

    res.status(200).setHeader("Content-Length", fileSize);
    if (buffer) {
      return res.end(buffer);
    } else {
      return fs.createReadStream(absPath).pipe(res);
    }
  } catch (err) {
    console.error("audio", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
