// 📁 src/utils/cacheOptimizer.js
// 🎯 Cache optimization utilities for reducing unnecessary offline cache

import { CACHE_CONFIG, CACHE_PREFIXES, clearCacheByPattern } from '@/constants/cacheKeys';

/**
 * Check if we're in offline mode or need offline functionality
 */
export const isOfflineModeNeeded = async () => {
  // Check if user is offline
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  
  // Check if user is on offline pages
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    if (currentPath.startsWith('/offline')) return true;
  }
  
  // Check if user has offline content downloaded
  const hasOfflineChapters = await checkOfflineChaptersExist();
  if (hasOfflineChapters) return true;
  
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
 * Optimize cache based on current context
 */
export const optimizeCache = async () => {
  const offlineNeeded = await isOfflineModeNeeded();
  const config = CACHE_CONFIG.OFFLINE_OPTIMIZATION;
  
  console.log('🎯 Cache optimization started:', { offlineNeeded, config });
  
  let totalCleared = 0;
  
  // 1. Clear random cache if not needed for offline
  if (!offlineNeeded && config.DISABLE_RANDOM_CACHE) {
    console.log('🗑️ Clearing random cache (not needed for online mode)');
    totalCleared += clearCacheByPattern(CACHE_PREFIXES.RANDOM_VIEW);
  }
  
  // 2. Clear excessive recent cache items
  if (config.DISABLE_RECENT_CACHE === false) {
    totalCleared += await optimizeRecentCache();
  }
  
  // 3. Optimize folder cache (keep only essential for offline)
  if (!offlineNeeded && config.DISABLE_INDEX_CACHE) {
    totalCleared += await optimizeFolderCache();
  }
  
  // 4. Clean up expired cache
  totalCleared += await cleanupExpiredCache();
  
  console.log(`✅ Cache optimization completed: ${totalCleared} items cleared`);
  return totalCleared;
};

/**
 * Optimize recent cache by limiting items
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
  
  // Optimize each recent cache
  recentKeys.forEach(key => {
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const data = JSON.parse(cached);
        if (Array.isArray(data) && data.length > maxItems) {
          // Keep only the most recent items
          const optimized = data
            .sort((a, b) => (b.lastViewed || 0) - (a.lastViewed || 0))
            .slice(0, maxItems);
          
          localStorage.setItem(key, JSON.stringify(optimized));
          totalCleared += (data.length - optimized.length);
          console.log(`📦 Optimized recent cache ${key}: ${data.length} → ${optimized.length}`);
        }
      }
    } catch (error) {
      console.warn(`Error optimizing recent cache ${key}:`, error);
    }
  });
  
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