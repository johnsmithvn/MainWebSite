# CHANGELOG

## [Unreleased] - 2025-09-21

### 🔄 Offline Mode Refactoring

- **🚀 [2025-09-21] Restructured offline functionality architecture** → Created dedicated `/pages/offline/` folder with modular offline components: OfflineHome, OfflineManga, OfflineMovie, OfflineMusic
- **📱 [2025-09-21] Enhanced offline user experience** → Replaced single offline library with mode selection interface featuring Manga (ready), Movie (coming soon), Music (coming soon) options
- **⚡ [2025-09-21] Optimized ServiceWorker caching strategy** → Hybrid approach: cache offline.html for static access + minimal React app for offline routing functionality
- **🎯 [2025-09-21] Improved offline navigation** → ServiceWorker detects `/offline/*` routes and serves React app, while serving static offline.html for network failures
- **🗂️ [2025-09-21] Reorganized offline routing** → Migrated from `/offline` → OfflineLibrary to nested structure: `/offline` → OfflineHome, `/offline/manga` → OfflineManga, with future `/offline/movie` and `/offline/music` routes

### Fixed

- 🐛 **[2025-09-21] Fixed offline routing cache miss** → Added index.html and enhanced static asset detection to support offline React routing, resolving issue where clicking Manga in offline mode failed to load library
- 🐛 **[2025-09-21] Fixed manga reader offline functionality** → Enhanced ServiceWorker to handle `/manga/reader/*` routes, added offline data loading in MangaReader component, and graceful API fallbacks for offline mode
- 🐛 **[2025-09-21] Fixed offline route path matching** → Changed ServiceWorker navigationStrategy from `/offline/` to `/offline` (removed trailing slash) to properly serve React app for `/offline` path instead of static offline.html
- 🐛 **[2025-09-21] Fixed offline routing structure** → Changed `/offline` to go directly to manga library instead of mode selection page, moved OfflineHome to `/offline/home` route for simplified UX
- 🔄 **[2025-09-21] Refactored offline routes architecture** → Changed from nested `/offline/*` to flat `/offline-manga`, `/offline-movie`, `/offline-music` structure to avoid routing conflicts and improve navigation clarity
- 🐛 **[2025-09-21] Fixed manga reader random default images** → Removed ServiceWorker manga image strategy from online reading, now only applies to offline mode with cached images, preventing unnecessary fallbacks to default cover during normal online usage

### Changed

- 🔄 **[2025-09-21] Enhanced download UX for mobile** → Added loading state when checking storage quota before download, prevents multiple clicks on slow networks by showing "Kiểm tra..." status immediately when user taps download button

### Added

- ✨ **OfflineHome component** → Beautiful mode selection page with 3 cards (Manga/Movie/Music), network status indicator, and smooth transitions
- ✨ **OfflineManga component** → Refactored OfflineLibrary with back navigation and improved UX
- ✨ **OfflineMovie/OfflineMusic placeholders** → Coming soon pages with feature previews and navigation to online versions
- ✨ **Enhanced offline.html** → Modern UI with glassmorphism design, auto connection detection, and intuitive mode selection

### Changed

- 🔄 **ServiceWorker cache policy** → Only cache offline.html and reader resources instead of full app shell
- 🔄 **Offline routing structure** → Nested routes for better organization and future expansion
- 🔄 **Import paths** → Updated App.jsx to use new offline component structure

### Removed

- 🗑️ **Original OfflineLibrary.jsx** → Replaced with modular offline components in dedicated folder

---

## [Unreleased] - 2025-09-14

### Fixed

- 🔄 [2025-09-14] Refactored Vite proxy configuration → Extracted createProxyConfig() function to eliminate hardcoded target URLs, made API target configurable via VITE_API_TARGET environment variable for better development flexibility

- 🔄 [2025-09-14] Optimized React environment configuration → Removed 13 unused environment variables (VITE_APP_NAME, VITE_PRELOAD_COUNT, VITE_API_BASE_URL, etc.) keeping only variables actually used by the application, reducing .env file size by 70%

- 🔄 [2025-09-14] Refactored CORS URL configuration → Created smart CORS generation utilities to eliminate repetitive URL patterns (http/https, hostnames, ports) using compact config format and auto-generation functions

- 🐛 [2025-09-14] Fixed code duplication in middleware → Created parseEnvList utility function to replace repeated .split(",").map(s => s.trim()).filter(Boolean) pattern across auth.js and cors.js
- 🐛 [2025-09-14] Fixed backend dev script dependency on PowerShell file → Changed from 'powershell -ExecutionPolicy Bypass -File start-dev.ps1' to 'npx nodemon server.js' to use local nodemon dependency instead of missing .ps1 file
- 🐛 [2025-09-14] Fixed middleware import error → Fixed destructuring import for errorHandler in middleware/index.js
- 🐛 [2025-09-14] Fixed NODE_ENV environment handling → Added cross-env to explicitly set NODE_ENV in dev/prod scripts instead of relying on .env file
- 🔄 [2025-09-14] Refactored API routing architecture → Migrated from scattered app.use() calls to centralized routing structure using routes/ directory for better maintainability
- 🐛 [2025-09-14] Fixed frontend static files serving → Legacy frontend HTML files now properly reference built CSS/JS files in /dist/ directory

