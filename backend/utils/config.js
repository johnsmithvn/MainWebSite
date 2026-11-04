// 📁 backend/utils/config.js

const path = require("path");
const fs = require("fs");
// ❗ Đặt dòng này ở ngay đầu file
const dotenv = require("dotenv");
const envPath = path.join(__dirname, "../.env");
const parsedEnv = dotenv.parse(fs.readFileSync(envPath, "utf-8"));

// ✅ Debug log rõ ràng toàn bộ env đầu vào
const ROOT_PATHS = {};

const SECURITY_KEYS = (parsedEnv.SECURITY || "")
  .split(",")
  .map((s) => s.trim().toUpperCase())
  .filter(Boolean);
const SECURITY_PASSWORD = parsedEnv.SECURITY_PASSWORD || "";

for (const [key, value] of Object.entries(parsedEnv)) {
  // ✅ Lấy cả ROOT_ (manga), V_ (movie), M_ (music), MEDIA_ (media gallery)
  if (
    (key.startsWith("ROOT_") || key.startsWith("V_") || key.startsWith("M_") || key.startsWith("MEDIA_")) &&
    typeof value === "string" &&
    fs.existsSync(value)
  ) {
    ROOT_PATHS[key] = value;
  }
}


/**
 * ✅ Trả về danh sách các key hợp lệ
 */
// function getAllRootKeys() {
//   return Object.keys(ROOT_PATHS);
// }

/**
 * ✅ Trả về path thật từ root key (case-insensitive)
 * @param {string} rootKey
 * @returns {string} absolute path
 */
function getRootPath(rootKey) {
  // Thiếu key hoặc sai kiểu (query dạng mảng) → undefined thay vì TypeError
  if (typeof rootKey !== "string") return undefined;
  // Case-insensitive lookup: tìm key trong ROOT_PATHS
  const upperKey = rootKey.toUpperCase();
  const actualKey = Object.keys(ROOT_PATHS).find(k => k.toUpperCase() === upperKey);
  return actualKey ? ROOT_PATHS[actualKey] : undefined;
}

function getAllMovieKeys() {
  return Object.keys(ROOT_PATHS).filter((key) => key.startsWith("V_"));
}
function getAllMangaKeys() {
  return Object.keys(ROOT_PATHS).filter((key) => key.startsWith("ROOT_"));
}

function getAllMusicKeys() {
  return Object.keys(ROOT_PATHS).filter((key) => key.startsWith("M_"));
}

function getAllMediaKeys() {
  return Object.keys(ROOT_PATHS).filter((key) => key.startsWith("MEDIA_"));
}


module.exports = {
  ROOT_PATHS,

  getRootPath,
  getAllMovieKeys, // 🟢 THÊM HÀM NÀY
  getAllMangaKeys, // 🟢 VÀ HÀM NÀY
  getAllMusicKeys,
  getAllMediaKeys,
  SECURITY_KEYS,
  SECURITY_PASSWORD,
};
