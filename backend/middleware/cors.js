// 📁 backend/middleware/cors.js
// 🌐 CORS Middleware Configuration

const cors = require("cors");
const path = require("path");
const fs = require("fs");

// Load environment variables
const envPath = path.join(__dirname, "../.env");
let parsedEnv = {};
try {
  parsedEnv = require("dotenv").parse(fs.readFileSync(envPath, "utf-8"));
} catch (error) {
  console.warn('⚠️  Could not load .env file, using defaults');
}

// Environment detection
const IS_DEV = process.env.NODE_ENV !== 'production';

// Default development origins (always included in dev)
const DEFAULT_DEV_ORIGINS = [
  'http://localhost:3001',      // React dev server
  'http://127.0.0.1:3001',      // React dev server (IP)
];

// Extra origins from environment (for Tailscale, production, etc.)
const EXTRA_ORIGINS = (parsedEnv.CORS_EXTRA_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Combine origins based on environment
const ALLOWED_ORIGINS = IS_DEV 
  ? [...new Set([...DEFAULT_DEV_ORIGINS, ...EXTRA_ORIGINS])]  // Dev: localhost + extra
  : EXTRA_ORIGINS;  // Production: only extra (same-origin automatically allowed)

// Log CORS configuration
console.log('🌐 CORS Configuration:');
console.log(`   - Environment: ${IS_DEV ? 'development' : 'production'}`);
console.log(`   - Default dev origins: ${DEFAULT_DEV_ORIGINS.join(', ')}`);
console.log(`   - Extra origins: ${EXTRA_ORIGINS.join(', ') || 'none'}`);
console.log(`   - Total allowed: ${ALLOWED_ORIGINS.length} origins`);

/**
 * 🌐 CORS Middleware - Smart handling for dev/prod
 * Development: Allow localhost + extra origins
 * Production: Allow same-origin + extra origins only
 */
const corsMiddleware = cors({
  origin: (origin, callback) => {
    // No origin = same-origin requests (browser navigation, same-domain fetch)
    if (!origin) {
      console.log('🔧 Same-origin request - allowing');
      return callback(null, true);
    }

    // Development mode: more permissive
    if (IS_DEV) {
      // Allow configured origins
      if (ALLOWED_ORIGINS.includes(origin)) {
        console.log(`✅ Dev - Allowed origin: ${origin}`);
        return callback(null, true);
      }
      
      // Dev fallback: allow any Tailscale domain
      try {
        const u = new URL(origin);
        if (u.hostname.endsWith('.ts.net')) {
          console.log(`🔗 Dev - Tailscale domain allowed: ${origin}`);
          return callback(null, true);
        }
      } catch (_) {
        console.warn(`⚠️  Dev - Invalid origin URL: ${origin}`);
      }
      
      console.warn(`🚫 Dev - Blocked origin: ${origin}`);
      return callback(new Error(`CORS blocked in development: ${origin}`));
    }

    // Production mode: strict whitelist
    if (ALLOWED_ORIGINS.includes(origin)) {
      console.log(`✅ Prod - Allowed origin: ${origin}`);
      return callback(null, true);
    }

    // Production fallback: allow Tailscale domains (for remote access)
    try {
      const u = new URL(origin);
      if (u.hostname.endsWith('.ts.net')) {
        console.log(`🔗 Prod - Tailscale domain allowed: ${origin}`);
        return callback(null, true);
      }
    } catch (_) {
      console.warn(`⚠️  Prod - Invalid origin URL: ${origin}`);
    }

    console.warn(`🚫 Prod - Blocked origin: ${origin}`);
    return callback(new Error(`CORS blocked in production: ${origin}`));
  },
  
  credentials: true,  // Allow cookies and auth headers
  
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  
  allowedHeaders: [
    'Content-Type',
    'Authorization', 
    'X-Requested-With',
    'x-secure-token',
    'Accept',
    'Origin',
  ],
  
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining', 
    'X-RateLimit-Reset',
    'Content-Length',
    'Content-Range',
  ],
  
  // Preflight cache duration (24 hours in production, shorter in dev)
  maxAge: IS_DEV ? 300 : 86400,
});

module.exports = corsMiddleware;
