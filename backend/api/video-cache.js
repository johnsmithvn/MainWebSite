// 📁 backend/api/video-cache.js – lấy random folder & file video từ DB movie
const express = require("express");
const router = express.Router();
const { getMovieDB } = require("../utils/db");
const { getRootPath } = require("../utils/config");

router.get("/video-cache", async (req, res) => {
  const {
    key,
    mode,
    type, // file | folder
  } = req.query;

  if (!key || !mode)
    return res.status(400).json({ error: "Missing key or mode" });

  const db = getMovieDB(key);
  const rootPath = getRootPath(key);
  if (!db || !rootPath)
    return res.status(400).json({ error: "Invalid source key" });

  try {
    if (mode === "random") {
      let rows = db
        .prepare(
          `SELECT name, path, thumbnail,isFavorite, type FROM folders
            ORDER BY RANDOM() LIMIT 30`
        )
        .all();

      if (type === "file") {
        rows = rows.filter((r) => r.type === "file" || r.type === "video");
      } else if (type === "folder") {
        rows = rows.filter((r) => !r.type || r.type === "folder");
      }

      return res.json({ folders: rows });
    }
    if (mode === "top") {
      // Chỉ lấy file video có thumbnail
      const rows = db
        .prepare(
          `SELECT name, path, thumbnail, type, viewCount,isFavorite
          FROM folders
          WHERE (type = 'video' OR type = 'file')
            AND viewCount > 0
          ORDER BY viewCount DESC
          LIMIT 30`
        )
        .all();

      return res.json({ folders: rows });
    }
    const q = req.query.q || "";
    if (mode === "search") {
      if (!q || typeof q !== "string") {
        return res.status(400).json({ error: "Missing query" });
      }

      const type = req.query.type || "video"; // mặc định video
      let rows = [];

      if (type === "folder") {
        rows = db
          .prepare(
            `
    SELECT name, path, thumbnail, type, viewCount,isFavorite
    FROM folders
    WHERE (type IS NULL OR type = 'folder')
      AND name LIKE ?
    ORDER BY name COLLATE NOCASE ASC
  `
          )
          .all(`%${q}%`);
      } else if (type === "all") {
        rows = db
          .prepare(
            `
    SELECT name, path, thumbnail, type, viewCount,isFavorite
    FROM folders
    WHERE name LIKE ?
    ORDER BY name COLLATE NOCASE ASC
  `
          )
          .all(`%${q}%`);
      } else {
        rows = db
          .prepare(
            `
    SELECT name, path, thumbnail, type, viewCount,isFavorite
    FROM folders
    WHERE (type = 'video' OR type = 'file')
      AND name LIKE ?
    ORDER BY name COLLATE NOCASE ASC
  `
          )
          .all(`%${q}%`);
      }

      return res.json({ folders: rows });
    }
  } catch (err) {
    console.error("❌ video-cache error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
