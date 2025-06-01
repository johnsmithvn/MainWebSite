const fs = require("fs");
const path = require("path");
const { getRootPath } = require("./config");
const { getMovieDB } = require("./db");

const ffmpeg = require("fluent-ffmpeg");
const ffprobe = require("ffprobe-static");
ffmpeg.setFfprobePath(ffprobe.path);

const VIDEO_EXTS = [".mp4", ".mkv", ".avi", ".webm"];
const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".avif"];

// 📏 Hàm đo duration
function getVideoDuration(filePath) {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return resolve(null);
      const duration = parseFloat(metadata?.format?.duration);
      resolve(Math.floor(duration || 0));
    });
  });
}

async function scanMovieFolderToDB(dbkey, currentPath = "", stats = { inserted: 0, updated: 0, skipped: 0 }) {
  const db = getMovieDB(dbkey);
  const rootPath = getRootPath(dbkey);
  const basePath = path.join(rootPath, currentPath);

  if (!fs.existsSync(basePath)) return stats;

  const entries = fs.readdirSync(basePath, { withFileTypes: true });

  for (const entry of entries) {
    const relPath = path.posix.join(currentPath, entry.name);

    // 📁 Folder
    if (entry.isDirectory()) {
      let thumb = null;
      try {
        const childEntries = fs.readdirSync(path.join(basePath, entry.name), { withFileTypes: true });
        for (const c of childEntries) {
          if (c.isFile() && ["cover.jpg", "folder.jpg"].includes(c.name.toLowerCase())) {
            thumb = path.posix.join(relPath, c.name);
            break;
          }
        }
      } catch {}

      const existing = db.prepare(`SELECT * FROM folders WHERE path = ?`).get(relPath);
      if (!existing) {
        db.prepare(`
          INSERT INTO folders (name, path, thumbnail, type, createdAt, updatedAt)
          VALUES (?, ?, ?, 'folder', ?, ?)
        `).run(entry.name, relPath, thumb, Date.now(), Date.now());
        stats.inserted++;
      } else {
        stats.skipped++;
      }

      await scanMovieFolderToDB(dbkey, relPath, stats); // 🔁 Recursive
    }

    // 🎞 Video
    if (entry.isFile() && VIDEO_EXTS.includes(path.extname(entry.name).toLowerCase())) {
      let thumb = null;
      const baseName = path.basename(entry.name, path.extname(entry.name));
      for (const ext of IMAGE_EXTS) {
        const thumbPath = path.join(basePath, baseName + ext);
        if (fs.existsSync(thumbPath)) {
          thumb = path.posix.join(currentPath, baseName + ext);
          break;
        }
      }

      const existing = db.prepare(`SELECT * FROM folders WHERE path = ?`).get(relPath);
      const fullPath = path.join(basePath, entry.name);
      const stat = fs.statSync(fullPath);
      const duration = await getVideoDuration(fullPath);

      if (!existing) {
        db.prepare(`
          INSERT INTO folders (name, path, thumbnail, type, size, modified, duration, createdAt, updatedAt)
          VALUES (?, ?, ?, 'video', ?, ?, ?, ?, ?)
        `).run(
          entry.name,
          relPath,
          thumb,
          stat.size,
          stat.mtimeMs,
          duration,
          Date.now(),
          Date.now()
        );
        stats.inserted++;
      } else {
        const needUpdate = (existing.thumbnail !== thumb);
        if (needUpdate) {
          db.prepare(`
            UPDATE folders SET thumbnail = ?, updatedAt = ? WHERE path = ?
          `).run(thumb, Date.now(), relPath);
          stats.updated++;
        } else {
          stats.skipped++;
        }
      }
    }
  }

  return stats;
}

module.exports = { scanMovieFolderToDB };
