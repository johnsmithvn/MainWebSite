// 📁 backend/constants/database.js
// 🗄️ Backend Database Constants (CommonJS)

const DATABASE = {
  // SQLite PRAGMA settings
  PRAGMA: {
    JOURNAL_MODE: 'WAL',
    SYNCHRONOUS: 'NORMAL',
    CACHE_SIZE: 10000,
    TEMP_STORE: 'MEMORY',
    FOREIGN_KEYS: 'ON',
    AUTO_VACUUM: 'INCREMENTAL',
  },
  
  // Connection settings
  CONNECTION: {
    TIMEOUT: 10000,           // 10 giây
    MAX_RETRIES: 3,           // Số lần retry
    RETRY_DELAY: 1000,        // 1 giây delay giữa các retry
    POOL_SIZE: 10,            // Connection pool size
  },
  
  // Query settings
  QUERY: {
    TIMEOUT: 30000,           // 30 giây
    MAX_BIND_PARAMETERS: 999, // SQLite limit
    BATCH_SIZE: 100,          // Batch insert size
  },
  
  // Table names
  TABLES: {
    FOLDERS: 'folders',
    VIEWS: 'views',
    ROOT_THUMBNAILS: 'root_thumbnails',
    SONGS: 'songs',
    PLAYLISTS: 'playlists',
    PLAYLIST_ITEMS: 'playlist_items',
    FAVORITES: 'favorites',
    CACHE: 'cache',
    METADATA: 'metadata',
  },
  
  // Index names
  INDEXES: {
    FOLDERS_PATH: 'idx_folders_path',
    FOLDERS_ROOT: 'idx_folders_root',
    FOLDERS_NAME: 'idx_folders_name',
    FOLDERS_THUMBNAIL: 'idx_folders_thumbnail',
    VIEWS_PATH: 'idx_views_path',
    VIEWS_ROOT: 'idx_views_root',
    VIEWS_COUNT: 'idx_views_count',
    FAVORITES_PATH: 'idx_favorites_path',
    FAVORITES_ROOT: 'idx_favorites_root',
  },
  
  // Field types
  FIELD_TYPES: {
    TEXT: 'TEXT',
    INTEGER: 'INTEGER',
    REAL: 'REAL',
    BLOB: 'BLOB',
    DATETIME: 'DATETIME',
  },
  
  // Constraints
  CONSTRAINTS: {
    PRIMARY_KEY: 'PRIMARY KEY',
    UNIQUE: 'UNIQUE',
    NOT_NULL: 'NOT NULL',
    FOREIGN_KEY: 'FOREIGN KEY',
    CHECK: 'CHECK',
  },
};

module.exports = DATABASE;
