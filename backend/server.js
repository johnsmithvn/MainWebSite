// 📁 backend/server.js
const https = require("https");
const express = require("express");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const { getRootPath, ROOT_PATHS } = require("./utils/config");

const { setupMiddleware, setupErrorHandling } = require("./middleware");

const app = express();
const PORT = process.env.PORT || 3000;
const IS_DEV = process.env.NODE_ENV !== "production";
const ENABLE_HTTPS = String(process.env.ENABLE_HTTPS).toLowerCase() === "true";
// ========== Constants ==========
const ONE_HOUR = 60 * 60;
const ONE_DAY = 24 * ONE_HOUR;

// ========== Middleware ==========
// ✅ Setup all middleware (CORS, compression, auth, security, etc.)
setupMiddleware(app);

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
// ✅ API Routes - Centralized routing
app.use("/api", require("./routes"));

// ✅ Cache constants and helpers
const isImg = /\.(avif|jpe?g|png|gif|webp|bmp|svg)$/i;
const isAudio = /\.(mp3|m4a|aac|ogg|flac|wav)$/i;
const isVideo = /\.(mp4|m4v|webm|mov|mkv|ts|m3u8)$/i;

// Nếu bạn ĐÃ hash tên file ảnh manga, bật immutable + TTL dài
const MANGA_IMAGES_IMMUTABLE = true; // Nếu build có hash (Vite/Webpack/Next…): = True

function setStaticHeaders(kind) {
  return (res, path) => {
    if (isImg.test(path)) {
      if (kind === "manga" && MANGA_IMAGES_IMMUTABLE) {
        res.setHeader("Cache-Control", `public, max-age=${ONE_DAY}, immutable`);
      } else {
        res.setHeader(
          "Cache-Control",
          `public, max-age=${ONE_HOUR}, must-revalidate`
        );
      }
    } else if (isVideo.test(path) || isAudio.test(path)) {
      // Media thường ổn với TTL ngắn + SWR
      res.setHeader(
        "Cache-Control",
        `public, max-age=${ONE_HOUR}, stale-while-revalidate=60`
      );
    }
  };
}

