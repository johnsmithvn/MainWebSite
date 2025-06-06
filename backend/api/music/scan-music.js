// 📁 backend/api/music/scan-music.js
const express = require("express");
const router = express.Router();
const { scanMusicFolderToDB } = require("../../utils/music-scan");

router.post("/scan-music", async (req, res) => {
  const dbkey = req.body.key;
  if (!dbkey) return res.status(400).json({ error: "Thiếu key" });

  try {
    const stats = await scanMusicFolderToDB(dbkey);
    res.json({
      success: true,
      stats,
      message: "🎶 Scan music hoàn tất!",
    });
  } catch (err) {
    console.error("❌ Lỗi scan music:", err);
    res.status(500).json({ error: "Lỗi server khi scan music" });
  }
});

module.exports = router;
