# 📊 PHÂN TÍCH TOÀN BỘ BACKEND - MEDIA SERVER

> **Cập nhật 2026-10-29** (đối chiếu code tại commit `a511bcd`): thêm Media Gallery (`MEDIA_*`), cập nhật cây thư mục, danh mục API, trạng thái thật của rate limiter và các lớp bảo mật. Các module không còn được dùng được đánh dấu *(UNUSED)*. Lỗi/rủi ro: [ISSUES-REPORT.md](ISSUES-REPORT.md) · tổng quan: [SYSTEM-REPORT.md](SYSTEM-REPORT.md).

## 🎯 TỔNG QUAN DỰ ÁN

### Mục đích chính:
**Media Server cá nhân** quản lý 4 loại nội dung: **Manga**, **Movie**, **Music**, **Media Gallery**
- Đọc truyện manga từ thư mục hình ảnh và file PDF
- Xem phim từ thư mục video
- Nghe nhạc từ thư mục audio (playlist, lyrics, tải về)
- Thư viện ảnh/video kiểu Google Photos (album, timeline, mọi loại file)
- Hỗ trợ tính năng yêu thích, tìm kiếm, thống kê lượt xem

### Kiến trúc Backend:
- **Node.js** + **Express 5** server
- **SQLite** databases để cache metadata 
- **ffprobe-static** (duration và kích thước video; kích thước ảnh JPEG/PNG/GIF/WebP/BMP đọc thẳng từ đầu file bằng `utils/imageSize.js`, chỉ định dạng khác mới dùng ffprobe) + **ffmpeg** trong PATH (chụp thumbnail video)
- **Music-metadata** để đọc thông tin nhạc
- **Better-sqlite3** làm database driver

---

## 🏗️ TỔNG QUAN DỰ ÁN

### 📋 Thông tin Cơ bản
- **Tên dự án**: MainWebSite Backend - Media Server
- **Phiên bản**: 5.0.0
- **Mô tả**: Server backend quản lý media local cho manga, movie, music
- **Kiến trúc**: RESTful API Server với Express.js
- **Database**: SQLite với better-sqlite3 driver
- **Port**: 3000 (Backend API)
- **Runtime**: Node.js (compatible với version mới nhất)
- **Entry Point**: server.js

### 📁 Cấu trúc Thư mục
```
backend/
├── 📄 server.js                    # Entry point: middleware, static mounts, SPA fallback, HTTPS
├── 📄 constants.js                 # FILE_EXTENSIONS, SECURITY, API_RESPONSE… (một phần không dùng)
├── 📄 package.json                 # Dependencies & scripts
├── 📄 .env                         # Cấu hình (BẮT BUỘC, copy từ .env.template)
├── 📄 .env.template
│
├── 📁 api/
│   ├── 📄 health.js                # GET/HEAD /api/health
│   ├── 📄 increase-view.js         # Tăng/xoá lượt xem manga, movie, music
│   ├── 📄 log.js                   # POST /api/log (log từ client)
│   ├── 📁 manga/
│   │   ├── 📄 delete-item.js       # Xoá folder khỏi DB
│   │   ├── 📄 favorite.js          # Favorites
│   │   ├── 📄 folder-cache.js      # API chính: path/random/top/search/folders + next-chapter
│   │   ├── 📄 pdf.js               # Stream PDF
│   │   ├── 📄 reset-cache.js       # Xoá/reset DB theo root
│   │   ├── 📄 root-thumbnail.js    # Thumbnail cho root
│   │   └── 📄 scan.js              # Scan manga
│   ├── 📁 movie/
│   │   ├── 📄 delete-item.js
│   │   ├── 📄 extract-movie-thumbnail.js # ffmpeg chụp frame
│   │   ├── 📄 favorite-movie.js
│   │   ├── 📄 movie-folder-empty.js
│   │   ├── 📄 movie-folder.js      # Duyệt thư mục (từ DB)
│   │   ├── 📄 reset-movie-db.js
│   │   ├── 📄 scan-movie.js        # Full/partial/shallow scan
│   │   ├── 📄 set-thumbnail.js     # POST /folder-thumbnail
│   │   ├── 📄 video-cache.js       # random/top/search
│   │   └── 📄 video.js             # Stream video (Range, đọc thẳng từ ổ đĩa)
│   ├── 📁 music/
│   │   ├── 📄 audio-cache.js, audio.js, download.js
│   │   ├── 📄 delete-item.js, extract-thumbnail.js, music-folder.js, music-meta.js
│   │   ├── 📄 playlist.js          # CRUD playlist + reorder
│   │   ├── 📄 reset-music-db.js, scan-music.js
│   │   ├── 📄 set-thumbnail.js     # /folder-thumbnail, /playlist-thumbnail
│   │   └── 📄 update-lyrics.js
│   └── 📁 media/                   # Media Gallery
│       ├── 📄 album-manager.js, delete-item.js, favorite-media.js
│       ├── 📄 media-cache.js, media-folder.js, media-folders.js, media-stats.js
│       └── 📄 reset-media-db.js, scan-media.js, set-thumbnail.js
│
├── 📁 data/                        # <KEY>.db cho mỗi nguồn (gitignored)
│
├── 📁 middleware/
│   ├── 📄 auth.js                  # Whitelist IP / reverse-DNS hostname
│   ├── 📄 cors.js                  # CORS (dev/prod, *.ts.net)
│   ├── 📄 errorHandler.js          # Global error handler
│   ├── 📄 index.js                 # Thứ tự middleware
│   ├── 📄 rateLimiter.js           # Có code nhưng ĐANG TẮT
│   └── 📄 security.js              # Token cho key thuộc SECURITY
│
├── 📁 routes/
│   ├── 📄 index.js                 # mount manga / movie / music / media / system
│   ├── 📄 manga.js, movie.js, music.js, media.js
│   └── 📄 system.js                # health, login, source-keys.js, security-keys.js, list-roots, increase-view
│
├── 📁 services/
│   └── 📄 MediaService.js          # (UNUSED – require file BaseScanner không tồn tại)
│
└── 📁 utils/
    ├── 📄 cache-scan.js            # Manga scanner (sync)
    ├── 📄 config.js                # Đọc .env, ROOT_PATHS, SECURITY
    ├── 📄 corsUtils.js, stringUtils.js
    ├── 📄 db.js                    # getDB / getMovieDB / getMusicDB / getMediaDB + migration
    ├── 📄 folder-loader.js         # Đọc folder manga từ DB hoặc đĩa
    ├── 📄 imageUtils.js            # findFirstImageRecursively, hasImageRecursively
    ├── 📄 movie-scan.js, music-scan.js, media-scan.js
    ├── 📄 responseHelpers.js       # (chỉ update-lyrics dùng)
    ├── 📄 DatabaseManager.js       # (UNUSED)
    ├── 📄 databaseUtils.js         # (UNUSED)
    ├── 📄 scan-logger.js           # (UNUSED)
    └── 📄 thumbnailUtils.js        # (UNUSED)
```

