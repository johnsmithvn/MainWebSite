// 📁 backend/routes/system.js
// ⚙️ System-level routes (auth, config, etc.)

const express = require("express");
const router = express.Router();
const fs = require("fs");
const { getRootPath, getAllMangaKeys, getAllMovieKeys, getAllMusicKeys, getAllMediaKeys, SECURITY_KEYS } = require("../utils/config");
const {
  isPasswordConfigured,
  checkPassword,
  issueToken,
  setAuthCookie,
  clearAuthCookie,
} = require("../utils/authToken");

// Health check endpoint
router.use("/health", require("../api/health"));

// View tracking
router.use("/", require("../api/increase-view"));

// 🚦 Giới hạn số lần nhập sai mật khẩu theo IP (ISSUES S5).
// Lưu ý: ở dev mode mọi request qua Vite proxy đều có IP 127.0.0.1 nên giới hạn này dùng chung.
const LOGIN_MAX_FAILURES = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const loginFailures = new Map(); // ip -> { count, resetAt }

function clientIp(req) {
  const ip = req.socket.remoteAddress || "";
  if (ip.startsWith("::ffff:")) return ip.slice(7);
  return ip === "::1" ? "127.0.0.1" : ip;
}

function loginBlocked(ip) {
  const entry = loginFailures.get(ip);
  if (!entry) return false;
  if (Date.now() > entry.resetAt) {
    loginFailures.delete(ip);
    return false;
  }
  return entry.count >= LOGIN_MAX_FAILURES;
}

function recordLoginFailure(ip) {
  const now = Date.now();
  const entry = loginFailures.get(ip);
  if (!entry || now > entry.resetAt) {
    loginFailures.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
  } else {
    entry.count++;
  }
  // Dọn các mục đã hết hạn để Map không phình mãi
  if (loginFailures.size > 1000) {
    for (const [k, v] of loginFailures) if (now > v.resetAt) loginFailures.delete(k);
  }
}

// Authentication
router.post("/login", (req, res) => {
  const key = typeof req.body?.key === "string" ? req.body.key.toUpperCase() : "";
  const pass = req.body?.password;
  const ip = clientIp(req);

  if (!SECURITY_KEYS.includes(key)) {
    return res.status(400).json({ error: "invalid key" });
  }

  if (!isPasswordConfigured()) {
    return res.status(500).json({ error: "SECURITY_PASSWORD chưa được cấu hình trong backend/.env" });
  }

  if (loginBlocked(ip)) {
    return res.status(429).json({ error: "too_many_attempts" });
  }

  if (!checkPassword(pass)) {
    recordLoginFailure(ip);
    return res.status(401).json({ error: "wrong" });
  }

  loginFailures.delete(ip);
  const token = issueToken();
  // Cookie HttpOnly cho file tĩnh (<img>, <video>) của nguồn bảo mật — ISSUES S4
  setAuthCookie(req, res, token);
  res.json({ token });
});

// Đăng xuất: xoá cookie (token trong localStorage do frontend tự xoá)
router.post("/logout", (req, res) => {
  clearAuthCookie(req, res);
  res.json({ success: true });
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
