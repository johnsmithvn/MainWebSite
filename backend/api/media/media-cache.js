// 📁 backend/api/media/media-cache.js
// 🖼️ Serve cached thumbnails

const path = require("path");
const fs = require("fs");
const { getRootPath } = require("../../utils/config");

/**
 * GET /api/media/cache/:filename?key=MEDIA_PHOTOS
 * Serve thumbnail from .thumbnail folder
 */
const mediaCache = (req, res) => {
  const dbkey = req.query.key;
  const filename = req.params.filename;

  if (!dbkey || !filename) {
    return res.status(400).json({ error: "Thiếu key hoặc filename" });
  }

  try {
    const rootPath = getRootPath(dbkey);
    const thumbPath = path.join(rootPath, ".thumbnail", filename);

    if (fs.existsSync(thumbPath)) {
      res.sendFile(thumbPath);
    } else {
      res.status(404).json({ error: "Thumbnail không tồn tại" });
    }
  } catch (err) {
    console.error("❌ Media cache error:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = mediaCache;
