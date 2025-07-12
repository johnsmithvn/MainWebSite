// 📁 frontend/constants/cache.js
// 🔄 Frontend Cache Constants (ES Modules)

export const CACHE = {
  // Cache expiry times (frontend)
  EXPIRY: {
    SHORT: 5 * 60 * 1000,           // 5 phút
    MEDIUM: 30 * 60 * 1000,         // 30 phút
    LONG: 6 * 60 * 60 * 1000,       // 6 giờ
    VERY_LONG: 24 * 60 * 60 * 1000, // 24 giờ
  },
  
  // Time calculation helpers
  TIME: {
    MINUTE: 60 * 1000,              // 1 phút
    HOUR: 60 * 60 * 1000,           // 1 giờ
    DAY: 24 * 60 * 60 * 1000,       // 1 ngày
    WEEK: 7 * 24 * 60 * 60 * 1000,  // 1 tuần
  },
  
  // Cache key prefixes (frontend)
  PREFIXES: {
    FOLDER: 'folder:',
    MOVIE: 'movie:',
    MUSIC: 'music:',
    RECENT: 'recent:',
    SEARCH: 'search:',
    THUMBNAIL: 'thumb:',
    RANDOM: 'random:',
    FAVORITE: 'favorite:',
    PLAYLIST: 'playlist:',
    SETTINGS: 'settings:',
    THEME: 'theme:',
    USER: 'user:',
  },
  
  // Storage settings
  STORAGE: {
    MAX_SIZE: 50 * 1024 * 1024,     // 50MB localStorage limit
    CLEANUP_THRESHOLD: 40 * 1024 * 1024, // 40MB cleanup threshold
    CLEANUP_PERCENTAGE: 0.3,         // Clean 30% when threshold reached
  },
  
  // Cache categories
  CATEGORIES: {
    PERSISTENT: 'persistent',        // Data that persists across sessions
    SESSION: 'session',              // Data that expires with session
    TEMPORARY: 'temporary',          // Data that expires quickly
  },
  
  // Cache priorities
  PRIORITY: {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4,
  },
  
  // Cache strategies
  STRATEGY: {
    CACHE_FIRST: 'cache-first',      // Use cache first, fallback to network
    NETWORK_FIRST: 'network-first',  // Use network first, fallback to cache
    CACHE_ONLY: 'cache-only',        // Only use cache
    NETWORK_ONLY: 'network-only',    // Only use network
  },
};

export default CACHE;
