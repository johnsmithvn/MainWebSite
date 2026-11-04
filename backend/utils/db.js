// 📁 backend/utils/db.js
const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const DB_DIR = path.join(__dirname, "../data");
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR);

// ✅ map: rootKey => DB instance
const dbMap = {};

/**
 * ✅ Tạo DB nếu chưa tồn tại
 * @param {string} dbkey  đây là key của environment
 * @returns {Database} SQLite instance
 */
// ✅ Tạo bảng nếu chưa tồn tại
// folders: cache toàn bộ folder có thumbnail
// views: lưu lượt xem
// ➕ thêm cột root để phân biệt folder từ root nào

function getDB(dbkey) {
  if (dbMap[dbkey]) return dbMap[dbkey];

  const safeName = dbkey.replace(/[^a-zA-Z0-9_-]/g, "_"); // chống path lỗi
  const dbPath = path.join(DB_DIR, `${safeName}.db`);

  const db = new Database(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS folders (
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

    );

    CREATE INDEX IF NOT EXISTS idx_folders_root_path ON folders(root, path);

    CREATE TABLE IF NOT EXISTS views (
    root TEXT NOT NULL,
    path TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    PRIMARY KEY (root, path)
    );
    CREATE INDEX IF NOT EXISTS idx_folders_favorite ON folders(root, isFavorite);

    CREATE TABLE IF NOT EXISTS root_thumbnails (
      root TEXT PRIMARY KEY,
      thumbnail TEXT
    );
  `);
  // ➕ đảm bảo có cột otherName khi nâng cấp DB cũ
  const cols = db.prepare(`PRAGMA table_info(folders)`).all().map((c) => c.name);
  if (!cols.includes("otherName")) {
    db.prepare(`ALTER TABLE folders ADD COLUMN otherName TEXT`).run();
  }
  // ✅ Ensure scanned column exists for mark & sweep GC
  if (!cols.includes("scanned")) {
    try {
      db.prepare(`ALTER TABLE folders ADD COLUMN scanned INTEGER DEFAULT 0`).run();
    } catch (err) {
      // ignore if unable to add (e.g., older SQLite versions)
      console.warn('Could not add scanned column to folders (getDB):', err.message);
    }
  }

  dbMap[dbkey] = db;
  return db;
}

// Movie: Dùng getMovieDB
const dbMovieMap = {};
function getMovieDB(dbkey) {
  if (dbMovieMap[dbkey]) return dbMovieMap[dbkey];
  const safeName = dbkey.replace(/[^a-zA-Z0-9_-]/g, "_");
  const dbPath = path.join(DB_DIR, `${safeName}.db`);
  const db = new Database(dbPath);

  // Tạo bảng nếu chưa có
  db.exec(`
    CREATE TABLE IF NOT EXISTS folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      thumbnail TEXT,
      type TEXT DEFAULT 'folder',
      createdAt INTEGER,
      updatedAt INTEGER,
      isFavorite INTEGER DEFAULT 0,
      viewCount INTEGER DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_folders_path ON folders(path);
    CREATE INDEX IF NOT EXISTS idx_folders_favorite ON folders(isFavorite);
  `);

  // ✅ Kiểm tra & thêm cột nếu thiếu
  const existingCols = db
    .prepare(`PRAGMA table_info(folders)`)
    .all()
    .map((c) => c.name);

  if (!existingCols.includes("size")) {
    db.prepare(`ALTER TABLE folders ADD COLUMN size INTEGER DEFAULT 0`).run();
  }
  // Ensure scanned column exists for movie DB as well
  if (!existingCols.includes("scanned")) {
    try {
      db.prepare(`ALTER TABLE folders ADD COLUMN scanned INTEGER DEFAULT 0`).run();
    } catch (err) {
      console.warn('Could not add scanned column to folders (getMovieDB):', err.message);
    }
  }
  if (!existingCols.includes("modified")) {
    db.prepare(`ALTER TABLE folders ADD COLUMN modified INTEGER`).run();
  }
  if (!existingCols.includes("duration")) {
    db.prepare(`ALTER TABLE folders ADD COLUMN duration INTEGER`).run();
  }

  dbMovieMap[dbkey] = db;
  return db;
}
// Music: map riêng — trước đây dùng chung `dbMap` với manga nên tuỳ thứ tự gọi, key music có thể
// nhận connection đã mở bằng getDB (bỏ qua migration songs/playlists) hoặc ngược lại (ISSUES B12)
const dbMusicMap = {};
function getMusicDB(dbkey) {
  if (dbMusicMap[dbkey]) return dbMusicMap[dbkey];

  const safeName = dbkey.replace(/[^a-zA-Z0-9_-]/g, "_");
  const dbPath = path.join(DB_DIR, `${safeName}.db`);
  const db = new Database(dbPath);

  db.exec(`
    -- 📁 folders: giống movie, lưu cả folder và bài hát
    CREATE TABLE IF NOT EXISTS folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      thumbnail TEXT,
      type TEXT DEFAULT 'folder', -- 'folder' | 'audio'
      size INTEGER DEFAULT 0,
      modified INTEGER,
      duration INTEGER, -- giây
      isFavorite INTEGER DEFAULT 0,
      viewCount INTEGER DEFAULT 0,
      createdAt INTEGER,
      updatedAt INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_folders_path ON folders(path);
    CREATE INDEX IF NOT EXISTS idx_folders_favorite ON folders(isFavorite);

    -- 🎵 songs: metadata chi tiết (lyrics, artist, album,...)
    CREATE TABLE IF NOT EXISTS songs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL UNIQUE, -- match với folders.path
      artist TEXT,
      album TEXT,
      title TEXT,
      genre TEXT,
      lyrics TEXT
    );

   

    -- 🎶 playlists
    CREATE TABLE IF NOT EXISTS playlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      thumbnail TEXT,
      createdAt INTEGER,
      updatedAt INTEGER
    );

    -- 🔗 playlist_items: nối playlist ↔ bài hát
    CREATE TABLE IF NOT EXISTS playlist_items (
      playlistId INTEGER NOT NULL,
      songPath TEXT NOT NULL,
      sortOrder INTEGER DEFAULT 0,
      PRIMARY KEY (playlistId, songPath)
    );
  `);

  const cols = db
    .prepare("PRAGMA table_info(playlists)")
    .all()
    .map((c) => c.name);
  if (!cols.includes("thumbnail")) {
    db.exec("ALTER TABLE playlists ADD COLUMN thumbnail TEXT");
  }

  // ✅ Kiểm tra & thêm cột title vào bảng songs nếu thiếu
  const songCols = db
    .prepare("PRAGMA table_info(songs)")
    .all()
    .map((c) => c.name);
  if (!songCols.includes("title")) {
    db.exec("ALTER TABLE songs ADD COLUMN title TEXT");
  }

  // Ensure folders table has scanned column for music DB
  const folderCols = db.prepare("PRAGMA table_info(folders)").all().map((c) => c.name);
  if (!folderCols.includes("scanned")) {
    try {
      db.prepare(`ALTER TABLE folders ADD COLUMN scanned INTEGER DEFAULT 0`).run();
    } catch (err) {
      console.warn('Could not add scanned column to folders (getMusicDB):', err.message);
    }
  }

  dbMusicMap[dbkey] = db;
  return db;
}

// 📸 Media Gallery DB (Google Photos-like)
const dbMediaMap = {};
function getMediaDB(dbkey) {
  if (dbMediaMap[dbkey]) return dbMediaMap[dbkey];
  
  const safeName = dbkey.replace(/[^a-zA-Z0-9_-]/g, "_");
  const dbPath = path.join(DB_DIR, `${safeName}.db`);
  const db = new Database(dbPath);

  db.exec(`
    -- � folders: Folder cache with thumbnails (for navigation)
    CREATE TABLE IF NOT EXISTS folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      root TEXT NOT NULL,
      path TEXT NOT NULL,
      name TEXT NOT NULL,
      thumbnail TEXT,
      itemCount INTEGER DEFAULT 0,
      scanned INTEGER DEFAULT 0,
      createdAt INTEGER,
      updatedAt INTEGER,
      UNIQUE(root, path)
    );

    CREATE INDEX IF NOT EXISTS idx_folder_root ON folders(root);
    CREATE INDEX IF NOT EXISTS idx_folder_path ON folders(path);

    -- �📸 media_items: Images & Videos
    CREATE TABLE IF NOT EXISTS media_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      path TEXT NOT NULL UNIQUE,
      thumbnail TEXT,
      type TEXT NOT NULL, -- 'image' | 'video'
      size INTEGER DEFAULT 0,
      modified INTEGER,
      width INTEGER,
      height INTEGER,
      duration INTEGER, -- for videos (seconds)
      date_taken INTEGER, -- timestamp when photo/video was taken
      isFavorite INTEGER DEFAULT 0,
      viewCount INTEGER DEFAULT 0,
      albumId INTEGER, -- link to albums table
      scanned INTEGER DEFAULT 0,
      createdAt INTEGER,
      updatedAt INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_media_path ON media_items(path);
    CREATE INDEX IF NOT EXISTS idx_media_type ON media_items(type);
    CREATE INDEX IF NOT EXISTS idx_media_favorite ON media_items(isFavorite);
    CREATE INDEX IF NOT EXISTS idx_media_date_taken ON media_items(date_taken);
    CREATE INDEX IF NOT EXISTS idx_media_album ON media_items(albumId);

    -- 📚 albums: Collections like Google Photos
    CREATE TABLE IF NOT EXISTS albums (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      coverImage TEXT,
      createdAt INTEGER,
      updatedAt INTEGER
    );
  `);

  dbMediaMap[dbkey] = db;
  return db;
}

module.exports = { getDB, getMovieDB, getMusicDB, getMediaDB };
