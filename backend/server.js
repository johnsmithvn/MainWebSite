// 📁 backend/server.js (merged, single-port, HTTPS-first)

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
const PORT = Number(process.env.PORT) || 3000;
const IS_DEV = process.env.NODE_ENV !== "production";
const ENABLE_HTTPS = String(process.env.ENABLE_HTTPS).toLowerCase() === "true";

// ========== Constants ==========
const ONE_HOUR = 60 * 60;
const ONE_DAY = 24 * ONE_HOUR;

// ========== Middleware ==========
setupMiddleware(app);

// ========== Smart Frontend Detection ==========
function detectFrontendType(req) {
  // Method 1: Query parameter (?ui=react or ?ui=legacy)
  const uiParam = req.query.ui;
  if (uiParam === 'react') return 'react';
  if (uiParam === 'legacy') return 'legacy';
  
  // Method 2: Cookie-based preference
  const uiPreference = req.cookies?.ui_preference;
  if (uiPreference === 'react') return 'react';
  if (uiPreference === 'legacy') return 'legacy';
  
  // Method 3: Path-based detection  
  if (req.path.startsWith('/app/')) return 'react';
  if (req.path.startsWith('/legacy/')) return 'legacy';
  
  // Method 4: Referrer-based detection
  const referer = req.headers.referer || '';
  if (referer.includes('/app/') || referer.includes('?ui=react')) return 'react';
  if (referer.includes('/legacy/') || referer.includes('?ui=legacy')) return 'legacy';
  
  // Default: React for production, Legacy for development  
  return (!IS_DEV && fs.existsSync(path.join(__dirname, "../react-app/dist"))) ? 'react' : 'legacy';
}

// Security headers for production
if (!IS_DEV) {
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });
}

// ========== Routes ==========
app.use("/api", require("./routes"));

// ========== UI Preference API ==========
app.post('/api/ui-preference', (req, res) => {
  const { preference } = req.body;
  if (['react', 'legacy'].includes(preference)) {
    res.cookie('ui_preference', preference, { 
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      httpOnly: true,
      secure: !IS_DEV
    });
    res.json({ success: true, preference });
  } else {
    res.status(400).json({ error: 'Invalid preference' });
  }
});

app.get('/api/ui-preference', (req, res) => {
  const preference = req.cookies?.ui_preference || 'auto';
  res.json({ preference, detected: detectFrontendType(req) });
});

// Helpers to detect media types
const isImg = /\.(avif|jpe?g|png|gif|webp|bmp|svg)$/i;
const isAudio = /\.(mp3|m4a|aac|ogg|flac|wav)$/i;
const isVideo = /\.(mp4|m4v|webm|mov|mkv|ts|m3u8)$/i;

// Nếu ảnh manga đã hash tên file: cache lâu + immutable
const MANGA_IMAGES_IMMUTABLE = true;

// Merge ưu điểm header của 2 file cũ
function setStaticHeaders(kind) {
  return (res, filePath) => {
    // Content-Type (express.static thường tự set, nhưng bổ sung cho chắc với 1 số ext)
    if (isImg.test(filePath)) {
      // Cache cho ảnh
      if (kind === "manga" && MANGA_IMAGES_IMMUTABLE && !IS_DEV) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else {
        res.setHeader(
          "Cache-Control",
          IS_DEV ? "no-cache" : `public, max-age=${ONE_DAY}`
        );
      }
    } else if (isAudio.test(filePath)) {
      res.setHeader(
        "Cache-Control",
        IS_DEV ? "no-cache" : `public, max-age=${ONE_HOUR}`
      );
      res.setHeader("Accept-Ranges", "bytes");
    } else if (isVideo.test(filePath)) {
      res.setHeader(
        "Cache-Control",
        IS_DEV ? "no-cache" : `public, max-age=${ONE_HOUR}`
      );
      res.setHeader("Accept-Ranges", "bytes");
    } else {
      // Default short-ish cache for other assets
      if (!IS_DEV)
        res.setHeader(
          "Cache-Control",
          `public, max-age=${ONE_HOUR}, must-revalidate`
        );
    }
  };
}

