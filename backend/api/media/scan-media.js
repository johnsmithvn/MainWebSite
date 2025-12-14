// 📁 backend/api/media/scan-media.js
// 🔍 Scan media folders (Images + Videos)

const { scanMediaFolderToDB } = require("../../utils/media-scan");

/**
 * POST /api/media/scan-media
 * Body: { key: "MEDIA_PHOTOS", path?: "Photos/2024", shallow?: true }
 * Scan toàn bộ tree hoặc partial scan theo path
 */
const scanMedia = async (req, res) => {
  const dbkey = req.body.key;
  const scanPath = req.body.path || null; // 🎯 Optional path for partial scan
  const shallow = req.body.shallow || false; // 📦 Optional shallow scan
  
  if (!dbkey) return res.status(400).json({ error: "Thiếu key" });

  try {
    // 🎯 Always scan from root, but with scopePath filter for partial scan
    const stats = await scanMediaFolderToDB(dbkey, "", undefined, scanPath, shallow);
    
    let message = "Scan media thành công!";
    if (scanPath) message = `Scan media thành công (scope: ${scanPath})!`;
    if (shallow) message += " (shallow)";
    
    res.json({
      success: true,
      stats,
      message,
    });
  } catch (err) {
    console.error("❌ Scan media error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = scanMedia;
