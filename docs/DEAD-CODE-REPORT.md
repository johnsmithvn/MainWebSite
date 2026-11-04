# 🧹 BÁO CÁO DEAD CODE — MainWebSite

> **Ngày rà soát:** 2026-10-29 · **Commit:** `a511bcd`
> **Phương pháp:**
> - Backend: tra mọi `require(...)` để tìm module không được nạp; đối chiếu export với nơi sử dụng.
> - React app: dựng **import graph** từ `src/main.jsx` (script phân tích tĩnh, tính cả `import()` động và alias `@/`), sau đó kiểm tra thủ công từng kết quả bằng `grep` (vì barrel `components/common/index.js` làm mọi component "trông như" được dùng).
> - Đối chiếu từng endpoint backend với lời gọi từ React app và frontend legacy.
>
> Mọi mục dưới đây đã được xác minh bằng grep. Hãy chạy `npm run build` sau khi xoá để chắc chắn (repo hiện chưa cài `node_modules` nên chưa build thử).

## Tổng kết

| Nhóm | Số dòng (xấp xỉ) | Mức độ an toàn khi xoá |
|------|-----------------:|------------------------|
| Backend — module không bao giờ được `require` | ~1.070 | ✅ An toàn |
| Backend — code chết bên trong file đang dùng | ~120 | ✅ An toàn |
| React — file không nằm trong import graph | ~2.580 | ✅ An toàn |
| React — component/hook/util chỉ còn được barrel re-export | ~1.230 | ✅ An toàn (gỡ khỏi barrel) |
| React — CSS không được import | ~1.160 | ✅ An toàn |
| React — export không ai dùng trong file đang dùng | ~600 | ✅ An toàn |
| `apiService` — method không ai gọi (đa số trỏ sai endpoint) | 16 method | ✅ An toàn |
| Dependency không dùng | 4 backend + 5 frontend | ✅ An toàn |
| **Tổng dead code** | **~6.700 dòng** | |
| Frontend legacy `frontend/` | ~10.700 | ⚠️ Cần quyết định (xem mục 6) |

---

## 1. Backend

### 1.1 Module không bao giờ được `require`

| File | Dòng | Ghi chú |
|------|-----:|---------|
| [backend/services/MediaService.js](../backend/services/MediaService.js) | 257 | Không ai require. Bản thân file `require("../utils/BaseScanner")` — **file này không tồn tại**, nên nếu có ai require thì server crash. |
| [backend/utils/DatabaseManager.js](../backend/utils/DatabaseManager.js) | 261 | Chỉ được `MediaService.js` (đã chết) dùng. Schema trong đây đã lệch so với `utils/db.js` (thiếu `scanned`, `title`, bảng media). |
| [backend/utils/databaseUtils.js](../backend/utils/databaseUtils.js) | 149 | `upsertFolder`, `getDbStats`, `incrementViewCount`, `batchUpsertFolders` — không ai dùng. |
| [backend/utils/thumbnailUtils.js](../backend/utils/thumbnailUtils.js) | 97 | Bản sao của `imageUtils.js` + `findThumbnail`; không ai dùng. |
| [backend/utils/scan-logger.js](../backend/utils/scan-logger.js) | 302 | Không ai dùng. Ngoài ra có bug: thuộc tính `this.logFile` (string) đè lên method `logFile()`. Tạo thư mục `backend/logs/` khi được require. |

### 1.2 Code chết bên trong file đang dùng

