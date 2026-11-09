// 📁 backend/utils/media-scan.js
// 📸 Media Gallery Scanner (Images + Videos like Google Photos)

const fs = require("fs");
const path = require("path");
const { getRootPath } = require("./config");
const { getMediaDB } = require("./db");
const { FILE_EXTENSIONS } = require("../constants");

const ffmpeg = require("fluent-ffmpeg");
const ffprobe = require("ffprobe-static");
const { escapeLike } = require("./sqlLike");
const { createWriteQueue, createThumbnailLookup, pathExists } = require("./scanHelpers");
const { readImageSize } = require("./imageSize");
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


// 🎬 Helper: thời lượng + kích thước video trong MỘT lần ffprobe (trước đây gọi 2 lần cho mỗi video — AUDIT PF20).
// Kích thước lấy từ luồng video đầu tiên (trước đây lấy streams[0], là luồng âm thanh ở một số file).
function probeVideo(filePath) {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return resolve({ duration: null, width: null, height: null });
      const streams = metadata?.streams || [];
      const video = streams.find((s) => s.codec_type === "video") || streams[0];
      const duration = parseFloat(metadata?.format?.duration);
      resolve({
        duration: Math.floor(duration || 0),
        width: video?.width || null,
        height: video?.height || null,
      });
    });
  });
}

