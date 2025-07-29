// 📁 frontend/src/constants.js
// 🔧 Froexport const READER = {
  // 📚 Số ảnh load mỗi lần trong scroll modetants - Giữ nguyên logic cũ, chỉ tập trung hóa constants

/**
 * 📊 Pagination Settings
 * 🎯 Mục đích: Quản lý số lượng item hiển thị trên mỗi trang
 * 🔗 Ảnh hưởng: Hiệu năng loading, UX, memory usage
 * 📍 Sử dụng: Tất cả pages có danh sách (manga, movie, music)
 */
export const PAGINATION = {
  // 📁 Folder pagination - Số folder hiển thị trên trang chính
  FOLDERS_PER_PAGE: 24,           // Từ folder.js - Tối ưu cho grid 6x4 trên desktop
  
  // 💖 Manga favorites - Số manga yêu thích hiển thị
  MANGA_FAVORITES_PER_PAGE: 20,   // Từ manga/favorites.js - Chia đều cho mobile/desktop
  
  // 🎬 Movie favorites - Số folder phim yêu thích
  MOVIE_FAVORITES_FOLDER_PER_PAGE: 16, // Từ movie/favorites.js - Grid 4x4 tối ưu
  
  // 🎥 Movie favorites videos - Số video yêu thích
  MOVIE_FAVORITES_VIDEO_PER_PAGE: 16,  // Từ movie/favorites.js - Cân bằng loading vs UX
  
  // 🎬 Movies per page - Danh sách phim chính
  MOVIES_PER_PAGE: 16,            // Từ movie/index.js - Tối ưu cho thumbnail lớn
  
  // 🎵 Music per page - Danh sách nhạc (future use)
  MUSIC_PER_PAGE: 20,             // Dự phòng cho music player, text-based nên nhiều hơn
  
  // 🔍 Search pagination - Giới hạn kết quả tìm kiếm
  SEARCH_LIMIT: 100,              // Từ search functions - Tránh overload server
  SEARCH_OFFSET: 0,               // Default offset - Điểm bắt đầu phân trang
  
  // 📜 Dropdown scroll - Trigger load more trong dropdown
  DROPDOWN_SCROLL_THRESHOLD: 10   // Từ ui.js filterManga - Load thêm khi còn 10 item
};

/**
 * 🖼️ Reader Settings
 * 🎯 Mục đích: Cấu hình trình đọc manga với các chế độ scroll/horizontal
 * 🔗 Ảnh hưởng: Performance loading ảnh, UX đọc truyện, memory management
 * 📍 Sử dụng: reader/scroll.js, reader/horizontal.js, reader/index.js
 */
export const READER = {

  //  mode mặc định cho reader
  DEFAULT_MODE: "vertical", // hoặc "vertical" /"horizontal" nếu muốn mặc định scroll

  // 📚 Lazy load images - false se load tat ca ảnh trong page
  // false sẽ load ít ảnh và lần lượt
  LAZY_LOAD: false,  // true: lazy load images, false: load all images

  // 📚 Số ảnh load mỗi lần trong scroll mode
  IMAGES_PER_PAGE: 200,           // Từ scroll.js - High number for smooth scrolling
  
  // 📏 Ngưỡng scroll để trigger load more
  SCROLL_THRESHOLD: 50,           // Pixel từ bottom để load thêm ảnh
  
  // 🔍 Bước zoom khi người dùng zoom in/out
  ZOOM_STEP: 0.1,                 // 10% mỗi lần zoom - Smooth transition
  
  // 🔍 Giới hạn zoom minimum để tránh ảnh quá nhỏ
  MIN_ZOOM: 0.5,                  // 50% - Vẫn đọc được trên mobile
  
  // 🔍 Giới hạn zoom maximum để tránh ảnh quá mờ
  MAX_ZOOM: 3.0,                  // 300% - Đủ để xem chi tiết
  
  // ⏱️ Thời gian phát hiện double click (ms)
  DOUBLE_CLICK_THRESHOLD: 300     // 300ms - Cân bằng giữa click nhanh và slow device
};

/**
 * 💾 Cache Settings
 * 🎯 Mục đích: Quản lý bộ nhớ cache, tối ưu performance và storage
 * 🔗 Ảnh hưởng: Memory usage, loading speed, storage quota
 * 📍 Sử dụng: storage.js, folderSlider.js, tất cả components load data
 */
