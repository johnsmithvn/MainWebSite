// 📁 frontend/src/utils/recentManager.js
import { CACHE, LIMITS } from "/frontend/constants/index.js";

/**
 * 📚 Recent Viewed Manager - Quản lý lịch sử xem chung
 */
class RecentManager {
  constructor(storageKey, maxItems = LIMITS.MAX_RECENT_ITEMS) {
    this.storageKey = storageKey;
    this.maxItems = maxItems;
  }

  /**
   * 📖 Lấy danh sách recent
   */
  getRecent() {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      
      // Filter out expired items
      const now = Date.now();
      const filtered = parsed.filter(item => {
        return !item.timestamp || (now - item.timestamp < CACHE.TIME.WEEK * 4); // 4 tuần
      });
      
      if (filtered.length !== parsed.length) {
        this.saveRecentList(filtered);
      }
      
      return filtered;
    } catch {
      localStorage.removeItem(this.storageKey);
      return [];
    }
  }

  /**
   * 💾 Lưu item vào recent
   */
  saveRecent(item) {
    if (!item || !item.path) return;
    
    let recent = this.getRecent();
    
    // Loại bỏ duplicate (nếu có)
    recent = recent.filter(r => r.path !== item.path);
    
    // Thêm vào đầu danh sách
    recent.unshift({
      ...item,
      timestamp: Date.now(),
    });
    
    // Giới hạn số lượng
    if (recent.length > this.maxItems) {
      recent = recent.slice(0, this.maxItems);
    }
    
    this.saveRecentList(recent);
  }

  /**
   * 💾 Lưu danh sách recent
   */
  saveRecentList(list) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(list));
    } catch (error) {
      console.warn("❌ Could not save recent list:", error);
      // Try to save a smaller list
      const smallerList = list.slice(0, Math.floor(this.maxItems / 2));
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(smallerList));
      } catch (retryError) {
        console.error("❌ Failed to save recent list after retry:", retryError);
      }
    }
  }

  /**
   * 🧹 Xóa một item khỏi recent
   */
  removeRecent(path) {
    const recent = this.getRecent().filter(r => r.path !== path);
    this.saveRecentList(recent);
  }

  /**
   * 🧹 Xóa toàn bộ recent
   */
  clearRecent() {
    localStorage.removeItem(this.storageKey);
  }

  /**
   * 📊 Lấy thống kê recent
   */
  getRecentStats() {
    const recent = this.getRecent();
    const now = Date.now();
    
    return {
      count: recent.length,
      maxItems: this.maxItems,
      oldestTimestamp: recent.length > 0 ? recent[recent.length - 1].timestamp : null,
      newestTimestamp: recent.length > 0 ? recent[0].timestamp : null,
      usage: ((recent.length / this.maxItems) * 100).toFixed(1) + '%',
      recentCount: recent.filter(r => r.timestamp && (now - r.timestamp < CACHE.TIME.DAY)).length // Last 24h
    };
  }

  /**
   * 🔍 Tìm kiếm trong recent
   */
  searchRecent(query) {
    if (!query) return this.getRecent();
    
    const recent = this.getRecent();
    const searchTerm = query.toLowerCase();
    
    return recent.filter(item => {
      return item.name?.toLowerCase().includes(searchTerm) ||
             item.path?.toLowerCase().includes(searchTerm);
    });
  }

  /**
   * 📈 Lấy thống kê sử dụng
   */
  getUsageStats() {
    const recent = this.getRecent();
    const now = Date.now();
    
    const stats = {
      today: 0,
      yesterday: 0,
      thisWeek: 0,
      thisMonth: 0,
      older: 0
    };
    
    recent.forEach(item => {
      if (!item.timestamp) {
        stats.older++;
        return;
      }
      
      const diff = now - item.timestamp;
      const days = diff / CACHE.TIME.DAY;
      
      if (days < 1) {
        stats.today++;
      } else if (days < 2) {
        stats.yesterday++;
      } else if (days < 7) {
        stats.thisWeek++;
      } else if (days < 30) {
        stats.thisMonth++;
      } else {
        stats.older++;
      }
    });
    
    return stats;
  }
}

/**
 * 🔑 Tạo storage key cho recent
 */
function createRecentKey(type, sourceKey, rootFolder) {
  return `recentViewed${type}::${sourceKey}::${rootFolder}`;
}

// Export instances cho từng loại
export const mangaRecentManager = new RecentManager('recentViewed::', 30);
export const movieRecentManager = new RecentManager('recentViewedVideo::', 30);
export const musicRecentManager = new RecentManager('recentViewedMusic::', 30);

/**
 * 📖 Helper functions cho manga
 */
export function saveRecentViewed(folder, sourceKey, rootFolder) {
  const key = createRecentKey("", sourceKey, rootFolder);
  const manager = new RecentManager(key);
  manager.saveRecent(folder);
}

export function getRecentViewed(sourceKey, rootFolder) {
  const key = createRecentKey("", sourceKey, rootFolder);
  const manager = new RecentManager(key);
  return manager.getRecent();
}

/**
 * 🎬 Helper functions cho movie
 */
export function saveRecentViewedVideo(video, sourceKey, rootFolder) {
  const key = createRecentKey("Video", sourceKey, rootFolder);
  const manager = new RecentManager(key);
  manager.saveRecent(video);
}

export function getRecentViewedVideo(sourceKey, rootFolder) {
  const key = createRecentKey("Video", sourceKey, rootFolder);
  const manager = new RecentManager(key);
  return manager.getRecent();
}

/**
 * 🎵 Helper functions cho music
 */
export function saveRecentViewedMusic(song, sourceKey, rootFolder) {
  const key = createRecentKey("Music", sourceKey, rootFolder);
  const manager = new RecentManager(key);
  manager.saveRecent(song);
}

export function getRecentViewedMusic(sourceKey, rootFolder) {
  const key = createRecentKey("Music", sourceKey, rootFolder);
  const manager = new RecentManager(key);
  return manager.getRecent();
}

export default RecentManager;
