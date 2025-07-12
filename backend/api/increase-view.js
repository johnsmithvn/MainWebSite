const express = require("express");
const router = express.Router();
const { getDB, getMovieDB, getMusicDB } = require("../utils/db");
const { getRootPath } = require("../utils/config");
const { incrementViewCount } = require("../utils/databaseUtils");

/**
 * 📈 Ghi lượt xem cho folder (POST)
 * Body: { path: "1/Naruto", dbkey: "..." }
 */
router.post("/increase-view", (req, res) => {
  let { path, dbkey, rootKey } = req.body;

  // --- Validate đầu vào ---
  if (!path || typeof path !== "string" || !dbkey) {
    return res.status(400).json({ error: "Missing valid 'root' or 'path'" });
  }

  const rootPath = getRootPath(dbkey);
  if (!rootPath) {
    return res.status(400).json({ error: "Invalid dbkey key" });
  }

  // ✅ Normalize nếu là folder giả
  if (path.endsWith("/__self__")) {
    path = path.replace(/\/__self__$/, "");
  }

  if (!path || typeof path !== "string") {
    return res.status(400).json({ error: "Missing valid 'path'" });
  }
  try {
    const db = getDB(dbkey);
    incrementViewCount(db, rootKey, path);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Lỗi tăng lượt xem:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 📈 Ghi lượt xem video (movie)
router.post("/increase-view/movie", (req, res) => {
  const { key, path } = req.body;

  if (!key || !path) {
    return res.status(400).json({ error: "Missing key or path" });
  }

  try {
    const db = getMovieDB(key);
    incrementViewCount(db, null, path, 'folders', 'viewCount');
    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Error tăng view movie:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 📈 Ghi lượt xem cho bài hát (music)
router.post("/increase-view/music", (req, res) => {
  const { key, path } = req.body;

  if (!key || !path) {
    return res.status(400).json({ error: "Missing key or path" });
  }

  try {
    const db = getMusicDB(key);
    incrementViewCount(db, null, path, 'folders', 'viewCount');
    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Error tăng view music:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
