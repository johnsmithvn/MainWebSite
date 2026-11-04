// 📁 backend/utils/cache-scan.js
const fs = require("fs");
const path = require("path");
const { getDB } = require("../utils/db");
const { getRootPath } = require("./config");
const {
  hasImageRecursivelyAsync,
  findFirstImageRecursivelyAsync,
} = require("./imageUtils");

// ⚡ Scan manga dùng fs.promises nên không còn chặn event loop (ISSUES P1): server vẫn trả lời
// request khác trong lúc scan. Dữ liệu ghi vào DB giữ nguyên như bản đồng bộ trước đây.

const SKIP_NAMES = [".git", "node_modules", "__MACOSX", ".Trash", ".DS_Store"];
const CHAPTER_IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".avif"];

// 🔒 Mỗi (dbkey, root) chỉ chạy một scan/reset tại một thời điểm. Bản đồng bộ cũ tự nhiên
// tuần tự; bản async cần khoá, nếu không phase 1 của lần scan sau đặt scanned = 0 giữa chừng
// và phase 3 của lần trước xoá nhầm bản ghi.
const locks = new Map();

function runExclusive(lockKey, task) {
  const previous = locks.get(lockKey) || Promise.resolve();
  const current = previous.catch(() => {}).then(task);
  locks.set(lockKey, current);
  current
    .finally(() => {
      if (locks.get(lockKey) === current) locks.delete(lockKey);
    })
    .catch(() => {});
  return current;
}

/**
 * ✅ Đệ quy quét một cấp thư mục bên trong root
 * 📌 Nếu folder có ảnh thì thêm vào DB (nếu chưa có)
 * 📌 Nếu lastModified mới hơn thì update thumbnail
 * @param {object} ctx - { db, root, rootPath, stats, hasImage }
 * @param {string} currentPath - thư mục con bên trong root ("" = chính root)
 */
