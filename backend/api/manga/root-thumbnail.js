const express = require("express");
const router = express.Router();
const { getDB } = require("../../utils/db");

// GET /api/manga/root-thumbnail?key=DBKEY&root=ROOT
router.get("/root-thumbnail", (req, res) => {
  const { key, root } = req.query;
  if (!key || !root) return res.status(400).json({ error: "Missing key or root" });
  try {
    const db = getDB(key);
    const row = db
      .prepare("SELECT thumbnail FROM root_thumbnails WHERE root = ?")
      .get(root);
    res.json({ thumbnail: row?.thumbnail || null });
  } catch (err) {
    console.error("root-thumbnail error", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