### 🔧 Công nghệ Sử dụng

#### Core Framework
- **Node.js**: Runtime environment hiện đại
- **Express.js 5.1.0**: Web framework cho RESTful APIs
- **better-sqlite3 11.9.1**: SQLite database driver (synchronous, high performance)
- **compression 1.7.4**: Gzip compression middleware
- **cors 2.8.5**: Cross-Origin Resource Sharing middleware

#### Media Processing
- **fluent-ffmpeg 2.1.3**: Video/audio processing wrapper cho FFmpeg
- **ffprobe-static 3.1.0**: Video metadata extraction (static binary)
- **music-metadata 11.2.3**: Audio metadata extraction (ID3, FLAC, OGG tags)
- **serve-favicon 2.5.0**: Favicon serving middleware

#### File System & Utilities
- **glob 11.0.3**: File pattern matching và directory traversal
- **mime-types 3.0.1**: MIME type detection cho file serving
- **string-natural-compare 3.0.1**: Natural string sorting (1, 2, 10 thay vì 1, 10, 2)
- **dotenv 16.5.0**: Environment variable management

#### Performance & Caching
- **lru-cache 11.1.0**: Còn trong `package.json` nhưng **không còn được dùng** (cache RAM video/audio đã bỏ 2026-11-04, ISSUES P1)
- **axios 1.9.0**: HTTP client cho external requests (nếu cần)

#### UI & Interaction (Backend side)
- **hammerjs 2.0.8**: Touch gesture support cho mobile clients

#### Development Tools
- **esbuild 0.19.0**: Fast JavaScript bundler (dev dependency)
- **nodemon**: Development auto-restart (thường global install)

---

## 🚀 WORKFLOW CHÍNH

### 1. 🏠 Server Startup Flow
```
.env Loading → Config Validation → Database Initialization → Middleware Setup → Route Mounting → Server Start
```

**Chi tiết quá trình:**
1. **Environment Loading**: Đọc `.env` file qua `config.js`
2. **Path Validation**: Kiểm tra tất cả media paths có tồn tại
3. **Database Setup**: Khởi tạo SQLite connections cho từng source
4. **Middleware Stack**: Auth → Security → Rate Limiting → CORS → Compression
5. **Route Registration**: Mount tất cả API routes (`/api/manga`, `/api/movie`, `/api/music`)
6. **Static Serving**: Setup static file serving cho media files
7. **Server Listen**: Start listening trên port 3000

### 2. 📚 Content Scanning Workflow
```
Manual Trigger → Recursive Folder Scan → Metadata Extraction → Database Storage → Thumbnail Generation
```

**Chi tiết cho từng content type:**

