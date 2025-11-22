// module.exports = { scanMusicFolderToDB };
const fs = require("fs");
const path = require("path");
const { getRootPath } = require("./config");
const { getMusicDB } = require("./db");
const { FILE_EXTENSIONS } = require("../constants");

// Centralized extensions
const AUDIO_EXTS = (FILE_EXTENSIONS.AUDIO || []).map(e => e.toLowerCase());
const IMAGE_EXTS = (FILE_EXTENSIONS.IMAGE || []).map(e => e.toLowerCase());

// 🟢 Tìm thumbnail đúng tên (ưu tiên jpg, png, ...)
function findThumbnail(thumbnailDir, baseName) {
  for (const ext of IMAGE_EXTS) {
    const thumbFile = path.join(thumbnailDir, baseName + ext);
    if (fs.existsSync(thumbFile)) {
      // Đường dẫn tương đối để lưu DB, frontend sẽ resolve lại gốc
      return path.posix.join(".thumbnail", baseName + ext);
    }
  }
  return null;
}

async function scanMusicFolderToDB(
  dbkey,
  currentPath = "",
  stats = { inserted: 0, updated: 0, skipped: 0, deleted: 0 }
) {
  const db = getMusicDB(dbkey);
  const rootPath = getRootPath(dbkey);
  const basePath = path.join(rootPath, currentPath);

  // 🗑️ PHASE 1: Mark all as unscanned (only on root scan)
  if (currentPath === "") {
    db.prepare(`UPDATE folders SET scanned = 0`).run();
  }

  if (!fs.existsSync(basePath)) return stats;
  const entries = fs.readdirSync(basePath, { withFileTypes: true });

  for (const entry of entries) {
    // ❌ Skip folder .thumbnail
    if (entry.isDirectory() && entry.name === ".thumbnail") continue;
    const relPath = path.posix.join(currentPath, entry.name);
    const fullPath = path.join(basePath, entry.name);

    // 📁 FOLDER
    if (entry.isDirectory()) {
      // Quét thumbnail đúng tên folder trong .thumbnail
      let thumb = null;
      const thumbDir = path.join(fullPath, ".thumbnail");
      if (fs.existsSync(thumbDir)) {
        thumb = findThumbnail(thumbDir, entry.name); // tên folder
      }

      const existing = db
        .prepare(`SELECT * FROM folders WHERE path = ?`)
        .get(relPath);

      if (!existing) {
        // ✅ NEW FOLDER
        db.prepare(
          `
          INSERT INTO folders (name, path, thumbnail, type, scanned, createdAt, updatedAt)
          VALUES (?, ?, ?, 'folder', 1, ?, ?)
        `
        ).run(entry.name, relPath, thumb, Date.now(), Date.now());
        stats.inserted++;
      } else if (existing.thumbnail !== thumb) {
        // ✅ THUMBNAIL CHANGED
        db.prepare(
          `UPDATE folders SET thumbnail = ?, scanned = 1, updatedAt = ? WHERE path = ?`
        ).run(thumb, Date.now(), relPath);
        stats.updated++;
      } else {
        // ✅ UNCHANGED FOLDER - Mark as scanned
        db.prepare(`UPDATE folders SET scanned = 1 WHERE path = ?`).run(relPath);
        stats.skipped++;
      }

      await scanMusicFolderToDB(dbkey, relPath, stats); // 🔁 Đệ quy
    }

    // 🎵 AUDIO FILE
    if (
      entry.isFile() &&
      AUDIO_EXTS.includes(path.extname(entry.name).toLowerCase())
    ) {
      const name = path.basename(entry.name, path.extname(entry.name));
      const stat = fs.statSync(fullPath);
      const lastModified = stat.mtimeMs;

      // Quét thumbnail đúng tên file trong .thumbnail của folder hiện tại
      let thumb = null;
      const thumbDir = path.join(basePath, ".thumbnail");
      if (fs.existsSync(thumbDir)) {
        thumb = findThumbnail(thumbDir, name); // tên file không extension
      }

      const existing = db
        .prepare(`SELECT * FROM folders WHERE path = ?`)
        .get(relPath);

      // Check if metadata exists in songs table
      const existingSong = existing 
        ? db.prepare(`SELECT * FROM songs WHERE path = ?`).get(relPath)
        : null;

      if (!existing) {
        // ✅ NEW FILE - Extract full metadata
        let duration = 0, artist = null, album = null, genre = null, lyrics = null, title = null;
        try {
          const { parseFile } = await import("music-metadata");
          const metadata = await parseFile(fullPath);
          const common = metadata.common;

          duration = Number.isFinite(metadata.format.duration)
            ? Math.floor(metadata.format.duration)
            : 0;
          artist = typeof common.artist === "string" ? common.artist : null;
          album = typeof common.album === "string" ? common.album : null;
          title = typeof common.title === "string" ? common.title : null;
          genre = Array.isArray(common.genre)
            ? common.genre.join(", ")
            : typeof common.genre === "string"
              ? common.genre
              : null;
          lyrics = typeof common.lyrics === "string" ? common.lyrics : null;
        } catch (err) {
          console.warn("❌ Lỗi đọc metadata:", entry.name, err.message);
        }

        db.prepare(
          `
          INSERT INTO folders (name, path, thumbnail, type, size, modified, duration, scanned, createdAt, updatedAt)
          VALUES (?, ?, ?, 'audio', ?, ?, ?, 1, ?, ?)
        `
        ).run(
          name,
          relPath,
          thumb,
          stat.size,
          lastModified,
          duration,
          Date.now(),
          Date.now()
        );
        db.prepare(
          `
          INSERT INTO songs (path, artist, album, title, genre, lyrics)
          VALUES (?, ?, ?, ?, ?, ?)
        `
        ).run(relPath, artist, album, title, genre, lyrics);
        stats.inserted++;
      } else if (existing.modified !== lastModified) {
        // ✅ CHANGED FILE - File was modified, re-extract metadata
        let duration = 0, artist = null, album = null, genre = null, lyrics = null, title = null;
        try {
          const { parseFile } = await import("music-metadata");
          const metadata = await parseFile(fullPath);
          const common = metadata.common;

          duration = Number.isFinite(metadata.format.duration)
            ? Math.floor(metadata.format.duration)
            : 0;
          artist = typeof common.artist === "string" ? common.artist : null;
          album = typeof common.album === "string" ? common.album : null;
          title = typeof common.title === "string" ? common.title : null;
          genre = Array.isArray(common.genre)
            ? common.genre.join(", ")
            : typeof common.genre === "string"
              ? common.genre
              : null;
          lyrics = typeof common.lyrics === "string" ? common.lyrics : null;
        } catch (err) {
          console.warn("❌ Lỗi đọc metadata:", entry.name, err.message);
        }

        db.prepare(
          `
          UPDATE folders SET thumbnail = ?, size = ?, modified = ?, duration = ?, scanned = 1, updatedAt = ? WHERE path = ?
        `
        ).run(thumb, stat.size, lastModified, duration, Date.now(), relPath);
        
        if (existingSong) {
          db.prepare(
            `
            UPDATE songs SET artist = ?, album = ?, title = ?, genre = ?, lyrics = ? WHERE path = ?
          `
          ).run(artist, album, title, genre, lyrics, relPath);
        } else {
          db.prepare(
            `
            INSERT INTO songs (path, artist, album, title, genre, lyrics)
            VALUES (?, ?, ?, ?, ?, ?)
          `
          ).run(relPath, artist, album, title, genre, lyrics);
        }
        stats.updated++;
      } else if (existing.thumbnail !== thumb) {
        // ✅ THUMBNAIL CHANGED - Only thumbnail updated (NO metadata extraction!)
        db.prepare(
          `
          UPDATE folders SET thumbnail = ?, scanned = 1, updatedAt = ? WHERE path = ?
        `
        ).run(thumb, Date.now(), relPath);
        stats.updated++;
      } else {
        // ✅ UNCHANGED FILE - Mark as scanned (NO metadata extraction!)
        db.prepare(`UPDATE folders SET scanned = 1 WHERE path = ?`).run(relPath);
        stats.skipped++;
      }
    }
  }

  // 🗑️ PHASE 3: Sweep orphaned records (only on root scan completion)
  if (currentPath === "") {
    const orphanedCount = db.prepare(`SELECT COUNT(*) as count FROM folders WHERE scanned = 0`).get().count;
    if (orphanedCount > 0) {
      // Delete orphaned songs first (foreign key constraint)
      // Using subquery to avoid SQLite 999 parameter limit
      db.prepare(`DELETE FROM songs WHERE path IN (SELECT path FROM folders WHERE scanned = 0)`).run();
      
      // Delete orphaned folders
      db.prepare(`DELETE FROM folders WHERE scanned = 0`).run();
      stats.deleted = orphanedCount;
      
      console.log(`🗑️ Deleted ${stats.deleted} orphaned music records`);
    }
  }

  return stats;
}

module.exports = { scanMusicFolderToDB };
