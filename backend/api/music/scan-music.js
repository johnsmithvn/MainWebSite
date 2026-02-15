// 📁 backend/api/music/scan-music.js
const express = require("express");
const router = express.Router();
const { scanMusicFolderToDB } = require("../../utils/music-scan");

router.post("/scan-music", async (req, res) => {
  const dbkey = req.body.key;
  const scanPath = req.body.path || ""; // 🎯 Path to scan
  const shallow = req.body.shallow || false; // 📦 Shallow scan
  
  if (!dbkey) return res.status(400).json({ error: "Thiếu key" });

  try {
    console.log(`🔄 Starting music scan - dbkey: ${dbkey}, path: ${scanPath || '(full scan)'}, shallow: ${shallow}`);
    
    // 🎯 Strategy: 
    // - Always scan from root to ensure parent folders exist in hierarchy
    // - scopePath controls which items to mark/cleanup/process
    // - shallow controls whether to recurse into subfolders
    const stats = await scanMusicFolderToDB(dbkey, "", undefined, scanPath, shallow);
    
    let message = "🎶 Scan music hoàn tất!";
    if (scanPath) message = `🎶 Scan music hoàn tất cho path: ${scanPath}`;
    if (shallow) message += " (shallow)";
    
    res.json({
      success: true,
      stats,
      message,
    });
  } catch (err) {
    console.error("❌ Lỗi scan music:", err);
    res.status(500).json({ error: "Lỗi server khi scan music" });
  }
});

module.exports = router;
