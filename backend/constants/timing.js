// 📁 backend/constants/timing.js
// ⏰ Backend Timing Constants (CommonJS)

const TIMING = {
  // Database & Cache
  CACHE_CLEANUP_INTERVAL: 7 * 24 * 60 * 60 * 1000, // 7 ngày
  DB_QUERY_TIMEOUT: 30000,        // 30 giây
  DB_CONNECTION_TIMEOUT: 10000,   // 10 giây
  
  // Token & Session
  TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 giờ
  SESSION_TIMEOUT: 30 * 60 * 1000,    // 30 phút
  
  // Request timeouts
  REQUEST_TIMEOUT: 30000,         // 30 giây
  UPLOAD_TIMEOUT: 300000,         // 5 phút
  SCAN_TIMEOUT: 600000,           // 10 phút
  
  // Retry intervals
  RETRY_DELAY: 1000,              // 1 giây
  RETRY_MAX_DELAY: 10000,         // 10 giây
  
  // Rate limiting
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 phút
  
  // Test timing
  TEST_CACHE_TTL: 1000,           // 1 giây
  TEST_TIMEOUT: 1100,             // 1.1 giây
};

module.exports = TIMING;
