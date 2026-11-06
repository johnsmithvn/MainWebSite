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
 * ETag mạnh dựa trên kích thước + thời điểm sửa file. Nội dung chỉ đổi khi file đổi, nên dùng
 * được cho If-Range (If-Range bắt buộc validator mạnh).
 */
function fileETag(stat) {
  return `"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`;
}

function etagMatches(header, etag) {
  if (typeof header !== "string") return false;
  return header
    .split(",")
    .map((s) => s.trim().replace(/^W\//, ""))
    .some((t) => t === "*" || t === etag);
}

/** Lấy giây (HTTP date không có phần nghìn giây) */
const toSeconds = (ms) => Math.floor(ms / 1000);

/**
 * Đặt ETag/Last-Modified và trả 304 nếu client đã có bản mới nhất (PERFORMANCE-CACHE-REPORT PF6).
 * @returns {boolean} true nếu đã trả 304 (route không cần làm gì thêm)
 */
function handleConditional(req, res, stat) {
  const etag = fileETag(stat);
  res.setHeader("ETag", etag);
  res.setHeader("Last-Modified", stat.mtime.toUTCString());

  const inm = req.headers["if-none-match"];
  let notModified = false;
  if (inm !== undefined) {
    notModified = etagMatches(inm, etag);
  } else if (req.headers["if-modified-since"]) {
    const since = Date.parse(req.headers["if-modified-since"]);
    notModified = Number.isFinite(since) && toSeconds(stat.mtimeMs) <= toSeconds(since);
  }
  if (notModified) {
    res.status(304).end();
    return true;
  }
  return false;
}

/** If-Range không khớp bản hiện tại → bỏ qua Range, gửi cả file (RFC 9110 §13.1.5) */
function ifRangeAllows(req, stat) {
  const ifRange = req.headers["if-range"];
  if (!ifRange) return true;
  if (ifRange.startsWith('"') || ifRange.startsWith("W/")) return ifRange === fileETag(stat);
  const date = Date.parse(ifRange);
  return Number.isFinite(date) && toSeconds(stat.mtimeMs) === toSeconds(date);
}

/**
 * Gửi file (đã kiểm tra đường dẫn) với Content-Length/Content-Range phù hợp.
 * Header Content-Type, Cache-Control… do route đặt trước khi gọi.
 * @param {number|fs.Stats} statOrSize - truyền fs.Stats để có ETag/Last-Modified, 304 và If-Range
 */
function streamFile(req, res, absPath, statOrSize) {
  const stat = typeof statOrSize === "object" && statOrSize ? statOrSize : null;
  const fileSize = stat ? stat.size : statOrSize;
  res.setHeader("Accept-Ranges", "bytes");

  if (stat && handleConditional(req, res, stat)) return;

  const range =
    stat && !ifRangeAllows(req, stat) ? null : parseRange(req.headers.range, fileSize);
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

module.exports = { streamFile, parseRange, fileETag };
