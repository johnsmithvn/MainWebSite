// 📁 backend/api/media/favorite-media.js
// ⭐ Toggle favorite status

const { getMediaDB } = require("../../utils/db");

/**
 * POST /api/media/favorite-media
 * Body: { key: "MEDIA_PHOTOS", id: 123, isFavorite: true }
 */
const favoriteMedia = (req, res) => {
  const { key, id, isFavorite } = req.body;

  if (!key || !id) {
    return res.status(400).json({ error: "Thiếu key hoặc id" });
  }

  try {
    const db = getMediaDB(key);
    
    db.prepare(
      `UPDATE media_items SET isFavorite = ?, updatedAt = ? WHERE id = ?`
    ).run(isFavorite ? 1 : 0, Date.now(), id);

    const item = db.prepare(`SELECT * FROM media_items WHERE id = ?`).get(id);

    res.json({
      success: true,
      message: "Favorite status updated",
      item
    });
  } catch (err) {
    console.error("❌ Favorite media error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = favoriteMedia;
