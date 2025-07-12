// 📁 backend/api/movie/scan-movie.js
const express = require("express");
const router = express.Router();
const { MovieScanner } = require("../../utils/BaseScanner");

/**
 * POST /api/scan-movie
 * Body: { key: "V_MOVIE" }
 * Scan toàn bộ tree, lưu vào DB movie
 */
router.post("/scan-movie", async (req, res) => {
  const dbkey = req.body.key;
  if (!dbkey) return res.status(400).json({ error: "Thiếu key" });

  try {
    const scanner = new MovieScanner(dbkey);
    const stats = await scanner.scanMovieFolderToDB();
    res.json({
      success: true,
      stats,
      message: "Scan movie thành công!",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

