const fs = require("fs");
const path = require("path");
const express = require("express");
const router = express.Router();
const { getRootPath } = require("../../utils/config");
const { getMovieDB } = require("../../utils/db");
const ffmpeg = require("fluent-ffmpeg");
const ffprobe = require("ffprobe-static");
ffmpeg.setFfprobePath(ffprobe.path);

const VIDEO_EXTS = [".mp4", ".mkv", ".avi", ".mov", ".webm"];

// Hàm extract thumbnail cho file hoặc folder/subfolder, và update DB cho cả video & folder cha
async function extractMovieThumbnailSmart({ key, relPath = "" }) {
  const rootPath = getRootPath(key);
  const absPath = path.join(rootPath, relPath);
  if (!fs.existsSync(absPath)) return { success: false, message: "Not found" };

  const stat = fs.statSync(absPath);

  // Nếu là thư mục: đệ quy, sau đó tạo thumbnail đại diện folder nếu có ít nhất 1 video
  if (stat.isDirectory()) {
    let count = 0;
    let firstVideoThumb = null;
    const entries = fs.readdirSync(absPath, { withFileTypes: true });
    for (const entry of entries) {
      const childRelPath = path.posix.join(relPath, entry.name);
      const result = await extractMovieThumbnailSmart({
        key,
        relPath: childRelPath,
      });
      // Nếu là video đầu tiên trong folder, lưu lại thumbnail làm đại diện
      if (
        !firstVideoThumb &&
        result &&
        result.success &&
        result.thumb &&
        entry.isFile() &&
        VIDEO_EXTS.includes(path.extname(entry.name).toLowerCase())
      ) {
        // Lấy path tuyệt đối file thumbnail
        const baseDir = path.join(absPath, ".thumbnail");
        const name = path.basename(entry.name, path.extname(entry.name));
        const thumbFile = path.join(baseDir, name + ".jpg");
        if (fs.existsSync(thumbFile)) {
          firstVideoThumb = thumbFile;
        }
      }
      if (result && result.success) count += result.count || 1;
    }

    // Tạo thumbnail đại diện cho folder cha nếu có video
    if (firstVideoThumb) {
      const folderName = path.basename(absPath);
      const thumbDir = path.join(absPath, ".thumbnail");
      const folderThumb = path.join(thumbDir, folderName + ".jpg");
      if (!fs.existsSync(folderThumb)) {
        fs.copyFileSync(firstVideoThumb, folderThumb);
      }

      // Update thumbnail vào DB cho folder cha
      const db = getMovieDB(key);
      const existing = db
        .prepare(`SELECT * FROM folders WHERE path = ?`)
        .get(relPath);
      if (!existing) {

        db.prepare(
          `INSERT INTO folders (name, path, thumbnail, type, createdAt, updatedAt)
     VALUES (?, ?, ?, 'folder', ?, ?)`
        ).run(
          folderName,
          relPath,
          path.posix.join(".thumbnail", folderName + ".jpg"),
          Date.now(),
          Date.now()
        );
      } else {
        console.log("[EXTRACT MOVIE] UPDATE FOLDER:", folderName, relPath);

        db.prepare(
          `UPDATE folders SET thumbnail = ?, updatedAt = ? WHERE name = ? AND path = ?`
        ).run(
          path.posix.join(".thumbnail", folderName + ".jpg"),
          Date.now(),
          folderName,
          relPath
        );
      }
    }

    return { success: true, message: "Extracted all in folder", count };
  }

  // Nếu là file video
  // Nếu là file video
  if (VIDEO_EXTS.includes(path.extname(absPath).toLowerCase())) {
    try {
      const name = path.basename(relPath, path.extname(relPath));
      const baseDir = path.dirname(absPath);
      const thumbFolder = path.join(baseDir, ".thumbnail");
      if (!fs.existsSync(thumbFolder)) fs.mkdirSync(thumbFolder);
      const thumbFile = path.join(thumbFolder, name + ".jpg");
      let needExtract = !fs.existsSync(thumbFile);

      // Nếu chưa có thumbnail, dùng ffmpeg extract frame random
      if (needExtract) {
        const duration = await new Promise((resolve) => {
          ffmpeg.ffprobe(absPath, (err, metadata) => {
            if (err) return resolve(10);
            const d = parseFloat(metadata?.format?.duration);
            resolve(Math.floor(d || 10));
          });
        });
        let randSec = 1;
        if (duration > 4)
          randSec = Math.floor(Math.random() * (duration - 4)) + 2;

        await new Promise((resolve, reject) => {
          ffmpeg(absPath)
            .on("end", resolve)
            .on("error", reject)
            .screenshots({
              count: 1,
              timemarks: [randSec],
              filename: name + ".jpg",
              folder: thumbFolder,
              size: "480x?",
            });
        });
      }

      // ==== SỬA ĐOẠN UPDATE DB Ở ĐÂY ====
      const db = getMovieDB(key);
      const res = db
        .prepare(
          `UPDATE folders SET thumbnail = ?, updatedAt = ? WHERE path = ?`
        )
        .run(path.posix.join(".thumbnail", name + ".jpg"), Date.now(), relPath);
     
      // ==== END SỬA ====

      return {
        success: true,
        thumb: path.posix.join(".thumbnail", name + ".jpg"),
        count: 1,
      };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  return { success: false, message: "Not video file or folder" };
}

// API duy nhất
router.post("/extract-thumbnail", async (req, res) => {
  const { key, path: relPath = "" } = req.body;
  if (!key) return res.status(400).json({ error: "Missing key" });

  try {
    const result = await extractMovieThumbnailSmart({ key, relPath });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
