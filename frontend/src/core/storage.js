// 📁 frontend/src/storage.js
import { showToast } from "./ui.js";
const MOVIE_CACHE_PREFIX = "movieCache::";
const FOLDER_CACHE_PREFIX = "folderCache::";

/**
 * 📂 Lấy rootFolder hiện tại từ localStorage
 * @returns {string|null}
 */
export function getRootFolder() {
  return localStorage.getItem("rootFolder");
}

export function getSourceKey() {
  return localStorage.getItem("sourceKey");
}
export function getMovieCacheKey(sourceKey, path) {
  if (!sourceKey) return null;
  return `${MOVIE_CACHE_PREFIX}${sourceKey}::${path || ""}`;
}

/**
 * 🔄 Đổi rootFolder (xoá folder đã chọn và chuyển về select.html)
 */
export function changeRootFolder() {
  localStorage.removeItem("rootFolder");
  window.location.href = "/select.html";
}

/**
 * 📂 Bắt buộc kiểm tra rootFolder, nếu chưa chọn thì redirect
 */
export function requireRootFolder() {
  const root = getRootFolder();

  if (!root) {
    showToast("⚠️ Chưa chọn thư mục gốc, vui lòng chọn lại!");
    window.location.href = "/select.html";
  }
}
export function requireSourceKey() {
  const source = getSourceKey();
  if (!source) {
    showToast("⚠️ Chưa chọn nguồn dữ liệu, vui lòng chọn lại!");
    window.location.href = "/home.html";
  }
}

/**
 * 📦 Lấy cache folder theo path
 */

export function getFolderCacheKey(sourceKey, rootFolder, path) {
  if (!sourceKey) return null;

  let key = `${FOLDER_CACHE_PREFIX}${sourceKey}`;

  if (rootFolder) key += `::${rootFolder}`;
  if (path) key += `:${path}`;

  return key;
}

export function getFolderCache(sourceKey, rootFolder, path) {
  const key = getFolderCacheKey(sourceKey, rootFolder, path);
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return {
      data: parsed.data,
      timestamp: parsed.timestamp,
    };
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

/**
 * 📦 Lưu cache folder
 */
export function setFolderCache(sourceKey, rootFolder, path, data) {
  if (!sourceKey || rootFolder === null || rootFolder === undefined) {
    const msg = `⚠️ Không cache được do thiếu thông tin: sourceKey = ${sourceKey}, rootFolder = ${rootFolder}`;
    console.warn(msg);
    showToast(msg);
    return;
  }

  // ✅ Nếu data không có folder hoặc ảnh thì bỏ qua
  if (
    !data ||
    (Array.isArray(data.folders) &&
      data.folders.length === 0 &&
      Array.isArray(data.images) &&
      data.images.length === 0)
  ) {
    console.warn("⚠️ Dữ liệu rỗng, không lưu cache:", path);
    return;
  }
  const key = getFolderCacheKey(sourceKey, rootFolder, path);

  const jsonData = JSON.stringify({
    timestamp: Date.now(),
    data: data,
  });

  const maxTotalSize = 4 * 1024 * 1024 + 300; // ✅ Giới hạn tổng 8MB
  const currentTotalSize = getCurrentCacheSize();
  // 🆕 Nếu dữ liệu quá lớn (trên 4MB) thì không lưu cache
  if (jsonData.length > maxTotalSize) {
    console.warn(`⚠️ Folder quá lớn, không cache localStorage: ${path}`);
    return;
  }

  // Nếu vượt quá tổng → xoá cache cũ cho đến khi đủ chỗ
  if (currentTotalSize + jsonData.length > maxTotalSize) {
    size = maxTotalSize - jsonData.length;
    if (size > maxTotalSize / 2) {
      size = maxTotalSize / 2; // Giới hạn tối đa 50% dung lượng
    }
    cleanUpOldCache(size); // giữ lại đủ chỗ
  }

  localStorage.setItem(key, jsonData);
}
function getCurrentCacheSize() {
  let total = 0;
  for (const key in localStorage) {
    if (key.startsWith(FOLDER_CACHE_PREFIX)) {
      const item = localStorage.getItem(key);
      total += item?.length || 0;
    }
  }
  return total;
}

/**
 * 🧹 Xoá cache cũ theo timestamp cho đến khi trống >= minFreeBytes
 */
function cleanUpOldCache(minFreeBytes) {
  const entries = [];

  for (const key in localStorage) {
    if (key.startsWith(FOLDER_CACHE_PREFIX)) {
      try {
        const raw = localStorage.getItem(key);
        const parsed = JSON.parse(raw);
        entries.push({
          key,
          size: raw.length,
          timestamp: parsed.timestamp || 0,
        });
      } catch {
        localStorage.removeItem(key); // corrupted
      }
    }
  }

  // Sắp xếp theo timestamp tăng dần (cũ nhất trước)
  entries.sort((a, b) => a.timestamp - b.timestamp);

  let freed = 0;
  for (const entry of entries) {
    localStorage.removeItem(entry.key);
    freed += entry.size;
    if (freed >= minFreeBytes) break;
  }

  console.log(`🧹 Dọn cache: đã xoá ${freed} byte`);
}
/**
 * 🧹 Xoá toàn bộ folder cache (theo dạng folderCache::)
 */
export function clearAllFolderCache() {
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith(getFolderCacheKey(getSourceKey()))) {
      localStorage.removeItem(key);
    }
  });
}

