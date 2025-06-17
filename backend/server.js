// 📁 backend/server.js

const express = require("express");
const compression = require("compression");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const {
  getAllMangaKeys,
  getAllMovieKeys,
  getAllMusicKeys,
  getRootPath,
} = require("./utils/config");
const { ROOT_PATHS } = require("./utils/config");
const authMiddleware = require("./middleware/auth"); // 🆕 Middleware kiểm tra IP/hostname
const loadRoutes = require("./loadRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Middleware parse JSON body
app.use(express.json());
app.use(compression());

// 🛡️ Middleware kiểm tra IP/hostname (tách riêng ra file middleware/auth.js)
app.use(authMiddleware);

// ✅ Load all API routes automatically
loadRoutes(app);

// // ✅ Serve static images từ BASE_DIR (E:/File/Manga)
// app.use("/manga", express.static(BASE_DIR));
// Trong server.js
for (const [key, absPath] of Object.entries(ROOT_PATHS)) {
  // Nếu key là video/movie, mount route riêng
  if (key.startsWith("V_")) {
    app.use("/video", express.static(absPath, { dotfiles: "allow" }));
  } else if (key.startsWith("M_")) {
    app.use("/audio", express.static(absPath, { dotfiles: "allow" }));
  } else {
    app.use("/manga", express.static(absPath));
  }
}

// ✅ Serve frontend static files
app.use(express.static(path.join(__dirname, "../frontend/public")));
//  dist là thư mục build của frontend, nó được tạo ra khi chạy npm run build để lưu cache fronend (giảm tải cho front end)
app.use("/dist", express.static(path.join(__dirname, "../frontend/public/dist")));
// app.use("/src", express.static(path.join(__dirname, "../frontend/src")));  // bỏ cái này nếu muốn dùng static trong src nghĩa là k dùng trong dist
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/public/home.html"));
});

// ✅ Middleware fix lỗi URL encode (dấu () [] {} ...) khi load ảnh
app.use("/manga", (req, res, next) => {
  try {
    const decodedPath = req.url
      .split("/")
      .map((part) => {
        try {
          return decodeURIComponent(part);
        } catch {
          return part; // fallback nếu lỗi
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

// 📂 API: Trả về danh sách folder gốc (1,2,3,...)
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

// 🔥 Fallback tất cả route không match ➔ trả về index.html (SPA mode)
app.get(/^\/(?!api|src|manga).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/public/manga/index.html"));
});

// API get source keys
app.get("/api/source-keys.js", (req, res) => {
  const manga = getAllMangaKeys(); // ROOT_
  const movie = getAllMovieKeys(); // V_
  const music = getAllMusicKeys(); // M_
  const js = `window.mangaKeys = ${JSON.stringify(manga)};
window.movieKeys = ${JSON.stringify(movie)};
window.musicKeys = ${JSON.stringify(music)};`;
  res.type("application/javascript").send(js);
});


// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
