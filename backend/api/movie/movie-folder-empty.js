// 📁 backend/api/movie-folder-empty.js
const express = require("express");
const router = express.Router();
const { getMovieDB } = require("../../utils/db");

/**
 * GET /api/movie-folder-empty?key=V_MOVIE
 * Trả về { empty: true/false }
 */
router.get("/movie-folder-empty", (req, res) => {
  const dbkey = req.query.key;
  if (!dbkey) return res.status(400).json({ error: "Thiếu key" });
  try {
    const db = getMovieDB(dbkey);
    const row = db.prepare("SELECT COUNT(*) AS count FROM folders").get();
    res.json({ empty: row.count === 0 });
  } catch (err) {
    console.error("movie-folder-empty", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
