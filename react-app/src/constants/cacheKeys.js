// 📁 src/constants/cacheKeys.js
// 🗂️ Cache key patterns and utilities - Centralized cache management

/**
 * Cache key prefixes for different types of content
 */
export const CACHE_PREFIXES = {
  // Random content cache
  RANDOM_VIEW: 'randomView',
  
  // Recent viewed cache
  RECENT_VIEWED_MANGA: 'recentViewed',
  RECENT_VIEWED_VIDEO: 'recentViewedVideo', 
  RECENT_VIEWED_MUSIC: 'recentViewedMusic',
  
  // Folder cache
  REACT_FOLDER_CACHE: 'react-folderCache',
  LEGACY_FOLDER_CACHE: 'folderCache',
  MANGA_CACHE: 'mangaCache',
  MOVIE_CACHE: 'movieCache',
  MUSIC_CACHE: 'musicCache',
  
  // Movie/Music folder cache
  MOVIE_FOLDER_CACHE: 'movie-folder-cache',
  MUSIC_FOLDER_CACHE: 'music-folder-cache',
  
  // Top view cache
  TOP_VIEW_CACHE: 'topViewCache',
  
  // Root thumbnail cache
  ROOT_THUMB_CACHE: 'rootThumb'
};

/**
 * Cache configuration constants
 */
export const CACHE_CONFIG = {
  MANGA: {
    FOLDER_CACHE_PREFIX: 'folderCache::',
    CACHE_EXPIRATION: 15 * 60 * 1000, // 15 minutes
  },
  MOVIE: {
    CACHE_EXPIRATION: 30 * 60 * 1000, // 30 minutes
  },
  MUSIC: {
    CACHE_EXPIRATION: 30 * 60 * 1000, // 30 minutes
  },
  // 🎯 Offline optimization settings - CHỈ giảm cache thực sự không cần thiết
  OFFLINE_OPTIMIZATION: {
    // ❌ Chỉ disable những cache này:
    DISABLE_EXCESSIVE_RANDOM: true,    // Giảm số lượng random items (20→10)
    DISABLE_API_RESPONSE_CACHE: true,  // Không cache API response (chỉ cache data)
    CLEANUP_EXPIRED_CACHE: true,       // Dọn cache hết hạn
    LIMIT_DUPLICATE_CACHE: true,       // Giới hạn cache trùng lặp
    
    // ✅ LUÔN GIỮ những cache này cho offline:
    KEEP_LIBRARY_CACHE: true,          // 🚨 QUAN TRỌNG: Giữ library để vào offline
    KEEP_NAVIGATION_CACHE: true,       // Giữ navigation cache
    KEEP_FAVORITE_CACHE: true,         // Giữ favorite cache
    KEEP_GRIDVIEW_CACHE: true,         // Giữ grid view cache
    KEEP_CHAPTER_IMAGES: true,         // Giữ chapter images
    KEEP_RECENT_CACHE: true,           // Giữ recent cache (giảm số lượng)
    
    // Cache size limits - CHỈ giảm số lượng, KHÔNG xóa hoàn toàn
    MAX_RANDOM_ITEMS: 10,              // Giảm từ 20 → 10 (vẫn đủ dùng)
    MAX_RECENT_ITEMS: 15,              // Giảm từ 20 → 15 (vẫn đủ dùng)
    MAX_DUPLICATE_ENTRIES: 3,          // Giới hạn cache trùng lặp
    CACHE_CLEANUP_INTERVAL: 10 * 60 * 1000, // 10 minutes cleanup interval
  }
};

/**
 * Cache key generators for different content types
 */
