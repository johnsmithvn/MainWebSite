# 🚀 Media Gallery - Quick Start Guide

## Bước 1: Cấu hình

### 1.1. Thêm root paths vào `.env`

Mở file `backend/.env` và thêm:

```env
# 📸 MEDIA GALLERY ROOT PATHS
MEDIA_PHOTOS=E:\Photos
MEDIA_CAMERA=D:\DCIM\Camera
MEDIA_DOWNLOAD=E:\Download\Pictures
```

**Lưu ý**: Thay đổi đường dẫn theo thư mục thực tế trên máy bạn.

### 1.2. Chuẩn bị thư mục

Cấu trúc thư mục khuyến nghị:

```
E:\Photos\
├── 2024\
│   ├── 01-January\
│   │   ├── IMG_001.jpg
│   │   ├── IMG_002.jpg
│   │   └── .thumbnail\          # Thumbnail folder (optional)
│   │       ├── IMG_001.jpg
│   │       └── IMG_002.jpg
│   └── 02-February\
└── 2023\
```

## Bước 2: Khởi động Server

```bash
# Terminal 1: Backend
cd backend
npm install
npm start

# Terminal 2: Frontend
cd react-app
npm install
npm run dev
```

## Bước 3: Test API

Mở trình duyệt và truy cập:

```
https://localhost:3000/api/media/test
```

Kết quả mong đợi:

```json
{
  "success": true,
  "message": "Media Gallery API is working! 📸",
  "endpoints": { ... },
  "features": [ ... ]
}
```

## Bước 4: Scan Media lần đầu

### 4.1. Qua API (Postman/Thunder Client)

```http
POST https://localhost:3000/api/media/scan-media
Content-Type: application/json

{
  "key": "MEDIA_PHOTOS"
}
```

### 4.2. Qua Web UI

1. Mở `https://localhost:3001` (React dev server)
2. Click sidebar: **Media Gallery**
3. Click button **Scan** ở toolbar
4. Chờ scan hoàn tất

Kết quả:

```json
{
  "success": true,
  "stats": {
    "inserted": 150,  // Số ảnh/video mới
    "updated": 5,     // Số file đã cập nhật
    "skipped": 200,   // Số file không đổi
    "deleted": 10     // Số record đã xóa
  }
}
```

## Bước 5: Sử dụng Media Gallery

### 5.1. Photos View (Mặc định)

```
https://localhost:3001/media?key=MEDIA_PHOTOS
```

Tính năng:
- ✅ Grid layout 2-6 cột (responsive)
- ✅ Click để mở lightbox
- ✅ Shift/Ctrl click để multi-select
- ✅ Hover để hiện actions (favorite, select)

### 5.2. Timeline View

```
https://localhost:3001/media?key=MEDIA_PHOTOS&view=timeline
```

Tính năng:
- ✅ Nhóm theo năm-tháng
- ✅ Visual calendar cards
- ✅ Click ngày để xem ảnh

### 5.3. Albums View

```
https://localhost:3001/media?key=MEDIA_PHOTOS&view=albums
```

Tính năng:
- ✅ Tạo album mới
- ✅ Thêm ảnh vào album (multi-select → Add to Album)
- ✅ Cover image tự động

### 5.4. Favorites View

```
https://localhost:3001/media?key=MEDIA_PHOTOS&view=favorites
```

## Bước 6: Thao tác thường dùng

### 6.1. Đánh dấu Favorite

1. Hover vào ảnh → Click icon ❤️
2. Hoặc: Mở lightbox → Click ❤️ ở toolbar

### 6.2. Tạo Album

1. Click tab **Albums**
2. Click **+ New Album**
3. Nhập tên & mô tả
4. Click **Create**

### 6.3. Thêm ảnh vào Album

1. View **Photos**
2. Multi-select ảnh (Shift/Ctrl click)
3. Click **Add to Album**
4. Chọn album
5. Done!

### 6.4. Filter theo thời gian

```
# Xem ảnh tháng 11/2024
/media?key=MEDIA_PHOTOS&year=2024&month=11

# Chỉ xem ảnh
/media?key=MEDIA_PHOTOS&type=image

# Chỉ xem video
/media?key=MEDIA_PHOTOS&type=video
```

## Bước 7: Tối ưu Performance

### 7.1. Tạo Thumbnails

Để load nhanh hơn, tạo thumbnail cho ảnh:

```bash
# Sử dụng ImageMagick hoặc FFmpeg
cd "E:\Photos\2024\01-January"
mkdir .thumbnail

# Convert tất cả ảnh sang thumbnail
for %i in (*.jpg) do magick "%i" -resize 400x400 ".thumbnail\%i"
```

### 7.2. Cấu hình Cache

Backend tự động cache với headers:

```javascript
Cache-Control: public, max-age=3600, must-revalidate
```

## 🎯 Tips & Tricks

### Keyboard Shortcuts (Lightbox)

- `←` / `→` : Previous/Next photo
- `Esc` : Close lightbox
- `F` : Toggle favorite

### URL Parameters

```bash
key=MEDIA_PHOTOS           # Root path
view=photos|timeline|albums|favorites
type=image|video
year=2024
month=11
albumId=1
page=1
limit=100
```

### Scan incrementally

Chạy scan định kỳ để update:

```bash
# Cron job (Linux/Mac)
0 2 * * * curl -X POST https://localhost:3000/api/media/scan-media \
  -H "Content-Type: application/json" \
  -d '{"key":"MEDIA_PHOTOS"}'
```

## 🐛 Troubleshooting

### Lỗi: "Root path không tồn tại"

✅ Check đường dẫn trong `.env`  
✅ Verify folder exists  
✅ Restart server

### Lỗi: Ảnh không hiển thị

✅ Check file permissions  
✅ Verify supported formats (jpg, png, webp, etc.)  
✅ Run scan lại

### Performance chậm

✅ Giảm `limit` xuống 50  
✅ Tạo thumbnails  
✅ Enable browser cache

## 📚 Đọc thêm

- [Full Documentation](./MEDIA-GALLERY.md)
- [API Reference](./MEDIA-GALLERY.md#-api-endpoints)
- [Database Schema](./MEDIA-GALLERY.md#-cấu-hình)

---

**Happy organizing your photos! 📸✨**
