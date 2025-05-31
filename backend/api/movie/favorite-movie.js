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
    const result = db
      .prepare(`UPDATE folders SET isFavorite = ? WHERE path = ?`)
      .run(value ? 1 : 0, path);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Không tìm thấy path trong DB" });
    }

    res.json({ success: true });
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
    const rows = db.prepare(`
      SELECT name, path, thumbnail, type FROM folders
      WHERE isFavorite = 1
      ORDER BY type DESC, name COLLATE NOCASE ASC
    `).all();
    res.json(rows);
  } catch (err) {
    console.error("❌ Lỗi lấy danh sách favorite movie:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

module.exports = router;
