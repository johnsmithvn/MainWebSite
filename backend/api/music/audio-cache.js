// 📁 backend/api/music/audio-cache.js
const express = require("express");
const router = express.Router();
const { getMusicDB } = require("../../utils/db");
const { getRootPath } = require("../../utils/config");

router.get("/audio-cache", async (req, res) => {
  const { key, mode, type, limit = 0, offset = 0 } = req.query;

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
          WHERE (type = 'audio' OR type = 'file') AND name != '.thumbnail'
          ORDER BY RANDOM() LIMIT 30
        `).all();
      } else if (type === "folder") {
        rows = db.prepare(`
          SELECT name, path, thumbnail, isFavorite, type FROM folders
          WHERE (type IS NULL OR type = 'folder') AND name != '.thumbnail'
          ORDER BY RANDOM() LIMIT 30
        `).all();
      } else {
        rows = db.prepare(`
          SELECT name, path, thumbnail, isFavorite, type FROM folders
          WHERE name != '.thumbnail'
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
          AND name != '.thumbnail'
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
      const lim = parseInt(limit) > 0 ? parseInt(limit) : 50;
      const off = parseInt(offset) > 0 ? parseInt(offset) : 0;
      
      if (searchType === "folder") {
        rows = db.prepare(`
          SELECT name, path, thumbnail, type, viewCount, isFavorite
          FROM folders
          WHERE (type IS NULL OR type = 'folder')
            AND name != '.thumbnail'
            AND name LIKE ?
          ORDER BY name COLLATE NOCASE ASC
          LIMIT ? OFFSET ?
        `).all(`%${q}%`, lim, off);
      } else if (searchType === "all") {
        // ✨ ENHANCED: Search cả folder và file audio với metadata
        rows = db.prepare(`
          SELECT DISTINCT 
            f.name, f.path, f.thumbnail, f.type, f.viewCount, f.isFavorite,
            s.artist, s.album, s.title
          FROM folders f
          LEFT JOIN songs s ON f.path = s.path
          WHERE f.name != '.thumbnail'
            AND (
              f.name LIKE ? OR 
              COALESCE(s.artist, '') LIKE ? OR 
              COALESCE(s.album, '') LIKE ? OR 
              COALESCE(s.title, '') LIKE ?
            )
          ORDER BY f.name COLLATE NOCASE ASC
          LIMIT ? OFFSET ?
        `).all(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, lim, off);
      } else {
        // ✨ ENHANCED: Search chỉ file audio với metadata  
        rows = db.prepare(`
          SELECT DISTINCT 
            f.name, f.path, f.thumbnail, f.type, f.viewCount, f.isFavorite,
            s.artist, s.album, s.title
          FROM folders f
          LEFT JOIN songs s ON f.path = s.path
          WHERE (f.type = 'audio' OR f.type = 'file')
            AND f.name != '.thumbnail'
            AND (
              f.name LIKE ? OR 
              COALESCE(s.artist, '') LIKE ? OR 
              COALESCE(s.album, '') LIKE ? OR 
              COALESCE(s.title, '') LIKE ?
            )
          ORDER BY f.name COLLATE NOCASE ASC
          LIMIT ? OFFSET ?
        `).all(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, lim, off);
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
