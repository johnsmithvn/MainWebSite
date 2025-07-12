// 📁 backend/utils/databaseUtils.js
// 🗄️ Database utility functions (hỗ trợ BaseScanner, không thay đổi logic cũ)

const { DB_TABLES } = require("../constants");

/**
 * 📦 Upsert folder vào database (giữ nguyên logic cũ)
 */
function upsertFolder(db, data, stats = { inserted: 0, updated: 0, skipped: 0 }) {
  const { name, path: folderPath, thumbnail, type = 'folder', size, modified, duration } = data;
  
  const existing = db.prepare(`SELECT * FROM folders WHERE path = ?`).get(folderPath);
  
  if (!existing) {
    // Insert new folder
    let insertQuery = `
      INSERT INTO folders (name, path, thumbnail, type, createdAt, updatedAt
    `;
    let values = [name, folderPath, thumbnail, type, Date.now(), Date.now()];
    
    // Add optional fields if provided
    if (size !== undefined) {
      insertQuery += `, size`;
      values.push(size);
    }
    if (modified !== undefined) {
      insertQuery += `, modified`;
      values.push(modified);
    }
    if (duration !== undefined) {
      insertQuery += `, duration`;
      values.push(duration);
    }
    
    insertQuery += `) VALUES (${values.map(() => '?').join(', ')})`;
    
    db.prepare(insertQuery).run(...values);
    
    if (stats) stats.inserted++;
    return true;
  } else {
    // Update existing folder
    let updateQuery = `UPDATE folders SET thumbnail = ?, updatedAt = ?`;
    let values = [thumbnail, Date.now()];
    
    // Add optional fields if provided
    if (size !== undefined) {
      updateQuery += `, size = ?`;
      values.push(size);
    }
    if (modified !== undefined) {
      updateQuery += `, modified = ?`;
      values.push(modified);
    }
    if (duration !== undefined) {
      updateQuery += `, duration = ?`;
      values.push(duration);
    }
    
    updateQuery += ` WHERE path = ?`;
    values.push(folderPath);
    
    db.prepare(updateQuery).run(...values);
    
    if (stats) stats.skipped++;
    return false;
  }
}

/**
 * 📊 Get database stats (giữ nguyên logic cũ)
 */
function getDbStats(db) {
  try {
    const folders = db.prepare(`SELECT COUNT(*) as count FROM folders`).get();
    const favorites = db.prepare(`SELECT COUNT(*) as count FROM folders WHERE isFavorite = 1`).get();
    
    // Check if views table exists (for manga)
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
  } catch (error) {
    console.error("❌ Error getting database stats:", error);
    return {
      totalFolders: 0,
      totalFavorites: 0,
      totalViews: 0,
      tables: []
    };
  }
}

/**
 * 📈 Increment view count (giữ nguyên logic cũ)
 */
function incrementViewCount(db, path, root = null, type = 'manga') {
  try {
    if (type === 'manga') {
      // Use views table for manga
      db.prepare(`
        INSERT INTO views (root, path, count) 
        VALUES (?, ?, 1) 
        ON CONFLICT(root, path) 
        DO UPDATE SET count = count + 1
      `).run(root, path);
    } else {
      // Use viewCount column for movies/music
      db.prepare(`
        UPDATE folders SET viewCount = viewCount + 1 WHERE path = ?
      `).run(path);
    }
    return true;
  } catch (error) {
    console.error("❌ Error incrementing view count:", error);
    return false;
  }
}

/**
 * 🔄 Batch upsert folders (giữ nguyên logic cũ)
 */
function batchUpsertFolders(db, folders, stats = { inserted: 0, updated: 0, skipped: 0 }) {
  const transaction = db.transaction((folders) => {
    for (const folder of folders) {
      upsertFolder(db, folder, stats);
    }
  });
  
  transaction(folders);
  return stats;
}

module.exports = {
  upsertFolder,
  getDbStats,
  incrementViewCount,
  batchUpsertFolders
};
