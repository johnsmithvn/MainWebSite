# 📊 PHÂN TÍCH TOÀN BỘ BACKEND - MEDIA SERVER

## 🎯 TỔNG QUAN DỰ ÁN

### Mục đích chính:
**Media Server cá nhân** quản lý 3 loại nội dung: **Manga**, **Movie**, **Music**
- Đọc truyện manga từ thư mục hình ảnh
- Xem phim từ thư mục video
- Nghe nhạc từ thư mục audio
- Hỗ trợ tính năng yêu thích, tìm kiếm, thống kê lượt xem

### Kiến trúc Backend:
- **Node.js** + **Express** server
- **SQLite** databases để cache metadata 
- **FFmpeg** để xử lý video/audio metadata
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
├── 📄 server.js                    # Entry point chính
├── 📄 constants.js                 # Constants toàn hệ thống
├── 📄 package.json                 # Dependencies & scripts
├── 📄 .env                         # Environment configuration
├── 📄 .env.template                # Template cho environment setup
│
├── 📁 api/                         # API Routes
│   ├── 📄 increase-view.js         # API tăng view count
│   ├── 📁 manga/                   # Manga APIs
│   │   ├── 📄 favorite.js          # Quản lý manga favorites
│   │   ├── 📄 folder-cache.js      # API chính manga (browse/search)
│   │   ├── 📄 reset-cache.js       # Reset manga database
│   │   ├── 📄 root-thumbnail.js    # Thumbnail cho root folders
│   │   └── 📄 scan.js              # Scan manga folders
│   ├── 📁 movie/                   # Movie APIs
│   │   ├── 📄 extract-movie-thumbnail.js # Extract video thumbnails
│   │   ├── 📄 favorite-movie.js    # Quản lý movie favorites
│   │   ├── 📄 movie-folder-empty.js # Check empty folders
│   │   ├── 📄 movie-folder.js      # Browse movie folders
│   │   ├── 📄 reset-movie-db.js    # Reset movie database
│   │   ├── 📄 scan-movie.js        # Scan movie folders
│   │   ├── 📄 set-thumbnail.js     # Set custom thumbnails
│   │   ├── 📄 video-cache.js       # Video cache management
│   │   └── 📄 video.js             # Stream video files
│   └── 📁 music/                   # Music APIs
│       ├── 📄 audio-cache.js       # Audio cache management
│       ├── 📄 audio.js             # Stream audio files
│       ├── 📄 extract-thumbnail.js # Extract audio thumbnails
│       ├── 📄 music-folder.js      # Browse music folders
│       ├── 📄 music-meta.js        # Music metadata extraction
│       ├── 📄 playlist.js          # Playlist management
│       ├── 📄 reset-music-db.js    # Reset music database
│       ├── 📄 scan-music.js        # Scan music folders
│       └── 📄 set-thumbnail.js     # Set custom thumbnails
│
├── 📁 data/                        # SQLite Database Files
│   ├── 📄 M_MUSIC.db               # Music database
│   ├── 📄 ROOT_FANTASY.db          # Manga database (Fantasy)
│   ├── 📄 V_JAVA.db                # Movie database (Java)
│   └── 📄 V_MOVIE.db               # Movie database (Movies)
│
├── 📁 middleware/                  # Express Middleware
│   ├── 📄 auth.js                  # IP/Hostname authentication
│   ├── 📄 errorHandler.js          # Global error handling
│   ├── 📄 index.js                 # Middleware exports
│   ├── 📄 rateLimiter.js           # Rate limiting protection
│   └── 📄 security.js              # Token-based security
│
├── 📁 routes/                      # Express Routes
│   ├── 📄 index.js                 # Main router setup
│   ├── 📄 manga.js                 # Manga route definitions
│   ├── 📄 movie.js                 # Movie route definitions
│   ├── 📄 music.js                 # Music route definitions
│   └── 📄 system.js                # System routes (auth, keys)
│
├── 📁 services/                    # Business Logic Services
│   └── 📄 MediaService.js          # Media processing service
│
└── 📁 utils/                       # Utility Functions
    ├── 📄 cache-scan.js            # Manga folder scanning
    ├── 📄 config.js                # Environment configuration
    ├── 📄 DatabaseManager.js       # Database connection manager
    ├── 📄 databaseUtils.js         # Database utilities
    ├── 📄 db.js                    # Core database functions
    ├── 📄 folder-loader.js         # Folder loading utilities
    ├── 📄 imageUtils.js            # Image processing utilities
    ├── 📄 movie-scan.js            # Movie folder scanning
    ├── 📄 music-scan.js            # Music folder scanning
    ├── 📄 responseHelpers.js       # API response helpers
    └── 📄 thumbnailUtils.js        # Thumbnail processing
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
- **lru-cache 11.1.0**: In-memory LRU caching cho file streams
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
5. **Memory Cache**: Check LRU cache cho frequently accessed files
6. **Stream Setup**: CreateReadStream với proper MIME headers
7. **Chunked Delivery**: Stream file chunks to client

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
- Skip check cho `/api/login` và static HTML files
- Kiểm tra `x-secure-token` header hoặc query param `token`
- So sánh với `SECURITY_PASSWORD` từ .env