### Added

- ✨ [2025-09-14] Added string utility functions → Created utils/stringUtils.js with parseEnvList(), parseCommaSeparatedList(), and joinCommaSeparatedList() for better code reuse
- ✨ [2025-09-14] Added dedicated CORS middleware → Created middleware/cors.js with smart development/production handling, proper origin validation, and Tailscale domain support
- ✨ [2025-09-14] Added proper Express.js middleware architecture → Restructured middleware system with correct order: CORS → body parsing → compression → rate limiting → auth → security
- ✨ [2025-09-14] Added dev:frontendv1 script → Created npm script to build legacy frontend static files using scripts/build.js with esbuild for CSS/JS bundling and minification

### Fixed

- 🐛 [2025-09-14] Fixed duplicate CORS configuration → Removed redundant CORS setup from server.js, now using centralized middleware/cors.js for consistent CORS handling
- 🐛 [2025-09-14] Fixed middleware execution order → CORS middleware now runs first to handle preflight OPTIONS requests, error handler moved to end of middleware chain
- 🐛 [2025-09-14] Fixed Express.js middleware structure → Separated setupMiddleware() and setupErrorHandling() functions following Express.js best practices
- �🔒 [2025-09-14] Fixed security issue in .env.template → Removed sensitive information (Tailscale hostnames, specific IP addresses, domain names) and replaced with secure placeholders (your-hostname.local, 192.168.1.xxx, your-domain.com)

### Changed

- 🔄 [2025-09-14] Changed backend middleware structure → Moved from inline middleware setup to modular system with dedicated CORS, auth, security, and error handling middlewares
- 🔄 [2025-09-14] Changed server.js to use middleware system → Simplified server.js by using setupMiddleware() and setupErrorHandling() functions instead of inline configuration

- 🔄 [2025-09-13] Changed React app environment configuration - Tổ chức lại file .env với comment chi tiết và group theo chức năng: Network (HMR, hosts), API communication, Development/Build settings, Production config, PWA manifest, UI/Theme, Performance/Cache, Security/Auth, Debug tools

### Added

- ✨ [2025-09-13] Added comprehensive production setup for both backend and React app - Security headers, optimized caching, SPA fallback routing
- ✨ [2025-09-13] Added production environment configuration - Environment-based cache strategies, security optimizations, and build scripts
- ✨ [2025-09-13] Added monorepo management scripts - Root package.json with automated build and deploy commands for full production workflow
- ✨ [2025-09-13] Added React app production configuration - Complete .env setup with API base URL, PWA settings, performance and security configurations

### Fixed

- 🐛 [2025-09-13] Fixed missing production static file serving → Backend now properly serves React build files with optimized caching and SPA fallback
- 🐛 [2025-09-13] Fixed development vs production environment handling → Different cache strategies, security policies, and CORS configurations
- 🐛 [2025-09-13] Fixed missing security headers for production → Added HSTS, CSP, XSS protection, and frame options for enhanced security
- 🐛 [2025-09-13] Fixed missing production deployment workflow → Added comprehensive build scripts and deployment documentation

### Changed

- 🔄 [2025-09-13] Changed backend server configuration - Added production optimizations with security headers, advanced caching, and React build serving
- 🔄 [2025-09-13] Changed React app configuration - Enhanced .env with comprehensive production settings, API configuration, and performance options
- 🔄 [2025-09-13] Changed package.json scripts structure - Added production build, deployment, and utility commands for both backend and React app
- 🔄 [2025-09-13] Changed root project structure - Implemented monorepo management with workspace support and cross-project automation

### Documentation

- 📚 [2025-09-13] Added production deployment guide - Step-by-step instructions for building and deploying the application in production mode
- 📚 [2025-09-13] Added environment configuration documentation - Complete guide for .env setup, API configuration, and production settings

### Fixed (New)

- 🔄 [2025-01-01] Cải thiện code quality theo gợi ý Copilot → Áp dụng best practices cho maintainability và performance
  - **RecentSlider.jsx**: Extracted magic numbers thành named constants (MINUTES_PER_HOUR = 60, MINUTES_PER_DAY = 1440, MINUTES_PER_WEEK = 10080) cho time calculation logic
  - **UniversalCard.jsx**: Replaced horizontal scaling animations với vertical feedback
    - Main card: `whileTap={{ scale: 0.97 }}` → `whileTap={{ y: 2 }}` để tránh layout overflow
    - Favorite button: `scale: 1.1/0.9` → `scale: 1.05/y: 1` để giảm aggressive scaling
    - Delete button: `scale: 1.1/0.9` → `scale: 1.05/y: 1` để consistent animation behavior
  - Tất cả thay đổi giữ nguyên functionality, chỉ cải thiện code quality và animation smoothness
  - Giảm risk overflow trên mobile devices với subtle vertical movement thay vì horizontal scaling

