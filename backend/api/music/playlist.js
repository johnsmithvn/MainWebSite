// 📁 backend/api/music/playlist.js
const express = require("express");
const router = express.Router();
const { getMusicDB } = require("../../utils/db");

function now() {
  return Date.now();
}

// 📄 GET /api/music/playlists
// Hỗ trợ songPath để đánh dấu playlist đã chứa bài hát (hasTrack) và ưu tiên lên đầu
router.get("/playlists", (req, res) => {
  const { key, songPath } = req.query;
  if (!key) return res.status(400).json({ error: "Thiếu key" });

  const db = getMusicDB(key);

  // Dynamic SQL: nếu có songPath thì thêm cột hasTrack và order theo hasTrack DESC
  const hasSong = typeof songPath === 'string' && songPath.length > 0;
  const baseSelect = `
    SELECT 
      p.id, 
      p.name, 
      p.description, 
      p.thumbnail,
      p.updatedAt
      ${hasSong ? `,
      EXISTS(
        SELECT 1 FROM playlist_items x 
        WHERE x.playlistId = p.id AND x.songPath = ?
      ) AS hasTrack` : ``}
    FROM playlists p
  `;

  const orderBy = hasSong ? `ORDER BY hasTrack DESC, p.updatedAt DESC` : `ORDER BY p.updatedAt DESC`;

  const sql = `${baseSelect}\n${orderBy}`;
  const rows = hasSong ? db.prepare(sql).all(songPath) : db.prepare(sql).all();

  res.json(rows);
});

// 🎵 GET bài hát trong playlist
// 🎵 GET bài hát trong playlist + tên playlist
router.get("/playlist/:id", (req, res) => {
  const { key } = req.query;
  const id = req.params.id;
  if (!key || !id) return res.status(400).json({ error: "Thiếu key hoặc id" });

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
});

// ➕ Tạo playlist
router.post("/playlist", (req, res) => {
  const { key, name, description } = req.body;
  if (!key || !name)
    return res.status(400).json({ error: "Thiếu key hoặc tên playlist" });

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
});

// ➕ Thêm bài hát vào playlist
router.post("/playlist/add", (req, res) => {
  const { key, playlistId, path } = req.body;
  if (!key || !playlistId || !path)
    return res.status(400).json({ error: "Thiếu dữ liệu" });

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
});

// ❌ Xoá bài hát khỏi playlist
router.delete("/playlist/remove", (req, res) => {
  const { key, playlistId, path } = req.body;
  if (!key || !playlistId || !path)
    return res.status(400).json({ error: "Thiếu dữ liệu" });

  const db = getMusicDB(key);
  db.prepare(
    `
    DELETE FROM playlist_items WHERE playlistId = ? AND songPath = ?
  `
  ).run(playlistId, path);

  res.json({ success: true });
});

// 🗑️ Xoá playlist hoàn toàn
router.delete("/playlist", (req, res) => {
  const { key, id } = req.body;
  if (!key || !id) return res.status(400).json({ error: "Thiếu key hoặc id" });

  const db = getMusicDB(key);
  db.prepare(`DELETE FROM playlist_items WHERE playlistId = ?`).run(id);
  db.prepare(`DELETE FROM playlists WHERE id = ?`).run(id);

  res.json({ success: true });
});

module.exports = router;
 
// 🧩 Cập nhật thứ tự bài hát trong playlist
// PATCH /api/music/playlist/order
// body: { key: string, playlistId: number, order: string[] } // order = danh sách songPath theo thứ tự mới
router.patch("/playlist/order", (req, res) => {
  const { key, playlistId, order } = req.body || {};
  if (!key || !playlistId || !Array.isArray(order)) {
    return res.status(400).json({ error: "Thiếu key, playlistId hoặc order" });
  }

  try {
    const db = getMusicDB(key);

    const updateStmt = db.prepare(
      `UPDATE playlist_items SET sortOrder = ? WHERE playlistId = ? AND songPath = ?`
    );
    const tx = db.transaction((paths) => {
      let updated = 0;
      paths.forEach((songPath, idx) => {
        const info = updateStmt.run(idx + 1, playlistId, songPath);
        updated += info.changes || 0;
      });
      db.prepare(`UPDATE playlists SET updatedAt = ? WHERE id = ?`).run(now(), playlistId);
      return updated;
    });

    const changes = tx(order);
    return res.json({ success: true, updated: changes });
  } catch (err) {
    console.error("Failed to update playlist order:", err);
    return res.status(500).json({ error: "Không thể cập nhật thứ tự playlist" });
  }
});
