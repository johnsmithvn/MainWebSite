// 📁 backend/api/favorite.js
const express = require("express");
const router = express.Router();
const { getDB } = require("../../utils/db");

/**
 * ⭐ Toggle trạng thái yêu thích cho folder
 * POST /api/favorite
 * Body: { dbkey, path, value: true/false }
 */
// root (thư mục gốc, tuỳ chọn): có thì chỉ đổi đúng bản ghi của root đó (ISSUES B11). Client cũ
// không gửi root vẫn chạy như trước (đổi mọi bản ghi trùng path).
router.post("/favorite", (req, res) => {
  const { dbkey, path, value, root } = req.body;
  // --- Validate đầu vào ---
  if (!dbkey || !path || typeof value !== "boolean") {
    console.log("❌ Validation failed:", { dbkey, path, value, typeofValue: typeof value });
    return res.status(400).json({ error: "Thiếu hoặc sai dữ liệu" });
  }
  try {
    // Cột favoriteAt được thêm một lần trong getDB (PF12), không kiểm tra lại ở mỗi request
    const db = getDB(dbkey);
    const setSql = `UPDATE folders SET isFavorite = ?, favoriteAt = CASE WHEN ? = 1 THEN CAST(strftime('%s','now') AS INTEGER) ELSE favoriteAt END`;
    const flag = value ? 1 : 0;
    const result =
      typeof root === "string" && root
        ? db.prepare(`${setSql} WHERE root = ? AND path = ?`).run(flag, flag, root, path)
        : db.prepare(`${setSql} WHERE path = ?`).run(flag, flag, path);
    // ✅ Kiểm tra có update không
    if (result.changes === 0) {
      return res.status(404).json({ error: "Folder không tồn tại trong DB" });
    }
    res.json({ success: true, favoriteAt: value ? Math.floor(Date.now()/1000) : null });
  } catch (err) {
    console.error("❌ Lỗi set favorite:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * ⭐ Lấy danh sách folder yêu thích
 * GET /api/favorite?key=FANTASY&root=Naruto
 */
router.get("/favorite", (req, res) => {
  const { key, root } = req.query;
  // --- Validate đầu vào ---
  if (!key || !root) {
    return res.status(400).json({ error: "Thiếu key hoặc root" });
  }
  try {
    // Cột favoriteAt đã được đảm bảo trong getDB (PF12)
    const db = getDB(key);
    const list = db
      .prepare(
        `SELECT name, path, thumbnail, favoriteAt FROM folders WHERE root = ? AND isFavorite = 1`
      )
      .all(root);
    // Map về mảng có trường favoriteDate (ms) để frontend dùng ngay
    const mapped = list.map(item => ({
      ...item,
      favoriteDate: item.favoriteAt ? item.favoriteAt * 1000 : undefined
    }));
    res.json(mapped);
  } catch (err) {
    console.error("❌ Lỗi lấy danh sách yêu thích:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
