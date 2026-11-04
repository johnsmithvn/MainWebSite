# 📘 BÁO CÁO TỔNG QUAN HỆ THỐNG — MainWebSite

> **Ngày rà soát:** 2026-10-29 · **Commit:** `a511bcd` (nhánh `main`, merge PR #120)
> **Phạm vi:** toàn bộ repo — `backend/`, `react-app/`, `frontend/` (legacy), `scripts/`, `docs/`.
> **Tài liệu liên quan:** [ISSUES-REPORT.md](ISSUES-REPORT.md) (danh sách lỗi/rủi ro) · [DEAD-CODE-REPORT.md](DEAD-CODE-REPORT.md) (code không dùng) · [README.md](README.md) (mục lục docs)

---

## 1. Tóm tắt

MainWebSite là **media server cá nhân** chạy trên một máy Windows, phục vụ 4 loại nội dung từ ổ đĩa cục bộ:

| Loại | Prefix key trong `.env` | Static mount | Mô tả |
|------|------------------------|--------------|-------|
| 📚 Manga | `ROOT_*` | `/manga` | Thư mục ảnh (chapter) và file PDF, reader dọc/ngang, đọc offline |
| 🎬 Movie | `V_*` | `/video` | Duyệt thư mục video, player web + ExoPlayer (Android WebView) |
| 🎵 Music | `M_*` | `/audio` | Thư viện nhạc, metadata/lyrics, playlist, tải về máy |
| 📸 Media | `MEDIA_*` | `/media` | Gallery kiểu Google Photos: ảnh, video và **mọi loại file** (pdf, doc, zip…), album, timeline |

Người dùng truy cập qua LAN hoặc Tailscale (HTTPS bằng chứng chỉ mkcert). React app là một PWA, hỗ trợ tải chapter manga để đọc offline.

### Quy mô code (tại commit rà soát)

| Khu vực | Số dòng | Ghi chú |
|---------|--------:|---------|
| `backend/` (JS) | ~7.900 | Express 5, 42 file API |
| `react-app/src` (JS/JSX) | ~34.300 | 114 file JS/JSX |
| `react-app/src` (CSS) | ~3.600 | Tailwind + CSS module theo component |
| `react-app/public/sw.js` | 898 | Service worker v3.1.0 |
| `frontend/` (legacy JS) | ~7.200 | Vanilla JS + esbuild, **không còn phát triển** |
| `frontend/` (CSS/HTML) | ~3.500 | |
| Tài liệu Markdown | ~14.800 | gồm `CHANGELOG.md` ~160KB |
| Lịch sử git | 473 commit | 2025-05-25 → 2026-02-15 |

Phiên bản: root `5.0.10`, `react-app` `5.0.10`, `backend` `5.0.0` (health API vẫn trả `version: '1.0.0'`).

---

## 2. Kiến trúc tổng thể

```
                       ┌──────────────────────────── Trình duyệt / Android WebView ───────────────────────────┐
                       │  React 18 SPA (Vite)  ── Zustand stores ── axios (utils/api.js) / fetch()             │
                       │        │                                                                              │
                       │  Service Worker (public/sw.js)                                                        │
                       │   ├─ offline-core-v3.1.0   : ảnh mặc định /default/*                                  │
                       │   ├─ reader-dynamic-v3.1.0 : điều hướng SPA + mọi GET /api/* (network-first, 5s)      │
                       │   ├─ chapter-images        : ảnh chapter đã tải offline                               │
                       │   └─ media-thumbnails-v1   : (thiết kế cho thumbnail, thực tế gần như không dùng)      │
                       │  IndexedDB "offline-manga"/chapters : metadata chapter offline                        │
                       │  localStorage : auth, settings, recent/random/top caches, download queue              │
                       └───────────────▲──────────────────────────────────────────────────────────────────────┘
                                       │ HTTP(S) :3000 (prod)  ·  Vite :3001 proxy → :3000 (dev)
┌──────────────────────────────────────┴──────────────── backend/server.js (Express 5) ────────────────────────────┐
│ CORS → body parser (10MB) → compression → [rate limiter: TẮT] → auth (IP/hostname) → security (token theo key)   │
│ /api/*  → routes/index.js → manga | movie | music | media | system                                              │
│ /manga /video /audio /media → express.static từ các thư mục gốc trong .env                                      │
│ /default, frontend/public (legacy), react-app/dist (prod), SPA fallback                                          │
└────────────┬───────────────────────────────┬─────────────────────────────────────┬──────────────────────────────┘
             │ better-sqlite3                │ fs (đọc trực tiếp ổ đĩa)             │ ffprobe-static / ffmpeg / music-metadata
     backend/data/<KEY>.db            E:/File/Manga, Video, Music…              duration, kích thước ảnh, tag, ảnh bìa
```

---

## 3. Cấu trúc repo

```
MainWebSite/
├── package.json            # npm workspaces: backend, react-app; scripts dev/prod/build
├── readme.md               # Hướng dẫn cài đặt & chạy
├── CHANGELOG.md            # Nhật ký thay đổi chi tiết (rất lớn)
├── Promt.md                # Prompt làm việc với AI (nội bộ)
├── .github/                # prompts/instructions cho Copilot/AI (không có CI workflow)
├── scripts/build.js        # esbuild cho frontend legacy (npm run dev:frontendv1)
├── backend/
│   ├── server.js           # Điểm vào: middleware, static, SPA fallback, HTTPS
│   ├── constants.js        # FILE_EXTENSIONS, SECURITY, API_RESPONSE…
│   ├── .env.template       # Mẫu cấu hình (phải copy thành .env)
│   ├── middleware/         # cors, auth (IP/hostname), security (token), protectStatic, errorHandler, rateLimiter (tắt)
│   ├── routes/             # index → manga / movie / music / media / system
│   ├── api/                # handler theo domain (manga 7, movie 10, music 12, media 10, system 3)
│   ├── utils/              # config, db, scanners, folder-loader, imageUtils, authToken, pathSafety, streamFile…
│   ├── services/           # MediaService.js — KHÔNG được dùng (xem DEAD-CODE-REPORT)
│   └── data/               # *.db SQLite (gitignored)
├── react-app/
│   ├── vite.config.js      # proxy /api /manga /video /audio /media /default → :3000
│   ├── public/sw.js        # Service worker
│   ├── src/
│   │   ├── main.jsx, App.jsx
│   │   ├── components/     # common/ (26), manga/, movie/, music/, media/, auth/
│   │   ├── pages/          # Home, Settings, manga/, movie/, music/, media/, offline/, downloads/
│   │   ├── store/          # index.js (6 store), downloadQueueStore.js
│   │   ├── hooks/          # data hooks (random/recent/top view), service worker…
│   │   ├── utils/          # api, offlineLibrary, storageQuota, caches, formatters…
│   │   ├── workers/        # downloadWorker.js (class chạy trên main thread)
│   │   └── constants/      # index, cacheKeys, colors, uiStyles, timeFormats
│   ├── docs/               # Tài liệu React app
│   └── refactor/           # Báo cáo/kế hoạch refactor 10/2025 (chưa thực hiện)
├── frontend/               # Frontend V1 (vanilla JS) — legacy, chỉ còn được serve ở dev mode
└── docs/                   # Tài liệu hệ thống (file này)
```

---

## 4. Backend

### 4.1 Trình tự khởi động (`backend/server.js`)

1. `dotenv` nạp `backend/.env`. **Lưu ý:** `utils/config.js` và `middleware/auth.js` đọc `.env` bằng `fs.readFileSync` không có try/catch → thiếu file `.env` thì server **crash ngay khi require**.
2. `setupMiddleware(app)` (thứ tự trong `middleware/index.js`):
   1. `cors` — whitelist từ `CORS_DEV_CONFIG` + `TAILSCALE_*`, ngoài ra **cho qua mọi origin `*.ts.net`**, origin là IP trùng header `Host` (mở app bằng IP LAN) và — ở dev — mọi origin là IP nội bộ; `credentials: true`.
   2. `express.json` / `urlencoded` — giới hạn 10MB.
   3. `compression`.
   4. Rate limiter — **bị tắt cứng** (`ENABLE_RATE_LIMIT = false`).
   5. `auth.js` — cho qua nếu IP ∈ `ALLOWED_IPS`, ngược lại reverse-DNS và so với `ALLOWED_HOSTNAMES`.
   6. `security.js` — nếu `key` **hoặc `dbkey`** (query/body) ∈ `SECURITY` thì yêu cầu token hợp lệ (`x-secure-token` / `Authorization: Bearer` / `?token=` / body.token). Token = HMAC của `SECURITY_PASSWORD` với secret `backend/data/.auth-secret` (`utils/authToken.js`); cookie không được chấp nhận cho API.
3. Header bảo mật (chỉ production): `nosniff`, `X-Frame-Options: DENY`, HSTS, Referrer-Policy.
4. `app.use("/api", routes)`.
5. Static mount theo prefix key: `V_*`→`/video`, `M_*`→`/audio`, `MEDIA_*`→`/media`, **còn lại**→`/manga` (cache 1h; ảnh manga `immutable` 1 ngày). Nguồn thuộc `SECURITY` được bọc bởi `middleware/protectStatic.js`: file chỉ được phục vụ khi có cookie `ms_auth` hợp lệ (đặt lúc đăng nhập).
6. Static legacy: `frontend/public`, `/dist`, `/default`.
7. Nếu có `react-app/dist`: serve static (cache 30 ngày ở prod); `/` trả `index.html` ở prod, `home.html` legacy ở dev.
8. `/app/*` (legacy) → React build.
9. Middleware decode URL cho `/manga /video /audio /media` (đặt **sau** static nên thực tế không tác dụng).
10. `/api/list-roots` (bản trùng, không bao giờ được gọi vì router đã xử lý).
11. SPA fallback: GET không phải `/api`/static → React `index.html` (prod) hoặc `frontend/public/manga/index.html` (dev).
12. `/api/log`, error handler.
13. Listen `0.0.0.0:PORT` — HTTPS nếu `ENABLE_HTTPS=true` và có `ssl/private-key.pem` + `ssl/certificate.pem`, ngược lại HTTP.

### 4.2 Cấu hình `.env`

| Biến | Ý nghĩa |
|------|---------|
| `PORT`, `NODE_ENV`, `ENABLE_HTTPS` | Server |
| `ROOT_*`, `V_*`, `M_*`, `MEDIA_*` | Thư mục gốc từng nguồn. Chỉ được nạp nếu **đường dẫn tồn tại lúc khởi động**. `MEDIA_*` chưa có trong `.env.template`. |
| `SECURITY` | Danh sách key cần mật khẩu (vd. `V_MOVIE,ROOT_MANGA`) |
| `SECURITY_PASSWORD` | Mật khẩu chung. Login trả về token HMAC (không phải mật khẩu); đổi mật khẩu → mọi token cũ hết hiệu lực |
| `ALLOWED_IPS`, `ALLOWED_HOSTNAMES` | Whitelist truy cập |
| `CORS_DEV_CONFIG` | `host:port1,port2\|proto;…` |
| `TAILSCALE_DEVICE`, `TAILSCALE_TAILNET`, `TAILSCALE_PORTS`, `TAILSCALE_PROTOCOLS` | Sinh origin CORS và log URL |

Frontend (`react-app/.env`, mọi biến tuỳ chọn): `VITE_BASE`, `VITE_MIN_STORAGE_SPACE` (**MB**), `VITE_HMR_HOST`, `VITE_HMR_PORT`, `VITE_ALLOWED_HOSTS` (chỉ cần cho domain khác: localhost, mọi IP và `*.ts.net` luôn được phép), `VITE_ENABLE_HTTPS`, `VITE_DISABLE_HMR`, `VITE_DISABLE_STRICT_MODE`. Không đặt `NODE_ENV` trong file này (ISSUES C8). Giải thích từng biến: [readme.md §3](../readme.md#3-cấu-hình).

### 4.3 Cơ sở dữ liệu

Mỗi key là **một file SQLite** `backend/data/<KEY>.db` (tên đã sanitize). Schema được tạo/migrate tại runtime trong `utils/db.js`:

| Hàm | Dùng cho | Bảng |
|-----|----------|------|
| `getDB(key)` | Manga | `folders(root, name, path, thumbnail, lastModified, imageCount, chapterCount, otherName, type, isFavorite, scanned, favoriteAt*)`, `views(root, path, count)`, `root_thumbnails(root, thumbnail)` |
| `getMovieDB(key)` | Movie | `folders(name, path, thumbnail, type, size, modified, duration, isFavorite, viewCount, scanned, favoriteAt*)` |
| `getMusicDB(key)` | Music | `folders(… type 'folder'|'audio' …)`, `songs(path UNIQUE, artist, album, title, genre, lyrics)`, `playlists`, `playlist_items(playlistId, songPath, sortOrder)` |
| `getMediaDB(key)` | Media | `folders(root, path, name, thumbnail, itemCount, scanned)`, `media_items(name, path UNIQUE, type, size, modified, width, height, duration, date_taken, isFavorite, viewCount, albumId, scanned)`, `albums` |

\* `favoriteAt` được thêm "lười" bởi API favorite. Kết nối DB được cache trong bộ nhớ theo key (lưu ý: `getDB` và `getMusicDB` **dùng chung một map cache** — xem ISSUES).

### 4.4 Scanner (đồng bộ DB với ổ đĩa)

| Scanner | File | Đặc điểm |
|---------|------|----------|
| Manga | `utils/cache-scan.js` | Async (`fs.promises`, không chặn server), đệ quy theo `root`; chỉ lưu thư mục có ảnh; thumbnail = ảnh đầu tiên (natural sort); thư mục rỗng con → `otherName` (alias tìm kiếm); mark & sweep theo `root`; mỗi `(key, root)` chỉ chạy một scan/reset tại một thời điểm. Không hỗ trợ partial/shallow. |
| Movie | `utils/movie-scan.js` | Async; ffprobe lấy `duration` cho file mới/đổi; thumbnail từ `.thumbnail/<tên>.<ext>`; hỗ trợ `scopePath` (partial) + `shallow`. |
| Music | `utils/music-scan.js` | Async; `music-metadata` lấy duration/artist/album/title/genre/lyrics cho file mới/đổi; ghi bảng `songs`; partial + shallow. |
| Media | `utils/media-scan.js` | Async; ảnh (ffprobe lấy width/height), video (duration), **mọi file khác** phân loại theo `FILE_EXTENSIONS`; `date_taken` = mtime (chưa đọc EXIF); folder thumbnail = file ảnh đầu tiên trong `.thumbnail/`. |

Partial + shallow (movie/music/media): `shallow` chỉ xử lý các mục nằm **ngay trong** thư mục `path` (hoặc ngay trong root nếu không có `path`) và không đi sâu hơn; phase 1 và phase 3 dùng đúng phạm vi đó nên không xoá nhầm các thư mục con (đã sửa ISSUES D1).

Mẫu chung **mark & sweep**: (1) đặt `scanned = 0` trong phạm vi → (2) duyệt ổ đĩa, upsert và đặt `scanned = 1` → (3) xoá bản ghi còn `scanned = 0`.

Quy ước thumbnail: `<thư mục>/.thumbnail/<basename>.<jpg|png|…>`; tạo bằng `POST …/extract-thumbnail` (movie: ffmpeg chụp frame ngẫu nhiên — **cần ffmpeg trong PATH**, chỉ ffprobe được đóng gói; music: ảnh bìa nhúng trong tag).

### 4.5 Danh mục API (đã đối chiếu với code)

**System — `/api`**

| Method | Endpoint | Tham số chính |
|--------|----------|---------------|
| GET/HEAD | `/api/health` | — |
| POST | `/api/login` | `{ key, password }` → `{ token }` + cookie `ms_auth`; 429 sau 10 lần sai / 15 phút / IP |
| POST | `/api/logout` | Xoá cookie `ms_auth` |
| GET | `/api/source-keys.js` | trả **JavaScript** `window.mangaKeys = […]` … |
| GET | `/api/security-keys.js` | trả JavaScript `window.secureKeys` |
| GET | `/api/list-roots` | `?key=ROOT_X` → danh sách thư mục con |
| POST | `/api/increase-view` | `{ path, dbkey, rootKey }` (manga) |
| POST | `/api/increase-view/movie` · `/music` | `{ key, path }` |
| DELETE | `/api/increase-view` · `/all` | `?dbkey&rootKey[&path]` (manga) |
| DELETE | `/api/increase-view/movie[/all]` · `/music[/all]` | `?key[&path]` (reset viewCount) |
| POST | `/api/log` | `{ message, extra }` → in ra console server |

**Manga — `/api/manga`**

| Method | Endpoint | Tham số chính |
|--------|----------|---------------|
| GET | `/folder-cache` | `key, root, mode=path\|random\|top\|search\|folders, path, q, limit, offset, useDb` |
| GET | `/next-chapter` | `key, root, path, dir=next\|prev` |
| POST | `/scan` | `{ key, root }` |
| DELETE | `/reset-cache` | `?key&root&mode=delete\|reset` |
| DELETE | `/reset-cache/all` | `?key` |
| GET / POST | `/favorite` | GET `?key&root` · POST `{ dbkey, path, value }` |
| GET / POST | `/root-thumbnail` | `key, root[, thumbnail]` |
| GET | `/pdf` | `key, root, path` (stream PDF) |
| DELETE | `/delete-item` | body `{ dbkey, root, path }` (chỉ xoá DB) |

**Movie — `/api/movie`**

| Method | Endpoint | Tham số chính |
|--------|----------|---------------|
| GET | `/movie-folder` | `key, path` (con trực tiếp) |
| GET | `/video` | `key, file` — stream từ ổ đĩa, hỗ trợ Range (cả `bytes=-N`) |
| GET | `/movie-folder-empty` | `key` |
| GET | `/video-cache` | `key, mode=random\|top\|search, type=file\|folder\|all, q, limit, offset` |
| POST | `/scan-movie` | `{ key, path?, shallow? }` |
| DELETE | `/reset-cache-movie` | `?key&mode=delete\|reset` |
| GET / POST | `/favorite-movie` | GET `?key` · POST `{ dbkey, path, value }` |
| POST | `/extract-thumbnail` | `{ key, path, overwrite }` |
| POST | `/folder-thumbnail` | `{ key, folderPath, srcPath }` |
| DELETE | `/delete-item` | body `{ key, path }` |

**Music — `/api/music`**

| Method | Endpoint | Tham số chính |
|--------|----------|---------------|
| GET | `/music-folder` | `key, path` (kèm artist/album/genre/lyrics) |
| GET | `/audio` | `key, file` — stream từ ổ đĩa, Range |
| GET | `/download` | `key, file` — `Content-Disposition: attachment` |
| GET | `/audio-cache` | `key, mode=random\|top\|search, type, q, limit, offset` (search theo tên + artist/album/title) |
| GET | `/music-meta` | `key, path` |
| POST | `/update-lyrics` | `{ key, path, lyrics }` |
| POST | `/scan-music` | `{ key, path?, shallow? }` |
| DELETE | `/reset-cache-music` | `?key&mode=delete\|reset` — `delete` xoá cả playlist; `reset` giữ playlist (nối theo `songPath`) |
| POST | `/extract-thumbnail` | `{ key, path, overwrite }` |
| POST | `/folder-thumbnail` · `/playlist-thumbnail` | `{ key, folderPath\|playlistId, srcPath }` |
| GET | `/playlists` | `key[, songPath]` (cờ `hasTrack`) |
| GET | `/playlist/:id` | `key` |
| POST | `/playlist` | `{ key, name, description }` |
| POST | `/playlist/add` · `/playlist/add-multiple` | `{ key, playlistId, path \| paths[] }` |
| DELETE | `/playlist/remove` · `/playlist/remove-multiple` | `{ key, playlistId, path \| paths[] }` |
| DELETE | `/playlist` | `{ key, id }` |
| PATCH | `/playlist/order` | `{ key, playlistId, order[] }` |
| DELETE | `/delete-item` | `{ key, path }` (xoá cả songs + playlist_items) |

**Media — `/api/media`**

| Method | Endpoint | Tham số chính |
|--------|----------|---------------|
| POST | `/scan-media` | `{ key, path?, shallow? }` |
| GET | `/media-folders` | `key, path` — điều hướng thư mục |
| GET | `/media-folder` | `key, page, limit, sortBy, order, type, year, month, favorite, albumId` (+ timeline) |
| POST | `/favorite-media` | `{ key, id, isFavorite }` |
| POST | `/set-thumbnail` | `{ key, id, thumbnail }` |
| POST | `/reset-media-db` | `{ key }` (xoá cả album) |
| GET | `/cache/:filename` | `key` |
| DELETE | `/delete-item` | `{ key, path }` |
| GET / POST | `/albums` | `key` · `{ key, name, description }` |
| PUT / DELETE | `/albums/:id` | `{ key, name, description, coverImage }` · `{ key }` |
| POST / DELETE | `/albums/:id/items` | `{ key, itemIds[] }` |
| GET | `/stats` | `key` |

---

## 5. React app (`react-app/`)

### 5.1 Công nghệ

React 18 · React Router 6 · Vite 4 · TailwindCSS 3 · Zustand 4 (persist) · TanStack Query 4 (chỉ dùng ở vài hook) · axios · framer-motion · lucide-react **và** react-icons · react-hot-toast · react-modal · embla-carousel · date-fns · use-debounce.

### 5.2 Routing (`src/App.jsx`)

| Route | Trang | Layout |
|-------|-------|--------|
| `/` | `Home` (chọn nguồn, login key bảo mật) | Layout |
| `/manga/select` · `/manga` · `/manga/favorites` | Chọn root · duyệt · yêu thích | Layout |
| `/manga/reader[/:folderId]` | `MangaReader` (ảnh + PDF, dọc/ngang, tải offline) | Toàn màn hình |
| `/movie` · `/movie/favorites` | Duyệt · yêu thích | Layout |
| `/movie/player` | `MoviePlayer` | Toàn màn hình |
| `/music` · `/music/playlists` | Duyệt · danh sách playlist | Layout |
| `/music/player` | `MusicPlayer` (v1) hoặc `MusicPlayerV2` (desktop + setting `playerUI='v2'`) | Toàn màn hình |
| `/media` | `MediaHome` (grid/timeline/album/folder, lightbox) | Layout |
| `/settings` | `Settings` | Layout |
| `/downloads` | `DownloadManager` (hàng đợi tải chapter) | Layout |
| `/offline`, `/offline/manga` · `/movie` · `/music` | Thư viện offline (movie/music mới là placeholder "đang phát triển") | Layout |
| `*` | `NotFound` | Layout |

`PlaylistModal` được mount toàn cục. Không có route cho `PlaylistDetail.jsx`.

### 5.3 State (Zustand)

| Store | Persist key | Nội dung chính |
|-------|-------------|----------------|
| `useAuthStore` | `auth-storage` | `sourceKey`, `rootFolder`, `token`, last key theo loại, `secureKeys` |
| `useUIStore` | — | dark mode, sidebar, search modal, toast |
| `useMangaStore` | `manga-storage` | danh sách folder, favorites, `readerSettings`, `mangaSettings` (useDb, lazyLoad, recent…) |
| `useMovieStore` | `movie-storage` | movieList, favorites, playerSettings |
| `useMusicStore` | `music-storage` | musicList, player state (track, playlist, shuffle, repeat), `playerSettings.playerUI` |
| `useSharedSettingsStore` | `shared-settings-storage` | tiện ích xoá cache/recent |
| `useDownloadQueueStore` | `download-queue-storage` | tasks (Map → mảng), stats, settings (max 2 tải song song) |

### 5.4 Lớp dữ liệu

- `utils/api.js`: axios instance, tự gắn `Authorization: Bearer` + `x-secure-token` từ `localStorage.userToken`; dedupe request GET đang bay; cache 1,5s cho `manga.getFolders`; 401 → xoá token và chuyển về `/`.
- **Song song** có ~30 lời gọi `fetch()` trực tiếp (playlist, increase-view, lyrics, worker tải chapter…) **không gắn token**.
- Cache phía client nằm ở `localStorage` (`constants/cacheKeys.js`, `utils/mangaCache.js`, `utils/favoriteCache.js`, các hook random/recent/top-view).
- `/api/source-keys.js` trả về JavaScript; `Home.jsx` phân tích bằng regex rồi `JSON.parse`.

### 5.5 Offline & PWA

| Thành phần | Vai trò |
|------------|---------|
| `public/sw.js` (v3.1.0) | Cache-first cho `/default/*`; network-first (timeout 5s) cho **mọi GET `/api/*`** trừ PDF; ảnh (`request.destination === 'image'`) ưu tiên `chapter-images`; điều hướng: network-first, fallback app shell; message `GET_CACHE_INFO`, `CLEAR_CACHE`, background sync. |
| `utils/offlineLibrary.js` | IndexedDB `offline-manga` / store `chapters` (metadata) + Cache Storage `chapter-images` (ảnh). Tải trực tiếp từ `MangaReader`. |
| `store/downloadQueueStore.js` + `workers/downloadWorker.js` | Hàng đợi tải chapter: chunk 2 ảnh, nghỉ 100ms, tối đa 2 task, pause/resume/retry, lưu metadata vào IndexedDB. (Tên "worker" nhưng chạy trên main thread, không phải Web Worker.) |
| `utils/storageQuota.js` | Kiểm tra `navigator.storage.estimate()` trước khi tải; ngưỡng cảnh báo. |
| `utils/musicDownloadQueue.js` | Tải bài hát **về máy** (blob + thẻ `<a download>`), không phải thư viện offline. |

### 5.6 Các file lớn nhất (điểm nóng bảo trì)

| File | Dòng |
|------|-----:|
| `pages/manga/MangaReader.jsx` | 2.318 |
| `pages/Settings.jsx` | 1.848 |
| `pages/music/MusicPlayer.jsx` | 1.377 |
| `store/index.js` | 1.077 |
| `styles/components/download-manager.css` | 1.047 |
| `pages/movie/MoviePlayer.jsx` | 807 |
| `pages/music/MusicPlayerV2.jsx` | 788 |
| `components/common/SettingsModal.jsx` | 776 |

---

## 6. Frontend legacy (`frontend/`)

Vanilla JS (ES modules) + esbuild (`scripts/build.js`, `npm run dev:frontendv1`). Backend vẫn serve nó: `/` trả `frontend/public/home.html` ở **dev mode**, SPA fallback ở dev trả `frontend/public/manga/index.html`. Theo `Promt.md`, toàn bộ logic đã/đang được chuyển sang React; thư mục này không còn được phát triển. `frontend/styles/components/readerSettingsModal.css` là bản trùng của `frontend/src/styles/components/readerSettingsModal.css`.

---

## 7. Luồng nghiệp vụ chính

1. **Chọn nguồn** — `Home.jsx` tải `/api/source-keys.js` + `/api/security-keys.js`; nếu key nằm trong `SECURITY` → `LoginModal` gọi `/api/login`, token lưu ở `localStorage.userToken` và `auth-storage`, cookie `ms_auth` dùng cho file tĩnh. Vào lại Home thì token và cookie bị xoá (`/api/logout`).
2. **Manga** — `/manga/select` gọi `/api/list-roots` → chọn root → `MangaHome` gọi `folder-cache?mode=path&useDb=1` → khi thư mục chỉ chứa ảnh (`type: 'reader'`) chuyển sang `MangaReader` (prefetch qua `readerPrefetch`). PDF dùng `/api/manga/pdf`. Đếm view qua `POST /api/increase-view`.
3. **Movie/Music** — duyệt bằng `movie-folder` / `music-folder` (dữ liệu từ DB, cần scan trước); phát qua `/api/movie/video` / `/api/music/audio` (Range); slider random/top/recent qua `video-cache` / `audio-cache` + cache localStorage.
4. **Media** — `media-folders` để duyệt thư mục, `media-folder` cho grid/timeline có phân trang; file tĩnh qua `/media/<path>`.
5. **Quản trị DB** — `DatabaseActions` (sidebar/settings): scan (toàn phần/partial/shallow qua `ScanModal`), xoá/reset DB, extract thumbnail.
6. **Offline** — tải chapter (trực tiếp hoặc qua `/downloads`), đọc lại ở `/offline/manga`; SW phục vụ ảnh từ `chapter-images`.

---

## 8. Build, chạy & triển khai

| Lệnh (root) | Tác dụng |
|-------------|----------|
| `npm install` | Cài cả 2 workspace |
| `npm run dev` | `concurrently` backend (nodemon, :3000) + Vite (:3001, proxy) |
| `npm run build` / `build:prod` | Build React vào `react-app/dist` (`build:prod` đặt `NODE_ENV=production` bằng `set "…"` của Windows; trên shell POSIX lệnh `set` vô hại và Vite mặc định production) |
| `npm run prod` | build:prod + `NODE_ENV=production node server.js` (một cổng :3000) |
| `npm run dev:frontendv1` | Build frontend legacy |
| `npm run lint` | **Không chạy được** — repo không có file cấu hình ESLint |

Yêu cầu môi trường: **Node 20 hoặc ≥ 22** (`engines` trong `package.json` ghi ≥16 nhưng `lru-cache@11`, `glob@11`, `cross-env@10` yêu cầu `20 || >=22`), **ffmpeg trong PATH** cho extract thumbnail movie, Tailscale + mkcert nếu truy cập từ xa bằng HTTPS. Không có test tự động và không có CI. Hướng dẫn cài đặt từng bước: [readme.md](../readme.md).

---

## 9. Đánh giá tổng quan

**Điểm mạnh**
- Phạm vi tính năng rộng, UX phong phú (reader offline, playlist, gallery, ExoPlayer bridge).
- Mỗi nguồn một DB SQLite → đơn giản, dễ backup/xoá.
- Scanner mark & sweep có partial scan, tránh quét lại metadata khi file không đổi.
- Service worker thận trọng với dữ liệu người dùng (không xoá `chapter-images` khi nâng version).
- Ghi chép thay đổi rất chi tiết (`CHANGELOG.md`).

**Điểm yếu chính** (chi tiết trong [ISSUES-REPORT.md](ISSUES-REPORT.md))
- Bảo mật: CORS chấp nhận mọi `*.ts.net`, static cho đọc dotfile, các lời gọi `fetch()` trực tiếp không gắn token. *(Đã sửa ngày 2026-11-04: path traversal, SQL injection ở `media-folder`, bypass whitelist bằng `X-Forwarded-For`, static không kiểm tra nguồn bảo mật, mật khẩu dùng làm token, `dbkey` lọt qua middleware — ISSUES S1–S7.)*
- Tính đúng: nhiều lời gọi frontend tới endpoint không tồn tại hoặc sai tham số (set thumbnail movie, các method playlist trong `api.js`), reset/xoá DB media làm mất album. *(Đã sửa: shallow + partial scan xoá nhầm, `LIKE` không escape, nút Quét Manga, reset không chờ scan, reset music xoá playlist, chapter offline thiếu trang vẫn báo hoàn tất — ISSUES D1, B13, B1, B2, D2, D3.)*
- Bảo trì: component quá lớn, logic trùng lặp (2 music player, 2 luồng tải chapter, 4 bản `findThumbnail`), ~6.700 dòng dead code, 500+ `console.*`, không có lint/test/CI.
