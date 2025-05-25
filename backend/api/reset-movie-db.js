// 📁 backend/api/reset-movie-db.js
const express = require("express");
const router = express.Router();
const { getMovieDB } = require("../utils/db");

router.delete("/", (req, res) => {
  const dbkey = req.query.key || req.body.key;
  if (!dbkey) return res.status(400).json({ error: "Thiếu key" });
  const db = getMovieDB(dbkey);
  try {
    db.prepare("DELETE FROM folders").run();
    res.json({ ok: true, message: "Đã xoá toàn bộ DB movie!" });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
