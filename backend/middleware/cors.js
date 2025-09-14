// 📁 backend/middleware/cors.js
// 🌐 CORS Middleware Configuration

const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { 
  generateDevOrigins, 
  generateTailscaleOrigins, 
  parseCompactCorsConfig 
} = require("../utils/corsUtils");

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

// 🔧 Smart CORS origins generation
let DEV_ORIGINS = [];
let TAILSCALE_ORIGINS = [];

// Generate development origins
if (parsedEnv.CORS_DEV_CONFIG) {
  DEV_ORIGINS = parseCompactCorsConfig(parsedEnv.CORS_DEV_CONFIG);
} else {
  // Default development origins
  DEV_ORIGINS = generateDevOrigins();
}

// Generate Tailscale origins #tự generate Tailscale origins
if (parsedEnv.TAILSCALE_DEVICE && parsedEnv.TAILSCALE_TAILNET) {
  const ports = parsedEnv.TAILSCALE_PORTS ? parsedEnv.TAILSCALE_PORTS.split(',').map(p => p.trim()) : [3000, 3001];
  const includeHttps = parsedEnv.TAILSCALE_PROTOCOLS ? parsedEnv.TAILSCALE_PROTOCOLS.includes('https') : true;
  
  TAILSCALE_ORIGINS = generateTailscaleOrigins(
    parsedEnv.TAILSCALE_DEVICE,
    parsedEnv.TAILSCALE_TAILNET,
    ports,
    includeHttps
  );
}

// Combine all origins
const EXTRA_ORIGINS = [...DEV_ORIGINS, ...TAILSCALE_ORIGINS];

// Combine origins based on environment
const ALLOWED_ORIGINS = IS_DEV 
  ? [...new Set([...EXTRA_ORIGINS])]  // Dev: only configured origins
  : EXTRA_ORIGINS;  // Production: only extra (same-origin automatically allowed)

// Log CORS configuration
console.log('🌐 CORS Configuration:');
console.log(`   - Environment: ${IS_DEV ? 'development' : 'production'}`);
console.log(`   - Dev origins: ${DEV_ORIGINS.join(', ') || 'none'}`);
console.log(`   - Tailscale origins: ${TAILSCALE_ORIGINS.join(', ') || 'none'}`);
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
