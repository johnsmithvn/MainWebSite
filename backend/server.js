// 📁 backend/server.js

const express = require("express");
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
      if (kind === 'manga' && MANGA_IMAGES_IMMUTABLE) {
        res.setHeader('Cache-Control', `public, max-age=${ONE_DAY}, immutable`);
      } else {
        res.setHeader('Cache-Control', `public, max-age=${ONE_HOUR}, must-revalidate`);
      }
    } else if (isVideo.test(path) || isAudio.test(path)) {
      // Media thường ổn với TTL ngắn + SWR
      res.setHeader('Cache-Control', `public, max-age=${ONE_HOUR}, stale-while-revalidate=60`);
    }
  };
}

// ✅ Static files với cache headers tối ưu và consistent
for (const [key, absPath] of Object.entries(ROOT_PATHS)) {
  if (key.startsWith("V_")) {
    app.use("/video", express.static(absPath, {
      dotfiles: "allow", // Giữ theo yêu cầu
      maxAge: ONE_HOUR * 1000,
      etag: true,
      lastModified: true,
      setHeaders: setStaticHeaders('video')
    }));
  } else if (key.startsWith("M_")) {
    app.use("/audio", express.static(absPath, {
      dotfiles: "allow", // Giữ theo yêu cầu
      maxAge: ONE_HOUR * 1000,
      etag: true,
      lastModified: true,
      setHeaders: setStaticHeaders('audio')
    }));
  } else {
    app.use("/manga", express.static(absPath, {
      dotfiles: "allow", // Giữ theo yêu cầu
      maxAge: ONE_HOUR * 1000,
      etag: true,
      lastModified: true,
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
  console.log('📦 React build path:', REACT_BUILD_PATH);
  
  // Serve React build static assets
  app.use(express.static(REACT_BUILD_PATH, {
    maxAge: IS_DEV ? 0 : ONE_DAY * 30 * 1000,
    etag: !IS_DEV,
    index: false
  }));
} else {
  console.log('❌ React build not found at:', REACT_BUILD_PATH);
  
  if (IS_DEV) {
    console.log('🔧 Development mode: React dev server should be running separately on port 3001');
  } else {
    console.log('💡 Production mode: Please build React app first:');
    console.log('   cd react-app && npm run build');
  }
}

app.get("/", (req, res) => {
  // Check if React build exists for production
  if (!IS_DEV && fs.existsSync(REACT_BUILD_PATH)) {
    res.sendFile(path.join(REACT_BUILD_PATH, "index.html"));
  } else {
    res.sendFile(path.join(__dirname, "../frontend/public/home.html"));
  }
});

// Legacy: Serve React build at /app for compatibility
app.use("/app", express.static(path.join(__dirname, "../react-app/dist")));
app.get(/^\/app\/.*$/, (_req, res) => {
  res.sendFile(path.join(__dirname, "../react-app/dist/index.html"));
});

// ✅ URL decode middleware - giữ nguyên logic cũ
app.use("/manga", (req, res, next) => {
  try {
    const decodedPath = req.url
      .split("/")
      .map((part) => {
        try {
          return decodeURIComponent(part);
        } catch {
          return part;
        }
      })
      .join("/");
    req.url = decodedPath;
  } catch (e) {
    console.error("❌ Error decoding URL:", e);
    return res.status(400).send("Bad Request");
  }
  next();
});

// ✅ URL decode middleware cho video (movie)
app.use("/video", (req, res, next) => {
  try {
    const decodedPath = req.url
      .split("/")
      .map((part) => {
        try {
          return decodeURIComponent(part);
        } catch {
          return part;
        }
      })
      .join("/");
    req.url = decodedPath;
  } catch (e) {
    console.error("❌ Error decoding video URL:", e);
    return res.status(400).send("Bad Request");
  }
  next();
});

// ✅ URL decode middleware cho audio (music)
app.use("/audio", (req, res, next) => {
  try {
    const decodedPath = req.url
      .split("/")
      .map((part) => {
        try {
          return decodeURIComponent(part);
        } catch {
          return part;
        }
      })
      .join("/");
    req.url = decodedPath;
  } catch (e) {
    console.error("❌ Error decoding audio URL:", e);
    return res.status(400).send("Bad Request");
  }
  next();
});

// ✅ List roots API - giữ nguyên logic cũ
app.get("/api/list-roots", (req, res) => {
  const dbkey = req.query.key?.toUpperCase();
  const rootDir = getRootPath(dbkey);
  if (!dbkey) {
    return res.status(400).json({ error: "Thiếu key trong query" });
  }
  if (!rootDir || !fs.existsSync(rootDir)) {
    return res.status(400).json({ error: "Root path không tồn tại" });
  }

  try {
    const entries = fs.readdirSync(rootDir, { withFileTypes: true });
    const roots = entries.filter((e) => e.isDirectory()).map((e) => e.name);
    res.json(roots);
  } catch (err) {
    console.error("❌ Lỗi đọc thư mục:", err);
    res.status(500).json({ error: "Lỗi đọc thư mục", detail: err.message });
  }
});

// ✅ SPA fallback - Production React serving with fallback to legacy
app.use((req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) return next();
  
  // Skip media routes
  if (req.path.startsWith('/manga/') || 
      req.path.startsWith('/video/') || 
      req.path.startsWith('/audio/') ||
      req.path.startsWith('/default/') ||
      req.path.startsWith('/src/') ||
      req.path.startsWith('/app/')) return next();
  
  // Skip static assets
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|map)$/)) {
    return next();
  }
  
  if (req.method === "GET") {
    // Production: Serve React app if build exists
    if (!IS_DEV && fs.existsSync(REACT_BUILD_PATH)) {
      console.log(`🔄 SPA Fallback: ${req.path} → React index.html`);
      return res.sendFile(path.join(REACT_BUILD_PATH, 'index.html'), {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }
    
    // Development or fallback: Serve legacy frontend
    console.log(`🔄 SPA Fallback: ${req.path} → legacy index.html`);
    return res.sendFile(path.join(__dirname, "../frontend/public/manga/index.html"));
  }
  next();
});
app.post("/api/log", (req, res) => {
  const { message, extra } = req.body || {};
  console.log("📡 [CLIENT LOG]:", message, extra || "");
  res.json({ status: "ok" });
});
// ✅ Setup error handling (must be after all routes)
setupErrorHandling(app);

// ✅ Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// ✅ Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`� Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📂 Root paths configured: ${Object.keys(ROOT_PATHS).length}`);
  
  // Local access URLs
  console.log(`🌐 Local access:`);
  console.log(`   - http://localhost:${PORT}`);
  console.log(`   - http://127.0.0.1:${PORT}`);
  
  // Network access (if configured)
  if (process.env.CORS_EXTRA_ORIGINS) {
    console.log(`� Network access: Check CORS_EXTRA_ORIGINS in .env`);
  }
  
  if (IS_DEV) {
    console.log(`🔧 Development mode - React dev server should be running on port 3001`);
  } else {
    console.log(`🔒 Production mode - Serving React build files`);
  }
});

module.exports = app;
