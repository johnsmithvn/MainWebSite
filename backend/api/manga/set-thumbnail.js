const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const { getRootPath } = require("../../utils/config");
const { getDB } = require("../../utils/db");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

router.post("/folder-thumbnail", (req, res) => {
  const { key, root, folderPath, srcPath } = req.body;
  if (!key || !root || !folderPath || !srcPath) {
    return res.status(400).json({ error: "Missing data" });
  }
  try {
    const base = getRootPath(key);
    const srcAbs = path.join(base, srcPath);
    if (!fs.existsSync(srcAbs)) {
      return res.status(404).json({ error: "Source not found" });
    }
    const ext = path.extname(srcAbs).toLowerCase();
    const folderAbs = path.join(base, root, folderPath);
    const folderName = path.basename(folderAbs);
    const destDir = path.join(folderAbs, ".thumbnail");
    ensureDir(destDir);
    const dest = path.join(destDir, folderName + ext);
    fs.copyFileSync(srcAbs, dest);

    const db = getDB(key);
    db.prepare(
      `UPDATE folders SET thumbnail = ?, updatedAt = ? WHERE root = ? AND path = ?`
    ).run(path.posix.join(".thumbnail", folderName + ext), Date.now(), root, folderPath);

    res.json({ success: true });
  } catch (err) {
    console.error("folder-thumbnail error", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/root-thumbnail", (req, res) => {
  const { key, rootFolder, srcPath } = req.body;
  if (!key || !rootFolder || !srcPath) {
    return res.status(400).json({ error: "Missing data" });
  }
  try {
    const base = getRootPath(key);
    const srcAbs = path.join(base, srcPath);
    if (!fs.existsSync(srcAbs)) {
      return res.status(404).json({ error: "Source not found" });
    }
    const ext = path.extname(srcAbs).toLowerCase();
    const dest = path.join(base, rootFolder, "cover" + ext);
    fs.copyFileSync(srcAbs, dest);
    const db = getDB(key);
    db.prepare(
      `INSERT INTO root_thumbnails (rootKey, rootFolder, thumbnail, updatedAt)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(rootKey, rootFolder)
       DO UPDATE SET thumbnail = excluded.thumbnail, updatedAt = excluded.updatedAt`
    ).run(key, rootFolder, path.posix.join(rootFolder, "cover" + ext), Date.now());
    res.json({ success: true });
  } catch (err) {
    console.error("root-thumbnail error", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
