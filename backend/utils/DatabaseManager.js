// 📁 backend/utils/DatabaseManager.js
// 🗄️ Unified Database Manager - quản lý tất cả DB operations

const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");
const { DB_TABLES, CACHE } = require("../constants");

class DatabaseManager {
  constructor() {
    this.dbDir = path.join(__dirname, "../data");
    this.dbInstances = new Map();
    this.dbSchemas = new Map();
    
    this.initializeDbDir();
    this.setupSchemas();
  }

  /**
   * 📁 Initialize database directory
   */
  initializeDbDir() {
    if (!fs.existsSync(this.dbDir)) {
      fs.mkdirSync(this.dbDir, { recursive: true });
    }
  }

  /**
   * 🏗️ Setup database schemas
   */
  setupSchemas() {
    // Manga Schema
    this.dbSchemas.set('manga', {
      tables: [
        `CREATE TABLE IF NOT EXISTS ${DB_TABLES.FOLDERS} (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          root TEXT NOT NULL,
          name TEXT NOT NULL,
          path TEXT NOT NULL,
          thumbnail TEXT,
          lastModified INTEGER,
          imageCount INTEGER DEFAULT 0,
          chapterCount INTEGER DEFAULT 0,
          otherName TEXT,
          type TEXT DEFAULT 'folder',
          createdAt INTEGER,
          updatedAt INTEGER,
          isFavorite INTEGER DEFAULT 0
        )`,
        `CREATE TABLE IF NOT EXISTS ${DB_TABLES.VIEWS} (
          root TEXT NOT NULL,
          path TEXT NOT NULL,
          count INTEGER DEFAULT 1,
          PRIMARY KEY (root, path)
        )`,
        `CREATE TABLE IF NOT EXISTS ${DB_TABLES.ROOT_THUMBNAILS} (
          root TEXT PRIMARY KEY,
          thumbnail TEXT
        )`
      ],
      indexes: [
        `CREATE INDEX IF NOT EXISTS idx_folders_root_path ON ${DB_TABLES.FOLDERS}(root, path)`,
        `CREATE INDEX IF NOT EXISTS idx_folders_favorite ON ${DB_TABLES.FOLDERS}(root, isFavorite)`
      ]
    });

    // Movie Schema
    this.dbSchemas.set('movie', {
      tables: [
        `CREATE TABLE IF NOT EXISTS ${DB_TABLES.FOLDERS} (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          path TEXT NOT NULL,
          thumbnail TEXT,
          type TEXT DEFAULT 'folder',
          size INTEGER DEFAULT 0,
          modified INTEGER,
          duration INTEGER,
          createdAt INTEGER,
          updatedAt INTEGER,
          isFavorite INTEGER DEFAULT 0,
          viewCount INTEGER DEFAULT 0
        )`
      ],
      indexes: [
        `CREATE INDEX IF NOT EXISTS idx_folders_path ON ${DB_TABLES.FOLDERS}(path)`,
        `CREATE INDEX IF NOT EXISTS idx_folders_favorite ON ${DB_TABLES.FOLDERS}(isFavorite)`
      ]
    });

    // Music Schema
    this.dbSchemas.set('music', {
      tables: [
        `CREATE TABLE IF NOT EXISTS ${DB_TABLES.FOLDERS} (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          path TEXT NOT NULL,
          thumbnail TEXT,
          type TEXT DEFAULT 'folder',
          size INTEGER DEFAULT 0,
          modified INTEGER,
          duration INTEGER,
          isFavorite INTEGER DEFAULT 0,
          viewCount INTEGER DEFAULT 0,
          createdAt INTEGER,
          updatedAt INTEGER
        )`,
        `CREATE TABLE IF NOT EXISTS ${DB_TABLES.SONGS} (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          path TEXT NOT NULL UNIQUE,
          artist TEXT,
          album TEXT,
          genre TEXT,
          lyrics TEXT
        )`,
        `CREATE TABLE IF NOT EXISTS ${DB_TABLES.PLAYLISTS} (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          thumbnail TEXT,
          createdAt INTEGER,
          updatedAt INTEGER
        )`,
        `CREATE TABLE IF NOT EXISTS ${DB_TABLES.PLAYLIST_ITEMS} (
          playlistId INTEGER NOT NULL,
          songPath TEXT NOT NULL,
          sortOrder INTEGER DEFAULT 0,
          PRIMARY KEY (playlistId, songPath)
        )`
      ],
      indexes: [
        `CREATE INDEX IF NOT EXISTS idx_folders_path ON ${DB_TABLES.FOLDERS}(path)`,
        `CREATE INDEX IF NOT EXISTS idx_folders_favorite ON ${DB_TABLES.FOLDERS}(isFavorite)`,
        `CREATE INDEX IF NOT EXISTS idx_songs_path ON ${DB_TABLES.SONGS}(path)`
      ]
    });
  }

