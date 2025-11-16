// 📁 backend/constants.js
// 🔧 File constants chung cho toàn dự án

/**
 * 📂 File Extensions cho từng loại media
 */
const FILE_EXTENSIONS = {
  AUDIO: [
    '.mp3', '.flac', '.wav', '.aac', '.m4a',
    '.ogg', '.opus', '.wma', '.alac', '.aiff'
  ],
  VIDEO: [
    '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv',
    '.webm', '.m4v', '.3gp', '.ts', '.mpg', '.mpeg'
  ],
  IMAGE: [
    '.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif',
    '.bmp', '.tiff', '.svg', '.heic', '.heif','jfif'
  ],
  PDF: ['.pdf']
};

/**
 * 🗄️ Database Tables
 */
const DB_TABLES = {
  FOLDERS: 'folders',
  VIEWS: 'views',
  SONGS: 'songs',
  PLAYLISTS: 'playlists',
  PLAYLIST_ITEMS: 'playlist_items',
  ROOT_THUMBNAILS: 'root_thumbnails',
  MEDIA_ITEMS: 'media_items'
};

/**
 * ⚙️ Cache Settings
 */
const CACHE = {
  DAY_IN_MS: 24 * 60 * 60 * 1000,
  WEEK_IN_MS: 7 * 24 * 60 * 60 * 1000,
  MAX_FOLDER_CACHE_SIZE: 4 * 1024 * 1024, // 4MB
  MAX_TOTAL_CACHE_SIZE: 8 * 1024 * 1024,  // 8MB
  THUMBNAIL_CACHE_DAYS: 7
};

/**
 * 🎯 Content Types
 */
const CONTENT_TYPES = {
  MANGA: 'manga',
  MOVIE: 'movie', 
  MUSIC: 'music'
};

/**
 * 🔐 Security Settings
 */
const SECURITY = {
  MAX_REQUEST_SIZE: '10mb',
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 50000 // Tăng cực cao: 50k requests = ~100 chapter/15min
  }
};

/**
 * 📊 API Response Formats
 */
const API_RESPONSE = {
  SUCCESS: (data, message = 'Success') => ({
    success: true,
    message,
    data
  }),
  ERROR: (message = 'Error', code = 500) => ({
    success: false,
    message,
    code
  })
};

module.exports = {
  FILE_EXTENSIONS,
  DB_TABLES,
  CACHE,
  CONTENT_TYPES,
  SECURITY,
  API_RESPONSE
};
