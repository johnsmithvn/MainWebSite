# Hướng dẫn cài đặt và chạy dự án

Dự án sử dụng Node.js để phục vụ nội dung tĩnh (manga, phim, nhạc) và một ứng dụng React cho phần giao diện.

## Chuẩn bị môi trường

1. Cài đặt **Node.js** (khuyến nghị >= v18).
2. Tại thư mục `backend/` sao chép file `.env.example` thành `.env` và chỉnh sửa các đường dẫn:
   ```bash
   cp backend/.env.example backend/.env
   ```
   - `ROOT_*`, `V_*`, `M_*` cấu hình thư mục chứa dữ liệu.
   - `ALLOWED_HOSTNAMES`, `ALLOWED_IPS` giới hạn truy cập.
   - `SECURITY` và `SECURITY_PASSWORD` bảo vệ bằng mật khẩu.

## Cài đặt phụ thuộc

Cài đặt toàn bộ gói cho cả backend và React trong một lần:

```bash
npm install
```

## Chế độ phát triển

Chạy đồng thời backend (http://localhost:3000) và React (http://localhost:3001):

```bash
npm run dev
```

React sử dụng proxy nên có thể gọi API `/api` bình thường mà không gặp vấn đề CORS.

## Đóng gói sản phẩm

```bash
npm run build
```

Lệnh trên sẽ:

- Build các file tĩnh của backend vào `frontend/public/dist`.
- Build ứng dụng React vào `react-app/dist` với `base` là `/app`.

Sau khi build, backend có thể phục vụ React tại `http://localhost:3000/app`.

## Chạy server

```bash
npm start
```

Ứng dụng sẽ chạy tại `http://localhost:3000`.

## Lưu ý

- Nội dung tĩnh được nén gzip để giảm dung lượng tải xuống.
- Truy cập qua mạng LAN hoặc 4G cần đảm bảo địa chỉ IP/hostname nằm trong danh sách `ALLOWED_HOSTNAMES` hoặc `ALLOWED_IPS` trong file `.env`.
