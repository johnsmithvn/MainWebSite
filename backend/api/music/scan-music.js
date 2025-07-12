// 📁 backend/api/music/scan-music.js
const express = require("express");
const router = express.Router();
const { MusicScanner } = require("../../utils/BaseScanner");

router.post("/scan-music", async (req, res) => {
  const dbkey = req.body.key;
  if (!dbkey) return res.status(400).json({ error: "Thiếu key" });

  try {
    const scanner = new MusicScanner(dbkey);
    const stats = await scanner.scanMusicFolderToDB();
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
