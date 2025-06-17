// 📁 backend/api/music/playlist.js
const express = require("express");
const router = express.Router();
const { getMusicDB } = require("../../utils/db");

function now() {
  return Date.now();
}

// 📄 GET /api/music/playlists
router.get("/playlists", (req, res) => {
  const { key } = req.query;
  if (!key) return res.status(400).json({ error: "Thiếu key" });
  try {
    const db = getMusicDB(key);
    const rows = db
      .prepare(
        `
    SELECT id, name, description, thumbnail FROM playlists
    ORDER BY updatedAt DESC
  `
      )
      .all();

    res.json(rows);
  } catch (err) {
    console.error("playlists", err);
    res.status(500).json({ error: "Server error" });
  }
});

// 🎵 GET bài hát trong playlist
// 🎵 GET bài hát trong playlist + tên playlist
router.get("/playlist/:id", (req, res) => {
  const { key } = req.query;
  const id = req.params.id;
  if (!key || !id) return res.status(400).json({ error: "Thiếu key hoặc id" });
  try {
    const db = getMusicDB(key);

    // Lấy thông tin tên playlist
    const playlist = db
      .prepare(`SELECT id, name, description, thumbnail FROM playlists WHERE id = ?`)
      .get(id);

    // Lấy danh sách track
    const items = db
      .prepare(
        `
  SELECT
    f.*,
    s.artist,
    s.album,
    s.genre,
    s.lyrics
  FROM playlist_items pi
  JOIN folders f ON f.path = pi.songPath
  LEFT JOIN songs s ON s.path = f.path
  WHERE pi.playlistId = ?
  ORDER BY pi.sortOrder ASC
`
      )
      .all(id);

    if (!playlist) {
      return res.status(404).json({ error: "Playlist không tồn tại" });
    }

    res.json({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      thumbnail: playlist.thumbnail || null,
      tracks: items,
    });
  } catch (err) {
    console.error("playlist/:id", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ➕ Tạo playlist
router.post("/playlist", (req, res) => {
  const { key, name, description } = req.body;
  if (!key || !name)
    return res.status(400).json({ error: "Thiếu key hoặc tên playlist" });
  try {
    const db = getMusicDB(key);
    const id = db
      .prepare(
        `
    INSERT INTO playlists (name, description, createdAt, updatedAt)
    VALUES (?, ?, ?, ?)
  `
      )
      .run(name, description || "", now(), now()).lastInsertRowid;

    res.json({ success: true, id });
  } catch (err) {
    console.error("playlist create", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ➕ Thêm bài hát vào playlist
router.post("/playlist/add", (req, res) => {
  const { key, playlistId, path } = req.body;
  if (!key || !playlistId || !path)
    return res.status(400).json({ error: "Thiếu dữ liệu" });
  try {
    const db = getMusicDB(key);
    const exists = db
      .prepare(
        `
    SELECT 1 FROM playlist_items WHERE playlistId = ? AND songPath = ?
  `
      )
      .get(playlistId, path);
    if (exists) return res.json({ success: true, message: "Đã có" });

    // Determine next sortOrder so that tracks maintain added order
    const maxOrderRow = db
      .prepare(
        `SELECT MAX(sortOrder) as maxOrder FROM playlist_items WHERE playlistId = ?`
      )
      .get(playlistId);
    const nextOrder = (maxOrderRow?.maxOrder ?? 0) + 1;

    db.prepare(
      `
    INSERT INTO playlist_items (playlistId, songPath, sortOrder)
    VALUES (?, ?, ?)
  `
    ).run(playlistId, path, nextOrder);

    db.prepare(`UPDATE playlists SET updatedAt = ? WHERE id = ?`).run(
      now(),
      playlistId
    );

    res.json({ success: true });
  } catch (err) {
    console.error("playlist add", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ❌ Xoá bài hát khỏi playlist
router.delete("/playlist/remove", (req, res) => {
  const { key, playlistId, path } = req.body;
  if (!key || !playlistId || !path)
    return res.status(400).json({ error: "Thiếu dữ liệu" });
  try {
    const db = getMusicDB(key);
    db.prepare(
      `
    DELETE FROM playlist_items WHERE playlistId = ? AND songPath = ?
  `
    ).run(playlistId, path);

    res.json({ success: true });
  } catch (err) {
    console.error("playlist/remove", err);
    res.status(500).json({ error: "Server error" });
  }
});

// 🗑️ Xoá playlist hoàn toàn
router.delete("/playlist", (req, res) => {
  const { key, id } = req.body;
  if (!key || !id) return res.status(400).json({ error: "Thiếu key hoặc id" });
  try {
    const db = getMusicDB(key);
    db.prepare(`DELETE FROM playlist_items WHERE playlistId = ?`).run(id);
    db.prepare(`DELETE FROM playlists WHERE id = ?`).run(id);

    res.json({ success: true });
  } catch (err) {
    console.error("playlist delete", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