#### Manga Scanning:
1. **API Call**: `POST /api/manga/scan {root, key}`
2. **Folder Traversal**: `cache-scan.js` → `scanFolderRecursive()`
3. **Image Detection**: `imageUtils.js` → `findFirstImageRecursively()`
4. **Metadata Collection**: name, path, imageCount, chapterCount
5. **Database Insert**: Save to `folders` table với thumbnail URL
6. **Statistics Return**: inserted/updated/skipped counts

#### Movie Scanning:
1. **API Call**: `POST /api/movie/scan-movie {key}`
2. **File Discovery**: Scan for video files (.mp4, .mkv, .avi, etc.)
3. **FFprobe Extraction**: Duration, resolution, bitrate
4. **Thumbnail Search**: Check `.thumbnail/` folders
5. **Database Storage**: Both folders và video files
6. **Size Calculation**: File size và modification time

#### Music Scanning:
1. **API Call**: `POST /api/music/scan-music {key}`
2. **Audio Discovery**: Scan for audio files (.mp3, .flac, .wav, etc.)
3. **Metadata Extraction**: Artist, album, genre, lyrics via `music-metadata`
4. **Dual Storage**: `folders` table + `songs` table
5. **Playlist Support**: Auto-generate album playlists

### 3. 🌐 Content Browsing Workflow
```
API Request → Path Resolution → Cache Check → Data Loading → Response Formatting → Client Delivery
```

**Browse flow detail:**
1. **Request**: `GET /api/manga/folder-cache?mode=path&key=ROOT_FANTASY&root=1&path=Naruto`
2. **Auth Check**: Middleware validation (IP, security token)
3. **Path Resolution**: `config.js` → convert key to real file path
4. **Mode Routing**: path|random|search|top|folders
5. **Data Source**: Database cache hoặc disk scan
6. **Response Format**: JSON với folders array + images array
7. **Caching**: Set HTTP cache headers

### 4. 📺 Media Streaming Workflow
```
Stream Request → Path Validation → File Access → Range Processing → Chunk Delivery
```

**Streaming process:**
1. **Request**: `GET /api/movie/video?key=V_MOVIE&file=Avatar/avatar.mp4`
2. **Security**: Check source access permissions
3. **Path Resolve**: Convert logical path to physical file path
4. **Range Support**: Parse HTTP Range header cho seeking
5. **Stream Setup**: CreateReadStream với proper MIME headers
6. **Chunked Delivery**: Stream file chunks to client

### 5. ❤️ Favorites Management Workflow
```
Toggle Request → Current State Check → Database Update → Cache Invalidation → Response
```

**Favorite toggle process:**
1. **Request**: `POST /api/manga/favorite {dbkey, path, value}`
2. **Current Check**: Query existing favorite status
3. **Database Transaction**: Insert/update/delete favorite record
4. **Timestamp**: Record favoriteAt time
5. **Cache Clear**: Invalidate related cache entries
6. **Response**: Return updated favorite status

---

## 📁 CẤU TRÚC FILE THEO MỨC ĐỘ QUAN TRỌNG

### 🏗️ **ROUTING ARCHITECTURE** (Centralized)

#### **Current Structure (v5.0.0+):**
```javascript
// server.js - Single route mount
app.use("/api", require("./routes"));
```

#### **Routes Organization:**
```
routes/
├── index.js    → Main router, mounts all sub-routes
├── manga.js    → All manga endpoints (/api/manga/*)
├── movie.js    → All movie endpoints (/api/movie/*)
├── music.js    → All music endpoints (/api/music/*)
├── media.js    → All media gallery endpoints (/api/media/*)
└── system.js   → System endpoints (/api/login, /api/source-keys.js, etc.)
```

#### **Benefits:**
- ✅ **Clean server.js**: Giảm từ 25+ dòng routes xuống 1 dòng
- ✅ **Modular organization**: Mỗi domain có file riêng
- ✅ **Easy maintenance**: Tìm endpoint dễ hơn
- ✅ **Scalable**: Thêm route mới không làm phình server.js

#### **Route Mapping:**
```javascript
// routes/index.js
router.use("/manga", require("./manga"));     // /api/manga/*
router.use("/movie", require("./movie"));     // /api/movie/*  
router.use("/music", require("./music"));     // /api/music/*
router.use("/media", require("./media"));     // /api/media/*
router.use("/", require("./system"));         // /api/login, /api/*
```

#### **API Handler Integration:**
- Individual handlers ở `api/` folder vẫn giữ nguyên
- Routes chỉ import và mount các handlers
- Không thay đổi business logic

### 🔴 **CORE FILES (Cực kỳ quan trọng)**

#### 1. **server.js** - Entry Point chính
**Chức năng:** Khởi tạo Express server, cấu hình middleware, routes
**Nhiệm vụ:**
- Cấu hình CORS cho phép frontend truy cập
- Setup middleware bảo mật (auth, security, rate limiting)
- Mount tất cả API routes cho manga/movie/music
- Serve static files (ảnh, video, audio)
- Cấu hình cache headers cho performance
- Handle URL decoding cho tên file có ký tự đặc biệt