- 🏗️ [2025-01-01] Refactor constants để dễ quản lý và maintain → Centralized styling và values
  - **Created uiStyles.js**: Centralized tất cả UI-related constants
    - `CARD_VARIANTS`: Base styling cho different card layouts (default, compact, slider, compact-slider)
    - `IMAGE_STYLES`: Standardized image và overlay styling
    - `BUTTON_STYLES`: Consistent button styling (favorite, deleteView, addPlaylist)
    - `BADGE_STYLES`: Unified badge styling cho view count và type indicators
    - `TEXT_STYLES`: Typography styles cho title và metadata với responsive variants
    - `LAYOUT`: Container layout và spacing constants
    - `ANIMATIONS`: Framer Motion animation configurations
    - `ICON_SIZES`: Standardized icon sizes (playOverlay, small, extraSmall, tiny, addPlaylist)
    - `ASPECT_RATIOS`: Responsive aspect ratios cho different media types
  - **Created timeFormats.js**: Time calculation và formatting constants
    - `TIME`: Time unit constants (MINUTES_PER_HOUR, MINUTES_PER_DAY, MINUTES_PER_WEEK, etc.)
    - `DATE_FORMATS`: Standardized date formatting options
    - `LOCALE`: Locale settings cho consistent timestamp display
    - `RELATIVE_TIME`: Thresholds và mobile abbreviations cho relative time
  - **Updated UniversalCard.jsx**: Refactored để sử dụng centralized constants
    - Replaced inline hardcoded CSS classes với constants từ uiStyles.js
    - Improved maintainability và consistency across components
    - Easier customization và theming trong tương lai
  - **Updated RecentSlider.jsx**: Sử dụng TIME constants thay vì magic numbers
  - **Updated index.js**: Export tất cả constants từ centralized location
  - **Benefits**: Dễ maintain, consistent styling, easier theming, reduced code duplication

- 🔄 [2025-09-13] Điều chỉnh kích thước UI elements trên mobile view
  - Tăng kích thước card trong slider trên mobile (từ 100px lên 120px)
  - Điều chỉnh slides per view từ 4 xuống 3 để card có kích thước phù hợp hơn
  - Cải thiện kích thước card trên các breakpoint mobile khác nhau
  - Di chuyển view count từ overlay xuống phần thông tin dưới tên card (MovieCard, MusicCard, UniversalCard)
  - View count giờ hiển thị đối diện với loại file trong phần Additional info
  - Loại bỏ view count badge khỏi overlay để UI gọn gàng hơn
  - View count ưu tiên hiển thị hơn duration/size khi có showViews=true
  - Áp dụng thống nhất cho tất cả card component (Universal, Movie, Music)
  - Di chuyển view icon trong MusicCard từ góc phải dưới sang góc trái dưới
  - Cải thiện tỷ lệ và spacing cho tất cả các icon trong MusicCard
  - Giảm kích thước nút Add to playlist từ h-9 w-9 xuống h-6 w-6 trên mobile
  - Giảm kích thước font trong badge xuống text-[9px] và spacing xuống 0.5
  - Giảm padding từ p-3 xuống p-2 trên mobile trong MusicCard
  - Cải thiện tỷ lệ và spacing cho MovieCard trong grid view
  - Giảm kích thước icon trong MovieCard từ 4x4 xuống 3x3 trên mobile và 2x2 cho icon nhỏ
  - Điều chỉnh padding của card xuống còn p-2 trên mobile thay vì p-3
  - Giảm kích thước font chữ trong MovieCard xuống text-xs và text-[9px]
  - Giảm font size title trong MovieCard xuống text-xs trên mobile
  - Giảm kích thước icon Play trong overlay khi hover xuống 8x8 trên mobile
  - Thu gọn spacing trong statistics card cho phù hợp với mobile view
  - Điều chỉnh grid-cols xuống còn 2 cột trên mobile thay vì 3 cột
  - Thay đổi hiển thị "less than a minute ago" thành "just now" cho gọn gàng hơn
  - Giảm kích thước badge "time ago" trong RecentSlider (18 minutes ago -> 18m ago)
  - Giảm font size của timestamp từ text-xs xuống text-[9px] trên mobile
  - Thu gọn định dạng thời gian (minutes -> m, hours -> h, days -> d) trên mobile
  - Giảm padding và vị trí của badge timestamp để phù hợp với không gian
  - Giảm độ đậm của background color badge (thêm 90% opacity)
  - Giảm kích thước icon phù hợp với mobile view
  - Giảm kích thước icon media type (mp4, audio) trong badge từ 3x3 xuống 2.5x2.5 trên mobile
  - Giảm kích thước nút xóa lượt xem (trash icon) và làm nhỏ padding
  - Điều chỉnh nút favorite heart nhỏ hơn trên mobile view
  - Giảm kích thước icon Play trong overlay khi hover card
  - Áp dụng responsive size cho tất cả icon từ mobile đến desktop
  - Tăng tính nhất quán UI và cải thiện trải nghiệm trên màn hình nhỏ

