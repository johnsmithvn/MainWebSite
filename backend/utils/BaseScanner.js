// 📁 backend/utils/BaseScanner.js
// 🔍 Base Scanner Classes

const path = require("path");
const fs = require("fs");
const { FILE_EXTENSIONS } = require("../constants");

/**
 * 🔍 Base scanner for all media types
 */
class BaseScanner {
  constructor(getDBFunction, contentType) {
    this.getDB = getDBFunction;
    this.contentType = contentType;
  }

  /**
   * 📂 Scan folder and update database
   */
  async scanFolderToDB(dbkey, folderPath = "", stats = null) {
    // Placeholder implementation - to be extended by specific scanners
    console.log(`🔍 Scanning ${this.contentType} folder: ${folderPath}`);
    return {
      success: true,
      message: `${this.contentType} scan completed`,
      scannedPath: folderPath
    };
  }

  /**
   * 📊 Get scan statistics
   */
  getStats() {
    return {
      totalFolders: 0,
      totalFiles: 0,
      lastScan: new Date().toISOString()
    };
  }
}

/**
 * 🎬 Movie scanner
 */
class MovieScanner extends BaseScanner {
  constructor(getDBFunction) {
    super(getDBFunction, 'movie');
  }

  async scanFolderToDB(dbkey, folderPath = "", stats = null) {
    console.log(`🎬 Movie scanning: ${folderPath}`);
    // Movie-specific scan logic would go here
    return {
      success: true,
      message: "Movie scan completed",
      scannedPath: folderPath,
      videosFound: 0
    };
  }
}

/**
 * 🎵 Music scanner
 */
class MusicScanner extends BaseScanner {
  constructor(getDBFunction) {
    super(getDBFunction, 'music');
  }

  async scanFolderToDB(dbkey, folderPath = "", stats = null) {
    console.log(`🎵 Music scanning: ${folderPath}`);
    // Music-specific scan logic would go here
    return {
      success: true,
      message: "Music scan completed", 
      scannedPath: folderPath,
      songsFound: 0
    };
  }
}

module.exports = {
  BaseScanner,
  MovieScanner,
  MusicScanner
};