**Ảnh hưởng:** Toàn bộ hệ thống phụ thuộc vào file này

#### 2. **utils/config.js** - Cấu hình môi trường
**Chức năng:** Đọc và xử lý biến môi trường từ file .env
**Nhiệm vụ:**
- Parse file .env để lấy đường dẫn thư mục media
- Xác định các source keys (ROOT_, V_, M_)
- Quản lý security keys và password
- Validate và filter các đường dẫn hợp lệ

**Functions quan trọng:**
- `getRootPath(key)`: Lấy đường dẫn thật từ key
- `getAllMangaKeys()`: Lấy tất cả manga sources
- `getAllMovieKeys()`: Lấy tất cả movie sources  
- `getAllMusicKeys()`: Lấy tất cả music sources

**Ảnh hưởng:** Mọi API đều dùng file này để resolve đường dẫn

#### 3. **utils/db.js** - Database Manager
**Chức năng:** Quản lý kết nối SQLite database
**Nhiệm vụ:**
- Tạo database instances cho từng source key
- Khởi tạo schema tables (folders, views, songs, playlists)
- Handle column migrations khi upgrade
- Quản lý 3 loại DB: manga (getDB), movie (getMovieDB), music (getMusicDB)

**Schema chính:**
```sql
-- Bảng folders: Cache metadata của tất cả files/folders
folders (id, root, name, path, thumbnail, type, isFavorite, viewCount, createdAt, updatedAt)

-- Bảng views: Thống kê lượt xem manga
views (root, path, count)

-- Bảng songs: Metadata nhạc (artist, album, genre, lyrics)
songs (id, path, artist, album, genre, lyrics)

-- Bảng playlists: Danh sách phát nhạc
playlists (id, name, description, thumbnail)
playlist_items (playlistId, songPath, sortOrder)
```

**Ảnh hưởng:** Tất cả API đọc/ghi data đều phụ thuộc vào file này

### 🟡 **MIDDLEWARE FILES (Quan trọng)**

#### 4. **middleware/auth.js** - Xác thực IP/Hostname
**Chức năng:** Kiểm soát truy cập based on IP và hostname
**Nhiệm vụ:**
- Cho phép IP nội bộ LAN (hiện tại = true cho tất cả)
- Kiểm tra reverse DNS lookup cho Tailscale domains
- Block truy cập từ IP/hostname không được phép

**Ảnh hưởng:** Security layer đầu tiên của toàn bộ hệ thống

#### 5. **middleware/security.js** - Bảo vệ Source có mật khẩu
**Chức năng:** Kiểm tra token cho các source được bảo vệ
**Nhiệm vụ:**
- Skip check cho `/api/login`, `/api/logout`, file `.html` và điều hướng trang không thuộc `/api` (`Accept: text/html` — để F5 ở trang có `?key=<nguồn bảo mật>` vẫn ra trang app, AUDIT-2026-11-09 R1)
- Request có `key`/`dbkey` thuộc `SECURITY` phải có token hợp lệ: `x-secure-token`, `Authorization: Bearer`, `?token=` hoặc body `token`
- Token là HMAC tính từ `SECURITY_PASSWORD` + `backend/data/.auth-secret` (`utils/authToken.js`), không phải mật khẩu (ISSUES S5)

**Ảnh hưởng:** Bảo vệ các source nhạy cảm (SECURITY keys trong .env)

#### 6. **middleware/rateLimiter.js** - Giới hạn request rate
**Chức năng:** Ngăn spam/DoS attacks
**Nhiệm vụ:**
- **Đang tắt** (`ENABLE_RATE_LIMIT = false` trong `middleware/index.js`), xem Layer 3 bên dưới
- Nếu bật: 50.000 request / 15 phút / IP (`constants.SECURITY.RATE_LIMIT`), tự dọn entry hết hạn, trả header rate limit
- Đăng nhập có giới hạn riêng: 10 lần sai / 15 phút / IP → 429 (`routes/system.js`)

#### 7. **middleware/errorHandler.js** - Xử lý lỗi toàn cục
**Chức năng:** Centralized error handling
**Nhiệm vụ:**
- Catch và format errors thành JSON response
- Log errors chi tiết cho debugging
- Handle specific error types (ENOENT, EACCES, etc.)

### 🟢 **CORE UTILITIES (Rất quan trọng)**

#### 8. **utils/folder-loader.js** - Core Logic đọc folders
**Chức năng:** Đọc cấu trúc thư mục từ disk hoặc database
**Nhiệm vụ chính:**

**Functions:**
- `loadFolderFromDisk()`: Đọc trực tiếp từ ổ đĩa (cho mode=path mới)
- `loadFolderFromDB()`: Đọc từ cache database (cho mode=path cached)  
- `loadMovieFolderFromDisk()`: Đọc folders + video files cho movie

