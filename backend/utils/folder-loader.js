// 📁 backend/utils/folder-loader.js
const fs = require("fs");
const path = require("path");
const { getRootPath } = require("./config");
const { resolveInsideRoot } = require("./pathSafety");
const naturalCompare = require("string-natural-compare");
const { findFirstImageRecursively } = require("./imageUtils");
const { getDB } = require("./db");
const { escapeLike } = require("./sqlLike");

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
  const rootPath = resolveInsideRoot(getRootPath(dbkey), root); // Lấy đường dẫn root từ config
  const basePath = rootPath && resolveInsideRoot(rootPath, folderPath);
  // const basePath = path.join(getRootPath(dbkey), folderPath);
  if (!basePath || !fs.existsSync(basePath)) {
    return { folders: [], images: [], total: 0, totalImages: 0 };
  }

  let entries = [];
  try {
    entries = fs.readdirSync(basePath, { withFileTypes: true });
    entries.sort((a, b) => naturalCompare(a.name, b.name));
  } catch (err) {
    console.warn(`❌ Không thể đọc thư mục: ${basePath}`, err.message);
    return { folders: [], images: [], total: 0, totalImages: 0 };
  }

  const folders = [];
  const images = [];

  for (const entry of entries) {
    const fullPath = path.join(basePath, entry.name);

    if (entry.isDirectory()) {
      let thumb = null;
      try {
        thumb = findFirstImageRecursively(root, rootPath, fullPath);
      } catch (err) {
        console.warn(`❌ Không thể tìm ảnh trong folder: ${fullPath}`, err.message);
      }
      if (!thumb) continue;

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
      // 🆕 Thêm PDF file như một "folder" để hiển thị card
      if (ext === ".pdf") {
        folders.push({
          name: entry.name,
          path: path.posix.join(folderPath, entry.name),
          type: "pdf",
          thumbnail: "/default/default-cover.jpg", // Default PDF thumbnail
        });
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
  const basePath = resolveInsideRoot(rootPath, folderPath);
  if (!basePath || !fs.existsSync(basePath)) {
    return { folders: [], images: [], total: 0, totalImages: 0 };
  }

  let entries = [];
  try {
    entries = fs.readdirSync(basePath, { withFileTypes: true });
    entries.sort((a, b) => naturalCompare(a.name, b.name));
  } catch (err) {
    console.warn(`❌ Không thể đọc thư mục: ${basePath}`, err.message);
    return { folders: [], images: [], total: 0, totalImages: 0 };
  }

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
      if ([".mp4", ".mkv", ".avi", ".webm", ".ts", ".wmv"].includes(ext)) {
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

/**
 * 📂 Đọc folder từ DB (manga) - tránh truy cập ổ đĩa cho danh sách subfolder
 * Chỉ lấy danh sách folder từ DB, còn ảnh vẫn đọc trực tiếp từ ổ đĩa
 * @param {string} dbkey
 * @param {string} root
 * @param {string} folderPath
 * @param {number} limit
 * @param {number} offset
 * @returns {{ folders: Array, images: Array, total: number, totalImages: number }}
 */
function loadFolderFromDB(dbkey, root, folderPath = "", limit = 0, offset = 0) {
  const db = getDB(dbkey);
  const pathFilter = folderPath ? `${escapeLike(folderPath)}/%` : "%";
  const items = db
    .prepare(
      `SELECT name, path, thumbnail, isFavorite FROM folders WHERE root = ? AND path LIKE ? ESCAPE '\\' ORDER BY name COLLATE NOCASE ASC`
    )
    .all(root, pathFilter);

  const baseDepth = folderPath
    ? folderPath.split("/").filter(Boolean).length
    : 0;
  const folders = items
    .filter((it) => it.path.split("/").filter(Boolean).length === baseDepth + 1)
    .map((it) => ({
      name: it.name,
      path: it.path,
      thumbnail: it.thumbnail,
      isFavorite: !!it.isFavorite,
    }));

  // Đọc ảnh trực tiếp từ ổ đĩa cho folder hiện tại
  const rootDir = resolveInsideRoot(getRootPath(dbkey), root);
  const basePath = rootDir && resolveInsideRoot(rootDir, folderPath);
  const images = [];
  if (basePath && fs.existsSync(basePath)) {
    try {
      const entries = fs.readdirSync(basePath, { withFileTypes: true });
      entries.sort((a, b) => naturalCompare(a.name, b.name));
      for (const entry of entries) {
        if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if ([".jpg", ".jpeg", ".png", ".webp", ".avif"].includes(ext)) {
            const rel = path
              .relative(rootDir, path.join(basePath, entry.name))
              .replace(/\\/g, "/");
            const safePath = rel.split("/").map(encodeURIComponent).join("/");
            images.push(`/manga/${root}/${safePath}`);
          }
          // 🆕 Thêm PDF file như một "folder" để hiển thị card
          if (ext === ".pdf") {
            folders.push({
              name: entry.name,
              path: path.posix.join(folderPath, entry.name),
              type: "pdf",
              thumbnail: "/default/default-cover.jpg",
              isFavorite: false,
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${basePath}:`, error.message);
    }
  }

  return {
    folders,
    images: limit > 0 ? images.slice(offset, offset + limit) : images,
    total: folders.length,
    totalImages: images.length,
  };
}

module.exports = {
  loadFolderFromDisk,
  loadMovieFolderFromDisk, // export thêm hàm mới
  loadFolderFromDB,
};
