// 📁 src/utils/cacheOptimizer.js
// 🎯 Cache optimization utilities for reducing unnecessary offline cache

import { CACHE_CONFIG, CACHE_PREFIXES, clearCacheByPattern } from '@/constants/cacheKeys';

/**
 * 🚨 LUÔN GIỮ CACHE CHO OFFLINE - Chỉ optimize khi thật sự cần
 * App cần hoạt động offline nên PHẢI có library cache
 */
export const shouldKeepLibraryCache = () => {
  // 🚨 LUÔN trả về true - cần library cache để vào offline
  return true;
};

/**
 * Check if we need to be more aggressive with cache cleanup
 */
export const isAggressiveCleanupNeeded = () => {
  // Chỉ cleanup aggressive khi storage gần đầy
  try {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      return navigator.storage.estimate().then(estimate => {
        const usagePercent = (estimate.usage || 0) / (estimate.quota || 1);
        return usagePercent > 0.8; // Chỉ cleanup khi dùng > 80% storage
      });
    }
  } catch (error) {
    console.warn('Cannot check storage usage:', error);
  }
  return false;
};

/**
 * Check if offline chapters exist in cache
 */
const checkOfflineChaptersExist = async () => {
  try {
    if (typeof caches === 'undefined') return false;
    
    const hasCache = await caches.has('chapter-images');
    if (!hasCache) return false;
    
    const cache = await caches.open('chapter-images');
    const keys = await cache.keys();
    return keys.length > 0;
  } catch (error) {
    console.warn('Error checking offline chapters:', error);
    return false;
  }
};

/**
 * 🚨 Optimize cache - CHỈ dọn cache thật sự không cần thiết
 * LUÔN GIỮ library cache để app hoạt động offline
 */
export const optimizeCache = async () => {
  const config = CACHE_CONFIG.OFFLINE_OPTIMIZATION;
  const aggressiveCleanup = await isAggressiveCleanupNeeded();
  
  console.log('🎯 Cache optimization started (SAFE MODE - giữ library cache):', { config, aggressiveCleanup });
  
  let totalCleared = 0;
  
  // 🚨 LUÔN GIỮ LIBRARY CACHE - chỉ dọn những thứ thật sự không cần
  
  // 1. Giảm số lượng random items (không xóa hoàn toàn)
  if (config.DISABLE_EXCESSIVE_RANDOM) {
    console.log('📦 Optimizing random cache (reducing quantity, keeping cache)');
    totalCleared += await optimizeRandomCache();
  }
  
  // 2. Giảm số lượng recent items (không xóa hoàn toàn)
  if (config.KEEP_RECENT_CACHE) {
    console.log('📦 Optimizing recent cache (reducing quantity, keeping cache)');
    totalCleared += await optimizeRecentCache();
  }
  
  // 3. Dọn cache hết hạn (an toàn)
  if (config.CLEANUP_EXPIRED_CACHE) {
    console.log('🧹 Cleaning expired cache (safe cleanup)');
    totalCleared += await cleanupExpiredCache();
  }
  
  // 4. Dọn cache trùng lặp
  if (config.LIMIT_DUPLICATE_CACHE) {
    console.log('🔄 Removing duplicate cache entries');
    totalCleared += await cleanupDuplicateCache();
  }
  
  // 5. Chỉ cleanup aggressive khi storage thật sự đầy
  if (aggressiveCleanup) {
    console.log('⚠️ Storage critical - running aggressive cleanup');
    totalCleared += await aggressiveCleanupCache();
  }
  
  console.log(`✅ Safe cache optimization completed: ${totalCleared} items cleared (library cache preserved)`);
  return totalCleared;
};

/**
 * 📦 Optimize random cache - CHỈ giảm số lượng, GIỮ cache để offline
 */
const optimizeRandomCache = async () => {
  const maxItems = CACHE_CONFIG.OFFLINE_OPTIMIZATION.MAX_RANDOM_ITEMS;
  let totalCleared = 0;
  
  // Get all random cache keys
  const randomKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CACHE_PREFIXES.RANDOM_VIEW)) {
      randomKeys.push(key);
    }
  }
  
  // 📦 CHỈ giảm số lượng items, KHÔNG xóa cache hoàn toàn
  randomKeys.forEach(key => {
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const data = JSON.parse(cached);
        if (data.data && Array.isArray(data.data) && data.data.length > maxItems) {
          // Giữ lại maxItems đầu tiên (có thể là favorites)
          const optimized = data.data.slice(0, maxItems);
          const newData = { ...data, data: optimized };
          
          localStorage.setItem(key, JSON.stringify(newData));
          totalCleared += (data.data.length - optimized.length);
          console.log(`📦 Optimized random cache ${key}: ${data.data.length} → ${optimized.length} items`);
        }
      }
    } catch (error) {
      console.warn(`Error optimizing random cache ${key}:`, error);
    }
  });
  
  return totalCleared;
};