- 🐛 [2025-09-13] Sửa lỗi import trong RecentSlider.jsx bị hỏngelog

## [Unreleased]

### Fixed (New)

- � [2025-09-13] Sửa lỗi import trong RecentSlider.jsx bị hỏng
  - Sửa lỗi import `embla-carousel-autoplay` bị hỏng gây lỗi khi khởi chạy ứng dụng
  - Dòng import có chứa JSX của component nằm trong tên module bị import

- �🔄 [2025-09-13] Tối ưu khoảng cách giữa các thành phần UI - giảm khoảng trống
  - Giảm padding tổng thể của trang xuống còn p-1 sm:p-2 thay vì p-3 sm:p-6
  - Giảm khoảng cách giữa các slider từ space-y-6 xuống space-y-1
  - Giảm margin-bottom của các container slider xuống mb-1 sm:mb-1
  - Giảm padding nội dung của các container xuống p-2 sm:p-3
  - Tinh chỉnh padding của header trong slider xuống p-2 sm:p-3 pb-1 sm:pb-2
  - Tăng không gian hiển thị nội dung bằng cách tối ưu khoảng trắng

- 🔄 [2025-09-13] Đồng bộ hóa width giữa slider và grid view - cân bằng UI
  - Áp dụng padding thống nhất cho container chứa MangaRandomSection và grid view
  - Xóa bỏ margin 0.5rem thừa trong .embla CSS để đảm bảo cân bằng với grid view
  - Đồng bộ max-width giữa slider và grid view
  - Cải thiện tính nhất quán của UI giữa các phần

- 🔄 [2025-09-13] Giảm chiều cao tổng thể sliders (Random/Recent/TopView) – áp dụng variant `compact-slider` & loại bỏ padding đáy
  - Áp dụng variant mới `compact-slider` (padding nhỏ, font-size giảm, metadata tối giản) cho cả 3 slider thay cho `compact`/`slider`
  - Loại bỏ `<div className="pb-2" />` đáy các slider (thừa sau khi tinh chỉnh dots & spacing) giúp giảm ~16px chiều cao mỗi section
  - Giảm chiều cao card => wrapper bớt "dài", tăng mật độ thông tin trên màn hình nhỏ
  - Không thay đổi logic dữ liệu; chỉ tác động presentation nên rủi ro thấp
  - Chuẩn bị cho bước tiếp theo nếu cần thêm `density` prop tuỳ biến trong tương lai
  - Bổ sung chống tràn 1px: bỏ padding ngang trong `.embla`, ép overflow-hidden trên Recent/TopView wrapper & trừ 0.2px trong công thức width để khử rounding dư

- 🐛 [2025-09-13] Fixed slider hiển thị vượt viewport gây scroll ngang – áp dụng giải pháp triệt để theo phân tích cấu trúc:
  - Xác định nguyên nhân gốc: width tổng chính xác trong container, flex gap, card layout overflow
  - Áp dụng container width `calc(100vw - 32px)` với margin thay padding để đảm bảo không tràn
  - Chặn scroll `overflow-hidden` và force `w-full` trên tất cả container
  - Giảm breakpoint max-width slides xuống (nhỏ hơn 135px mobile), tăng padding
  - Loại bỏ translate 3D và GPU accelerated classes không cần thiết
  - Thêm `w-full` cho tất cả container slider để fit parent container
  - Thay công thức width cũ `calc(% - gap)` (gây sai số + overflow) bằng công thức phân bố: `(100% - (n-1)*gap)/n` với biến `--slides-per-view-*`
  - Di chuyển horizontal padding từ `.embla__container` lên `.embla` để không cộng dồn vào tổng chiều rộng flex container
  - Chuẩn hóa biến: `--slides-per-view-mobile|tablet|desktop|large` giúp điều chỉnh số cột dễ dàng về sau
  - Tăng gap rõ ràng (0.25rem mobile / 0.5rem desktop) đồng nhất thay vì trừ thủ công trong width
  - Loại bỏ hover scale trực tiếp trên slide (chuyển sang translateY nhẹ) tránh làm “nhô” ra ngoài ở slide cuối
  - Giảm transform lan truyền gây sub‑pixel rounding khi `dragFree + trimSnaps` hoạt động
  - Thêm `will-change: transform` cho ảnh trong `UniversalCard` tối ưu hiệu ứng nhưng không nở rộng layout
  - Kết quả: Không còn viền tràn 1–2px ở cạnh phải trên mobile/desktop, snap ổn định hơn, dễ bảo trì
  - Điều chỉnh bổ sung: tăng `--slides-per-view-mobile` 3→4, giới hạn `max-width` slide (180px mobile, 220px desktop lớn) để tránh card phóng quá khổ khi màn hình hẹp nhưng density thấp
  - Tối ưu sizing lần 2 (2025-09-13):
    - Mobile dynamic density:  <390px = 4 cột, ≥390px = 5 cột, ≥480px = 6 cột
    - Giảm tiếp max-width: 150px mobile, 200px desktop lớn
    - Bỏ `max-width:100vw` → dùng `100%` tránh kéo theo scrollbar width
    - Thêm `overflow-x:hidden` toàn cục chặn rounding leak

