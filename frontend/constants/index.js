// 📁 frontend/constants/index.js
// 🎯 Frontend Constants Main Entry Point (ES Modules)

import { TIMING } from './timing.js';
import { LIMITS } from './limits.js';
import { UI } from './ui.js';
import { CACHE } from './cache.js';

// File extensions (frontend specific)
export const FILE_EXTENSIONS = {
  IMAGE: ['.jpg', '.jpeg', '.png', '.webp', '.avif'],
  VIDEO: ['.mp4', '.mkv', '.avi', '.webm', '.ts', '.wmv'],
  AUDIO: ['.mp3', '.flac', '.wav', '.aac', '.m4a', '.ogg', '.opus', '.wma', '.alac', '.aiff'],
  DOCUMENT: ['.pdf', '.txt', '.doc', '.docx'],
  ARCHIVE: ['.zip', '.rar', '.7z', '.tar', '.gz'],
};

// Content types
export const CONTENT_TYPES = {
  MANGA: 'manga',
  MOVIE: 'movie',
  MUSIC: 'music',
};

// Folder types
export const FOLDER_TYPES = {
  FOLDER: 'folder',
  VIDEO: 'video',
  AUDIO: 'audio',
  FILE: 'file',
  PLAYLIST: 'playlist',
};

// API endpoints (frontend perspective)
export const API_ENDPOINTS = {
  BASE_URL: '',
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
  AUTH: {
    LOGIN: '/api/login',
    LOGOUT: '/api/logout',
    SECURITY_KEYS: '/api/security-keys.js',
  },
  MISC: {
    INCREASE_VIEW: '/api/increase-view',
    ROOTS: '/api/roots',
  },
};

// Performance constants
export const PERFORMANCE = {
  // Lazy loading
  LAZY_LOAD_THRESHOLD: 500,        // px
  INTERSECTION_THRESHOLD: 0.1,     // 10%
  
  // Virtual scrolling
  VIRTUAL_ITEM_HEIGHT: 100,        // px
  VIRTUAL_BUFFER_SIZE: 10,         // items
  
  // Debounce/throttle
  DEBOUNCE_DELAY: 250,             // ms
  THROTTLE_DELAY: 100,             // ms
  
  // Image loading
  MAX_CONCURRENT_IMAGES: 5,        // Max images loading at once
  IMAGE_LOAD_TIMEOUT: 10000,       // 10 seconds
  
  // Network
  REQUEST_TIMEOUT: 30000,          // 30 seconds
  RETRY_ATTEMPTS: 3,               // Max retry attempts
  RETRY_DELAY: 1000,               // Base retry delay
};

// Media player constants
export const MEDIA = {
  // Audio/video settings
  DEFAULT_VOLUME: 0.8,
  MAX_VOLUME: 1.0,
  MIN_VOLUME: 0.0,
  VOLUME_STEP: 0.1,
  
  // Seek settings
  SEEK_STEP: 10,                   // seconds
  FAST_SEEK_STEP: 30,              // seconds
  
  // Quality settings
  THUMBNAIL_QUALITY: 480,          // px
  PREVIEW_QUALITY: 720,            // px
  
  // Player dimensions
  PLAYER_MIN_WIDTH: 300,           // px
  PLAYER_MAX_WIDTH: 1920,          // px
  PLAYER_MIN_HEIGHT: 200,          // px
  
  // Playlist settings
  MAX_PLAYLIST_SIZE: 1000,         // items
  SHUFFLE_HISTORY_SIZE: 100,       // items
};

// Validation constants
export const VALIDATION = {
  // Input validation
  MAX_INPUT_LENGTH: 1000,
  MIN_PASSWORD_LENGTH: 6,
  MAX_PASSWORD_LENGTH: 50,
  
  // File validation
  MAX_FILE_SIZE: 100 * 1024 * 1024,  // 100MB
  ALLOWED_FILE_TYPES: [...FILE_EXTENSIONS.IMAGE, ...FILE_EXTENSIONS.VIDEO, ...FILE_EXTENSIONS.AUDIO],
  
  // URL validation
  MAX_URL_LENGTH: 2000,
  
  // Search validation
  MIN_SEARCH_LENGTH: 1,
  MAX_SEARCH_LENGTH: 100,
};

// Theme constants
export const THEME = {
  // Theme names
  THEMES: {
    LIGHT: 'light',
    DARK: 'dark',
    AUTO: 'auto',
  },
  
  // Theme colors
  COLORS: {
    LIGHT: {
      BACKGROUND: '#ffffff',
      TEXT: '#333333',
      BORDER: '#e0e0e0',
      SHADOW: 'rgba(0,0,0,0.1)',
    },
    DARK: {
      BACKGROUND: '#1a1a1a',
      TEXT: '#ffffff',
      BORDER: '#333333',
      SHADOW: 'rgba(0,0,0,0.3)',
    },
  },
  
  // CSS custom properties
  CSS_VARS: {
    BG_COLOR: '--bg-color',
    TEXT_COLOR: '--text-color',
    BORDER_COLOR: '--border-color',
    SHADOW_COLOR: '--shadow-color',
  },
};

// Export all constants
export default {
  TIMING,
  LIMITS,
  UI,
  CACHE,
  FILE_EXTENSIONS,
  CONTENT_TYPES,
  FOLDER_TYPES,
  API_ENDPOINTS,
  PERFORMANCE,
  MEDIA,
  VALIDATION,
  THEME,
};

// Named exports for convenience
export {
  TIMING,
  LIMITS,
  UI,
  CACHE,
  PERFORMANCE,
  MEDIA,
  VALIDATION,
  THEME,
};
