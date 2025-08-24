// 📁 backend/server.js

const express = require("express");
const compression = require("compression");
const cors = require("cors");
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

const authMiddleware = require("./middleware/auth");
const securityMiddleware = require("./middleware/security");

const app = express();
const PORT = process.env.PORT || 3000;
const IS_DEV = (process.env.NODE_ENV || 'development') !== 'production';

// ✅ CORS Configuration (mở cho dev + Tailscale domain)
const EXTRA_ORIGINS = (process.env.CORS_EXTRA_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const DEFAULT_DEV_ORIGINS = [
  'http://localhost:3001',
  'http://127.0.0.1:3001',
];

const ALLOWED_ORIGINS = [...new Set([...DEFAULT_DEV_ORIGINS, ...EXTRA_ORIGINS])];

app.use(
  cors({
    origin: (origin, callback) => {
      // Không có origin (cURL, server-to-server) → cho phép
      if (!origin) return callback(null, true);

      // Dev mode: nới lỏng CORS để phục vụ React dev/Tailscale
      if (IS_DEV) return callback(null, true);

      // Whitelist tĩnh từ env + dev mặc định
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);

      // Cho phép domain Tailscale (*.ts.net)
      try {
        const u = new URL(origin);
        const isTS = u.hostname.endsWith('.ts.net');
        if (isTS) return callback(null, true);
      } catch (_) {}

      console.warn('CORS blocked origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    // Thêm 'x-secure-token' để preflight không bị chặn khi React gửi header này
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'x-secure-token',
    ],
  })
);

// ✅ Middleware cơ bản (giữ nguyên logic cũ)
app.use(express.json());
app.use(compression());
app.use(authMiddleware);
app.use(securityMiddleware);

// ✅ API Routes - giữ nguyên tất cả logic cũ
app.use("/api/manga", require("./api/manga/folder-cache"));
app.use("/api", require("./api/increase-view"));
app.use("/api/manga", require("./api/manga/reset-cache"));
app.use("/api/manga", require("./api/manga/scan"));
app.use("/api/manga", require("./api/manga/favorite"));
app.use("/api/manga", require("./api/manga/root-thumbnail"));

// ✅ Cache constants and helpers
const ONE_HOUR = 3600;
const ONE_DAY = 86400;

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

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/public/home.html"));
});

// Serve React build at /app
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

// ✅ SPA fallback - giữ nguyên logic cũ
app.use((req, res, next) => {
  if (
    req.method === "GET" &&
    !req.path.startsWith("/api") &&
    !req.path.startsWith("/src") &&
    !req.path.startsWith("/manga")
  ) {
    return res.sendFile(path.join(__dirname, "../frontend/public/manga/index.html"));
  }
  next();
});

// ✅ Config APIs - giữ nguyên logic cũ
app.get("/api/source-keys.js", (req, res) => {
  const manga = getAllMangaKeys();
  const movie = getAllMovieKeys();
  const music = getAllMusicKeys();
  const js = `window.mangaKeys = ${JSON.stringify(manga)};
window.movieKeys = ${JSON.stringify(movie)};
window.musicKeys = ${JSON.stringify(music)};`;
  res.type("application/javascript").send(js);
});

app.get("/api/security-keys.js", (req, res) => {
  const { SECURITY_KEYS } = require("./utils/config");
  const js = `window.secureKeys = ${JSON.stringify(SECURITY_KEYS)};`;
  res.type("application/javascript").send(js);
});

app.post("/api/login", (req, res) => {
  const { SECURITY_PASSWORD, SECURITY_KEYS } = require("./utils/config");
  const key = (req.body.key || "").toUpperCase();
  const pass = req.body.password || "";
  if (!SECURITY_KEYS.includes(key)) return res.status(400).json({ error: "invalid key" });
  if (pass !== SECURITY_PASSWORD) return res.status(401).json({ error: "wrong" });
  res.json({ token: SECURITY_PASSWORD });
});

// ✅ Movie APIs - giữ nguyên logic cũ
app.use("/api/movie", require("./api/movie/movie-folder"));
app.use("/api/movie", require("./api/movie/video"));
app.use("/api/movie", require("./api/movie/movie-folder-empty"));
app.use("/api/movie", require("./api/movie/scan-movie"));
app.use("/api/movie", require("./api/movie/reset-movie-db"));
app.use("/api/movie", require("./api/movie/video-cache"));
app.use("/api/movie", require("./api/movie/favorite-movie"));
app.use("/api/movie", require("./api/movie/extract-movie-thumbnail"));
app.use("/api/movie", require("./api/movie/set-thumbnail"));

// ✅ Music APIs - giữ nguyên logic cũ
app.use("/api/music", require("./api/music/scan-music"));
app.use("/api/music", require("./api/music/music-folder"));
app.use("/api/music", require("./api/music/audio"));
app.use("/api/music", require("./api/music/audio-cache"));
app.use("/api/music", require("./api/music/playlist"));
app.use("/api/music", require("./api/music/music-meta"));
app.use("/api/music", require("./api/music/reset-music-db"));
app.use("/api/music", require("./api/music/extract-thumbnail"));
app.use("/api/music", require("./api/music/set-thumbnail"));

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});

module.exports = app;
