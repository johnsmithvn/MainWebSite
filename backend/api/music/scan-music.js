// 📁 backend/api/music/scan-music.js
const express = require("express");
const router = express.Router();
const { MusicScanner } = require("../../utils/BaseScanner");
const { getMusicDB } = require("../../utils/db");
const { SERVER } = require("../../constants");

router.post("/scan-music", async (req, res) => {
  const dbkey = req.body.key;
  if (!dbkey) return res.status(SERVER.HTTP_STATUS.BAD_REQUEST).json({ error: "Thiếu key" });

  try {
    const scanner = new MusicScanner(() => getMusicDB(dbkey));
    const stats = await scanner.scanFolderToDB(dbkey, ""); // Scan từ root
    res.json({
      success: true,
      stats,
      message: "🎶 Scan music hoàn tất!",
    });
  } catch (err) {
    console.error("❌ Lỗi scan music:", err);
    res.status(SERVER.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: "Lỗi server khi scan music" });
  }
});

module.exports = router;
