# Changelog

## 5.0.7 - 2025-09-09

### 🗑️ Enhanced Cache Cleanup Mechanism

- **Complete deletion system**: Implement `deleteChapterCompletely()` function để xóa cả metadata (IndexedDB) và images (Cache Storage) thay vì chỉ xóa metadata
- **Bulk cleanup utility**: Thêm `clearAllOfflineData()` function để xóa toàn bộ offline data với detailed progress reporting
- **Storage analysis**: Implement `getStorageAnalysis()` để theo dõi storage usage, quota, và statistics chi tiết
- **Enhanced OfflineLibrary UI**: Thêm storage statistics dashboard, storage quota bar, và Clear All button với confirmation modal
- **Smart cleanup logic**: Xóa images theo từng URL trong chapter.pageUrls, handle orphan images, và recreate fresh cache storage
- **Progress feedback**: Detailed success/error messages với stats về số images deleted, bytes freed, và failure counts

### 📊 Storage Management Dashboard

- **Storage statistics card**: Hiển thị chapters count, total images, storage size, và storage quota percentage
- **Visual quota indicator**: Progress bar với color coding (green/yellow/red) based on usage percentage
- **Available vs Used display**: Show used storage, available space, và total quota với human-readable formatting
- **Real-time updates**: Statistics auto-refresh sau mỗi delete operation để reflect current state

### 🎯 Cache Cleanup User Experience

- **Confirmation dialogs**: Safe delete với preview của data sẽ bị xóa (chapters, images, storage size)
- **Detailed toast messages**: Success toasts hiển thị exact numbers (deleted images, bytes freed, success rate)
- **Loading states**: Proper loading indicators cho delete operations với toast notifications
- **Error resilience**: Handle partial failures gracefully, continue deletion process even khi một số images fail
- **Atomic operations**: Ensure data consistency khi delete metadata và cache storage

### 🔧 Technical Implementation

- **Hybrid storage cleanup**: Coordinated deletion across IndexedDB metadata và Cache Storage images
- **Error handling**: Comprehensive try-catch với detailed error logging và user feedback
- **Memory optimization**: Efficient batch processing cho large deletion operations
- **Cache consistency**: Ensure no orphan images left behind sau khi delete chapters
- **Storage estimation**: Accurate byte counting và progress tracking cho deletion operations

### 🚀 Performance & Reliability

- **Batch processing**: Efficient handling của large numbers of chapters và images
- **Progress tracking**: Real-time progress reporting cho long-running deletion operations
- **Fallback mechanisms**: Graceful degradation khi Storage Quota API không available
- **Cleanup verification**: Post-deletion verification để ensure complete cleanup
- **Resource management**: Proper cleanup của temporary objects và memory usage

## 5.0.6 - 2025-09-09

### 🎨 Offline Library UI Redesign

- **Card-based layout**: Hoàn toàn redesign Offline Library với card layout tương tự Manga Favorites
- **Cover image display**: Hiển thị ảnh bìa (trang đầu tiên) cho mỗi chapter downloaded
- **Dual view modes**: Support cả Grid view và List view với toggle button
- **Search functionality**: Client-side search theo tên manga/chapter
- **Advanced sorting**: Sort theo ngày tải (mới nhất lên đầu), cũ nhất, và tên A-Z
- **Enhanced metadata**: Lưu cover image, improved title extraction từ path
- **Responsive design**: Optimized cho mobile với responsive grid layout

### 📊 Enhanced Chapter Information

- **Visual indicators**: Badge hiển thị số trang, file size, ngày tải
- **Better title extraction**: Tách manga title (parent folder) và chapter title (current folder)
- **Timestamp display**: Hiển thị ngày giờ tải với format Việt Nam
- **Storage info**: Hiển thị file size ước tính (MB)
- **Cover image fallback**: Default cover khi không có ảnh hoặc lỗi load

### 🎯 User Experience Improvements

- **Hover interactions**: Overlay buttons xuất hiện khi hover vào card
- **Action buttons**: Read và Delete buttons với proper icons và tooltips
- **Empty states**: Friendly messages khi chưa có chapter hoặc không tìm thấy
- **Loading states**: Proper loading indicator khi tải danh sách
- **Toast notifications**: Success/error messages cho các actions
- **Auto-refresh**: Danh sách tự động cập nhật sau khi delete

### 🔧 Technical Enhancements

- **Memory optimization**: Efficient filtering và sorting với useMemo
- **Error handling**: Improved error handling cho image loading và operations
- **CSS utilities**: Thêm line-clamp utilities cho text truncation
- **Component modularity**: Tách ChapterCard và ChapterListItem components
- **Accessibility**: Proper alt texts, focus states, và keyboard navigation

### 📱 Mobile Responsiveness

