// 📁 backend/constants/index.js
// 🎯 Backend Constants Main Entry Point (CommonJS)

const TIMING = require('./timing');
const LIMITS = require('./limits');
const SERVER = require('./server');
const CACHE = require('./cache');
const DATABASE = require('./database');

// File extensions
const FILE_EXTENSIONS = {
  IMAGE: ['.jpg', '.jpeg', '.png', '.webp', '.avif'],
  VIDEO: ['.mp4', '.mkv', '.avi', '.webm', '.ts', '.wmv'],
  AUDIO: ['.mp3', '.flac', '.wav', '.aac', '.m4a', '.ogg', '.opus', '.wma', '.alac', '.aiff'],
};

// Content types
const CONTENT_TYPES = {
  MANGA: 'manga',
  MOVIE: 'movie',
  MUSIC: 'music',
};

// Folder types
const FOLDER_TYPES = {
  FOLDER: 'folder',
  VIDEO: 'video',
  AUDIO: 'audio',
  FILE: 'file',
};

// API endpoints
const API_ENDPOINTS = {
  MANGA: {
    FOLDER_CACHE: '/api/manga/folder-cache',
    SCAN: '/api/manga/scan',
    RESET_CACHE: '/api/manga/reset-cache',
    FAVORITE: '/api/manga/favorite',
    ROOT_THUMBNAIL: '/api/manga/root-thumbnail',
  },
  MOVIE: {
    FOLDER: '/api/movie/movie-folder',
    VIDEO: '/api/movie/video',
    CACHE: '/api/movie/video-cache',
    SCAN: '/api/movie/scan-movie',
    EXTRACT: '/api/movie/extract-thumbnail',
    SET_THUMBNAIL: '/api/movie/set-thumbnail',
  },
  MUSIC: {
    FOLDER: '/api/music/music-folder',
    AUDIO: '/api/music/audio',
    CACHE: '/api/music/audio-cache',
    PLAYLIST: '/api/music/playlist',
    SCAN: '/api/music/scan-music',
    EXTRACT: '/api/music/extract-thumbnail',
  },
};

// Scanner settings
const SCANNER_SETTINGS = {
  BATCH_SIZE: LIMITS.BATCH_SIZE,
  MAX_DEPTH: 10,
  THUMBNAIL_EXTENSIONS: FILE_EXTENSIONS.IMAGE,
  SUPPORTED_FORMATS: {
    MANGA: FILE_EXTENSIONS.IMAGE,
    MOVIE: FILE_EXTENSIONS.VIDEO,
    MUSIC: FILE_EXTENSIONS.AUDIO,
  },
  SCAN_OPTIONS: {
    RECURSIVE: true,
    INCLUDE_HIDDEN: false,
    FOLLOW_SYMLINKS: false,
    EXTRACT_METADATA: true,
  },
};

// Security settings
const SECURITY = {
  MAX_PATH_LENGTH: LIMITS.MAX_PATH_LENGTH,
  MAX_FILE_SIZE: LIMITS.MAX_FILE_SIZE,
  ALLOWED_HOSTS: SERVER.SECURITY.ALLOWED_HOSTS,
  TOKEN_EXPIRY: TIMING.TOKEN_EXPIRY,
  MAX_LOGIN_ATTEMPTS: SERVER.SECURITY.MAX_LOGIN_ATTEMPTS,
  LOCKOUT_DURATION: SERVER.SECURITY.LOCKOUT_DURATION,
};

// Export all constants
module.exports = {
  TIMING,
  LIMITS,
  SERVER,
  CACHE,
  DATABASE,
  FILE_EXTENSIONS,
  CONTENT_TYPES,
  FOLDER_TYPES,
  API_ENDPOINTS,
  SCANNER_SETTINGS,
  SECURITY,
};
