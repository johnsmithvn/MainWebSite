const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const { getRootPath } = require("../../utils/config");
const { getMusicDB } = require("../../utils/db");
const { findThumbFile } = require("../../utils/thumbnailUtils");

router.post("/folder-thumbnail", (req, res) => {
  const { key, folderPath, srcPath } = req.body;
  if (!key || !folderPath || !srcPath)
    return res.status(400).json({ error: "Missing data" });
  try {
    const root = getRootPath(key);
    const srcAbs = path.join(root, srcPath);
    const srcThumbDir = path.join(path.dirname(srcAbs), ".thumbnail");
    const baseName = path.basename(srcPath, path.extname(srcPath));
    const found = findThumbFile(srcThumbDir, baseName);
    if (!found) return res.status(404).json({ error: "Thumbnail not found" });

    const folderAbs = path.join(root, folderPath);
    const folderName = path.basename(folderAbs);
    const destDir = path.join(folderAbs, ".thumbnail");
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir);
    const dest = path.join(destDir, folderName + found.ext);
    fs.copyFileSync(found.file, dest);

    const db = getMusicDB(key);
    db.prepare(
      `UPDATE folders SET thumbnail = ?, updatedAt = ? WHERE path = ?`
    ).run(path.posix.join(".thumbnail", folderName + found.ext), Date.now(), folderPath);

    res.json({ success: true });
  } catch (err) {
    console.error("folder-thumbnail error", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/playlist-thumbnail", (req, res) => {
  const { key, playlistId, srcPath } = req.body;
  if (!key || !playlistId || !srcPath)
    return res.status(400).json({ error: "Missing data" });
  try {
    const root = getRootPath(key);
    const srcAbs = path.join(root, srcPath);
    const srcThumbDir = path.join(path.dirname(srcAbs), ".thumbnail");
    const baseName = path.basename(srcPath, path.extname(srcPath));
    const found = findThumbFile(srcThumbDir, baseName);
    if (!found) return res.status(404).json({ error: "Thumbnail not found" });

    const destDir = path.join(root, "playlist_thumbs");
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir);
    const dest = path.join(destDir, String(playlistId) + found.ext);
    fs.copyFileSync(found.file, dest);
    const rel = path.posix.join("playlist_thumbs", String(playlistId) + found.ext);

    const db = getMusicDB(key);
    db.prepare(
      `UPDATE playlists SET thumbnail = ?, updatedAt = ? WHERE id = ?`
    ).run(rel, Date.now(), playlistId);

    res.json({ success: true, thumbnail: rel });
  } catch (err) {
    console.error("playlist-thumbnail error", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
