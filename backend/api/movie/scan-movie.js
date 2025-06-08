// 📁 backend/api/scan-movie.js
const express = require("express");
const router = express.Router();
const { scanMovieFolderToDB } = require("../../utils/movie-scan");

/**
 * POST /api/scan-movie
 * Body: { key: "V_MOVIE" }
 * Scan toàn bộ tree, lưu vào DB movie
 */
router.post("/scan-movie", async (req, res) => {
  const dbkey = req.body.key;
  if (!dbkey) return res.status(400).json({ error: "Thiếu key" });

  try {
    // PHẢI await vì scanMovieFolderToDB là async (trả về Promise)
    const stats = await scanMovieFolderToDB(dbkey);
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