// Static mounts (kiểu gom chung của server.js)
for (const [key, absPath] of Object.entries(ROOT_PATHS)) {
  if (key.startsWith("V_")) {
    app.use(
      "/video",
      express.static(absPath, {
        dotfiles: "allow",
        maxAge: ONE_HOUR * 1000,
        etag: true,
        lastModified: true,
        setHeaders: setStaticHeaders("video"),
      })
    );
  } else if (key.startsWith("M_")) {
    app.use(
      "/audio",
      express.static(absPath, {
        dotfiles: "allow",
        maxAge: ONE_HOUR * 1000,
        etag: true,
        lastModified: true,
        setHeaders: setStaticHeaders("audio"),
      })
    );
  } else {
    app.use(
      "/manga",
      express.static(absPath, {
        dotfiles: "allow",
        maxAge: ONE_HOUR * 1000,
        etag: true,
        lastModified: true,
        setHeaders: setStaticHeaders("manga"),
      })
    );
  }
}

app.use(express.static(path.join(__dirname, "../frontend/public")));
app.use(
  "/dist",
  express.static(path.join(__dirname, "../frontend/public/dist"))
);

// Default assets
app.use(
  "/default",
  express.static(path.join(__dirname, "../frontend/public/default"), {
    maxAge: IS_DEV ? 0 : ONE_DAY * 7 * 1000,
    etag: !IS_DEV,
    setHeaders: setStaticHeaders("image"),
  })
);

// React build serving
const REACT_BUILD_PATH = path.join(__dirname, "../react-app/dist");
if (fs.existsSync(REACT_BUILD_PATH)) {
  console.log("✅ React build found, serving production app");
  
  // Serve React assets directly (CSS, JS, etc.)
  app.use(
    "/assets",
    express.static(path.join(REACT_BUILD_PATH, "assets"), {
      maxAge: IS_DEV ? 0 : ONE_DAY * 30 * 1000, // 30 days for assets
      etag: !IS_DEV,
      setHeaders: (res, filePath) => {
        if (/\.(js|css)$/.test(filePath) && /\.[a-f0-9]{8,}\./i.test(filePath)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      },
    })
  );
  
  // Serve React static assets with proper caching for /app route
  app.use(
    "/app",
    express.static(REACT_BUILD_PATH, {
      maxAge: IS_DEV ? 0 : ONE_DAY * 1000,
      etag: !IS_DEV,
      setHeaders: (res, filePath) => {
        if (
          /\.(js|css)$/.test(filePath) &&
          /\.[a-f0-9]{8,}\./i.test(filePath)
        ) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        }
      },
      index: false,
    })
  );
} else {
  console.log("❌ React build not found at:", REACT_BUILD_PATH);
  if (IS_DEV) {
    console.log(
      "🔧 Development mode: React dev server should be running separately on port 3001"
    );
  } else {
    console.log(
      '💡 Production mode: Please build React app first: "cd react-app && npm run build"'
    );
  }
}

