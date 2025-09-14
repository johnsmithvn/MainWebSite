// 📁 backend/server-https.js
// Temporary server with HTTPS support for testing

const express = require("express");
const https = require("https");
const http = require("http");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const {
  getAllMangaKeys,
  getAllMovieKeys,
  getAllMusicKeys,
  getRootPath,
  ROOT_PATHS,
} = require("./utils/config");

const { setupMiddleware, setupErrorHandling } = require("./middleware");

const app = express();
const PORT = process.env.PORT || 3000;
const IS_DEV = process.env.NODE_ENV !== 'production';
const ENABLE_HTTPS = process.env.ENABLE_HTTPS === 'true';

// Constants
const ONE_HOUR = 60 * 60;
const ONE_DAY = 24 * ONE_HOUR;

// ✅ Setup all middleware (CORS, compression, auth, security, etc.)
setupMiddleware(app);

// Security headers for production
if (!IS_DEV) {
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });
}

// ✅ API Routes - Centralized routing
app.use("/api", require("./routes"));

// ✅ Cache constants and helpers
const isImg = /\.(avif|jpe?g|png|gif|webp|bmp)$/i;
const isAudio = /\.(mp3|m4a|aac|ogg|flac|wav)$/i;
const isVideo = /\.(mp4|m4v|webm|mov|mkv|ts|m3u8)$/i;

// Nếu bạn ĐÃ hash tên file ảnh manga, bật immutable + TTL dài
const MANGA_IMAGES_IMMUTABLE = true; // Nếu build có hash (Vite/Webpack/Next…): = True

function setStaticHeaders(kind) {
  return (res, path) => {
    if (isImg.test(path)) {
      res.setHeader('Content-Type', 'image/' + path.split('.').pop());
      
      if (MANGA_IMAGES_IMMUTABLE && kind === 'manga') {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        res.setHeader('Cache-Control', IS_DEV ? 'no-cache' : 'public, max-age=86400');
      }
    } else if (isAudio.test(path)) {
      res.setHeader('Content-Type', 'audio/' + path.split('.').pop().replace('mp3', 'mpeg'));
      res.setHeader('Cache-Control', IS_DEV ? 'no-cache' : 'public, max-age=3600');
      res.setHeader('Accept-Ranges', 'bytes');
    } else if (isVideo.test(path)) {
      res.setHeader('Content-Type', 'video/' + path.split('.').pop());
      res.setHeader('Cache-Control', IS_DEV ? 'no-cache' : 'public, max-age=3600');
      res.setHeader('Accept-Ranges', 'bytes');
    }
  };
}

// ✅ Static files với cache headers tối ưu và consistent
for (const [key, absPath] of Object.entries(ROOT_PATHS)) {
  if (key.startsWith("V_")) {
    // Video files
    app.use(`/video/${key}`, express.static(absPath, {
      maxAge: IS_DEV ? 0 : ONE_HOUR * 1000,
      etag: !IS_DEV,
      setHeaders: setStaticHeaders('video')
    }));
  } else if (key.startsWith("M_")) {
    // Audio files
    app.use(`/audio/${key}`, express.static(absPath, {
      maxAge: IS_DEV ? 0 : ONE_HOUR * 1000,
      etag: !IS_DEV,
      setHeaders: setStaticHeaders('audio')
    }));
  } else {
    // Manga images
    app.use(`/manga/${key}`, express.static(absPath, {
      maxAge: IS_DEV ? 0 : (MANGA_IMAGES_IMMUTABLE ? ONE_DAY * 365 : ONE_DAY) * 1000,
      etag: !IS_DEV,
      immutable: MANGA_IMAGES_IMMUTABLE && !IS_DEV,
      setHeaders: setStaticHeaders('manga')
    }));
  }
}

app.use(express.static(path.join(__dirname, "../frontend/public")));
app.use("/dist", express.static(path.join(__dirname, "../frontend/public/dist")));

// ✅ Default assets
app.use("/default", express.static(path.join(__dirname, "../frontend/public/default"), {
  maxAge: IS_DEV ? 0 : ONE_DAY * 7 * 1000,
  etag: !IS_DEV,
  setHeaders: setStaticHeaders('image')
}));

// ✅ NEW: Production React App Serving
const REACT_BUILD_PATH = path.join(__dirname, '../react-app/dist');

if (fs.existsSync(REACT_BUILD_PATH)) {
  console.log('✅ React build found, serving production app');
  
  // Serve React build with proper cache headers
  app.use(express.static(REACT_BUILD_PATH, {
    maxAge: IS_DEV ? 0 : ONE_DAY * 1000, // 1 day for build assets
    etag: !IS_DEV,
    setHeaders: (res, filePath) => {
      // Long cache for hashed assets (JS, CSS with hash)
      if (/\.(js|css)$/.test(filePath) && /\.[a-f0-9]{8,}\./i.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
      // Short cache for HTML files (để update nhanh)
      else if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
      }
    }
  }));
} else {
  console.log('⚠️  React build not found. Run "npm run build" in react-app directory.');
  console.log('    Falling back to legacy frontend serving...');
}

