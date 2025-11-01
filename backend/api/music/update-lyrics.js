const express = require("express");
const router = express.Router();
const { getMusicDB } = require("../../utils/db");
const { sendSuccess, sendError } = require("../../utils/responseHelpers");

/**
 * POST /api/music/update-lyrics
 * Cập nhật lời bài hát cho một track cụ thể
 * Body: { key: string, path: string, lyrics: string }
 */
router.post("/update-lyrics", (req, res) => {
  try {
    const { key, path, lyrics } = req.body;

    // Validate input
    if (!key || !path) {
      return sendError(res, "Thiếu key hoặc path", 400);
    }

    // Get database connection
    const db = getMusicDB(key);
    if (!db) {
      return sendError(res, "Không tìm thấy database", 404);
    }

    // Check if song exists
    const existingSong = db.prepare(`SELECT path FROM songs WHERE path = ?`).get(path);
    
    if (!existingSong) {
      return sendError(res, "Không tìm thấy bài hát", 404);
    }

    // Update lyrics
    const updateStmt = db.prepare(`
      UPDATE songs 
      SET lyrics = ? 
      WHERE path = ?
    `);
    
    const result = updateStmt.run(lyrics || null, path);

    if (result.changes === 0) {
      return sendError(res, "Không thể cập nhật lời bài hát", 500);
    }

    sendSuccess(res, {
      path,
      lyrics
    }, "Đã cập nhật lời bài hát thành công");
  } catch (error) {
    console.error("Error updating lyrics:", error);
    sendError(res, "Lỗi khi cập nhật lời bài hát", 500);
  }
});

module.exports = router;
