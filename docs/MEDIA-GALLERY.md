# 📸 Media Gallery - Google Photos Clone

## 🎯 Tổng quan

Media Gallery là tính năng mới trong MainWebSite, được thiết kế giống Google Photos để quản lý ảnh và video cá nhân.

## ✨ Tính năng chính

### 1. **Photos View** (Grid Layout)
- Hiển thị ảnh/video dạng lưới (grid)
- Lazy loading với performance cao
- Multi-select (Shift/Ctrl click)
- Quick actions: Favorite, Add to Album
- Lightbox viewer với keyboard navigation

### 2. **Timeline View** (Theo thời gian)
- Nhóm media theo năm-tháng-ngày
- Visual calendar layout
- Click để xem ảnh theo ngày cụ thể
- Hiển thị số lượng ảnh mỗi ngày

### 3. **Albums** (Bộ sưu tập)
- Tạo album tùy chỉnh
- Thêm/xóa ảnh vào album
- Cover image tự động
- Mô tả album

### 4. **Favorites** (Yêu thích)
- Đánh dấu ảnh/video yêu thích
- Truy cập nhanh

## 🗂️ Cấu trúc thư mục

```
backend/
├── api/media/
│   ├── scan-media.js          # Scan thư mục
│   ├── media-folder.js        # Lấy danh sách media
│   ├── favorite-media.js      # Toggle favorite
│   ├── album-manager.js       # Quản lý album
│   ├── media-stats.js         # Thống kê
│   └── ...
├── routes/media.js            # Media routes
└── utils/
    ├── media-scan.js          # Media scanner
    └── db.js                  # Database (getMediaDB)

react-app/
└── src/
    ├── pages/media/
    │   └── MediaHome.jsx      # Main page
    └── components/media/
        ├── MediaGrid.jsx      # Photo grid
        ├── MediaToolbar.jsx   # Top toolbar
        ├── MediaLightbox.jsx  # Lightbox viewer
        ├── MediaTimeline.jsx  # Timeline view
        └── MediaAlbums.jsx    # Albums view
```

## 🔧 Cấu hình

### 1. Thêm root paths vào `.env`:

```env
# 📸 MEDIA GALLERY ROOT PATHS
MEDIA_PHOTOS=E:\Photos
MEDIA_CAMERA=E:\Camera
MEDIA_DOWNLOAD=E:\Download\Pictures
```

### 2. Database Schema

Database tự động tạo khi scan lần đầu:

```sql
-- media_items: Lưu ảnh/video
CREATE TABLE media_items (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,
  thumbnail TEXT,
  type TEXT NOT NULL,        -- 'image' | 'video'
  size INTEGER,
  width INTEGER,
  height INTEGER,
  duration INTEGER,          -- video duration (seconds)
  date_taken INTEGER,        -- timestamp
  isFavorite INTEGER,
  viewCount INTEGER,
  albumId INTEGER,
  scanned INTEGER,
  createdAt INTEGER,
  updatedAt INTEGER
);

-- albums: Bộ sưu tập
CREATE TABLE albums (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  coverImage TEXT,
  createdAt INTEGER,
  updatedAt INTEGER
);
```

## 🚀 API Endpoints

### Scan Media
```http
POST /api/media/scan-media
Body: { "key": "MEDIA_PHOTOS" }
```

### Get Media Items
```http
GET /api/media/media-folder?key=MEDIA_PHOTOS&page=1&limit=50&sortBy=date_taken&order=DESC&type=image&year=2024&month=11&favorite=true&albumId=1
```

### Toggle Favorite
```http
POST /api/media/favorite-media
Body: { "key": "MEDIA_PHOTOS", "id": 123, "isFavorite": true }
```

### Albums
```http
GET /api/media/albums?key=MEDIA_PHOTOS
POST /api/media/albums
PUT /api/media/albums/:id
DELETE /api/media/albums/:id
POST /api/media/albums/:id/items
DELETE /api/media/albums/:id/items
```

### Stats
```http
GET /api/media/stats?key=MEDIA_PHOTOS
```

## 📱 Frontend Routes

```
/media                      # Main gallery
/media?key=MEDIA_PHOTOS     # Specific root
/media?view=timeline        # Timeline view
/media?view=albums          # Albums view
/media?view=favorites       # Favorites only
/media?type=image           # Images only
/media?type=video           # Videos only
/media?year=2024&month=11   # Filter by date
/media?albumId=1            # Specific album
```

## 🎨 UI Features

### Grid Layout
- Responsive grid (2-6 columns)
- Hover effects
- Video duration badge
- Selection checkbox
- Favorite heart icon

### Lightbox Viewer
- Full-screen view
- Keyboard navigation (←/→/Esc)
- Image zoom
- Video player
- Download button
- Metadata display

### Toolbar
- View switcher (Photos/Timeline/Albums/Favorites)
- Scan button
- Bulk actions (Add to Album)
- Selection counter

## 🔄 Scan Logic

1. **Mark & Sweep GC**:
   - Mark: Set `scanned = 0` cho tất cả
   - Scan: Update hoặc insert items, set `scanned = 1`
   - Sweep: Delete items với `scanned = 0`

2. **Thumbnail Detection**:
   - Tìm trong folder `.thumbnail`
   - Tên trùng với file gốc
   - Hỗ trợ nhiều định dạng ảnh

3. **Metadata Extraction**:
   - Image dimensions (width/height)
   - Video duration
   - File modified time
   - TODO: EXIF date_taken

## 🎯 Roadmap

- [ ] EXIF metadata extraction
- [ ] Smart albums (auto-group by location, people)
- [ ] Search by date, location, objects
- [ ] Share album links
- [ ] Slideshow mode
- [ ] Batch edit (crop, rotate, filters)
- [ ] Cloud backup integration
- [ ] Face recognition
- [ ] Auto-tagging

## 🐛 Troubleshooting

### Ảnh không hiển thị
- Check root path trong `.env`
- Verify file permissions
- Run scan: `POST /api/media/scan-media`

### Thumbnail không load
- Check `.thumbnail` folder exists
- Verify thumbnail naming (same as original file)
- Check image formats (jpg, png, webp, avif)

### Performance issues
- Reduce `limit` in API calls
- Enable browser cache
- Optimize thumbnail sizes

## 📝 Notes

- Supported image formats: jpg, jpeg, png, webp, avif, gif, bmp, heic, heif
- Supported video formats: mp4, mkv, avi, webm, mov, m4v, 3gp
- Thumbnail folder: `.thumbnail` (tên giống file gốc)
- Default pagination: 100 items/page
- Database location: `backend/data/MEDIA_*.db`

---

**Created by:** MainWebSite Team  
**Version:** 1.0.0  
**Last Updated:** November 16, 2025
