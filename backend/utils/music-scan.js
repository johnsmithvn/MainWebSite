// module.exports = { scanMusicFolderToDB };
const fs = require("fs");
const path = require("path");
const { getRootPath } = require("./config");
const { getMusicDB } = require("./db");

const AUDIO_EXTS = [
  ".mp3", ".flac", ".wav", ".aac", ".m4a",
  ".ogg", ".opus", ".wma", ".alac", ".aiff",
];
const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".avif"];

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
  stats = { inserted: 0, updated: 0, skipped: 0 }
) {
  const db = getMusicDB(dbkey);
  const rootPath = getRootPath(dbkey);
  const basePath = path.join(rootPath, currentPath);

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
        db.prepare(
          `
          INSERT INTO folders (name, path, thumbnail, type, createdAt, updatedAt)
          VALUES (?, ?, ?, 'folder', ?, ?)
        `
        ).run(entry.name, relPath, thumb, Date.now(), Date.now());
        stats.inserted++;
      } else {
        db.prepare(
          `UPDATE folders SET thumbnail = ?, updatedAt = ? WHERE path = ?`
        ).run(thumb, Date.now(), relPath);
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

      // Quét thumbnail đúng tên file trong .thumbnail của folder hiện tại
      let thumb = null;
      const thumbDir = path.join(basePath, ".thumbnail");
      if (fs.existsSync(thumbDir)) {
        thumb = findThumbnail(thumbDir, name); // tên file không extension
      }

      // Metadata nhạc (có thể scan nhẹ, không extract ảnh)
      let duration = 0, artist = null, album = null, genre = null, lyrics = null;
      try {
        const { parseFile } = await import("music-metadata");
        const metadata = await parseFile(fullPath);
        const common = metadata.common;

        duration = Number.isFinite(metadata.format.duration)
          ? Math.floor(metadata.format.duration)
          : 0;
        artist = typeof common.artist === "string" ? common.artist : null;
        album = typeof common.album === "string" ? common.album : null;
        genre = Array.isArray(common.genre)
          ? common.genre.join(", ")
          : typeof common.genre === "string"
            ? common.genre
            : null;
        lyrics = typeof common.lyrics === "string" ? common.lyrics : null;
        // Không extract ảnh nữa!
      } catch (err) {
        console.warn("❌ Lỗi đọc metadata:", entry.name, err.message);
      }

      const existing = db
        .prepare(`SELECT * FROM folders WHERE path = ?`)
        .get(relPath);

      if (!existing) {
        db.prepare(
          `
          INSERT INTO folders (name, path, thumbnail, type, size, modified, duration, createdAt, updatedAt)
          VALUES (?, ?, ?, 'audio', ?, ?, ?, ?, ?)
        `
        ).run(
          name,
          relPath,
          thumb,
          stat.size,
          stat.mtimeMs,
          duration,
          Date.now(),
          Date.now()
        );
        db.prepare(
          `
          INSERT INTO songs (path, artist, album, genre, lyrics)
          VALUES (?, ?, ?, ?, ?)
        `
        ).run(relPath, artist, album, genre, lyrics);
        stats.inserted++;
      } else {
        // UPDATE metadata nếu đã tồn tại
        db.prepare(
          `
          UPDATE folders SET thumbnail = ?, updatedAt = ? WHERE path = ?
        `
        ).run(thumb, Date.now(), relPath);
        db.prepare(
          `
          UPDATE songs SET artist = ?, album = ?, genre = ?, lyrics = ? WHERE path = ?
        `
        ).run(artist, album, genre, lyrics, relPath);
        stats.skipped++;
      }
    }
  }

  return stats;
}

module.exports = { scanMusicFolderToDB };
