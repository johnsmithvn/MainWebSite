# Service Worker Implementation Analysis (v3.0.0)

> TL;DR: phiên bản service worker hiện tại ưu tiên chạy nhẹ, chỉ giữ lại các asset dự phòng tối thiểu và đảm bảo trải nghiệm đọc offline qua cache chapter images/metadata riêng. Toàn bộ logic được triển khai trong [`react-app/public/sw.js`](../public/sw.js).

## 1. Kiến trúc cache hiện tại

| Cache | Nội dung | Ghi chú |
|-------|----------|---------|
| `offline-core-v3.0.0` | Bộ ảnh fallback mặc định (`/default/*.png|jpg`) | Không còn precache HTML/CSS/JS – giảm footprint và tránh lệ thuộc vào build cũ. |
| `reader-dynamic-v3.0.0` | Kết quả điều hướng SPA và (optionally) phản hồi API GET | Được cập nhật mỗi lần điều hướng thành công để bảo đảm app shell còn dùng được khi offline. |
| `chapter-images` | Ảnh các trang manga đã tải offline | Không bị đụng tới khi nâng version để tránh mất dữ liệu người dùng. |

Các cache cũ có prefix `manga-` hoặc `mainws-` sẽ bị dọn trong pha `activate` nhằm tránh để sót dữ liệu từ phiên bản service worker trước.

## 2. Vòng đời service worker

1. **Install** – mở `offline-core-*` và thêm các asset fallback (favicon, ảnh cover mặc định…). Không còn precache `index.html`, bundle JS/CSS, hay template offline riêng.
2. **Activate** – xóa mọi cache có prefix cũ, ghi nhớ các instance cache vào bộ nhớ tạm để tái sử dụng, rồi `clients.claim()` để kiểm soát toàn bộ tab đang mở.
3. **Runtime** – mỗi request GET sẽ được định tuyến theo chiến lược riêng (chi tiết ở phần 3). Bộ nhớ đệm nội bộ (`cacheInstances`, `cachePromises`) giúp tránh mở cache song song nhiều lần.
4. **Message & Sync** – nhận các command như `GET_CACHE_INFO`, `CLEAR_CACHE`, `REGISTER_BACKGROUND_SYNC` và forward signal `SW_ACTIVATED`/`BACKGROUND_SYNC` về client.

## 3. Chiến lược xử lý request

### 3.1 Static assets (`isStaticAsset`)

- Chỉ áp dụng cho tài nguyên cùng origin bên trong thư mục `/default/`.
- **Chiến lược:** cache-first. Lần đầu fetch thành công sẽ lưu lại; các lần sau ưu tiên cache nhưng vẫn cập nhật ngầm khi đang online.
- **Lý do:** đây là những fallback image được dùng rộng rãi trên web/app, cần sẵn sàng ngay cả khi offline.

### 3.2 API (`isAPIRequest`)

- Service worker vẫn dùng network-first + timeout 5s cho mọi `GET` trỏ tới `/api/`.
- Khi mạng phản hồi trong giới hạn, response được lưu tạm vào `reader-dynamic-*` để có dữ liệu dự phòng trong lần tải lại kế tiếp (chủ yếu phục vụ các view đang mở).
- Nếu mạng lỗi/timeout, worker thử tìm bản cache tương ứng; nếu không có sẽ trả fallback lỗi.
- **Lưu ý:** mục tiêu sắp tới là bổ sung bộ lọc allowlist để loại các endpoint như random/favorites khỏi cache. Việc này chưa được triển khai trong `sw.js`; khi thêm mới cần cập nhật bảng ở mục 6.

### 3.3 Ảnh manga (`isMangaImage`)

- Kiểm tra cache `chapter-images` trước (đây là nơi `offlineLibrary` lưu dữ liệu khi người dùng tải chapter).
- Không tự động cache ảnh online; nếu request thất bại và không có bản offline thì để trình duyệt tự báo lỗi.

### 3.4 Điều hướng (`isNavigation`)

- Network-first. Khi có phản hồi thành công:
  - Lưu bản sao vào `reader-dynamic-*` cho chính URL đó.
  - Đồng thời cập nhật `'/index.html'` và `'/'` để tái sử dụng như app shell.
- Nếu offline: lần lượt thử cache cụ thể của URL, sau đó tới app shell trong dynamic cache, rồi static cache. Cuối cùng mới render fallback HTML inline đơn giản.

## 4. Offline fallback & trải nghiệm người dùng

- Không còn file `offline.html`; thay vào đó là trang HTML inline nhẹ (<1KB) hiển thị thông báo “App đang offline” và nút reload.
- Ảnh fallback luôn sẵn nhờ static cache, giảm trường hợp thumbnail mất hình khi offline.
- Background sync (`retry-failed-downloads`) chỉ thông báo client chuẩn bị retry; logic thực tế nằm ở phía React app.

## 5. Ước lượng footprint

| Thành phần | Ước lượng dung lượng | Ghi chú |
|------------|----------------------|---------|
| `offline-core-*` | ~300–500KB | 5 ảnh PNG/JPG mặc định. |
| `reader-dynamic-*` | <1MB (tuỳ session) | Chủ yếu chứa 1–2 bản `index.html` và vài response API mới nhất. |
| `chapter-images` | Phụ thuộc người dùng | Do người dùng tải chapter, có thể lên tới hàng trăm MB. |

Việc không precache bundle giúp giảm rủi ro “cache stale” khi deploy phiên bản mới và tránh lãng phí dung lượng với những trang (random, favorites…) không cần offline.

## 6. Điểm cần lưu ý/kế hoạch mở rộng

- **Selective API caching:** thêm hàm allowlist/denylist để bỏ qua các endpoint không cần lưu offline (ví dụ `/api/manga/folder-cache?mode=random`).
- **Quota awareness:** phối hợp với `storageQuota` utilities để tránh cache thêm khi storage đã đầy.
- **Monitoring:** `GET_CACHE_INFO` trả về số lượng entry từng cache; có thể log ra DevTools để kiểm tra khi debug.
- **Version bump:** khi thay đổi cấu trúc cache, chỉ cần tăng `CACHE_VERSION`; `activate` sẽ tự dọn dẹp cache cũ (trừ `chapter-images`).

## 7. Checklist QA nhanh

1. Mở DevTools > Application > Service Workers, đảm bảo SW hiển thị version `v3.0.0`.
2. Kiểm tra tab Cache Storage:
   - `offline-core-v3.0.0` chỉ chứa ảnh fallback.
   - `reader-dynamic-v3.0.0` có `index.html` sau khi load trang.
   - `chapter-images` giữ nguyên dữ liệu người dùng.
3. Ngắt mạng và truy cập lại `/offline` hoặc trang đang mở để xác nhận app shell vẫn chạy.
4. Xem console để nhận log `SW_ACTIVATED`, `Background sync`, giúp xác nhận messaging hoạt động đúng.
