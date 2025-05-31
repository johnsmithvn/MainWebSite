const fs = require("fs");
const path = require("path");
const { getRootPath } = require("./config");
const { getMovieDB } = require("./db");

const VIDEO_EXTS = [".mp4", ".mkv", ".avi", ".webm"];
const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".avif"];

/**
 * 🧠 Scan toàn bộ cây thư mục phim và lưu metadata vào DB (movie)
 * @param {string} dbkey - key ứng với V_MOVIE, dùng để xác định đường dẫn gốc và DB
 * @param {string} currentPath - đường dẫn thư mục con tương đối (bắt đầu từ gốc)
 * @param {object} stats - thống kê inserted/updated/skipped
 * @returns {object} stats
 */
function scanMovieFolderToDB(dbkey, currentPath = "", stats = { inserted: 0, updated: 0, skipped: 0 }) {
  const db = getMovieDB(dbkey);                        // 📂 Mở kết nối DB từ dbkey
  const rootPath = getRootPath(dbkey);                 // 🔍 Lấy đường dẫn thư mục gốc từ config
  const basePath = path.join(rootPath, currentPath);   // 📌 Tạo đường dẫn tuyệt đối đến thư mục hiện tại

  if (!fs.existsSync(basePath)) return stats;          // 🚫 Nếu thư mục không tồn tại → return luôn

  const entries = fs.readdirSync(basePath, { withFileTypes: true }); // 📚 Đọc tất cả entry trong thư mục

  for (const entry of entries) {
    const relPath = path.posix.join(currentPath, entry.name); // 📍 Tạo path tương đối lưu trong DB

    // 📁 Xử lý thư mục
    if (entry.isDirectory()) {
      let thumb = null;

      // 🔍 Tìm thumbnail trong thư mục (cover.jpg / folder.jpg)
      try {
        const childEntries = fs.readdirSync(path.join(basePath, entry.name), { withFileTypes: true });
        for (const c of childEntries) {
          if (c.isFile() && ["cover.jpg", "folder.jpg"].includes(c.name.toLowerCase())) {
            thumb = path.posix.join(relPath, c.name); // ✅ Gán thumbnail nếu tìm thấy
            break;
          }
        }
      } catch {}

      const existing = db.prepare(`SELECT * FROM folders WHERE path = ?`).get(relPath); // 🔍 Kiểm tra xem đã có trong DB chưa

      if (!existing) {
        // ✅ Chưa có ➜ thêm mới
        db.prepare(`
          INSERT INTO folders (name, path, thumbnail, type, createdAt, updatedAt)
          VALUES (?, ?, ?, 'folder', ?, ?)
        `).run(entry.name, relPath, thumb, Date.now(), Date.now());
        stats.inserted++;
      } else {
        // ❗ Đã có ➜ không thêm ➜ tính là skipped
        stats.skipped++;
      }

      // 🔁 Đệ quy vào folder con
      scanMovieFolderToDB(dbkey, relPath, stats);
    }

    // 🎞️ Xử lý video file
    if (entry.isFile() && VIDEO_EXTS.includes(path.extname(entry.name).toLowerCase())) {
      let thumb = null;
      const baseName = path.basename(entry.name, path.extname(entry.name));

      // 🔍 Tìm thumbnail có cùng tên với file video
      for (const ext of IMAGE_EXTS) {
        const thumbPath = path.join(basePath, baseName + ext);
        if (fs.existsSync(thumbPath)) {
          thumb = path.posix.join(currentPath, baseName + ext);
          break;
        }
      }

      const existing = db.prepare(`SELECT * FROM folders WHERE path = ?`).get(relPath);

      if (!existing) {
        // ✅ Video chưa tồn tại ➜ thêm mới
        db.prepare(`
          INSERT INTO folders (name, path, thumbnail, type, createdAt, updatedAt)
          VALUES (?, ?, ?, 'video', ?, ?)
        `).run(entry.name, relPath, thumb, Date.now(), Date.now());
        stats.inserted++;
      } else {
        // 🔁 Đã tồn tại ➜ chỉ update nếu thumbnail khác
        if (existing.thumbnail !== thumb) {
          db.prepare(`
            UPDATE folders SET thumbnail = ?, updatedAt = ? WHERE path = ?
          `).run(thumb, Date.now(), relPath);
          stats.updated++;
        } else {
          stats.skipped++; // ❗ Thumbnail trùng ➜ bỏ qua
        }
      }
    }
  }

  return stats; // ✅ Trả về kết quả thống kê cuối cùng
}

module.exports = { scanMovieFolderToDB };
