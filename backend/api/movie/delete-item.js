// 📁 backend/api/movie/delete-item.js
// 🗑️ API endpoint xóa movie item (folder/video) khỏi database

const express = require('express');
const router = express.Router();
const { getMovieDB } = require('../../utils/db');

router.delete('/delete-item', (req, res) => {
  try {
    const { key, path } = req.body;

    if (!key) {
      return res.status(400).json({ error: 'Missing database key' });
    }

    if (!path) {
      return res.status(400).json({ error: 'Missing path' });
    }

    const db = getMovieDB(key);

    // Kiểm tra item tồn tại
    const item = db.prepare('SELECT * FROM folders WHERE path = ?').get(path);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found in database' });
    }

    const isFolder = item.type === 'folder';

    if (isFolder) {
      // XÓA FOLDER: Xóa folder và tất cả children (bất kể nested level)
      const stmt = db.prepare(`
        DELETE FROM folders 
        WHERE path = ? OR path LIKE ?
      `);
      
      const result = stmt.run(path, `${path}/%`);
      
      return res.json({
        success: true,
        message: `Deleted folder and ${result.changes - 1} children from database`,
        type: 'folder',
        deleted: result.changes
      });
    } else {
      // XÓA FILE: Chỉ xóa 1 video file
      const stmt = db.prepare('DELETE FROM folders WHERE path = ?');
      const result = stmt.run(path);
      
      return res.json({
        success: true,
        message: 'Deleted video from database',
        type: 'file',
        deleted: result.changes
      });
    }
  } catch (error) {
    console.error('❌ Error deleting movie item:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete item' });
  }
});

module.exports = router;