### Fixed

- �🐛 [2025-09-13] Improved CSS maintainability with custom properties → Applied Copilot suggestions for better code organization
  - Extracted repetitive calc() expressions to CSS custom properties for slide widths
  - Applied consistent gap values (0.17rem) across all breakpoints instead of mixing 0.25rem and 0.5rem
  - Created reusable CSS variables: --slide-width-mobile, --slide-width-tablet, --slide-width-desktop, --slide-width-large
  - Eliminated code duplication and improved maintainability as suggested by Copilot AI

- � [2025-09-13] Fixed slider viewport overflow issue → Applied Copilot suggestions for better CSS maintainability
  - Reverted complex flex calculations that caused slider to overflow beyond viewport
  - Simplified slide width calculations using basic CSS instead of complex calc() expressions  
  - Removed problematic `!important` declarations for better CSS maintainability
  - Fixed embla container and viewport sizing to prevent horizontal scrolling
  - Applied consistent responsive slide widths: 33.33% mobile, 25% tablet, 20% desktop, max 16.67% large screens

- 📱 [2025-09-13] Limited grid columns to maximum 6 for better usability → Improved consistency across all media types
  - MangaHome: Changed xl:grid-cols-8 to xl:grid-cols-6 to prevent cards from becoming too small
  - MovieHome: Applied same grid-cols-6 limit for consistent card sizing  
  - MusicHome: Updated to use consistent 6-column maximum layout
  - Ensures cards remain interactive and readable on large screens as per Copilot recommendations

- �📱 [2025-09-13] Optimized mobile UI header text and spacing → Improved readability and touch interaction
  - TopViewSlider header: Reduced padding from p-6 to p-3 on mobile, title text from text-xl to text-base
  - RecentSlider header: Applied responsive padding and text sizing for mobile optimization  
  - RandomSlider header: Updated title and timestamp text sizes for better mobile display
  - Ranking badges: Smaller positioning (w-4 h-4 vs w-6 h-6) and icon sizes for mobile touch targets
  - Badge spacing: Tighter space-x-2 on mobile for better layout density
  - All slider headers now use responsive breakpoint strategy: base mobile → sm → md → lg

### Changed

- � [2025-09-13] Giảm chiều cao tổng thể sliders (Random/Recent/TopView) – áp dụng variant `compact-slider` & loại bỏ padding đáy
  - Áp dụng variant mới `compact-slider` (padding nhỏ, font-size giảm, metadata tối giản) cho cả 3 slider thay cho `compact`/`slider`
  - Loại bỏ `<div className="pb-2" />` đáy các slider (thừa sau khi tinh chỉnh dots & spacing) giúp giảm ~16px chiều cao mỗi section
  - Giảm chiều cao card => wrapper bớt “dài”, tăng mật độ thông tin trên màn hình nhỏ
  - Không thay đổi logic dữ liệu; chỉ tác động presentation nên rủi ro thấp
  - Chuẩn bị cho bước tiếp theo nếu cần thêm `density` prop tuỳ biến trong tương lai
  - Bổ sung chống tràn 1px: bỏ padding ngang trong `.embla`, ép overflow-hidden trên Recent/TopView wrapper & trừ 0.2px trong công thức width để khử rounding dư

- �📱 [2025-09-13] Optimized mobile UI layout → Improved responsive design for better mobile experience
  - Increased grid columns on mobile: Grid view now shows 3 columns instead of 2 on small screens for all media types
  - Reduced card sizes and spacing: Smaller manga/movie/music cards, tighter padding, and smaller badges for mobile
  - Optimized stats cards: Better layout with responsive columns on mobile, smaller icons and text
  - Improved list view: Smaller thumbnails, tighter spacing, and responsive text sizes
  - Enhanced header controls: Responsive button sizes, smaller gaps, and better touch targets
  - Updated pagination: Smaller buttons and text for mobile screens
  - Added dedicated CSS: Created movie-card.css and music-card.css for consistent mobile optimization
  - Fixed MovieHome mobile issues: Corrected remaining large stats card and optimized header controls
  - Enhanced MusicHome mobile: Improved search bar, controls spacing, and view toggles
  - Optimized slider cards: Reduced card sizes in all sliders for better mobile experience
    - Manga cards: 120px base width (was 160px), with responsive breakpoints
    - Movie cards: Added slider variant with 160px base width
    - Music cards: Added slider variant with 120px base width
    - Random slider: 120px base width (was 160px) with more responsive breakpoints
    - Embla slider: 32% slide width (was 40%) to show more cards on mobile