**Ảnh hưởng:** Bảo vệ các source nhạy cảm (SECURITY keys trong .env)

#### 6. **middleware/rateLimiter.js** - Giới hạn request rate
**Chức năng:** Ngăn spam/DoS attacks
**Nhiệm vụ:**
- Limit 100 requests/15 minutes per IP
- Cleanup expired entries tự động
- Return rate limit headers

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

### 📚 **MANGA APIs**

#### 1. **api/manga/folder-cache.js** - API chính của Manga
**Endpoint:** `GET /api/manga/folder-cache`  
**Chức năng:** Universal API xử lý nhiều modes

**Query Parameters:**
- `key`: Source key (ROOT_XXX)
- `mode`: path|random|top|search|folders  
- `root`: Thư mục gốc trong source
- `path`: Đường dẫn folder (cho mode=path)
- `q`: Từ khóa search (cho mode=search)
- `limit`, `offset`: Phân trang

**Modes chi tiết:**
- **path**: Đọc folder/images trong đường dẫn cụ thể
- **random**: 30 folders ngẫu nhiên có thumbnail  
- **top**: Top folders theo lượt xem
- **search**: Tìm kiếm theo tên hoặc otherName
- **folders**: Tất cả folders trong root

**Response formats:**
```json
// mode=path
{
  "type": "folder|reader",
  "folders": [{"name": "...", "path": "...", "thumbnail": "..."}],
  "images": ["/manga/root/path/image.jpg"],
  "total": 100,
  "totalImages": 50
}

// mode=random,top,search,folders  
[
  {"name": "Naruto", "path": "Naruto", "thumbnail": "/manga/1/Naruto/cover.jpg", "isFavorite": false}
]
```

**Đặc điểm:**
- Support `useDb=1` để đọc từ cache thay vì disk
- Handle `__self__` suffix để chỉ lấy images trong folder hiện tại
- Auto-detect reader mode khi có images mà không có subfolders

#### 2. **api/manga/scan.js** - Scan manga folders
**Endpoint:** `POST /api/manga/scan`
**Body:** `{"root": "1", "key": "ROOT_FANTASY"}`
**Chức năng:** Trigger quét và cache toàn bộ folders trong root

#### 3. **api/manga/favorite.js** - Quản lý yêu thích  
**Endpoints:**
- `POST /api/manga/favorite`: Toggle favorite status
- `GET /api/manga/favorite`: Lấy danh sách favorites

#### 4. **api/increase-view.js** - Thống kê lượt xem
**Endpoints:**
- `POST /api/increase-view`: Tăng view cho manga folder
- `POST /api/increase-view/movie`: Tăng view cho video
- `POST /api/increase-view/music`: Tăng view cho audio

