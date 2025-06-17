const express = require("express");
const router = express.Router();
const { getMusicDB } = require("../../utils/db");

router.get("/music-meta", (req, res) => {
  const dbkey = req.query.key;
  const relPath = req.query.path;

  if (!dbkey || !relPath) return res.status(400).json({ error: "Thiếu key hoặc path" });
  try {
    const db = getMusicDB(dbkey);
    const row = db.prepare(`SELECT * FROM songs WHERE path = ?`).get(relPath);
    res.json(row || {});
  } catch (err) {
    console.error("music-meta", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
