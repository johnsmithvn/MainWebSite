// 📁 backend/api/media/media-folder.js
// 📂 Get media items with filters (timeline, favorites, albums)

const { getMediaDB } = require("../../utils/db");

// 🛡️ Cột được phép ORDER BY (không thể bind tham số cho tên cột → phải whitelist)
const SORT_COLUMNS = ["date_taken", "name", "size", "modified", "createdAt", "type"];

/**
 * GET /api/media/media-folder?key=MEDIA_PHOTOS&page=1&limit=50&sortBy=date_taken&order=DESC&type=image&year=2024&month=11&favorite=true&albumId=1
 * Trả về media items với filters
 */
const getMediaFolder = (req, res) => {
  const dbkey = req.query.key;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const sortBy = SORT_COLUMNS.includes(req.query.sortBy) ? req.query.sortBy : "date_taken";
  const order = String(req.query.order).toUpperCase() === "ASC" ? "ASC" : "DESC";
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

  // Lọc năm/tháng theo KHOẢNG date_taken (ms, giờ UTC như strftime cũ) để dùng được index
  // idx_media_date_taken (PERFORMANCE-CACHE-REPORT PF9). Trước đây strftime(...) = ? trên cột nên
  // phải tính cho từng dòng. Giá trị không hợp lệ vẫn cho kết quả rỗng như trước.
  if (year) {
    const range = dateRange(year, month);
    if (range) {
      whereConditions.push("date_taken >= ? AND date_taken < ?");
      params.push(range[0], range[1]);
    } else {
      whereConditions.push("0 = 1");
    }
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

  // Get timeline data (grouped by date) - ONLY images and videos.
  // Câu này gom nhóm toàn bộ kết quả lọc (không phụ thuộc trang), nên client đã có timeline cho
  // cùng bộ lọc thì gửi timeline=0 để bỏ qua (PF9). Mặc định vẫn trả như cũ.
  let timeline;
  if (req.query.timeline !== "0") {
    const timelineQuery = `
      SELECT
        date(datetime(date_taken/1000, 'unixepoch')) as date,
        COUNT(*) as count
      FROM media_items
      WHERE type IN ('image', 'video')
      ${whereConditions.length > 0 ? `AND ${whereConditions.join(" AND ")}` : ''}
      GROUP BY date(datetime(date_taken/1000, 'unixepoch'))
      ORDER BY date DESC
    `;
    timeline = db.prepare(timelineQuery).all(...params);
  }

  res.json({
    type: "media-folder",
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    },
    ...(timeline ? { timeline } : {})
  });
};

/** ms UTC của ngày 1 tháng `monthIndex` (0–12) năm `y` — setUTCFullYear để năm < 100 không bị cộng 1900 */
function utcMs(y, monthIndex) {
  const d = new Date(0);
  d.setUTCFullYear(y, monthIndex, 1);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * [start, end) theo ms cho năm (và tháng nếu có), hoặc null nếu giá trị không hợp lệ.
 * Khớp với strftime('%Y' / '%Y-%m') cũ: năm 4 chữ số, tháng 1–12 (có hoặc không có số 0 đầu).
 */
function dateRange(year, month) {
  if (typeof year !== "string" || !/^\d{4}$/.test(year)) return null;
  const y = Number(year);
  if (!month) return [utcMs(y, 0), utcMs(y + 1, 0)];
  if (typeof month !== "string" || !/^\d{1,2}$/.test(month)) return null;
  const m = Number(month);
  if (m < 1 || m > 12) return null;
  return [utcMs(y, m - 1), utcMs(y, m)];
}

module.exports = getMediaFolder;
