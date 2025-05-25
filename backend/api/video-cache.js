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

  if (!key || !mode) return res.status(400).json({ error: "Missing key or mode" });

  const db = getMovieDB(key);
  const rootPath = getRootPath(key);
  if (!db || !rootPath) return res.status(400).json({ error: "Invalid source key" });

  try {
    if (mode === "random") {
      let rows = db.prepare(
        `SELECT name, path, thumbnail, type FROM folders
         ORDER BY RANDOM() LIMIT 30`
      ).all();

      if (type === "file") {
        rows = rows.filter((r) => r.type === "file" || r.type === "video");
      } else if (type === "folder") {
        rows = rows.filter((r) => !r.type || r.type === "folder");
      }

      return res.json({ folders: rows });
    }

    return res.status(400).json({ error: "Invalid mode" });
  } catch (err) {
    console.error("❌ video-cache error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
