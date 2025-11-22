// 📁 backend/routes/system.js
// ⚙️ System-level routes (auth, config, etc.)

const express = require("express");
const router = express.Router();
const fs = require("fs");
const { getRootPath, getAllMangaKeys, getAllMovieKeys, getAllMusicKeys, getAllMediaKeys, SECURITY_KEYS, SECURITY_PASSWORD } = require("../utils/config");

// Health check endpoint
router.use("/health", require("../api/health"));

// View tracking
router.use("/", require("../api/increase-view"));

// Authentication
router.post("/login", (req, res) => {
  const key = (req.body.key || "").toUpperCase();
  const pass = req.body.password || "";
  
  if (!SECURITY_KEYS.includes(key)) {
    return res.status(400).json({ error: "invalid key" });
  }
  
  if (pass !== SECURITY_PASSWORD) {
    return res.status(401).json({ error: "wrong" });
  }
  
  res.json({ token: SECURITY_PASSWORD });
});

// Source keys configuration
router.get("/source-keys.js", (req, res) => {
  const manga = getAllMangaKeys();
  const movie = getAllMovieKeys();
  const music = getAllMusicKeys();
  const media = getAllMediaKeys();
  
  const js = `window.mangaKeys = ${JSON.stringify(manga)};
window.movieKeys = ${JSON.stringify(movie)};
window.musicKeys = ${JSON.stringify(music)};
window.mediaKeys = ${JSON.stringify(media)};`;
  
  res.type("application/javascript").send(js);
});

// Security keys configuration
router.get("/security-keys.js", (req, res) => {
  const js = `window.secureKeys = ${JSON.stringify(SECURITY_KEYS)};`;
  res.type("application/javascript").send(js);
});

// List root directories
router.get("/list-roots", (req, res) => {
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

module.exports = router;