export const CACHE = {
  // 📏 Size limits (bytes) - Giới hạn dung lượng cache
  
  // 📁 Cache cho folder data (thumbnails, metadata)
  MAX_FOLDER_CACHE_SIZE: 4 * 1024 * 1024,      // 4MB - Từ storage.js, đủ cho ~1000 thumbnails
  
  // 📊 Tổng cache size cho toàn app
  MAX_TOTAL_CACHE_SIZE: 4 * 1024 * 1024 + 300, // 4MB + 300 bytes buffer cho metadata
  
  // 🎬 Cache cho movie data (thumbnails, video metadata)
  MAX_MOVIE_CACHE_SIZE: 4 * 1024 * 1024 + 300, // 4MB + 300 bytes - Video thumbs lớn hơn
  
  // 🧹 Cache cleanup thresholds - Ngưỡng dọn dẹp cache
  CACHE_CLEANUP_THRESHOLD: 0.5,   // 50% của max size - Trigger cleanup sớm
  
  // ⏰ Time-based cache (milliseconds) - Cache theo thời gian
  
  // 🖼️ Thumbnail cache duration
  THUMBNAIL_CACHE_DAYS: 7,        // 7 days - Từ storage.js, cân bằng freshness vs performance
  THUMBNAIL_CACHE_MS: 7 * 24 * 60 * 60 * 1000, // 7 days in ms - Conversion cho JS Date
  
  // 🎠 Slider cache duration - Cache cho carousel/slider
  SLIDER_CACHE_MS: 30 * 60 * 1000, // 30 minutes - Từ folderSlider.js, refresh thường xuyên
  
  // 🏷️ Cache prefixes - Namespace cho localStorage keys
  FOLDER_CACHE_PREFIX: "folderCache::",     // Prefix cho folder cache keys
  MOVIE_CACHE_PREFIX: "movieCache::",       // Prefix cho movie cache keys  
  MUSIC_CACHE_PREFIX: "musicCache::",       // Prefix cho music cache keys
  ROOT_THUMB_CACHE_PREFIX: "rootThumb::"    // Prefix cho root thumbnail cache
};

/**
 * 🎵 Slider/Carousel Settings
 * 🎯 Mục đích: Cấu hình slider tự động và responsive cho folder carousel
 * 🔗 Ảnh hưởng: UX navigation, auto-scroll behavior, responsive layout
 * 📍 Sử dụng: folderSlider.js, components/folderSlider.js
 */
export const SLIDER = {
  // ⏰ Thời gian auto scroll slider (ms)
  AUTO_SCROLL_INTERVAL: 20000,    // 20 seconds - Từ folderSlider.js, đủ time để user xem
  
  // 📏 Bước scroll khi user click prev/next
  SCROLL_STEP: 5,                 // Scroll step multiplier - Smooth scrolling
  
  // 📱 Breakpoint phát hiện mobile device
  MOBILE_BREAKPOINT: 768,         // 768px - Standard mobile breakpoint
  
  // 📐 Kích thước card trong slider
  CARD_WIDTH: 160,                // Card width in pixels - Tối ưu cho thumbnail
  CARD_GAP: 16                    // Gap between cards - Spacing cho clean layout
};

/**
 * 🎨 UI Settings
 * 🎯 Mục đích: Cấu hình giao diện, text hiển thị và timing cho UX
 * 🔗 Ảnh hưởng: User experience, accessibility, visual feedback
 * 📍 Sử dụng: Pagination components, modals, toast notifications, scroll handlers
 */
export const UI = {
  // 🔤 Button text - Text hiển thị trên các nút pagination
  PREV_PAGE_TEXT: "⬅ Trang trước",    // Text nút previous page
  NEXT_PAGE_TEXT: "Trang sau ➡",      // Text nút next page  
  JUMP_BUTTON_TEXT: "⏩",              // Icon nút jump to page
  JUMP_PLACEHOLDER: "Trang...",        // Placeholder trong input jump
  
  // 📏 Input constraints - Giới hạn input pagination
  JUMP_INPUT_WIDTH: "60px",            // Width của input jump page
  JUMP_INPUT_MIN: 1,                   // Minimum page number allowed
  
  // ⏱️ Timeouts and delays - Timing cho UX feedback
  TOAST_DURATION: 3000,               // 3 seconds - Thời gian hiển thị toast message
  LOADING_DELAY: 500,                 // 0.5 seconds - Delay trước khi hiện loading
  DEBOUNCE_DELAY: 300,                // 0.3 seconds - Debounce cho search input
  
  // 📜 Scroll settings - Cấu hình scroll behavior
  SCROLL_DEBOUNCE: 16,                // ~60fps - Throttle scroll events cho performance
  INTERSECTION_THRESHOLD: 0.1,        // 10% visibility - Trigger khi element 10% visible
  
  // 🪟 Modal settings - Cấu hình modal popup
  MODAL_Z_INDEX: 9999,                // Z-index cao nhất để modal luôn ở trên
  MODAL_BACKDROP_OPACITY: 0.6         // Độ mờ của backdrop (60%)
};

