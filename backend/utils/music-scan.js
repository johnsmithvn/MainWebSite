const fs = require("fs");
const path = require("path");
const { getRootPath } = require("./config");
const { getMusicDB } = require("./db");

const AUDIO_EXTS = [
  ".mp3",
  ".flac",
  ".wav",
  ".aac",
  ".m4a",
  ".ogg",
  ".opus",
  ".wma",
  ".alac",
  ".aiff",
];
const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".avif"];

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
    const relPath = path.posix.join(currentPath, entry.name);
    const fullPath = path.join(basePath, entry.name);

    // 📁 FOLDER
    if (entry.isDirectory()) {
      let thumb = null;
      try {
        const childFiles = fs.readdirSync(fullPath);
        for (const file of childFiles) {
          const ext = path.extname(file).toLowerCase();
          if (IMAGE_EXTS.includes(ext)) {
            thumb = path.posix.join(relPath, file);
            break;
          }
        }
      } catch {}

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
        stats.skipped++;
      }

      await scanMusicFolderToDB(dbkey, relPath, stats); // 🔁 Recursive
    }

    // 🎵 AUDIO FILE
    if (
      entry.isFile() &&
      AUDIO_EXTS.includes(path.extname(entry.name).toLowerCase())
    ) {
      const name = path.basename(entry.name, path.extname(entry.name));
      const stat = fs.statSync(fullPath);
      const { parseFile } = await import("music-metadata");

      let duration = 0,
        artist = null,
        album = null,
        genre = null,
        lyrics = null,
        thumb = null;

      try {
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

        // 📸 Tạo thumbnail từ ảnh nhúng
        // if (common.picture && common.picture.length > 0) {
        //   const pic = common.picture[0];
        //   const ext = pic.format.includes("png") ? ".png" : ".jpg";
        //   const thumbFolder = path.join(basePath, ".thumbnail");
        //   if (!fs.existsSync(thumbFolder)) fs.mkdirSync(thumbFolder);

        //   const thumbFile = path.join(thumbFolder, name + ext);
        //   fs.writeFileSync(thumbFile, pic.data);

        //   thumb = path.posix.join(".thumbnail", name + ext);
        // }
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
        // 🔁 UPDATE metadata nếu đã tồn tại
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

        stats.updated++;
      }
    }
  }

  return stats;
}

module.exports = { scanMusicFolderToDB };
