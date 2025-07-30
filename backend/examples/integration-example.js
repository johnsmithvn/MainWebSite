// 📁 backend/examples/integration-example.js
// 🔗 Ví dụ integration sử dụng refactored components

const { databaseManager } = require("../utils/DatabaseManager");
const { mediaService } = require("../services/MediaService");
const { BaseScanner } = require("../utils/BaseScanner");
const { sendSuccess, sendError } = require("../utils/responseHelpers");

/**
 * 🎯 Ví dụ: Sử dụng MediaService thay vì direct database access
 */
async function exampleUsingMediaService() {
  try {
    // Thay vì truy cập DB trực tiếp
    // const db = getDB(dbkey);
    // const rows = db.prepare("SELECT * FROM folders").all();
    
    // Sử dụng MediaService
    const result = await mediaService.getRandomItems("ROOT_FANTASY", "1", 10);
    console.log("📊 Random items:", result);
    
    return result;
  } catch (error) {
    console.error("❌ Error:", error);
    return null;
  }
}

/**
 * 🎯 Ví dụ: Sử dụng BaseScanner thay vì các scanner riêng lẻ
 */
async function exampleUsingBaseScanner() {
  try {
    // Thay vì sử dụng scanMusicFolderToDB, scanMovieFolderToDB riêng lẻ
    // await scanMusicFolderToDB(dbkey, path, stats);
    
    // Sử dụng BaseScanner unified
    const result = await mediaService.scanFolders("M_MUSIC", "", {
      inserted: 0,
      updated: 0,
      skipped: 0
    });
    
    console.log("📊 Scan result:", result);
    return result;
  } catch (error) {
    console.error("❌ Scan error:", error);
    return null;
  }
}

/**
 * 🎯 Ví dụ: Express route sử dụng helpers
 */
function exampleExpressRoute(req, res) {
  try {
    const { dbkey, path } = req.query;
    
    // Validation
    if (!dbkey) {
      return sendError(res, "Missing dbkey parameter", 400);
    }
    
    // Business logic
    const db = databaseManager.getDatabase(dbkey);
    const folders = db.prepare("SELECT * FROM folders WHERE path LIKE ?").all(`${path}%`);
    
    // Success response
    return sendSuccess(res, folders, "Folders retrieved successfully");
    
  } catch (error) {
    console.error("❌ Route error:", error);
    return sendError(res, "Internal server error", 500);
  }
}

/**
 * 🎯 Ví dụ: Sử dụng DatabaseManager thay vì getDB, getMovieDB, getMusicDB
 */
function exampleDatabaseManager() {
  try {
    // Thay vì
    // const mangaDB = getDB(dbkey);
    // const movieDB = getMovieDB(dbkey);
    // const musicDB = getMusicDB(dbkey);
    
    // Sử dụng DatabaseManager
    const mangaDB = databaseManager.getDatabase("ROOT_FANTASY", "manga");
    const movieDB = databaseManager.getDatabase("V_MOVIE", "movie");
    const musicDB = databaseManager.getDatabase("M_MUSIC", "music");
    
    // Tất cả đều có cùng interface
    const mangaStats = databaseManager.getStats("ROOT_FANTASY", "manga");
    const movieStats = databaseManager.getStats("V_MOVIE", "movie");
    const musicStats = databaseManager.getStats("M_MUSIC", "music");
    
    console.log("📊 Database stats:", { mangaStats, movieStats, musicStats });
    
    return { mangaStats, movieStats, musicStats };
  } catch (error) {
    console.error("❌ Database error:", error);
    return null;
  }
}

module.exports = {
  exampleUsingMediaService,
  exampleUsingBaseScanner,
  exampleExpressRoute,
  exampleDatabaseManager
};
