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
  stats = { inserted: 0, updated: 0, skipped: 0, deleted: 0 },
  scopePath = "", // 🎯 NEW: scope path for partial scan
  shallow = false // 📦 Shallow scan: don't recurse into subfolders
) {
  const db = getMusicDB(dbkey);
  const rootPath = getRootPath(dbkey);
  const basePath = path.join(rootPath, currentPath);

  // 🗑️ PHASE 1: Mark as unscanned (scope-aware & shallow-aware)
  if (currentPath === "") {
    if (scopePath) {
      // Partial scan: only mark items in scope path
      const scopePattern = shallow ? scopePath : `${scopePath}/%`;
      if (shallow) {
        // Shallow: only mark direct children of scope, not nested items
        db.prepare(`UPDATE folders SET scanned = 0 WHERE path = ? OR (path LIKE ? AND path NOT LIKE ?)`)
          .run(scopePath, `${scopePath}/%`, `${scopePath}/%/%`);
        console.log(`📦 Shallow scan: Marking scope "${scopePath}" (direct children only)`);
      } else {
        // Deep: mark scope and all descendants
        db.prepare(`UPDATE folders SET scanned = 0 WHERE path = ? OR path LIKE ?`)
          .run(scopePath, `${scopePath}/%`);
        console.log(`🎯 Deep scan: Marking scope "${scopePath}" (all descendants)`);
      }
    } else {
      if (shallow) {
        // Shallow root scan: only mark root level items (no nested paths)
        db.prepare(`UPDATE folders SET scanned = 0 WHERE path NOT LIKE ?`).run('%/%');
        console.log(`📦 Shallow scan: Marking root level items only`);
      } else {
        // Full deep scan: mark all
        db.prepare(`UPDATE folders SET scanned = 0`).run();
        console.log(`🎯 Deep scan: Marking all items for full scan`);
      }
    }
  }

  if (!fs.existsSync(basePath)) return stats;
  const entries = fs.readdirSync(basePath, { withFileTypes: true });

  for (const entry of entries) {
    // ❌ Skip folder .thumbnail
    if (entry.isDirectory() && entry.name === ".thumbnail") continue;
    const relPath = path.posix.join(currentPath, entry.name);
    const fullPath = path.join(basePath, entry.name);

    // 🎯 SCOPE CHECK: Skip items outside scope for partial scan
    if (scopePath) {
      const isInScope = relPath === scopePath || relPath.startsWith(`${scopePath}/`);
      const isParentOfScope = scopePath.startsWith(`${relPath}/`);
      
      // Skip if not in scope and not parent of scope
      if (!isInScope && !isParentOfScope) {
        continue;
      }
      
      // Mark parent folders (on path to scope) as scanned to prevent deletion
      if (isParentOfScope && !isInScope) {
        const existing = db.prepare(`SELECT * FROM folders WHERE path = ?`).get(relPath);
        if (existing) {
          db.prepare(`UPDATE folders SET scanned = 1 WHERE path = ?`).run(relPath);
        }
      }
    }

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

      // 📦 Shallow scan: Skip recursion into subfolders
      if (!shallow) {
        await scanMusicFolderToDB(dbkey, relPath, stats, scopePath, shallow); // 🔁 Đệ quy
      }
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

  // 🗑️ PHASE 3: Sweep orphaned records (scope-aware & shallow-aware cleanup)
  if (currentPath === "") {
    let orphanedCount;
    if (scopePath) {
      // Partial scan cleanup
      if (shallow) {
        // Shallow partial scan: only delete unscanned direct children
        orphanedCount = db.prepare(
          `SELECT COUNT(*) as count FROM folders WHERE scanned = 0 AND (path = ? OR (path LIKE ? AND path NOT LIKE ?))`
        ).get(scopePath, `${scopePath}/%`, `${scopePath}/%/%`).count;
        
        if (orphanedCount > 0) {
          // Delete orphaned songs first
          const deletedSongs = db.prepare(
            `DELETE FROM songs WHERE path IN (SELECT path FROM folders WHERE scanned = 0 AND (path = ? OR (path LIKE ? AND path NOT LIKE ?)))`
          ).run(scopePath, `${scopePath}/%`, `${scopePath}/%/%`);
          
          // Delete orphaned folders
          db.prepare(
            `DELETE FROM folders WHERE scanned = 0 AND (path = ? OR (path LIKE ? AND path NOT LIKE ?))`
          ).run(scopePath, `${scopePath}/%`, `${scopePath}/%/%`);
          
          stats.deleted = orphanedCount;
          console.log(`🗑️ Deleted ${deletedSongs.changes} songs and ${stats.deleted} folders in scope (shallow): ${scopePath}`);
        }
      } else {
        // Deep partial scan: delete all unscanned items in scope
        orphanedCount = db.prepare(
          `SELECT COUNT(*) as count FROM folders WHERE scanned = 0 AND (path = ? OR path LIKE ?)`
        ).get(scopePath, `${scopePath}/%`).count;
        
        if (orphanedCount > 0) {
          // Delete orphaned songs first (foreign key constraint)
          const deletedSongs = db.prepare(
            `DELETE FROM songs WHERE path IN (SELECT path FROM folders WHERE scanned = 0 AND (path = ? OR path LIKE ?))`
          ).run(scopePath, `${scopePath}/%`);
          
          // Delete orphaned folders
          db.prepare(
            `DELETE FROM folders WHERE scanned = 0 AND (path = ? OR path LIKE ?)`
          ).run(scopePath, `${scopePath}/%`);
          
          stats.deleted = orphanedCount;
          console.log(`🗑️ Deleted ${deletedSongs.changes} songs and ${stats.deleted} folders in scope (deep): ${scopePath}`);
        }
      }
    } else {
      // Full scan cleanup
      if (shallow) {
        // Shallow root scan: only delete root level unscanned items
        orphanedCount = db.prepare(`SELECT COUNT(*) as count FROM folders WHERE scanned = 0 AND path NOT LIKE ?`).get('%/%').count;
        if (orphanedCount > 0) {
          // Delete orphaned songs first
          const deletedSongs = db.prepare(`DELETE FROM songs WHERE path IN (SELECT path FROM folders WHERE scanned = 0 AND path NOT LIKE ?)`).run('%/%');
          
          // Delete orphaned folders
          db.prepare(`DELETE FROM folders WHERE scanned = 0 AND path NOT LIKE ?`).run('%/%');
          stats.deleted = orphanedCount;
          
          console.log(`🗑️ Deleted ${deletedSongs.changes} songs and ${stats.deleted} root folders (shallow)`);
        }
      } else {
        // Full deep scan: delete all orphaned items
        orphanedCount = db.prepare(`SELECT COUNT(*) as count FROM folders WHERE scanned = 0`).get().count;
        if (orphanedCount > 0) {
          // Delete orphaned songs first (foreign key constraint)
          const deletedSongs = db.prepare(`DELETE FROM songs WHERE path IN (SELECT path FROM folders WHERE scanned = 0)`).run();
          
          // Delete orphaned folders
          db.prepare(`DELETE FROM folders WHERE scanned = 0`).run();
          stats.deleted = orphanedCount;
          
          console.log(`🗑️ Deleted ${deletedSongs.changes} songs and ${stats.deleted} folders (deep)`);
        }
      }
    }
  }

  return stats;
}

module.exports = { scanMusicFolderToDB };