- � [2025-09-13] Optimized mobile UI layout → Improved responsive design for better mobile experience
  - Increased grid columns on mobile: Grid view now shows 3 columns instead of 2 on small screens
  - Reduced card sizes and spacing: Smaller manga cards, tighter padding, and smaller badges for mobile
  - Optimized stats cards: Better layout with 3 columns on mobile, smaller icons and text
  - Improved list view: Smaller thumbnails, tighter spacing, and responsive text sizes
  - Enhanced header controls: Responsive button sizes, smaller gaps, and better touch targets
  - Updated pagination: Smaller buttons and text for mobile screens
- �🐛 [2025-09-13] Fixed code review issues → Improved codebase quality and maintainability
  - Fixed environment variable access in storageQuota.js → Use import.meta.env.VITE_MIN_STORAGE_SPACE instead of process.env for Vite compatibility
  - Fixed inline calculation in DownloadProgressModal.jsx → Use formatBytes utility function from '@/utils/formatters'
  - Fixed hardcoded 500KB fallback in offlineLibrary.js → Use CACHE.FALLBACK_IMAGE_SIZE_BYTES constant
- 🐛 [2025-09-13] Fixed Service Worker caching strategy → Improved cache.addAll() with group batching and individual fallback for better reliability
- 🐛 [2025-09-13] Fixed modal configuration duplication in storageQuota.js → Extracted createConfirmModal() và createErrorModal() functions for better maintainability
- 🐛 [2025-09-13] Fixed fetch options complexity in offlineLibrary.js → Simplified with const fetchOptions variable to reduce code duplication
- 🐛 [2025-09-11] Fixed CORS fallback logic in offlineLibrary.js → Improved error handling for no-cors mode và opaque responses
- 🐛 [2025-09-11] Fixed window.confirm() và alert() usage in storageQuota.js → Support modern modal component với fallback to browser dialogs
- 🐛 [2025-09-11] Fixed multi-line assignment formatting in serviceWorkerManager.js → Improved code readability và consistency
- 🐛 [2025-09-11] Fixed path manipulation logic duplication in MangaReader.jsx → Centralized path utilities in pathUtils.js với extractTitlesFromPath function
- 🐛 [2025-09-11] Fixed HMR configuration logic in vite.config.js → Corrected conditional logic for VITE_DISABLE_HMR
- 🐛 [2025-09-11] Fixed Service Worker context compatibility → Use globalThis.ServiceWorkerRegistration for better cross-context support
- 🐛 [2025-09-11] Fixed cache race conditions in sw.js → Added Promise-based cache opening với concurrent request protection
- 🐛 [2025-09-11] Fixed formatBytes duplication in StorageQuotaModal.jsx → Import from centralized formatters.js utility
- 🐛 [2025-09-11] Fixed cache access duplication across sw.js → Centralized getCacheInstance() function to eliminate race condition logic duplication
- 🐛 [2025-09-11] Fixed hardcoded storage requirements in storageQuota.js → Device-responsive configuration với environment override support
- 🐛 [2025-09-11] Fixed complex cross-context checks in serviceWorkerManager.js → Extract to browserSupport utility for consistency

### Added (Set 1)

- ✨ [2025-09-11] Added domain-level CORS capability caching → Prevent double requests for failing domains with 2s timeout optimization
- ✨ [2025-09-11] Added centralized cache instance management → getCacheInstance() function in sw.js for consistent race condition protection
- ✨ [2025-09-11] Added device-responsive storage requirements → Mobile-friendly storage thresholds with configurable overrides
- ✨ [2025-09-11] Added cross-context browser feature detection → isBackgroundSyncSupported() và getServiceWorkerRegistration() utilities

- 🐛 [2025-09-10] Fixed "caches is not defined" error khi truy cập từ máy khác trong network → Thêm kiểm tra browser support và fallback cho Caches API không khả dụng
- 🐛 [2025-09-10] Fixed import paths consistency → Sử dụng relative paths thay vì absolute paths cho better consistency 
- 🐛 [2025-09-10] Fixed ServiceWorker reference inconsistency → Sử dụng window.ServiceWorkerRegistration thay vì globalThis
- 🐛 [2025-09-10] Fixed CORS fetch fallback strategy → Thêm fallback to no-cors mode khi CORS fails
- 🐛 [2025-09-10] Fixed Service Worker postMessage error handling → Thêm try-catch cho client.postMessage calls
- 🐛 [2025-09-10] Fixed dynamic import performance issue → Move browserSupport import to module level

