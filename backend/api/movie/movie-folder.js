

// 📁 backend/api/movie-folder.js
const express = require("express");
const router = express.Router();
const { getMovieDB } = require("../../utils/db");

/**
 * GET /api/movie-folder?key=V_MOVIE&path=...
 * Trả về folder/video nằm NGAY dưới path (1 cấp con)
 */
router.get("/movie-folder", (req, res) => {
  const dbkey = req.query.key;
  const relPath = req.query.path || "";

  if (!dbkey) return res.status(400).json({ error: "Thiếu key" });

  try {
    const db = getMovieDB(dbkey);

    // Query mọi item có path bắt đầu = relPath + "/"
    const items = db
      .prepare(
        `SELECT * FROM folders WHERE path LIKE ? ORDER BY type DESC, name COLLATE NOCASE ASC`
      )
      .all(relPath ? `${relPath}/%` : "%");

    // Chỉ trả về item có cấp ngay dưới (depth)
    const baseDepth = relPath ? relPath.split("/").filter(Boolean).length : 0;
    const folders = items
      .filter((item) => {
        const itemDepth = item.path.split("/").filter(Boolean).length;
        return itemDepth === baseDepth + 1;
      })
      .map((item) => ({
        name: item.name,
        path: item.path,
        thumbnail: item.thumbnail,
        type: item.type,
        isFavorite: !!item.isFavorite,
      }));

    res.json({
      type: "movie-folder",
      folders,
      total: folders.length,
    });
  } catch (err) {
    console.error("movie-folder", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
