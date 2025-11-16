// 📁 backend/api/media/media-folder.js
// 📂 Get media items with filters (timeline, favorites, albums)

const { getMediaDB } = require("../../utils/db");

/**
 * GET /api/media/media-folder?key=MEDIA_PHOTOS&page=1&limit=50&sortBy=date_taken&order=DESC&type=image&year=2024&month=11&favorite=true&albumId=1
 * Trả về media items với filters
 */
const getMediaFolder = (req, res) => {
  const dbkey = req.query.key;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const sortBy = req.query.sortBy || "date_taken";
  const order = req.query.order || "DESC";
  const type = req.query.type; // 'image' | 'video' | null
  const year = req.query.year;
  const month = req.query.month;
  const favorite = req.query.favorite;
  const albumId = req.query.albumId;

  if (!dbkey) return res.status(400).json({ error: "Thiếu key" });

  const db = getMediaDB(dbkey);
  const offset = (page - 1) * limit;

  // Build WHERE conditions
  let whereConditions = [];
  let params = [];

  if (type) {
    whereConditions.push("type = ?");
    params.push(type);
  }

  if (year) {
    whereConditions.push("strftime('%Y', datetime(date_taken/1000, 'unixepoch')) = ?");
    params.push(year);
  }

  if (month && year) {
    whereConditions.push("strftime('%Y-%m', datetime(date_taken/1000, 'unixepoch')) = ?");
    params.push(`${year}-${month.padStart(2, '0')}`);
  }

  if (albumId) {
    whereConditions.push("albumId = ?");
    params.push(albumId);
  }

  if (favorite !== undefined && favorite !== null) {
    whereConditions.push("isFavorite = ?");
    params.push(favorite === "true" ? 1 : 0);
  }

  const whereClause = whereConditions.length > 0 
    ? `WHERE ${whereConditions.join(" AND ")}`
    : "";

  // Get total count
  const countQuery = `SELECT COUNT(*) as total FROM media_items ${whereClause}`;
  const { total } = db.prepare(countQuery).get(...params);

  // Get items
  const itemsQuery = `
    SELECT * FROM media_items 
    ${whereClause}
    ORDER BY ${sortBy} ${order}
    LIMIT ? OFFSET ?
  `;
  const items = db.prepare(itemsQuery).all(...params, limit, offset);

  // Get timeline data (grouped by date)
  const timelineQuery = `
    SELECT 
      date(datetime(date_taken/1000, 'unixepoch')) as date,
      COUNT(*) as count
    FROM media_items 
    ${whereClause}
    GROUP BY date(datetime(date_taken/1000, 'unixepoch'))
    ORDER BY date DESC
  `;
  const timeline = db.prepare(timelineQuery).all(...params);

  res.json({
    type: "media-folder",
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    },
    timeline
  });
};

module.exports = getMediaFolder;
