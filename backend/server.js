// 📁 backend/server-refactored.js
// 🚀 Server với cấu trúc refactored (giữ nguyên logic cũ)

const express = require("express");
const compression = require("compression");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const { ROOT_PATHS } = require("./utils/config");

// 🔐 Custom middleware
const authMiddleware = require("./middleware/auth");
const securityMiddleware = require("./middleware/security");
const rateLimiter = require("./middleware/rateLimiter");
const { errorHandler } = require("./middleware/errorHandler");

// 🛣️ Centralized route manager
const apiRoutes = require("./routes");

// 🔧 Utilities
const { createUrlDecodeMiddleware } = require("./utils/urlUtils");

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CORS Configuration
app.use(cors({
  origin: ['http://localhost:3001', 'http://127.0.0.1:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ✅ Core middleware stack
app.use(express.json());
app.use(compression());
app.use(rateLimiter);          // 🚦 Rate limiting
app.use(authMiddleware);       // 🔐 Auth/IP allow-list
app.use(securityMiddleware);   // 🔏 Security key/token check

// ✅ Centralized API routes (replaces individual app.use calls)
app.use("/api", apiRoutes);

// ✅ Static files - giữ nguyên logic cũ
for (const [key, absPath] of Object.entries(ROOT_PATHS)) {
  if (key.startsWith("V_")) {
    app.use("/video", express.static(absPath, { dotfiles: "allow" }));
  } else if (key.startsWith("M_")) {
    app.use("/audio", express.static(absPath, { dotfiles: "allow" }));
  } else {
    app.use("/manga", express.static(absPath));
  }
}

app.use(express.static(path.join(__dirname, "../frontend/public")));
app.use("/dist", express.static(path.join(__dirname, "../frontend/public/dist")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/public/home.html"));
});

// ✅ URL decode middleware (using common utility)
app.use("/manga", createUrlDecodeMiddleware("manga"));
app.use("/video", createUrlDecodeMiddleware("video"));
app.use("/audio", createUrlDecodeMiddleware("audio"));

// ✅ SPA fallback (giữ nguyên)
app.get(/^\/(?!api|src|manga).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/public/manga/index.html"));
});

// 🚨 Global error handler (đặt cuối sau mọi route)
app.use(errorHandler);

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});

module.exports = app;
