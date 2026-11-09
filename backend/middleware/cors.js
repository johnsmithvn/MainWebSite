// 📁 backend/middleware/cors.js
// 🌐 CORS Middleware Configuration

const cors = require("cors");
const net = require("net");
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

// Domain Tailscale của chính máy này (mọi port). Không mở cho mọi *.ts.net vì trang của
// người khác (Tailscale Funnel) cũng là *.ts.net và đọc được API qua trình duyệt (ISSUES S8)
const OWN_TAILSCALE_HOST =
  parsedEnv.TAILSCALE_DEVICE && parsedEnv.TAILSCALE_TAILNET
    ? `${parsedEnv.TAILSCALE_DEVICE}.${parsedEnv.TAILSCALE_TAILNET}.ts.net`.toLowerCase()
    : null;

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
 * 🔢 Hostname của origin dưới dạng IP (bỏ ngoặc vuông của IPv6), hoặc null nếu là domain
 */
function originIp(u) {
  const host = u.hostname.replace(/^\[|\]$/g, "");
  return net.isIP(host) ? host : null;
}

/**
 * 🏠 IP thuộc mạng nội bộ: loopback, LAN (RFC 1918), link-local, Tailscale (100.64.0.0/10, fd7a::/16…)
 */
function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 10 ||
      a === 127 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254) ||
      (a === 100 && b >= 64 && b <= 127)
    );
  }
  const lower = ip.toLowerCase();
  return lower === "::1" || /^f[cd]/.test(lower) || /^fe[89ab]/.test(lower);
}

/**
 * 🌐 Kiểm tra origin cho từng request (cần req để so với header Host)
 * Development: Allow localhost + extra origins + IP nội bộ
 * Production: Allow same-origin + extra origins only
 */
function checkOrigin(origin, req, callback) {
  // No origin = same-origin GET/HEAD (browser navigation, same-domain fetch)
  if (!origin) {
    return callback(null, true);
  }

  let u = null;
  try {
    u = new URL(origin);
  } catch (_) {
    console.warn(`⚠️  Invalid origin URL: ${origin}`);
  }
  const ip = u && originIp(u);

  // 🏠 Mở app trực tiếp bằng IP (VD http://192.168.1.10:3000): trình duyệt vẫn gửi Origin
  // với POST/PUT/DELETE dù cùng origin → cho qua khi Origin trùng Host.
  // Chỉ áp dụng cho IP, không cho domain lạ (tránh DNS rebinding).
  if (ip && u.host === req.headers.host) {
    return callback(null, true);
  }

  // Development mode: more permissive
  if (IS_DEV) {
    // Vite dev server (:3001) proxy đổi Host thành localhost:3000 → cho qua mọi origin là IP nội bộ
    if (ip && isPrivateIp(ip)) {
      console.log(`🏠 Dev - Private IP origin allowed: ${origin}`);
      return callback(null, true);
    }

    // Allow configured origins
    if (ALLOWED_ORIGINS.includes(origin)) {
      console.log(`✅ Dev - Allowed origin: ${origin}`);
      return callback(null, true);
    }

    // Domain Tailscale của máy này, port bất kỳ
    if (u && OWN_TAILSCALE_HOST && u.hostname.toLowerCase() === OWN_TAILSCALE_HOST) {
      console.log(`🔗 Dev - Tailscale domain allowed: ${origin}`);
      return callback(null, true);
    }

    console.warn(`🚫 Dev - Blocked origin: ${origin}`);
    return callback(new Error(`CORS blocked in development: ${origin}`));
  }

  // Production mode: strict whitelist
  if (ALLOWED_ORIGINS.includes(origin)) {
    console.log(`✅ Prod - Allowed origin: ${origin}`);
    return callback(null, true);
  }

  // Domain Tailscale của máy này, port bất kỳ (remote access)
  if (u && OWN_TAILSCALE_HOST && u.hostname.toLowerCase() === OWN_TAILSCALE_HOST) {
    console.log(`🔗 Prod - Tailscale domain allowed: ${origin}`);
    return callback(null, true);
  }

  console.warn(`🚫 Prod - Blocked origin: ${origin}`);
  return callback(new Error(`CORS blocked in production: ${origin}`));
}

const corsOptions = {
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
};

// Options theo từng request để checkOrigin đọc được header Host
const corsMiddleware = cors((req, callback) => {
  callback(null, {
    ...corsOptions,
    origin: (origin, done) => checkOrigin(origin, req, done),
  });
});

module.exports = corsMiddleware;
