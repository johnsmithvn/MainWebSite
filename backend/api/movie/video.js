// 📁 backend/api/video.js

const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { getRootPath } = require("../../utils/config");

/**
 * API stream video theo key và file path
 * Ví dụ: /api/video/V_MOVIE/folder1/abc.mp4
 * 
 * - :key = mã nguồn (V_MOVIE, ...)
 * - :filePath = đường dẫn file video trong root (dùng req.params[0] lấy path động)
 */
router.get("/video", (req, res) => {
  const key = req.query.key;
  const relPath = req.query.file;
  // Lấy path gốc từ .env
  const rootPath = getRootPath(key);
  if (!rootPath) {
    return res.status(400).json({ error: "Key không hợp lệ" });
  }

  // Lấy file path động (phần còn lại sau key)
  if (!relPath) {
    return res.status(400).json({ error: "Thiếu file path" });
  }

  // Ghép full path tuyệt đối tới file video
  const absPath = path.join(rootPath, relPath);

  // Kiểm tra file tồn tại không
  if (!fs.existsSync(absPath)) {
    return res.status(404).json({ error: "Không tìm thấy file video" });
  }

  // Lấy thông tin file
  const stat = fs.statSync(absPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  // Xác định mime-type dựa vào ext (tối giản: mp4)
  let mime = "video/mp4";
  if (absPath.endsWith(".mkv")) mime = "video/x-matroska";
  else if (absPath.endsWith(".webm")) mime = "video/webm";
  else if (absPath.endsWith(".avi")) mime = "video/x-msvideo";

  // Nếu có header Range => stream theo đoạn (hỗ trợ tua)
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = (end - start) + 1;
    const file = fs.createReadStream(absPath, { start, end });
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": mime
    });
    file.pipe(res);
  } else {
    // Không có range, stream cả file
    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": mime
    });
    fs.createReadStream(absPath).pipe(res);
  }
});

module.exports = router;
