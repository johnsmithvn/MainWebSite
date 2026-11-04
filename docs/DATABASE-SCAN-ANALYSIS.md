# 📊 PHÂN TÍCH TÍNH NĂNG QUÉT DATABASE

> **Cập nhật 2026-10-29:** tài liệu viết 11/2025, trước khi có scanner Media Gallery (`utils/media-scan.js`) và tuỳ chọn `shallow`. Lỗi đã biết của scanner: D1 (shallow + path xoá nhầm), B2 (reset không await), B13 (LIKE không escape), P1 (scan manga đồng bộ) — xem [ISSUES-REPORT.md](ISSUES-REPORT.md); tổng quan scanner: [SYSTEM-REPORT.md](SYSTEM-REPORT.md) §4.4.

> **Ngày phân tích:** 2025-11-08  
> **Phạm vi:** Tính năng quét database cho Music, Movie, và Manga  
> **Bao gồm:** Logic quét, thumbnail extraction, và caching

---

## 📑 MỤC LỤC

1. [Tổng quan hệ thống](#tổng-quan-hệ-thống)
2. [Music Scan System](#music-scan-system)
3. [Movie Scan System](#movie-scan-system)
4. [Manga Scan System](#manga-scan-system)
5. [Thumbnail Extraction](#thumbnail-extraction)
6. [So sánh 3 hệ thống](#so-sánh-3-hệ-thống)
7. [Vấn đề hiện tại](#vấn-đề-hiện-tại)
8. [Đề xuất cải tiến](#đề-xuất-cải-tiến)

---

## 🎯 TỔNG QUAN HỆ THỐNG

### Kiến trúc chung

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT REQUEST                       │
│           POST /api/music/scan-music                     │
│           POST /api/movie/scan-movie                     │
│           POST /api/manga/scan                           │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   API HANDLERS                           │
│  • scan-music.js  • scan-movie.js  • scan.js            │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   SCAN UTILITIES                         │
│  • music-scan.js  • movie-scan.js  • cache-scan.js      │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              DATABASE & FILE SYSTEM                      │
│  • SQLite DB  • Physical Files  • .thumbnail folders    │
└─────────────────────────────────────────────────────────┘
```

### File Extensions được hỗ trợ

```javascript
AUDIO:  ['.mp3', '.flac', '.wav', '.aac', '.m4a', '.ogg', '.opus', '.wma', '.alac', '.aiff']
VIDEO:  ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.3gp', '.ts', '.mpg', '.mpeg']
IMAGE:  ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.bmp', '.tiff', '.svg']
PDF:    ['.pdf']
```

---

## 🎵 MUSIC SCAN SYSTEM

### 📍 Endpoint
- **POST** `/api/music/scan-music`
- **Body:** `{ key: "M_MUSIC" }`

### 🔧 File liên quan
- **API Handler:** `backend/api/music/scan-music.js`
- **Scan Logic:** `backend/utils/music-scan.js`
- **Database:** `backend/data/M_MUSIC.db`

### 🏗️ Database Schema

```sql
-- Table: folders
CREATE TABLE folders (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,
  thumbnail TEXT,           -- Relative path: ".thumbnail/name.jpg"
  type TEXT NOT NULL,       -- 'folder' | 'audio'
  size INTEGER,             -- File size (bytes)
  modified INTEGER,         -- Last modified timestamp (ms)
  duration INTEGER,         -- Audio duration (seconds)
  createdAt INTEGER,
  updatedAt INTEGER
);

-- Table: songs (Metadata)
CREATE TABLE songs (
  id INTEGER PRIMARY KEY,
  path TEXT NOT NULL UNIQUE,
  artist TEXT,
  album TEXT,
  title TEXT,
  genre TEXT,
  lyrics TEXT
);
```

### ⚙️ Logic quét

```javascript
async function scanMusicFolderToDB(dbkey, currentPath = "", stats = {}) {
  // 1. Đọc thư mục
  const entries = fs.readdirSync(basePath, { withFileTypes: true });
  
  // 2. Skip folder .thumbnail
  if (entry.name === ".thumbnail") continue;
  
  // 3. XỬ LÝ FOLDER
  if (entry.isDirectory()) {
    // 3.1. Tìm thumbnail trong .thumbnail/folderName.ext
    let thumb = findThumbnail(thumbDir, entry.name);
    
    // 3.2. Insert/Update vào DB
    if (!existing) {
      db.prepare("INSERT INTO folders ...").run(...);
      stats.inserted++;
    } else {
      db.prepare("UPDATE folders SET thumbnail = ? ...").run(...);
      stats.skipped++;
    }
    
    // 3.3. Đệ quy vào folder con
    await scanMusicFolderToDB(dbkey, relPath, stats);
  }
  
  // 4. XỬ LÝ AUDIO FILE
  if (entry.isFile() && AUDIO_EXTS.includes(ext)) {
    // 4.1. Tìm thumbnail trong .thumbnail/fileName.ext
    let thumb = findThumbnail(thumbDir, name);
    
    // 4.2. Đọc metadata từ file nhạc
    const metadata = await parseFile(fullPath);
    const { duration, artist, album, title, genre, lyrics } = metadata;
    
    // 4.3. Insert/Update vào folders table
    if (!existing) {
      db.prepare("INSERT INTO folders ...").run(...);
      db.prepare("INSERT INTO songs ...").run(...);
      stats.inserted++;
    } else {
      db.prepare("UPDATE folders ...").run(...);
      db.prepare("UPDATE songs ...").run(...);
      stats.skipped++;
    }
  }
}
```

### 🖼️ Thumbnail Logic (Music)

#### Quy tắc tìm thumbnail:
1. **Cho folder:** Tìm trong `.thumbnail/folderName.{jpg,png,webp,...}`
2. **Cho file:** Tìm trong `.thumbnail/fileName.{jpg,png,webp,...}`
3. **Ưu tiên:** jpg → png → webp → avif → ...
4. **Lưu DB:** Đường dẫn relative: `.thumbnail/name.ext`

#### Ví dụ cấu trúc:

```
Music/
├── Album A/
│   ├── .thumbnail/
│   │   ├── Album A.jpg          ← Thumbnail cho folder
│   │   ├── Song 1.jpg            ← Thumbnail cho file
│   │   └── Song 2.jpg
│   ├── Song 1.mp3
│   └── Song 2.flac
└── Album B/
    ├── .thumbnail/
    │   └── Album B.png
    └── Track.wav
```

### 📊 Kết quả trả về

```json
{
  "success": true,
  "stats": {
    "inserted": 45,    // Số record mới thêm
    "updated": 12,     // (Không dùng)
    "skipped": 8       // Số record đã tồn tại
  },
  "message": "🎶 Scan music hoàn tất!"
}
```

---

## 🎬 MOVIE SCAN SYSTEM

### 📍 Endpoint
- **POST** `/api/movie/scan-movie`
- **Body:** `{ key: "V_MOVIE" }`

### 🔧 File liên quan
- **API Handler:** `backend/api/movie/scan-movie.js`
- **Scan Logic:** `backend/utils/movie-scan.js`
- **Database:** `backend/data/V_MOVIE.db`

### 🏗️ Database Schema

```sql
CREATE TABLE folders (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,
  thumbnail TEXT,           -- Relative path: ".thumbnail/name.jpg"
  type TEXT NOT NULL,       -- 'folder' | 'video'
  size INTEGER,             -- File size (bytes)
  modified INTEGER,         -- Last modified timestamp (ms)
  duration INTEGER,         -- Video duration (seconds)
  createdAt INTEGER,
  updatedAt INTEGER
);
```

### ⚙️ Logic quét

```javascript
async function scanMovieFolderToDB(dbkey, currentPath = "", stats = {}) {
  // 1. Đọc thư mục
  const entries = fs.readdirSync(basePath, { withFileTypes: true });
  
  // 2. Skip folder .thumbnail
  if (entry.name === ".thumbnail") continue;
  
  // 3. XỬ LÝ FOLDER
  if (entry.isDirectory()) {
    // 3.1. Tìm thumbnail trong subfolder/.thumbnail/folderName.ext
    let thumb = findThumbnail(
      path.join(basePath, entry.name, ".thumbnail"),
      entry.name
    );
    
    // 3.2. Insert/Update vào DB
    if (!existing) {
      db.prepare("INSERT INTO folders ...").run(...);
      stats.inserted++;
    } else {
      db.prepare("UPDATE folders ...").run(...);
      stats.skipped++;
    }
    
    // 3.3. Đệ quy
    await scanMovieFolderToDB(dbkey, relPath, stats);
  }
  
  // 4. XỬ LÝ VIDEO FILE
  if (entry.isFile() && VIDEO_EXTS.includes(ext)) {
    // 4.1. Tìm thumbnail trong .thumbnail/fileName.ext
    let thumb = findThumbnail(thumbDir, baseName);
    
    // 4.2. Đọc duration bằng ffprobe
    const duration = await getVideoDuration(fullPath);
    
    // 4.3. Insert/Update vào DB
    if (!existing) {
      db.prepare("INSERT INTO folders ...").run(...);
      stats.inserted++;
    } else {
      db.prepare("UPDATE folders ...").run(...);
      stats.skipped++;
    }
  }
}
```

### 🖼️ Thumbnail Logic (Movie)

#### Quy tắc tìm thumbnail:
1. **Cho folder:** Tìm trong `folderName/.thumbnail/folderName.{jpg,png,...}`
2. **Cho file:** Tìm trong `.thumbnail/fileName.{jpg,png,...}` (cùng level với file)
3. **Lưu DB:** Đường dẫn relative: `.thumbnail/name.ext`

#### ⚠️ KHÁC BIỆT VỚI MUSIC:

**Music:** Thumbnail folder nằm TRONG folder
```
Album/
├── .thumbnail/Album.jpg  ← Trong folder
└── song.mp3
```

**Movie:** Thumbnail folder nằm TRONG subfolder
```
Movies/
└── MovieFolder/
    ├── .thumbnail/MovieFolder.jpg  ← Trong subfolder
    └── video.mp4
```

### 📊 Kết quả trả về

```json
{
  "success": true,
  "stats": {
    "inserted": 23,
    "updated": 0,
    "skipped": 5
  },
  "message": "Scan movie thành công!"
}
```

---

## 📚 MANGA SCAN SYSTEM

### 📍 Endpoint
- **POST** `/api/manga/scan`
- **Body:** `{ root: "1", key: "ROOT_MANGAH" }`

### 🔧 File liên quan
- **API Handler:** `backend/api/manga/scan.js`
- **Scan Logic:** `backend/utils/cache-scan.js`
- **Image Utils:** `backend/utils/imageUtils.js`
- **Database:** `backend/data/ROOT_MANGAH.db`, `ROOT_DOW.db`, etc.

### 🏗️ Database Schema

```sql
CREATE TABLE folders (
  id INTEGER PRIMARY KEY,
  root TEXT NOT NULL,           -- Root folder ID ("1", "2", etc.)
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  thumbnail TEXT,               -- Full URL: "/manga/1/folder/image.jpg"
  lastModified INTEGER,
  imageCount INTEGER,           -- Số ảnh trong folder
  chapterCount INTEGER,         -- Số subfolder
  otherName TEXT,               -- Alias cho folder rỗng
  type TEXT DEFAULT 'folder',
  createdAt INTEGER,
  updatedAt INTEGER,
  UNIQUE(root, path)
);

CREATE TABLE root_thumbnails (
  root TEXT PRIMARY KEY,        -- Root ID
  thumbnail TEXT                -- URL thumbnail cho root
);
```

### ⚙️ Logic quét

```javascript
function scanFolderRecursive(dbkey, root, currentPath = "", stats = {}) {
  // 1. Skip nếu folder không có ảnh
  if (!hasImageRecursively(fullPath)) return stats;
  
  // 2. Đọc thư mục
  const entries = fs.readdirSync(fullPath, { withFileTypes: true });
  
  // 3. Skip các folder đặc biệt
  const skipNames = [".git", "node_modules", "__MACOSX", ".Trash", ".DS_Store"];
  
  // 4. Thu thập tên folder rỗng làm otherName
  if (currentPath) {
    const alias = entries
      .filter(e => e.isDirectory())
      .filter(e => fs.readdirSync(fullPath).length === 0)
      .map(e => e.name)
      .join(",");
    
    // Update otherName vào DB
    db.prepare("UPDATE folders SET otherName = ? ...").run(alias || null);
  }
  
  // 5. Xử lý từng folder con
  for (const entry of entries) {
    if (!entry.isDirectory() || skipNames.includes(entry.name)) continue;
    
    // 5.1. Skip nếu không có ảnh
    if (!hasImageRecursively(fullChildPath)) continue;
    
    stats.scanned++;
    
    // 5.2. Tìm thumbnail (ảnh đầu tiên trong folder/subfolder)
    const thumbnail = findFirstImageRecursively(root, rootPath, fullChildPath);
    
    // 5.3. Đếm ảnh và chapter
    const imageCount = childEntries.filter(e => 
      e.isFile() && IMAGE_EXTS.includes(ext)
    ).length;
    
    const chapterCount = childEntries.filter(e => 
      e.isDirectory()
    ).length;
    
    // 5.4. Insert/Update
    if (!existing) {
      db.prepare("INSERT INTO folders ...").run(...);
      stats.inserted++;
    } else if (existing.lastModified < lastModified) {
      db.prepare("UPDATE folders ...").run(...);
      stats.updated++;
    } else {
      stats.skipped++;
    }
    
    // 5.5. Đệ quy
    scanFolderRecursive(dbkey, root, relativePath, stats);
  }
}
```

### 🖼️ Thumbnail Logic (Manga)

#### Quy tắc tìm thumbnail:
1. **Không dùng folder `.thumbnail`**
2. **Tìm ảnh đầu tiên** trong folder hoặc subfolder (đệ quy)
3. **Sắp xếp:** Natural sort (alphanumeric)
4. **Lưu DB:** Full URL: `/manga/{root}/{relativePath}/image.jpg`
5. **Encode:** Mỗi segment được `encodeURIComponent()`

#### Hàm tìm ảnh:

```javascript
function findFirstImageRecursively(rootFolder, rootPath, dirPath) {
  const baseUrl = `/manga/${rootFolder}`;
  
  // 1. Sắp xếp entries theo natural order
  const entries = fs.readdirSync(dirPath).sort(naturalCompare);
  
  // 2. Ưu tiên tìm file trước
  for (const file of files) {
    if (IMAGE_EXTENSIONS.includes(ext)) {
      const relativePath = path.relative(rootPath, fullPath);
      const safe = relativePath.split("/").map(encodeURIComponent).join("/");
      return `${baseUrl}/${safe}`;
    }
  }
  
  // 3. Sau đó đệ quy vào folder
  for (const folder of folders) {
    const found = findFirstImageRecursively(...);
    if (found) return found;
  }
  
  return null;
}
```

#### Ví dụ:

```
Manga/
└── 1/                          ← Root folder
    └── One Piece/
        ├── Chapter 1/
        │   ├── 001.jpg         ← Ảnh đầu tiên → thumbnail
        │   ├── 002.jpg
        │   └── 003.jpg
        └── Chapter 2/
            └── 001.png

DB: thumbnail = "/manga/1/One%20Piece/Chapter%201/001.jpg"
```

### 📊 Kết quả trả về

```json
{
  "success": true,
  "stats": {
    "scanned": 120,    // Tổng folder đã quét
    "inserted": 45,    // Folder mới
    "updated": 12,     // Folder cập nhật (lastModified thay đổi)
    "skipped": 63      // Folder không thay đổi
  }
}
```

---

## 🎨 THUMBNAIL EXTRACTION

### Mục đích
Tạo thumbnail cho các file media **sau khi đã scan DB**.  
Thumbnail được lưu trong folder `.thumbnail` cùng cấp với media.

---

### 🎵 Music Thumbnail Extraction

#### Endpoint
- **POST** `/api/music/extract-thumbnail`
- **Body:** `{ key: "M_MUSIC", path: "Album/Song.mp3", overwrite: false }`

#### Logic

```javascript
async function extractThumbnailSmart({ key, relPath, overwrite }) {
  // 1. Kiểm tra là folder hay file
  const stat = fs.statSync(absPath);
  
  // 2. NẾU LÀ FOLDER: Đệ quy extract tất cả file con
  if (stat.isDirectory()) {
    for (const entry of entries) {
      const result = await extractThumbnailSmart({ 
        key, 
        relPath: childRelPath, 
        overwrite 
      });
      
      // Lưu thumbnail của nhạc đầu tiên
      if (!firstMusicThumb && result.success && result.thumb) {
        firstMusicThumb = thumbFile;
      }
    }
    
    // Tạo thumbnail đại diện cho folder
    if (firstMusicThumb) {
      const folderName = path.basename(absPath);
      const thumbDir = path.join(absPath, ".thumbnail");
      const folderThumb = path.join(thumbDir, folderName + ".jpg");
      
      fs.mkdirSync(thumbDir, { recursive: true });
      fs.copyFileSync(firstMusicThumb, folderThumb);
      
      // Update DB
      db.prepare("UPDATE folders SET thumbnail = ? ...").run(
        ".thumbnail/" + folderName + ".jpg"
      );
    }
  }
  
  // 3. NẾU LÀ FILE NHẠC: Extract từ embedded metadata
  if (AUDIO_EXTS.includes(ext)) {
    const metadata = await parseFile(absPath);
    const pic = metadata.common.picture[0];
    
    if (pic && pic.data) {
      const ext = pic.format.includes("png") ? ".png" : ".jpg";
      const thumbFolder = path.join(baseDir, ".thumbnail");
      const thumbFile = path.join(thumbFolder, name + ext);
      
      fs.mkdirSync(thumbFolder, { recursive: true });
      fs.writeFileSync(thumbFile, pic.data);
      
      // Update DB
      db.prepare("UPDATE folders SET thumbnail = ? ...").run(
        ".thumbnail/" + name + ext
      );
    }
  }
}
```

#### Workflow:

```
POST /api/music/extract-thumbnail { key: "M_MUSIC", path: "Album" }
                    │
                    ▼
         ┌──────────────────────┐
         │  Is Directory?       │
         └────────┬─────────────┘
                  │ YES
                  ▼
    ┌─────────────────────────────────┐
    │ Đệ quy extract tất cả file con  │
    └────────────┬────────────────────┘
                 │
                 ▼
    ┌─────────────────────────────────┐
    │ Lưu thumbnail nhạc đầu tiên     │
    └────────────┬────────────────────┘
                 │
                 ▼
    ┌─────────────────────────────────┐
    │ Copy làm thumbnail cho folder   │
    │ .thumbnail/AlbumName.jpg        │
    └────────────┬────────────────────┘
                 │
                 ▼
    ┌─────────────────────────────────┐
    │ Update DB: thumbnail field      │
    └─────────────────────────────────┘
```

---

### 🎬 Movie Thumbnail Extraction

#### Endpoint
- **POST** `/api/movie/extract-thumbnail`
- **Body:** `{ key: "V_MOVIE", path: "MovieFolder/video.mp4", overwrite: false }`

#### Logic

```javascript
async function extractMovieThumbnailSmart({ key, relPath, overwrite }) {
  // 1. NẾU LÀ FOLDER: Đệ quy
  if (stat.isDirectory()) {
    for (const entry of entries) {
      const result = await extractMovieThumbnailSmart({ ... });
      
      // Lưu thumbnail của video đầu tiên
      if (!firstVideoThumb && result.success && result.thumb) {
        firstVideoThumb = thumbFile;
      }
    }
    
    // Tạo thumbnail đại diện cho folder
    if (firstVideoThumb) {
      const folderName = path.basename(absPath);
      const thumbDir = path.join(absPath, ".thumbnail");
      const folderThumb = path.join(thumbDir, folderName + ".jpg");
      
      fs.copyFileSync(firstVideoThumb, folderThumb);
      
      // Update DB
      db.prepare("UPDATE folders SET thumbnail = ? ...").run(...);
    }
  }
  
  // 2. NẾU LÀ FILE VIDEO: Extract bằng ffmpeg
  if (VIDEO_EXTS.includes(ext)) {
    // 2.1. Đọc duration
    const duration = await getVideoDuration(absPath);
    
    // 2.2. Random timestamp (tránh intro đen)
    let randSec = 1;
    if (duration > 4) {
      randSec = Math.floor(Math.random() * (duration - 4)) + 2;
    }
    
    // 2.3. Extract frame bằng ffmpeg
    await new Promise((resolve, reject) => {
      ffmpeg(absPath)
        .screenshots({
          count: 1,
          timestamps: [randSec],
          filename: name + ".jpg",
          folder: thumbFolder,
          size: "480x?"
        })
        .on("end", resolve)
        .on("error", reject);
    });
    
    // 2.4. Update DB
    db.prepare("UPDATE folders SET thumbnail = ? ...").run(...);
  }
}
```

#### Workflow:

```
POST /api/movie/extract-thumbnail { key: "V_MOVIE", path: "Movie.mp4" }
                    │
                    ▼
         ┌──────────────────────┐
         │  Is Video File?      │
         └────────┬─────────────┘
                  │ YES
                  ▼
    ┌─────────────────────────────────┐
    │ ffprobe: Đọc duration           │
    └────────────┬────────────────────┘
                 │
                 ▼
    ┌─────────────────────────────────┐
    │ Random timestamp (2s ~ end-2s)  │
    └────────────┬────────────────────┘
                 │
                 ▼
    ┌─────────────────────────────────┐
    │ ffmpeg: Extract frame 480x?     │
    │ → .thumbnail/Movie.jpg          │
    └────────────┬────────────────────┘
                 │
                 ▼
    ┌─────────────────────────────────┐
    │ Update DB: thumbnail field      │
    └─────────────────────────────────┘
```

---

### 📚 Manga Thumbnail (Root)

#### Endpoint
- **GET** `/api/manga/root-thumbnail?key=ROOT_MANGAH&root=1`
- **POST** `/api/manga/root-thumbnail` `{ key, root, thumbnail }`

#### Logic

```javascript
// GET: Lấy thumbnail của root
router.get("/root-thumbnail", (req, res) => {
  const { key, root } = req.query;
  const db = getDB(key);
  const row = db.prepare(
    "SELECT thumbnail FROM root_thumbnails WHERE root = ?"
  ).get(root);
  res.json({ thumbnail: row?.thumbnail || null });
});

// POST: Set thumbnail cho root
router.post("/root-thumbnail", (req, res) => {
  const { key, root, thumbnail } = req.body;
  const db = getDB(key);
  db.prepare(`
    INSERT INTO root_thumbnails (root, thumbnail) 
    VALUES (?, ?) 
    ON CONFLICT(root) DO UPDATE SET thumbnail = excluded.thumbnail
  `).run(root, thumbnail);
  res.json({ success: true });
});
```

**Lưu ý:** Manga không có API extract thumbnail tự động. Thumbnail được tìm bằng `findFirstImageRecursively()` khi scan.

---

## ⚖️ SO SÁNH 3 HỆ THỐNG

| Tính năng | Music | Movie | Manga |
|-----------|-------|-------|-------|
| **Endpoint** | `/api/music/scan-music` | `/api/movie/scan-movie` | `/api/manga/scan` |
| **Params** | `{ key }` | `{ key }` | `{ root, key }` |
| **Đệ quy** | ✅ Có | ✅ Có | ✅ Có |
| **Skip .thumbnail** | ✅ Có | ✅ Có | ❌ Không dùng .thumbnail |
| **Thumbnail location** | `.thumbnail/name.ext` | `.thumbnail/name.ext` | Ảnh đầu tiên trong folder |
| **Thumbnail format** | Relative path | Relative path | Full URL |
| **Metadata** | ✅ artist, album, title, genre, lyrics | ❌ Không | ❌ Không |
| **Duration** | ✅ Từ metadata | ✅ Từ ffprobe | ❌ Không |
| **Extra tables** | `songs` | ❌ Không | `root_thumbnails` |
| **imageCount** | ❌ Không | ❌ Không | ✅ Có |
| **chapterCount** | ❌ Không | ❌ Không | ✅ Có |
| **otherName (alias)** | ❌ Không | ❌ Không | ✅ Có (folder rỗng) |
| **lastModified check** | ❌ Không (always update) | ❌ Không | ✅ Có (chỉ update nếu mới hơn) |
| **Stats** | inserted, skipped | inserted, skipped | scanned, inserted, updated, skipped |
| **Extract API** | ✅ `/extract-thumbnail` | ✅ `/extract-thumbnail` | ❌ Không có |

---

## 🚨 VẤN ĐỀ HIỆN TẠI

### 1. **Inconsistency trong Logic**

#### ❌ Music/Movie: Luôn update kể cả khi không thay đổi
```javascript
// music-scan.js & movie-scan.js
if (!existing) {
  db.prepare("INSERT ...").run(...);
  stats.inserted++;
} else {
  db.prepare("UPDATE ...").run(...);  // ⚠️ Luôn update!
  stats.skipped++;  // ⚠️ Sai: Đã update mà vẫn gọi là "skipped"
}
```

#### ✅ Manga: Chỉ update khi lastModified thay đổi
```javascript
// cache-scan.js
if (!existing) {
  stats.inserted++;
} else if (existing.lastModified < lastModified) {
  stats.updated++;  // ✅ Đúng
} else {
  stats.skipped++;  // ✅ Đúng
}
```

**Hậu quả:**
- Music/Movie: `updatedAt` timestamp thay đổi không cần thiết
- Stats không chính xác: `skipped` thực chất là `updated`
- Performance kém: Luôn ghi DB ngay cả khi không có thay đổi

---

### 2. **Thumbnail Logic khác nhau**

#### Music Thumbnail:
```
Album/
├── .thumbnail/
│   ├── Album.jpg        ← Thumbnail TRONG folder
│   └── Song.jpg
└── Song.mp3
```

#### Movie Thumbnail:
```
Movies/
└── MovieFolder/
    ├── .thumbnail/
    │   └── MovieFolder.jpg  ← Thumbnail TRONG subfolder
    └── video.mp4
```

#### Manga Thumbnail:
```
Manga/1/Title/Chapter 1/001.jpg  ← Ảnh đầu tiên, KHÔNG dùng .thumbnail
```

**Vấn đề:**
- Không nhất quán → Khó maintain
- Frontend phải handle 3 cách khác nhau

---

### 3. **Race Condition trong Extract**

#### ⚠️ Cùng lúc extract nhiều file:
```javascript
// extract-thumbnail.js (Music & Movie)
fs.mkdirSync(thumbFolder, { recursive: true });  // ⚠️ Có thể fail nếu nhiều process cùng tạo
fs.writeFileSync(thumbFile, data);
```

**Giải pháp:** Đã có `{ recursive: true }` → Idempotent, nhưng vẫn có thể race khi write file cùng tên.

---

### 4. **Scan performance**

#### ❌ Music: Đọc metadata TOÀN BỘ file ngay khi scan
```javascript
const metadata = await parseFile(fullPath);  // ⚠️ Chậm với nhiều file
```

**Hậu quả:**
- Scan 1000 file nhạc có thể mất 10-30 phút
- Block server trong quá trình scan

#### ✅ Movie: Chỉ đọc duration
```javascript
const duration = await getVideoDuration(fullPath);  // Nhanh hơn
```

#### ✅ Manga: Không đọc metadata
```javascript
// Chỉ check file existence và count
```

---

### 5. **Database constraints**

#### ⚠️ Music/Movie: UNIQUE trên `path`
```sql
CREATE TABLE folders (
  path TEXT NOT NULL UNIQUE  -- ⚠️ Crash nếu duplicate
);
```

#### ✅ Manga: UNIQUE trên `(root, path)`
```sql
CREATE TABLE folders (
  root TEXT NOT NULL,
  path TEXT NOT NULL,
  UNIQUE(root, path)  -- ✅ Cho phép cùng path trên root khác nhau
);
```

**Vấn đề:**
- Music/Movie không hỗ trợ multi-root
- Phải tách DB riêng cho mỗi root

---

## 💡 ĐỀ XUẤT CẢI TIẾN

### 1. **Thống nhất Logic Update**

#### Áp dụng cho Music/Movie như Manga:

```javascript
async function scanMusicFolderToDB(dbkey, currentPath = "", stats = {}) {
  // ...existing code...
  
  const stat = fs.statSync(fullPath);
  const lastModified = stat.mtimeMs;
  
  const existing = db.prepare("SELECT * FROM folders WHERE path = ?").get(relPath);
  
  if (!existing) {
    db.prepare("INSERT INTO folders ...").run(...);
    stats.inserted++;
  } else if (existing.modified !== lastModified) {  // ✅ Chỉ update khi thay đổi
    db.prepare("UPDATE folders SET modified = ?, updatedAt = ? ...").run(...);
    stats.updated++;
  } else {
    stats.skipped++;  // ✅ Đúng nghĩa
  }
}
```

**Lợi ích:**
- Performance tốt hơn: Giảm DB writes
- Stats chính xác
- Consistency giữa 3 hệ thống

---

### 2. **Thống nhất Thumbnail Strategy**

#### Đề xuất: Dùng `.thumbnail` cho cả 3 hệ thống

```
Media/
├── .thumbnail/
│   ├── folderName.jpg    ← Folder thumbnail
│   └── fileName.jpg      ← File thumbnail
├── SubFolder/
│   ├── .thumbnail/
│   │   └── SubFolder.jpg
│   └── file.ext
└── file.ext
```

**Rules:**
1. Thumbnail luôn nằm trong `.thumbnail` cùng cấp với media
2. Tên thumbnail = Tên media (không extension) + `.jpg`
3. Lưu DB: Relative path `.thumbnail/name.jpg`
4. Frontend: Resolve về `/api/{type}/{key}/image?path={relativePath}`

---

### 3. **Lazy Metadata Loading**

#### Tách scan thành 2 giai đoạn:

**Phase 1: Fast Scan (Structure only)**
```javascript
// Chỉ scan structure, không đọc metadata
async function quickScan(dbkey) {
  // Insert: name, path, type, size, modified
  // Skip: duration, artist, album, etc.
}
```

**Phase 2: Metadata Extraction (On-demand)**
```javascript
// API riêng để đọc metadata khi cần
POST /api/music/extract-metadata { key, path }
```

**Lợi ích:**
- Scan nhanh gấp 10-20 lần
- Metadata chỉ load khi user xem chi tiết

---

### 4. **Batch Processing cho Extract**

#### Thay vì đệ quy tuần tự:

```javascript
async function extractThumbnailBatch({ key, paths, overwrite }) {
  const tasks = paths.map(p => extractSingleFile({ key, path: p, overwrite }));
  const results = await Promise.allSettled(tasks);  // ✅ Parallel
  return results;
}
```

**Lợi ích:**
- Nhanh hơn 5-10 lần với folder lớn
- Tận dụng multi-core CPU

---

### 5. **Incremental Scan**

#### Chỉ scan folder thay đổi:

```javascript
async function incrementalScan(dbkey, root) {
  // 1. Lấy danh sách folder đã scan
  const existing = db.prepare("SELECT path, modified FROM folders").all();
  
  // 2. Check filesystem
  for (const folder of existing) {
    const stat = fs.statSync(fullPath);
    if (stat.mtimeMs > folder.modified) {
      // ✅ Chỉ scan folder này
      await scanSingleFolder(folder.path);
    }
  }
  
  // 3. Tìm folder mới
  const newFolders = findNewFolders(rootPath, existing);
  for (const folder of newFolders) {
    await scanSingleFolder(folder);
  }
}
```

**Lợi ích:**
- Scan lại nhanh hơn 100x
- Không cần scan toàn bộ tree

---

### 6. **Schema Improvements**

#### Thêm indexes:

```sql
-- Music/Movie
CREATE INDEX idx_folders_type ON folders(type);
CREATE INDEX idx_folders_modified ON folders(modified);
CREATE INDEX idx_songs_artist ON songs(artist);

-- Manga
CREATE INDEX idx_folders_root_type ON folders(root, type);
CREATE INDEX idx_folders_lastModified ON folders(lastModified);
```

#### Add metadata cache:

```sql
CREATE TABLE scan_cache (
  key TEXT PRIMARY KEY,
  root TEXT,
  lastScan INTEGER,
  totalFolders INTEGER,
  totalFiles INTEGER
);
```

**Lợi ích:**
- Query nhanh hơn
- Track scan history
- UI hiển thị progress

---

## 📈 KẾT LUẬN

### ✅ Điểm mạnh hiện tại:
1. **Đệ quy tốt:** Xử lý cấu trúc folder phức tạp
2. **Metadata rich:** Music có artist, album, lyrics
3. **Thumbnail support:** Cả 3 hệ thống đều có
4. **Stats tracking:** Theo dõi quá trình scan

### ❌ Điểm cần cải thiện:
1. **Inconsistency:** Logic update khác nhau giữa 3 hệ thống
2. **Performance:** Scan chậm với folder lớn (đặc biệt Music)
3. **Thumbnail chaos:** 3 cách lưu thumbnail khác nhau
4. **No incremental scan:** Luôn phải scan toàn bộ
5. **Stats confusion:** `skipped` thực chất là `updated`

### 🎯 Ưu tiên cải tiến:
1. **High:** Thống nhất update logic + fix stats
2. **High:** Lazy metadata loading cho Music
3. **Medium:** Thống nhất thumbnail strategy
4. **Medium:** Incremental scan
5. **Low:** Batch processing extract

---

**Tác giả phân tích:** GitHub Copilot  
**Ngày hoàn thành:** 2025-11-08  
**Phiên bản:** 1.0