export const CACHE_KEYS = {
  /**
   * Random view cache keys
   */
  randomView: {
    manga: (sourceKey, rootFolder) => `${CACHE_PREFIXES.RANDOM_VIEW}::${sourceKey}::${rootFolder}::manga`,
    movie: (sourceKey) => `${CACHE_PREFIXES.RANDOM_VIEW}::${sourceKey}::undefined::movie`,
    music: (sourceKey) => `${CACHE_PREFIXES.RANDOM_VIEW}::${sourceKey}::undefined::music`
  },

  /**
   * Recent viewed cache keys
   */
  recentViewed: {
    manga: (sourceKey, rootFolder) => `${CACHE_PREFIXES.RECENT_VIEWED_MANGA}::${rootFolder}::${rootFolder}`,
    movie: (sourceKey) => `${CACHE_PREFIXES.RECENT_VIEWED_VIDEO}::${sourceKey}`,
    music: (sourceKey) => `${CACHE_PREFIXES.RECENT_VIEWED_MUSIC}::${sourceKey}`
  },

  /**
   * Folder cache keys
   */
  folderCache: {
    manga: (sourceKey, rootFolder, path = '') => `${CACHE_PREFIXES.REACT_FOLDER_CACHE}::${sourceKey}::${rootFolder}::${path}`,
    movie: (sourceKey) => `${CACHE_PREFIXES.MOVIE_FOLDER_CACHE}-${sourceKey}`,
    music: (sourceKey) => `${CACHE_PREFIXES.MUSIC_FOLDER_CACHE}-${sourceKey}`
  },

  /**
   * Legacy cache keys (for compatibility)
   */
  legacy: {
    mangaCache: (sourceKey, path = '') => `${CACHE_PREFIXES.MANGA_CACHE}::${sourceKey}::${path}`,
    movieCache: (sourceKey, path = '') => `${CACHE_PREFIXES.MOVIE_CACHE}::${sourceKey}::${path}`,
    musicCache: (sourceKey, path = '') => `${CACHE_PREFIXES.MUSIC_CACHE}::${sourceKey}::${path}`,
    folderCache: (sourceKey, path = '') => `${CACHE_PREFIXES.LEGACY_FOLDER_CACHE}::${sourceKey}::${path}`
  },

  /**
   * Top view cache keys
   */
  topView: {
    manga: (sourceKey, rootFolder) => `${CACHE_PREFIXES.TOP_VIEW_CACHE}::${sourceKey}::${rootFolder}::manga`,
    movie: (sourceKey) => `${CACHE_PREFIXES.TOP_VIEW_CACHE}::${sourceKey}::undefined::movie`,
    music: (sourceKey) => `${CACHE_PREFIXES.TOP_VIEW_CACHE}::${sourceKey}::undefined::music`
  },

  /**
   * Root thumbnail cache
   */
  rootThumbnail: (sourceKey, rootFolder) => `${CACHE_PREFIXES.ROOT_THUMB_CACHE}::${sourceKey}::${rootFolder}`
};

/**
 * Get cache key for random view based on content type
 * @param {string} type - Content type: 'manga', 'movie', 'music'
 * @param {string} sourceKey - Source key
 * @param {string} rootFolder - Root folder (only for manga)
 * @returns {string} Cache key
 */
export const getRandomViewCacheKey = (type, sourceKey, rootFolder = null) => {
  switch (type) {
    case 'manga':
      if (!rootFolder) throw new Error('Root folder required for manga random cache');
      return CACHE_KEYS.randomView.manga(sourceKey, rootFolder);
    case 'movie':
      return CACHE_KEYS.randomView.movie(sourceKey);
    case 'music':
      return CACHE_KEYS.randomView.music(sourceKey);
    default:
      throw new Error(`Unknown content type: ${type}`);
  }
};

/**
 * Get cache key for recent viewed based on content type
 * @param {string} type - Content type: 'manga', 'movie', 'music'
 * @param {string} sourceKey - Source key
 * @param {string} rootFolder - Root folder (only for manga)
 * @returns {string} Cache key
 */
export const getRecentViewedCacheKey = (type, sourceKey, rootFolder = null) => {
  switch (type) {
    case 'manga':
      if (!rootFolder) throw new Error('Root folder required for manga recent cache');
      return CACHE_KEYS.recentViewed.manga(sourceKey, rootFolder);
    case 'movie':
      return CACHE_KEYS.recentViewed.movie(sourceKey);
    case 'music':
      return CACHE_KEYS.recentViewed.music(sourceKey);
    default:
      throw new Error(`Unknown content type: ${type}`);
  }
};

/**
 * Get cache key for folder cache based on content type
 * @param {string} type - Content type: 'manga', 'movie', 'music'
 * @param {string} sourceKey - Source key
 * @param {string} rootFolder - Root folder (only for manga)
 * @param {string} path - Path (only for manga)
 * @returns {string} Cache key
 */
