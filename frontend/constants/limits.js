// 📁 frontend/constants/limits.js
// 📊 Frontend-only Limits & Size Constants (ES Modules)

export const LIMITS = {
  // UI & Display limits
  IMAGES_PER_PAGE: 400,            // Số ảnh mỗi trang trong manga reader
  FOLDERS_PER_PAGE: 24,            // Số folder mỗi trang
  SEARCH_LIMIT: 50,                // Số kết quả search mỗi lần (client-side)
  MAX_RECENT_ITEMS: 50,            // Số item recent tối đa
  
  // Reader constraints
  READER_MAX_WIDTH: 400,           // Chiều rộng reader tối đa (px)
  READER_MIN_WIDTH: 200,           // Chiều rộng reader tối thiểu (px)
  
  // Responsive breakpoints
  MOBILE_BREAKPOINT: 480,          // Mobile breakpoint width (px)
  TABLET_BREAKPOINT: 768,          // Tablet breakpoint width (px)
  DESKTOP_BREAKPOINT: 1024,        // Desktop breakpoint width (px)
  WIDE_BREAKPOINT: 1440,           // Wide screen breakpoint (px)
  
  // Client-side cache limits
  MAX_CACHE_SIZE: 50 * 1024 * 1024,     // 50MB (client-side)
  MAX_CACHE_ITEMS: 1000,                 // Max cached items (client-side)
  CACHE_CLEANUP_THRESHOLD: 40 * 1024 * 1024, // 40MB (client-side)
  
  // Client-side file size limits
  MAX_THUMBNAIL_SIZE: 5 * 1024 * 1024,   // 5MB (client-side)
  MAX_IMAGE_SIZE: 20 * 1024 * 1024,      // 20MB (client-side)
  
  // UI component limits
  PLAYLIST_MOBILE_WIDTH: 400,      // px
  PLAYLIST_DESKTOP_WIDTH: 340,     // px
  MAX_PLAYLIST_ITEMS: 1000,        // Max items in playlist
  
  // Grid & layout
  MOBILE_COLS: 2,                  // Mobile grid columns
  TABLET_COLS: 3,                  // Tablet grid columns
  DESKTOP_COLS: 4,                 // Desktop grid columns
  WIDE_COLS: 6,                    // Wide screen grid columns
  
  // Thumbnail sizes
  THUMBNAIL_SIZE: 480,             // px (width)
  SMALL_THUMBNAIL: 240,            // px (width)
  LARGE_THUMBNAIL: 720,            // px (width)
  
  // Text limits (display only)
  MAX_TITLE_LENGTH: 100,           // Max title length display
  MAX_DESCRIPTION_LENGTH: 200,     // Max description length
  
  // Performance limits (client-side)
  MAX_VISIBLE_ITEMS: 200,          // Max items to render at once
  VIRTUAL_SCROLL_BUFFER: 10,       // Virtual scroll buffer size
  
  // Search limits (client-side)
  MIN_SEARCH_LENGTH: 1,            // Minimum search query length
  MAX_SEARCH_RESULTS: 1000,        // Maximum search results (client-side)
  SEARCH_DEBOUNCE_MIN: 100,        // Minimum debounce time
  SEARCH_DEBOUNCE_MAX: 1000,       // Maximum debounce time
};

export default LIMITS;
