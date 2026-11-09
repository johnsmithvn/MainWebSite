// 📁 backend/api/manga/folder-cache.js
const express = require("express");
const router = express.Router();
// ✅ Dùng DB dynamic theo dbkey
const { getDB } = require("../../utils/db");
const { getRootPath } = require("../../utils/config");
/**
 * 📦 API duy nhất để xử lý các loại folder cache
 * mode = path | random | top | search | folders
 *
 * Query:
 * - root: thư mục gốc
 * - path: đường dẫn folder (cho mode=path)
 * - q: từ khóa (cho mode=search)
 * - limit, offset: phân trang folder hoặc ảnh
 */
router.get("/folder-cache", async (req, res) => {
  // --- Validate đầu vào ---
  const {
    key,
    mode,
    root,
    path: folderPath = "",
    q,
    limit = 0,
    offset = 0,
  } = req.query;
  const dbkey = key;
  if (!dbkey) return res.status(400).json({ error: "Missing dbkey" });
  if (!mode || !root) return res.status(400).json({ error: "Missing mode or root" });
  const rootPath = getRootPath(dbkey);
  if (!rootPath) return res.status(400).json({ error: "Invalid root" });

  try {
    const db = getDB(dbkey);
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);

    // --- Xử lý từng mode ---
    if (mode === "folders") {
      // Lấy tất cả folder
      const rows = db.prepare("SELECT name, path, thumbnail FROM folders WHERE root = ?").all(root);
      return res.json(rows);
    }
    if (mode === "random") {
      // Lấy ngẫu nhiên 30 folder có thumbnail
      const rows = db.prepare(`
        SELECT name, path, thumbnail, isFavorite FROM folders
        WHERE root = ? AND thumbnail IS NOT NULL
        ORDER BY RANDOM() LIMIT 30
      `).all(root);
      // Convert isFavorite to boolean
      const folders = rows.map(row => ({
        ...row,
        isFavorite: !!row.isFavorite
      }));
      return res.json(folders);
    }
    if (mode === "top") {
      // Top view từ bảng views + folders.
      // Lọc v.root (ISSUES B11): views lưu theo (root, path) với root = thư mục gốc (frontend gửi
      // rootKey = rootFolder từ v2.0). Thiếu điều kiện này thì lượt xem của root khác có cùng path
      // bị gộp vào, và câu lệnh phải quét toàn bộ bảng views thay vì dùng khoá chính.
      const rows = db.prepare(`
        SELECT f.name, f.path, f.thumbnail, v.count, f.isFavorite FROM views v
        JOIN folders f ON f.root = v.root AND f.path = v.path
        WHERE v.root = ?
        ORDER BY v.count DESC LIMIT 30
      `).all(root);
      // Convert isFavorite to boolean
      const folders = rows.map(row => ({
        ...row,
        isFavorite: !!row.isFavorite
      }));
      return res.json(folders);
    }
    if (mode === "path") {
      // Tuỳ chọn đọc folder từ DB hay trực tiếp từ ổ đĩa
      const { loadFolderFromDB, loadFolderFromDisk } = require("../../utils/folder-loader");
      const useDb = req.query.useDb === "1" || req.query.useDb === "true";
      const loader = useDb ? loadFolderFromDB : loadFolderFromDisk;
      let realPath = folderPath;
      let isSelf = false;
      if (folderPath.endsWith("/__self__")) {
        realPath = folderPath.replace(/\/__self__$/, "");
        isSelf = true;
      }
      // loadFolderFromDisk là async (PF10), loadFolderFromDB vẫn đồng bộ — await dùng được cho cả hai
      const result = await loader(dbkey, root, realPath, limitNum, offsetNum);
      if (isSelf) result.folders = [];
      const isReader = result.images.length > 0 && result.folders.length === 0;
      return res.json({
        type: isReader ? "reader" : "folder",
        folders: result.folders,
        images: result.images,
        total: result.total,
        totalImages: result.totalImages,
      });
    }
    if (mode === "search") {
      // Tìm kiếm theo tên có phân trang
      if (!q || typeof q !== "string") {
        return res.status(400).json({ error: "Missing query" });
      }

      const lim = limitNum > 0 ? limitNum : 50;
      const off = offsetNum > 0 ? offsetNum : 0;
      const rows = db
        .prepare(
          `SELECT name, path, thumbnail, isFavorite FROM folders
           WHERE root = ? AND (name LIKE ? OR otherName LIKE ?)
           ORDER BY name COLLATE NOCASE ASC LIMIT ? OFFSET ?`
        )
        .all(root, `%${q}%`, `%${q}%`, lim, off);
      // Convert isFavorite to boolean
      const folders = rows.map(row => ({
        ...row,
        isFavorite: !!row.isFavorite
      }));
      return res.json(folders);
    }
    // Nếu mode không hợp lệ
    return res.status(400).json({ error: "Invalid mode" });
  } catch (err) {
    console.error("❌ folder-cache error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- API lấy chapter kế tiếp hoặc trước đó ---
router.get("/next-chapter", (req, res) => {
  const { key, root, path, dir = "next" } = req.query;
  if (!key || !root || !path || !["next", "prev"].includes(dir)) {
    return res.status(400).json({ error: "Thiếu tham số hoặc sai direction" });
  }
  const db = getDB(key);

  const { paths, indexOf } = getSortedChapterPaths(db, key, root);
  const index = indexOf.get(path);
  if (index === undefined) return res.json({ path: null });
  const nextPath = dir === "next" ? paths[index + 1] : paths[index - 1];
  res.json({ path: nextPath || null });
});

// ⚡ Danh sách path đã sort tự nhiên theo (key, root) (PERFORMANCE-CACHE-REPORT PF11).
// Trước đây mỗi lần bấm "chương sau" đều đọc + sort lại toàn bộ path của root.
// Tự hết hạn khi dữ liệu đổi: chữ ký (COUNT, MAX(id)) đổi khi có bản ghi thêm/xoá (id tự tăng,
// không tái sử dụng), mà không chỗ nào trong code đổi `path` của bản ghi có sẵn.
// Câu đếm chạy trên index (root, path) nên rẻ hơn nhiều so với đọc + sort.
const SORTED_PATHS_MAX = 20;
const sortedPathsCache = new Map(); // `${key}::${root}` -> { n, m, paths, indexOf }

function naturalPathCompare(a, b) {
  const naturalCompare = require("string-natural-compare");
  const as = a.split("/");
  const bs = b.split("/");
  for (let i = 0; i < Math.min(as.length, bs.length); i++) {
    const diff = naturalCompare(as[i], bs[i]);
    if (diff !== 0) return diff;
  }
  return as.length - bs.length;
}

function getSortedChapterPaths(db, key, root) {
  const cacheKey = `${key}::${root}`;
  const sig = db
    .prepare(`SELECT COUNT(*) AS n, MAX(id) AS m FROM folders WHERE root = ?`)
    .get(root);
  const hit = sortedPathsCache.get(cacheKey);
  if (hit && hit.db === db && hit.n === sig.n && hit.m === sig.m) return hit;

  // 🔎 Sắp xếp toàn bộ chapter của root theo thứ tự tự nhiên
  const rows = db.prepare(`SELECT path FROM folders WHERE root = ?`).all(root);
  const paths = rows.map((r) => r.path).sort(naturalPathCompare);
  const indexOf = new Map();
  // Giữ vị trí đầu tiên như paths.indexOf() cũ nếu có path trùng
  paths.forEach((p, i) => { if (!indexOf.has(p)) indexOf.set(p, i); });

  const entry = { db, n: sig.n, m: sig.m, paths, indexOf };
  sortedPathsCache.delete(cacheKey);
  sortedPathsCache.set(cacheKey, entry);
  while (sortedPathsCache.size > SORTED_PATHS_MAX) {
    sortedPathsCache.delete(sortedPathsCache.keys().next().value);
  }
  return entry;
}

router._sortedPathsCache = sortedPathsCache; // cho test

module.exports = router;


