// 📁 backend/api/media/scan-media.js
// 🔍 Scan media folders (Images + Videos)

const { scanMediaFolderToDB } = require("../../utils/media-scan");

/**
 * POST /api/media/scan-media
 * Body: { key: "MEDIA_PHOTOS" }
 * Scan toàn bộ tree, lưu vào DB media
 */
const scanMedia = async (req, res) => {
  const dbkey = req.body.key;
  if (!dbkey) return res.status(400).json({ error: "Thiếu key" });

  try {
    const stats = await scanMediaFolderToDB(dbkey);
    res.json({
      success: true,
      stats,
      message: "Scan media thành công!",
    });
  } catch (err) {
    console.error("❌ Scan media error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = scanMedia;