- **Responsive grid**: 2-6 columns tùy screen size (2 mobile → 6 desktop)
- **Touch-friendly**: Appropriately sized touch targets
- **Mobile controls**: Optimized search bar và control layout cho mobile
- **Compact list view**: Alternative view cho screens nhỏ

## 5.0.5 - 2025-09-09

### 📥 Offline Library & Download Improvements

- **Bug fixes**: Sửa lỗi trong service worker `cacheFirst` function - thêm `const resp = await fetch(request)` bị thiếu để xử lý network requests đúng cách.
- **CORS improvements**: Đổi từ `mode: 'no-cors'` sang `mode: 'cors'` trong `offlineLibrary.js` để có thể đọc response body và tính toán blob size chính xác.
- **Enhanced error handling**: Thêm proper error logging trong catch blocks thay vì để trống, cải thiện khả năng debug.
- **Download progress tracking**: Thêm `isChapterDownloaded()` function để kiểm tra trạng thái chapter đã download.
- **Progress callbacks**: Cải thiện `downloadChapter()` với progress callback để theo dõi tiến trình download real-time.
- **Error resilience**: Download tiếp tục với page tiếp theo khi một page fail thay vì dừng hoàn toàn.

### 🎨 Reader UI Enhancements

- **Download button states**: Thêm visual indicators cho download button:
  - Loading spinner với progress percentage khi đang download
  - Green checkmark (✓) indicator khi chapter đã download offline
  - Disabled state và opacity khi đang download
- **Download progress modal**: Thêm `DownloadProgressModal` component hiển thị:
  - Progress bar với percentage
  - Realtime status (starting, downloading, completed, error)
  - Current page info và file name
  - Total pages và estimated size
  - Auto-close sau 3 giây khi hoàn thành
- **Reader header improvements**:
  - Visual feedback cho offline-available chapters
  - Responsive progress display trên mobile
  - Tooltip cho các trạng thái download khác nhau

### 🎯 Technical Improvements

- **State management**: Thêm `isDownloading`, `downloadProgress`, `isChapterOfflineAvailable` states trong MangaReader
- **Props enhancement**: Cập nhật ReaderHeader props để support download states và progress tracking
- **CSS animations**: Thêm spinner animation và download button transitions
- **Mobile optimization**: Responsive design cho download progress UI elements

### 🔧 Developer Experience

- **Better debugging**: Enhanced console logging cho download progress và cache status
- **Type safety**: Improved prop validation cho download-related components
- **Code organization**: Tách download logic thành reusable functions với error handling

## 5.0.4 - 2025-08-26

- React-app: Cải thiện responsive layout cho tất cả Home pages (Manga, Movie, Music) - Home/Back button chỉ hiển thị icon (ẩn text) trên mobile để tiết kiệm không gian.
- React-app: Responsive controls layout - các controls (per-page selector, filter button, view mode toggle) xuống dòng riêng và align bên trái trên mobile, thêm label "Per page:" và "Filter" text trên desktop.
- React-app: Header flex layout optimization - chuyển từ single row justify-between sang flex-col lg:flex-row để controls tự động wrap xuống dòng mới trên mobile devices.
- React-app: Enhanced UX với tooltips cho view mode buttons và responsive text labels cho các controls để UI rõ ràng hơn.
- React-app: Đồng nhất layout pattern across all modules - search bar được tách riêng và có width nhất quán, controls group có cùng spacing và alignment.
- React-app: Standardized responsive breakpoints - sử dụng lg: breakpoint cho desktop layout, sm: cho tablet/mobile text labels.
- React-app: Random sliders responsive improvements - ẩn navigation buttons (prev/next) trên mobile để UI cleaner, chỉ hiển thị từ sm breakpoint trở lên.
- React-app: Internationalization cho sliders - chuyển time range từ tiếng Việt sang tiếng Anh ("just now", "minutes ago", "hours ago" thay vì "vừa xong", "phút trước", "giờ trước").
- React-app: Loại bỏ Vietnamese locale từ date-fns imports để sử dụng English mặc định cho tất cả timestamp formatting trong sliders.
- React-app: Text truncation cho slider headers - thêm `truncate` class cho titles, `flex-shrink-0` cho badges/timestamps, `whitespace-nowrap` cho timestamp text để tránh text overflow trên mobile.
- React-app: Flexible header layout - sử dụng `min-w-0 flex-1` cho title container và `flex-shrink-0` cho control buttons để đảm bảo responsive layout tốt hơn.
- React-app: Fix slider padding overflow - loại bỏ conflicting negative margins và thống nhất padding trong embla containers để tránh content tràn ra ngoài slider boundaries.
- React-app: Consistent slider spacing - sử dụng `padding: 0 0.75rem` cho desktop và `padding: 0 0.5rem` cho mobile trong embla__container thay vì margin hacks.

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

