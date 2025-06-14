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
  if (!existingCols.includes("modified")) {
    db.prepare(`ALTER TABLE folders ADD COLUMN modified INTEGER`).run();
  }
  if (!existingCols.includes("duration")) {
    db.prepare(`ALTER TABLE folders ADD COLUMN duration INTEGER`).run();
  }

  dbMovieMap[dbkey] = db;
  return db;
}
function getMusicDB(dbkey) {
  if (dbMap[dbkey]) return dbMap[dbkey];

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

  dbMap[dbkey] = db;
  return db;
}

module.exports = { getDB, getMovieDB, getMusicDB };
