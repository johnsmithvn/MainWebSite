// 📁 backend/utils/config.js

const path = require("path");
const fs = require("fs");
// ❗ Đặt dòng này ở ngay đầu file
const dotenv = require("dotenv");
const envPath = path.join(__dirname, "../.env");
const parsedEnv = dotenv.parse(fs.readFileSync(envPath, "utf-8"));

// ✅ Debug log rõ ràng toàn bộ env đầu vào
const ROOT_PATHS = {};

for (const [key, value] of Object.entries(parsedEnv)) {
  // ✅ Lấy cả ROOT_ (manga), V_ (movie), M_ (music)
  if (
    (key.startsWith("ROOT_") || key.startsWith("V_") || key.startsWith("M_")) &&
    typeof value === "string" &&
    fs.existsSync(value)
  ) {
    ROOT_PATHS[key] = value;
  }
}



/**
 * ✅ Trả về path thật từ root key
 * @param {string} rootKey
 * @returns {string} absolute path
 */
function getRootPath(rootKey) {
  return ROOT_PATHS[rootKey.toUpperCase()];
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


module.exports = {
  ROOT_PATHS,

  getRootPath,
  getAllMovieKeys, // 🟢 THÊM HÀM NÀY
  getAllMangaKeys, // 🟢 VÀ HÀM NÀY
  getAllMusicKeys,
};
