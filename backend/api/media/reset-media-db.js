// 📁 backend/api/media/reset-media-db.js
// 🗑️ Reset media database

const path = require("path");
const fs = require("fs");

/**
 * POST /api/media/reset-media-db
 * Body: { key: "MEDIA_PHOTOS" }
 */
const resetMediaDb = (req, res) => {
  const dbkey = req.body.key;
  if (!dbkey) return res.status(400).json({ error: "Thiếu key" });

  try {
    const safeName = dbkey.replace(/[^a-zA-Z0-9_-]/g, "_");
    const DB_DIR = path.join(__dirname, "../../data");
    const dbPath = path.join(DB_DIR, `${safeName}.db`);

    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
      res.json({
        success: true,
        message: `Database ${dbkey} đã được reset`
      });
    } else {
      res.json({
        success: true,
        message: `Database ${dbkey} không tồn tại`
      });
    }
  } catch (err) {
    console.error("❌ Reset media DB error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = resetMediaDb;
