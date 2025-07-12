// 📁 frontend/src/constants.js
// 🔧 Frontend Constants - Giữ nguyên logic cũ, chỉ tập trung hóa constants

/**
 * 📊 Pagination Settings
 */
export const PAGINATION = {
  // Folder pagination
  FOLDERS_PER_PAGE: 24,           // Từ folder.js
  MANGA_FAVORITES_PER_PAGE: 20,   // Từ manga/favorites.js
  MOVIE_FAVORITES_FOLDER_PER_PAGE: 16, // Từ movie/favorites.js
  MOVIE_FAVORITES_VIDEO_PER_PAGE: 16,  // Từ movie/favorites.js
  
  // Movies pagination
  MOVIES_PER_PAGE: 16,            // Từ movie/index.js
  
  // Music pagination
  MUSIC_PER_PAGE: 20,             // Có thể được sử dụng
  
  // Search pagination
  SEARCH_LIMIT: 100,              // Từ search functions
  SEARCH_OFFSET: 0,               // Default offset
  
  // Dropdown scroll pagination
  DROPDOWN_SCROLL_THRESHOLD: 10   // Từ ui.js filterManga
};

/**
 * 🖼️ Reader Settings
 */
export const READER = {
  IMAGES_PER_PAGE: 200,           // Từ scroll.js
  SCROLL_THRESHOLD: 50,           // Scroll detection threshold
  ZOOM_STEP: 0.1,                 // Zoom increment
  MIN_ZOOM: 0.5,                  // Minimum zoom
  MAX_ZOOM: 3.0,                  // Maximum zoom
  DOUBLE_CLICK_THRESHOLD: 300     // Double click detection (ms)
};

/**
 * 💾 Cache Settings
 */
export const CACHE = {
  // Size limits (bytes)
  MAX_FOLDER_CACHE_SIZE: 4 * 1024 * 1024,      // 4MB - Từ storage.js
  MAX_TOTAL_CACHE_SIZE: 4 * 1024 * 1024 + 300, // 4MB + 300 bytes
  MAX_MOVIE_CACHE_SIZE: 4 * 1024 * 1024 + 300, // 4MB + 300 bytes
  
  // Cache cleanup thresholds
  CACHE_CLEANUP_THRESHOLD: 0.5,   // 50% của max size
  
  // Time-based cache (milliseconds)
  THUMBNAIL_CACHE_DAYS: 7,        // 7 days - Từ storage.js
  THUMBNAIL_CACHE_MS: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  SLIDER_CACHE_MS: 30 * 60 * 1000, // 30 minutes - Từ folderSlider.js
  
  // Cache prefixes
  FOLDER_CACHE_PREFIX: "folderCache::",
  MOVIE_CACHE_PREFIX: "movieCache::",
  MUSIC_CACHE_PREFIX: "musicCache::",
  ROOT_THUMB_CACHE_PREFIX: "rootThumb::"
};

/**
 * 🎵 Slider/Carousel Settings
 */
export const SLIDER = {
  AUTO_SCROLL_INTERVAL: 20000,    // 20 seconds - Từ folderSlider.js
  SCROLL_STEP: 5,                 // Scroll step multiplier
  MOBILE_BREAKPOINT: 768,         // Mobile detection breakpoint
  CARD_WIDTH: 160,                // Card width in pixels
  CARD_GAP: 16                    // Gap between cards
};

/**
 * 🎨 UI Settings
 */
export const UI = {
  // Button text
  PREV_PAGE_TEXT: "⬅ Trang trước",
  NEXT_PAGE_TEXT: "Trang sau ➡",
  JUMP_BUTTON_TEXT: "⏩",
  JUMP_PLACEHOLDER: "Trang...",
  
  // Input constraints
  JUMP_INPUT_WIDTH: "60px",
  JUMP_INPUT_MIN: 1,
  
  // Timeouts and delays
  TOAST_DURATION: 3000,           // 3 seconds
  LOADING_DELAY: 500,             // 0.5 seconds
  DEBOUNCE_DELAY: 300,            // 0.3 seconds
  
  // Scroll settings
  SCROLL_DEBOUNCE: 16,            // ~60fps
  INTERSECTION_THRESHOLD: 0.1,    // 10% visibility
  
  // Modal settings
  MODAL_Z_INDEX: 9999,
  MODAL_BACKDROP_OPACITY: 0.6
};

/**
 * 🔍 Search Settings
 */
export const SEARCH = {
  MIN_SEARCH_LENGTH: 2,           // Minimum characters to search
  SEARCH_DEBOUNCE: 300,           // Debounce delay (ms)
  MAX_SEARCH_RESULTS: 50,         // Maximum results to show
  RANDOM_ITEMS_LIMIT: 30,         // Random items limit - Từ các API
  TOP_ITEMS_LIMIT: 30             // Top items limit - Từ các API
};

/**
 * 📱 Responsive Settings
 */
