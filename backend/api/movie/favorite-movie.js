// 📁 backend/api/favorite-movie.js
const express = require("express");
const router = express.Router();
const { getMovieDB } = require("../../utils/db");

/**
 * POST /api/favorite-movie
 * Body: { key, path, value }
 * Toggle yêu thích (dùng bảng folders trong movie DB)
 */
router.post("/favorite-movie", (req, res) => {
  const { dbkey, path, value } = req.body;
  if (!dbkey || !path || typeof value !== "boolean") {
    return res.status(400).json({ error: "Thiếu hoặc sai dữ liệu" });
  }

  try {
    const db = getMovieDB(dbkey);
    // Ensure favoriteAt column exists
    try {
      const cols = db.prepare(`PRAGMA table_info(folders)`).all().map(c => c.name);
      if (!cols.includes('favoriteAt')) {
        db.prepare(`ALTER TABLE folders ADD COLUMN favoriteAt INTEGER`).run();
      }
    } catch (e) {
      console.warn('⚠️ Không thể đảm bảo cột favoriteAt (movie):', e.message);
    }
    const result = db
      .prepare(`UPDATE folders SET isFavorite = ?, favoriteAt = CASE WHEN ? = 1 THEN CAST(strftime('%s','now') AS INTEGER) ELSE favoriteAt END WHERE path = ?`)
      .run(value ? 1 : 0, value ? 1 : 0, path);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Không tìm thấy path trong DB" });
    }

    res.json({ success: true, favoriteAt: value ? Math.floor(Date.now()/1000) : null });
  } catch (err) {
    console.error("❌ Lỗi set favorite movie:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

/**
 * GET /api/favorite-movie?key=V_MOVIE
 * Trả về danh sách item yêu thích (folder + video)
 */
router.get("/favorite-movie", (req, res) => {
  const { key } = req.query;
  if (!key) return res.status(400).json({ error: "Thiếu key" });

  try {
    const db = getMovieDB(key);
    // Ensure favoriteAt column exists so select won't fail
    try {
      const cols = db.prepare(`PRAGMA table_info(folders)`).all().map(c => c.name);
      if (!cols.includes('favoriteAt')) {
        db.prepare(`ALTER TABLE folders ADD COLUMN favoriteAt INTEGER`).run();
      }
    } catch (e) {
      console.warn('⚠️ favoriteAt ensure failed (movie):', e.message);
    }
    const rows = db.prepare(`
      SELECT name, path, thumbnail, type, favoriteAt FROM folders
      WHERE isFavorite = 1
      ORDER BY favoriteAt DESC, type DESC, name COLLATE NOCASE ASC
    `).all();
    const mapped = rows.map(r => ({
      ...r,
      favoriteDate: r.favoriteAt ? r.favoriteAt * 1000 : undefined
    }));
    res.json(mapped);
  } catch (err) {
    console.error("❌ Lỗi lấy danh sách favorite movie:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

module.exports = router;