// 🖼️ Helper: Get image dimensions
// Đọc từ phần đầu file trong Node (JPEG/PNG/GIF/WebP/BMP, xem utils/imageSize.js); chỉ định dạng khác
// (HEIC, AVIF, TIFF…) mới phải chạy ffprobe như trước (AUDIT PF20).
async function getImageDimensions(filePath) {
  const size = await readImageSize(filePath);
  if (size) return size;
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
function extractDateTaken(stat) {
  // TODO: Implement EXIF reading for proper date_taken
  // For now, use file modified time (stat đã có sẵn ở nơi gọi — trước đây stat lại lần nữa, đồng bộ)
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
async function scanMediaLevel(
  dbkey,
  currentPath = "",
  stats = { folders: 0, inserted: 0, updated: 0, skipped: 0, deleted: 0 },
  scopePath = null,
  shallow = false,
  queue // ⚡ hàng đợi ghi theo lô + tra thumbnail (PF1, PF10) — do scanMediaFolderToDB tạo
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
        db.prepare(`UPDATE media_items SET scanned = 0 WHERE path = ? OR (path LIKE ? ESCAPE '\\' AND path NOT LIKE ? ESCAPE '\\')`)
          .run(scopePath, `${escapeLike(scopePath)}/%`, `${escapeLike(scopePath)}/%/%`);
        db.prepare(`UPDATE folders SET scanned = 0 WHERE path = ? OR (path LIKE ? ESCAPE '\\' AND path NOT LIKE ? ESCAPE '\\')`)
          .run(scopePath, `${escapeLike(scopePath)}/%`, `${escapeLike(scopePath)}/%/%`);
        console.log(`📦 Shallow partial scan: Marking scope "${scopePath}" (direct children only)`);
      } else {
        // Deep: mark scope and all descendants
        db.prepare(`UPDATE media_items SET scanned = 0 WHERE path = ? OR path LIKE ? ESCAPE '\\'`)
          .run(scopePath, `${escapeLike(scopePath)}/%`);
        db.prepare(`UPDATE folders SET scanned = 0 WHERE path = ? OR path LIKE ? ESCAPE '\\'`)
          .run(scopePath, `${escapeLike(scopePath)}/%`);
        console.log(`🎯 Deep partial scan: Marking scope "${scopePath}" (all descendants)`);
      }
    } else {
      // 🌍 Full scan
      if (shallow) {
        // Shallow: only mark root level items
        db.prepare(`UPDATE media_items SET scanned = 0 WHERE path NOT LIKE ? ESCAPE '\\'`).run('%/%');
        db.prepare(`UPDATE folders SET scanned = 0 WHERE path NOT LIKE ? ESCAPE '\\'`).run('%/%');
        console.log(`📦 Shallow full scan: Marking root level items only`);
      } else {
        // Deep: mark all items
        db.prepare(`UPDATE media_items SET scanned = 0`).run();
        db.prepare(`UPDATE folders SET scanned = 0`).run();
        console.log(`🎯 Deep full scan: Marking all items`);
      }
    }
  }

  if (!(await pathExists(basePath))) return stats;

  const entries = await fs.promises.readdir(basePath, { withFileTypes: true });

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
        const existingItem = queue.stmt(`SELECT * FROM media_items WHERE path = ?`).get(relPath);
        if (existingItem) {
          queue.stmt(`UPDATE media_items SET scanned = 1 WHERE path = ?`).run(relPath);
        }
        const existingFolder = queue.stmt(`SELECT * FROM folders WHERE root = ? AND path = ?`).get(dbkey, relPath);
        if (existingFolder) {
          queue.stmt(`UPDATE folders SET scanned = 1 WHERE path = ?`).run(relPath);
        }
        // Continue scanning to reach the scope path
        if (entry.isDirectory()) {
          await scanMediaLevel(dbkey, relPath, stats, scopePath, shallow, queue);
        }
        continue;
      }
    }

    // 📁 FOLDER - Store and recurse
    if (entry.isDirectory()) {
      // 📦 Shallow scan: không đệ quy, NGOẠI TRỪ chính folder scope — phải đi vào một cấp để
      // xử lý các con trực tiếp đã bị đánh dấu ở phase 1, nếu không phase 3 xoá nhầm chúng (ISSUES D1)
      if (!shallow || relPath === scopePath) {
        // Recurse first to get subfolder's thumbnail
        await scanMediaLevel(dbkey, relPath, stats, scopePath, shallow, queue);
      }
      
      // Find first image in .thumbnail of this subfolder
      let folderThumb = null;
      const subThumbDir = path.join(fullPath, ".thumbnail");
      const subThumbNames = await queue.thumbs.list(subThumbDir);
      if (subThumbNames) {
        const thumbFiles = subThumbNames.filter(f =>
          IMAGE_EXTS.includes(path.extname(f).toLowerCase())
        );
        if (thumbFiles.length > 0) {
          // Lưu dạng ".thumbnail/<file>" giống thumbnail của file và của movie/music (ISSUES B8)
          folderThumb = path.posix.join(".thumbnail", thumbFiles[0]);
        }
      }

      // Count items in subfolder — đếm cả item vừa quét trong lần đệ quy ở trên, nên phải flush trước.
      // Khoảng path >= 'x/' AND path < 'x0' ('0' đứng ngay sau '/') = mọi path bắt đầu bằng 'x/',
      // dùng được index idx_media_path thay vì LIKE quét toàn bảng cho mỗi thư mục (PF3)
      queue.flush();
      const folderItemCount = queue.stmt(
        `SELECT COUNT(*) as count FROM media_items WHERE path >= ? AND path < ?`
      ).get(`${relPath}/`, `${relPath}0`).count;

      // Insert/update folder
      const existingFolder = queue.stmt(
        `SELECT * FROM folders WHERE root = ? AND path = ?`
      ).get(dbkey, relPath);

      if (!existingFolder) {
        queue.stmt(
          `INSERT INTO folders (root, path, name, thumbnail, itemCount, scanned, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, 1, ?, ?)`
        ).run(dbkey, relPath, entry.name, folderThumb, folderItemCount, Date.now(), Date.now());
        stats.folders++;
      } else {
        queue.stmt(
          `UPDATE folders SET thumbnail = ?, itemCount = ?, scanned = 1, updatedAt = ? WHERE root = ? AND path = ?`
        ).run(folderThumb, folderItemCount, Date.now(), dbkey, relPath);
      }

      continue;
    }

    // 🖼️ IMAGE FILE
    if (IMAGE_EXTS.includes(path.extname(entry.name).toLowerCase())) {
      itemCount++;
      if (!firstImagePath) firstImagePath = relPath;

      const stat = await fs.promises.stat(fullPath);
      const lastModified = stat.mtimeMs;
      const dateTaken = extractDateTaken(stat);
      
      let thumb = null;
      const baseName = path.basename(entry.name, path.extname(entry.name));
      const thumbDir = path.join(basePath, ".thumbnail");
      thumb = await queue.thumbs.find(thumbDir, baseName, IMAGE_EXTS);

      const existing = queue.stmt(`SELECT * FROM media_items WHERE path = ?`).get(relPath);

      if (!existing) {
        // ✅ NEW IMAGE
        const { width, height } = await getImageDimensions(fullPath);
        queue.stmt(
          `INSERT INTO media_items (name, path, thumbnail, type, size, modified, width, height, date_taken, scanned, createdAt, updatedAt)
           VALUES (?, ?, ?, 'image', ?, ?, ?, ?, ?, 1, ?, ?)`
        ).run(entry.name, relPath, thumb, stat.size, lastModified, width, height, dateTaken, Date.now(), Date.now());
        stats.inserted++;
      } else if (existing.modified !== lastModified) {
        // ✅ CHANGED IMAGE
        const { width, height } = await getImageDimensions(fullPath);
        queue.stmt(
          `UPDATE media_items SET thumbnail = ?, size = ?, modified = ?, width = ?, height = ?, date_taken = ?, scanned = 1, updatedAt = ? WHERE path = ?`
        ).run(thumb, stat.size, lastModified, width, height, dateTaken, Date.now(), relPath);
        stats.updated++;
      } else if (existing.thumbnail !== thumb) {
        // ✅ THUMBNAIL CHANGED
        queue.stmt(`UPDATE media_items SET thumbnail = ?, scanned = 1, updatedAt = ? WHERE path = ?`).run(thumb, Date.now(), relPath);
        stats.updated++;
      } else {
        // ✅ UNCHANGED
        queue.stmt(`UPDATE media_items SET scanned = 1 WHERE path = ?`).run(relPath);
        stats.skipped++;
      }
    }

    // 🎞️ VIDEO FILE
    if (VIDEO_EXTS.includes(path.extname(entry.name).toLowerCase())) {
      itemCount++;

      const stat = await fs.promises.stat(fullPath);
      const lastModified = stat.mtimeMs;
      const dateTaken = extractDateTaken(stat);
      
      let thumb = null;
      const baseName = path.basename(entry.name, path.extname(entry.name));
      const thumbDir = path.join(basePath, ".thumbnail");
      thumb = await queue.thumbs.find(thumbDir, baseName, IMAGE_EXTS);

      const existing = queue.stmt(`SELECT * FROM media_items WHERE path = ?`).get(relPath);

      if (!existing) {
        // ✅ NEW VIDEO
        const { duration, width, height } = await probeVideo(fullPath);
        queue.stmt(
          `INSERT INTO media_items (name, path, thumbnail, type, size, modified, width, height, duration, date_taken, scanned, createdAt, updatedAt)
           VALUES (?, ?, ?, 'video', ?, ?, ?, ?, ?, ?, 1, ?, ?)`
        ).run(entry.name, relPath, thumb, stat.size, lastModified, width, height, duration, dateTaken, Date.now(), Date.now());
        stats.inserted++;
      } else if (existing.modified !== lastModified) {
        // ✅ CHANGED VIDEO
        const { duration, width, height } = await probeVideo(fullPath);
        queue.stmt(
          `UPDATE media_items SET thumbnail = ?, size = ?, modified = ?, width = ?, height = ?, duration = ?, date_taken = ?, scanned = 1, updatedAt = ? WHERE path = ?`
        ).run(thumb, stat.size, lastModified, width, height, duration, dateTaken, Date.now(), relPath);
        stats.updated++;
      } else if (existing.thumbnail !== thumb) {
        // ✅ THUMBNAIL CHANGED
        queue.stmt(`UPDATE media_items SET thumbnail = ?, scanned = 1, updatedAt = ? WHERE path = ?`).run(thumb, Date.now(), relPath);
        stats.updated++;
      } else {
        // ✅ UNCHANGED
        queue.stmt(`UPDATE media_items SET scanned = 1 WHERE path = ?`).run(relPath);
        stats.skipped++;
      }
      continue;
    }

    // 📄 ALL OTHER FILES (audio, pdf, text, document, archive, code, other)
    const ext = path.extname(entry.name).toLowerCase();
    const fileType = getFileType(ext);
    
    if (fileType !== 'image' && fileType !== 'video' && ext) {
      itemCount++;

      const stat = await fs.promises.stat(fullPath);
      const lastModified = stat.mtimeMs;
      const dateTaken = extractDateTaken(stat);
      
      let thumb = null;
      const baseName = path.basename(entry.name, path.extname(entry.name));
      const thumbDir = path.join(basePath, ".thumbnail");
      thumb = await queue.thumbs.find(thumbDir, baseName, IMAGE_EXTS);

      const existing = queue.stmt(`SELECT * FROM media_items WHERE path = ?`).get(relPath);

      if (!existing) {
        // ✅ NEW FILE
        queue.stmt(
          `INSERT INTO media_items (name, path, thumbnail, type, size, modified, date_taken, scanned, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
        ).run(entry.name, relPath, thumb, fileType, stat.size, lastModified, dateTaken, Date.now(), Date.now());
        stats.inserted++;
      } else if (existing.modified !== lastModified) {
        // ✅ CHANGED FILE
        queue.stmt(
          `UPDATE media_items SET thumbnail = ?, size = ?, modified = ?, date_taken = ?, scanned = 1, updatedAt = ? WHERE path = ?`
        ).run(thumb, stat.size, lastModified, dateTaken, Date.now(), relPath);
        stats.updated++;
      } else if (existing.thumbnail !== thumb) {
        // ✅ THUMBNAIL CHANGED
        queue.stmt(`UPDATE media_items SET thumbnail = ?, scanned = 1, updatedAt = ? WHERE path = ?`).run(thumb, Date.now(), relPath);
        stats.updated++;
      } else {
        // ✅ UNCHANGED
        queue.stmt(`UPDATE media_items SET scanned = 1 WHERE path = ?`).run(relPath);
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
        const orphanedItems = db.prepare(
          `SELECT COUNT(*) as count FROM media_items WHERE scanned = 0 AND (path = ? OR (path LIKE ? ESCAPE '\\' AND path NOT LIKE ? ESCAPE '\\'))`
        ).get(scopePath, `${escapeLike(scopePath)}/%`, `${escapeLike(scopePath)}/%/%`).count;
        
        if (orphanedItems > 0) {
          db.prepare(
            `DELETE FROM media_items WHERE scanned = 0 AND (path = ? OR (path LIKE ? ESCAPE '\\' AND path NOT LIKE ? ESCAPE '\\'))`
          ).run(scopePath, `${escapeLike(scopePath)}/%`, `${escapeLike(scopePath)}/%/%`);
          stats.deleted += orphanedItems;
          console.log(`🗑️ Deleted ${orphanedItems} orphaned media items in scope (shallow): "${scopePath}"`);
        }

        const orphanedFolders = db.prepare(
          `SELECT COUNT(*) as count FROM folders WHERE scanned = 0 AND (path = ? OR (path LIKE ? ESCAPE '\\' AND path NOT LIKE ? ESCAPE '\\'))`
        ).get(scopePath, `${escapeLike(scopePath)}/%`, `${escapeLike(scopePath)}/%/%`).count;
        
        if (orphanedFolders > 0) {
          db.prepare(
            `DELETE FROM folders WHERE scanned = 0 AND (path = ? OR (path LIKE ? ESCAPE '\\' AND path NOT LIKE ? ESCAPE '\\'))`
          ).run(scopePath, `${escapeLike(scopePath)}/%`, `${escapeLike(scopePath)}/%/%`);
          stats.deleted += orphanedFolders;
          console.log(`🗑️ Deleted ${orphanedFolders} orphaned folders in scope (shallow): "${scopePath}"`);
        }
      } else {
        // Deep: delete all unscanned items in scope
        const orphanedItems = db.prepare(
          `SELECT COUNT(*) as count FROM media_items WHERE scanned = 0 AND (path = ? OR path LIKE ? ESCAPE '\\')`
        ).get(scopePath, `${escapeLike(scopePath)}/%`).count;
        
        if (orphanedItems > 0) {
          db.prepare(
            `DELETE FROM media_items WHERE scanned = 0 AND (path = ? OR path LIKE ? ESCAPE '\\')`
          ).run(scopePath, `${escapeLike(scopePath)}/%`);
          stats.deleted += orphanedItems;
          console.log(`🗑️ Deleted ${orphanedItems} orphaned media items in scope (deep): "${scopePath}"`);
        }

        const orphanedFolders = db.prepare(
          `SELECT COUNT(*) as count FROM folders WHERE scanned = 0 AND (path = ? OR path LIKE ? ESCAPE '\\')`
        ).get(scopePath, `${escapeLike(scopePath)}/%`).count;
        
        if (orphanedFolders > 0) {
          db.prepare(
            `DELETE FROM folders WHERE scanned = 0 AND (path = ? OR path LIKE ? ESCAPE '\\')`
          ).run(scopePath, `${escapeLike(scopePath)}/%`);
          stats.deleted += orphanedFolders;
          console.log(`🗑️ Deleted ${orphanedFolders} orphaned folders in scope (deep): "${scopePath}"`);
        }
      }
    } else {
      // 🌍 Full scan cleanup
      if (shallow) {
        // Shallow: only delete root level unscanned items
        const orphanedItems = db.prepare(
          `SELECT COUNT(*) as count FROM media_items WHERE scanned = 0 AND path NOT LIKE ? ESCAPE '\\'`
        ).get('%/%').count;
        
        if (orphanedItems > 0) {
          db.prepare(`DELETE FROM media_items WHERE scanned = 0 AND path NOT LIKE ? ESCAPE '\\'`).run('%/%');
          stats.deleted += orphanedItems;
          console.log(`🗑️ Deleted ${orphanedItems} orphaned root media items (shallow)`);
        }

        const orphanedFolders = db.prepare(
          `SELECT COUNT(*) as count FROM folders WHERE scanned = 0 AND path NOT LIKE ? ESCAPE '\\'`
        ).get('%/%').count;
        
        if (orphanedFolders > 0) {
          db.prepare(`DELETE FROM folders WHERE scanned = 0 AND path NOT LIKE ? ESCAPE '\\'`).run('%/%');
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

/**
 * Điểm vào giữ nguyên chữ ký cũ. Tạo hàng đợi ghi cho cả lần scan và luôn flush khi xong hoặc khi
 * lỗi giữa chừng (code cũ ghi ngay từng lệnh nên phần đã quét vẫn được lưu).
 */
async function scanMediaFolderToDB(dbkey, currentPath = "", stats = { folders: 0, inserted: 0, updated: 0, skipped: 0, deleted: 0 }, scopePath = null, shallow = false) {
  const queue = createWriteQueue(getMediaDB(dbkey));
  queue.thumbs = createThumbnailLookup();
  try {
    return await scanMediaLevel(dbkey, currentPath, stats, scopePath, shallow, queue);
  } finally {
    queue.flush();
  }
}

module.exports = { scanMediaFolderToDB };
