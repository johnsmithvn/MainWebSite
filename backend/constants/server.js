// 📁 backend/constants/server.js
// 🌐 Backend Server Constants (CommonJS)

const SERVER = {
  // HTTP Status Codes
  HTTP_STATUS: {
    OK: 200,                    // Success
    CREATED: 201,               // Created successfully
    NO_CONTENT: 204,            // No content to return
    BAD_REQUEST: 400,           // Bad request from client
    UNAUTHORIZED: 401,          // Authentication required
    FORBIDDEN: 403,             // Access denied
    NOT_FOUND: 404,             // Resource not found
    METHOD_NOT_ALLOWED: 405,    // HTTP method not allowed
    CONFLICT: 409,              // Conflict with current state
    INTERNAL_SERVER_ERROR: 500, // Server error
    BAD_GATEWAY: 502,           // Bad gateway
    SERVICE_UNAVAILABLE: 503,   // Service unavailable
  },
  
  // Security settings
  SECURITY: {
    ALLOWED_HOSTS: ['localhost', '127.0.0.1'],  // Hosts được phép truy cập
    CORS_ORIGINS: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    RATE_LIMIT_MAX: 100,                         // Max requests per window
    MAX_LOGIN_ATTEMPTS: 5,                       // Max login attempts
    LOCKOUT_DURATION: 15 * 60 * 1000,          // 15 phút lockout
  },
  
  // Request timeouts
  TIMEOUTS: {
    REQUEST: 30000,       // 30 seconds - General request timeout
    UPLOAD: 300000,       // 5 minutes - File upload timeout
    DATABASE: 10000,      // 10 seconds - Database query timeout
    SCAN: 600000,         // 10 minutes - Folder scan timeout
  },
  
  // Content types
  CONTENT_TYPES: {
    JSON: 'application/json',
    HTML: 'text/html',
    CSS: 'text/css',
    JS: 'application/javascript',
    PNG: 'image/png',
    JPG: 'image/jpeg',
    WEBP: 'image/webp',
    MP4: 'video/mp4',
    MP3: 'audio/mpeg',
  },
  
  // Default headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
  },
};

module.exports = SERVER;
