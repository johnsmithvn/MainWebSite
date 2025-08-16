// 📁 backend/api/favorite.js
const express = require("express");
const router = express.Router();
const { getDB } = require("../../utils/db");

/**
 * ⭐ Toggle trạng thái yêu thích cho folder
 * POST /api/favorite
 * Body: { dbkey, path, value: true/false }
 */
router.post("/favorite", (req, res) => {
  console.log("🔍 POST /api/manga/favorite - Request body:", req.body);
  const { dbkey, path, value } = req.body;
  // --- Validate đầu vào ---
  if (!dbkey || !path || typeof value !== "boolean") {
    console.log("❌ Validation failed:", { dbkey, path, value, typeofValue: typeof value });
    return res.status(400).json({ error: "Thiếu hoặc sai dữ liệu" });
  }
  try {
    const db = getDB(dbkey);
    // Đảm bảo có cột favoriteAt
    try {
      const cols = db.prepare(`PRAGMA table_info(folders)`).all().map(c => c.name);
      if (!cols.includes('favoriteAt')) {
        db.prepare(`ALTER TABLE folders ADD COLUMN favoriteAt INTEGER`).run();
      }
    } catch (e) {
      console.warn('⚠️ Không thể đảm bảo cột favoriteAt:', e.message);
    }
    const result = db
      .prepare(`UPDATE folders SET isFavorite = ?, favoriteAt = CASE WHEN ? = 1 THEN CAST(strftime('%s','now') AS INTEGER) ELSE favoriteAt END WHERE path = ?`)
      .run(value ? 1 : 0, value ? 1 : 0, path);
    // ✅ Kiểm tra có update không
    if (result.changes === 0) {
      return res.status(404).json({ error: "Folder không tồn tại trong DB" });
    }
    res.json({ success: true, favoriteAt: value ? Math.floor(Date.now()/1000) : null });
  } catch (err) {
    console.error("❌ Lỗi set favorite:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * ⭐ Lấy danh sách folder yêu thích
 * GET /api/favorite?key=FANTASY&root=Naruto
 */
router.get("/favorite", (req, res) => {
  const { key, root } = req.query;
  // --- Validate đầu vào ---
  if (!key || !root) {
    return res.status(400).json({ error: "Thiếu key hoặc root" });
  }
  try {
    const db = getDB(key);
    // Đảm bảo cột favoriteAt tồn tại để select không lỗi
    try {
      const cols = db.prepare(`PRAGMA table_info(folders)`).all().map(c => c.name);
      if (!cols.includes('favoriteAt')) {
        db.prepare(`ALTER TABLE folders ADD COLUMN favoriteAt INTEGER`).run();
      }
    } catch (e) {
      console.warn('⚠️ favoriteAt ensure failed:', e.message);
    }
    const list = db
      .prepare(
        `SELECT name, path, thumbnail, favoriteAt FROM folders WHERE root = ? AND isFavorite = 1`
      )
      .all(root);
    // Map về mảng có trường favoriteDate (ms) để frontend dùng ngay
    const mapped = list.map(item => ({
      ...item,
      favoriteDate: item.favoriteAt ? item.favoriteAt * 1000 : undefined
    }));
    res.json(mapped);
  } catch (err) {
    console.error("❌ Lỗi lấy danh sách yêu thích:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