| Vị trí | Mô tả |
|--------|-------|
| [backend/middleware/rateLimiter.js](../backend/middleware/rateLimiter.js) + [middleware/index.js:28-37](../backend/middleware/index.js#L28) | `ENABLE_RATE_LIMIT = false` cứng → nhánh bật limiter không bao giờ chạy (84 dòng). Nên giữ nhưng chỉ áp dụng cho `/api/login` (xem ISSUES S5) hoặc xoá. |
| [backend/middleware/errorHandler.js:41-55](../backend/middleware/errorHandler.js#L41) | `asyncHandler`, `createError` không được dùng. |
| [backend/utils/responseHelpers.js](../backend/utils/responseHelpers.js) | Chỉ `sendSuccess`, `sendError` được dùng (bởi `update-lyrics.js`); `sendValidationError`, `sendNotFound`, `sendServerError` thừa. |
| [backend/utils/stringUtils.js:55](../backend/utils/stringUtils.js#L55) | `joinCommaSeparatedList` không dùng. |
| [backend/constants.js](../backend/constants.js) | `DB_TABLES`, `CACHE`, `CONTENT_TYPES` chỉ được các module chết dùng; `SECURITY.RATE_LIMIT` chỉ cho limiter đã tắt; `FILE_EXTENSIONS.OTHER` rỗng. |
| [backend/server.js:203-222](../backend/server.js#L203) | `/api/list-roots` khai báo lần 2 — không bao giờ tới được vì `routes/system.js` đã xử lý trước. |
| [backend/server.js:181-201](../backend/server.js#L181) | Middleware decode URL cho `/manga /video /audio /media` đặt **sau** `express.static` → không có tác dụng (static đã tự decode). |
| [backend/server.js:175-179](../backend/server.js#L175) | Route legacy `/app/*` — không còn client nào dùng. |
| [backend/utils/config.js:34-36](../backend/utils/config.js#L34) | `getAllRootKeys` đã comment out. |
| [backend/utils/music-scan.js:39](../backend/utils/music-scan.js#L39) | Biến `scopePattern` không dùng; dòng 1 là comment thừa `// module.exports = …`. |
| [backend/utils/media-scan.js:141-142](../backend/utils/media-scan.js#L141) | `itemCount`, `firstImagePath` được tính nhưng không bao giờ dùng; tham số `fileName` của `extractDateTaken` không dùng. |
| [backend/api/media/delete-item.js:37-47,71-76](../backend/api/media/delete-item.js#L37) | Xoá từ bảng `album_items` — **bảng này không tồn tại** (album dùng cột `media_items.albumId`), luôn rơi vào `catch` và log warning. |
| [backend/api/movie/extract-movie-thumbnail.js:148](../backend/api/movie/extract-movie-thumbnail.js#L148) | Biến `res` (kết quả UPDATE) không dùng, lại che tên `res` quen thuộc. |

### 1.3 Endpoint không có client React

| Endpoint | Client hiện tại |
|----------|-----------------|
| `GET /api/manga/next-chapter` | Chỉ frontend legacy |
| `DELETE /api/manga/reset-cache/all` | Chỉ frontend legacy |
| `POST /api/movie/folder-thumbnail`, `POST /api/music/folder-thumbnail`, `POST /api/music/playlist-thumbnail` | Chỉ frontend legacy (React gọi nhầm `/set-thumbnail`, xem ISSUES B3/B4) |
| `GET /api/media/cache/:filename`, `POST /api/media/set-thumbnail`, `GET /api/media/stats` | Không có client nào |
| `POST /api/log` | Chỉ frontend legacy (`sendLog` của React bị hỏng — ISSUES B16) |

Không nên xoá ngay các endpoint `folder-thumbnail`: React **cần** chúng sau khi sửa B3.

### 1.4 Dependency không dùng (`backend/package.json`)

`axios`, `hammerjs` (thư viện gesture phía trình duyệt), `mime-types`, `serve-favicon`, `lru-cache` (từ 2026-11-04, khi bỏ cache RAM video/audio — ISSUES P1). Ngoài ra `glob` và `esbuild` chỉ phục vụ `scripts/build.js` của frontend legacy.

---

## 2. React app — file không nằm trong import graph

Không file nào trong số này được import (trực tiếp hay gián tiếp) từ `src/main.jsx`:

| File | Dòng | Ghi chú |
|------|-----:|---------|
| [src/hooks/useDownloadQueue.js](../react-app/src/hooks/useDownloadQueue.js) | 375 | Wrapper cũ cho download queue; `DownloadManager` dùng store trực tiếp. |
| [src/hooks/useDownloadQueueOptimized.js](../react-app/src/hooks/useDownloadQueueOptimized.js) | 263 | Phiên bản "optimized" chưa bao giờ được nối vào. |
| [src/pages/downloads/DownloadSettings.jsx](../react-app/src/pages/downloads/DownloadSettings.jsx) | 447 | Không có route, chỉ được `lazyLoadComponents.js` (chết) tham chiếu. |
| [src/pages/music/PlaylistDetail.jsx](../react-app/src/pages/music/PlaylistDetail.jsx) | 113 | Không có route trong `App.jsx`. |
| [src/utils/downloadHelpers.js](../react-app/src/utils/downloadHelpers.js) | 465 | Chỉ được các file chết ở trên dùng. |
| [src/utils/downloadNotifications.js](../react-app/src/utils/downloadNotifications.js) | 322 | |
| [src/utils/lazyLoadComponents.js](../react-app/src/utils/lazyLoadComponents.js) | 56 | |
| [src/utils/performanceOptimization.js](../react-app/src/utils/performanceOptimization.js) | 435 | debounce/throttle/MemoryMonitor/DOMUpdateBatcher… không ai dùng. |
| [src/utils/randomCache.js](../react-app/src/utils/randomCache.js) | 76 | |
| `src/components/{manga,media,movie,music}/index.js` | 28 | Barrel không ai import (mọi nơi import trực tiếp file). |
| **Cộng** | **~2.580** | |

## 3. React app — chỉ "sống" nhờ barrel `components/common/index.js`

`MangaReader.jsx` import 3 modal từ barrel, khiến toàn bộ barrel (và mọi thứ nó re-export) nằm trong bundle. Các mục sau **không được render ở bất kỳ đâu**:

| File | Dòng | Chuỗi phụ thuộc chết theo |
|------|-----:|---------------------------|
| [components/common/ServiceWorkerStatus.jsx](../react-app/src/components/common/ServiceWorkerStatus.jsx) | 294 | → [hooks/useServiceWorker.js](../react-app/src/hooks/useServiceWorker.js) (226) → [utils/serviceWorkerManager.js](../react-app/src/utils/serviceWorkerManager.js) (359) |
| [components/common/BrowserSupportStatus.jsx](../react-app/src/components/common/BrowserSupportStatus.jsx) | 175 | |
| [components/common/VirtualList.jsx](../react-app/src/components/common/VirtualList.jsx) | 176 | kèm hook `useScrollToItem` |
| **Cộng** | **~1.230** | |

Khuyến nghị: import trực tiếp 3 modal trong `MangaReader.jsx` rồi xoá barrel `components/common/index.js` (hoặc gỡ các dòng re-export trên).

## 4. React app — CSS không được import

| File | Dòng | Ghi chú |
|------|-----:|---------|
| [src/styles/components/download-manager.css](../react-app/src/styles/components/download-manager.css) | 1.047 | Không file nào import; class `.download-manager*` cũng không xuất hiện trong JSX (UI downloads dùng Tailwind). |
| [src/styles/components/media-gallery.css](../react-app/src/styles/components/media-gallery.css) | 117 | Không file nào import. |

`styles/components/index.css` có khối comment import `movie-player.css`, `music-player.css`, `sidebar.css`, `modal.css` — các file này không tồn tại.

## 5. React app — export không ai dùng trong file còn sống

| File | Export không dùng |
|------|-------------------|
| [hooks/index.js](../react-app/src/hooks/index.js) | `useLocalStorage`, `useIntersectionObserver`, `useMediaQuery`, `useClickOutside`, `useKeyPress`, `useAsync`, `usePagination`, `useVirtualizer` (~200 dòng; chỉ `useDebounceValue`, `useRecentManager` được dùng) |
| [hooks/useMovieData.js](../react-app/src/hooks/useMovieData.js) | `useRandomMovies`, `useTopViewMovies`, `useRecentMovies`, `default` (~105 dòng; chỉ `useRecentMoviesManager` được dùng) |
| [hooks/useMusicData.js](../react-app/src/hooks/useMusicData.js) | `useRandomMusic`, `useTopViewMusic`, `useRecentMusic`, `default` (~110 dòng; chỉ `useRecentMusicManager` được dùng) |
| [constants/index.js](../react-app/src/constants/index.js) | `SLIDER`, `UI`, `DOWNLOAD_QUEUE`, `RESPONSIVE`, `CSS_CLASSES` |
| [constants/colors.js](../react-app/src/constants/colors.js) | `STATUS_COLORS`, `BACKGROUND_COLORS` |
| [constants/cacheKeys.js](../react-app/src/constants/cacheKeys.js) | `default` export |
| [utils/formatters.js](../react-app/src/utils/formatters.js) | `truncateText`, `isImageFile`, `isVideoFile`, `isAudioFile` |
| [utils/pathUtils.js](../react-app/src/utils/pathUtils.js) | `getParentPath`, `isRootLevel` |
| [utils/storageQuota.js](../react-app/src/utils/storageQuota.js) | `showStorageConfirmDialog`, `createStorageInfoModal` |
| [utils/browserSupport.js](../react-app/src/utils/browserSupport.js) | `getServiceWorkerRegistration`, `createCachesFallback` |
| [utils/mangaCache.js](../react-app/src/utils/mangaCache.js) | `clearAllMangaCache` |
| [utils/musicDownloadQueue.js](../react-app/src/utils/musicDownloadQueue.js) | `useMusicDownloadQueue` |
| [utils/thumbnailUtils.js](../react-app/src/utils/thumbnailUtils.js), [utils/databaseOperations.js](../react-app/src/utils/databaseOperations.js) | `default` export |
| [utils/logger.js](../react-app/src/utils/logger.js) | `sendLog` được dùng nhưng **luôn lỗi** (ISSUES B16) — sửa hoặc xoá cùng lời gọi trong `MoviePlayer.jsx` |
| [store/index.js](../react-app/src/store/index.js) | `useMusicStore.setCurrentMusic` (set field không khai báo); `partialize` của `manga-storage` persist `recentViewed` (không tồn tại) |

`react-app/refactor/UNUSED_HOOKS_ANALYSIS.md` (10/2025) đã chỉ ra một phần danh sách hook trên nhưng chưa được dọn.

### 5.1 `apiService` — method không ai gọi ([utils/api.js](../react-app/src/utils/api.js))

| Method | Ghi chú |
|--------|---------|
| `movie.setThumbnail`, `music.setThumbnail` | Trỏ tới `/set-thumbnail` — **không tồn tại** (đúng là `/folder-thumbnail`) |
| `music.createPlaylist`, `music.updatePlaylist`, `music.deletePlaylist` | Sai endpoint / sai shape (PlaylistModal dùng `fetch` trực tiếp với endpoint đúng) |
| `media.getStats` | Trỏ `/media-stats`, đúng là `/stats` |
| `media.updateAlbum`, `media.removeItemsFromAlbum` | Endpoint đúng nhưng UI chưa dùng |
| `movie.getVideos`, `music.getAudio` | GET file nhị phân qua axios — không hợp lý, không ai dùng |
| `music.getPlaylist`, `music.getMusicMeta`, `manga.getRootThumbnail` | Code dùng `fetch` trực tiếp thay vì method này |
| `system.getSourceKeys`, `system.getSecurityKeys`, `system.increaseView` | `Home.jsx` dùng `fetch` trực tiếp |

Khuyến nghị: sửa các method sai rồi **chuyển các lời gọi `fetch` trực tiếp sang dùng chúng** (đồng thời giải quyết việc thiếu token — ISSUES B6), thay vì xoá.

### 5.2 Dependency không dùng (`react-app/package.json`)

`clsx`, `react-intersection-observer`, `react-player`, `react-virtualized`, `string-natural-compare`. Ngoài ra app dùng **hai** thư viện icon (`lucide-react` 32 file, `react-icons` 29 file) — nên chọn một.

### 5.3 Asset trùng

`react-app/public/default/*` trùng với `frontend/public/default/*`. Backend mount `/default` từ thư mục legacy **trước** React build nên bản trong `react-app/public/default` không bao giờ được phục vụ. `react-app/public/favicon.svg` không được tham chiếu. `frontend/styles/components/readerSettingsModal.css` là bản trùng của `frontend/src/styles/components/readerSettingsModal.css`.

---

## 6. Frontend legacy `frontend/` (~10.700 dòng)

Không phải dead code theo nghĩa hẹp — backend vẫn serve nó ở **dev mode** (`/` → `frontend/public/home.html`, SPA fallback → `frontend/public/manga/index.html`) và `/default/*` lấy ảnh từ `frontend/public/default`. Tuy nhiên:

- React app đã thay thế toàn bộ chức năng (theo `Promt.md`), không có commit tính năng mới cho legacy.
- Bundle legacy chỉ có khi chạy tay `npm run dev:frontendv1`; `frontend/public/dist/` bị gitignore.
- Bộ docs `frontend/docs/*` (07/2025) chỉ nói về đợt migrate constants của legacy.

**Nếu quyết định gỡ legacy**, cần làm cùng lúc: chuyển `/default` sang `react-app/public/default` (hoặc `backend/public/default`), sửa `server.js` dòng 122-136, 166-173 và nhánh dev của SPA fallback (261-265), xoá `scripts/build.js`, script `dev:frontendv1`/`legacy`, dependency `glob`/`esbuild`, và các endpoint chỉ legacy dùng ở mục 1.3 (sau khi React có thay thế).

---

## 7. Thứ tự dọn dẹp đề xuất

1. **Backend:** xoá 5 module ở 1.1, code chết ở 1.2 (giữ `rateLimiter` nếu sẽ dùng cho login), 4 dependency ở 1.4.
2. **React:** xoá 13 file ở mục 2, 2 file CSS ở mục 4; bỏ barrel `components/common/index.js` → xoá chuỗi ServiceWorkerStatus/useServiceWorker/serviceWorkerManager, BrowserSupportStatus, VirtualList.
3. **React:** xoá export thừa ở mục 5, sửa/gom `apiService` (5.1), gỡ 5 dependency (5.2).
4. Chạy `npm install && npm run build` và smoke test các trang chính (manga reader, movie/music player, media, downloads, offline).
5. Quyết định số phận `frontend/` (mục 6).
