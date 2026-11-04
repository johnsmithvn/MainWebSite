# Service Worker Implementation Analysis (v3.1.0)

> **Cập nhật:** 2026-10-29, đối chiếu với [`react-app/public/sw.js`](../public/sw.js) tại commit `a511bcd`.
> TL;DR: service worker giữ tối thiểu asset dự phòng, phục vụ ảnh chapter đã tải offline từ cache riêng và
> lưu tạm phản hồi API GET để dùng khi mất mạng. Bản v3.1.0 bổ sung cache thumbnail (`media-thumbnails-v1`) nhưng
> nhánh này hiện **gần như không được kích hoạt** (xem mục 6).

## 1. Kiến trúc cache hiện tại

| Cache | Nội dung | Ghi chú |
|-------|----------|---------|
| `offline-core-v3.1.0` | Ảnh fallback `/default/*` (favicon, cover, folder, music, video) | Precache khi install; cache-first. |
| `reader-dynamic-v3.1.0` | Phản hồi điều hướng SPA (kèm bản sao cho `/` và `/index.html`) và **mọi** phản hồi `GET /api/*` status 200 (trừ `/api/manga/pdf`) | Không giới hạn số entry, không tự dọn. |
| `chapter-images` | Ảnh các trang manga đã tải offline | Do `offlineLibrary` / `downloadWorker` ghi. Không bị xoá khi nâng version. |
| `media-thumbnails-v1` | Thumbnail movie/music/media (stale-while-revalidate, tối đa 1000 entry) | Mới ở v3.1.0. Không bị xoá khi nâng version. |

Pha `activate` xoá các cache có prefix `manga-`, `mainws-`, `offline-core-`, `reader-dynamic-` không thuộc version hiện tại.

## 2. Vòng đời service worker

1. **Install** – mở `offline-core-*`, thêm từng asset fallback (lỗi từng file chỉ log warning), rồi `skipWaiting()`.
2. **Activate** – dọn cache cũ, `clients.claim()`, gửi `SW_ACTIVATED` (kèm version) tới mọi tab.
3. **Runtime** – mỗi request `GET` được định tuyến theo chiến lược ở mục 3. `cacheInstances` + `cachePromises` tránh mở cùng một cache song song.
4. **Message & Sync** – hỗ trợ `SKIP_WAITING`, `GET_CACHE_INFO` (có cache kết quả 5s), `INVALIDATE_CACHE_INFO`, `CLEAR_CACHE`, `REGISTER_BACKGROUND_SYNC`; sự kiện `sync` với tag `retry-failed-downloads` chỉ chuyển tiếp `BACKGROUND_SYNC` về client.

Đăng ký SW nằm ở `src/main.jsx` (chạy cả ở dev mode). Lưu ý: component `ServiceWorkerStatus` và hook `useServiceWorker` / `utils/serviceWorkerManager.js` hiện **không được render/dùng** ở đâu (xem DEAD-CODE-REPORT).

## 3. Chiến lược xử lý request (theo thứ tự kiểm tra trong handler `fetch`)

| # | Điều kiện | Chiến lược |
|---|-----------|-----------|
| 0 | Không phải `GET` | Bỏ qua (trình duyệt tự xử lý) |
| 1 | URL chứa `/api/manga/pdf` | Network-only (stream trực tiếp) |
| 2 | `isStaticAsset`: cùng origin, path bắt đầu `/default/` | Cache-first + cập nhật nền khi online |
| 3 | `isAPIRequest`: URL chứa `/api/` | Network-first, timeout **5s**; chỉ cache response 200; khi lỗi/timeout trả bản cache hoặc `503` |
| 4 | `isMangaImage`: (`/manga/` + đuôi ảnh) **hoặc** `request.destination === 'image'` | Ưu tiên `chapter-images`, nếu không có thì fetch mạng (không cache) |
| 5 | `isThumbnailRequest` | Stale-while-revalidate vào `media-thumbnails-v1` |
| 6 | `request.mode === 'navigate'` | Network-first, lưu app shell; offline → cache URL → app shell → trang HTML inline "App đang offline" |
| 7 | Còn lại | Network-first (như #3) |

`checkContentChange()` dùng ETag → Last-Modified → SHA-256 nội dung JSON để quyết định có ghi đè cache không; trạng thái này nằm trong bộ nhớ của SW nên mất khi SW bị trình duyệt dừng.

## 4. Offline fallback & trải nghiệm người dùng

- Không có `offline.html`; fallback cuối là trang HTML inline nhỏ với nút "Thử lại".
- Ảnh fallback mặc định luôn có sẵn nhờ `offline-core-*`.
- Khi thumbnail lỗi trong nhánh #5, SW trả ảnh mặc định theo loại (dựa trên URL chứa `/movie`, `/music`, `/media`).

## 5. Ước lượng footprint

| Thành phần | Ước lượng | Ghi chú |
|------------|-----------|---------|
| `offline-core-*` | ~300–500KB | 5 ảnh mặc định |
| `reader-dynamic-*` | Tăng dần theo thời gian | Mọi response API GET; **kể cả file nhạc tải qua `/api/music/download`** (response 200 đầy đủ) |
| `chapter-images` | Tuỳ người dùng | Có thể hàng trăm MB |
| `media-thumbnails-v1` | ≤1000 entry | Hiện gần như rỗng (mục 6) |

## 6. Vấn đề đã biết (chi tiết trong [docs/ISSUES-REPORT.md](../../docs/ISSUES-REPORT.md))

- **B14 – cache thumbnail không hoạt động:** nhánh #4 bắt mọi request có `destination === 'image'` trước nhánh #5; thêm vào đó `isThumbnailRequest` so khớp `/movie/` và `/music/` trong khi URL thật của thumbnail là `/video/…/.thumbnail/…` và `/audio/…/.thumbnail/…`.
- **B15 – cache API không chọn lọc:** mọi `GET /api/*` 200 đều được lưu (kể cả download nhạc, danh sách random…), không giới hạn dung lượng; timeout 5s trả `503` cho API chậm nhưng vẫn hoạt động (vd. `folder-cache` đọc trực tiếp từ đĩa).
- Kế hoạch cũ "allowlist/denylist endpoint" và "quota awareness" vẫn **chưa** được triển khai.

## 7. Checklist QA nhanh

1. DevTools → Application → Service Workers: SW đang chạy và console có log `SW installing v3.1.0` / `SW_ACTIVATED`.
2. Cache Storage:
   - `offline-core-v3.1.0` chỉ chứa ảnh `/default/*`.
   - `reader-dynamic-v3.1.0` có `/` và `/index.html` sau khi tải trang.
   - `chapter-images` giữ nguyên dữ liệu sau khi đổi version.
3. Ngắt mạng, mở `/offline` hoặc chapter đã tải → app shell và ảnh offline vẫn hiển thị.
4. Khi bump `CACHE_VERSION`, kiểm tra cache cũ `offline-core-*`/`reader-dynamic-*` bị xoá trong pha activate.
