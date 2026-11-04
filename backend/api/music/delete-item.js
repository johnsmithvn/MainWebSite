// 📁 backend/api/music/delete-item.js
// 🗑️ Delete music item (folder or audio file) from database

const express = require("express");
const router = express.Router();
const { getMusicDB } = require("../../utils/db");
const { escapeLike } = require("../../utils/sqlLike");

/**
 * DELETE /api/music/delete-item
 * Body: { key: 'M_MUSIC', path: 'Albums/Rock' }
 * 
 * Deletes:
 * - Single audio file: removes from folders + songs + playlist_items
 * - Folder: removes folder + all children + related metadata
 */
router.delete("/delete-item", async (req, res) => {
  const { key, path } = req.body;

  if (!key || !path) {
    return res.status(400).json({ error: "Missing key or path" });
  }

  try {
    const db = getMusicDB(key);

    // 1. Check if item exists
    const item = db.prepare("SELECT * FROM folders WHERE path = ?").get(path);

    if (!item) {
      return res.status(404).json({ error: "Item not found in database" });
    }

    const isFolder = item.type === "folder";

    // 2. Delete strategy based on type
    if (isFolder) {
      // ✅ Delete folder + all children
      // Pattern: path = 'Albums/Rock'
      // Matches: 'Albums/Rock', 'Albums/Rock/Metallica', 'Albums/Rock/Metallica/Master.mp3'

      // Delete songs metadata for all children
      db.prepare(
        `
        DELETE FROM songs 
        WHERE path IN (
          SELECT path FROM folders 
          WHERE path = ? OR path LIKE ? ESCAPE '\\'
        )
      `
      ).run(path, `${escapeLike(path)}/%`);

      // Delete playlist references
      db.prepare(
        `
        DELETE FROM playlist_items 
        WHERE songPath IN (
          SELECT path FROM folders 
          WHERE path = ? OR path LIKE ? ESCAPE '\\'
        )
      `
      ).run(path, `${escapeLike(path)}/%`);

      // Delete folders
      const deleteResult = db
        .prepare(
          `
        DELETE FROM folders 
        WHERE path = ? OR path LIKE ? ESCAPE '\\'
      `
        )
        .run(path, `${escapeLike(path)}/%`);

      console.log(
        `🗑️ Deleted folder "${item.name}" and ${deleteResult.changes} total items`
      );

      res.json({
        success: true,
        deleted: deleteResult.changes,
        type: "folder",
        message: `Đã xóa folder "${item.name}" và ${deleteResult.changes - 1} items con`,
      });
    } else {
      // ✅ Delete single audio file

      // Delete song metadata
      db.prepare("DELETE FROM songs WHERE path = ?").run(path);

      // Delete playlist references
      db.prepare("DELETE FROM playlist_items WHERE songPath = ?").run(path);

      // Delete folder entry
      db.prepare("DELETE FROM folders WHERE path = ?").run(path);

      console.log(`🗑️ Deleted audio file "${item.name}"`);

      res.json({
        success: true,
        deleted: 1,
        type: "audio",
        message: `Đã xóa "${item.name}" khỏi database`,
      });
    }
  } catch (err) {
    console.error("❌ Delete item error:", err);
    res.status(500).json({ error: "Lỗi khi xóa item: " + err.message });
  }
});

module.exports = router;
