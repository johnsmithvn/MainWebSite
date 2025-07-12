// 📁 backend/api/movie/scan-movie.js
const express = require("express");
const router = express.Router();
const { MovieScanner } = require("../../utils/BaseScanner");
const { getMovieDB } = require("../../utils/db");
const { SERVER } = require("../../constants");

/**
 * POST /api/scan-movie
 * Body: { key: "V_MOVIE" }
 * Scan toàn bộ tree, lưu vào DB movie
 */
router.post("/scan-movie", async (req, res) => {
  const dbkey = req.body.key;
  if (!dbkey) return res.status(SERVER.HTTP_STATUS.BAD_REQUEST).json({ error: "Thiếu key" });

  try {
    const scanner = new MovieScanner(() => getMovieDB(dbkey));
    const stats = await scanner.scanFolderToDB(dbkey, ""); // Scan từ root
    res.json({
      success: true,
      stats,
      message: "Scan movie thành công!",
    });
  } catch (err) {
    console.error("❌ Lỗi scan movie:", err);
    res.status(SERVER.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: err.message });
  }
});

module.exports = router;

