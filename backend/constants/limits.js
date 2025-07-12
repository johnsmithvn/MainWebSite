// 📁 backend/constants/limits.js
// 📊 Backend-only Limits & Size Constants (CommonJS)

const LIMITS = {
  // Database limits
  BATCH_SIZE: 100,                    // Database batch processing size
  MAX_RESULTS: 1000,                  // Maximum query results
  MAX_CONNECTIONS: 10,                // Database connection pool size
  
  // File system limits (server-side)
  MAX_FILE_SIZE: 500 * 1024 * 1024,   // 500MB
  MAX_PATH_LENGTH: 1000,              // Maximum path length
  MAX_FILENAME_LENGTH: 255,           // Maximum filename length
  
  // Server cache limits
  MAX_FOLDER_CACHE_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_MOVIE_CACHE_SIZE: 200 * 1024 * 1024,  // 200MB
  MAX_MUSIC_CACHE_SIZE: 150 * 1024 * 1024,  // 150MB
  CACHE_CLEANUP_THRESHOLD: 50 * 1024 * 1024, // 50MB
  
  // API limits
  API_SEARCH_LIMIT: 50,               // Default API search results per page
  MAX_API_RESULTS: 10000,             // Maximum API results
  
  // Processing limits (server-side)
  MAX_CONCURRENT_SCANS: 3,            // Maximum concurrent folder scans
  MAX_THUMBNAIL_GENERATION: 5,        // Maximum concurrent thumbnail generation
  
  // Memory limits (server-side)
  MAX_MEMORY_USAGE: 512 * 1024 * 1024, // 512MB
  
  // Network limits (server-side)
  MAX_REQUEST_SIZE: 50 * 1024 * 1024,  // 50MB
  MAX_UPLOAD_SIZE: 100 * 1024 * 1024,  // 100MB
  
  // Database query limits
  MAX_QUERY_COMPLEXITY: 100,          // Maximum query complexity
  MAX_JOIN_TABLES: 5,                 // Maximum tables in JOIN
};

module.exports = LIMITS;