// ✅ Static files với cache headers tối ưu và consistent
for (const [key, absPath] of Object.entries(ROOT_PATHS)) {
  if (key.startsWith("V_")) {
    app.use(
      "/video",
      express.static(absPath, {
        dotfiles: "allow", // Giữ theo yêu cầu
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
        dotfiles: "allow", // Giữ theo yêu cầu
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
        dotfiles: "allow", // Giữ theo yêu cầu
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

// ✅ Default assets
app.use(
  "/default",
  express.static(path.join(__dirname, "../frontend/public/default"), {
    maxAge: IS_DEV ? 0 : ONE_DAY * 7 * 1000,
    etag: !IS_DEV,
    setHeaders: setStaticHeaders("image"),
  })
);

// ✅ NEW: Production React App Serving
const REACT_BUILD_PATH = path.join(__dirname, "../react-app/dist");

if (fs.existsSync(REACT_BUILD_PATH)) {
  console.log("✅ React build found, serving production app");
  console.log("📦 React build path:", REACT_BUILD_PATH);

  // Serve React build static assets
  app.use(
    express.static(REACT_BUILD_PATH, {
      maxAge: IS_DEV ? 0 : ONE_DAY * 30 * 1000,
      etag: !IS_DEV,
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
    console.log("💡 Production mode: Please build React app first:");
    console.log("   cd react-app && npm run build");
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
  // Skip API and static assets
  if (req.path.startsWith("/api/")) return next();
  if (
    req.path.startsWith("/manga/") ||
    req.path.startsWith("/video/") ||
    req.path.startsWith("/audio/") ||
    req.path.startsWith("/default/") ||
    req.path.startsWith("/src/") ||
    req.path.startsWith("/dist/")
  )
    return next();

  // Skip static assets
  if (
    req.path.match(
      /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|map)$/
    )
  ) {
    return next();
  }

  if (req.method === "GET") {
    // Production: Serve React app if build exists
    if (!IS_DEV && fs.existsSync(REACT_BUILD_PATH)) {
      console.log(`🔄 SPA Fallback: ${req.path} → React index.html`);
      return res.sendFile(path.join(REACT_BUILD_PATH, "index.html"), {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
    }

    // Development or fallback: Serve legacy frontend
    console.log(`🔄 SPA Fallback: ${req.path} → legacy index.html`);
    return res.sendFile(
      path.join(__dirname, "../frontend/public/manga/index.html")
    );
  }
  next();
});

// ✅ Setup error handling (must be after all routes)
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

// ========== Pretty console sections ==========
function printSection(title, rows) {
  const items = Array.isArray(rows) ? rows : [];
  const keyLen = items.reduce((m, [k]) => Math.max(m, String(k).length), 0);
  const maxWidth = 110;
  const width = Math.min(maxWidth, Math.max(56, 8 + keyLen + 36));
  const line = "=".repeat(width);
  const sub = "-".repeat(width);
  console.log("\n" + line);
  console.log(`:: ${title}`);
  console.log(sub);
  for (const [k, v] of items) {
    const key = String(k).padEnd(keyLen, " ");
    console.log(`• ${key}: ${v}`);
  }
  console.log(line);
}

// ========== Start exactly ONCE (one port) ==========
(function start() {
  // Get Tailscale config from environment
  const TAILSCALE_DEVICE = process.env.TAILSCALE_DEVICE || '[DEVICE]';
  const TAILSCALE_TAILNET = process.env.TAILSCALE_TAILNET || '[TAILNET]';
  const TAILSCALE_DOMAIN = `${TAILSCALE_DEVICE}.${TAILSCALE_TAILNET}.ts.net`;
  // Consistent SSL paths (match loader in ../ssl)
  const SSL_DIR = path.join(__dirname, "../ssl");
  const SSL_KEY = path.join(SSL_DIR, "private-key.pem");
  const SSL_CERT = path.join(SSL_DIR, "certificate.pem");

  const sslOptions = ENABLE_HTTPS ? loadSSLCertificates() : null;

  if (ENABLE_HTTPS && sslOptions) {
    console.log("✅ SSL certificates found - starting HTTPS server...");
    const httpsServer = https.createServer(sslOptions, app);
    httpsServer.listen(PORT, "0.0.0.0", () => {
      printSection("Server started [HTTPS]", [
        ["Local", `https://localhost:${PORT}`],
        ["Tailscale", `https://${TAILSCALE_DOMAIN}:${PORT}`],
        ["Mode", IS_DEV ? "development" : "production"],
        ["Certificates", "OK"],
      ]);
      console.log('Note: Self-signed certificates may show a browser warning. Choose "Advanced" -> "Proceed".');
      console.log('Note: if the Tailscale domain is not accessible, ensure you are connected to the Tailscale network.');
      console.log('Note: try running `tailscale status` to check your connection.');
      console.log('Note: try running `tailscale up` to connect to the Tailscale network.');

    });
    setupGracefulShutdown(httpsServer);
  } else if (ENABLE_HTTPS && !sslOptions) {
    printSection("HTTPS requested but certificates missing", [
      ["Problem", "SSL certificates not found"],
      ["Expected key", SSL_KEY],
      ["Expected cert", SSL_CERT],
    ]);
    printSection("HOW TO FIX", [
      ["1", `mkcert ${TAILSCALE_DOMAIN}`],
      ["2", `move ${TAILSCALE_DOMAIN}.pem ${SSL_CERT}`],
      ["3", `move ${TAILSCALE_DOMAIN}-key.pem ${SSL_KEY}`],
      ["4", "restart server"],
    ]);
    console.log("Falling back to HTTP server without Tailscale HTTPS...\n");

    const httpServer = app.listen(PORT, "0.0.0.0", () => {
      printSection("Server started [HTTP fallback]", [
        ["Local", `http://localhost:${PORT}`],
        ["Tailscale", "NOT ACCESSIBLE (requires HTTPS)"],
        ["Mode", process.env.NODE_ENV],
      ]);
      console.log("WARNING: Tailscale access requires HTTPS with valid certificates!\n");
    });
    setupGracefulShutdown(httpServer);
  } else {
    console.log("ℹ️  HTTPS disabled in configuration - starting HTTP server...");
    const httpServer = app.listen(PORT, "0.0.0.0", () => {
      printSection("Server started [HTTP]", [
        ["Local", `http://localhost:${PORT}`],
        ["Tailscale", "NOT ACCESSIBLE (HTTPS disabled)"],
        ["Mode", process.env.NODE_ENV || "development"],
      ]);
      printSection("Enable HTTPS for Tailscale", [
        ["1", "Set ENABLE_HTTPS=true in backend/.env"],
        ["2", `mkcert ${TAILSCALE_DOMAIN}`],
        ["3", `move ${TAILSCALE_DOMAIN}.pem ${SSL_CERT}`],
        ["4", `move ${TAILSCALE_DOMAIN}-key.pem ${SSL_KEY}`],
        ["5", "restart server"],
      ]);
    });
    setupGracefulShutdown(httpServer);
  }
})();