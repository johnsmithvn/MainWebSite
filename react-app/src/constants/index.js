// 📁 src/constants/index.js
// 🔧 Constants - Ported from original project

/**
 * 📊 Pagination Settings
 */
export const PAGINATION = {
  FOLDERS_PER_PAGE: 24,
  MANGA_FAVORITES_PER_PAGE: 20,
  MOVIE_FAVORITES_FOLDER_PER_PAGE: 16,
  MOVIE_FAVORITES_VIDEO_PER_PAGE: 16,
  MOVIES_PER_PAGE: 16,
  MUSIC_PER_PAGE: 20,
  SEARCH_LIMIT: 100,
  SEARCH_OFFSET: 0,
  DROPDOWN_SCROLL_THRESHOLD: 10
};

/**
 * 🖼️ Reader Settings
 */
export const READER = {
  DEFAULT_MODE: "vertical",
  LAZY_LOAD: false,
  IMAGES_PER_PAGE: 200,
  SCROLL_THRESHOLD: 50,
  ZOOM_STEP: 0.1,
  MIN_ZOOM: 0.5,
  MAX_ZOOM: 3.0,
  DOUBLE_CLICK_THRESHOLD: 300
};

/**
 * 📚 Manga Settings
 */
export const MANGA = {
  DEFAULT_USE_DB: true, // true: load từ DB, false: load từ disk
  GRID_LOAD_FROM_DB: true, // Setting cho folder grid loading
  READER_LOAD_FROM_DB: true // Setting cho reader image loading
};

/**
 * 💾 Cache Settings
 */
export const CACHE = {
  MAX_FOLDER_CACHE_SIZE: 4 * 1024 * 1024,
  MAX_TOTAL_CACHE_SIZE: 4 * 1024 * 1024 + 300,
  MAX_MOVIE_CACHE_SIZE: 4 * 1024 * 1024 + 300,
  CACHE_CLEANUP_THRESHOLD: 0.5,
  THUMBNAIL_CACHE_DAYS: 7,
  THUMBNAIL_CACHE_MS: 7 * 24 * 60 * 60 * 1000,
  SLIDER_CACHE_MS: 30 * 60 * 1000,
  FOLDER_CACHE_PREFIX: "folderCache::",
  MOVIE_CACHE_PREFIX: "movieCache::",
  MUSIC_CACHE_PREFIX: "musicCache::",
  ROOT_THUMB_CACHE_PREFIX: "rootThumb::"
};

/**
 * 🎵 Slider/Carousel Settings
 */
export const SLIDER = {
  AUTO_SCROLL_INTERVAL: 20000,
  SCROLL_STEP: 5,
  MOBILE_BREAKPOINT: 768,
  CARD_WIDTH: 160,
  CARD_GAP: 16
};

/**
 * 🎨 UI Settings
 */
export const UI = {
  PREV_PAGE_TEXT: "⬅ Trang trước",
  NEXT_PAGE_TEXT: "Trang sau ➡",
  JUMP_BUTTON_TEXT: "⏩",
  JUMP_PLACEHOLDER: "Trang...",
  JUMP_INPUT_WIDTH: "60px",
  JUMP_INPUT_MIN: 1,
  TOAST_DURATION: 3000,
  LOADING_DELAY: 500,
  DEBOUNCE_DELAY: 300,
  SCROLL_DEBOUNCE: 16,
  INTERSECTION_THRESHOLD: 0.1,
  MODAL_Z_INDEX: 9999,
  MODAL_BACKDROP_OPACITY: 0.6
};

/**
 * 🔍 Search Settings
 */
export const SEARCH = {
  MIN_SEARCH_LENGTH: 2,
  SEARCH_DEBOUNCE: 300,
  MAX_SEARCH_RESULTS: 50,
  RANDOM_ITEMS_LIMIT: 30,
  TOP_ITEMS_LIMIT: 30
};

/**
 * 📱 Responsive Settings
 */
export const RESPONSIVE = {
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1024,
  DESKTOP_BREAKPOINT: 1200,
  MOBILE_COLUMNS: 2,
  TABLET_COLUMNS: 4,
  DESKTOP_COLUMNS: 6
};

/**
 * 📡 API Settings
 */
export const API = {
  ENDPOINTS: {
    MANGA: "/api/manga",
    MOVIE: "/api/movie",
    MUSIC: "/api/music",
    SYSTEM: "/api"
  },
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};

/**
 * 🎨 CSS Classes
 */
export const CSS_CLASSES = {
  HIDDEN: "hidden",
  LOADING: "loading",
  ACTIVE: "active",
  DISABLED: "disabled",
  GRID: "grid",
  FOLDER_SECTION: "folder-section",
  FOLDER_CARD: "folder-card",
  MOVIE_CARD: "movie-card",
  MUSIC_CARD: "music-card"
};

/**
 * 📋 Storage Keys
 */
export const STORAGE_KEYS = {
  SOURCE_KEY: "sourceKey",
  ROOT_FOLDER: "rootFolder",
  DARK_MODE: "darkMode",
  READER_SETTINGS: "readerSettings",
  RECENT_VIEWED: "recentViewed",
  USER_TOKEN: "userToken",
  MANGA_SETTINGS: "mangaSettings",
  MOVIE_SETTINGS: "movieSettings",
  MUSIC_SETTINGS: "musicSettings"
};
