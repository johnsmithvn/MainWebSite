// 📁 frontend/src/utils/cacheManager.js
import { CACHE_SETTINGS } from "/shared/constants.js";

/**
 * 🗂️ Cache Manager - Quản lý cache chung cho manga/movie/music
 */
class CacheManager {
  constructor(prefix, maxSize = CACHE_SETTINGS.MAX_FOLDER_CACHE_SIZE) {
    this.prefix = prefix;
    this.maxSize = maxSize;
  }

  /**
   * 🔑 Tạo cache key
   */
  getCacheKey(sourceKey, path) {
    return `${this.prefix}${sourceKey}:${path || ""}`;
  }

  /**
   * 📦 Lấy cache
   */
  getCache(sourceKey, path) {
    const key = this.getCacheKey(sourceKey, path);
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      // Check expiry
      const now = Date.now();
      if (now - parsed.timestamp > CACHE_SETTINGS.CACHE_EXPIRY) {
        localStorage.removeItem(key);
        return null;
      }
      
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
   * 💾 Lưu cache
   */
  setCache(sourceKey, path, data) {
    const key = this.getCacheKey(sourceKey, path);
    const cacheData = {
      data,
      timestamp: Date.now(),
    };

    try {
      const serialized = JSON.stringify(cacheData);
      
      // Kiểm tra kích thước trước khi lưu
      if (this.getCurrentCacheSize() + serialized.length > this.maxSize) {
        this.cleanUpOldCache(serialized.length + 1024 * 1024); // +1MB buffer
      }
      
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.warn("❌ Cache storage error:", error);
      this.cleanUpOldCache(50 * 1024 * 1024); // Dọn 50MB
      
      // Retry once
      try {
        localStorage.setItem(key, JSON.stringify(cacheData));
      } catch (retryError) {
        console.error("❌ Failed to save cache after cleanup:", retryError);
      }
    }
  }

  /**
   * 📊 Tính kích thước cache hiện tại
   */
  getCurrentCacheSize() {
    let total = 0;
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(this.prefix)) {
        total += localStorage.getItem(key).length;
      }
    });
    return total;
  }

  /**
   * 🧹 Dọn dẹp cache cũ
   */
  cleanUpOldCache(minFreeBytes) {
    const cacheEntries = [];
    
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(this.prefix)) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          cacheEntries.push({
            key,
            timestamp: data.timestamp || 0,
            size: localStorage.getItem(key).length,
          });
        } catch (error) {
          localStorage.removeItem(key);
        }
      }
    });

    // Sắp xếp theo thời gian, xóa cũ nhất trước
    cacheEntries.sort((a, b) => a.timestamp - b.timestamp);
    
    let freedBytes = 0;
    for (const entry of cacheEntries) {
      if (freedBytes >= minFreeBytes) break;
      localStorage.removeItem(entry.key);
      freedBytes += entry.size;
    }
    
    console.log(`🧹 Cleaned up ${freedBytes} bytes of cache`);
  }

  /**
   * 🧹 Xóa toàn bộ cache
   */
  clearAllCache() {
    let count = 0;
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
        count++;
      }
    });
    console.log(`🧹 Cleared ${count} cache entries`);
  }

  /**
   * 📈 Lấy thống kê cache
   */
  getCacheStats() {
    const entries = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
    const totalSize = this.getCurrentCacheSize();
    
    return {
      count: entries.length,
      totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      maxSize: this.maxSize,
      maxSizeMB: (this.maxSize / 1024 / 1024).toFixed(2),
      usage: (totalSize / this.maxSize * 100).toFixed(1) + '%'
    };
  }

  /**
   * 🔍 Tìm cache theo pattern
   */
  findCacheByPattern(pattern) {
    const results = [];
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(this.prefix) && key.includes(pattern)) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          results.push({
            key: key.replace(this.prefix, ''),
            timestamp: data.timestamp,
            size: localStorage.getItem(key).length
          });
        } catch (error) {
          localStorage.removeItem(key);
        }
      }
    });
    return results;
  }
}

// Export instances cho từng loại
export const folderCacheManager = new CacheManager("folderCache::", CACHE_SETTINGS.MAX_FOLDER_CACHE_SIZE);
export const movieCacheManager = new CacheManager("movieCache::", CACHE_SETTINGS.MAX_MOVIE_CACHE_SIZE);
export const musicCacheManager = new CacheManager("musicCache::", CACHE_SETTINGS.MAX_MUSIC_CACHE_SIZE);

export default CacheManager;