export const getFolderCacheKey = (type, sourceKey, rootFolder = null, path = '') => {
  switch (type) {
    case 'manga':
      if (!rootFolder) throw new Error('Root folder required for manga folder cache');
      return CACHE_KEYS.folderCache.manga(sourceKey, rootFolder, path);
    case 'movie':
      return CACHE_KEYS.folderCache.movie(sourceKey);
    case 'music':
      return CACHE_KEYS.folderCache.music(sourceKey);
    default:
      throw new Error(`Unknown content type: ${type}`);
  }
};

/**
 * Get cache key for top view based on content type
 * @param {string} type - Content type: 'manga', 'movie', 'music'
 * @param {string} sourceKey - Source key
 * @param {string} rootFolder - Root folder (only for manga)
 * @returns {string} Cache key
 */
export const getTopViewCacheKey = (type, sourceKey, rootFolder = null) => {
  switch (type) {
    case 'manga':
      if (!rootFolder) throw new Error('Root folder required for manga top view cache');
      return CACHE_KEYS.topView.manga(sourceKey, rootFolder);
    case 'movie':
      return CACHE_KEYS.topView.movie(sourceKey);
    case 'music':
      return CACHE_KEYS.topView.music(sourceKey);
    default:
      throw new Error(`Unknown content type: ${type}`);
  }
};

/**
 * Get all cache keys that match a pattern
 * @param {string} pattern - Pattern to match
 * @returns {string[]} Array of matching cache keys
 */
export const getCacheKeysByPattern = (pattern) => {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.includes(pattern)) {
      keys.push(key);
    }
  }
  return keys;
};

/**
 * Clear cache keys by pattern
 * @param {string} pattern - Pattern to match
 * @returns {number} Number of keys cleared
 */
export const clearCacheByPattern = (pattern) => {
  const keys = getCacheKeysByPattern(pattern);
  keys.forEach(key => localStorage.removeItem(key));
  console.log(`🗑️ Cleared ${keys.length} cache keys matching pattern: ${pattern}`);
  return keys.length;
};

/**
 * Clear all recent view cache
 * @returns {number} Number of keys cleared
 */
export const clearRecentViewCache = () => {
  const patterns = [
    CACHE_PREFIXES.RECENT_VIEWED_MANGA,
    CACHE_PREFIXES.RECENT_VIEWED_VIDEO,
    CACHE_PREFIXES.RECENT_VIEWED_MUSIC
  ];
  
  let totalCleared = 0;
  patterns.forEach(pattern => {
    totalCleared += clearCacheByPattern(pattern);
  });
  
  console.log(`🗑️ Cleared all recent view cache: ${totalCleared} keys`);
  return totalCleared;
};

/**
 * Clear all cache for a specific content type across ALL sources
 * @param {string} type - Content type: 'manga', 'movie', 'music'
 * @returns {number} Number of keys cleared
 */
export const clearTypeCache = (type) => {
  let totalCleared = 0;
  
  // Get all localStorage keys and filter by type
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    
    let shouldClear = false;
    
    switch (type) {
      case 'manga':
        shouldClear = key.startsWith(CACHE_PREFIXES.REACT_FOLDER_CACHE) ||
                     key.startsWith(CACHE_PREFIXES.LEGACY_FOLDER_CACHE) ||
                     key.startsWith(CACHE_PREFIXES.MANGA_CACHE) ||
                     key.startsWith(CACHE_PREFIXES.RECENT_VIEWED_MANGA) ||
                     (key.includes(CACHE_PREFIXES.RANDOM_VIEW) && key.endsWith('::manga')) ||
                     (key.includes(CACHE_PREFIXES.TOP_VIEW_CACHE) && key.endsWith('::manga'));
        break;
      case 'movie':
        shouldClear = key.startsWith(CACHE_PREFIXES.MOVIE_FOLDER_CACHE) ||
                     key.startsWith(CACHE_PREFIXES.MOVIE_CACHE) ||
                     key.startsWith(CACHE_PREFIXES.RECENT_VIEWED_VIDEO) ||
                     (key.includes(CACHE_PREFIXES.RANDOM_VIEW) && key.endsWith('::movie')) ||
                     (key.includes(CACHE_PREFIXES.TOP_VIEW_CACHE) && key.endsWith('::movie'));
        break;
      case 'music':
        shouldClear = key.startsWith(CACHE_PREFIXES.MUSIC_FOLDER_CACHE) ||
                     key.startsWith(CACHE_PREFIXES.MUSIC_CACHE) ||
                     key.startsWith(CACHE_PREFIXES.RECENT_VIEWED_MUSIC) ||
                     (key.includes(CACHE_PREFIXES.RANDOM_VIEW) && key.endsWith('::music')) ||
                     (key.includes(CACHE_PREFIXES.TOP_VIEW_CACHE) && key.endsWith('::music'));
        break;
    }
    
    if (shouldClear) {
      localStorage.removeItem(key);
      totalCleared++;
      console.log(`🗑️ Removed ${type} cache:`, key);
    }
  }
  
  console.log(`🗑️ Cleared all ${type} cache: ${totalCleared} keys`);
  return totalCleared;
};

