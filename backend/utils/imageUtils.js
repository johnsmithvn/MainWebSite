// 📁 backend/utils/imageUtils.js

const fs = require("fs");
const path = require("path");
const { FILE_EXTENSIONS } = require("../constants");

// Các định dạng file ảnh hợp lệ (bao gồm cả PDF để scan vào DB)
const IMAGE_EXTENSIONS = [...FILE_EXTENSIONS.IMAGE, ...FILE_EXTENSIONS.PDF];

/**
 * 📂 Đệ quy tìm ảnh đầu tiên trong folder hoặc subfolder
 * @param {string} dirPath - Đường dẫn tuyệt đối cần tìm
 * @param {string} baseUrl - URL gốc để convert (ví dụ "/manga")
 * @param {string} rootPath - Đường dẫn tuyệt đối của env join folder root
 * @returns {string|null} - URL public tới ảnh hoặc null nếu không có
 */
function findFirstImageRecursively(rootFolder, rootPath, dirPath) {
  const baseUrl = `/manga/${rootFolder}`; // Đường dẫn public tới ảnh

  if (!fs.existsSync(dirPath)) return null;

  const naturalCompare = require("string-natural-compare");

  const entries = fs
    .readdirSync(dirPath, { withFileTypes: true })
    .sort((a, b) => naturalCompare(a.name, b.name));

  const files = entries.filter((e) => e.isFile());
  const folders = entries.filter((e) => e.isDirectory());

  for (const file of files) {
    const ext = path.extname(file.name).toLowerCase();
    if (IMAGE_EXTENSIONS.includes(ext)) {
      const relativePath = path
        .relative(rootPath, path.join(dirPath, file.name))
        .replace(/\\/g, "/");

      const safe = relativePath.split("/").map(encodeURIComponent).join("/");
      return `${baseUrl}/${safe}`;
    }
  }
  for (const folder of folders) {
    const found = findFirstImageRecursively(
      rootFolder,
      rootPath,
      path.join(dirPath, folder.name)
    );
    if (found) return found;
  }

  return null;
}

/**
 * 📸 Kiểm tra folder có chứa ít nhất 1 ảnh hợp lệ không
 * @param {string} dirPath - Đường dẫn tuyệt đối
 * @returns {boolean}
 */
function hasImageRecursively(dirPath) {
  if (!fs.existsSync(dirPath)) return false;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (IMAGE_EXTENSIONS.includes(ext)) {
        return true;
      }
    }

    if (entry.isDirectory()) {
      if (hasImageRecursively(fullPath)) return true;
    }
  }

  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// ⚡ Bản async (fs.promises) cho scan manga — không chặn event loop (ISSUES P1).
// Kết quả giống hệt bản sync ở trên, kể cả cách xử lý lỗi: thư mục không tồn tại → false/null,
// lỗi đọc khác (vd. EACCES) → ném lỗi để scan dừng lại thay vì xoá nhầm dữ liệu.
// ─────────────────────────────────────────────────────────────────────────────

async function pathExists(p) {
  try {
    await fs.promises.access(p);
    return true;
  } catch {
    return false;
  }
}

async function readDirEntries(dirPath) {
  try {
    return await fs.promises.readdir(dirPath, { withFileTypes: true });
  } catch (err) {
    if (!(await pathExists(dirPath))) return null; // giống existsSync === false
    throw err;
  }
}

/**
 * @param {string} dirPath
 * @param {Map<string, Promise<boolean>>} [memo] - nhớ kết quả trong một lần scan để không
 *   duyệt lại cây con ở mỗi cấp (trước đây ~O(n·depth))
 */
function hasImageRecursivelyAsync(dirPath, memo) {
  if (memo && memo.has(dirPath)) return memo.get(dirPath);
  const result = (async () => {
    const entries = await readDirEntries(dirPath);
    if (!entries) return false;
    for (const entry of entries) {
      if (entry.isFile() && IMAGE_EXTENSIONS.includes(path.extname(entry.name).toLowerCase())) {
        return true;
      }
      if (entry.isDirectory()) {
        if (await hasImageRecursivelyAsync(path.join(dirPath, entry.name), memo)) return true;
      }
    }
    return false;
  })();
  if (memo) memo.set(dirPath, result);
  return result;
}

async function findFirstImageRecursivelyAsync(rootFolder, rootPath, dirPath) {
  const baseUrl = `/manga/${rootFolder}`;
  const naturalCompare = require("string-natural-compare");

  const entries = await readDirEntries(dirPath);
  if (!entries) return null;
  entries.sort((a, b) => naturalCompare(a.name, b.name));

  for (const file of entries.filter((e) => e.isFile())) {
    const ext = path.extname(file.name).toLowerCase();
    if (IMAGE_EXTENSIONS.includes(ext)) {
      const relativePath = path
        .relative(rootPath, path.join(dirPath, file.name))
        .replace(/\\/g, "/");
      const safe = relativePath.split("/").map(encodeURIComponent).join("/");
      return `${baseUrl}/${safe}`;
    }
  }
  for (const folder of entries.filter((e) => e.isDirectory())) {
    const found = await findFirstImageRecursivelyAsync(
      rootFolder,
      rootPath,
      path.join(dirPath, folder.name)
    );
    if (found) return found;
  }
  return null;
}

module.exports = {
  findFirstImageRecursively,
  hasImageRecursively,
  hasImageRecursivelyAsync,
  findFirstImageRecursivelyAsync,
};