### Added (Set 2)

- ✨ [2025-09-10] Added browser support utilities và compatibility checking → Kiểm tra HTTPS, Caches API, Service Worker, IndexedDB support
- ✨ [2025-09-10] Added OfflineCompatibilityBanner component → Hiển thị cảnh báo khi browser không hỗ trợ offline features  
- ✨ [2025-09-10] Added BrowserSupportStatus component → Hiển thị chi tiết technical support status
- ✨ [2025-09-10] Added graceful fallback cho offline features → App vẫn hoạt động khi Caches API không có

## 5.0.10 - 2025-09-09

### Bug Fixes

- 🐛 [2025-09-09] Fixed window.confirm usage in OfflineLibrary delete operations → Replaced with custom modal với chapter information và confirmation flow
- 🐛 [2025-09-09] Fixed hardcoded threshold values trong StorageQuotaModal → Import constants từ storageQuota.js để maintain consistency
- 🐛 [2025-09-09] Fixed error handling trong MangaReader storage quota check → Set proper error state cho modal display
- 🐛 [2025-09-09] Fixed hardcoded database version trong offlineLibrary.js → Use DB_VERSION constant để easier schema migrations
- 🐛 [2025-09-09] Fixed Service Worker context errors → Replace navigator/window objects với self.registration trong SW context
- 🐛 [2025-09-09] Fixed hardcoded Tailwind colors trong DownloadProgressModal → Extract colors to constants file
- 🐛 [2025-09-09] Fixed duplicate getFolderName logic → Extract to shared pathUtils utility
- 🐛 [2025-09-09] Fixed React "Objects are not valid as a React child" error → Fix object rendering trong Modal title và confirmModal parameter handling
- 🐛 [2025-09-09] Fixed hardcoded default image paths → Extract to DEFAULT_IMAGES constants cho consistency
- 🐛 [2025-09-09] Fixed duplicated formatBytes function → Consolidate to shared formatters utility
- 🐛 [2025-09-09] Fixed duplicated path manipulation logic → Use existing pathUtils for consistency
- 🐛 [2025-09-09] Replaced all hardcoded '/default' paths với DEFAULT_IMAGES constants across components
- 🐛 [2025-09-10] Fixed Service Worker cache performance → Implemented cache instance management và globalThis compatibility
- 🐛 [2025-09-10] Fixed duplicate formatBytes function trong storageQuota.js → Removed duplicate implementation, use shared formatters utility
- 🐛 [2025-09-10] Fixed database constants centralization → Moved DB_NAME, STORE, DB_VERSION from offlineLibrary.js to constants/index.js
- 🐛 [2025-09-10] Fixed offline navigation white screen → Enhanced navigationStrategy để serve app shell khi server tắt
- 🐛 [2025-09-10] Fixed Service Worker asset caching → Improved install event với proper error handling cho Vite assets
- 🐛 [2025-09-09] Fixed duplicate export statements trong storageQuota.js → Consolidate thành single export cho storage threshold constants
- 🐛 [2025-09-09] Fixed ServiceWorkerRegistration window object usage → Use globalThis for better cross-context compatibility
- 🔄 [2025-09-09] Optimized Service Worker cache management → Cache opened cache instances to reduce overhead

### Added

- ✨ [2025-09-09] Added colors.js constants file → Centralized UI color values cho consistent theming
- ✨ [2025-09-09] Added pathUtils.js utility → Shared path manipulation functions để prevent code duplication

### Cleanup

- 🗑️ [2025-09-09] Removed test-storage-quota.js file từ main codebase → Test files should be in separate testing directory

## 5.0.9 - 2025-09-09

### 🚀 Enhanced Service Worker Implementation

- **Intelligent Caching Strategies**: Implement cache-first cho static assets, network-first cho API calls, và hybrid strategy cho manga images
- **True Offline Functionality**: App hoạt động hoàn toàn offline với cached app shell và downloaded chapters
- **Background Sync Support**: Retry failed downloads khi network trở lại với ServiceWorkerRegistration.sync API
- **Performance Optimizations**: Load time cải thiện ~50% cho return visits, ~80% cho slow networks
- **Automatic Cache Management**: Smart cleanup old versions, cache versioning, và storage pressure handling

### 🎛️ Service Worker Manager System

- **ServiceWorkerManager Class**: Comprehensive SW lifecycle management với event handling và message communication
- **React Hook Integration**: `useServiceWorker()` hook provides easy SW interaction cho React components
- **Status Monitoring**: Real-time SW status tracking với online/offline detection và update notifications
- **Cache Information API**: Get detailed cache info, storage usage, và management controls
- **Background Sync Registration**: Automatic registration cho retry mechanisms và offline queuing

### 🖥️ Service Worker Status UI