/**
 * 📦 Optimize recent cache - CHỈ giảm số lượng, GIỮ cache để offline
 */
const optimizeRecentCache = async () => {
  const maxItems = CACHE_CONFIG.OFFLINE_OPTIMIZATION.MAX_RECENT_ITEMS;
  let totalCleared = 0;
  
  // Get all recent cache keys
  const recentKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.startsWith(CACHE_PREFIXES.RECENT_VIEWED_MANGA) ||
      key.startsWith(CACHE_PREFIXES.RECENT_VIEWED_VIDEO) ||
      key.startsWith(CACHE_PREFIXES.RECENT_VIEWED_MUSIC)
    )) {
      recentKeys.push(key);
    }
  }
  
  // 📦 CHỈ giảm số lượng items, KHÔNG xóa cache hoàn toàn
  recentKeys.forEach(key => {
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const data = JSON.parse(cached);
        if (Array.isArray(data) && data.length > maxItems) {
          // Keep only the most recent items (giữ lại những cái mới nhất)
          const optimized = data
            .sort((a, b) => (b.lastViewed || 0) - (a.lastViewed || 0))
            .slice(0, maxItems);
          
          localStorage.setItem(key, JSON.stringify(optimized));
          totalCleared += (data.length - optimized.length);
          console.log(`📦 Optimized recent cache ${key}: ${data.length} → ${optimized.length} items`);
        }
      }
    } catch (error) {
      console.warn(`Error optimizing recent cache ${key}:`, error);
    }
  });
  
  return totalCleared;
};

/**
 * 🔄 Clean up duplicate cache entries
 */
const cleanupDuplicateCache = async () => {
  let totalCleared = 0;
  const seenPaths = new Map();
  const maxDuplicates = CACHE_CONFIG.OFFLINE_OPTIMIZATION.MAX_DUPLICATE_ENTRIES;
  
  // Check for duplicate entries across all cache
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.includes('Cache') || !key.includes('::')) continue;
    
    try {
      const cached = localStorage.getItem(key);
      const data = JSON.parse(cached);
      
      if (data.data && Array.isArray(data.data)) {
        data.data.forEach(item => {
          if (item.path) {
            if (!seenPaths.has(item.path)) {
              seenPaths.set(item.path, []);
            }
            seenPaths.get(item.path).push({ key, item });
          }
        });
      }
    } catch (error) {
      // Ignore corrupted cache
    }
  }
  
  // Remove excessive duplicates
  seenPaths.forEach((entries, path) => {
    if (entries.length > maxDuplicates) {
      // Keep most recent entries, remove others
      const toRemove = entries.slice(maxDuplicates);
      toRemove.forEach(({ key }) => {
        try {
          const cached = localStorage.getItem(key);
          const data = JSON.parse(cached);
          if (data.data && Array.isArray(data.data)) {
            const filtered = data.data.filter(item => item.path !== path);
            if (filtered.length !== data.data.length) {
              localStorage.setItem(key, JSON.stringify({ ...data, data: filtered }));
              totalCleared++;
            }
          }
        } catch (error) {
          console.warn(`Error removing duplicate from ${key}:`, error);
        }
      });
    }
  });
  
  return totalCleared;
};

/**
 * ⚠️ Aggressive cleanup - chỉ khi storage thật sự đầy
 */
const aggressiveCleanupCache = async () => {
  let totalCleared = 0;
  
  console.log('⚠️ Running aggressive cleanup due to storage constraints');
  
  // 1. Remove very old cache entries (older than 24 hours)
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    
    try {
      const cached = localStorage.getItem(key);
      const data = JSON.parse(cached);
      
      // 🚨 KHÔNG xóa những cache quan trọng
      if (key.includes('favorite') || 
          key.includes('offline') || 
          key.includes('chapter-images') ||
          key.startsWith(CACHE_PREFIXES.REACT_FOLDER_CACHE)) {
        continue; // Skip important cache
      }
      
      if (data.timestamp && data.timestamp < oneDayAgo) {
        localStorage.removeItem(key);
        totalCleared++;
        console.log(`🗑️ Removed old cache: ${key}`);
      }
    } catch (error) {
      // Remove corrupted cache
      localStorage.removeItem(key);
      totalCleared++;
    }
  }
  
  return totalCleared;
};