/**
 * 🔍 Search Settings
 * 🎯 Mục đích: Cấu hình tìm kiếm, giới hạn kết quả và performance
 * 🔗 Ảnh hưởng: Search performance, server load, UX responsiveness
 * 📍 Sử dụng: Search components, API calls, dropdown filters
 */
export const SEARCH = {
  // 📏 Độ dài tối thiểu để bắt đầu search
  MIN_SEARCH_LENGTH: 2,           // 2 characters - Tránh search quá nhiều với 1 ký tự
  
  // ⏱️ Debounce delay cho search input
  SEARCH_DEBOUNCE: 300,           // 300ms - Đợi user ngừng gõ trước khi search
  
  // 📊 Số kết quả tối đa hiển thị
  MAX_SEARCH_RESULTS: 50,         // 50 items - Cân bằng giữa đầy đủ vs performance
  
  // 🎲 Giới hạn random items
  RANDOM_ITEMS_LIMIT: 30,         // Từ các API - Random suggestions cho user
  
  // 🔝 Giới hạn top items
  TOP_ITEMS_LIMIT: 30             // Từ các API - Top viewed/favorite items
};

/**
 * 📱 Responsive Settings
 * 🎯 Mục đích: Cấu hình responsive breakpoints và grid layout
 * 🔗 Ảnh hưởng: Layout trên các device, grid columns, mobile UX
 * 📍 Sử dụng: CSS media queries, grid components, responsive utilities
 */
export const RESPONSIVE = {
  // 📱 Breakpoints cho responsive design (pixels)
  MOBILE_BREAKPOINT: 768,         // 768px - Standard mobile breakpoint
  TABLET_BREAKPOINT: 1024,        // 1024px - Tablet portrait/landscape
  DESKTOP_BREAKPOINT: 1200,       // 1200px - Desktop và large screens
  
  // 📐 Grid columns cho từng device type
  MOBILE_COLUMNS: 2,              // 2 columns trên mobile - Đủ rộng cho thumbnail
  TABLET_COLUMNS: 4,              // 4 columns trên tablet - Tận dụng space
  DESKTOP_COLUMNS: 6              // 6 columns trên desktop - Hiển thị nhiều items
};

/**
 * 🎬 Video/Audio Settings
 * 🎯 Mục đích: Cấu hình media player, chất lượng và UX controls
 * 🔗 Ảnh hưởng: Media playback experience, thumbnail quality, performance
 * 📍 Sử dụng: Video player, audio player, thumbnail generators
 */
export const MEDIA = {
  // 🎬 Video player settings - Cấu hình video player controls
  
  // 🔊 Bước điều chỉnh volume khi user click +/-
  VOLUME_STEP: 0.1,               // 10% increment - Smooth volume control
  
  // ⏭️ Bước seek khi user nhấn arrow keys
  SEEK_STEP: 10,                  // 10 seconds - Standard seek increment
  
  // ⚡ Tốc độ phát có sẵn trong player
  PLAYBACK_RATES: [0.5, 0.75, 1, 1.25, 1.5, 2], // Standard playback rates
  
  // 🎵 Audio player settings - Cấu hình audio player
  
  // 🎼 Thời gian crossfade giữa các track
  CROSSFADE_DURATION: 1000,       // 1 second - Smooth transition between tracks
  
  // 📀 Tự động preload track tiếp theo
  PRELOAD_NEXT: true,             // Preload next track for seamless playback
  
  // 🖼️ Thumbnail settings - Cấu hình generation thumbnails
  
  // 📸 Chất lượng JPEG cho thumbnails
  THUMBNAIL_QUALITY: 0.8,         // 80% quality - Cân bằng size vs quality
  
  // 📏 Kích thước tối đa thumbnail
  THUMBNAIL_MAX_WIDTH: 300,       // 300px - Đủ rõ cho preview
  THUMBNAIL_MAX_HEIGHT: 300       // 300px - Square ratio cho consistency
};

