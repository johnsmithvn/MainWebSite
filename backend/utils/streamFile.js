// 📁 backend/utils/streamFile.js
// 🎞️ Stream file video/audio có hỗ trợ HTTP Range.
//
// Thay cho cách cũ đọc nguyên file vào RAM bằng fs.readFileSync (ISSUES P1): việc đọc vài GB
// trên luồng xử lý request làm treo mọi request khác, và cache LRU được phép chiếm tới 50% RAM
// cho mỗi loại. Hệ điều hành đã tự cache các file đọc gần đây (page cache), nên chỉ cần stream.

const fs = require("fs");
const { pipeline } = require("stream");

/**
 * Phân tích header Range dạng `bytes=start-end`, `bytes=start-` hoặc `bytes=-suffix`.
 * @returns {{start:number,end:number}|null|false} null = không có Range hợp lệ để dùng
 *   (trả toàn bộ file), false = Range không thoả mãn được (416)
 */
function parseRange(header, fileSize) {
  if (typeof header !== "string") return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return null; // nhiều đoạn hoặc sai cú pháp → bỏ qua Range, trả toàn bộ
  const [, startStr, endStr] = match;
  if (!startStr && !endStr) return null;

  let start;
  let end;
  if (!startStr) {
    // bytes=-500 → 500 byte cuối
    const suffix = parseInt(endStr, 10);
    if (suffix === 0) return false;
    start = Math.max(fileSize - suffix, 0);
    end = fileSize - 1;
  } else {
    start = parseInt(startStr, 10);
    end = endStr ? Math.min(parseInt(endStr, 10), fileSize - 1) : fileSize - 1;
  }

  if (start >= fileSize || start > end) return false;
  return { start, end };
}

/**
 * Gửi file (đã kiểm tra đường dẫn) với Content-Length/Content-Range phù hợp.
 * Header Content-Type, Cache-Control… do route đặt trước khi gọi.
 */
function streamFile(req, res, absPath, fileSize) {
  res.setHeader("Accept-Ranges", "bytes");

  const range = parseRange(req.headers.range, fileSize);
  if (range === false) {
    res.setHeader("Content-Range", `bytes */${fileSize}`);
    return res.status(416).send("Range Not Satisfiable");
  }

  let options;
  if (range) {
    res.status(206);
    res.setHeader("Content-Range", `bytes ${range.start}-${range.end}/${fileSize}`);
    res.setHeader("Content-Length", range.end - range.start + 1);
    options = { start: range.start, end: range.end };
  } else {
    res.status(200);
    res.setHeader("Content-Length", fileSize);
  }

  if (req.method === "HEAD") return res.end();

  // pipeline: đóng file khi client ngắt kết nối và không để lỗi đọc file làm crash tiến trình
  pipeline(fs.createReadStream(absPath, options), res, (err) => {
    if (err && err.code !== "ERR_STREAM_PREMATURE_CLOSE") {
      console.warn("⚠️ Lỗi stream file:", absPath, err.message);
    }
  });
}

module.exports = { streamFile, parseRange };
