// 📁 backend/api/reset-movie-db.js
const express = require("express");
const router = express.Router();
const { getMovieDB } = require("../../utils/db");
const{scanMovieFolderToDB} = require("../../utils/movie-scan");
// router.delete("/", (req, res) => {
//   const dbkey = req.query.key || req.body.key;
//   if (!dbkey) return res.status(400).json({ error: "Thiếu key" });
//   const db = getMovieDB(dbkey);
//   try {
//     db.prepare("DELETE FROM folders").run();
//     res.json({ ok: true, message: "Đã xoá toàn bộ DB movie!" });
//   } catch (err) {
//     res.status(500).json({ ok: false, error: err.message });
//   }
// });

router.delete("/reset-cache-movie", (req, res) => {
  const key = req.query.key || req.body.key;
  const mode = req.query.mode;

  // --- Validate đầu vào ---
  if (!mode) {
    return res.status(400).json({ error: "Thiếu root hoặc mode" });
  }


  try {
    const db = getMovieDB(key);

    if (mode === "delete") {
      db.prepare("DELETE FROM folders").run();
      console.log(`🗑️ Đã xoá cache DB cho ${key}`);
      return res.json({ success: true, message: "Đã xoá cache thành công" });
    }
    if (mode === "reset") {
      db.prepare("DELETE FROM folders").run();
      const stats = scanMovieFolderToDB(key);
      console.log(`🔁 Reset cache cho ${key}:`, stats);
      return res.json({
        success: true,
        stats,
        message: "Reset cache thành công",
      });
    }
    // Nếu mode không hợp lệ
    return res.status(400).json({ error: "Sai mode (chỉ hỗ trợ delete, reset)" });
  } catch (err) {
    console.error("❌ Lỗi reset-cache:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

module.exports = router;