/**
 * 🔄 Animation Settings
 * 🎯 Mục đích: Cấu hình animations và transitions cho smooth UX
 * 🔗 Ảnh hưởng: Visual feedback, perceived performance, modern UI feel
 * 📍 Sử dụng: CSS transitions, JavaScript animations, modal transitions
 */
export const ANIMATION = {
  // ⏱️ Animation durations (milliseconds)
  
  // 🌅 Fade in/out animations
  FADE_DURATION: 300,             // 300ms - Standard fade duration, not too slow/fast
  
  // 📄 Slide animations (modals, sidebars)  
  SLIDE_DURATION: 250,            // 250ms - Quick slide for responsive feel
  
  // 🎾 Bounce effects (buttons, notifications)
  BOUNCE_DURATION: 400,           // 400ms - Slightly longer for bounce effect
  
  // 🎨 Easing functions - CSS cubic-bezier curves cho natural motion
  
  // 📈 Ease out - Bắt đầu nhanh, chậm dần (most common)
  EASE_OUT: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  
  // 📉 Ease in - Bắt đầu chậm, nhanh dần
  EASE_IN: "cubic-bezier(0.55, 0.055, 0.675, 0.19)",
  
  // 📊 Ease in-out - Chậm ở đầu và cuối
  EASE_IN_OUT: "cubic-bezier(0.645, 0.045, 0.355, 1.000)"
};

/**
 * 🎯 Default Values
 * 🎯 Mục đích: Giá trị mặc định cho tất cả components và states
 * 🔗 Ảnh hưởng: Initial state, fallback values, reset functionality
 * 📍 Sử dụng: Component initialization, state management, error recovery
 */
export const DEFAULTS = {
  // 📄 Pagination defaults
  PAGE_INDEX: 0,                  // Default page index - Bắt đầu từ trang đầu
  
  // 📁 Folder navigation defaults  
  FOLDER_PATH: "",                // Default folder path - Root folder
  
  // 🔍 Search defaults
  SEARCH_QUERY: "",               // Default search query - Empty search
  
  // 🎵 Audio defaults
  VOLUME: 1.0,                    // Default volume - 100% volume
  PLAYBACK_RATE: 1.0,             // Default playback rate - Normal speed
  
  // 🖼️ Reader defaults
  ZOOM_LEVEL: 1.0,                // Default zoom level - 100% zoom
  
  // 🖼️ Default image sources - Fallback images khi không load được
  DEFAULT_COVER: "/default/default-cover.jpg",           // Default manga cover
  DEFAULT_FOLDER_THUMB: "/default/folder-thumb.png",     // Default folder thumbnail  
  DEFAULT_MUSIC_THUMB: "/default/music-thumb.png",       // Default music thumbnail
  DEFAULT_VIDEO_THUMB: "/default/video-thumb.png",       // Default video thumbnail
  DEFAULT_FAVICON: "/default/favicon.png"                // Default favicon
};

/**
 * 📋 Storage Keys
 * 🎯 Mục đích: Quản lý localStorage/sessionStorage keys, tránh conflict
 * 🔗 Ảnh hưởng: Data persistence, user settings, security tokens
 * 📍 Sử dụng: storage.js, security.js, user preference components
 */
export const STORAGE_KEYS = {
  // 👁️ Recent viewed - Lưu lịch sử xem gần đây
  RECENT_VIEWED: "recentViewed",           // Manga recently viewed
  RECENT_VIEWED_VIDEO: "recentViewedVideo", // Videos recently watched  
  RECENT_VIEWED_MUSIC: "recentViewedMusic", // Music recently played
  
  // ⚙️ Settings - Cài đặt user preferences
  DARK_MODE: "darkMode",                   // Dark/light mode preference
  READER_MODE: "readerMode",               // Reader mode (scroll/horizontal)
  VOLUME_LEVEL: "volumeLevel",             // Saved volume level
  PLAYBACK_RATE: "playbackRate",           // Saved playback speed
  
  // 🔐 Security - Authentication và encryption keys
  AUTH_TOKEN: "authToken",                 // JWT/session token
  SECURE_KEYS: "secureKeys",               // Encryption keys for sensitive data
  
  // 🎨 UI State - Trạng thái giao diện
  SIDEBAR_COLLAPSED: "sidebarCollapsed",   // Sidebar expand/collapse state
  GRID_VIEW: "gridView",                   // Grid/list view preference
  SORT_ORDER: "sortOrder"                  // Default sort order (name/date/size)
};

