const fs = require("fs");
const path = require("path");
const { getRootPath } = require("./config");
const { getMovieDB } = require("./db");
const { FILE_EXTENSIONS } = require("../constants");

const ffmpeg = require("fluent-ffmpeg");
const ffprobe = require("ffprobe-static");
ffmpeg.setFfprobePath(ffprobe.path);

// Centralized extensions
const VIDEO_EXTS = (FILE_EXTENSIONS.VIDEO || []).map(e => e.toLowerCase());
const IMAGE_EXTS = (FILE_EXTENSIONS.IMAGE || []).map(e => e.toLowerCase());

// 🟢 Hàm tìm thumbnail đúng tên
function findThumbnail(thumbnailDir, baseName) {
  for (const ext of IMAGE_EXTS) {
    const thumbFile = path.join(thumbnailDir, baseName + ext);
    if (fs.existsSync(thumbFile)) {
      return path.posix.join(".thumbnail", baseName + ext); // Đường dẫn tương đối
    }
  }
  return null;
}

// 📏 Hàm đo duration video
function getVideoDuration(filePath) {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return resolve(null);
      const duration = parseFloat(metadata?.format?.duration);
      resolve(Math.floor(duration || 0));
    });
  });
}

async function scanMovieFolderToDB(
  dbkey,
  currentPath = "",
  stats = { inserted: 0, updated: 0, skipped: 0, deleted: 0 },
  scopePath = null, // 🎯 Partial scan: path to scan from (e.g., "Movies/Action")
  shallow = false // 📦 Shallow scan: don't recurse into subfolders
) {
  const db = getMovieDB(dbkey);
  const rootPath = getRootPath(dbkey);
  const basePath = path.join(rootPath, currentPath);

  // 🗑️ PHASE 1: Mark items as unscanned (scope-aware & shallow-aware)
  if (currentPath === "") {
    if (scopePath) {
      // 🎯 Partial scan
      if (shallow) {
        // Shallow: only mark direct children of scope
        db.prepare(`UPDATE folders SET scanned = 0 WHERE path = ? OR (path LIKE ? AND path NOT LIKE ?)`)
          .run(scopePath, `${scopePath}/%`, `${scopePath}/%/%`);
        console.log(`📦 Shallow partial scan: Marking scope "${scopePath}" (direct children only)`);
      } else {
        // Deep: mark scope and all descendants
        db.prepare(`UPDATE folders SET scanned = 0 WHERE path = ? OR path LIKE ?`)
          .run(scopePath, `${scopePath}/%`);
        console.log(`🎯 Deep partial scan: Marking scope "${scopePath}" (all descendants)`);
      }
    } else {
      // 🌍 Full scan
      if (shallow) {
        // Shallow: only mark root level items
        db.prepare(`UPDATE folders SET scanned = 0 WHERE path NOT LIKE ?`).run('%/%');
        console.log(`📦 Shallow full scan: Marking root level items only`);
      } else {
        // Deep: mark all items
        db.prepare(`UPDATE folders SET scanned = 0`).run();
        console.log(`🎯 Deep full scan: Marking all items`);
      }
    }
  }

  if (!fs.existsSync(basePath)) return stats;

  const entries = fs.readdirSync(basePath, { withFileTypes: true });

  for (const entry of entries) {
    // ❌ Skip folder .thumbnail
    if (entry.isDirectory() && entry.name === ".thumbnail") continue;
    const relPath = path.posix.join(currentPath, entry.name);

    // 🎯 Scope boundary check for partial scan
    if (scopePath) {
      const isInScope = relPath === scopePath || relPath.startsWith(scopePath + "/");
      const isParentOfScope = scopePath.startsWith(relPath + "/");
      
      // Skip if not in scope and not a parent folder of scope
      if (!isInScope && !isParentOfScope) {
        continue;
      }
      
      // If this is a parent folder of scope, mark it as scanned (preserve it)
      if (isParentOfScope && !isInScope) {
        const existing = db.prepare(`SELECT * FROM folders WHERE path = ?`).get(relPath);
        if (existing) {
          db.prepare(`UPDATE folders SET scanned = 1 WHERE path = ?`).run(relPath);
        }
        // Continue scanning to reach the scope path
        if (entry.isDirectory()) {
          await scanMovieFolderToDB(dbkey, relPath, stats, scopePath);
        }
        continue;
      }
    }

    // 📁 FOLDER
    if (entry.isDirectory()) {
      // Tìm thumbnail trong .thumbnail cùng folder, tên trùng tên folder
      let thumb = null;
      const thumbDir = path.join(basePath, entry.name, ".thumbnail");
      if (fs.existsSync(thumbDir)) {
        thumb = findThumbnail(thumbDir, entry.name);
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
        // ✅ CHANGED - Thumbnail updated
        db.prepare(
          `
          UPDATE folders SET thumbnail = ?, scanned = 1, updatedAt = ? WHERE path = ?
        `
        ).run(thumb, Date.now(), relPath);
        stats.updated++;
      } else {
        // ✅ UNCHANGED - Mark as scanned
        db.prepare(`UPDATE folders SET scanned = 1 WHERE path = ?`).run(relPath);
        stats.skipped++;
      }

      // 📦 Shallow scan: Skip recursion into subfolders
      if (!shallow) {
        await scanMovieFolderToDB(dbkey, relPath, stats, scopePath, shallow); // Đệ quy với scopePath
      }
    }

    // 🎞 VIDEO FILE
    if (
      entry.isFile() &&
      VIDEO_EXTS.includes(path.extname(entry.name).toLowerCase())
    ) {
      let thumb = null;
      const baseName = path.basename(entry.name, path.extname(entry.name));
      // Tìm thumbnail trong .thumbnail (cùng folder với file), tên trùng file
      const thumbDir = path.join(basePath, ".thumbnail");
      if (fs.existsSync(thumbDir)) {
        thumb = findThumbnail(thumbDir, baseName);
      }

      const fullPath = path.join(basePath, entry.name);
      const stat = fs.statSync(fullPath);
      const lastModified = stat.mtimeMs;

      const existing = db
        .prepare(`SELECT * FROM folders WHERE path = ?`)
        .get(relPath);

      if (!existing) {
        // ✅ NEW FILE
        const duration = await getVideoDuration(fullPath);
        db.prepare(
          `
          INSERT INTO folders (name, path, thumbnail, type, size, modified, duration, scanned, createdAt, updatedAt)
          VALUES (?, ?, ?, 'video', ?, ?, ?, 1, ?, ?)
        `
        ).run(
          entry.name,
          relPath,
          thumb,
          stat.size,
          lastModified,
          duration,
          Date.now(),
          Date.now()
        );
        stats.inserted++;
      } else if (existing.modified !== lastModified) {
        // ✅ CHANGED FILE - File was modified
        const duration = await getVideoDuration(fullPath);
        db.prepare(
          `
          UPDATE folders SET thumbnail = ?, size = ?, modified = ?, duration = ?, scanned = 1, updatedAt = ? WHERE path = ?
        `
        ).run(thumb, stat.size, lastModified, duration, Date.now(), relPath);
        stats.updated++;
      } else if (existing.thumbnail !== thumb) {
        // ✅ THUMBNAIL CHANGED - Only thumbnail updated
        db.prepare(
          `
          UPDATE folders SET thumbnail = ?, scanned = 1, updatedAt = ? WHERE path = ?
        `
        ).run(thumb, Date.now(), relPath);
        stats.updated++;
      } else {
        // ✅ UNCHANGED FILE - Mark as scanned
        db.prepare(`UPDATE folders SET scanned = 1 WHERE path = ?`).run(relPath);
        stats.skipped++;
      }
    }
  }

  // 🗑️ PHASE 3: Sweep orphaned records (scope-aware & shallow-aware cleanup)
  if (currentPath === "") {
    if (scopePath) {
      // 🎯 Partial scan cleanup
      if (shallow) {
        // Shallow: only delete unscanned direct children
        const orphanedCount = db.prepare(
          `SELECT COUNT(*) as count FROM folders WHERE scanned = 0 AND (path = ? OR (path LIKE ? AND path NOT LIKE ?))`
        ).get(scopePath, `${scopePath}/%`, `${scopePath}/%/%`).count;
        
        if (orphanedCount > 0) {
          db.prepare(
            `DELETE FROM folders WHERE scanned = 0 AND (path = ? OR (path LIKE ? AND path NOT LIKE ?))`
          ).run(scopePath, `${scopePath}/%`, `${scopePath}/%/%`);
          stats.deleted = orphanedCount;
          console.log(`🗑️ Deleted ${stats.deleted} orphaned movie records in scope (shallow): "${scopePath}"`);
        }
      } else {
        // Deep: delete all unscanned items in scope
        const orphanedCount = db.prepare(
          `SELECT COUNT(*) as count FROM folders WHERE scanned = 0 AND (path = ? OR path LIKE ?)`
        ).get(scopePath, `${scopePath}/%`).count;
        
        if (orphanedCount > 0) {
          db.prepare(
            `DELETE FROM folders WHERE scanned = 0 AND (path = ? OR path LIKE ?)`
          ).run(scopePath, `${scopePath}/%`);
          stats.deleted = orphanedCount;
          console.log(`🗑️ Deleted ${stats.deleted} orphaned movie records in scope (deep): "${scopePath}"`);
        }
      }
    } else {
      // 🌍 Full scan cleanup
      if (shallow) {
        // Shallow: only delete root level unscanned items
        const orphanedCount = db.prepare(
          `SELECT COUNT(*) as count FROM folders WHERE scanned = 0 AND path NOT LIKE ?`
        ).get('%/%').count;
        
        if (orphanedCount > 0) {
          db.prepare(`DELETE FROM folders WHERE scanned = 0 AND path NOT LIKE ?`).run('%/%');
          stats.deleted = orphanedCount;
          console.log(`🗑️ Deleted ${stats.deleted} orphaned root movie records (shallow)`);
        }
      } else {
        // Deep: delete all unscanned items
        const orphanedCount = db.prepare(`SELECT COUNT(*) as count FROM folders WHERE scanned = 0`).get().count;
        if (orphanedCount > 0) {
          db.prepare(`DELETE FROM folders WHERE scanned = 0`).run();
          stats.deleted = orphanedCount;
          console.log(`🗑️ Deleted ${stats.deleted} orphaned movie records (deep)`);
        }
      }
    }
  }

  return stats;
}

module.exports = { scanMovieFolderToDB };
