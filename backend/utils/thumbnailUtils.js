// 📁 backend/utils/thumbnailUtils.js
const fs = require("fs");
const path = require("path");

const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".avif"];

/**
 * 🔍 Tìm thumbnail trong folder .thumbnail theo tên base
 * @param {string} thumbnailDir - Đường dẫn folder .thumbnail
 * @param {string} baseName - Tên file không extension
 * @returns {string|null} - Đường dẫn tương đối hoặc null
 */
function findThumbnail(thumbnailDir, baseName) {
  for (const ext of IMAGE_EXTS) {
    const thumbFile = path.join(thumbnailDir, baseName + ext);
    if (fs.existsSync(thumbFile)) {
      return path.posix.join(".thumbnail", baseName + ext);
    }
  }
  return null;
}

/**
 * 🔍 Tìm file thumbnail theo tên base với nhiều extension
 * @param {string} baseDir - Thư mục chứa file
 * @param {string} baseName - Tên file không extension
 * @returns {Object|null} - {file: string, ext: string} hoặc null
 */
function findThumbFile(baseDir, baseName) {
  for (const ext of IMAGE_EXTS) {
    const file = path.join(baseDir, baseName + ext);
    if (fs.existsSync(file)) return { file, ext };
  }
  return null;
}

module.exports = {
  findThumbnail,
  findThumbFile,
  IMAGE_EXTS,
};
