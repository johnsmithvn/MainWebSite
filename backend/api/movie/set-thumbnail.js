const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const { getRootPath } = require("../../utils/config");
const { getMovieDB } = require("../../utils/db");
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

    const db = getMovieDB(key);
    db.prepare(
      `UPDATE folders SET thumbnail = ?, updatedAt = ? WHERE path = ?`
    ).run(path.posix.join(".thumbnail", folderName + found.ext), Date.now(), folderPath);

    res.json({ success: true });
  } catch (err) {
    console.error("movie folder-thumbnail error", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
