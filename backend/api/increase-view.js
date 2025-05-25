const express = require("express");
const router = express.Router();
// ✅ Dynamic DB theo rootKey
const { getDB } = require("../utils/db");
// ✅ Lấy path thật của rootKey từ .env
const { getRootPath } = require("../utils/config");
const { getMovieDB } = require("../utils/db");

/**
 * 📈 Ghi lượt xem cho folder (POST)
 * Body: { path: "1/Naruto", dbkey: "..." }
 */
router.post("/increase-view", (req, res) => {
  let { path, dbkey, rootKey } = req.body;
  // --- Validate đầu vào ---
  if (!path || typeof path !== "string" || !dbkey) {
    return res.status(400).json({ error: "Missing valid 'root' or 'path'" });
  }
  const rootPath = getRootPath(dbkey);

  if (!rootPath) {
    return res.status(400).json({ error: "Invalid dbkey key" });
  }
  // ✅ Normalize nếu là folder giả
  if (path.endsWith("/__self__")) {
    path = path.replace(/\/__self__$/, "");
  }
  if (!path || typeof path !== "string") {
    return res.status(400).json({ error: "Missing valid 'path'" });
  }
  try {
    const db = getDB(dbkey);
    increaseView(db, rootKey, path);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Lỗi tăng lượt xem:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * 📈 Tăng lượt xem cho folder (theo path, VD: "1/Naruto")
 * Nếu chưa có trong bảng `views` ➜ thêm mới
 * Nếu đã có ➜ tăng count lên 1

 * @param {Database} db - instance SQLite
 * @param {string} root - key thư mục gốc (VD: "1")
 * @param {string} folderPath - đường dẫn folder bên trong root
 */
function increaseView(db, root, folderPath) {
  try {
    const existing = db
      .prepare(`SELECT count FROM views WHERE root = ? AND path = ?`)
      .get(root, folderPath);
    if (!existing) {
      db.prepare(`INSERT INTO views (root, path, count) VALUES (?, ?, 1)`).run(
        root,
        folderPath
      );
    } else {
      db.prepare(
        `UPDATE views SET count = count + 1 WHERE root = ? AND path = ?`
      ).run(root, folderPath);
    }
  } catch (err) {
    console.error("❌ Error tăng lượt xem:", err);
  }
}

// 📈 Ghi lượt xem video (movie)
router.post("/increase-view/movie", (req, res) => {
  const { key, path } = req.body;

  if (!key || !path) {
    return res.status(400).json({ error: "Missing key or path" });
  }

  const db = getMovieDB(key);

  try {
    const row = db.prepare(`SELECT viewCount FROM folders WHERE path = ?`).get(path);
    if (row) {
      db.prepare(`UPDATE folders SET viewCount = viewCount + 1 WHERE path = ?`).run(path);
      return res.json({ ok: true });
    } else {
      return res.status(404).json({ error: "Path not found" });
    }
  } catch (err) {
    console.error("❌ Error tăng view movie:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
module.exports = router;
