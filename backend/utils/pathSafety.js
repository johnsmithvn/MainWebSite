// 📁 backend/utils/pathSafety.js
// 🛡️ Chặn path traversal: mọi đường dẫn do client gửi phải nằm trong thư mục gốc

const path = require("path");

const IS_WINDOWS = process.platform === "win32";

/**
 * ✅ Ghép các đoạn path (do client gửi) vào rootPath và đảm bảo kết quả vẫn nằm trong rootPath.
 * Ghép giống path.join (dấu "/" đầu bị coi là tương đối) nên client hợp lệ không bị ảnh hưởng.
 *
 * @param {string} rootPath - thư mục gốc lấy từ config (VD: getRootPath(key))
 * @param {...string} segments - các đoạn path tương đối (VD: req.query.file)
 * @returns {string|null} absolute path nếu hợp lệ, null nếu thoát ra ngoài root hoặc input sai kiểu
 */
function resolveInsideRoot(rootPath, ...segments) {
  if (typeof rootPath !== "string" || !rootPath) return null;
  for (const seg of segments) {
    // Query lặp lại (?file=a&file=b) cho ra mảng → từ chối
    if (typeof seg !== "string" || seg.includes("\0")) return null;
  }

  const root = path.resolve(rootPath);
  const target = path.resolve(path.join(root, ...segments));

  // Windows không phân biệt hoa/thường (E:\Music vs e:\music)
  const rootCmp = IS_WINDOWS ? root.toLowerCase() : root;
  const targetCmp = IS_WINDOWS ? target.toLowerCase() : target;
  // Root là gốc ổ đĩa (E:\) thì đã có sẵn dấu phân cách ở cuối
  const prefix = rootCmp.endsWith(path.sep) ? rootCmp : rootCmp + path.sep;

  if (targetCmp === rootCmp || targetCmp.startsWith(prefix)) return target;
  return null;
}

module.exports = { resolveInsideRoot };