export const RESPONSIVE = {
  MOBILE_BREAKPOINT: 768,         // Mobile breakpoint (px)
  TABLET_BREAKPOINT: 1024,        // Tablet breakpoint (px)
  DESKTOP_BREAKPOINT: 1200,       // Desktop breakpoint (px)
  
  // Grid columns
  MOBILE_COLUMNS: 2,
  TABLET_COLUMNS: 4,
  DESKTOP_COLUMNS: 6
};

/**
 * 🎬 Video/Audio Settings
 */
export const MEDIA = {
  // Video player settings
  VOLUME_STEP: 0.1,               // Volume increment
  SEEK_STEP: 10,                  // Seek step in seconds
  PLAYBACK_RATES: [0.5, 0.75, 1, 1.25, 1.5, 2], // Available playback rates
  
  // Audio player settings
  CROSSFADE_DURATION: 1000,       // 1 second
  PRELOAD_NEXT: true,             // Preload next track
  
  // Thumbnail settings
  THUMBNAIL_QUALITY: 0.8,         // JPEG quality
  THUMBNAIL_MAX_WIDTH: 300,       // Max thumbnail width
  THUMBNAIL_MAX_HEIGHT: 300       // Max thumbnail height
};

/**
 * 🔄 Animation Settings
 */
export const ANIMATION = {
  FADE_DURATION: 300,             // Fade animation duration (ms)
  SLIDE_DURATION: 250,            // Slide animation duration (ms)
  BOUNCE_DURATION: 400,           // Bounce animation duration (ms)
  
  // Easing functions
  EASE_OUT: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  EASE_IN: "cubic-bezier(0.55, 0.055, 0.675, 0.19)",
  EASE_IN_OUT: "cubic-bezier(0.645, 0.045, 0.355, 1.000)"
};

/**
 * 🎯 Default Values
 */
export const DEFAULTS = {
  PAGE_INDEX: 0,                  // Default page index
  FOLDER_PATH: "",                // Default folder path
  SEARCH_QUERY: "",               // Default search query
  VOLUME: 1.0,                    // Default volume
  PLAYBACK_RATE: 1.0,             // Default playback rate
  ZOOM_LEVEL: 1.0,                // Default zoom level
  
  // Default image sources
  DEFAULT_COVER: "/default/default-cover.jpg",
  DEFAULT_FOLDER_THUMB: "/default/folder-thumb.png",
  DEFAULT_MUSIC_THUMB: "/default/music-thumb.png",
  DEFAULT_VIDEO_THUMB: "/default/video-thumb.png",
  DEFAULT_FAVICON: "/default/favicon.png"
};

/**
 * 📋 Storage Keys
 */
export const STORAGE_KEYS = {
  // Recent viewed
  RECENT_VIEWED: "recentViewed",
  RECENT_VIEWED_VIDEO: "recentViewedVideo",
  RECENT_VIEWED_MUSIC: "recentViewedMusic",
  
  // Settings
  DARK_MODE: "darkMode",
  READER_MODE: "readerMode",
  VOLUME_LEVEL: "volumeLevel",
  PLAYBACK_RATE: "playbackRate",
  
  // Security
  AUTH_TOKEN: "authToken",
  SECURE_KEYS: "secureKeys",
  
  // UI State
  SIDEBAR_COLLAPSED: "sidebarCollapsed",
  GRID_VIEW: "gridView",
  SORT_ORDER: "sortOrder"
};

/**
 * 🎨 CSS Classes
 */
export const CSS_CLASSES = {
  // Common
  HIDDEN: "hidden",
  LOADING: "loading",
  ACTIVE: "active",
  DISABLED: "disabled",
  
  // Layout
  GRID: "grid",
  FOLDER_SECTION: "folder-section",
  FOLDER_SECTION_HEADER: "folder-section-header",
  FOLDER_SECTION_TITLE: "folder-section-title",
  
  // Components
  FOLDER_CARD: "folder-card",
  MOVIE_CARD: "movie-card",
  MUSIC_CARD: "music-card",
  
  // Reader
  READER_CONTROLS: "reader-controls",
  SCROLL_MODE: "scroll-mode",
  HORIZONTAL_MODE: "horizontal-mode",
  
  // Pagination
  PAGINATION_INFO: "pagination-info",
  PAGINATION_CONTROLS: "pagination-controls"
};

/**
 * 📡 API Settings
 */
export const API = {
  // Endpoints
  ENDPOINTS: {
    MANGA: "/api/manga",
    MOVIE: "/api/movie", 
    MUSIC: "/api/music",
    SYSTEM: "/api"
  },
  
  // Request settings
  TIMEOUT: 30000,                 // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,              // 1 second
  
  // Cache settings
  CACHE_DURATION: 5 * 60 * 1000   // 5 minutes
};

/**
 * 🎪 Environment Settings
 */
export const ENV = {
  // Feature flags
  ENABLE_DARK_MODE: true,
  ENABLE_CACHE: true,
  ENABLE_SEARCH: true,
  ENABLE_FAVORITES: true,
  
  // Debug settings
  DEBUG_MODE: false,
  CONSOLE_LOGS: true,
  PERFORMANCE_MONITORING: false
};
