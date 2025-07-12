// 📁 backend/api/manga/scan.js
const express = require("express");
const router = express.Router();
const { BaseScanner } = require("../../utils/BaseScanner");
const { CONTENT_TYPES, SERVER } = require("../../constants");
const { getDB } = require("../../utils/db");

/**
 * 🚀 API: Quét toàn bộ thư mục gốc (không xoá DB)
 * POST /api/scan
 * Body: { root: "1", key: "..." }
 */
router.post("/scan", async (req, res) => {
  const { root, key } = req.body;
  const dbkey = key;
  
  // --- Validate đầu vào ---
  if (!root || !dbkey) return res.status(SERVER.HTTP_STATUS.BAD_REQUEST).json({ error: "Missing root or db" });
  
  try {
    const scanner = new BaseScanner(getDB, CONTENT_TYPES.MANGA);
    const stats = await scanner.scanFolderToDB(dbkey, root);
    console.log(`✅ Scan hoàn tất cho root '${root}':`, stats);
    res.json({ success: true, stats });
  } catch (err) {
    console.error("❌ Lỗi khi scan:", err);
    res.status(SERVER.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: "Scan thất bại" });
  }
});

module.exports = router;
