// 📁 backend/api/media/media-stats.js
// 📊 Get media statistics (timeline, types, etc.)

const { getMediaDB } = require("../../utils/db");

/**
 * GET /api/media/stats?key=MEDIA_PHOTOS
 * Returns statistics about the media library
 */
const mediaStats = (req, res) => {
  const { key } = req.query;
  
  if (!key) return res.status(400).json({ error: "Thiếu key" });

  try {
    const db = getMediaDB(key);

    // Total counts by type
    const typeCounts = db.prepare(`
      SELECT type, COUNT(*) as count FROM media_items GROUP BY type
    `).all();

    // Favorites count
    const favoritesCount = db.prepare(`
      SELECT COUNT(*) as count FROM media_items WHERE isFavorite = 1
    `).get().count;

    // Timeline by year-month
    const timeline = db.prepare(`
      SELECT 
        strftime('%Y-%m', datetime(date_taken/1000, 'unixepoch')) as yearMonth,
        COUNT(*) as count
      FROM media_items 
      GROUP BY yearMonth
      ORDER BY yearMonth DESC
    `).all();

    // Recent items
    const recentItems = db.prepare(`
      SELECT * FROM media_items 
      ORDER BY date_taken DESC 
      LIMIT 20
    `).all();

    res.json({
      success: true,
      stats: {
        typeCounts,
        favoritesCount,
        timeline,
        recentItems
      }
    });
  } catch (err) {
    console.error("❌ Media stats error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = mediaStats;
