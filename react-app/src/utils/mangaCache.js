// 📁 src/utils/mangaCache.js
// 📦 Manga cache utilities

import { CACHE_CONFIG } from '@/constants/cacheKeys';
import { getFolderCacheKey } from '@/constants/cacheKeys';

/**
 * Tạo cache key cho manga folder
 * @param {string} sourceKey 
 * @param {string} rootFolder 
 * @param {string} path 
 * @returns {string|null}
 */
const getCacheKey = (sourceKey, rootFolder, path) => {
  if (!sourceKey || !rootFolder) return null;
  try {
    return getFolderCacheKey('manga', sourceKey, rootFolder, path);
  } catch (error) {
    console.warn('Error generating manga cache key:', error);
    // Fallback to old pattern for compatibility
    return `react-${CACHE_CONFIG.MANGA.FOLDER_CACHE_PREFIX}${sourceKey}::${rootFolder}::${path || ''}`;
  }
};

/**
 * Lấy manga folder data từ cache (localStorage)
 * @param {string} sourceKey 
 * @param {string} rootFolder 
 * @param {string} path 
 * @returns {any|null}
 */
export const getMangaCache = (sourceKey, rootFolder, path) => {
  const key = getCacheKey(sourceKey, rootFolder, path);
  if (!key) return null;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const { timestamp, data } = JSON.parse(raw);

    // Cache hết hạn sau một khoảng thời gian
    const isExpired = (Date.now() - timestamp) > CACHE_CONFIG.MANGA.CACHE_EXPIRATION;
    if (isExpired) {
      localStorage.removeItem(key);
      console.log(`📦 Cache expired and removed for key: ${key}`);
      return null;
    }

    console.log(`📦 Cache hit for key: ${key}`);
    return data;
  } catch (error) {
    console.error("Error getting manga cache:", error);
    return null;
  }
};

/**
 * Lưu manga folder data vào cache (localStorage)
 * @param {string} sourceKey 
 * @param {string} rootFolder 
 * @param {string} path 
 * @param {any} data 
 */
export const setMangaCache = (sourceKey, rootFolder, path, data) => {
  const key = getCacheKey(sourceKey, rootFolder, path);
  if (!key) return;

  try {
    const item = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(item));
    console.log(`📦 Cache set for key: ${key}`);
  } catch (error) {
    console.error("Error setting manga cache:", error);
    // Có thể thêm logic dọn dẹp cache cũ nếu đầy bộ nhớ
  }
};

/**
 * Xóa toàn bộ manga cache
 */
export const clearAllMangaCache = () => {
    try {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(`react-${CACHE_CONFIG.MANGA.FOLDER_CACHE_PREFIX}`)) {
                localStorage.removeItem(key);
            }
        });
        console.log("🧹 All React manga cache cleared.");
    } catch (error) {
        console.error("Error clearing all manga cache:", error);
    }
}
