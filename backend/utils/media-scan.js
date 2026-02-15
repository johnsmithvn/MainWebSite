// 📁 backend/utils/media-scan.js
// 📸 Media Gallery Scanner (Images + Videos like Google Photos)

const fs = require("fs");
const path = require("path");
const { getRootPath } = require("./config");
const { getMediaDB } = require("./db");
const { FILE_EXTENSIONS } = require("../constants");

const ffmpeg = require("fluent-ffmpeg");
const ffprobe = require("ffprobe-static");
ffmpeg.setFfprobePath(ffprobe.path);

// Use centralized file extensions from constants and normalize to lowercase
const IMAGE_EXTS = (FILE_EXTENSIONS.IMAGE || []).map(e => e.toLowerCase());
const VIDEO_EXTS = (FILE_EXTENSIONS.VIDEO || []).map(e => e.toLowerCase());
const AUDIO_EXTS = (FILE_EXTENSIONS.AUDIO || []).map(e => e.toLowerCase());
const PDF_EXTS = (FILE_EXTENSIONS.PDF || []).map(e => e.toLowerCase());
const TEXT_EXTS = (FILE_EXTENSIONS.TEXT || []).map(e => e.toLowerCase());
const DOCUMENT_EXTS = (FILE_EXTENSIONS.DOCUMENT || []).map(e => e.toLowerCase());
const ARCHIVE_EXTS = (FILE_EXTENSIONS.ARCHIVE || []).map(e => e.toLowerCase());
const CODE_EXTS = (FILE_EXTENSIONS.CODE || []).map(e => e.toLowerCase());

// Helper: Determine file type from extension
function getFileType(ext) {
  ext = ext.toLowerCase();
  if (IMAGE_EXTS.includes(ext)) return 'image';
  if (VIDEO_EXTS.includes(ext)) return 'video';
  if (AUDIO_EXTS.includes(ext)) return 'audio';
  if (PDF_EXTS.includes(ext)) return 'pdf';
  if (TEXT_EXTS.includes(ext)) return 'text';
  if (DOCUMENT_EXTS.includes(ext)) return 'document';
  if (ARCHIVE_EXTS.includes(ext)) return 'archive';
  if (CODE_EXTS.includes(ext)) return 'code';
  return 'other';
}

// 🟢 Helper: Tìm thumbnail trong .thumbnail folder
function findThumbnail(thumbnailDir, baseName) {
  for (const ext of IMAGE_EXTS) {
    const thumbFile = path.join(thumbnailDir, baseName + ext);
    if (fs.existsSync(thumbFile)) {
      return path.posix.join(".thumbnail", baseName + ext);
    }
  }
  return null;
}

// 📏 Helper: Get video duration
function getVideoDuration(filePath) {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return resolve(null);
      const duration = parseFloat(metadata?.format?.duration);
      resolve(Math.floor(duration || 0));
    });
  });
}

// 🖼️ Helper: Get image dimensions
function getImageDimensions(filePath) {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return resolve({ width: null, height: null });
      const stream = metadata?.streams?.[0];
      resolve({
        width: stream?.width || null,
        height: stream?.height || null
      });
    });
  });
}

// 📅 Helper: Extract date from EXIF or filename
function extractDateTaken(filePath, fileName) {
  // TODO: Implement EXIF reading for proper date_taken
  // For now, use file modified time
  const stat = fs.statSync(filePath);
  return stat.mtimeMs;
}

/**
 * 🔍 Scan media folder recursively
 * @param {string} dbkey - Database key (MEDIA_PHOTOS, etc.)
 * @param {string} currentPath - Current relative path
 * @param {object} stats - Scan statistics
 * @param {string} scopePath - 🎯 Partial scan: path to scan from (e.g., "Photos/2024")
 * @param {boolean} shallow - 📦 Shallow scan: don't recurse into subfolders
 */