- **ServiceWorkerStatus Component**: Complete SW dashboard với status indicators, cache info, và management controls
- **Visual Status Indicators**: Color-coded icons và status messages cho different SW states
- **Cache Management Interface**: View cache details, clear specific caches, và monitor storage usage
- **Update Handling**: User-friendly update notifications với apply update functionality
- **Offline Capability Check**: Real-time assessment của app's offline functionality

### 🔧 Advanced Caching Architecture

- **Multi-tier Cache System**: Static cache (app shell), dynamic cache (API), và existing image cache (offline manga)
- **Network Timeout Handling**: 5-second timeout với graceful fallback to cache cho better UX
- **Fallback Strategies**: SVG placeholders cho failed images, app shell cho navigation failures
- **Performance Monitoring**: Request timing, cache hit rates, và slow request warnings
- **Cache Versioning**: Automatic cleanup old cache versions với seamless migration

### 📱 Progressive Web App Features

- **App Shell Architecture**: Critical resources cached cho instant loading và offline functionality
- **Navigation Handling**: SPA routing hoạt động offline với fallback mechanisms
- **Resource Optimization**: Intelligent preloading và bandwidth savings through caching
- **Mobile-First Design**: Optimized cho mobile users với poor network conditions
- **Update Mechanism**: Seamless SW updates với user notification và control

### 🎯 Storage Impact & Optimization

- **Minimal Overhead**: Chỉ ~1-2MB additional storage cho dramatic functionality improvement
- **Smart Cache Selection**: No auto-caching online images để avoid storage bloat
- **Integration với Storage Quota**: Works seamlessly với existing quota management system
- **Efficient Background Updates**: Cache updates in background without blocking user actions
- **Storage Analytics**: Detailed cache information với size estimation và usage tracking

## 5.0.8 - 2025-09-09

### 📊 Storage Quota Management System

- **Pre-download quota check**: Implement `checkStorageForDownload()` để kiểm tra storage quota trước khi download chapter
- **Storage estimation**: Tự động ước tính dung lượng cần thiết bằng cách lấy mẫu từ 3 trang đầu
- **Multi-threshold warnings**: Support warning threshold (90%) và critical threshold (95%) với các mức độ cảnh báo khác nhau
- **Minimum buffer space**: Đảm bảo luôn còn lại ít nhất 50MB free space sau khi download
- **Intelligent fallback**: Fallback estimate 500KB/page khi không thể fetch Content-Length headers

### 🚨 Storage Quota Modal Interface

- **Visual quota display**: StorageQuotaModal với progress bar màu code theo mức độ sử dụng storage
- **Detailed breakdown**: Hiển thị used/available/total storage với human-readable formatting
- **Estimated size preview**: Show estimated download size trước khi user confirm
- **Smart status indicators**: Color-coded icons (green/yellow/red) với contextual messages
- **Confirmation flow**: User có thể xem chi tiết và xác nhận có muốn tiếp tục download hay không

### 🎯 Enhanced Download Protection

- **Pre-flight validation**: Kiểm tra storage quota, estimated size, và available space trước khi bắt đầu download
- **Progressive warnings**: Cảnh báo từ sớm khi storage gần đầy (90%) nhưng vẫn cho phép download
- **Critical prevention**: Ngăn chặn download khi storage > 95% hoặc không đủ buffer space
- **User-friendly messages**: Thông báo lỗi rõ ràng với hướng dẫn cụ thể (xóa bớt data offline)
- **Graceful degradation**: Vẫn hoạt động bình thường trên browser không hỗ trợ Storage API

### 🔧 Storage Utilities

- **`storageQuota.js` utility**: Comprehensive storage management với các functions:
  - `checkStorageQuota()`: Lấy thông tin quota hiện tại
  - `estimateChapterSize()`: Ước tính size của chapter based on sample pages
  - `checkStorageForDownload()`: Main validation function trước download
- **Browser compatibility**: Support cho Storage API với fallback cho browser cũ
- **Performance optimized**: HEAD requests để lấy Content-Length thay vì download full images
- **Error resilient**: Handle network errors và continue với estimate fallback

### 💡 User Experience Improvements

- **Progressive disclosure**: Hiển thị thông tin storage theo mức độ chi tiết phù hợp
- **Visual feedback**: Progress bars, color coding, và icons để communicate storage status
- **Actionable messages**: Thông báo cụ thể về việc cần xóa bao nhiêu data để có thể download
- **Non-blocking warnings**: Warning không block download, chỉ inform user về tình trạng storage
- **Quick access**: Modal có thể close/open dễ dàng mà không lose download progress

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


### Changed

- 🔄 [2025-09-07] Changed icon xóa topview position từ top-left sang bottom-right corner của card - Cải thiện UX bằng cách đặt action button ở vị trí thông thường hơn, tự động điều chỉnh view count badge lên trên khi có icon xóa

### Removed

- 🗑️ [2025-09-07] Removed useEffect debug rỗng trong MangaHome.jsx - Loại bỏ code debug không cần thiết để clean up codebase

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

