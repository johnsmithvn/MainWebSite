// 📁 backend/utils/media-scan.js
// 📸 Media Gallery Scanner (Images + Videos like Google Photos)

const fs = require("fs");
const path = require("path");
const { getRootPath } = require("./config");
const { getMediaDB } = require("./db");

const ffmpeg = require("fluent-ffmpeg");
const ffprobe = require("ffprobe-static");
ffmpeg.setFfprobePath(ffprobe.path);

const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif", ".bmp", ".heic", ".heif"];
const VIDEO_EXTS = [".mp4", ".mkv", ".avi", ".webm", ".mov", ".m4v", ".3gp"];

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
 */
async function scanMediaFolderToDB(
  dbkey,
  currentPath = "",
  stats = { folders: 0, inserted: 0, updated: 0, skipped: 0, deleted: 0 }
) {
  const db = getMediaDB(dbkey);
  const rootPath = getRootPath(dbkey);
  const basePath = path.join(rootPath, currentPath);

  // 🗑️ PHASE 1: Mark all as unscanned (only on root scan)
  if (currentPath === "") {
    db.prepare(`UPDATE media_items SET scanned = 0`).run();
    db.prepare(`UPDATE folders SET scanned = 0`).run();
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

    // 📁 FOLDER - Store and recurse
    if (entry.isDirectory()) {
      // Recurse first to get subfolder's thumbnail
      await scanMediaFolderToDB(dbkey, relPath, stats);
      
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
    }
  }

  // 🗑️ PHASE 3: Sweep orphaned records (only on root scan completion)
  if (currentPath === "") {
    const orphanedItems = db.prepare(`SELECT COUNT(*) as count FROM media_items WHERE scanned = 0`).get().count;
    if (orphanedItems > 0) {
      db.prepare(`DELETE FROM media_items WHERE scanned = 0`).run();
      stats.deleted += orphanedItems;
      console.log(`🗑️ Deleted ${orphanedItems} orphaned media items`);
    }

    const orphanedFolders = db.prepare(`SELECT COUNT(*) as count FROM folders WHERE scanned = 0`).get().count;
    if (orphanedFolders > 0) {
      db.prepare(`DELETE FROM folders WHERE scanned = 0`).run();
      stats.deleted += orphanedFolders;
      console.log(`🗑️ Deleted ${orphanedFolders} orphaned folders`);
    }
  }

  return stats;
}

module.exports = { scanMediaFolderToDB };