async function scanMediaFolderToDB(
  dbkey,
  currentPath = "",
  stats = { folders: 0, inserted: 0, updated: 0, skipped: 0, deleted: 0 },
  scopePath = null,
  shallow = false
) {
  const db = getMediaDB(dbkey);
  const rootPath = getRootPath(dbkey);
  const basePath = path.join(rootPath, currentPath);

  // 🗑️ PHASE 1: Mark items as unscanned (scope-aware & shallow-aware)
  if (currentPath === "") {
    if (scopePath) {
      // 🎯 Partial scan
      if (shallow) {
        // Shallow: only mark direct children of scope
        db.prepare(`UPDATE media_items SET scanned = 0 WHERE path = ? OR (path LIKE ? AND path NOT LIKE ?)`)
          .run(scopePath, `${scopePath}/%`, `${scopePath}/%/%`);
        db.prepare(`UPDATE folders SET scanned = 0 WHERE path = ? OR (path LIKE ? AND path NOT LIKE ?)`)
          .run(scopePath, `${scopePath}/%`, `${scopePath}/%/%`);
        console.log(`📦 Shallow partial scan: Marking scope "${scopePath}" (direct children only)`);
      } else {
        // Deep: mark scope and all descendants
        db.prepare(`UPDATE media_items SET scanned = 0 WHERE path = ? OR path LIKE ?`)
          .run(scopePath, `${scopePath}/%`);
        db.prepare(`UPDATE folders SET scanned = 0 WHERE path = ? OR path LIKE ?`)
          .run(scopePath, `${scopePath}/%`);
        console.log(`🎯 Deep partial scan: Marking scope "${scopePath}" (all descendants)`);
      }
    } else {
      // 🌍 Full scan
      if (shallow) {
        // Shallow: only mark root level items
        db.prepare(`UPDATE media_items SET scanned = 0 WHERE path NOT LIKE ?`).run('%/%');
        db.prepare(`UPDATE folders SET scanned = 0 WHERE path NOT LIKE ?`).run('%/%');
        console.log(`📦 Shallow full scan: Marking root level items only`);
      } else {
        // Deep: mark all items
        db.prepare(`UPDATE media_items SET scanned = 0`).run();
        db.prepare(`UPDATE folders SET scanned = 0`).run();
        console.log(`🎯 Deep full scan: Marking all items`);
      }
    }
  }

  if (!fs.existsSync(basePath)) return stats;

  const entries = fs.readdirSync(basePath, { withFileTypes: true });

  // 📊 Count items in this folder
  let itemCount = 0;
  let firstImagePath = null;

  for (const entry of entries) {
    // ❌ Skip .thumbnail folders
    if (entry.isDirectory() && entry.name === ".thumbnail") continue;
    
    const relPath = path.posix.join(currentPath, entry.name);
    const fullPath = path.join(basePath, entry.name);

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
        const existingItem = db.prepare(`SELECT * FROM media_items WHERE path = ?`).get(relPath);
        if (existingItem) {
          db.prepare(`UPDATE media_items SET scanned = 1 WHERE path = ?`).run(relPath);
        }
        const existingFolder = db.prepare(`SELECT * FROM folders WHERE root = ? AND path = ?`).get(dbkey, relPath);
        if (existingFolder) {
          db.prepare(`UPDATE folders SET scanned = 1 WHERE path = ?`).run(relPath);
        }
        // Continue scanning to reach the scope path
        if (entry.isDirectory()) {
          await scanMediaFolderToDB(dbkey, relPath, stats, scopePath, shallow);
        }
        continue;
      }
    }

    // 📁 FOLDER - Store and recurse
    if (entry.isDirectory()) {
      // 📦 Shallow scan: Skip recursion into subfolders
      if (!shallow) {
        // Recurse first to get subfolder's thumbnail
        await scanMediaFolderToDB(dbkey, relPath, stats, scopePath, shallow);
      }
      
      // Find first image in .thumbnail of this subfolder
      let folderThumb = null;
      const subThumbDir = path.join(fullPath, ".thumbnail");
      if (fs.existsSync(subThumbDir)) {
        const thumbFiles = fs.readdirSync(subThumbDir).filter(f => 
          IMAGE_EXTS.includes(path.extname(f).toLowerCase())
        );
        if (thumbFiles.length > 0) {
          folderThumb = thumbFiles[0];
        }
      }

      // Count items in subfolder
      const folderItemCount = db.prepare(
        `SELECT COUNT(*) as count FROM media_items WHERE path LIKE ?`
      ).get(`${relPath}/%`).count;

      // Insert/update folder
      const existingFolder = db.prepare(
        `SELECT * FROM folders WHERE root = ? AND path = ?`
      ).get(dbkey, relPath);

      if (!existingFolder) {
        db.prepare(
          `INSERT INTO folders (root, path, name, thumbnail, itemCount, scanned, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, 1, ?, ?)`
        ).run(dbkey, relPath, entry.name, folderThumb, folderItemCount, Date.now(), Date.now());
        stats.folders++;
      } else {
        db.prepare(
          `UPDATE folders SET thumbnail = ?, itemCount = ?, scanned = 1, updatedAt = ? WHERE root = ? AND path = ?`
        ).run(folderThumb, folderItemCount, Date.now(), dbkey, relPath);
      }

      continue;
    }

    // 🖼️ IMAGE FILE
    if (IMAGE_EXTS.includes(path.extname(entry.name).toLowerCase())) {
      itemCount++;
      if (!firstImagePath) firstImagePath = relPath;

      const stat = fs.statSync(fullPath);
      const lastModified = stat.mtimeMs;
      const dateTaken = extractDateTaken(fullPath, entry.name);
      
      let thumb = null;
      const baseName = path.basename(entry.name, path.extname(entry.name));
      const thumbDir = path.join(basePath, ".thumbnail");
      if (fs.existsSync(thumbDir)) {
        thumb = findThumbnail(thumbDir, baseName);
      }

      const existing = db.prepare(`SELECT * FROM media_items WHERE path = ?`).get(relPath);

      if (!existing) {
        // ✅ NEW IMAGE
        const { width, height } = await getImageDimensions(fullPath);
        db.prepare(
          `INSERT INTO media_items (name, path, thumbnail, type, size, modified, width, height, date_taken, scanned, createdAt, updatedAt)
           VALUES (?, ?, ?, 'image', ?, ?, ?, ?, ?, 1, ?, ?)`
        ).run(entry.name, relPath, thumb, stat.size, lastModified, width, height, dateTaken, Date.now(), Date.now());
        stats.inserted++;
      } else if (existing.modified !== lastModified) {
        // ✅ CHANGED IMAGE
        const { width, height } = await getImageDimensions(fullPath);
        db.prepare(
          `UPDATE media_items SET thumbnail = ?, size = ?, modified = ?, width = ?, height = ?, date_taken = ?, scanned = 1, updatedAt = ? WHERE path = ?`
        ).run(thumb, stat.size, lastModified, width, height, dateTaken, Date.now(), relPath);
        stats.updated++;
      } else if (existing.thumbnail !== thumb) {
        // ✅ THUMBNAIL CHANGED
        db.prepare(`UPDATE media_items SET thumbnail = ?, scanned = 1, updatedAt = ? WHERE path = ?`).run(thumb, Date.now(), relPath);
        stats.updated++;
      } else {
        // ✅ UNCHANGED
        db.prepare(`UPDATE media_items SET scanned = 1 WHERE path = ?`).run(relPath);
        stats.skipped++;
      }
    }

    // 🎞️ VIDEO FILE
    if (VIDEO_EXTS.includes(path.extname(entry.name).toLowerCase())) {
      itemCount++;

      const stat = fs.statSync(fullPath);
      const lastModified = stat.mtimeMs;
      const dateTaken = extractDateTaken(fullPath, entry.name);
      
      let thumb = null;
      const baseName = path.basename(entry.name, path.extname(entry.name));
      const thumbDir = path.join(basePath, ".thumbnail");
      if (fs.existsSync(thumbDir)) {
        thumb = findThumbnail(thumbDir, baseName);
      }

      const existing = db.prepare(`SELECT * FROM media_items WHERE path = ?`).get(relPath);

      if (!existing) {
        // ✅ NEW VIDEO
        const duration = await getVideoDuration(fullPath);
        const { width, height } = await getImageDimensions(fullPath);
        db.prepare(
          `INSERT INTO media_items (name, path, thumbnail, type, size, modified, width, height, duration, date_taken, scanned, createdAt, updatedAt)
           VALUES (?, ?, ?, 'video', ?, ?, ?, ?, ?, ?, 1, ?, ?)`
        ).run(entry.name, relPath, thumb, stat.size, lastModified, width, height, duration, dateTaken, Date.now(), Date.now());
        stats.inserted++;
      } else if (existing.modified !== lastModified) {
        // ✅ CHANGED VIDEO
        const duration = await getVideoDuration(fullPath);
        const { width, height } = await getImageDimensions(fullPath);
        db.prepare(
          `UPDATE media_items SET thumbnail = ?, size = ?, modified = ?, width = ?, height = ?, duration = ?, date_taken = ?, scanned = 1, updatedAt = ? WHERE path = ?`
        ).run(thumb, stat.size, lastModified, width, height, duration, dateTaken, Date.now(), relPath);
        stats.updated++;
      } else if (existing.thumbnail !== thumb) {
        // ✅ THUMBNAIL CHANGED
        db.prepare(`UPDATE media_items SET thumbnail = ?, scanned = 1, updatedAt = ? WHERE path = ?`).run(thumb, Date.now(), relPath);
        stats.updated++;
      } else {
        // ✅ UNCHANGED
        db.prepare(`UPDATE media_items SET scanned = 1 WHERE path = ?`).run(relPath);
        stats.skipped++;
      }
      continue;
    }

    // 📄 ALL OTHER FILES (audio, pdf, text, document, archive, code, other)
    const ext = path.extname(entry.name).toLowerCase();
    const fileType = getFileType(ext);
    
    if (fileType !== 'image' && fileType !== 'video' && ext) {
      itemCount++;

      const stat = fs.statSync(fullPath);
      const lastModified = stat.mtimeMs;
      const dateTaken = extractDateTaken(fullPath, entry.name);
      
      let thumb = null;
      const baseName = path.basename(entry.name, path.extname(entry.name));
      const thumbDir = path.join(basePath, ".thumbnail");
      if (fs.existsSync(thumbDir)) {
        thumb = findThumbnail(thumbDir, baseName);
      }

      const existing = db.prepare(`SELECT * FROM media_items WHERE path = ?`).get(relPath);

      if (!existing) {
        // ✅ NEW FILE
        db.prepare(
          `INSERT INTO media_items (name, path, thumbnail, type, size, modified, date_taken, scanned, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
        ).run(entry.name, relPath, thumb, fileType, stat.size, lastModified, dateTaken, Date.now(), Date.now());
        stats.inserted++;
      } else if (existing.modified !== lastModified) {
        // ✅ CHANGED FILE
        db.prepare(
          `UPDATE media_items SET thumbnail = ?, size = ?, modified = ?, date_taken = ?, scanned = 1, updatedAt = ? WHERE path = ?`
        ).run(thumb, stat.size, lastModified, dateTaken, Date.now(), relPath);
        stats.updated++;
      } else if (existing.thumbnail !== thumb) {
        // ✅ THUMBNAIL CHANGED
        db.prepare(`UPDATE media_items SET thumbnail = ?, scanned = 1, updatedAt = ? WHERE path = ?`).run(thumb, Date.now(), relPath);
        stats.updated++;
      } else {
        // ✅ UNCHANGED
        db.prepare(`UPDATE media_items SET scanned = 1 WHERE path = ?`).run(relPath);
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
        const orphanedItems = db.prepare(
          `SELECT COUNT(*) as count FROM media_items WHERE scanned = 0 AND (path = ? OR (path LIKE ? AND path NOT LIKE ?))`
        ).get(scopePath, `${scopePath}/%`, `${scopePath}/%/%`).count;
        
        if (orphanedItems > 0) {
          db.prepare(
            `DELETE FROM media_items WHERE scanned = 0 AND (path = ? OR (path LIKE ? AND path NOT LIKE ?))`
          ).run(scopePath, `${scopePath}/%`, `${scopePath}/%/%`);
          stats.deleted += orphanedItems;
          console.log(`🗑️ Deleted ${orphanedItems} orphaned media items in scope (shallow): "${scopePath}"`);
        }

        const orphanedFolders = db.prepare(
          `SELECT COUNT(*) as count FROM folders WHERE scanned = 0 AND (path = ? OR (path LIKE ? AND path NOT LIKE ?))`
        ).get(scopePath, `${scopePath}/%`, `${scopePath}/%/%`).count;
        
        if (orphanedFolders > 0) {
          db.prepare(
            `DELETE FROM folders WHERE scanned = 0 AND (path = ? OR (path LIKE ? AND path NOT LIKE ?))`
          ).run(scopePath, `${scopePath}/%`, `${scopePath}/%/%`);
          stats.deleted += orphanedFolders;
          console.log(`🗑️ Deleted ${orphanedFolders} orphaned folders in scope (shallow): "${scopePath}"`);
        }
      } else {
        // Deep: delete all unscanned items in scope
        const orphanedItems = db.prepare(
          `SELECT COUNT(*) as count FROM media_items WHERE scanned = 0 AND (path = ? OR path LIKE ?)`
        ).get(scopePath, `${scopePath}/%`).count;
        
        if (orphanedItems > 0) {
          db.prepare(
            `DELETE FROM media_items WHERE scanned = 0 AND (path = ? OR path LIKE ?)`
          ).run(scopePath, `${scopePath}/%`);
          stats.deleted += orphanedItems;
          console.log(`🗑️ Deleted ${orphanedItems} orphaned media items in scope (deep): "${scopePath}"`);
        }

        const orphanedFolders = db.prepare(
          `SELECT COUNT(*) as count FROM folders WHERE scanned = 0 AND (path = ? OR path LIKE ?)`
        ).get(scopePath, `${scopePath}/%`).count;
        
        if (orphanedFolders > 0) {
          db.prepare(
            `DELETE FROM folders WHERE scanned = 0 AND (path = ? OR path LIKE ?)`
          ).run(scopePath, `${scopePath}/%`);
          stats.deleted += orphanedFolders;
          console.log(`🗑️ Deleted ${orphanedFolders} orphaned folders in scope (deep): "${scopePath}"`);
        }
      }
    } else {
      // 🌍 Full scan cleanup
      if (shallow) {
        // Shallow: only delete root level unscanned items
        const orphanedItems = db.prepare(
          `SELECT COUNT(*) as count FROM media_items WHERE scanned = 0 AND path NOT LIKE ?`
        ).get('%/%').count;
        
        if (orphanedItems > 0) {
          db.prepare(`DELETE FROM media_items WHERE scanned = 0 AND path NOT LIKE ?`).run('%/%');
          stats.deleted += orphanedItems;
          console.log(`🗑️ Deleted ${orphanedItems} orphaned root media items (shallow)`);
        }

        const orphanedFolders = db.prepare(
          `SELECT COUNT(*) as count FROM folders WHERE scanned = 0 AND path NOT LIKE ?`
        ).get('%/%').count;
        
        if (orphanedFolders > 0) {
          db.prepare(`DELETE FROM folders WHERE scanned = 0 AND path NOT LIKE ?`).run('%/%');
          stats.deleted += orphanedFolders;
          console.log(`🗑️ Deleted ${orphanedFolders} orphaned root folders (shallow)`);
        }
      } else {
        // Deep: delete all unscanned items
        const orphanedItems = db.prepare(`SELECT COUNT(*) as count FROM media_items WHERE scanned = 0`).get().count;
        if (orphanedItems > 0) {
          db.prepare(`DELETE FROM media_items WHERE scanned = 0`).run();
          stats.deleted += orphanedItems;
          console.log(`🗑️ Deleted ${orphanedItems} orphaned media items (deep)`);
        }

        const orphanedFolders = db.prepare(`SELECT COUNT(*) as count FROM folders WHERE scanned = 0`).get().count;
        if (orphanedFolders > 0) {
          db.prepare(`DELETE FROM folders WHERE scanned = 0`).run();
          stats.deleted += orphanedFolders;
          console.log(`🗑️ Deleted ${orphanedFolders} orphaned folders (deep)`);
        }
      }
    }
  }

  return stats;
}

module.exports = { scanMediaFolderToDB };
