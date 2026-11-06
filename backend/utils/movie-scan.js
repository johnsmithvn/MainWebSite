const fs = require("fs");
const path = require("path");
const { getRootPath } = require("./config");
const { getMovieDB } = require("./db");
const { FILE_EXTENSIONS } = require("../constants");

const ffmpeg = require("fluent-ffmpeg");
const ffprobe = require("ffprobe-static");
const { escapeLike } = require("./sqlLike");
const { createWriteQueue, createThumbnailLookup, pathExists } = require("./scanHelpers");
ffmpeg.setFfprobePath(ffprobe.path);

// Centralized extensions
const VIDEO_EXTS = (FILE_EXTENSIONS.VIDEO || []).map(e => e.toLowerCase());
const IMAGE_EXTS = (FILE_EXTENSIONS.IMAGE || []).map(e => e.toLowerCase());


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

async function scanMovieLevel(
  dbkey,
  currentPath = "",
  stats = { inserted: 0, updated: 0, skipped: 0, deleted: 0 },
  scopePath = null, // 🎯 Partial scan: path to scan from (e.g., "Movies/Action")
  shallow = false, // 📦 Shallow scan: don't recurse into subfolders
  queue // ⚡ hàng đợi ghi theo lô + tra thumbnail (PF1, PF10) — do scanMovieFolderToDB tạo
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
        db.prepare(`UPDATE folders SET scanned = 0 WHERE path = ? OR (path LIKE ? ESCAPE '\\' AND path NOT LIKE ? ESCAPE '\\')`)
          .run(scopePath, `${escapeLike(scopePath)}/%`, `${escapeLike(scopePath)}/%/%`);
        console.log(`📦 Shallow partial scan: Marking scope "${scopePath}" (direct children only)`);
      } else {
        // Deep: mark scope and all descendants
        db.prepare(`UPDATE folders SET scanned = 0 WHERE path = ? OR path LIKE ? ESCAPE '\\'`)
          .run(scopePath, `${escapeLike(scopePath)}/%`);
        console.log(`🎯 Deep partial scan: Marking scope "${scopePath}" (all descendants)`);
      }
    } else {
      // 🌍 Full scan
      if (shallow) {
        // Shallow: only mark root level items
        db.prepare(`UPDATE folders SET scanned = 0 WHERE path NOT LIKE ? ESCAPE '\\'`).run('%/%');
        console.log(`📦 Shallow full scan: Marking root level items only`);
      } else {
        // Deep: mark all items
        db.prepare(`UPDATE folders SET scanned = 0`).run();
        console.log(`🎯 Deep full scan: Marking all items`);
      }
    }
  }

  if (!(await pathExists(basePath))) return stats;

  const entries = await fs.promises.readdir(basePath, { withFileTypes: true });

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
        const existing = queue.stmt(`SELECT * FROM folders WHERE path = ?`).get(relPath);
        if (existing) {
          queue.stmt(`UPDATE folders SET scanned = 1 WHERE path = ?`).run(relPath);
        }
        // Continue scanning to reach the scope path (giữ nguyên chế độ shallow — ISSUES D1)
        if (entry.isDirectory()) {
          await scanMovieLevel(dbkey, relPath, stats, scopePath, shallow, queue);
        }
        continue;
      }
    }

    // 📁 FOLDER
    if (entry.isDirectory()) {
      // Tìm thumbnail trong .thumbnail cùng folder, tên trùng tên folder
      let thumb = null;
      const thumbDir = path.join(basePath, entry.name, ".thumbnail");
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
        // ✅ CHANGED - Thumbnail updated
        queue.stmt(
          `
          UPDATE folders SET thumbnail = ?, scanned = 1, updatedAt = ? WHERE path = ?
        `
        ).run(thumb, Date.now(), relPath);
        stats.updated++;
      } else {
        // ✅ UNCHANGED - Mark as scanned
        queue.stmt(`UPDATE folders SET scanned = 1 WHERE path = ?`).run(relPath);
        stats.skipped++;
      }

      // 📦 Shallow scan: không đệ quy, NGOẠI TRỪ chính folder scope — phải đi vào một cấp để
      // xử lý các con trực tiếp đã bị đánh dấu ở phase 1, nếu không phase 3 xoá nhầm chúng (ISSUES D1)
      if (!shallow || relPath === scopePath) {
        await scanMovieLevel(dbkey, relPath, stats, scopePath, shallow, queue); // Đệ quy với scopePath
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
      thumb = await queue.thumbs.find(thumbDir, baseName, IMAGE_EXTS);

      const fullPath = path.join(basePath, entry.name);
      const stat = await fs.promises.stat(fullPath);
      const lastModified = stat.mtimeMs;

      const existing = queue
        .stmt(`SELECT * FROM folders WHERE path = ?`)
        .get(relPath);

      if (!existing) {
        // ✅ NEW FILE
        const duration = await getVideoDuration(fullPath);
        queue.stmt(
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
        queue.stmt(
          `
          UPDATE folders SET thumbnail = ?, size = ?, modified = ?, duration = ?, scanned = 1, updatedAt = ? WHERE path = ?
        `
        ).run(thumb, stat.size, lastModified, duration, Date.now(), relPath);
        stats.updated++;
      } else if (existing.thumbnail !== thumb) {
        // ✅ THUMBNAIL CHANGED - Only thumbnail updated
        queue.stmt(
          `
          UPDATE folders SET thumbnail = ?, scanned = 1, updatedAt = ? WHERE path = ?
        `
        ).run(thumb, Date.now(), relPath);
        stats.updated++;
      } else {
        // ✅ UNCHANGED FILE - Mark as scanned
        queue.stmt(`UPDATE folders SET scanned = 1 WHERE path = ?`).run(relPath);
        stats.skipped++;
      }
    }
  }

  // Các lệnh ghi còn trong hàng đợi phải vào DB trước khi đếm/xoá bản ghi scanned = 0
  if (currentPath === "") queue.flush();

  // 🗑️ PHASE 3: Sweep orphaned records (scope-aware & shallow-aware cleanup)
  if (currentPath === "") {
    if (scopePath) {
      // 🎯 Partial scan cleanup
      if (shallow) {
        // Shallow: only delete unscanned direct children
        const orphanedCount = db.prepare(
          `SELECT COUNT(*) as count FROM folders WHERE scanned = 0 AND (path = ? OR (path LIKE ? ESCAPE '\\' AND path NOT LIKE ? ESCAPE '\\'))`
        ).get(scopePath, `${escapeLike(scopePath)}/%`, `${escapeLike(scopePath)}/%/%`).count;
        
        if (orphanedCount > 0) {
          db.prepare(
            `DELETE FROM folders WHERE scanned = 0 AND (path = ? OR (path LIKE ? ESCAPE '\\' AND path NOT LIKE ? ESCAPE '\\'))`
          ).run(scopePath, `${escapeLike(scopePath)}/%`, `${escapeLike(scopePath)}/%/%`);
          stats.deleted = orphanedCount;
          console.log(`🗑️ Deleted ${stats.deleted} orphaned movie records in scope (shallow): "${scopePath}"`);
        }
      } else {
        // Deep: delete all unscanned items in scope
        const orphanedCount = db.prepare(
          `SELECT COUNT(*) as count FROM folders WHERE scanned = 0 AND (path = ? OR path LIKE ? ESCAPE '\\')`
        ).get(scopePath, `${escapeLike(scopePath)}/%`).count;
        
        if (orphanedCount > 0) {
          db.prepare(
            `DELETE FROM folders WHERE scanned = 0 AND (path = ? OR path LIKE ? ESCAPE '\\')`
          ).run(scopePath, `${escapeLike(scopePath)}/%`);
          stats.deleted = orphanedCount;
          console.log(`🗑️ Deleted ${stats.deleted} orphaned movie records in scope (deep): "${scopePath}"`);
        }
      }
    } else {
      // 🌍 Full scan cleanup
      if (shallow) {
        // Shallow: only delete root level unscanned items
        const orphanedCount = db.prepare(
          `SELECT COUNT(*) as count FROM folders WHERE scanned = 0 AND path NOT LIKE ? ESCAPE '\\'`
        ).get('%/%').count;
        
        if (orphanedCount > 0) {
          db.prepare(`DELETE FROM folders WHERE scanned = 0 AND path NOT LIKE ? ESCAPE '\\'`).run('%/%');
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

/**
 * Điểm vào giữ nguyên chữ ký cũ. Tạo hàng đợi ghi cho cả lần scan và luôn flush khi xong hoặc khi
 * lỗi giữa chừng (code cũ ghi ngay từng lệnh nên phần đã quét vẫn được lưu).
 */
async function scanMovieFolderToDB(dbkey, currentPath = "", stats = { inserted: 0, updated: 0, skipped: 0, deleted: 0 }, scopePath = null, shallow = false) {
  const queue = createWriteQueue(getMovieDB(dbkey));
  queue.thumbs = createThumbnailLookup();
  try {
    return await scanMovieLevel(dbkey, currentPath, stats, scopePath, shallow, queue);
  } finally {
    queue.flush();
  }
}

module.exports = { scanMovieFolderToDB };
