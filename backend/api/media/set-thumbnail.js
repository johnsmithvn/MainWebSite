// 📁 backend/api/media/set-thumbnail.js
// 🖼️ Set custom thumbnail for media item

const { getMediaDB } = require("../../utils/db");

/**
 * POST /api/media/set-thumbnail
 * Body: { key: "MEDIA_PHOTOS", id: 123, thumbnail: "path/to/thumb.jpg" }
 */
const setThumbnail = (req, res) => {
  const { key, id, thumbnail } = req.body;

  if (!key || !id) {
    return res.status(400).json({ error: "Thiếu key hoặc id" });
  }

  try {
    const db = getMediaDB(key);
    
    db.prepare(
      `UPDATE media_items SET thumbnail = ?, updatedAt = ? WHERE id = ?`
    ).run(thumbnail, Date.now(), id);

    const item = db.prepare(`SELECT * FROM media_items WHERE id = ?`).get(id);

    res.json({
      success: true,
      message: "Thumbnail updated",
      item
    });
  } catch (err) {
    console.error("❌ Set thumbnail error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = setThumbnail;