### 🎬 **MOVIE APIs**

#### 1. **api/movie/movie-folder.js** - Browse movie folders
**Endpoint:** `GET /api/movie/movie-folder?key=V_MOVIE&path=...`
**Chức năng:** Lấy danh sách folders/videos trong path

**Response:**
```json
{
  "type": "movie-folder",
  "folders": [
    {"name": "Avatar.mp4", "path": "Avatar.mp4", "type": "video", "thumbnail": "..."},
    {"name": "Movies", "path": "Movies", "type": "folder", "thumbnail": null}
  ],
  "total": 2
}
```

#### 2. **api/movie/video.js** - Stream video files
**Endpoint:** `GET /api/movie/video?key=V_MOVIE&file=path/to/video.mp4`
**Chức năng:** Stream video với support Range requests

**Đặc điểm:**
- Support HTTP Range requests cho seeking
- RAM cache cho videos nhỏ (<2GB)
- Auto MIME detection (.mp4, .mkv, .webm, .avi, .ts, .wmv)
- LRU cache với TTL 1 hour

#### 3. **api/movie/scan-movie.js** - Scan movie folders
**Endpoint:** `POST /api/movie/scan-movie`
**Chức năng:** Quét và cache movie folders/files với thumbnail + duration

### 🎵 **MUSIC APIs**

#### 1. **api/music/music-folder.js** - Browse music folders  
**Endpoint:** `GET /api/music/music-folder?key=M_MUSIC&path=...`
**Chức năng:** Lấy danh sách folders/audio files với metadata

**Response:**
```json
{
  "type": "music-folder", 
  "folders": [
    {
      "name": "song.mp3", "path": "album/song.mp3", "type": "audio",
      "artist": "Artist Name", "album": "Album Name", "genre": "Rock",
      "duration": 210, "viewCount": 5
    }
  ]
}
```

#### 2. **api/music/audio.js** - Stream audio files
**Endpoint:** `GET /api/music/audio?key=M_MUSIC&file=path/to/song.mp3`  
**Chức năng:** Stream audio với support Range requests

**Đặc điểm:**
- Tương tự video streaming nhưng optimize cho audio
- Cache size nhỏ hơn (<512MB per file, max 30 files)
- Support: .mp3, .flac, .wav, .ogg

#### 3. **api/music/scan-music.js** - Scan music folders
**Endpoint:** `POST /api/music/scan-music`
**Chức năng:** Quét music với extract full metadata (artist, album, genre, lyrics)

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

**Network:**
```bash
PORT=3000
ALLOWED_HOSTNAMES=
ALLOWED_IPS=
CORS_EXTRA_ORIGINS=http://localhost:3001,http://127.0.0.1:3001
```

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
4. Stream từ disk hoặc RAM cache
5. Return với proper MIME và headers
```

---

## 🔒 SECURITY LAYERS

### **Layer 1: Network Security (auth.js)**
- IP allowlist từ .env ALLOWED_IPS
- Hostname verification qua reverse DNS  
- Tailscale domain support

### **Layer 2: Content Security (security.js)**
- Password protection cho sensitive sources
- Token-based authentication
- Bypass cho static content

### **Layer 3: Rate Limiting (rateLimiter.js)**
- 100 requests / 15 minutes per IP
- Automatic cleanup expired entries
- Headers cho client feedback

### **Layer 4: Input Validation**
- Path traversal prevention
- URL encoding/decoding safe
- SQL injection prevention (prepared statements)

---

## 🎯 PERFORMANCE OPTIMIZATIONS

### **Caching Strategies:**

#### **Database Cache:**
- SQLite cache cho folder metadata
- Avoid disk I/O cho repeated folder listing
- TTL-based cache invalidation

#### **Memory Cache:**
- LRU cache cho video/audio files
- RAM size auto-calculation (50% total RAM)
- Smart size limits per content type

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
- **lru-cache**: Memory caching
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