**Đặc điểm:**
- Sắp xếp theo natural compare (1, 2, 10 thay vì 1, 10, 2)
- Generate safe URLs với encodeURIComponent
- Filter chỉ file types hợp lệ (.jpg, .png cho manga; .mp4, .mkv cho movie)

**Ảnh hưởng:** Tất cả APIs browse folders đều dùng functions này

#### 9. **utils/imageUtils.js** - Xử lý ảnh thumbnail
**Chức năng:** Tìm và xử lý ảnh thumbnail
**Nhiệm vụ:**

**Functions:**
- `findFirstImageRecursively()`: Tìm ảnh đầu tiên trong folder/subfolder đệ quy
- `hasImageRecursively()`: Check folder có chứa ảnh không

**Logic:**
- Duyệt files trước, folders sau (để lấy cover.jpg trong root trước)
- Generate URL public với encoding phù hợp
- Support multiple image formats (.jpg, .png, .webp, .avif)

**Ảnh hưởng:** Scan functions và thumbnail generation dựa vào đây

#### 10. **utils/cache-scan.js** - Scan folders cho Manga
**Chức năng:** Quét và cache metadata folders vào database
**Nhiệm vụ:**

**Function chính:**
- `scanFolderRecursive(dbkey, root, currentPath, stats)`: Đệ quy scan toàn bộ folders

**Logic:**
- Chỉ scan folders có chứa ảnh (skip folders rỗng)
- Thu thập otherName từ folders con rỗng làm alias
- Update thumbnail nếu lastModified mới hơn
- Đếm imageCount và chapterCount cho mỗi folder
- Return stats: inserted/updated/skipped/scanned

**Ảnh hưởng:** API `/scan` manga dựa vào function này

#### 11. **utils/movie-scan.js** - Scan folders cho Movie  
**Chức năng:** Quét và cache metadata movie folders + video files
**Nhiệm vụ:**

**Function chính:**
- `scanMovieFolderToDB(dbkey, currentPath, stats)`: Đệ quy scan movies

**Logic:**
- Scan cả folders và video files (.mp4, .mkv, .avi, .webm, .ts, .wmv)
- Tìm thumbnail trong `.thumbnail/` folder với tên trùng khớp
- Extract duration bằng FFprobe
- Lưu file size và modification time

**Ảnh hưởng:** API `/scan-movie` dựa vào function này

#### 12. **utils/music-scan.js** - Scan folders cho Music
**Chức năng:** Quét và cache metadata music folders + audio files  
**Nhiệm vụ:**

**Function chính:**
- `scanMusicFolderToDB(dbkey, currentPath, stats)`: Đệ quy scan music

**Logic:**
- Scan cả folders và audio files (.mp3, .flac, .wav, .aac, .m4a, .ogg, .opus, .wma, .alac, .aiff)
- Extract metadata: artist, album, genre, lyrics, duration
- Tìm thumbnail trong `.thumbnail/` folder
- Lưu vào cả bảng `folders` và `songs`

**Ảnh hưởng:** API `/scan-music` dựa vào function này

---

## 🔌 API ENDPOINTS CHÍNH

Danh mục đầy đủ (method, endpoint, tham số) đã đối chiếu với code nằm ở [SYSTEM-REPORT.md – mục 4.5](SYSTEM-REPORT.md). Tóm tắt:

| Nhóm | Endpoint chính |
|------|----------------|
| System `/api` | `health`, `login`, `source-keys.js`, `security-keys.js`, `list-roots`, `increase-view` (+ `/movie`, `/music`, `/all`), `log` |
| Manga `/api/manga` | `folder-cache` (mode `path` · `random` · `top` · `search` · `folders`), `next-chapter`, `scan`, `reset-cache`, `reset-cache/all`, `favorite`, `root-thumbnail`, `pdf`, `delete-item` |
| Movie `/api/movie` | `movie-folder`, `video`, `movie-folder-empty`, `video-cache`, `scan-movie`, `reset-cache-movie`, `favorite-movie`, `extract-thumbnail`, `folder-thumbnail`, `delete-item` |
| Music `/api/music` | `music-folder`, `audio`, `download`, `audio-cache`, `music-meta`, `update-lyrics`, `scan-music`, `reset-cache-music`, `extract-thumbnail`, `folder-thumbnail`, `playlist-thumbnail`, `playlists`, `playlist` (+ `/:id`, `/add`, `/add-multiple`, `/remove`, `/remove-multiple`, `/order`), `delete-item` |
| Media `/api/media` | `scan-media`, `media-folders`, `media-folder`, `favorite-media`, `set-thumbnail`, `reset-media-db`, `cache/:filename`, `delete-item`, `albums` (+ `/:id`, `/:id/items`), `stats` |

