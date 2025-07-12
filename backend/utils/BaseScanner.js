// 📁 backend/utils/BaseScanner.js
const fs = require("fs");
const path = require("path");
const { getRootPath } = require("./config");
const { findThumbnail } = require("./thumbnailUtils");
const { upsertFolder, getDbStats } = require("./databaseUtils");
const { FILE_EXTENSIONS } = require("../constants");

/**
 * 🔄 Base Scanner class cho Music/Movie/Manga
 */
class BaseScanner {
  constructor(dbGetter, contentType) {
    this.getDB = dbGetter;
    this.contentType = contentType; // 'music', 'movie', 'manga'
    
    // Set extensions based on content type
    switch (contentType) {
      case 'music':
        this.extensions = FILE_EXTENSIONS.AUDIO;
        this.fileType = 'audio';
        break;
      case 'movie':
        this.extensions = FILE_EXTENSIONS.VIDEO;
        this.fileType = 'video';
        break;
      case 'manga':
        this.extensions = FILE_EXTENSIONS.IMAGE;
        this.fileType = 'image';
        break;
      default:
        this.extensions = [];
        this.fileType = 'file';
    }
  }

  /**
   * 📁 Scan folder và subfolder đệ quy
   */
  async scanFolderToDB(dbkey, currentPath = "", stats = { scanned: 0, inserted: 0, updated: 0, skipped: 0 }) {
    const db = this.getDB(dbkey);
    const rootPath = getRootPath(dbkey);
    const basePath = path.join(rootPath, currentPath);

    if (!fs.existsSync(basePath)) return stats;

    const entries = fs.readdirSync(basePath, { withFileTypes: true });
    stats.scanned = (stats.scanned || 0) + entries.length;

    for (const entry of entries) {
      // Skip .thumbnail folder
      if (entry.isDirectory() && entry.name === ".thumbnail") continue;
      
      const relPath = path.posix.join(currentPath, entry.name);
      const fullPath = path.join(basePath, entry.name);

      try {
        // Scan folder
        if (entry.isDirectory()) {
          await this.scanFolder(db, entry, relPath, fullPath, basePath, stats);
          await this.scanFolderToDB(dbkey, relPath, stats); // Đệ quy
        }

        // Scan file
        if (entry.isFile() && this.isValidFile(entry.name)) {
          await this.scanFile(db, entry, relPath, fullPath, basePath, stats);
        }
      } catch (error) {
        console.error(`❌ Error scanning ${relPath}:`, error);
      }
    }

    return stats;
  }

  /**
   * 📁 Scan một folder cụ thể
   */
  async scanFolder(db, entry, relPath, fullPath, basePath, stats) {
    let thumb = null;
    
    // Tìm thumbnail trong folder con
    const thumbDir = path.join(fullPath, ".thumbnail");
    if (fs.existsSync(thumbDir)) {
      thumb = findThumbnail(thumbDir, entry.name);
    }

    const folderData = {
      name: entry.name,
      path: relPath,
      thumbnail: thumb,
      type: 'folder'
    };

    upsertFolder(db, folderData, stats);
  }

  /**
   * 📄 Scan một file cụ thể (override trong subclass)
   */
  async scanFile(db, entry, relPath, fullPath, basePath, stats) {
    // Base implementation
    const stat = fs.statSync(fullPath);
    const name = path.basename(entry.name, path.extname(entry.name));
    
    // Tìm thumbnail
    let thumb = null;
    const thumbDir = path.join(basePath, ".thumbnail");
    if (fs.existsSync(thumbDir)) {
      thumb = findThumbnail(thumbDir, name);
    }

    const fileData = {
      name: entry.name,
      path: relPath,
      thumbnail: thumb,
      type: this.fileType,
      size: stat.size,
      modified: stat.mtimeMs
    };

    upsertFolder(db, fileData, stats);
  }

  /**
   * ✅ Kiểm tra file có hợp lệ không
   */
  isValidFile(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    return this.extensions.includes(ext);
  }

  /**
   * 📊 Get scan statistics
   */
  async getScanStats(dbkey) {
    const db = this.getDB(dbkey);
    return getDbStats(db);
  }
}

/**
 * 🎵 Music Scanner - extends BaseScanner
 */
class MusicScanner extends BaseScanner {
  constructor(dbGetter) {
    super(dbGetter, 'music');
  }

  async scanFile(db, entry, relPath, fullPath, basePath, stats) {
    await super.scanFile(db, entry, relPath, fullPath, basePath, stats);
    
    // Additional music metadata processing
    try {
      const metadata = await this.extractMusicMetadata(fullPath);
      if (metadata) {
        await this.saveMusicMetadata(db, relPath, metadata);
      }
    } catch (error) {
      console.warn(`⚠️ Could not extract metadata for ${relPath}:`, error.message);
    }
  }

  async extractMusicMetadata(filePath) {
    try {
      const { parseFile } = await import("music-metadata");
      const metadata = await parseFile(filePath);
      const common = metadata.common;

      return {
        duration: Number.isFinite(metadata.format.duration) 
          ? Math.floor(metadata.format.duration) 
          : 0,
        artist: typeof common.artist === "string" ? common.artist : null,
        album: typeof common.album === "string" ? common.album : null,
        genre: Array.isArray(common.genre)
          ? common.genre.join(", ")
          : typeof common.genre === "string"
            ? common.genre
            : null,
        lyrics: typeof common.lyrics === "string" ? common.lyrics : null
      };
    } catch (error) {
      return null;
    }
  }

  async saveMusicMetadata(db, relPath, metadata) {
    const { artist, album, genre, lyrics, duration } = metadata;
    
    // Update duration in folders table
    db.prepare(`
      UPDATE folders SET duration = ? WHERE path = ?
    `).run(duration, relPath);

    // Upsert into songs table
    db.prepare(`
      INSERT INTO songs (path, artist, album, genre, lyrics)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(path) DO UPDATE SET
        artist = excluded.artist,
        album = excluded.album,
        genre = excluded.genre,
        lyrics = excluded.lyrics
    `).run(relPath, artist, album, genre, lyrics);
  }
}

/**
 * 🎬 Movie Scanner - extends BaseScanner
 */
class MovieScanner extends BaseScanner {
  constructor(dbGetter) {
    super(dbGetter, 'movie');
  }

  async scanFile(db, entry, relPath, fullPath, basePath, stats) {
    await super.scanFile(db, entry, relPath, fullPath, basePath, stats);
    
    // Additional movie metadata processing
    try {
      const duration = await this.getVideoDuration(fullPath);
      if (duration > 0) {
        db.prepare(`
          UPDATE folders SET duration = ? WHERE path = ?
        `).run(duration, relPath);
      }
    } catch (error) {
      console.warn(`⚠️ Could not get video duration for ${relPath}:`, error.message);
    }
  }

  async getVideoDuration(filePath) {
    return new Promise((resolve) => {
      const ffmpeg = require("fluent-ffmpeg");
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) return resolve(0);
        const duration = parseFloat(metadata?.format?.duration);
        resolve(Math.floor(duration || 0));
      });
    });
  }
}

module.exports = { 
  BaseScanner, 
  MusicScanner, 
  MovieScanner 
};
