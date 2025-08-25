# Changelog

## 5.0.1 - 2025-08-25

- React-app: Standardize MangaHome header structure - thêm Back/Home button với FiArrowLeft/FiHome icons, chuyển sang Breadcrumb component, cập nhật view mode buttons với gray container background và React Icons để match với Music/Movie layout.
- React-app: Standardize UI layout across all Home pages (Manga, Music, Movie) - wrap toàn bộ main content trong container có background trắng/xám, rounded border và padding đồng nhất.
- React-app: MangaHome, MusicHome, MovieHome giờ có cùng container structure: Random sections riêng biệt + Main container bao quanh header/controls/content để tạo visual hierarchy nhất quán.
- React-app: Cập nhật spacing và layout để đồng nhất giữa các modules: `mb-8 px-6` cho random sections, `p-6` cho outer container, `p-6` cho main container.
- React-app: Fix MangaRandomSection width alignment - loại bỏ responsive max-width constraints để slider có width đồng nhất với main grid container như Movie và Music.
- React-app: Remove refresh buttons khỏi tất cả Home pages (Manga, Music, Movie) để simplify UI - data sẽ tự động refresh khi navigate.
- React-app: Simplify filter buttons - loại bỏ text "Filters", chỉ giữ lại icon để UI cleaner và compact hơn.
- React-app: Standardize MovieHome grid layout để match MusicHome - cập nhật `xl:grid-cols-6` và `gap-4`, thêm statistics cards để có UI consistency.
- React-app: Unify view mode toggle buttons layout - MovieHome giờ có cùng styling với MusicHome: view mode buttons được wrap trong gray background container với rounded corners để tạo button group effect.
- React-app: Standardize MovieHome header structure - thay đổi breadcrumb thành Breadcrumb component, thêm Back button với FiArrowLeft/FiHome icons, cập nhật icons từ Lucide sang React Icons để match với MusicHome.
- React-app: Fix Home button functionality - MovieHome Home button giờ navigate về trang chủ `/` khi ở root level, Back button navigate về parent folder như expected.

## 5.0.1 - 2025-08-24

- Backend: Mở rộng CORS để cho phép origin từ Tailscale (*.ts.net) trong môi trường development, thêm header `x-secure-token` vào danh sách allowedHeaders để tránh lỗi preflight khi React gửi kèm token.
- Backend: Đọc `CORS_EXTRA_ORIGINS` từ `.env` để whitelist các origin bổ sung (ví dụ domain Tailscale cụ thể).
- React (Vite): Bật `server.host=true` để lắng nghe 0.0.0.0, cố định cổng và thêm cấu hình HMR qua biến môi trường `VITE_HMR_HOST`/`VITE_HMR_PORT` cho truy cập qua domain Tailscale. Thêm `server.allowedHosts` (bao gồm regex `*.ts.net` và biến `VITE_ALLOWED_HOSTS`) để tránh lỗi "This host is not allowed" của Vite khi truy cập bằng domain Tailscale.
- Ghi chú: 3000 tiếp tục phục vụ frontend tĩnh; 3001 chạy React dev app, API được proxy về 3000.

