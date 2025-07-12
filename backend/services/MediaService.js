// 📁 backend/services/MediaService.js
// 🎭 Media Service Layer - xử lý logic chung cho tất cả media types

const { databaseManager } = require("../utils/DatabaseManager");
const { CONTENT_TYPES, API_RESPONSE } = require("../constants");
const { MusicScanner, MovieScanner, BaseScanner } = require("../utils/BaseScanner");
const { getRootPath } = require("../utils/config");

class MediaService {
  constructor() {
    this.scanners = {
      [CONTENT_TYPES.MANGA]: new BaseScanner(this.getDB.bind(this), CONTENT_TYPES.MANGA),
      [CONTENT_TYPES.MOVIE]: new MovieScanner(this.getDB.bind(this)),
      [CONTENT_TYPES.MUSIC]: new MusicScanner(this.getDB.bind(this))
    };
  }

  /**
   * 🗄️ Get database instance
   */
  getDB(dbkey) {
    const contentType = this.getContentType(dbkey);
    return databaseManager.getDatabase(dbkey, contentType);
  }

  /**
   * 🎯 Determine content type from dbkey
   */
  getContentType(dbkey) {
    if (dbkey.startsWith('V_')) return CONTENT_TYPES.MOVIE;
    if (dbkey.startsWith('M_')) return CONTENT_TYPES.MUSIC;
    return CONTENT_TYPES.MANGA;
  }

  /**
   * 🔍 Scan media folders
   */
  async scanFolders(dbkey, path = "", stats = null) {
    try {
      const contentType = this.getContentType(dbkey);
      const scanner = this.scanners[contentType];
      
      if (!scanner) {
        throw new Error(`No scanner available for content type: ${contentType}`);
      }

      const result = await scanner.scanFolderToDB(dbkey, path, stats);
      
      return API_RESPONSE.SUCCESS(result, `Scan completed for ${contentType}`);
    } catch (error) {
      console.error(`❌ Scan error for ${dbkey}:`, error);
      throw error;
    }
  }

  /**
   * 📊 Get media statistics
   */
  async getStatistics(dbkey) {
    try {
      const contentType = this.getContentType(dbkey);
      const stats = databaseManager.getStats(dbkey, contentType);
      
      return API_RESPONSE.SUCCESS(stats, `Statistics retrieved for ${contentType}`);
    } catch (error) {
      console.error(`❌ Stats error for ${dbkey}:`, error);
      throw error;
    }
  }

  /**
   * 🎲 Get random media items
   */
  async getRandomItems(dbkey, root, limit = 30) {
    try {
      const db = this.getDB(dbkey);
      const contentType = this.getContentType(dbkey);
      
      let query, params;
      
      if (contentType === CONTENT_TYPES.MANGA) {
        query = `
          SELECT name, path, thumbnail, isFavorite FROM folders
          WHERE root = ? AND thumbnail IS NOT NULL
          ORDER BY RANDOM() LIMIT ?
        `;
        params = [root, limit];
      } else {
        query = `
          SELECT name, path, thumbnail, isFavorite, type FROM folders
          WHERE thumbnail IS NOT NULL AND name != '.thumbnail'
          ORDER BY RANDOM() LIMIT ?
        `;
        params = [limit];
      }
      
      const rows = db.prepare(query).all(...params);
      
      return API_RESPONSE.SUCCESS(rows, `Random ${contentType} items retrieved`);
    } catch (error) {
      console.error(`❌ Random items error for ${dbkey}:`, error);
      throw error;
    }
  }

  /**
   * 📈 Get top viewed items
   */
  async getTopViewed(dbkey, root, limit = 30) {
    try {
      const db = this.getDB(dbkey);
      const contentType = this.getContentType(dbkey);
      
      let query, params;
      
      if (contentType === CONTENT_TYPES.MANGA) {
        query = `
          SELECT f.name, f.path, f.thumbnail, v.count, f.isFavorite FROM views v
          JOIN folders f ON f.path = v.path AND f.root = ?
          ORDER BY v.count DESC LIMIT ?
        `;
        params = [root, limit];
      } else {
        query = `
          SELECT name, path, thumbnail, type, viewCount, isFavorite
          FROM folders
          WHERE viewCount > 0 AND name != '.thumbnail'
          ORDER BY viewCount DESC LIMIT ?
        `;
        params = [limit];
      }
      
      const rows = db.prepare(query).all(...params);
      
      return API_RESPONSE.SUCCESS(rows, `Top viewed ${contentType} items retrieved`);
    } catch (error) {
      console.error(`❌ Top viewed error for ${dbkey}:`, error);
      throw error;
    }
  }

  /**
   * 🔍 Search media items
   */
  async searchItems(dbkey, query, root = null, limit = 100, offset = 0) {
    try {
      const db = this.getDB(dbkey);
      const contentType = this.getContentType(dbkey);
      
      let sql, params;
      
      if (contentType === CONTENT_TYPES.MANGA) {
        sql = `
          SELECT name, path, thumbnail, isFavorite FROM folders
          WHERE root = ? AND name LIKE ?
          ORDER BY name COLLATE NOCASE ASC
          LIMIT ? OFFSET ?
        `;
        params = [root, `%${query}%`, limit, offset];
      } else {
        sql = `
          SELECT name, path, thumbnail, type, isFavorite FROM folders
          WHERE name LIKE ? AND name != '.thumbnail'
          ORDER BY name COLLATE NOCASE ASC
          LIMIT ? OFFSET ?
        `;
        params = [`%${query}%`, limit, offset];
      }
      
      const rows = db.prepare(sql).all(...params);
      
      return API_RESPONSE.SUCCESS(rows, `Search results for "${query}" in ${contentType}`);
    } catch (error) {
      console.error(`❌ Search error for ${dbkey}:`, error);
      throw error;
    }
  }

  /**
   * ⭐ Toggle favorite status
   */
  async toggleFavorite(dbkey, path, value) {
    try {
      const db = this.getDB(dbkey);
      
      const result = db.prepare(`
        UPDATE folders SET isFavorite = ? WHERE path = ?
      `).run(value ? 1 : 0, path);
      
      if (result.changes === 0) {
        throw new Error(`Item not found: ${path}`);
      }
      
      return API_RESPONSE.SUCCESS({ 
        path, 
        isFavorite: value 
      }, `Favorite status updated`);
    } catch (error) {
      console.error(`❌ Toggle favorite error for ${dbkey}:`, error);
      throw error;
    }
  }

  /**
   * 🧹 Clean old cache entries
   */
  async cleanCache(dbkey, olderThanDays = 30) {
    try {
      const deletedCount = databaseManager.cleanOldCache(dbkey, olderThanDays);
      
      return API_RESPONSE.SUCCESS({ 
        deletedCount 
      }, `Cache cleaned: ${deletedCount} entries removed`);
    } catch (error) {
      console.error(`❌ Clean cache error for ${dbkey}:`, error);
      throw error;
    }
  }

  /**
   * 📈 Increment view count
   */
  async incrementViewCount(dbkey, path, root = null) {
    try {
      const db = this.getDB(dbkey);
      const contentType = this.getContentType(dbkey);
      
      if (contentType === CONTENT_TYPES.MANGA) {
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
      
      return API_RESPONSE.SUCCESS({ path }, `View count incremented`);
    } catch (error) {
      console.error(`❌ Increment view count error:`, error);
      throw error;
    }
  }
}

// Singleton instance
const mediaService = new MediaService();

module.exports = {
  MediaService,
  mediaService
};
