// module.exports = { scanMusicFolderToDB };
const fs = require("fs");
const path = require("path");
const { getRootPath } = require("./config");
const { getMusicDB } = require("./db");
const { FILE_EXTENSIONS } = require("../constants");
const { escapeLike } = require("./sqlLike");
const { createWriteQueue, createThumbnailLookup, pathExists } = require("./scanHelpers");

// Centralized extensions
const AUDIO_EXTS = (FILE_EXTENSIONS.AUDIO || []).map(e => e.toLowerCase());
const IMAGE_EXTS = (FILE_EXTENSIONS.IMAGE || []).map(e => e.toLowerCase());


async function scanMusicLevel(
  dbkey,
  currentPath = "",
  stats = { inserted: 0, updated: 0, skipped: 0, deleted: 0 },
  scopePath = "", // 🎯 NEW: scope path for partial scan
  shallow = false, // 📦 Shallow scan: don't recurse into subfolders
  queue // ⚡ hàng đợi ghi theo lô + tra thumbnail (PF1, PF10) — do scanMusicFolderToDB tạo
) {
  const db = getMusicDB(dbkey);
  const rootPath = getRootPath(dbkey);
  const basePath = path.join(rootPath, currentPath);

  // 🗑️ PHASE 1: Mark as unscanned (scope-aware & shallow-aware)
  if (currentPath === "") {
    if (scopePath) {
      // Partial scan: only mark items in scope path
      const scopePattern = shallow ? scopePath : `${escapeLike(scopePath)}/%`;
      if (shallow) {
        // Shallow: only mark direct children of scope, not nested items
        db.prepare(`UPDATE folders SET scanned = 0 WHERE path = ? OR (path LIKE ? ESCAPE '\\' AND path NOT LIKE ? ESCAPE '\\')`)
          .run(scopePath, `${escapeLike(scopePath)}/%`, `${escapeLike(scopePath)}/%/%`);
        console.log(`📦 Shallow scan: Marking scope "${scopePath}" (direct children only)`);
      } else {
        // Deep: mark scope and all descendants
        db.prepare(`UPDATE folders SET scanned = 0 WHERE path = ? OR path LIKE ? ESCAPE '\\'`)
          .run(scopePath, `${escapeLike(scopePath)}/%`);
        console.log(`🎯 Deep scan: Marking scope "${scopePath}" (all descendants)`);
      }
    } else {
      if (shallow) {
        // Shallow root scan: only mark root level items (no nested paths)
        db.prepare(`UPDATE folders SET scanned = 0 WHERE path NOT LIKE ? ESCAPE '\\'`).run('%/%');
        console.log(`📦 Shallow scan: Marking root level items only`);
      } else {
        // Full deep scan: mark all
        db.prepare(`UPDATE folders SET scanned = 0`).run();
        console.log(`🎯 Deep scan: Marking all items for full scan`);
      }
    }
  }

  if (!(await pathExists(basePath))) return stats;
  const entries = await fs.promises.readdir(basePath, { withFileTypes: true });

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
        const existing = queue.stmt(`SELECT * FROM folders WHERE path = ?`).get(relPath);
        if (existing) {
          queue.stmt(`UPDATE folders SET scanned = 1 WHERE path = ?`).run(relPath);
        }
      }
    }

    // 📁 FOLDER
    if (entry.isDirectory()) {
      // Quét thumbnail đúng tên folder trong .thumbnail
      let thumb = null;
      const thumbDir = path.join(fullPath, ".thumbnail");
      thumb = await queue.thumbs.find(thumbDir, entry.name, IMAGE_EXTS);

      const existing = queue
        .stmt(`SELECT * FROM folders WHERE path = ?`)
        .get(relPath);

      if (!existing) {
        // ✅ NEW FOLDER
        queue.stmt(
          `
          INSERT INTO folders (name, path, thumbnail, type, scanned, createdAt, updatedAt)
          VALUES (?, ?, ?, 'folder', 1, ?, ?)
        `
        ).run(entry.name, relPath, thumb, Date.now(), Date.now());
        stats.inserted++;
      } else if (existing.thumbnail !== thumb) {
        // ✅ THUMBNAIL CHANGED
        queue.stmt(
          `UPDATE folders SET thumbnail = ?, scanned = 1, updatedAt = ? WHERE path = ?`
        ).run(thumb, Date.now(), relPath);
        stats.updated++;
      } else {
        // ✅ UNCHANGED FOLDER - Mark as scanned
        queue.stmt(`UPDATE folders SET scanned = 1 WHERE path = ?`).run(relPath);
        stats.skipped++;
      }

      // 📦 Shallow scan: không đệ quy, NGOẠI TRỪ folder cha của scope (để đi tới scope) và chính
      // folder scope (để xử lý các con trực tiếp đã bị đánh dấu ở phase 1) — ISSUES D1
      const isScopeOrParent =
        !!scopePath && (relPath === scopePath || scopePath.startsWith(`${relPath}/`));
      if (!shallow || isScopeOrParent) {
        await scanMusicLevel(dbkey, relPath, stats, scopePath, shallow, queue); // 🔁 Đệ quy
      }
    }

    // 🎵 AUDIO FILE
    if (
      entry.isFile() &&
      AUDIO_EXTS.includes(path.extname(entry.name).toLowerCase())
    ) {
      const name = path.basename(entry.name, path.extname(entry.name));
      const stat = await fs.promises.stat(fullPath);
      const lastModified = stat.mtimeMs;

      // Quét thumbnail đúng tên file trong .thumbnail của folder hiện tại
      let thumb = null;
      const thumbDir = path.join(basePath, ".thumbnail");
      thumb = await queue.thumbs.find(thumbDir, name, IMAGE_EXTS);

      const existing = queue
        .stmt(`SELECT * FROM folders WHERE path = ?`)
        .get(relPath);

      // Check if metadata exists in songs table
      const existingSong = existing 
        ? queue.stmt(`SELECT * FROM songs WHERE path = ?`).get(relPath)
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

        queue.stmt(
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
        queue.stmt(
          `
          INSERT INTO songs (path, artist, album, title, genre, lyrics)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(path) DO UPDATE SET artist = excluded.artist, album = excluded.album,
            title = excluded.title, genre = excluded.genre, lyrics = COALESCE(excluded.lyrics, songs.lyrics)
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

        queue.stmt(
          `
          UPDATE folders SET thumbnail = ?, size = ?, modified = ?, duration = ?, scanned = 1, updatedAt = ? WHERE path = ?
        `
        ).run(thumb, stat.size, lastModified, duration, Date.now(), relPath);
        
        if (existingSong) {
          queue.stmt(
            `
            UPDATE songs SET artist = ?, album = ?, title = ?, genre = ?, lyrics = ? WHERE path = ?
          `
          ).run(artist, album, title, genre, lyrics, relPath);
        } else {
          queue.stmt(
            `
            INSERT INTO songs (path, artist, album, title, genre, lyrics)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(path) DO UPDATE SET artist = excluded.artist, album = excluded.album,
              title = excluded.title, genre = excluded.genre, lyrics = COALESCE(excluded.lyrics, songs.lyrics)
          `
          ).run(relPath, artist, album, title, genre, lyrics);
        }
        stats.updated++;
      } else if (existing.thumbnail !== thumb) {
        // ✅ THUMBNAIL CHANGED - Only thumbnail updated (NO metadata extraction!)
        queue.stmt(
          `
          UPDATE folders SET thumbnail = ?, scanned = 1, updatedAt = ? WHERE path = ?
        `
        ).run(thumb, Date.now(), relPath);
        stats.updated++;
      } else {
        // ✅ UNCHANGED FILE - Mark as scanned (NO metadata extraction!)
        queue.stmt(`UPDATE folders SET scanned = 1 WHERE path = ?`).run(relPath);
        stats.skipped++;
      }
    }
  }

  // Các lệnh ghi còn trong hàng đợi phải vào DB trước khi đếm/xoá bản ghi scanned = 0
  if (currentPath === "") queue.flush();

  // 🗑️ PHASE 3: Sweep orphaned records (scope-aware & shallow-aware cleanup)
  if (currentPath === "") {
    let orphanedCount;
    if (scopePath) {
      // Partial scan cleanup
      if (shallow) {
        // Shallow partial scan: only delete unscanned direct children
        orphanedCount = db.prepare(
          `SELECT COUNT(*) as count FROM folders WHERE scanned = 0 AND (path = ? OR (path LIKE ? ESCAPE '\\' AND path NOT LIKE ? ESCAPE '\\'))`
        ).get(scopePath, `${escapeLike(scopePath)}/%`, `${escapeLike(scopePath)}/%/%`).count;
        
        if (orphanedCount > 0) {
          // Delete orphaned songs first
          const deletedSongs = db.prepare(
            `DELETE FROM songs WHERE path IN (SELECT path FROM folders WHERE scanned = 0 AND (path = ? OR (path LIKE ? ESCAPE '\\' AND path NOT LIKE ? ESCAPE '\\')))`
          ).run(scopePath, `${escapeLike(scopePath)}/%`, `${escapeLike(scopePath)}/%/%`);
          
          // Delete orphaned folders
          db.prepare(
            `DELETE FROM folders WHERE scanned = 0 AND (path = ? OR (path LIKE ? ESCAPE '\\' AND path NOT LIKE ? ESCAPE '\\'))`
          ).run(scopePath, `${escapeLike(scopePath)}/%`, `${escapeLike(scopePath)}/%/%`);
          
          stats.deleted = orphanedCount;
          console.log(`🗑️ Deleted ${deletedSongs.changes} songs and ${stats.deleted} folders in scope (shallow): ${scopePath}`);
        }
      } else {
        // Deep partial scan: delete all unscanned items in scope
        orphanedCount = db.prepare(
          `SELECT COUNT(*) as count FROM folders WHERE scanned = 0 AND (path = ? OR path LIKE ? ESCAPE '\\')`
        ).get(scopePath, `${escapeLike(scopePath)}/%`).count;
        
        if (orphanedCount > 0) {
          // Delete orphaned songs first (foreign key constraint)
          const deletedSongs = db.prepare(
            `DELETE FROM songs WHERE path IN (SELECT path FROM folders WHERE scanned = 0 AND (path = ? OR path LIKE ? ESCAPE '\\'))`
          ).run(scopePath, `${escapeLike(scopePath)}/%`);
          
          // Delete orphaned folders
          db.prepare(
            `DELETE FROM folders WHERE scanned = 0 AND (path = ? OR path LIKE ? ESCAPE '\\')`
          ).run(scopePath, `${escapeLike(scopePath)}/%`);
          
          stats.deleted = orphanedCount;
          console.log(`🗑️ Deleted ${deletedSongs.changes} songs and ${stats.deleted} folders in scope (deep): ${scopePath}`);
        }
      }
    } else {
      // Full scan cleanup
      if (shallow) {
        // Shallow root scan: only delete root level unscanned items
        orphanedCount = db.prepare(`SELECT COUNT(*) as count FROM folders WHERE scanned = 0 AND path NOT LIKE ? ESCAPE '\\'`).get('%/%').count;
        if (orphanedCount > 0) {
          // Delete orphaned songs first
          const deletedSongs = db.prepare(`DELETE FROM songs WHERE path IN (SELECT path FROM folders WHERE scanned = 0 AND path NOT LIKE ? ESCAPE '\\')`).run('%/%');
          
          // Delete orphaned folders
          db.prepare(`DELETE FROM folders WHERE scanned = 0 AND path NOT LIKE ? ESCAPE '\\'`).run('%/%');
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

/**
 * Điểm vào giữ nguyên chữ ký cũ. Tạo hàng đợi ghi cho cả lần scan và luôn flush khi xong hoặc khi
 * lỗi giữa chừng (code cũ ghi ngay từng lệnh nên phần đã quét vẫn được lưu).
 */
async function scanMusicFolderToDB(dbkey, currentPath = "", stats = { inserted: 0, updated: 0, skipped: 0, deleted: 0 }, scopePath = "", shallow = false) {
  const queue = createWriteQueue(getMusicDB(dbkey));
  queue.thumbs = createThumbnailLookup();
  try {
    return await scanMusicLevel(dbkey, currentPath, stats, scopePath, shallow, queue);
  } finally {
    queue.flush();
  }
}

module.exports = { scanMusicFolderToDB };
