const { MovieScanner } = require("./BaseScanner");
const { getMovieDB } = require("./db");

// ✅ Refactored to use BaseScanner
const movieScanner = new MovieScanner(getMovieDB);

async function scanMovieFolderToDB(dbkey, currentPath = "", stats = { inserted: 0, updated: 0, skipped: 0 }) {
  return await movieScanner.scanFolderToDB(dbkey, currentPath, stats);
}

module.exports = { scanMovieFolderToDB };
