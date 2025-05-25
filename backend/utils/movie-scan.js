const fs = require("fs");
const path = require("path");
const { getRootPath } = require("./config");
const { getMovieDB } = require("./db");

const VIDEO_EXTS = [".mp4", ".mkv", ".avi", ".webm"];
const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".avif"];

/**
 * Scan toàn bộ cây thư mục phim, lưu DB (movie DB riêng, không root)
 * @param {string} dbkey (VD: V_MOVIE)
 * @param {string} currentPath (relative từ gốc, mặc định "")
 */
function scanMovieFolderToDB(dbkey, currentPath = "") {
  const db = getMovieDB(dbkey);
  const rootPath = getRootPath(dbkey);
  const basePath = path.join(rootPath, currentPath);

  if (!fs.existsSync(basePath)) return;

  const entries = fs.readdirSync(basePath, { withFileTypes: true });
  for (const entry of entries) {
    const relPath = path.posix.join(currentPath, entry.name);

    // FOLDER: lưu vào DB, lấy thumbnail là ảnh đầu tiên trong folder (không đệ quy)
    if (entry.isDirectory()) {
      let thumb = null;
      try {
        const childEntries = fs.readdirSync(path.join(basePath, entry.name), {
          withFileTypes: true,
        });
        for (const c of childEntries) {
          if (
            c.isFile() &&
            ["cover.jpg", "folder.jpg"].includes(c.name.toLowerCase())
          ) {
            thumb = path.posix.join(relPath, c.name);
            break;
          }
        }
      } catch {}
      db.prepare(
        `INSERT OR REPLACE INTO folders (name, path, thumbnail, type, createdAt, updatedAt)
     VALUES (?, ?, ?, 'folder', ?, ?)`
      ).run(entry.name, relPath, thumb, Date.now(), Date.now());

      // Đệ quy vào folder con
      scanMovieFolderToDB(dbkey, relPath);
    }

    // VIDEO: lưu vào DB, thumbnail là file cùng tên (jpg/png/...)
    if (
      entry.isFile() &&
      VIDEO_EXTS.includes(path.extname(entry.name).toLowerCase())
    ) {
      let thumb = null;
      const baseName = path.basename(entry.name, path.extname(entry.name));
      for (const ext of IMAGE_EXTS) {
        const thumbPath = path.join(basePath, baseName + ext);
        if (fs.existsSync(thumbPath)) {
          thumb = path.posix.join(currentPath, baseName + ext);
          break;
        }
      }
      db.prepare(
        `INSERT OR REPLACE INTO folders (name, path, thumbnail, type, createdAt, updatedAt)
         VALUES (?, ?, ?, 'video', ?, ?)`
      ).run(entry.name, relPath, thumb, Date.now(), Date.now());
    }
  }
}

module.exports = { scanMovieFolderToDB };