async function scanLevel(ctx, currentPath) {
  const { db, root, rootPath, stats, hasImage } = ctx;
  const fullPath = path.join(rootPath, currentPath);

  // ⚠️ Bỏ qua nếu cả folder và subfolder đều không có ảnh
  if (!(await hasImage(fullPath))) return false;

  let entries = [];
  try {
    entries = await fs.promises.readdir(fullPath, { withFileTypes: true });
  } catch (err) {
    console.warn(`❌ Không thể đọc thư mục: ${fullPath}`, err.message);
    return false;
  }

  // 📌 Thu thập tên các folder rỗng làm otherName cho folder hiện tại
  if (currentPath) {
    const aliasNames = [];
    for (const e of entries) {
      if (!e.isDirectory() || SKIP_NAMES.includes(e.name)) continue;
      const p = path.join(fullPath, e.name);
      try {
        if ((await fs.promises.readdir(p)).length === 0) aliasNames.push(e.name);
      } catch (err) {
        console.warn(`❌ Không thể đọc thư mục con: ${p}`, err.message);
      }
    }
    const alias = aliasNames.join(",");
    const existingFolder = db
      .prepare(`SELECT otherName FROM folders WHERE root = ? AND path = ?`)
      .get(root, currentPath);
    if (existingFolder && alias !== existingFolder.otherName) {
      db.prepare(
        `UPDATE folders SET otherName = ? WHERE root = ? AND path = ?`
      ).run(alias || null, root, currentPath);
    }
  }

  for (const entry of entries) {
    if (!entry.isDirectory() || SKIP_NAMES.includes(entry.name)) continue;

    const relativePath = path.posix.join(currentPath, entry.name);
    const fullChildPath = path.join(fullPath, entry.name);

    if (await hasImage(fullChildPath)) {
      stats.scanned++;
      const statsInfo = await fs.promises.stat(fullChildPath);
      const lastModified = statsInfo.mtimeMs;
      const thumbnail = await findFirstImageRecursivelyAsync(root, rootPath, fullChildPath);

      let childEntries = [];
      try {
        childEntries = await fs.promises.readdir(fullChildPath, { withFileTypes: true });
      } catch (err) {
        console.warn(`❌ Không thể đọc thư mục con: ${fullChildPath}`, err.message);
        continue;
      }

      // Đọc bản ghi sau các lệnh await ở trên để dùng dữ liệu mới nhất
      const existing = db
        .prepare(`SELECT * FROM folders WHERE root = ? AND path = ?`)
        .get(root, relativePath);

      const imageCount = childEntries.filter(
        (e) =>
          e.isFile() &&
          CHAPTER_IMAGE_EXTS.includes(path.extname(e.name).toLowerCase())
      ).length;

      const chapterCount = childEntries.filter((e) => e.isDirectory()).length;

      if (!existing) {
        db.prepare(
          `INSERT INTO folders (
          root, name, path, thumbnail,
          lastModified, imageCount, chapterCount, otherName, type, scanned, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
        ).run(
          root,
          entry.name,
          relativePath,
          thumbnail,
          lastModified,
          imageCount,
          chapterCount,
          null,
          "folder",
          Date.now(),
          Date.now()
        );
        stats.inserted++;
      } else if (existing.lastModified < lastModified) {
        db.prepare(
          `UPDATE folders
         SET thumbnail = ?, lastModified = ?, imageCount = ?, chapterCount = ?, scanned = 1, updatedAt = ?
         WHERE root = ? AND path = ?`
        ).run(
          thumbnail,
          lastModified,
          imageCount,
          chapterCount,
          Date.now(),
          root,
          relativePath
        );
        stats.updated++;
      } else {
        db.prepare(`UPDATE folders SET scanned = 1 WHERE root = ? AND path = ?`)
          .run(root, relativePath);
        stats.skipped++;
      }
    }

    // 🔁 Đệ quy tiếp
    await scanLevel(ctx, relativePath);
  }

  return true;
}

async function scanRoot(dbkey, root) {
  const db = getDB(dbkey); // Lấy DB từ dbkey => xác định db
  const rootPath = path.join(getRootPath(dbkey), root); // Lấy đường dẫn root từ config
  const memo = new Map();
  const ctx = {
    db,
    root,
    rootPath,
    stats: { scanned: 0, inserted: 0, updated: 0, skipped: 0, deleted: 0 },
    hasImage: (dir) => hasImageRecursivelyAsync(dir, memo),
  };

  // 🗑️ PHASE 1: Mark all as unscanned
  db.prepare(`UPDATE folders SET scanned = 0 WHERE root = ?`).run(root);

  // PHASE 2: duyệt cây. Nếu root không có ảnh/không đọc được thì dừng, KHÔNG xoá gì (như trước)
  const completed = await scanLevel(ctx, "");
  if (!completed) return ctx.stats;

  // 🗑️ PHASE 3: Sweep orphaned records
  const orphanedCount = db.prepare(
    `SELECT COUNT(*) as count FROM folders WHERE root = ? AND scanned = 0`
  ).get(root).count;

  if (orphanedCount > 0) {
    db.prepare(`DELETE FROM folders WHERE root = ? AND scanned = 0`).run(root);
    ctx.stats.deleted = orphanedCount;
    console.log(`🗑️ Deleted ${ctx.stats.deleted} orphaned manga records in root "${root}"`);
  }

  return ctx.stats;
}

function lockKeyOf(dbkey, root) {
  return `${String(dbkey).toUpperCase()}::${root}`;
}

/**
 * 🚀 Quét toàn bộ một thư mục gốc manga vào DB (giữ bản ghi cũ, xoá bản ghi không còn trên ổ đĩa)
 * @param {string} dbkey - key nguồn (ROOT_*)
 * @param {string} root - tên thư mục gốc bên trong nguồn
 * @returns {Promise<{scanned:number, inserted:number, updated:number, skipped:number, deleted:number}>}
 */
function scanFolderRecursive(dbkey, root) {
  return runExclusive(lockKeyOf(dbkey, root), () => scanRoot(dbkey, root));
}

/** 🔁 Xoá bản ghi của root rồi quét lại — chờ scan khác của cùng root chạy xong trước */
function resetAndScanRoot(dbkey, root) {
  return runExclusive(lockKeyOf(dbkey, root), () => {
    getDB(dbkey).prepare("DELETE FROM folders WHERE root = ?").run(root);
    return scanRoot(dbkey, root);
  });
}

module.exports = { scanFolderRecursive, resetAndScanRoot };
