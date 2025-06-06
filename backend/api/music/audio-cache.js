// 📁 backend/api/music/audio-cache.js
const express = require("express");
const router = express.Router();
const { getMusicDB } = require("../../utils/db");
const { getRootPath } = require("../../utils/config");

router.get("/audio-cache", async (req, res) => {
  const { key, mode, type } = req.query;

  if (!key || !mode) return res.status(400).json({ error: "Missing key or mode" });

  const db = getMusicDB(key);
  const rootPath = getRootPath(key);
  if (!db || !rootPath) return res.status(400).json({ error: "Invalid source key" });

  try {
    let rows = [];

    if (mode === "random") {
      if (type === "file") {
        rows = db.prepare(`
          SELECT name, path, thumbnail, isFavorite, type FROM folders
          WHERE type = 'audio' OR type = 'file'
          ORDER BY RANDOM() LIMIT 30
        `).all();
      } else if (type === "folder") {
        rows = db.prepare(`
          SELECT name, path, thumbnail, isFavorite, type FROM folders
          WHERE type IS NULL OR type = 'folder'
          ORDER BY RANDOM() LIMIT 30
        `).all();
      } else {
        rows = db.prepare(`
          SELECT name, path, thumbnail, isFavorite, type FROM folders
          ORDER BY RANDOM() LIMIT 30
        `).all();
      }

      return res.json({ folders: rows });
    }

    if (mode === "top") {
      rows = db.prepare(`
        SELECT name, path, thumbnail, type, viewCount, isFavorite
        FROM folders
        WHERE (type = 'audio' OR type = 'file')
          AND viewCount > 0
        ORDER BY viewCount DESC
        LIMIT 30
      `).all();

      return res.json({ folders: rows });
    }

    if (mode === "search") {
      const q = req.query.q || "";
      if (!q || typeof q !== "string") {
        return res.status(400).json({ error: "Missing query" });
      }

      const searchType = req.query.type || "audio";
      if (searchType === "folder") {
        rows = db.prepare(`
          SELECT name, path, thumbnail, type, viewCount, isFavorite
          FROM folders
          WHERE (type IS NULL OR type = 'folder') AND name LIKE ?
          ORDER BY name COLLATE NOCASE ASC
        `).all(`%${q}%`);
      } else if (searchType === "all") {
        rows = db.prepare(`
          SELECT name, path, thumbnail, type, viewCount, isFavorite
          FROM folders
          WHERE name LIKE ?
          ORDER BY name COLLATE NOCASE ASC
        `).all(`%${q}%`);
      } else {
        rows = db.prepare(`
          SELECT name, path, thumbnail, type, viewCount, isFavorite
          FROM folders
          WHERE (type = 'audio' OR type = 'file') AND name LIKE ?
          ORDER BY name COLLATE NOCASE ASC
        `).all(`%${q}%`);
      }

      return res.json({ folders: rows });
    }

    res.status(400).json({ error: "Invalid mode" });
  } catch (err) {
    console.error("❌ audio-cache error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
