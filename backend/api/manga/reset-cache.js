// 📁 backend/api/reset-cache.js
const express = require("express");
const router = express.Router();
const { getRootPath } = require("../../utils/config");
const { resetAndScanRoot } = require("../../utils/cache-scan");
const { resolveInsideRoot } = require("../../utils/pathSafety");
const { getDB } = require("../../utils/db");

/**
 * 🔁 Xử lý theo mode:
 * - mode=delete ➜ Xoá DB
 * - mode=scan   ➜ Scan và thêm vào DB (không xóa)
 * - mode=reset  ➜ Xoá + Scan lại
 * Query: /api/reset-cache?root=1&mode=scan
 */
router.delete("/reset-cache", async (req, res) => {
  const key = req.query.key;
  const rootFolder = req.query.root;
  const mode = req.query.mode;

  // --- Validate đầu vào ---
  if (!rootFolder || !mode) {
    return res.status(400).json({ error: "Thiếu root hoặc mode" });
  }
  const rootPath = getRootPath(key);
  if (!rootPath) {
    return res.status(400).json({ error: "Root không hợp lệ trong .env" });
  }
  if (!resolveInsideRoot(rootPath, rootFolder)) {
    return res.status(403).json({ error: "Đường dẫn không hợp lệ" });
  }

  try {
    const db = getDB(key);
    

    if (mode === "delete") {
      db.prepare("DELETE FROM folders WHERE root = ?").run(rootFolder);
      console.log(`🗑️ Đã xoá cache DB cho ${rootFolder}`);
      return res.json({ success: true, message: "Đã xoá cache thành công" });
    }
    if (mode === "reset") {
      // Xoá + quét lại trong cùng khoá với các lần scan khác của root này (scan giờ là async)
      const stats = await resetAndScanRoot(key, rootFolder);
      console.log(`🔁 Reset cache cho ${key} / ${rootFolder}:`, stats);
      return res.json({
        success: true,
        stats,
        message: "Reset cache thành công",
      });
    }
    // Nếu mode không hợp lệ
    return res.status(400).json({ error: "Sai mode (chỉ hỗ trợ delete, reset)" });
  } catch (err) {
    console.error("❌ Lỗi reset-cache:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

/**
 * 🧨 API xoá toàn bộ DB (dành cho admin hoặc dọn sạch)
 * Xoá tất cả dữ liệu trong bảng folders (mọi root, rootFolder)
 * Endpoint: DELETE /api/reset-cache/all
 */
router.delete("/reset-cache/all", (req, res) => {
  const key = req.query.key;
  try {
    const db = getDB(key);
    db.prepare("DELETE FROM folders").run();
    db.prepare("DELETE FROM views").run();
    console.log(`🗑️ Đã xoá cache DB cho rootKey = ${key}`);
    res.json({ success: true, message: "Đã xoá toàn bộ cache database" });
  } catch (err) {
    console.error("❌ Lỗi xoá toàn bộ DB:", err);
    res.status(500).json({ error: "Không thể xoá toàn bộ DB" });
  }
});

module.exports = router;
