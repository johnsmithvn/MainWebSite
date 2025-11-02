// 📁 backend/utils/imageUtils.js

const fs = require("fs");
const path = require("path");
const { FILE_EXTENSIONS } = require("../constants");

// Các định dạng file ảnh hợp lệ (bao gồm cả PDF để scan vào DB)
const IMAGE_EXTENSIONS = [...FILE_EXTENSIONS.IMAGE, ...FILE_EXTENSIONS.PDF];

/**
 * 📂 Đệ quy tìm ảnh đầu tiên trong folder hoặc subfolder
 * @param {string} dirPath - Đường dẫn tuyệt đối cần tìm
 * @param {string} baseUrl - URL gốc để convert (ví dụ "/manga")
 * @param {string} rootPath - Đường dẫn tuyệt đối của env join folder root
 * @returns {string|null} - URL public tới ảnh hoặc null nếu không có
 */
function findFirstImageRecursively(rootFolder, rootPath, dirPath) {
  const baseUrl = `/manga/${rootFolder}`; // Đường dẫn public tới ảnh

  if (!fs.existsSync(dirPath)) return null;

  const naturalCompare = require("string-natural-compare");

  const entries = fs
    .readdirSync(dirPath, { withFileTypes: true })
    .sort((a, b) => naturalCompare(a.name, b.name));

  const files = entries.filter((e) => e.isFile());
  const folders = entries.filter((e) => e.isDirectory());

  for (const file of files) {
    const ext = path.extname(file.name).toLowerCase();
    if (IMAGE_EXTENSIONS.includes(ext)) {
      const relativePath = path
        .relative(rootPath, path.join(dirPath, file.name))
        .replace(/\\/g, "/");

      const safe = relativePath.split("/").map(encodeURIComponent).join("/");
      return `${baseUrl}/${safe}`;
    }
  }
  for (const folder of folders) {
    const found = findFirstImageRecursively(
      rootFolder,
      rootPath,
      path.join(dirPath, folder.name)
    );
    if (found) return found;
  }

  return null;
}

/**
 * 📸 Kiểm tra folder có chứa ít nhất 1 ảnh hợp lệ không
 * @param {string} dirPath - Đường dẫn tuyệt đối
 * @returns {boolean}
 */
function hasImageRecursively(dirPath) {
  if (!fs.existsSync(dirPath)) return false;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (IMAGE_EXTENSIONS.includes(ext)) {
        return true;
      }
    }

    if (entry.isDirectory()) {
      if (hasImageRecursively(fullPath)) return true;
    }
  }

  return false;
}

module.exports = {
  findFirstImageRecursively,
  hasImageRecursively,
};