export function recentViewedKey() {
  return `recentViewed::${getRootFolder()}::${getRootFolder()}`;
}
/** ✅ Ghi lại folder vừa đọc vào localStorage */
export function saveRecentViewed(folder) {
  const key = recentViewedKey();
  try {
    const raw = localStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];

    // Bỏ item cũ nếu trùng path
    const filtered = list.filter((item) => item.path !== folder.path);

    // Thêm lên đầu
    filtered.unshift({
      name: folder.name,
      path: folder.path,
      thumbnail: folder.thumbnail,
    });

    // Giới hạn 30 item
    const limited = filtered.slice(0, 30);
    localStorage.setItem(key, JSON.stringify(limited));
  } catch (err) {
    console.warn("❌ Không thể lưu recentViewed:", err);
  }
}

//  Movie
export function getMovieCache(sourceKey, path) {
  const key = getMovieCacheKey(sourceKey, path);
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return {
      data: parsed.data,
      timestamp: parsed.timestamp,
    };
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

export function setMovieCache(sourceKey, path, data) {
  if (!sourceKey) {
    const msg = `⚠️ Không cache được do thiếu thông tin: sourceKey = ${sourceKey}`;
    console.warn(msg);
    showToast(msg);
    return;
  }
  // ✅ Kiểm tra data không hợp lệ
  if (!data || (Array.isArray(data) && data.length === 0)) {
    console.warn("⚠️ Movie data rỗng, không lưu cache:", path);
    return;
  }
  const key = getMovieCacheKey(sourceKey, path);
  const jsonData = JSON.stringify({
    timestamp: Date.now(),
    data: data,
  });

  const maxTotalSize = 4 * 1024 * 1024 + 300;
  const currentTotalSize = getCurrentMovieCacheSize();

  if (jsonData.length > maxTotalSize) {
    const msg = `⚠️ Movie folder quá lớn, không cache localStorage: ${path}`;
    console.warn(msg);
    showToast(msg);
    return;
  }

  if (currentTotalSize + jsonData.length > maxTotalSize) {
    let size = maxTotalSize - jsonData.length;
    if (size > maxTotalSize / 2) size = maxTotalSize / 2;
    cleanUpOldMovieCache(size);
  }

  localStorage.setItem(key, jsonData);
}
function getCurrentMovieCacheSize() {
  let total = 0;
  for (const key in localStorage) {
    if (key.startsWith(MOVIE_CACHE_PREFIX)) {
      const item = localStorage.getItem(key);
      total += item?.length || 0;
    }
  }
  return total;
}

function cleanUpOldMovieCache(minFreeBytes) {
  const entries = [];

  for (const key in localStorage) {
    if (key.startsWith(MOVIE_CACHE_PREFIX)) {
      try {
        const raw = localStorage.getItem(key);
        const parsed = JSON.parse(raw);
        entries.push({
          key,
          size: raw.length,
          timestamp: parsed.timestamp || 0,
        });
      } catch {
        localStorage.removeItem(key);
      }
    }
  }

  entries.sort((a, b) => a.timestamp - b.timestamp);
  let freed = 0;
  for (const entry of entries) {
    localStorage.removeItem(entry.key);
    freed += entry.size;
    if (freed >= minFreeBytes) break;
  }

  console.log(`🧹 Dọn movie cache: đã xoá ${freed} byte`);
}


export function recentViewedVideoKey() {
  const key = getSourceKey(); // dùng key làm định danh
  return `recentViewedVideo::${key}`;
}


export function saveRecentViewedVideo(video) {
  const key = recentViewedVideoKey();
  try {
    const raw = localStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];

    const filtered = list.filter((item) => item.path !== video.path);
    filtered.unshift({
      name: video.name,
      path: video.path,
      thumbnail: video.thumbnail,
      type: "video", // quan trọng để phân biệt
    });

    const limited = filtered.slice(0, 30);
    localStorage.setItem(key, JSON.stringify(limited));
  } catch (err) {
    console.warn("❌ Không thể lưu recentViewedVideo:", err);
  }
}