Lưu ý quan trọng:
- `scan-movie`, `scan-music`, `scan-media` nhận `{ key, path?, shallow? }` (partial/shallow scan); `manga/scan` chỉ nhận `{ key, root }`.
- Tên tham số không thống nhất: manga `favorite`/`delete-item`, `favorite-movie` và `increase-view` (manga) dùng **`dbkey`**, phần còn lại dùng **`key`**. Middleware bảo mật đọc cả hai (ISSUES S6, đã sửa 2026-11-04).
- `video`, `audio`, `download` nhận `file` là đường dẫn tương đối; path ra ngoài root bị từ chối bằng `resolveInsideRoot` → 403 (ISSUES S1, đã sửa 2026-11-04).

---

## ⚙️ CONFIGURATION & ENVIRONMENT

### 📄 **.env** - File cấu hình chính
**Sections:**

**Media Paths:**
```bash
# Manga sources (ROOT_ prefix)
ROOT_FANTASY=E:\File\Manga
ROOT_MANGAH=G:\0
ROOT_DOW=D:\manga
ROOT_TEST=E:\Download

# Movie sources (V_ prefix)  
V_ANIME=E:\DATA\Anime
V_MOVIE=E:\File\Videos
V_JAVA=E:\DATA\JAVA
V_ANIMEH=E:\DATA\HEN

# Music sources (M_ prefix)
M_MUSIC=E:\DATA\music
```

**Security:**
```bash
# Sources cần password (empty = không bảo vệ)
SECURITY=
# SECURITY=ROOT_MANGAH,V_JAVA,V_ANIMEH
SECURITY_PASSWORD=123456
```

**Media Gallery:**
```bash
# Media sources (MEDIA_ prefix)
MEDIA_PHOTOS=E:\Photos
```

