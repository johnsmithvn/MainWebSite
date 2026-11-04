# 🚀 Media Gallery — Bắt đầu nhanh

> Đối chiếu với code ngày 2026-11-04. Cài đặt chung (Node, `.env`, chạy server): [readme.md](../readme.md). Tài liệu đầy đủ (API, schema): [MEDIA-GALLERY.md](MEDIA-GALLERY.md).

Media Gallery hiển thị ảnh, video và mọi loại file khác trong một thư mục, kiểu Google Photos: duyệt theo thư mục, xem theo dòng thời gian, album, yêu thích.

---

## 1. Khai báo thư mục

Thêm vào `backend/.env` một hoặc nhiều dòng có tiền tố `MEDIA_`:

```env
MEDIA_PHOTOS=E:/Photos
MEDIA_CAMERA=D:/DCIM/Camera
```

- Thư mục phải **tồn tại** lúc server khởi động, nếu không key bị bỏ qua.
- Muốn bắt đăng nhập mới xem được: thêm key vào `SECURITY` (VD `SECURITY=V_MOVIE,MEDIA_PHOTOS`).
- Sửa xong thì khởi động lại server (`npm run dev`).

## 2. Thumbnail (tuỳ chọn)

Scanner **không tự tạo** thumbnail cho ảnh. Nếu một thư mục có thư mục con `.thumbnail` chứa ảnh **cùng tên** (bất kỳ đuôi ảnh nào), ảnh đó được dùng làm thumbnail; nếu không, grid hiển thị ảnh gốc.

```
E:\Photos\2024\
├── IMG_001.jpg
├── IMG_002.jpg
└── .thumbnail\
    ├── IMG_001.jpg      ← thumbnail của IMG_001.jpg
    └── IMG_002.webp
```

Tạo hàng loạt bằng ImageMagick (chạy trong `cmd` tại thư mục ảnh):

```bat
mkdir .thumbnail
for %i in (*.jpg) do magick "%i" -resize 400x400 ".thumbnail\%i"
```

## 3. Mở gallery và quét dữ liệu

1. Mở app (`http://localhost:3001` khi dev, `http://localhost:3000` khi production).
2. Ở trang chủ, chọn nguồn `MEDIA_PHOTOS` → app chuyển tới `/media?key=MEDIA_PHOTOS`.
3. Mở **Sidebar → Công cụ 📸 Media → Quét Media**. Hộp thoại cho phép nhập đường dẫn con để chỉ quét một thư mục.
   Bật thêm **shallow** để chỉ quét các file và thư mục nằm ngay trong đường dẫn đó, không đi sâu hơn.
4. Khi quét xong, hộp thoại hiện số mục *Thêm / Sửa / Xoá*. Quét lại mỗi khi thêm file mới.

Quét bằng API (VD từ script định kỳ):

```bash
curl -X POST http://localhost:3000/api/media/scan-media \
  -H "Content-Type: application/json" \
  -d '{"key":"MEDIA_PHOTOS"}'
```

Body có thể thêm `"path": "2024"` (chỉ quét thư mục con) và `"shallow": true`. Kết quả:

```json
{
  "success": true,
  "stats": { "folders": 12, "inserted": 150, "updated": 5, "skipped": 200, "deleted": 10 },
  "message": "Scan media thành công!"
}
```

> Gọi API từ chính máy chủ (`127.0.0.1`) là qua được whitelist. Nếu key nằm trong `SECURITY`, request phải kèm header `x-secure-token: <SECURITY_PASSWORD>`.

## 4. Các chế độ xem

Chuyển bằng các tab trên toolbar; mỗi tab tương ứng một tham số `view` trên URL:

| Tab | URL | Nội dung |
|-----|-----|----------|
| Photos | `/media?key=MEDIA_PHOTOS` | Duyệt theo thư mục (`&path=2024/Tet`), hiện thư mục con và file |
| Timeline | `&view=timeline` | Ảnh/video nhóm theo tháng, mới nhất trước |
| Albums | `&view=albums` | Danh sách album; mở một album: `&view=albums&albumId=1` |
| Favorites | `&view=favorites` | Các mục đã đánh dấu yêu thích |

> Ngày trong Timeline hiện là **ngày sửa file** (scanner chưa đọc EXIF).

Lọc thêm bằng tham số URL (chỉ áp dụng cho Timeline, Favorites và album; chưa có nút trên giao diện): `type=image|video`, `year=2024`, `month=11`.

## 5. Thao tác thường dùng

| Việc | Cách làm |
|------|----------|
| Xem ảnh/video lớn | Click vào mục → mở lightbox |
| Chuyển ảnh / đóng / zoom trong lightbox | `←` `→` · `Esc` · `+` `-` |
| Yêu thích | Nút ❤️ trên ảnh hoặc trong lightbox |
| Tải file về máy | Nút tải xuống trong lightbox |
| Chọn nhiều | Giữ `Shift` hoặc `Ctrl` rồi click |
| Thêm vào album | Chọn nhiều → **Add to Album** trên toolbar → chọn album |
| Tạo album | Tab **Albums** → **New Album** → nhập tên, mô tả |
| Xoá một mục | Nút thùng rác → xác nhận. Chỉ xoá khỏi **database**, file trên ổ đĩa vẫn còn (quét lại sẽ thêm lại) |

## 6. Xử lý sự cố

| Hiện tượng | Cách xử lý |
|------------|-----------|
| Không thấy nguồn `MEDIA_…` ở trang chủ | Kiểm tra đường dẫn trong `backend/.env` có tồn tại, khởi động lại server |
| Gallery trống | Chưa quét — làm bước 3 |
| Có file mới nhưng không hiện | Quét lại (toàn bộ hoặc chỉ thư mục chứa file mới) |
| Thumbnail thư mục không hiện | Lỗi đã biết ([ISSUES B8](ISSUES-REPORT.md)) |
| Tải trang chậm với thư mục rất lớn | Tạo thumbnail (bước 2) để không phải tải ảnh gốc |