/**
 * Clear all cache for a specific source
 * @param {string} sourceKey - Source key
 * @param {string} type - Content type (optional, clears all if not specified)
 */
export const clearSourceCache = (sourceKey, type = null) => {
  const patterns = [];
  
  if (!type || type === 'manga') {
    patterns.push(
      `${CACHE_PREFIXES.REACT_FOLDER_CACHE}::${sourceKey}::`,
      `${CACHE_PREFIXES.RANDOM_VIEW}::${sourceKey}::`,
      `${CACHE_PREFIXES.RECENT_VIEWED_MANGA}::`,
      `${CACHE_PREFIXES.MANGA_CACHE}::${sourceKey}::`
    );
  }
  
  if (!type || type === 'movie') {
    patterns.push(
      `${CACHE_PREFIXES.MOVIE_FOLDER_CACHE}-${sourceKey}`,
      `${CACHE_PREFIXES.RANDOM_VIEW}::${sourceKey}::undefined::movie`,
      `${CACHE_PREFIXES.RECENT_VIEWED_VIDEO}::${sourceKey}`,
      `${CACHE_PREFIXES.MOVIE_CACHE}::${sourceKey}::`
    );
  }
  
  if (!type || type === 'music') {
    patterns.push(
      `${CACHE_PREFIXES.MUSIC_FOLDER_CACHE}-${sourceKey}`,
      `${CACHE_PREFIXES.RANDOM_VIEW}::${sourceKey}::undefined::music`,
      `${CACHE_PREFIXES.RECENT_VIEWED_MUSIC}::${sourceKey}`,
      `${CACHE_PREFIXES.MUSIC_CACHE}::${sourceKey}::`
    );
  }
  
  let totalCleared = 0;
  patterns.forEach(pattern => {
    totalCleared += clearCacheByPattern(pattern);
  });
  
  console.log(`🗑️ Cleared total ${totalCleared} cache keys for source: ${sourceKey}, type: ${type || 'all'}`);
  return totalCleared;
};

/**
 * Clear all cache
 */
export const clearAllCache = () => {
  const patterns = [
    CACHE_PREFIXES.RANDOM_VIEW,
    CACHE_PREFIXES.RECENT_VIEWED_MANGA,
    CACHE_PREFIXES.RECENT_VIEWED_VIDEO,
    CACHE_PREFIXES.RECENT_VIEWED_MUSIC,
    CACHE_PREFIXES.REACT_FOLDER_CACHE,
    CACHE_PREFIXES.LEGACY_FOLDER_CACHE,
    CACHE_PREFIXES.MANGA_CACHE,
    CACHE_PREFIXES.MOVIE_CACHE,
    CACHE_PREFIXES.MUSIC_CACHE,
    CACHE_PREFIXES.MOVIE_FOLDER_CACHE,
    CACHE_PREFIXES.MUSIC_FOLDER_CACHE,
    CACHE_PREFIXES.TOP_VIEW_CACHE,
    CACHE_PREFIXES.ROOT_THUMB_CACHE
  ];
  
  let totalCleared = 0;
  patterns.forEach(pattern => {
    totalCleared += clearCacheByPattern(pattern);
  });
  
  console.log(`🗑️ Cleared all cache: ${totalCleared} keys`);
  return totalCleared;
};

export default {
  CACHE_PREFIXES,
  CACHE_CONFIG,
  CACHE_KEYS,
  getRandomViewCacheKey,
  getRecentViewedCacheKey,
  getFolderCacheKey,
  getTopViewCacheKey,
  getCacheKeysByPattern,
  clearCacheByPattern,
  clearSourceCache,
  clearAllCache,
  clearRecentViewCache,
  clearTypeCache
};
