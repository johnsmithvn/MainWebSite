// // 📁 backend/api/movie-folder.js
// const express = require("express");
// const router = express.Router();
// const { loadMovieFolderFromDisk } = require("../utils/folder-loader");
// const { getRootPath } = require("../utils/config");

// /**
//  * API: Lấy folder + file video trong thư mục MOVIE
//  * GET /api/movie-folder?key=V_MOVIE&path=...
//  */
// router.get("/movie-folder", (req, res) => {
//   const { key, path = "" } = req.query;

//   if (!key) return res.status(400).json({ error: "Missing key" });
//   const rootPath = getRootPath(key);
//   if (!rootPath) return res.status(400).json({ error: "Invalid key" });

//   // root có thể truyền null/rỗng hoặc key (tùy env)
//   const root = key;

//   // Không cần limit/offset vì movie không phân trang folder
//   const result = loadMovieFolderFromDisk(key, root, path);

//   return res.json({
//     type: "movie-folder",
//     folders: result.folders, // có cả subfolder & file video
//     total: result.total,
//   });
// });

// module.exports = router;


// 📁 backend/api/movie-folder.js
const express = require("express");
const router = express.Router();
const { getMovieDB } = require("../utils/db");

/**
 * GET /api/movie-folder?key=V_MOVIE&path=...
 * Trả về folder/video nằm NGAY dưới path (1 cấp con)
 */
router.get("/movie-folder", (req, res) => {
  const dbkey = req.query.key;
  const relPath = req.query.path || "";

  if (!dbkey) return res.status(400).json({ error: "Thiếu key" });

  const db = getMovieDB(dbkey);

  // Query mọi item có path bắt đầu = relPath + "/"
  const items = db.prepare(
    `SELECT * FROM folders WHERE path LIKE ? ORDER BY type DESC, name COLLATE NOCASE ASC`
  ).all(relPath ? `${relPath}/%` : "%");

  // Chỉ trả về item có cấp ngay dưới (depth)
  const baseDepth = relPath ? relPath.split("/").filter(Boolean).length : 0;
  const folders = items.filter(item => {
    const itemDepth = item.path.split("/").filter(Boolean).length;
    return itemDepth === baseDepth + 1;
  }).map(item => ({
    name: item.name,
    path: item.path,
    thumbnail: item.thumbnail,
    type: item.type
  }));

  res.json({
    type: "movie-folder",
    folders,
    total: folders.length
  });
});

module.exports = router;