  /**
   * 🔧 Get database instance
   */
  getDatabase(dbkey, contentType = 'manga') {
    if (this.dbInstances.has(dbkey)) {
      return this.dbInstances.get(dbkey);
    }

    const safeName = dbkey.replace(/[^a-zA-Z0-9_-]/g, "_");
    const dbPath = path.join(this.dbDir, `${safeName}.db`);
    const db = new Database(dbPath);

    // Apply schema based on content type
    this.applySchema(db, contentType);

    this.dbInstances.set(dbkey, db);
    return db;
  }

  /**
   * 🏗️ Apply database schema
   */
  applySchema(db, contentType) {
    const schema = this.dbSchemas.get(contentType);
    if (!schema) {
      throw new Error(`Unknown content type: ${contentType}`);
    }

    // Create tables
    schema.tables.forEach(sql => db.exec(sql));
    
    // Create indexes
    schema.indexes.forEach(sql => db.exec(sql));

    // Handle column migrations
    this.handleColumnMigrations(db, contentType);
  }

  /**
   * 🔄 Handle column migrations
   */
  handleColumnMigrations(db, contentType) {
    const existingCols = db.prepare(`PRAGMA table_info(${DB_TABLES.FOLDERS})`).all().map(c => c.name);
    
    // Common migrations
    const migrations = [
      { column: 'otherName', sql: `ALTER TABLE ${DB_TABLES.FOLDERS} ADD COLUMN otherName TEXT` },
      { column: 'size', sql: `ALTER TABLE ${DB_TABLES.FOLDERS} ADD COLUMN size INTEGER DEFAULT 0` },
      { column: 'modified', sql: `ALTER TABLE ${DB_TABLES.FOLDERS} ADD COLUMN modified INTEGER` },
      { column: 'duration', sql: `ALTER TABLE ${DB_TABLES.FOLDERS} ADD COLUMN duration INTEGER` }
    ];

    migrations.forEach(({ column, sql }) => {
      if (!existingCols.includes(column)) {
        try {
          db.exec(sql);
        } catch (error) {
          console.warn(`⚠️ Migration failed for column ${column}:`, error.message);
        }
      }
    });
  }

  /**
   * 🧹 Clean old cache entries
   */
  cleanOldCache(dbkey, olderThanDays = 30) {
    const db = this.getDatabase(dbkey);
    const cutoffTime = Date.now() - (olderThanDays * CACHE.DAY_IN_MS);
    
    const result = db.prepare(`
      DELETE FROM ${DB_TABLES.FOLDERS} WHERE updatedAt < ?
    `).run(cutoffTime);
    
    return result.changes;
  }

  /**
   * 📊 Get database statistics
   */
  getStats(dbkey, contentType = 'manga') {
    const db = this.getDatabase(dbkey, contentType);
    
    const folders = db.prepare(`SELECT COUNT(*) as count FROM ${DB_TABLES.FOLDERS}`).get();
    const favorites = db.prepare(`SELECT COUNT(*) as count FROM ${DB_TABLES.FOLDERS} WHERE isFavorite = 1`).get();
    
    const stats = {
      totalFolders: folders.count,
      totalFavorites: favorites.count,
      contentType
    };

    // Add view count for manga
    if (contentType === 'manga') {
      const views = db.prepare(`SELECT COUNT(*) as count FROM ${DB_TABLES.VIEWS}`).get();
      stats.totalViews = views.count;
    }

    return stats;
  }

  /**
   * 💾 Close all database connections
   */
  closeAll() {
    for (const [key, db] of this.dbInstances) {
      try {
        db.close();
      } catch (error) {
        console.error(`❌ Error closing database ${key}:`, error);
      }
    }
    this.dbInstances.clear();
  }
}

// Singleton instance
const databaseManager = new DatabaseManager();

module.exports = {
  DatabaseManager,
  databaseManager
};
