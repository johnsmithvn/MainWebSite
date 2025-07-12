// 📁 shared/constants.js
/**
 * 📁 File extensions cho các loại media
 */
const FILE_EXTENSIONS = {
  IMAGE: [".jpg", ".jpeg", ".png", ".webp", ".avif"],
  VIDEO: [".mp4", ".mkv", ".avi", ".webm", ".ts", ".wmv"],
  AUDIO: [
    ".mp3", ".flac", ".wav", ".aac", ".m4a",
    ".ogg", ".opus", ".wma", ".alac", ".aiff"
  ]
};

/**
 * 📊 Database table names
 */
const TABLE_NAMES = {
  FOLDERS: 'folders',
  VIEWS: 'views',
  ROOT_THUMBNAILS: 'root_thumbnails',
  SONGS: 'songs',
  PLAYLISTS: 'playlists',
  PLAYLIST_ITEMS: 'playlist_items'
};

/**
 * 🎯 Content types
 */
const CONTENT_TYPES = {
  MANGA: 'manga',
  MOVIE: 'movie',
  MUSIC: 'music'
};

/**
 * 📝 Folder types
 */
const FOLDER_TYPES = {
  FOLDER: 'folder',
  VIDEO: 'video',
  AUDIO: 'audio',
  FILE: 'file'
};

/**
 * 🔐 Security constants
 */
const SECURITY = {
  MAX_PATH_LENGTH: 1000,
  MAX_FILE_SIZE: 500 * 1024 * 1024, // 500MB
  ALLOWED_HOSTS: ['localhost', '127.0.0.1'],
  TOKEN_EXPIRY: 24 * 60 * 60 * 1000 // 24 hours
};

/**
 * 📦 Cache settings
 */
const CACHE_SETTINGS = {
  MAX_FOLDER_CACHE_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_MOVIE_CACHE_SIZE: 200 * 1024 * 1024,  // 200MB
  MAX_MUSIC_CACHE_SIZE: 150 * 1024 * 1024,  // 150MB
  CACHE_EXPIRY: 7 * 24 * 60 * 60 * 1000,    // 7 days
  MAX_RECENT_ITEMS: 50
};

/**
 * 🎨 UI constants
 */
const UI_CONSTANTS = {
  FOLDERS_PER_PAGE: 24,
  IMAGES_PER_PAGE: 400,
  SEARCH_LIMIT: 50,
  RANDOM_LIMIT: 30,
  TOP_LIMIT: 30
};

/**
 * 🔄 API endpoints
 */
const API_ENDPOINTS = {
  MANGA: {
    FOLDER_CACHE: '/api/manga/folder-cache',
    SCAN: '/api/manga/scan',
    RESET_CACHE: '/api/manga/reset-cache',
    FAVORITE: '/api/manga/favorite',
    ROOT_THUMBNAIL: '/api/manga/root-thumbnail'
  },
  MOVIE: {
    FOLDER: '/api/movie/movie-folder',
    VIDEO: '/api/movie/video',
    CACHE: '/api/movie/video-cache',
    SCAN: '/api/movie/scan-movie',
    EXTRACT: '/api/movie/extract-thumbnail',
    SET_THUMBNAIL: '/api/movie/set-thumbnail'
  },
  MUSIC: {
    FOLDER: '/api/music/music-folder',
    AUDIO: '/api/music/audio',
    CACHE: '/api/music/audio-cache',
    PLAYLIST: '/api/music/playlist',
    SCAN: '/api/music/scan-music',
    EXTRACT: '/api/music/extract-thumbnail'
  }
};

// Scanner settings
const SCANNER_SETTINGS = {
  BATCH_SIZE: 100,
  MAX_DEPTH: 10,
  THUMBNAIL_EXTENSIONS: FILE_EXTENSIONS.IMAGES,
  SUPPORTED_FORMATS: {
    MANGA: FILE_EXTENSIONS.IMAGES,
    MOVIE: FILE_EXTENSIONS.VIDEO,
    MUSIC: FILE_EXTENSIONS.AUDIO
  },
  
  SCAN_OPTIONS: {
    RECURSIVE: true,
    INCLUDE_HIDDEN: false,
    FOLLOW_SYMLINKS: false,
    EXTRACT_METADATA: true
  }
};

// Database configuration
const DB_CONFIG = {
  PRAGMA: {
    JOURNAL_MODE: 'WAL',
    SYNCHRONOUS: 'NORMAL',
    CACHE_SIZE: 10000,
    TEMP_STORE: 'MEMORY'
  },
  
  INDEXES: {
    FOLDERS: ['path', 'root', 'name', 'thumbnail'],
    VIEWS: ['path', 'root', 'count'],
    FAVORITES: ['path', 'root']
  }
};

// Cache prefixes
CACHE_SETTINGS.PREFIXES = {
  FOLDER: 'folderCache::',
  MOVIE: 'movieCache::',
  MUSIC: 'musicCache::',
  ROOT_THUMB: 'rootThumb::',
  RANDOM: 'randomView::',
  RECENT_MANGA: 'recentViewed::',
  RECENT_MOVIE: 'recentViewedVideo::',
  RECENT_MUSIC: 'recentViewedMusic::'
};

// Export all constants
module.exports = {
  FILE_EXTENSIONS,
  TABLE_NAMES,
  CONTENT_TYPES,
  FOLDER_TYPES,
  SECURITY,
  CACHE_SETTINGS,
  UI_CONSTANTS,
  API_ENDPOINTS,
  SCANNER_SETTINGS,
  DB_CONFIG
};
