// 📁 backend/api/media/media-folders.js
// 📂 Get media folders (navigation like Manga)

const { getMediaDB, parentPathSql, parentKey } = require("../../utils/db");

/**
 * GET /api/media/media-folders?key=MEDIA_PHOTOS&path=
 * Get folders and items in current path
 */
const mediaFolders = (req, res) => {
  const { key, path = "" } = req.query;

  if (!key) {
    return res.status(400).json({ error: "Thiếu key" });
  }

  try {
    const db = getMediaDB(key);

    // Con trực tiếp (folder + ảnh/video) của `path` qua index thư mục cha (PF3). Trước đây hai câu
    // LIKE / NOT LIKE quét toàn bộ bảng ở mỗi lần mở thư mục
    const parent = parentKey(path);

    // Get immediate child folders (not recursive)
    const folders = db.prepare(`
      SELECT * FROM folders
      WHERE root = ?
        AND ${parentPathSql()} = ? COLLATE NOCASE
      ORDER BY name COLLATE NOCASE ASC
    `).all(key, parent);

    // Get media items in current folder (not subfolders)
    const items = db.prepare(`
      SELECT * FROM media_items
      WHERE ${parentPathSql()} = ? COLLATE NOCASE
      ORDER BY name COLLATE NOCASE ASC
    `).all(parent);

    res.json({
      success: true,
      currentPath: path,
      folders: folders.map(f => ({
        name: f.name,
        path: f.path,
        thumbnail: f.thumbnail,
        itemCount: f.itemCount
      })),
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        path: item.path,
        thumbnail: item.thumbnail,
        type: item.type,
        width: item.width,
        height: item.height,
        duration: item.duration,
        isFavorite: !!item.isFavorite
      }))
    });
  } catch (err) {
    console.error("❌ Media folders error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = mediaFolders;
