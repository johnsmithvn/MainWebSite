const express = require("express");
const router = express.Router();
const { getDB } = require("../../utils/db");

router.get("/root-thumbnail", (req, res) => {
  const { key, root } = req.query;
  if (!key || !root) return res.status(400).json({ error: "Missing key or root" });
  try {
    const db = getDB(key);
    const row = db.prepare("SELECT thumbnail FROM root_thumbnails WHERE root = ?").get(root);
    res.json({ thumbnail: row ? row.thumbnail : null });
  } catch (err) {
    console.error("root-thumbnail get", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/root-thumbnail", (req, res) => {
  const { key, root, thumbnail } = req.body;
  if (!key || !root || !thumbnail)
    return res.status(400).json({ error: "Missing data" });
  try {
    const db = getDB(key);
    db.prepare(
      "INSERT INTO root_thumbnails (root, thumbnail) VALUES (?, ?) ON CONFLICT(root) DO UPDATE SET thumbnail = excluded.thumbnail"
    ).run(root, thumbnail);
    res.json({ success: true });
  } catch (err) {
    console.error("root-thumbnail set", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