app.get("/", (req, res) => {
  const reactIndexPath = path.join(REACT_BUILD_PATH, 'index.html');
  
  if (fs.existsSync(reactIndexPath)) {
    res.sendFile(reactIndexPath);
  } else {
    // Fallback to legacy home
    res.sendFile(path.join(__dirname, "../frontend/public/home.html"));
  }
});

// Legacy: Serve React build at /app for compatibility
app.use("/app", express.static(path.join(__dirname, "../react-app/dist")));
app.get(/^\/app\/.*$/, (_req, res) => {
  const reactIndexPath = path.join(__dirname, "../react-app/dist/index.html");
  if (fs.existsSync(reactIndexPath)) {
    res.sendFile(reactIndexPath);
  } else {
    res.status(404).send("React app not built");
  }
});

// ✅ URL decode middleware - giữ nguyên logic cũ
app.use("/manga", (req, res, next) => {
  req.url = decodeURIComponent(req.url);
  next();
});

// ✅ URL decode middleware cho video (movie)
app.use("/video", (req, res, next) => {
  req.url = decodeURIComponent(req.url);
  next();
});

// ✅ URL decode middleware cho audio (music)
app.use("/audio", (req, res, next) => {
  req.url = decodeURIComponent(req.url);
  next();
});

// ✅ List roots API - giữ nguyên logic cũ
app.get("/api/list-roots", (req, res) => {
  const mangaKeys = getAllMangaKeys();
  const movieKeys = getAllMovieKeys();
  const musicKeys = getAllMusicKeys();

  res.json({
    manga: mangaKeys,
    movie: movieKeys,
    music: musicKeys,
    roots: ROOT_PATHS
  });
});

// ✅ SPA fallback - Production React serving with fallback to legacy
app.use((req, res, next) => {
  // Skip API routes and static files
  if (req.path.startsWith('/api/') || 
      req.path.startsWith('/manga/') ||
      req.path.startsWith('/video/') ||
      req.path.startsWith('/audio/') ||
      req.path.startsWith('/default/')) {
    return next();
  }
  
  // For HTML requests to non-API routes, serve React SPA
  const accept = req.headers.accept || '';
  if (req.method === 'GET' && accept.includes('text/html')) {
    const reactIndexPath = path.join(REACT_BUILD_PATH, 'index.html');
    
    if (fs.existsSync(reactIndexPath)) {
      return res.sendFile(reactIndexPath);
    }
  }
  
  next();
});

// ✅ Setup error handling (must be after all routes)
setupErrorHandling(app);

// ✅ SSL Certificate loading function
function loadSSLCertificates() {
  const sslDir = path.join(__dirname, '../ssl');
  const keyPath = path.join(sslDir, 'private-key.pem');
  const certPath = path.join(sslDir, 'certificate.pem');
  
  try {
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      return {
        key: fs.readFileSync(keyPath, 'utf8'),
        cert: fs.readFileSync(certPath, 'utf8')
      };
    }
  } catch (error) {
    console.error('❌ Error loading SSL certificates:', error.message);
  }
  
  return null;
}

// ✅ Start server with HTTPS support
if (ENABLE_HTTPS) {
  const sslOptions = loadSSLCertificates();
  
  if (sslOptions) {
    console.log('🔐 Starting HTTPS server with SSL certificates...');
    const httpsServer = https.createServer(sslOptions, app);
    
    httpsServer.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚀 MainWebSite HTTPS Server running!`);
      console.log(`   Local:     https://localhost:${PORT}`);
      console.log(`   Tailscale: https://desktop-v88j9e0.tail2b3d3b.ts.net:${PORT}`);
      console.log(`   Mode:      ${IS_DEV ? 'development' : 'production'}\n`);
      console.log(`🔐 SSL Certificate loaded successfully!`);
      console.log(`⚠️  Browser will show security warning for self-signed cert`);
      console.log(`   Click "Advanced" -> "Proceed to site" to continue\n`);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('\n📴 SIGTERM received, shutting down gracefully...');
      httpsServer.close(() => {
        console.log('✅ Server closed successfully');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('\n📴 SIGINT received, shutting down gracefully...');
      httpsServer.close(() => {
        console.log('✅ Server closed successfully');
        process.exit(0);
      });
    });
    
  } else {
    console.log('⚠️  SSL certificates not found. Starting HTTP server...');
    console.log('   Run "node ssl/generate-cert.js" to generate certificates.');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  }
} else {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = app;
