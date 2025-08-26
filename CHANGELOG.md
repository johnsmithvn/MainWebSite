# Changelog

## 5.0.3 - 2025-08-26

- React-app: Đồng nhất wrapper styling giữa slider sections và main containers - tất cả slider components (RandomSlider, TopViewSlider, RecentSlider) giờ sử dụng `rounded-lg border border-gray-200 dark:border-gray-700` thay vì `rounded-xl shadow-sm` để match với main container styling.
- React-app: Standardize container layout - slider sections được wrap trong `p-3 sm:p-6 pb-0` để có cùng horizontal padding với main content container, tạo visual hierarchy nhất quán.
- React-app: Fix container spacing - loại bỏ `mb-4 sm:mb-8` gap giữa slider sections và main containers, thay vào đó sử dụng `pb-0` cho slider wrapper để tạo spacing tự nhiên từ `mb-4 sm:mb-6` của slider components.
- React-app: Apply consistent wrapper styling across all Home pages (Manga, Movie, Music) - đảm bảo slider sections và main content có cùng container structure và visual styling.
- React-app: Fix slider viewport overflow on mobile - giảm slide width từ 50% xuống 35% trên mobile, giảm gap từ 0.75rem xuống 0.25rem để tránh tràn viewport.
- React-app: Responsive slider improvements - thêm `overflow: hidden` cho RandomSlider container, responsive padding cho header (`p-3 sm:p-6`), và responsive dots spacing.
- React-app: Optimized card aspect ratios on mobile - manga cards từ `aspect-[3/4]` xuống `aspect-[2/3]`, video cards thành `aspect-[16/10]` để giảm height.
- React-app: Mobile container constraints - thêm `max-width: 100%` và improved overflow handling cho embla containers để đảm bảo không tràn viewport.
- React-app: Reduced mobile gaps - slider gap từ 0.5rem xuống 0.25rem, dots gap từ 0.5rem xuống 0.25rem, padding từ 1.5rem xuống 0.5rem trên mobile.
- React-app: Fix responsive viewport overflow issues - loại bỏ inconsistent padding giữa random sections và main containers để tránh tràn viewport trên mobile.
- React-app: Cải thiện responsive spacing - chuyển từ `px-6` và `p-6` sang `p-3 sm:p-6` để giảm padding trên mobile, `mb-4 sm:mb-8` cho section spacing.
- React-app: Tối ưu grid layout responsive - cập nhật grid từ `grid-cols-2 md:grid-cols-4 lg:grid-cols-6` thành `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6` để tối ưu breakpoints.
- React-app: Fix slider overflow - loại bỏ `padding-left/right` cho embla container trên mobile trong embla.css để tránh double padding.
- React-app: Responsive gap improvements - chuyển từ `gap-4` thành `gap-2 sm:gap-4` cho grid layouts để tiết kiệm không gian trên mobile.
- React-app: Statistics cards responsive - cập nhật từ `grid-cols-1 md:grid-cols-4` thành `grid-cols-1 sm:grid-cols-2 md:grid-cols-4` để cải thiện tablet layout.
- React-app: Đồng bộ responsive design cho tất cả Home pages (Manga, Movie, Music) với cùng pattern: responsive padding, consistent grid breakpoints, và optimized spacing.

## 5.0.2 - 2025-08-25

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

