// 📁 backend/api/scan-movie.js
const express = require("express");
const router = express.Router();
const { scanMovieFolderToDB } = require("../../utils/movie-scan");

/**
 * POST /api/scan-movie
 * Body: { key: "V_MOVIE", path?: "Movies/Action", shallow?: true }
 * Scan toàn bộ tree hoặc partial scan theo path
 */
router.post("/scan-movie", async (req, res) => {
  const dbkey = req.body.key;
  const scanPath = req.body.path || null; // 🎯 Optional path for partial scan
  const shallow = req.body.shallow || false; // 📦 Optional shallow scan
  
  if (!dbkey) return res.status(400).json({ error: "Thiếu key" });

  try {
    // 🎯 Always scan from root, but with scopePath filter for partial scan
    const stats = await scanMovieFolderToDB(dbkey, "", undefined, scanPath, shallow);
    
    let message = "Scan movie thành công!";
    if (scanPath) message = `Scan movie thành công (scope: ${scanPath})!`;
    if (shallow) message += " (shallow)";
    
    res.json({
      success: true,
      stats,
      message,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
module.exports = router;

