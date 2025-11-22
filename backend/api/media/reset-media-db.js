// 📁 backend/api/media/reset-media-db.js
// 🗑️ Reset media database

const { getMediaDB } = require("../../utils/db");

/**
 * POST /api/media/reset-media-db
 * Body: { key: "MEDIA_PHOTOS" }
 */
const resetMediaDb = (req, res) => {
  const dbkey = req.body.key;
  if (!dbkey) return res.status(400).json({ error: "Thiếu key" });

  try {
    const db = getMediaDB(dbkey);

    // Xóa toàn bộ dữ liệu trong các bảng
    db.prepare("DELETE FROM media_items").run();
    db.prepare("DELETE FROM folders").run();
    db.prepare("DELETE FROM albums").run();

    console.log(`🗑️ Đã xóa toàn bộ dữ liệu DB cho ${dbkey}`);

    res.json({
      success: true,
      message: `Database ${dbkey} đã được reset thành công`
    });
  } catch (err) {
    console.error("❌ Reset media DB error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = resetMediaDb;