/**
 * Optimize folder cache - keep only favorites and currently viewed
 */
const optimizeFolderCache = async () => {
  let totalCleared = 0;
  
  // Get current path context
  const currentPath = window.location.pathname;
  const isOnMangaPages = currentPath.startsWith('/manga');
  
  if (!isOnMangaPages) {
    // If not on manga pages, clear non-essential folder cache
    const folderKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIXES.REACT_FOLDER_CACHE)) {
        folderKeys.push(key);
      }
    }
    
    folderKeys.forEach(key => {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const data = JSON.parse(cached);
          
          // Keep only if it contains favorites or is recently accessed
          const shouldKeep = checkIfCacheShouldKeep(data, key);
          
          if (!shouldKeep) {
            localStorage.removeItem(key);
            totalCleared++;
            console.log(`🗑️ Removed non-essential folder cache: ${key}`);
          }
        }
      } catch (error) {
        console.warn(`Error checking folder cache ${key}:`, error);
      }
    });
  }
  
  return totalCleared;
};

/**
 * Check if cache should be kept based on content
 */
const checkIfCacheShouldKeep = (data, key) => {
  try {
    // Keep if contains favorites
    if (data.data && Array.isArray(data.data.mangaList)) {
      const hasFavorites = data.data.mangaList.some(item => item.isFavorite);
      if (hasFavorites) return true;
    }
    
    // Keep if accessed recently (within 1 hour)
    if (data.timestamp) {
      const hourAgo = Date.now() - (60 * 60 * 1000);
      if (data.timestamp > hourAgo) return true;
    }
    
    // Keep if it's a root-level cache (important for navigation)
    if (key.endsWith('::')) return true;
    
    return false;
  } catch (error) {
    console.warn('Error checking cache content:', error);
    return true; // Keep if unsure
  }
};

/**
 * Clean up expired cache entries
 */
const cleanupExpiredCache = async () => {
  let totalCleared = 0;
  const now = Date.now();
  
  // Check all localStorage keys
  const keysToCheck = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.includes('Cache') || 
      key.includes('random') || 
      key.includes('recent')
    )) {
      keysToCheck.push(key);
    }
  }
  
  keysToCheck.forEach(key => {
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const data = JSON.parse(cached);
        
        // Check if expired based on cache type
        let expiration = CACHE_CONFIG.MANGA.CACHE_EXPIRATION; // default
        
        if (key.includes('movie')) expiration = CACHE_CONFIG.MOVIE.CACHE_EXPIRATION;
        if (key.includes('music')) expiration = CACHE_CONFIG.MUSIC.CACHE_EXPIRATION;
        
        if (data.timestamp && (now - data.timestamp) > expiration) {
          localStorage.removeItem(key);
          totalCleared++;
          console.log(`⏰ Removed expired cache: ${key}`);
        }
      }
    } catch (error) {
      // Remove corrupted cache
      localStorage.removeItem(key);
      totalCleared++;
      console.log(`🗑️ Removed corrupted cache: ${key}`);
    }
  });
  
  return totalCleared;
};

/**
 * Get cache usage statistics
 */
export const getCacheStats = () => {
  const stats = {
    total: 0,
    byType: {},
    size: 0
  };
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      const size = value ? value.length : 0;
      
      stats.total++;
      stats.size += size;
      
      // Categorize by prefix
      Object.entries(CACHE_PREFIXES).forEach(([type, prefix]) => {
        if (key.startsWith(prefix)) {
          if (!stats.byType[type]) stats.byType[type] = { count: 0, size: 0 };
          stats.byType[type].count++;
          stats.byType[type].size += size;
        }
      });
    }
  }
  
  return stats;
};

/**
 * Auto-optimize cache on interval
 */
export const startCacheOptimization = () => {
  const interval = CACHE_CONFIG.OFFLINE_OPTIMIZATION.CACHE_CLEANUP_INTERVAL;
  
  console.log('🎯 Starting auto cache optimization:', { interval });
  
  return setInterval(async () => {
    try {
      await optimizeCache();
    } catch (error) {
      console.error('Error in auto cache optimization:', error);
    }
  }, interval);
};

/**
 * Stop auto-optimization
 */
export const stopCacheOptimization = (intervalId) => {
  if (intervalId) {
    clearInterval(intervalId);
    console.log('🛑 Stopped cache optimization');
  }
};

export default {
  optimizeCache,
  getCacheStats,
  isOfflineModeNeeded,
  startCacheOptimization,
  stopCacheOptimization
};