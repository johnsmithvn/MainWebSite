// module.exports = { scanMusicFolderToDB };
const { MusicScanner } = require("./BaseScanner");
const { getMusicDB } = require("./db");

// ✅ Refactored to use BaseScanner
const musicScanner = new MusicScanner(getMusicDB);

async function scanMusicFolderToDB(dbkey, currentPath = "", stats = { inserted: 0, updated: 0, skipped: 0 }) {
  return await musicScanner.scanFolderToDB(dbkey, currentPath, stats);
}

module.exports = { scanMusicFolderToDB };
