const fs = require("fs");
const path = require("path");
const express = require("express");
const router = express.Router();
const { getRootPath } = require("../../utils/config");
const { getMusicDB } = require("../../utils/db");

// Hàm extract thumbnail (cho file hoặc folder/subfolder)
async function extractThumbnailSmart({ key, relPath = "" }) {
  const rootPath = getRootPath(key);
  const absPath = path.join(rootPath, relPath);
  if (!fs.existsSync(absPath)) return { success: false, message: "Not found" };

  const stat = fs.statSync(absPath);

  // Nếu là thư mục: đệ quy từng file/folder con
  if (stat.isDirectory()) {
    let count = 0;
    let firstMusicThumb = null;
    const entries = fs.readdirSync(absPath, { withFileTypes: true });

    for (const entry of entries) {
      const childRelPath = path.posix.join(relPath, entry.name);
      const result = await extractThumbnailSmart({
        key,
        relPath: childRelPath,
      });
      // Nếu là nhạc đầu tiên có thumbnail thì lưu lại
      if (
        !firstMusicThumb &&
        result &&
        result.success &&
        result.thumb &&
        entry.isFile() &&
        [
          ".mp3", ".flac", ".wav", ".aac", ".m4a", ".ogg", ".opus", ".wma", ".alac", ".aiff"
        ].includes(path.extname(entry.name).toLowerCase())
      ) {
        const thumbDir = path.join(absPath, ".thumbnail");
        const name = path.basename(entry.name, path.extname(entry.name));
        const ext = path.extname(result.thumb); // lấy .jpg hoặc .png
        const thumbFile = path.join(thumbDir, name + ext);
        if (fs.existsSync(thumbFile)) {
          firstMusicThumb = thumbFile;
        }
      }
      if (result && result.success) count += result.count || 1;
    }

    // Tạo thumbnail đại diện cho folder nếu có nhạc
    if (firstMusicThumb) {
      const folderName = path.basename(absPath);
      const thumbDir = path.join(absPath, ".thumbnail");
      const folderThumb = path.join(thumbDir, folderName + ".jpg");
      if (!fs.existsSync(folderThumb)) {
        fs.copyFileSync(firstMusicThumb, folderThumb);
      }
      // Update thumbnail cho folder trong DB
      const db = getMusicDB(key);
      db.prepare(
        `UPDATE folders SET thumbnail = ?, updatedAt = ? WHERE name = ? AND path = ?`
      ).run(
        path.posix.join(".thumbnail", folderName + ".jpg"),
        Date.now(),
        folderName,
        relPath
      );
    }

    return { success: true, message: "Extracted all in folder", count };
  }

  // Nếu là file nhạc: extract thumbnail
  if (
    [
      ".mp3",
      ".flac",
      ".wav",
      ".aac",
      ".m4a",
      ".ogg",
      ".opus",
      ".wma",
      ".alac",
      ".aiff",
    ].includes(path.extname(absPath).toLowerCase())
  ) {
    try {
      const { parseFile } = await import("music-metadata");
      const metadata = await parseFile(absPath);
      const common = metadata.common;
      if (common.picture && common.picture.length > 0) {
        const pic = common.picture[0];
        const ext = pic.format.includes("png") ? ".png" : ".jpg";
        const name = path.basename(relPath, path.extname(relPath));
        const baseDir = path.dirname(absPath);
        const thumbFolder = path.join(baseDir, ".thumbnail");
        if (!fs.existsSync(thumbFolder)) fs.mkdirSync(thumbFolder);
        const thumbFile = path.join(thumbFolder, name + ext);
        fs.writeFileSync(thumbFile, pic.data);
        // === UPDATE DB thumbnail ===
        const db = getMusicDB(key);
        db.prepare(
          `UPDATE folders SET thumbnail = ?, updatedAt = ? WHERE name = ? AND path = ?`
        ).run(
          path.posix.join(".thumbnail", name + ext),
          Date.now(),
          name,
          relPath
        );
        // === END UPDATE ===
        return {
          success: true,
          thumb: path.posix.join(".thumbnail", name + ext),
          count: 1,
        };
      }
      return { success: false, message: "No embedded picture found" };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  return { success: false, message: "Not audio file or folder" };
}

// API duy nhất
router.post("/extract-thumbnail", async (req, res) => {
  const { key, path: relPath = "" } = req.body;
  if (!key) return res.status(400).json({ error: "Missing key" });

  try {
    const result = await extractThumbnailSmart({ key, relPath });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
