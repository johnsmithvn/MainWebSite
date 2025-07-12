// 📁 backend/constants/cache.js
// 🔄 Backend Cache Constants (CommonJS)

const CACHE = {
  // Cache expiry times
  EXPIRY: 7 * 24 * 60 * 60 * 1000,    // 7 ngày
  SHORT_EXPIRY: 30 * 60 * 1000,        // 30 phút
  LONG_EXPIRY: 30 * 24 * 60 * 60 * 1000, // 30 ngày
  
  // Time calculation helpers
  MINUTE_IN_MS: 60 * 1000,
  HOUR_IN_MS: 60 * 60 * 1000,
  DAY_IN_MS: 24 * 60 * 60 * 1000,
  WEEK_IN_MS: 7 * 24 * 60 * 60 * 1000,
  
  // Cache key prefixes
  PREFIXES: {
    FOLDER: 'folderCache::',
    MOVIE: 'movieCache::',
    MUSIC: 'musicCache::',
    ROOT_THUMB: 'rootThumb::',
    RANDOM: 'randomView::',
    RECENT_MANGA: 'recentViewed::',
    RECENT_MOVIE: 'recentViewedVideo::',
    RECENT_MUSIC: 'recentViewedMusic::',
    SCAN_STATUS: 'scanStatus::',
    THUMBNAIL: 'thumbnail::',
    METADATA: 'metadata::',
    TEST: 'test::',
  },
  
  // Cache cleanup settings
  CLEANUP: {
    INTERVAL: 60 * 60 * 1000,           // 1 giờ
    MAX_AGE: 7 * 24 * 60 * 60 * 1000,   // 7 ngày
    BATCH_SIZE: 100,                     // Số items xóa mỗi lần
  },
  
  // Memory cache settings
  MEMORY_CACHE: {
    MAX_SIZE: 50 * 1024 * 1024,         // 50MB
    TTL: 5 * 60 * 1000,                 // 5 phút
    CHECK_INTERVAL: 60 * 1000,          // 1 phút
  },
};

module.exports = CACHE;
