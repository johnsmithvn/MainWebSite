// 📁 frontend/constants/timing.js
// ⏰ Frontend Timing Constants (ES Modules)

export const TIMING = {
  // UI animations
  ANIMATION_DURATION: 300,         // 0.3 giây
  FAST_ANIMATION: 150,             // 0.15 giây
  SLOW_ANIMATION: 500,             // 0.5 giây
  
  // Auto-scroll và slideshow
  AUTO_SCROLL_INTERVAL: 20000,     // 20 giây
  SLIDESHOW_INTERVAL: 5000,        // 5 giây
  
  // Toast và notifications
  TOAST_TIMEOUT: 3000,             // 3 giây
  UI_INDICATOR_TIMEOUT: 5000,      // 5 giây
  SUCCESS_MESSAGE_TIMEOUT: 2000,   // 2 giây
  ERROR_MESSAGE_TIMEOUT: 5000,     // 5 giây
  
  // User interactions
  DEBOUNCE_DELAY: 300,             // 0.3 giây
  SEARCH_DELAY: 500,               // 0.5 giây
  HOVER_DELAY: 100,                // 0.1 giây
  CLICK_TIMER_DELAY: 300,          // 0.3 giây
  DOUBLE_CLICK_DELAY: 250,         // 0.25 giây
  
  // Loading states
  LOADING_SPINNER_DELAY: 200,      // 0.2 giây
  MINIMUM_LOADING_TIME: 500,       // 0.5 giây
  
  // Scroll và zoom
  SMOOTH_SCROLL_DELAY: 0,          // Instant
  PINCH_ZOOM_DELAY: 100,           // 0.1 giây
  SCROLL_DEBOUNCE: 50,             // 0.05 giây
  
  // Cache và refresh
  CACHE_REFRESH_INTERVAL: 30000,   // 30 giây
  AUTO_REFRESH_INTERVAL: 60000,    // 1 phút
  
  // Test timing
  TEST_CACHE_TTL: 1000,            // 1 giây
  TEST_TIMEOUT: 1100,              // 1.1 giây
};

export default TIMING;
