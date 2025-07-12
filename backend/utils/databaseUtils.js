// 📁 backend/utils/databaseUtils.js
const path = require("path");

/**
 * 🗃️ Database utility functions
 */
class DatabaseUtils {
  /**
   * 📦 Upsert folder vào database
   * @param {Database} db - SQLite database instance
   * @param {Object} data - Folder data
   * @param {string} data.name - Folder name
   * @param {string} data.path - Folder path
   * @param {string} data.thumbnail - Thumbnail path
   * @param {string} data.type - Folder type
   * @param {Object} stats - Stats object to update
   * @returns {boolean} - true nếu inserted, false nếu updated
   */
  static upsertFolder(db, data, stats = { inserted: 0, updated: 0, skipped: 0 }) {
    const { name, path: folderPath, thumbnail, type = 'folder' } = data;
    
    const existing = db.prepare(`SELECT * FROM folders WHERE path = ?`).get(folderPath);
    
    if (!existing) {
      db.prepare(`
        INSERT INTO folders (name, path, thumbnail, type, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(name, folderPath, thumbnail, type, Date.now(), Date.now());
      
      if (stats) stats.inserted++;
      return true;
    } else {
      db.prepare(`
        UPDATE folders SET thumbnail = ?, updatedAt = ? WHERE path = ?
      `).run(thumbnail, Date.now(), folderPath);
      
      if (stats) stats.skipped++;
      return false;
    }
  }

  /**
   * 📊 Increment view count cho một path
   * @param {Database} db - Database instance
   * @param {string} path - Path to increment
   * @param {string} root - Root folder (cho manga)
   * @param {string} type - 'manga' | 'movie' | 'music'
   */
  static incrementViewCount(db, path, root = null, type = 'manga') {
    if (type === 'manga') {
      // Manga sử dụng bảng views riêng
      db.prepare(`
        INSERT INTO views (root, path, count) 
        VALUES (?, ?, 1) 
        ON CONFLICT(root, path) 
        DO UPDATE SET count = count + 1
      `).run(root, path);
    } else {
      // Movie/Music sử dụng cột viewCount trong bảng folders
      db.prepare(`
        UPDATE folders SET viewCount = viewCount + 1 WHERE path = ?
      `).run(path);
    }
  }

  /**
   * 🔄 Batch upsert folders
   * @param {Database} db - Database instance
   * @param {Array} folders - Array of folder data
   * @param {Object} stats - Stats object
   */
  static batchUpsertFolders(db, folders, stats = { inserted: 0, updated: 0, skipped: 0 }) {
    const transaction = db.transaction((folders) => {
      for (const folder of folders) {
        this.upsertFolder(db, folder, stats);
      }
    });
    
    transaction(folders);
    return stats;
  }

  /**
   * 🧹 Clean old cache entries
   * @param {Database} db - Database instance
   * @param {number} olderThanDays - Remove entries older than X days
   */
  static cleanOldCache(db, olderThanDays = 30) {
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    
    const result = db.prepare(`
      DELETE FROM folders WHERE updatedAt < ?
    `).run(cutoffTime);
    
    return result.changes;
  }

  /**
   * 📈 Get database stats
   * @param {Database} db - Database instance
   * @returns {Object} - Stats object
   */
  static getDbStats(db) {
    const folders = db.prepare(`SELECT COUNT(*) as count FROM folders`).get();
    const favorites = db.prepare(`SELECT COUNT(*) as count FROM folders WHERE isFavorite = 1`).get();
    
    // Check if views table exists (manga)
    const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all();
    const hasViews = tables.some(t => t.name === 'views');
    
    let views = { count: 0 };
    if (hasViews) {
      views = db.prepare(`SELECT COUNT(*) as count FROM views`).get();
    }
    
    return {
      totalFolders: folders.count,
      totalFavorites: favorites.count,
      totalViews: views.count,
      tables: tables.map(t => t.name)
    };
  }
}

module.exports = { DatabaseUtils };
