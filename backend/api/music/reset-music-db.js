// 📁 backend/api/reset-music-db.js
const express = require("express");
const router = express.Router();
const { getMusicDB } = require("../../utils/db");
const { scanMusicFolderToDB } = require("../../utils/music-scan");

router.delete("/reset-cache-music", (req, res) => {
  const key = req.query.key || req.body.key;
  const mode = req.query.mode;

  // --- Validate đầu vào ---
  if (!mode) {
    return res.status(400).json({ error: "Thiếu root hoặc mode" });
  }

  try {
    const db = getMusicDB(key);

    if (mode === "delete") {
      db.prepare("DELETE FROM folders").run();
      db.prepare("DELETE FROM songs").run();
      db.prepare("DELETE FROM playlists").run();
      db.prepare("DELETE FROM playlist_items").run();
      console.log(`🗑️ Đã xoá cache DB cho ${key}`);
      return res.json({ success: true, message: "Đã xoá cache thành công" });
    }
    if (mode === "reset") {
      db.prepare("DELETE FROM folders").run();
      db.prepare("DELETE FROM songs").run();
      db.prepare("DELETE FROM playlists").run();
      db.prepare("DELETE FROM playlist_items").run();
      const stats = scanMusicFolderToDB(key);
      console.log(`🔁 Reset cache cho ${key}:`, stats);
      return res.json({
        success: true,
        stats,
        message: "Reset cache thành công",
      });
    }
    // Nếu mode không hợp lệ
    return res
      .status(400)
      .json({ error: "Sai mode (chỉ hỗ trợ delete, reset)" });
  } catch (err) {
    console.error("❌ Lỗi reset-cache:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

module.exports = router;
