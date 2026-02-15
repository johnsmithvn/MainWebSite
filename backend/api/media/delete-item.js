// 📁 backend/api/media/delete-item.js
// 🗑️ Delete media item or folder

const { getMediaDB } = require("../../utils/db");

/**
 * DELETE /api/media/delete-item
 * Body: { key: 'MEDIA_PHOTOS', path: 'folder/subfolder' | 'folder/file.jpg' }
 */
const deleteItem = (req, res) => {
  const { key, path } = req.body;

  if (!key || !path) {
    return res.status(400).json({ error: "Thiếu key hoặc path" });
  }

  try {
    const db = getMediaDB(key);

    // Check if item exists in folders table first
    const folder = db.prepare("SELECT * FROM folders WHERE path = ?").get(path);
    
    if (folder) {
      // Item is a folder - delete folder and all children
      const deleteFolder = db.transaction(() => {
        // Delete all child folders AND the folder itself (path starts with this folder OR equals this path)
        const deletedFolders = db.prepare(
          "DELETE FROM folders WHERE path = ? OR path LIKE ?"
        ).run(path, `${path}/%`);

        // Delete all media items in this folder and subfolders
        const deletedItems = db.prepare(
          "DELETE FROM media_items WHERE path LIKE ?"
        ).run(`${path}/%`);

        // Also remove all these items from albums
        try {
          db.prepare(`
            DELETE FROM album_items 
            WHERE item_id IN (
              SELECT id FROM media_items WHERE path LIKE ?
            )
          `).run(`${path}/%`);
        } catch (error) {
          // Album tables might not exist yet, ignore
          console.warn('Could not delete from album_items:', error.message);
        }

        return { deletedFolders: deletedFolders.changes, deletedItems: deletedItems.changes };
      });

      const result = deleteFolder();

      return res.json({
        success: true,
        message: `Đã xóa folder "${path}" và ${result.deletedFolders - 1} folders con, ${result.deletedItems} media items`,
        type: 'folder',
        deletedFolders: result.deletedFolders,
        deletedItems: result.deletedItems
      });
    }

    // Not a folder, check if it's a media item
    const item = db.prepare("SELECT * FROM media_items WHERE path = ?").get(path);
    
    if (item) {
      // Delete single media item
      const result = db.prepare("DELETE FROM media_items WHERE path = ?").run(path);

      // Also remove from all albums
      try {
        db.prepare("DELETE FROM album_items WHERE item_id = ?").run(item.id);
      } catch (error) {
        // Album tables might not exist yet, ignore
        console.warn('Could not delete from album_items:', error.message);
      }

      return res.json({
        success: true,
        message: `Đã xóa media item "${path}"`,
        type: 'item',
        deletedItems: result.changes
      });
    }

    // Item not found
    return res.status(404).json({
      success: false,
      error: `Không tìm thấy item: ${path}`
    });

  } catch (error) {
    console.error("❌ Error deleting media item:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = deleteItem;
