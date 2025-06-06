const fs = require("fs");
const path = require("path");
const { getRootPath } = require("./config");
const { getMusicDB } = require("./db");
const mm = require("music-metadata"); // ✅ đưa ra đầu file

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

    if (entry.isDirectory()) {
      let thumb = null;
      const files = fs.readdirSync(fullPath);
      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (IMAGE_EXTS.includes(ext)) {
          thumb = path.posix.join(relPath, file);
          break;
        }
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
        stats.skipped++;
      }

      await scanMusicFolderToDB(dbkey, relPath, stats); // Đệ quy tiếp
    }

    if (
      entry.isFile() &&
      AUDIO_EXTS.includes(path.extname(entry.name).toLowerCase())
    ) {
      const fileName = entry.name;
      const name = path.basename(fileName, path.extname(fileName));
      const stat = fs.statSync(fullPath);

      let duration = 0;
      let artist = null,
        album = null,
        genre = null,
        lyrics = null;
      let thumb = null;

      try {
        const metadata = await mm.parseFile(fullPath);
        const common = metadata.common;

        duration = Math.floor(metadata.format.duration || 0);
        artist = common.artist || null;
        album = common.album || null;
        genre = Array.isArray(common.genre)
          ? common.genre.join(", ")
          : common.genre;
        lyrics = common.lyrics || null;

        if (common.picture && common.picture.length > 0) {
          const pic = common.picture[0];
          const ext = pic.format.includes("png") ? ".png" : ".jpg";
          const thumbFolder = path.join(basePath, ".thumbnail");
          if (!fs.existsSync(thumbFolder)) fs.mkdirSync(thumbFolder);

          const thumbFile = path.join(thumbFolder, name + ext);
          fs.writeFileSync(thumbFile, pic.data);

          thumb = path.posix.join(currentPath, ".thumbnail", name + ext);
        }
      } catch (err) {
        console.warn("❌ metadata parse failed:", fileName, err.message);
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
          INSERT OR REPLACE INTO songs (path, artist, album, genre, lyrics)
          VALUES (?, ?, ?, ?, ?)
        `
        ).run(relPath, artist, album, genre, lyrics);

        stats.inserted++;
      } else {
        db.prepare(
          `
    UPDATE songs SET artist=?, album=?, genre=?, lyrics=? WHERE path=?
  `
        ).run(artist, album, genre, lyrics, relPath);

        db.prepare(
          `
    UPDATE folders SET thumbnail=? WHERE path=?
  `
        ).run(thumb, relPath); // nếu bạn muốn cập nhật thumbnail luôn

        stats.updated++;
      }
    }
  }

  return stats;
}

module.exports = { scanMusicFolderToDB };
