# 📸 Media Gallery - Google Photos Clone

> **Đối chiếu với code ngày 2026-11-04.** Hướng dẫn từng bước: [MEDIA-GALLERY-QUICKSTART.md](MEDIA-GALLERY-QUICKSTART.md). Lỗi đã biết: thumbnail thư mục không hiển thị (ISSUES B8); lỗi SQL injection qua `sortBy/order` (ISSUES S2) đã sửa ngày 2026-11-04 — xem [ISSUES-REPORT.md](ISSUES-REPORT.md).

## 🎯 Tổng quan

Media Gallery là tính năng trong MainWebSite, được thiết kế giống Google Photos để quản lý ảnh và video cá nhân. Từ bản cập nhật 11/2025 scanner **index mọi loại file** (ảnh, video, audio, pdf, text, document, archive, code, other) và hỗ trợ điều hướng theo thư mục.

## ✨ Tính năng chính

### 1. **Photos View** (Grid Layout)
- Duyệt theo thư mục: thư mục con + file trực tiếp (`?path=`)
- Multi-select (Shift/Ctrl click)
- Quick actions: Favorite, Add to Album, xoá khỏi DB
- Lightbox viewer với keyboard navigation

### 2. **Timeline View** (Theo thời gian)
- Nhóm media theo **tháng**, mới nhất trước
- Ngày dùng để nhóm là `date_taken`, hiện bằng **ngày sửa file** (chưa đọc EXIF)

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

### 1. Thêm root paths vào `backend/.env`:

```env
# 📸 MEDIA GALLERY ROOT PATHS (thư mục phải tồn tại lúc khởi động server)
MEDIA_PHOTOS=E:/Photos
MEDIA_CAMERA=E:/Camera
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
  type TEXT NOT NULL,        -- 'image' | 'video' | 'audio' | 'pdf' | 'text' | 'document' | 'archive' | 'code' | 'other'
  size INTEGER,
  modified INTEGER,          -- mtime, dùng để phát hiện file thay đổi
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

-- folders: cache thư mục để điều hướng (thumbnail = tên file trong <folder>/.thumbnail/)
CREATE TABLE folders (
  id INTEGER PRIMARY KEY,
  root TEXT NOT NULL,        -- = key (vd. MEDIA_PHOTOS)
  path TEXT NOT NULL,
  name TEXT NOT NULL,
  thumbnail TEXT,
  itemCount INTEGER,
  scanned INTEGER,
  createdAt INTEGER,
  updatedAt INTEGER,
  UNIQUE(root, path)
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

Tất cả nằm dưới `/api/media` ([backend/routes/media.js](../backend/routes/media.js)).

| Method | Endpoint | Tham số |
|--------|----------|---------|
| POST | `/scan-media` | `{ key, path?, shallow? }` — `path` = partial scan, `shallow` = chỉ các mục nằm ngay trong `path` (hoặc root) |
| GET | `/media-folders` | `?key&path=` — thư mục con + file trực tiếp trong `path` |
| GET | `/media-folder` | `?key&page&limit&sortBy&order&type&year&month&favorite&albumId` — danh sách phân trang + `timeline` |
| POST | `/favorite-media` | `{ key, id, isFavorite }` |
| POST | `/set-thumbnail` | `{ key, id, thumbnail }` |
| POST | `/reset-media-db` | `{ key }` — xoá **toàn bộ** items, folders và albums |
| DELETE | `/delete-item` | `{ key, path }` — xoá item hoặc folder (kèm con) khỏi DB, không đụng file thật |
| GET | `/cache/:filename` | `?key` — file trong `<root>/.thumbnail/` |
| GET | `/albums` | `?key` (kèm `itemCount`, `coverItemPath`, `coverThumbnail`) |
| POST | `/albums` | `{ key, name, description }` |
| PUT | `/albums/:id` | `{ key, name, description, coverImage }` |
| DELETE | `/albums/:id` | `{ key }` |
| POST / DELETE | `/albums/:id/items` | `{ key, itemIds: [] }` |
| GET | `/stats` | `?key` — đếm theo type, favorites, timeline theo tháng, 20 item mới nhất |

File gốc được phục vụ tĩnh qua `/media/<path>` (mọi thư mục `MEDIA_*` cùng mount vào `/media`; nếu hai nguồn có file cùng đường dẫn tương đối thì nguồn khai báo trước thắng).

## 📱 Frontend Routes

```
/media                                  # Main gallery (mặc định key=MEDIA_PHOTOS nếu thiếu)
/media?key=MEDIA_PHOTOS                 # Specific root
/media?key=MEDIA_PHOTOS&path=2024/Trip  # Duyệt thư mục con (Photos view)
/media?key=…&view=timeline              # Timeline view
/media?key=…&view=albums                # Danh sách album
/media?key=…&view=albums&albumId=1      # Một album (albumId chỉ có tác dụng cùng view=albums)
/media?key=…&view=favorites             # Favorites only
```

Bộ lọc `type=image|video`, `year=2024`, `month=11` chỉ áp dụng cho Timeline, Favorites và album (Photos view dùng API `media-folders`, không lọc); chưa có nút lọc trên giao diện.

## 🎨 UI Features

### Grid Layout
- Responsive grid (2-6 columns)
- Hover effects
- Video duration badge
- Selection checkbox
- Favorite heart icon

### Lightbox Viewer
- Full-screen view
- Keyboard: `←`/`→` chuyển ảnh, `Esc` đóng, `+`/`-` zoom
- Video player
- Download button (dùng `window.Android.downloadFile` khi chạy trong Android WebView)
- Favorite

### Toolbar
- View switcher (Photos/Timeline/Albums/Favorites)
- Bulk actions khi đang chọn (Add to Album, bỏ chọn)

Nút **Quét Media / Xóa DB / Reset DB** không nằm trên toolbar mà ở **Sidebar → Công cụ 📸 Media**.

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

- Image formats: jpg, jpeg, jfif, png, webp, avif, gif, bmp, tiff, svg, heic, heif
- Video formats: mp4, mkv, avi, mov, wmv, flv, webm, m4v, 3gp, ts, mpg, mpeg
- Các đuôi khác (audio, pdf, text, document, archive, code) được index theo nhóm; đuôi lạ → `other` (danh sách: `backend/constants.js` → `FILE_EXTENSIONS`)
- Thumbnail folder: `.thumbnail` (tên giống file gốc, đuôi ảnh bất kỳ); scanner không tự tạo thumbnail
- Pagination: frontend xin 100 items/page (backend mặc định 50)
- Database location: `backend/data/MEDIA_*.db`

---

**Created by:** MainWebSite Team  
**Version:** 1.0.0  
**Last Updated:** November 16, 2025
