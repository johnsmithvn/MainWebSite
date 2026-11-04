// 📁 backend/api/manga/delete-item.js
// 🗑️ Delete manga folder from database

const express = require("express");
const router = express.Router();
const { getDB } = require("../../utils/db");
const { escapeLike } = require("../../utils/sqlLike");

/**
 * DELETE /api/manga/delete-item
 * Body: { dbkey: 'ROOT_FANTASY', root: 'Naruto', path: 'folder/subfolder' }
 */
router.delete("/delete-item", (req, res) => {
  const { dbkey, root, path } = req.body;

  if (!dbkey || !root || !path) {
    return res.status(400).json({ error: "Thiếu dbkey, root hoặc path" });
  }

  try {
    const db = getDB(dbkey);

    // Check if item exists
    const folder = db.prepare("SELECT * FROM folders WHERE root = ? AND path = ?").get(root, path);
    
    if (!folder) {
      return res.status(404).json({ 
        success: false,
        error: `Không tìm thấy folder: ${path}` 
      });
    }

    // Delete folder and all children in a transaction
    const deleteFolder = db.transaction(() => {
      // Delete all child folders AND the folder itself
      const deletedFolders = db.prepare(
        "DELETE FROM folders WHERE root = ? AND (path = ? OR path LIKE ? ESCAPE '\\')"
      ).run(root, path, `${escapeLike(path)}/%`);

      // Delete view count for this folder and children
      try {
        db.prepare(
          "DELETE FROM views WHERE root = ? AND (path = ? OR path LIKE ? ESCAPE '\\')"
        ).run(root, path, `${escapeLike(path)}/%`);
      } catch (error) {
        // Views table might not have entries, ignore
        console.warn('Could not delete from views:', error.message);
      }

      return { deletedFolders: deletedFolders.changes };
    });

    const result = deleteFolder();

    return res.json({
      success: true,
      message: `Đã xóa folder "${folder.name}" và ${result.deletedFolders - 1} folders con`,
      type: 'folder',
      deletedFolders: result.deletedFolders
    });

  } catch (error) {
    console.error("❌ Error deleting manga folder:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