// ========== Smart Root Route ==========
app.get("/", (req, res) => {
  const frontendType = detectFrontendType(req);
  
  // If user specifically requests interface selector or no preference
  if (req.query.selector === 'true' || (!req.cookies?.ui_preference && !req.query.ui)) {
    return res.sendFile(path.join(__dirname, "../frontend/public/interface-selector.html"));
  }
  
  if (frontendType === 'react') {
    const reactIndex = path.join(REACT_BUILD_PATH, "index.html");
    if (!IS_DEV && fs.existsSync(reactIndex)) {
      return res.sendFile(reactIndex, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
    }
  }
  
  // Default to legacy
  return res.sendFile(path.join(__dirname, "../frontend/public/home.html"));
});

// ========== React App Routes ==========
// Direct /app access always serves React
app.get('/app', (req, res) => {
  const reactIndex = path.join(REACT_BUILD_PATH, "index.html");
  if (fs.existsSync(reactIndex)) {
    return res.sendFile(reactIndex, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  }
  res.status(404).send("React app not built");
});

// Legacy: /app
app.use("/app", express.static(path.join(__dirname, "../react-app/dist")));
app.get(/^\/app\/.*$/, (_req, res) => {
  const idx = path.join(__dirname, "../react-app/dist/index.html");
  if (fs.existsSync(idx)) return res.sendFile(idx);
  res.status(404).send("React app not built");
});

// Decode URL middlewares
for (const base of ["/manga", "/video", "/audio"]) {
  app.use(base, (req, res, next) => {
    try {
      const decoded = req.url
        .split("/")
        .map((p) => {
          try {
            return decodeURIComponent(p);
          } catch {
            return p;
          }
        })
        .join("/");
      req.url = decoded;
      next();
    } catch {
      return res.status(400).send("Bad Request");
    }
  });
}

// List roots API — CHỌN 1 TRONG 2 kiểu dưới đây:

app.get("/api/list-roots", (req, res) => {
  const dbkey = req.query.key?.toUpperCase();
  const rootDir = getRootPath(dbkey);
  if (!dbkey) return res.status(400).json({ error: "Thiếu key trong query" });
  if (!rootDir || !fs.existsSync(rootDir))
    return res.status(400).json({ error: "Root path không tồn tại" });

  try {
    const entries = fs.readdirSync(rootDir, { withFileTypes: true });
    const roots = entries.filter((e) => e.isDirectory()).map((e) => e.name);
    res.json(roots);
  } catch (err) {
    res.status(500).json({ error: "Lỗi đọc thư mục", detail: err.message });
  }
});



// ========== Smart SPA Fallback ==========
app.use((req, res, next) => {
  // Skip API and static assets
  if (req.path.startsWith("/api/")) return next();
  if (
    req.path.startsWith("/manga/") ||
    req.path.startsWith("/video/") ||
    req.path.startsWith("/audio/") ||
    req.path.startsWith("/default/") ||
    req.path.startsWith("/src/") ||
    req.path.startsWith("/app/") ||
    req.path.startsWith("/dist/")
  )
    return next();
  if (
    /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|map)$/.test(req.path)
  )
    return next();

  if (req.method === "GET") {
    const frontendType = detectFrontendType(req);
    
    if (frontendType === 'react') {
      const reactIndex = path.join(REACT_BUILD_PATH, "index.html");
      if (!IS_DEV && fs.existsSync(reactIndex)) {
        return res.sendFile(reactIndex, {
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        });
      }
    }
    
    // Fallback to legacy based on path or default
    if (req.path.startsWith('/manga')) {
      return res.sendFile(path.join(__dirname, "../frontend/public/manga/index.html"));
    } else if (req.path.startsWith('/movie')) {
      return res.sendFile(path.join(__dirname, "../frontend/public/movie/index.html"));
    } else if (req.path.startsWith('/music')) {
      return res.sendFile(path.join(__dirname, "../frontend/public/music/index.html"));
    }
    
    // Default fallback
    return res.sendFile(path.join(__dirname, "../frontend/public/home.html"));
  }
  next();
});

// Error handling
setupErrorHandling(app);

// ========== HTTPS helpers ==========
function loadSSLCertificates() {
  const sslDir = path.join(__dirname, "../ssl");
  const keyPath = path.join(sslDir, "private-key.pem");
  const certPath = path.join(sslDir, "certificate.pem");
  try {
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      return {
        key: fs.readFileSync(keyPath, "utf8"),
        cert: fs.readFileSync(certPath, "utf8"),
      };
    }
  } catch (error) {
    console.error("❌ Error loading SSL certificates:", error.message);
  }
  return null;
}

function setupGracefulShutdown(server) {
  for (const sig of ["SIGTERM", "SIGINT"]) {
    process.on(sig, () => {
      console.log(`\n📴 ${sig} received, shutting down gracefully...`);
      server.close(() => {
        console.log("✅ Server closed successfully");
        process.exit(0);
      });
    });
  }
}

// ========== Start exactly ONCE (one port) ==========
(function start() {
  const sslOptions = ENABLE_HTTPS ? loadSSLCertificates() : null;

  if (ENABLE_HTTPS && sslOptions) {
    console.log("🔐 Starting HTTPS server with SSL certificates...");
    const httpsServer = https.createServer(sslOptions, app);
    httpsServer.listen(PORT, "0.0.0.0", () => {
      console.log(`\n🚀 MainWebSite HTTPS Server running!`);
      console.log(`   Local:     https://localhost:${PORT}`);
      console.log(`   Mode:      ${IS_DEV ? "development" : "production"}\n`);
      console.log("🔐 SSL Certificate loaded successfully!");
      console.log(
        '⚠️  Self-signed: trình duyệt sẽ cảnh báo, chọn "Advanced" -> "Proceed".'
      );
    });
    setupGracefulShutdown(httpsServer);
  } else {
    const httpServer = app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    });
    setupGracefulShutdown(httpServer);
  }
})();