**Network:**
```bash
PORT=3000
ENABLE_HTTPS=false                # true: cần ssl/private-key.pem + ssl/certificate.pem ở gốc repo
ALLOWED_IPS=127.0.0.1             # bắt buộc giữ 127.0.0.1 (máy chủ + Vite dev proxy)
ALLOWED_HOSTNAMES=                # so khớp chính xác tên reverse-DNS (xem log "Truy cập bị chặn từ hostname")
CORS_DEV_CONFIG=localhost:3000,3001|http;127.0.0.1:3000,3001|http   # chỉ cần thêm domain khác; IP đang mở app và *.ts.net luôn được chấp nhận
TAILSCALE_DEVICE=your-device-name
TAILSCALE_TAILNET=tail12345
TAILSCALE_PORTS=3000,3001
TAILSCALE_PROTOCOLS=http,https
```
(`CORS_EXTRA_ORIGINS` trong bản cũ của tài liệu này không còn được đọc.) Một key chỉ được nạp khi đường dẫn tồn tại lúc khởi động. Giải thích đầy đủ từng biến: [readme.md §3](../readme.md#3-cấu-hình) và `backend/.env.template`.

### 📄 **constants.js** - Hằng số toàn hệ thống
**Chứa:**
- File extensions cho từng loại media
- Database table names  
- Cache settings (TTL, size limits)
- API response formats
- Security settings (rate limits)

**Ảnh hưởng:** Tất cả modules đều import constants từ đây

---

## 🗄️ DATABASE ARCHITECTURE

### **Database Files (trong thư mục data/)**
- `ROOT_FANTASY.db`, `ROOT_MANGAH.db`: Manga databases
- `V_ANIME.db`, `V_MOVIE.db`: Movie databases  
- `M_MUSIC.db`: Music database
- `MEDIA_PHOTOS.db`: Media gallery database (bảng `folders`, `media_items`, `albums` — xem [MEDIA-GALLERY.md](MEDIA-GALLERY.md))
- Bảng `folders` của manga/movie/music được thêm cột `scanned` (mark & sweep); manga/movie thêm `favoriteAt` khi dùng API favorite

### **Schema Design**

#### **Manga Schema:**
```sql
folders (
  id INTEGER PRIMARY KEY,
  root TEXT NOT NULL,           -- Thư mục gốc (VD: "1", "2") 
  name TEXT NOT NULL,           -- Tên folder/file
  path TEXT NOT NULL,           -- Đường dẫn tương đối 
  thumbnail TEXT,               -- URL thumbnail
  lastModified INTEGER,         -- Timestamp sửa đổi cuối
  imageCount INTEGER DEFAULT 0, -- Số ảnh trong folder
  chapterCount INTEGER DEFAULT 0, -- Số chapter con
  otherName TEXT,               -- Alias names từ folders rỗng
  type TEXT DEFAULT 'folder',   -- 'folder' 
  isFavorite INTEGER DEFAULT 0, -- 0/1
  favoriteAt INTEGER,           -- Timestamp khi favorite
  createdAt INTEGER,
  updatedAt INTEGER
)

views (
  root TEXT NOT NULL,
  path TEXT NOT NULL, 
  count INTEGER DEFAULT 1,
  PRIMARY KEY (root, path)
)

root_thumbnails (
  root TEXT PRIMARY KEY,
  thumbnail TEXT                -- Thumbnail đại diện cho root
)
```

#### **Movie Schema:**
```sql
folders (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,           -- Tên file/folder
  path TEXT NOT NULL,           -- Đường dẫn tương đối
  thumbnail TEXT,               -- Thumbnail path
  type TEXT DEFAULT 'folder',   -- 'folder' | 'video'
  size INTEGER DEFAULT 0,       -- File size (bytes)
  modified INTEGER,             -- File mtime
  duration INTEGER,             -- Video duration (seconds)
  isFavorite INTEGER DEFAULT 0,
  viewCount INTEGER DEFAULT 0,  -- Số lần xem
  createdAt INTEGER,
  updatedAt INTEGER
)
```

#### **Music Schema:**
```sql
folders (
  -- Giống movie schema
  -- type = 'folder' | 'audio'
)

songs (
  id INTEGER PRIMARY KEY,
  path TEXT NOT NULL UNIQUE,    -- Link với folders.path
  artist TEXT,                  -- Nghệ sĩ
  album TEXT,                   -- Album
  genre TEXT,                   -- Thể loại
  lyrics TEXT                   -- Lời bài hát
)

playlists (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,           -- Tên playlist
  description TEXT,             -- Mô tả
  thumbnail TEXT,               -- Ảnh đại diện
  createdAt INTEGER,
  updatedAt INTEGER
)

playlist_items (
  playlistId INTEGER NOT NULL,
  songPath TEXT NOT NULL,       -- Link với songs.path
  sortOrder INTEGER DEFAULT 0,  -- Thứ tự trong playlist
  PRIMARY KEY (playlistId, songPath)
)
```

---

## 🔄 DATA FLOW CHÍNH

### **1. Khởi tạo hệ thống:**
```
1. server.js đọc .env qua config.js
2. Khởi tạo database connections (db.js)
3. Setup middleware stack (auth → security → rate limit)
4. Mount API routes và static file serving
5. Start listening trên PORT
```

### **2. Scan Workflow:**
```
1. Frontend gọi POST /api/manga/scan {root, key}
2. scan.js → cache-scan.js → scanFolderRecursive()
3. Đệ quy duyệt folders, tìm ảnh bằng imageUtils.js
4. Lưu metadata vào database qua db.js
5. Return stats: inserted/updated/skipped
```

### **3. Browse Workflow:**
```
1. Frontend gọi GET /api/manga/folder-cache?mode=path&key=...&root=...&path=...
2. folder-cache.js kiểm tra mode
3. Nếu mode=path: folder-loader.js → loadFolderFromDisk/DB
4. Trả về {folders: [...], images: [...]}
5. Frontend render danh sách
```

### **4. Media Streaming:**
```
1. Frontend request GET /api/movie/video?key=...&file=...
2. video.js resolve path từ config.js
3. Kiểm tra Range header cho seeking
4. Stream từ disk (`utils/streamFile.js`, `stream.pipeline`)
5. Return với proper MIME và headers
```

---

## 🔒 SECURITY LAYERS

### **Layer 1: Network Security (auth.js)**
- IP allowlist từ `.env` `ALLOWED_IPS`
- Ngoài allowlist: reverse DNS rồi so với `ALLOWED_HOSTNAMES`. Kết quả được nhớ theo IP: cho phép 5 phút, bị chặn 1 phút, lỗi DNS không nhớ (ISSUES P2, đã sửa 2026-11-05)
- IP lấy từ `req.socket.remoteAddress`, không tin header `X-Forwarded-For` (ISSUES S3, đã sửa 2026-11-04). Ở dev mode, request đi qua Vite proxy luôn có IP `127.0.0.1`

### **Layer 2: Content Security (security.js)**
- Request có `key` hoặc `dbkey` (query/body) thuộc `SECURITY` phải gửi token hợp lệ (`x-secure-token`, `Authorization: Bearer`, `?token=` hoặc body `token`)
- `/api/login` trả về token HMAC tính từ `SECURITY_PASSWORD` + `backend/data/.auth-secret` (`utils/authToken.js`), so sánh mật khẩu bằng `timingSafeEqual`, khoá 15 phút sau 10 lần sai từ cùng IP
- Đăng nhập đặt cookie HttpOnly `ms_auth`; static `/manga`, `/video`, `/audio`, `/media` của nguồn bảo mật chỉ phục vụ khi có cookie này (`middleware/protectStatic.js`). API không chấp nhận cookie (chống CSRF)
- Điều hướng trang không thuộc `/api` (`Accept: text/html`) được bỏ qua kiểm tra token: trang HTML không chứa dữ liệu, dữ liệu vẫn lấy qua `/api` có token (AUDIT-2026-11-09 R1)
- (ISSUES S4, S5, S6 — đã sửa 2026-11-04)

### **Layer 3: Rate Limiting (rateLimiter.js)**
- **Đang tắt** (`ENABLE_RATE_LIMIT = false` trong `middleware/index.js`) vì đọc manga cần hàng nghìn request ảnh
- Nếu bật: 50.000 request / 15 phút / IP (`constants.SECURITY.RATE_LIMIT`)

### **Layer 4: Input Validation**
- SQL dùng prepared statements; `ORDER BY` ở `api/media/media-folder.js` dùng whitelist cột (ISSUES S2, đã sửa 2026-11-04)
- Mọi endpoint nhận đường dẫn từ client đi qua `utils/pathSafety.js` → `resolveInsideRoot(rootPath, ...segments)`, trả `null` nếu path ra ngoài root (ISSUES S1, S7). Endpoint mới nhận path **phải** dùng helper này

---

## 🎯 PERFORMANCE OPTIMIZATIONS

### **Caching Strategies:**

#### **Database Cache:**
- SQLite cache cho folder metadata
- Avoid disk I/O cho repeated folder listing
- Cập nhật khi người dùng chạy scan (mark & sweep), không có TTL

#### **Memory Cache:**
- Không còn cache RAM cho video/audio (bỏ 2026-11-04, ISSUES P1): file được stream thẳng từ ổ đĩa, hệ điều hành tự cache các file đọc gần đây

#### **HTTP Cache:**
- Static file cache headers (1 hour TTL)
- ETags và Last-Modified headers
- Immutable cache cho hashed assets

### **Streaming Optimizations:**
- HTTP Range support cho seeking
- Chunked transfer encoding
- MIME detection cho proper browser handling

---

## 🚨 ERROR HANDLING & LOGGING

### **Error Types:**
- **ENOENT**: File/folder not found → 404
- **EACCES**: Permission denied → 403  
- **ValidationError**: Bad input → 400
- **UnauthorizedError**: Auth failed → 401

### **Logging Strategy:**
- Console logging cho development
- Error details cho debugging
- Performance metrics tracking

---

## 📱 MOBILE & CROSS-PLATFORM SUPPORT

### **Responsive Features:**
- Touch-friendly UI components
- Mobile-optimized streaming
- Tailscale remote access support

### **Network Optimization:**
- Compressed responses (gzip)
- Efficient thumbnail delivery
- Adaptive streaming cho slow connections

---

## 🔧 MAINTENANCE & MONITORING

### **Database Maintenance:**
- Auto schema migrations
- Orphaned record cleanup
- Index optimization

### **Performance Monitoring:**
- RAM usage tracking
- Cache hit/miss ratios
- Response time metrics

---

## 🚀 EXTENSIBILITY

### **Adding New Content Types:**
1. Extend `constants.js` với file extensions mới
2. Tạo scan function trong `utils/`
3. Thêm database schema trong `db.js`
4. Implement APIs trong `api/[type]/`
5. Update `server.js` routes

### **Adding New Features:**
1. Database schema updates qua migrations
2. New API endpoints
3. Update frontend constants
4. Test toàn bộ workflow

---

## 📋 DEPENDENCIES QUAN TRỌNG

### **Core Dependencies:**
- **express**: Web framework
- **better-sqlite3**: SQLite driver (nhanh, đồng bộ)
- **cors**: Cross-origin resource sharing
- **compression**: Gzip compression

### **Media Processing:**
- **fluent-ffmpeg**: Video processing
- **ffprobe-static**: Video metadata extraction  
- **music-metadata**: Audio metadata extraction

### **Utilities:**
- **glob**: File pattern matching
- **string-natural-compare**: Natural sorting
- **lru-cache**: không còn được dùng (xem ISSUES P1)
- **mime-types**: MIME type detection

### **Security & Performance:**
- **dotenv**: Environment variables
- **hammerjs**: Touch gesture support

---

## 🎯 KẾT LUẬN

Backend này là một **media server hoàn chỉnh** với:
- ✅ **Scalable architecture** hỗ trợ multiple content types
- ✅ **Performance optimized** với multi-layer caching  
- ✅ **Security hardened** với multiple protection layers
- ✅ **Mobile friendly** với responsive streaming
- ✅ **Maintainable** với clear separation of concerns

**Điểm mạnh:**
- Code structure rõ ràng, dễ extend
- Database schema well-designed
- Performance optimizations comprehensive
- Security implementation robust

**Điểm cần cải thiện:**
- Thêm error recovery mechanisms
- Implement proper logging system
- Add automated testing
- Consider microservices cho scale lớn

**Để hiểu project:**
1. Đọc `server.js` → hiểu server startup
2. Đọc `config.js` → hiểu path mapping
3. Đọc `db.js` → hiểu database structure  
4. Đọc APIs trong `api/` → hiểu business logic
5. Trace 1 workflow hoàn chỉnh (scan → browse → stream)
