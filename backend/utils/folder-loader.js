// 📁 backend/utils/folder-loader.js
const fs = require("fs");
const path = require("path");
const { getRootPath } = require("./config");
const { resolveInsideRoot } = require("./pathSafety");
const naturalCompare = require("string-natural-compare");
const { findFirstImageRecursivelyAsync } = require("./imageUtils");
const { pathExists } = require("./scanHelpers");

// Số thư mục con tìm ảnh bìa song song khi đọc từ ổ đĩa (giữ thấp để HDD không phải nhảy đầu đọc quá nhiều)
const DISK_THUMB_CONCURRENCY = 4;

/** map() bất đồng bộ giới hạn số tác vụ chạy cùng lúc, giữ nguyên thứ tự kết quả */
async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}
const { getDB, parentPathSql, parentKey } = require("./db");

/**
 * 📂 Đọc folder thật từ ổ đĩa
 * Trả về danh sách subfolder và ảnh trong thư mục gốc
 * Dùng cho API mode=path
 *
 * @param {string} root - tên thư mục gốc (VD: "1")
 * @param {string} folderPath - đường dẫn bên trong root (VD: "OnePiece")
 * @param {number} limit - số lượng ảnh cần lấy (0 = all)
 * @param {number} offset - bắt đầu từ ảnh thứ mấy
 * @returns {Promise<{ folders: Array, images: Array, total: number, totalImages: number }>}
 *
 * ⚡ Async (PERFORMANCE-CACHE-REPORT PF10): trước đây readdirSync + tìm ảnh bìa đệ quy đồng bộ cho
 * TỪNG thư mục con, chặn mọi request khác suốt lúc đọc. Kết quả giữ nguyên như bản đồng bộ.
 */
async function loadFolderFromDisk(
  dbkey,
  root,
  folderPath = "",
  limit = 0,
  offset = 0
) {
  const rootPath = resolveInsideRoot(getRootPath(dbkey), root); // Lấy đường dẫn root từ config
  const basePath = rootPath && resolveInsideRoot(rootPath, folderPath);
  // const basePath = path.join(getRootPath(dbkey), folderPath);
  if (!basePath || !(await pathExists(basePath))) {
    return { folders: [], images: [], total: 0, totalImages: 0 };
  }

  let entries = [];
  try {
    entries = await fs.promises.readdir(basePath, { withFileTypes: true });
    entries.sort((a, b) => naturalCompare(a.name, b.name));
  } catch (err) {
    console.warn(`❌ Không thể đọc thư mục: ${basePath}`, err.message);
    return { folders: [], images: [], total: 0, totalImages: 0 };
  }

  const folders = [];
  const images = [];
  // Số ảnh / thư mục con lấy từ DB (đã đếm lúc quét), không đọc thêm ổ đĩa. Chưa quét thì không có.
  const counts = loadFolderCountsFromDB(dbkey, root, folderPath);

  // Tìm ảnh bìa cho các thư mục con (song song có giới hạn), rồi ghép theo đúng thứ tự entries
  const thumbs = await mapLimit(entries, DISK_THUMB_CONCURRENCY, async (entry) => {
    if (!entry.isDirectory()) return null;
    const fullPath = path.join(basePath, entry.name);
    try {
      return await findFirstImageRecursivelyAsync(root, rootPath, fullPath);
    } catch (err) {
      console.warn(`❌ Không thể tìm ảnh trong folder: ${fullPath}`, err.message);
      return null;
    }
  });

  for (const [index, entry] of entries.entries()) {
    const fullPath = path.join(basePath, entry.name);

    if (entry.isDirectory()) {
      const thumb = thumbs[index];
      if (!thumb) continue;

      const relPath = path.posix.join(folderPath, entry.name);
      const c = counts.get(relPath);
      folders.push({
        name: entry.name,
        path: relPath,
        thumbnail: thumb || null,
        ...(c ? { imageCount: c.imageCount || 0, chapterCount: c.chapterCount || 0 } : {}),
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
 * 🔢 Số ảnh / thư mục con của các thư mục con trực tiếp, lấy từ DB (một câu truy vấn).
 * Dùng cho chế độ đọc ổ đĩa; lỗi hoặc chưa quét thì trả Map rỗng.
 * @returns {Map<string, {imageCount: number, chapterCount: number}>}
 */
function loadFolderCountsFromDB(dbkey, root, folderPath = "") {
  const counts = new Map();
  try {
    const db = getDB(dbkey);
    const baseDepth = folderPath ? folderPath.split("/").filter(Boolean).length : 0;
    // Chỉ lấy con trực tiếp qua index thư mục cha (PF3) — trước đây LIKE đọc mọi bản ghi bên dưới
    const rows = db
      .prepare(
        `SELECT path, imageCount, chapterCount FROM folders WHERE root = ? AND ${parentPathSql()} = ? COLLATE NOCASE`
      )
      .all(root, parentKey(folderPath));
    for (const row of rows) {
      if (row.path.split("/").filter(Boolean).length === baseDepth + 1) {
        counts.set(row.path, { imageCount: row.imageCount, chapterCount: row.chapterCount });
      }
    }
  } catch (err) {
    console.warn("⚠️ Không đọc được số ảnh/chương từ DB:", err.message);
  }
  return counts;
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
  // Con trực tiếp qua index thư mục cha (PF3); bộ lọc độ sâu bên dưới giữ lại để kết quả y như cũ
  const items = db
    .prepare(
      `SELECT name, path, thumbnail, isFavorite, imageCount, chapterCount FROM folders WHERE root = ? AND ${parentPathSql()} = ? COLLATE NOCASE ORDER BY name COLLATE NOCASE ASC`
    )
    .all(root, parentKey(folderPath));

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
      // Số ảnh / thư mục con đã đếm lúc quét (cache-scan): card hiện "186 trang" / "24 chương"
      imageCount: it.imageCount || 0,
      chapterCount: it.chapterCount || 0,
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
