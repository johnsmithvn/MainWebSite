#Hướng dẫn cài đặt và chạy dự án

Dự án sử dụng Node.js để phục vụ nội dung tĩnh (manga, phim, nhạc) từ máy tính cá nhân. 
Sau đây là các bước cài đặt cơ bản.

## Chuẩn bị môi trường

1. Cài đặt **Node.js** (khuyến nghị >= v18).
2. Tại thư mục `backend/` sao chép file `.env.example` thành `.env` và chỉnh sửa các đường dẫn:
   ```bash
   cp backend/.env.example backend/.env
   # Mở backend/.env và thay đổi ROOT_*, V_*, M_* cho phù hợp
   ```
   - `ROOT_*`   : Thư mục chứa manga.
   - `V_*`      : Thư mục chứa phim.
   - `M_*`      : Thư mục chứa nhạc.
   - `ALLOWED_HOSTNAMES` và `ALLOWED_IPS` dùng để giới hạn truy cập.
   - `SECURITY` liệt kê các root key bảo vệ bằng mật khẩu, phân tách bằng dấu phẩy.
   - `SECURITY_PASSWORD` mật khẩu dùng cho các root key ở biến `SECURITY`.

## Cài đặt phụ thuộc

```bash
npm install
```

Lệnh trên sẽ cài đặt các gói cần thiết (bao gồm `esbuild` để đóng gói mã nguồn).

## Đóng gói mã nguồn tĩnh

```bash
npm run build
```

Kết quả được đặt tại `frontend/public/dist` với các file `.js` và `.css` đã được minify.

## Chạy server

```bash
npm start
```

Ứng dụng sẽ chạy mặc định tại `http://localhost:3000` (có thể thay đổi trong file `.env`).

## Lưu ý

- Nội dung tĩnh được nén gzip để giảm dung lượng tải xuống.
- Truy cập qua mạng LAN hoặc 4G cần đảm bảo địa chỉ IP/hostname nằm trong danh sách `ALLOWED_HOSTNAMES` hoặc `ALLOWED_IPS` trong file `.env`.
- File trong dist được tạo ra khi chạy build nó là cache không đc đẩy lên
- nếu muốn k muốn chạy cache dist nữa thì bỏ comment  
// bỏ cái này nếu muốn dùng static trong src nghĩa là k dùng trong dist

``app.use("/src", express.static(path.join(__dirname, "../frontend/src")));  
``

- nó sẽ chạy thằng fronend trong src luôn
lúc

lúc trước trong html có style gọi thẳng css từ trong style 

nhưng giờ sử dụng ``    <link rel="stylesheet" href="/dist/home.css" />
`` được ạo khi build để giảm tải load


