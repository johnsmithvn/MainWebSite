// 📁 backend/api/media/media-folders.js
// 📂 Get media folders (navigation like Manga)

const { getMediaDB } = require("../../utils/db");

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

    // Sanitize path để tránh SQL injection trong LIKE pattern
    const sanitizePath = (p) => p.replace(/[%_]/g, '\\$&');
    
    // Get folders in current path
    const pathPrefix = path ? `${sanitizePath(path)}/` : "";
    const pathDepth = path ? path.split("/").length : 0;

    // Get immediate child folders (not recursive)
    const folders = db.prepare(`
      SELECT * FROM folders 
      WHERE root = ? 
        AND path LIKE ? ESCAPE '\\'
        AND LENGTH(path) - LENGTH(REPLACE(path, '/', '')) = ?
      ORDER BY name COLLATE NOCASE ASC
    `).all(key, `${pathPrefix}%`, pathDepth);

    // Get media items in current folder (not subfolders)
    const sanitizedPath = path ? sanitizePath(path) : '';
    const items = db.prepare(`
      SELECT * FROM media_items 
      WHERE path LIKE ? ESCAPE '\\' AND path NOT LIKE ? ESCAPE '\\'
      ORDER BY name COLLATE NOCASE ASC
    `).all(
      sanitizedPath ? `${sanitizedPath}/%` : '%',
      sanitizedPath ? `${sanitizedPath}/%/%` : '%/%'
    );

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
