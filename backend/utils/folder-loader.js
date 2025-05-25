// 📁 backend/utils/folder-loader.js
const fs = require("fs");
const path = require("path");
const { getRootPath } = require("./config");
const naturalCompare = require("string-natural-compare");
const { findFirstImageRecursively } = require("./imageUtils");

/**
 * 📂 Đọc folder thật từ ổ đĩa
 * Trả về danh sách subfolder và ảnh trong thư mục gốc
 * Dùng cho API mode=path
 *
 * @param {string} root - tên thư mục gốc (VD: "1")
 * @param {string} folderPath - đường dẫn bên trong root (VD: "OnePiece")
 * @param {number} limit - số lượng ảnh cần lấy (0 = all)
 * @param {number} offset - bắt đầu từ ảnh thứ mấy
 * @returns {{ folders: Array, images: Array, total: number, totalImages: number }}
 */
function loadFolderFromDisk(
  dbkey,
  root,
  folderPath = "",
  limit = 0,
  offset = 0
) {
  const rootPath = path.join(getRootPath(dbkey), root); // Lấy đường dẫn root từ config
  const basePath = path.join(rootPath, folderPath);
  // const basePath = path.join(getRootPath(dbkey), folderPath);
  if (!fs.existsSync(basePath)) {
    return { folders: [], images: [], total: 0, totalImages: 0 };
  }

  const entries = fs.readdirSync(basePath, { withFileTypes: true });
  entries.sort((a, b) => naturalCompare(a.name, b.name));

  const folders = [];
  const images = [];

  for (const entry of entries) {
    const fullPath = path.join(basePath, entry.name);

    if (entry.isDirectory()) {
      const thumb = findFirstImageRecursively(root, rootPath, fullPath); // ✅ Dùng đúng biến đã có
      if (!thumb) continue; // 🔥 Bỏ qua folder không có ảnh

      folders.push({
        name: entry.name,
        path: path.posix.join(folderPath, entry.name),
        thumbnail: thumb || null,
      });
    }

    if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if ([".jpg", ".jpeg", ".png", ".webp", ".avif"].includes(ext)) {
        const rel = path.relative(rootPath, fullPath).replace(/\\/g, "/");
        const safePath = rel.split("/").map(encodeURIComponent).join("/");

        images.push(`/manga/${root}/${safePath}`);
      }
    }
  }

  return {
    folders,
    images: limit > 0 ? images.slice(offset, offset + limit) : images,
    total: folders.length,
    totalImages: images.length,
  };
}

/**
 * 📂 Đọc folder cho MOVIE (trả về cả folder và file video)
 * @param {string} dbkey
 * @param {string} root
 * @param {string} folderPath
 * @param {number} limit
 * @param {number} offset
 * @returns {{ folders: Array, images: Array, total: number, totalImages: number }}
 */
function loadMovieFolderFromDisk(
  dbkey,
  _root, // <- truyền từ ngoài vào nhưng bỏ qua, chỉ để không lỗi call signature cũ
  folderPath = "",
  limit = 0,
  offset = 0
) {
  // 🔥 CHỈ dùng dbkey để lấy rootPath thật
  const rootPath = getRootPath(dbkey);
  const basePath = path.join(rootPath, folderPath);
  if (!fs.existsSync(basePath)) {
    return { folders: [], images: [], total: 0, totalImages: 0 };
  }

  const entries = fs.readdirSync(basePath, { withFileTypes: true });
  entries.sort((a, b) => naturalCompare(a.name, b.name));

  const folders = [];
  // KHÔNG lấy images nữa, chỉ trả folder & file video
  for (const entry of entries) {
    if (entry.isDirectory()) {
      folders.push({
        name: entry.name,
        path: path.posix.join(folderPath, entry.name),
        type: "folder",
        thumbnail: null,
      });
    }

    if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if ([".mp4", ".mkv", ".avi", ".webm"].includes(ext)) {
        folders.push({
          name: entry.name,
          path: path.posix.join(folderPath, entry.name),
          type: "video",
          ext: ext,
          thumbnail: null,
        });
      }
    }
  }

  return {
    folders,
    images: [],
    total: folders.length,
    totalImages: 0,
  };
}

module.exports = {
  loadFolderFromDisk,
  loadMovieFolderFromDisk, // export thêm hàm mới
};