/**
 * 🎨 CSS Classes
 * 🎯 Mục đích: Centralized CSS class names, tránh typo và inconsistency
 * 🔗 Ảnh hưởng: Styling consistency, maintainability, theme switching
 * 📍 Sử dụng: Tất cả components, dynamic class assignment, theme system
 */
export const CSS_CLASSES = {
  // 🔄 Common state classes - Trạng thái chung cho elements
  HIDDEN: "hidden",                        // Ẩn element (display: none)
  LOADING: "loading",                      // Loading state với spinner
  ACTIVE: "active",                        // Active/selected state  
  DISABLED: "disabled",                    // Disabled state cho buttons/inputs
  
  // 📐 Layout classes - Layout và structure
  GRID: "grid",                           // Grid container class
  FOLDER_SECTION: "folder-section",        // Folder section wrapper
  FOLDER_SECTION_HEADER: "folder-section-header", // Section header
  FOLDER_SECTION_TITLE: "folder-section-title",   // Section title
  
  // 🎴 Components - Component-specific classes
  FOLDER_CARD: "folder-card",             // Folder card component
  MOVIE_CARD: "movie-card",               // Movie card component  
  MUSIC_CARD: "music-card",               // Music card component
  
  // 📖 Reader - Reader mode specific classes
  READER_CONTROLS: "reader-controls",      // Reader control panel
  SCROLL_MODE: "scroll-mode",             // Scroll reading mode
  HORIZONTAL_MODE: "horizontal-mode",      // Horizontal reading mode
  
  // 📄 Pagination - Pagination component classes
  PAGINATION_INFO: "pagination-info",      // Page info display
  PAGINATION_CONTROLS: "pagination-controls" // Pagination buttons container
};

/**
 * 📡 API Settings
 * 🎯 Mục đích: Cấu hình API calls, endpoints và error handling
 * 🔗 Ảnh hưởng: Network requests, error handling, performance, caching
 * 📍 Sử dụng: Tất cả API calls, fetch wrappers, error boundaries
 */
export const API = {
  // 🛣️ Endpoints - API route definitions
  ENDPOINTS: {
    MANGA: "/api/manga",        // Manga API endpoints (/api/manga/*)
    MOVIE: "/api/movie",        // Movie API endpoints (/api/movie/*)
    MUSIC: "/api/music",        // Music API endpoints (/api/music/*)  
    SYSTEM: "/api"              // System API endpoints (/api/*)
  },
  
  // ⏱️ Request settings - Timing và retry logic
  
  // 🕐 Request timeout (ms)
  TIMEOUT: 30000,                 // 30 seconds - Đủ cho large file operations
  
  // 🔄 Retry logic cho failed requests
  RETRY_ATTEMPTS: 3,              // 3 attempts total - Cân bằng reliability vs speed
  RETRY_DELAY: 1000,              // 1 second delay between retries
  
  // 💾 Cache settings cho API responses
  CACHE_DURATION: 5 * 60 * 1000   // 5 minutes - Fresh data vs performance
};

/**
 * 🎪 Environment Settings
 * 🎯 Mục đích: Feature flags và environment-specific configurations
 * 🔗 Ảnh hưởng: Feature availability, debugging, performance monitoring
 * 📍 Sử dụng: Feature toggles, debugging tools, conditional rendering
 */
export const ENV = {
  // 🚩 Feature flags - Bật/tắt features cho testing/deployment
  
  // 🌙 Dark mode feature toggle
  ENABLE_DARK_MODE: true,         // Enable dark/light mode switching
  
  // 💾 Cache system toggle  
  ENABLE_CACHE: true,             // Enable localStorage/cache system
  
  // 🔍 Search functionality toggle
  ENABLE_SEARCH: true,            // Enable search across all modules
  
  // 💖 Favorites system toggle
  ENABLE_FAVORITES: true,         // Enable favorites/bookmarks feature
  
  // 🐛 Debug settings - Development và troubleshooting
  
  // 🔧 Debug mode cho detailed logging
  DEBUG_MODE: false,              // Enable debug mode (production: false)
  
  // 📝 Console logging toggle
  CONSOLE_LOGS: true,             // Enable console.log output
  
  // 📊 Performance monitoring toggle  
  PERFORMANCE_MONITORING: false   // Enable performance tracking (heavy)
};
