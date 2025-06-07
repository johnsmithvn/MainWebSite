// 📁 backend/api/music/music-folder.js
const express = require("express");
const router = express.Router();
const { getMusicDB } = require("../../utils/db");

router.get("/music-folder", (req, res) => {
  const dbkey = req.query.key;
  const relPath = req.query.path || "";

  if (!dbkey) return res.status(400).json({ error: "Thiếu key" });

  const db = getMusicDB(dbkey);

  const items = db
    .prepare(
      `
      SELECT folders.*, songs.artist, songs.album, songs.genre, songs.lyrics
      FROM folders
      LEFT JOIN songs ON folders.path = songs.path
      WHERE folders.path LIKE ?
        AND folders.name != '.thumbnail'
      ORDER BY folders.type DESC, folders.name COLLATE NOCASE ASC
    `
    )
    .all(relPath ? `${relPath}/%` : "%");

  const baseDepth = relPath ? relPath.split("/").filter(Boolean).length : 0;
  const folders = items
    .filter((item) => {
      const itemDepth = item.path.split("/").filter(Boolean).length;
      return itemDepth === baseDepth + 1;
    })
    .map((item) => ({
      name: item.name,
      path: item.path,
      thumbnail: item.thumbnail,
      type: item.type,
      isFavorite: !!item.isFavorite,
      artist: item.artist,
      album: item.album,
      genre: item.genre,
      lyrics: item.lyrics,
      duration: item.duration,
    }));



  res.json({
    type: "music-folder",
    folders,
    total: folders.length,
  });
});

module.exports = router;
