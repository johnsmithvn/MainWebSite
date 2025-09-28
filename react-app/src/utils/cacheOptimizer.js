// 📁 src/utils/cacheOptimizer.js
// 🚀 Cache optimization utilities - Reduce unnecessary caching

import { 
  clearCacheByPattern, 
  clearTypeCache,
  CACHE_PREFIXES 
} from '@/constants/cacheKeys';

/**
 * 🚫 Skip caching for unnecessary pages and endpoints
 */
export const shouldSkipCache = (pathname, endpoint) => {
  // Skip cache for favorite pages
  const skipFavoritePages = [
    '/manga/favorites',
    '/movie/favorites', 
    '/music/favorites'
  ];
  
  // Skip cache for offline library pages (they have their own offline data)
  const skipOfflinePages = [
    '/offline/manga-library',
    '/offline/movie-library',
    '/offline/music-library'
  ];
  
  // Skip cache for random/top-view/recent endpoints
  const skipEndpoints = [
    '/api/manga/random',
    '/api/movie/random',
    '/api/music/random',
    '/api/manga/top-view',
    '/api/movie/top-view', 
    '/api/music/top-view',
    '/api/manga/recent',
    '/api/movie/recent',
    '/api/music/recent',
    '/api/manga/favorites',
    '/api/movie/favorites',
    '/api/music/favorites'
  ];
  
  // Check page paths
  if (skipFavoritePages.some(path => pathname.includes(path))) {
    return { skip: true, reason: 'favorite-page' };
  }
  
  if (skipOfflinePages.some(path => pathname.includes(path))) {
    return { skip: true, reason: 'offline-library-page' };
  }
  
  // Check API endpoints
  if (endpoint && skipEndpoints.some(ep => endpoint.includes(ep))) {
    return { skip: true, reason: 'unnecessary-endpoint' };
  }
  
  return { skip: false };
};

/**
 * 🧹 Clean up unnecessary cache entries
 */
export const cleanupUnnecessaryCache = () => {
  console.log('🧹 Starting cache cleanup...');
  
  let totalCleared = 0;
  
  // Clear random cache for favorite pages
  const randomPatterns = [
    `${CACHE_PREFIXES.RANDOM_VIEW}::`,
    'randomItems-',
    'randomFolders-',
    'randomVideos-',
    'randomMusic-'
  ];
  
  randomPatterns.forEach(pattern => {
    totalCleared += clearCacheByPattern(pattern);
  });
  
  // Clear top-view cache (not needed offline)
  const topViewPatterns = [
    `${CACHE_PREFIXES.TOP_VIEW_CACHE}::`,
    'topViews-'
  ];
  
  topViewPatterns.forEach(pattern => {
    totalCleared += clearCacheByPattern(pattern);
  });
  
  // Clear recent viewed cache (not needed offline)
  const recentPatterns = [
    `${CACHE_PREFIXES.RECENT_VIEWED_MANGA}::`,
    `${CACHE_PREFIXES.RECENT_VIEWED_VIDEO}::`,
    `${CACHE_PREFIXES.RECENT_VIEWED_MUSIC}::`
  ];
  
  recentPatterns.forEach(pattern => {
    totalCleared += clearCacheByPattern(pattern);
  });
  
  console.log(`✅ Cache cleanup completed: ${totalCleared} entries removed`);
  return totalCleared;
};

/**
 * 🎯 Smart cache management based on current page
 */
export const smartCacheManagement = () => {
  const currentPath = window.location.pathname;
  
  // If on favorite pages, clear random cache
  if (currentPath.includes('/favorites')) {
    console.log('🎯 On favorites page - clearing random cache');
    clearCacheByPattern(`${CACHE_PREFIXES.RANDOM_VIEW}::`);
    clearCacheByPattern('randomItems-');
  }
  
  // If on offline library, clear unnecessary cache
  if (currentPath.includes('/offline/')) {
    console.log('🎯 On offline library - clearing unnecessary cache');
    clearCacheByPattern(`${CACHE_PREFIXES.TOP_VIEW_CACHE}::`);
    clearCacheByPattern(`${CACHE_PREFIXES.RANDOM_VIEW}::`);
  }
};

/**
 * 📊 Get cache usage statistics
 */
export const getCacheStats = () => {
  const stats = {
    total: 0,
    byType: {},
    unnecessary: 0
  };
  
  // Count all localStorage entries
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    
    stats.total++;
    
    // Categorize by type
    if (key.includes(CACHE_PREFIXES.RANDOM_VIEW)) {
      stats.byType.random = (stats.byType.random || 0) + 1;
      stats.unnecessary++;
    } else if (key.includes(CACHE_PREFIXES.TOP_VIEW_CACHE)) {
      stats.byType.topView = (stats.byType.topView || 0) + 1;
      stats.unnecessary++;
    } else if (key.includes(CACHE_PREFIXES.RECENT_VIEWED_MANGA) || 
               key.includes(CACHE_PREFIXES.RECENT_VIEWED_VIDEO) || 
               key.includes(CACHE_PREFIXES.RECENT_VIEWED_MUSIC)) {
      stats.byType.recent = (stats.byType.recent || 0) + 1;
      stats.unnecessary++;
    } else if (key.includes(CACHE_PREFIXES.REACT_FOLDER_CACHE)) {
      stats.byType.folder = (stats.byType.folder || 0) + 1;
    } else if (key.includes('chapter-images')) {
      stats.byType.images = (stats.byType.images || 0) + 1;
    } else {
      stats.byType.other = (stats.byType.other || 0) + 1;
    }
  }
  
  return stats;
};

/**
 * 🚀 Initialize cache optimization
 */
export const initCacheOptimization = () => {
  // Run cleanup on app start
  cleanupUnnecessaryCache();
  
  // Set up smart cache management
  smartCacheManagement();
  
  // Log cache stats
  const stats = getCacheStats();
  console.log('📊 Cache Stats:', stats);
  console.log(`🚫 Unnecessary cache entries: ${stats.unnecessary}/${stats.total} (${Math.round(stats.unnecessary/stats.total*100)}%)`);
  
  return stats;
};

export default {
  shouldSkipCache,
  cleanupUnnecessaryCache,
  smartCacheManagement,
  getCacheStats,
  initCacheOptimization
};