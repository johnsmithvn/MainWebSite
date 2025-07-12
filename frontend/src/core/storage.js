// 📁 frontend/src/core/storage.js
import { showToast, goHome } from "./ui.js";
import { folderCacheManager, movieCacheManager, musicCacheManager } from "/src/utils/cacheManager.js";
import { CACHE } from "/constants/cache.js";
import { 
  saveRecentViewed as saveRecentViewedHelper,
  getRecentViewed as getRecentViewedHelper,
  saveRecentViewedVideo as saveRecentViewedVideoHelper,
  getRecentViewedVideo as getRecentViewedVideoHelper,
  saveRecentViewedMusic as saveRecentViewedMusicHelper,
  getRecentViewedMusic as getRecentViewedMusicHelper
} from "/src/utils/recentManager.js";
import { CACHE } from "/frontend/constants/index.js";

const ROOT_THUMB_CACHE_PREFIX = CACHE.PREFIXES.ROOT_THUMB;

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

/**
 * 🔄 Đổi rootFolder (xoá folder đã chọn và chuyển về select.html)
 */
export function changeRootFolder() {
  localStorage.removeItem("rootFolder");
  window.location.href = "/manga/select.html";
}

/**
 * 📂 Bắt buộc kiểm tra rootFolder, nếu chưa chọn thì redirect
 */
export function requireRootFolder() {
  const root = getRootFolder();
  if (!root) {
    showToast("⚠️ Chưa chọn thư mục gốc, vui lòng chọn lại!");
    window.location.href = "/manga/select.html";
  }
}

export function requireSourceKey() {
  const source = getSourceKey();
  if (!source) {
    showToast("⚠️ Chưa chọn nguồn dữ liệu, vui lòng chọn lại!");
    goHome();
  }
}

// ========== ROOT THUMBNAIL CACHE ==========
export function getRootThumbCache(sourceKey, rootFolder) {
  const key = `${ROOT_THUMB_CACHE_PREFIX}${sourceKey}::${rootFolder}`;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const { thumbnail, time } = JSON.parse(raw);
    if (Date.now() - time > CACHE.EXPIRY.LONG) {
      localStorage.removeItem(key);
      return null;
    }
    return thumbnail;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

export function setRootThumbCache(sourceKey, rootFolder, thumbnail) {
  const key = `${ROOT_THUMB_CACHE_PREFIX}${sourceKey}::${rootFolder}`;
  const value = { thumbnail, time: Date.now() };
  localStorage.setItem(key, JSON.stringify(value));
}

// ========== FOLDER CACHE (MANGA) ==========
export function getFolderCacheKey(sourceKey, rootFolder, path) {
  return folderCacheManager.getCacheKey(sourceKey, `${rootFolder}:${path || ""}`);
}

export function getFolderCache(sourceKey, rootFolder, path) {
  return folderCacheManager.getCache(sourceKey, `${rootFolder}:${path || ""}`);
}

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

  folderCacheManager.setCache(sourceKey, `${rootFolder}:${path || ""}`, data);
}

export function clearAllFolderCache() {
  const sourceKey = getSourceKey();
  if (sourceKey) {
    folderCacheManager.clearCache(sourceKey);
  }
}

// ========== MOVIE CACHE ==========
export function getMovieCacheKey(sourceKey, path) {
  return movieCacheManager.getCacheKey(sourceKey, path);
}

export function getMovieCache(sourceKey, path) {
  return movieCacheManager.getCache(sourceKey, path);
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
  
  movieCacheManager.setCache(sourceKey, path, data);
}

export function clearAllMovieCache() {
  const sourceKey = getSourceKey();
  if (sourceKey) {
    movieCacheManager.clearCache(sourceKey);
  }
}

// ========== MUSIC CACHE ==========
export function getMusicCacheKey(sourceKey, path) {
  return musicCacheManager.getCacheKey(sourceKey, path);
}

export function getMusicCache(sourceKey, path) {
  return musicCacheManager.getCache(sourceKey, path);
}

export function setMusicCache(sourceKey, path, data) {
  if (!sourceKey) {
    const msg = `⚠️ Không cache được do thiếu thông tin: sourceKey = ${sourceKey}`;
    console.warn(msg);
    showToast(msg);
    return;
  }
  
  if (!data || (Array.isArray(data) && data.length === 0)) {
    console.warn("⚠️ Music data rỗng, không lưu cache:", path);
    return;
  }
  
  musicCacheManager.setCache(sourceKey, path, data);
}

export function clearAllMusicCache() {
  const sourceKey = getSourceKey();
  if (sourceKey) {
    musicCacheManager.clearCache(sourceKey);
  }
}

// ========== RECENT VIEWED (MANGA) ==========
export function recentViewedKey() {
  const rootFolder = getRootFolder();
  return `${CACHE.PREFIXES.RECENT_MANGA}${rootFolder}::${rootFolder}`;
}

export function saveRecentViewed(folder) {
  const rootFolder = getRootFolder();
  const sourceKey = getSourceKey();
  if (!rootFolder || !sourceKey) return;
  
  saveRecentViewedHelper(folder, sourceKey, rootFolder);
}

export function getRecentViewed() {
  const rootFolder = getRootFolder();
  const sourceKey = getSourceKey();
  if (!rootFolder || !sourceKey) return [];
  
  return getRecentViewedHelper(sourceKey, rootFolder);
}

// ========== RECENT VIEWED VIDEO ==========
export function recentViewedVideoKey() {
  const key = getSourceKey();
  return `${CACHE.PREFIXES.RECENT_MOVIE}${key}`;
}

export function saveRecentViewedVideo(video) {
  const sourceKey = getSourceKey();
  if (!sourceKey) return;
  
  saveRecentViewedVideoHelper(video, sourceKey, null);
}

export function getRecentViewedVideo() {
  const sourceKey = getSourceKey();
  if (!sourceKey) return [];
  
  return getRecentViewedVideoHelper(sourceKey, null);
}

// ========== RECENT VIEWED MUSIC ==========
export function recentViewedMusicKey() {
  const key = getSourceKey();
  return `${CACHE.PREFIXES.RECENT_MUSIC}${key}`;
}

export function saveRecentViewedMusic(song) {
  const sourceKey = getSourceKey();
  if (!sourceKey) return;
  
  saveRecentViewedMusicHelper(song, sourceKey, null);
}

export function getRecentViewedMusic() {
  const sourceKey = getSourceKey();
  if (!sourceKey) return [];
  
  return getRecentViewedMusicHelper(sourceKey, null);
}
