# ⚡ BÁO CÁO CACHE & HIỆU NĂNG — MainWebSite

> Ngày 2026-11-05 · Phạm vi: backend Express + SQLite, React app (Vite), Service Worker `public/sw.js`.
> Đối chiếu với code trên nhánh `fix/security-path-traversal`, **kể cả các thay đổi chưa commit**.
> Issue đã có trong [ISSUES-REPORT.md](ISSUES-REPORT.md) được nhắc lại theo ID cũ (P2, B10, B15…) và chỉ ghi thêm phần mới phát hiện.
> Lần đầu chỉ audit, không sửa code. **Cập nhật cùng ngày: đã sửa toàn bộ lộ trình** — bước 1 ở [mục 7](#7-đã-sửa-bước-1-2026-11-05), bước 2–4 ở [mục 8](#8-đã-sửa-bước-24-2026-11-05) (bug hay cố ý, đánh đổi, kết quả test cho từng mục). Phần mô tả issue ở mục 1–6 giữ nguyên để đối chiếu; trạng thái ghi ngay dưới từng issue.

---

## Tóm tắt

**Có issue.** Cache có nhiều tầng nhưng không phối hợp với nhau: dữ liệu cũ sau khi quét hoặc xoá vẫn hiện trong 5–15 phút, có tầng không bao giờ được dọn, và có tầng làm request chậm thêm. Về hiệu năng, có 5 điểm ảnh hưởng nhiều nhất, xếp theo tác động:

| # | Vấn đề | Ảnh hưởng thực tế | Công sửa |
|---|--------|-------------------|----------|
| 1 | ✅ *Đã sửa.* **P2**: client Tailscale bị tra **reverse DNS ở mỗi request**, không có cache | Mỗi ảnh manga, thumbnail hay đoạn video đều phải chờ thêm một lần tra DNS. DNS lỗi thì trả 403 | Nhỏ |
| 2 | ✅ *Đã sửa (WAL + gom lệnh ghi theo lô).* **PF1**: SQLite chạy ở chế độ mặc định, scan ghi từng dòng không dùng transaction | Đo được **3,07 ms/dòng** so với **0,045 ms/dòng** khi bật WAL (nhanh hơn ~68 lần). better-sqlite3 chạy đồng bộ nên suốt lúc scan, request ảnh bị chặn theo từng nhịp 3 ms | Nhỏ |
| 3 | ✅ *Đã sửa.* **PF2**: Service Worker chờ ghi cache **xong** rồi mới trả response | Tải nhạc offline không có tiến trình (đứng 0% rồi nhảy lên 100%). Cả file nằm trong RAM của SW và bị lưu thêm một bản thừa | Nhỏ |
| 4 | ✅ *Đã sửa.* **PF3**: API liệt kê thư mục đọc **cả bảng** rồi mới lọc bằng JS. Music trả kèm cả **lời bài hát** | Mở thư mục gốc music thì đọc toàn bộ thư viện, kèm lyrics. Thư viện càng lớn càng chậm | Vừa |
| 5 | ✅ *Đã sửa.* **PF4**: Không chia nhỏ bundle (code-splitting) | Bundle JS là **1 file 1.015 kB (288 kB gzip)**. Điện thoại phải tải và parse toàn bộ app ngay lần mở đầu | Vừa |

Phần lợi lớn mà tốn ít công là **bước 1** trong [lộ trình](#6-lộ-trình-đề-xuất): cache reverse DNS, bật WAL, sửa SW không `await cache.put` và sửa B10. ✅ *Đã làm 2026-11-05, xem [mục 7](#7-đã-sửa-bước-1-2026-11-05).* Bước 2–4 cũng đã làm cùng ngày, xem [mục 8](#8-đã-sửa-bước-24-2026-11-05).

---

## 1. Bản đồ cache hiện tại

Cùng một dữ liệu có thể đi qua tới 6 tầng cache:

```
Trình duyệt                                                      Server
┌─────────────────────────────────────────────────────────┐     ┌──────────────────────────┐
│ api.js: inflight + recentGetCache (1,5 s, không dọn)     │     │ Không có cache bộ nhớ    │
│ React Query (staleTime 5', gc 5')                        │     │ (lru-cache khai báo      │
│ localStorage: react-folderCache 15' · randomView 5' ·    │ ──► │  nhưng không dùng)       │
│               recentViewed* · zustand persist           │     │ SQLite = "cache" thư mục │
│ Service Worker: reader-dynamic (mọi GET /api, không hạn) │     │ do scan tạo ra           │
│ HTTP cache (Cache-Control / ETag)                        │     └──────────────────────────┘
└─────────────────────────────────────────────────────────┘
```

### 1.1 HTTP (server → trình duyệt)

| Tài nguyên | Header hiện tại | Đánh giá |
|------------|-----------------|----------|
| Ảnh manga `/manga/*` | `public, max-age=86400, immutable` ([server.js:56-57](../backend/server.js#L56)) | ⚠️ Tên file không có hash mà vẫn đánh `immutable` (PF15) |
| Ảnh khác (`/video`, `/audio`, `/media`) | `public, max-age=3600, must-revalidate` + ETag | ✅ Ổn |
| Video/audio tĩnh | `public, max-age=3600, stale-while-revalidate=60` | ✅ Ổn |
| `/api/movie/video` (player phim dùng) | `no-store` ([video.js:42](../backend/api/movie/video.js#L42)) | ⚠️ Mở lại phim là tải lại từ đầu (PF6) |
| `/api/music/audio` | không có Cache-Control, Last-Modified hay ETag | ⚠️ Nghe lại bài là tải lại cả file (PF6) |
| Build React (`react-app/dist`) | `max-age=30 ngày` cho **mọi** file, không có `immutable` | ⚠️ PF5 |
| `index.html` (SPA fallback) | `no-cache, no-store` | ✅ Đúng |
| API JSON | ETag yếu mặc định của Express, không có Cache-Control | ✅ Trình duyệt revalidate và nhận 304, chấp nhận được |
| Nén | `compression()` cho mọi response, tự bỏ qua ảnh/video | ✅ Ổn |

### 1.2 Backend

- **Không có cache bộ nhớ nào**: `lru-cache` có trong `package.json` nhưng không file nào dùng. Thứ duy nhất được cache là connection SQLite (`dbMap`, `dbMovieMap`…).
- Bảng `folders` trong SQLite đóng vai trò cache cấu trúc thư mục, do scan tạo ra. Scan đã làm kiểu incremental (so `mtime`) ✅.
- `streamFile` dùng stream có hỗ trợ Range (đã sửa ở P1) ✅.

### 1.3 Frontend

| Tầng | Vị trí | TTL | Bị vô hiệu hoá khi |
|------|--------|-----|--------------------|
| `inflightGet` + `recentGetCache` | [api.js:18-22](../react-app/src/utils/api.js#L18) | 1,5 s | Không bao giờ bị xoá khỏi Map (PF13) |
| React Query | [main.jsx:13-21](../react-app/src/main.jsx#L13) | stale 5' | Đổi favorite (`invalidateQueries`) |
| `react-folderCache::*` (thư mục manga) | [mangaCache.js](../react-app/src/utils/mangaCache.js) | 15' | Xoá item (chỉ thư mục hiện tại), nút xoá cache trong Settings. **Không** xoá khi scan (PF7) |
| `randomView::*` | [useRandomItems.js](../react-app/src/hooks/useRandomItems.js) | 5' | Đổi source, đổi favorite |
| `recentViewed*` | [cacheKeys.js:68](../react-app/src/constants/cacheKeys.js#L68) | — | Xoá lịch sử |
| SW `reader-dynamic-v3.1.0` | [sw.js:238-279](../react-app/public/sw.js#L238) | Không giới hạn | Chỉ khi đổi `CACHE_VERSION` |
| SW `chapter-images` | offline manga | Do người dùng quản lý | ✅ |
| SW `media-thumbnails-v1` | [sw.js:308](../react-app/public/sw.js#L308) | — | Gần như không chạy (B14) |

---

## 2. Số đo

> Lúc audit, backend không chạy và `backend/data/` không có file DB nào (thư mục bị gitignore), nên **không đo được thời gian API thật**. Hai số đo dưới đây được chạy trong thư mục tạm, không đụng tới `react-app/dist`.

### 2.1 Bundle (build production, Vite 4.5)

| File | Kích thước | gzip |
|------|-----------|------|
| `assets/index-*.js` | **1.014,9 kB** | **288,2 kB** |
| `assets/index-*.css` | 132,0 kB | 21,0 kB |

Vite đưa ra cảnh báo *"Some chunks are larger than 500 kBs"*. Các phần chiếm nhiều nhất (kích thước trước khi minify):

| Thành phần | kB |
|------------|---:|
| Code của app (`src/`) | 1.126 |
| framer-motion | 335 |
| react-dom | 131 |
| axios | 98 |
| @tanstack/query-core | 76 |
| react-modal | 47 |
| embla-carousel | 47 |
| react-router + @remix-run/router | 58 |
| lucide-react + react-icons (2 bộ icon) | 49 |

`react-player`, `react-virtualized`, `date-fns`, `react-lazy-load-image-component` và `react-intersection-observer` có trong `package.json` nhưng không được import. Tree-shaking đã bỏ chúng nên không làm bundle to thêm, chỉ tốn chỗ trong `node_modules`. Backend cũng vậy với `lru-cache` và `hammerjs`.

### 2.2 SQLite: ghi từng dòng như `cache-scan.js`

3.000 lệnh `UPDATE folders SET scanned = 1 WHERE root = ? AND path = ?`, mỗi lệnh `prepare` lại một lần (giống code hiện tại). Đo bằng `node:sqlite` (cùng engine với better-sqlite3), file DB nằm trên ổ hệ thống của máy này:

| Cấu hình | Tổng | Mỗi dòng |
|----------|-----:|---------:|
| Mặc định (`journal_mode=DELETE`, `synchronous=FULL`), **như hiện tại** | 9.204 ms | 3,068 ms |
| `journal_mode=WAL` + `synchronous=NORMAL` | 135 ms | 0,045 ms |
| Mặc định nhưng gom vào 1 transaction | 40 ms | 0,013 ms |

Trên HDD, mỗi lần fsync tốn 10 ms trở lên nên chênh lệch còn lớn hơn.

---

## 3. Issue mới

### 🔴 High

#### PF1. SQLite chưa bật WAL; scan ghi từng dòng không dùng transaction

> ✅ *Đã sửa 2026-11-05: WAL + `synchronous=NORMAL` qua helper `openDB`, đóng DB khi tắt server (bước 1); 4 scanner gom lệnh ghi theo lô 500 lệnh / 1 giây và `prepare` một lần (bước 3, [utils/scanHelpers.js](../backend/utils/scanHelpers.js)). Chưa làm mục 3 (`PRAGMA optimize`).*

- **Vị trí:** [db.js:28,87,141,233](../backend/utils/db.js#L28) mở DB mà không đặt pragma nào. [cache-scan.js:114-150](../backend/utils/cache-scan.js#L114) chạy một `INSERT`/`UPDATE` riêng cho **mỗi** folder, kể cả folder không đổi (`UPDATE … SET scanned = 1`). `music-scan.js`, `movie-scan.js` và `media-scan.js` cũng làm như vậy cho mỗi file.
- **Hậu quả:** mỗi lệnh ghi là một transaction ngầm và tốn một lần fsync (~3 ms ở mục 2.2). Quét lại thư viện 20.000 bài nhạc tốn ~60 giây chỉ riêng phần ghi DB, dù không có gì thay đổi. better-sqlite3 chạy **đồng bộ**, nên mỗi lần ghi chặn event loop. Trong lúc scan, mọi request khác (ảnh, API) phải xếp hàng chờ. Các thao tác ghi lẻ như `increase-view` và `favorite` cũng tốn fsync tương tự.
- **Khắc phục:**
  1. Ngay khi mở DB, trong cả 4 hàm `getDB`/`getMovieDB`/`getMusicDB`/`getMediaDB` (nên gom thành một helper `openDB`): `db.pragma('journal_mode = WAL'); db.pragma('synchronous = NORMAL');`. WAL cũng cho phép đọc trong lúc đang ghi.
  2. Trong scan: `prepare` một lần ngoài vòng lặp. Gom các lệnh ghi lại rồi flush bằng `db.transaction()` theo lô (ví dụ 200 dòng). Scan manga đang là async, nên chỉ gom phần ghi đồng bộ, không bọc các `await`.
  3. Có thể chạy `PRAGMA optimize` khi đóng server.

#### PF2. Service Worker `await cache.put()` trước khi trả response

> ✅ *Đã sửa 2026-11-05 (cả `navigationStrategy` và nhánh cache miss của thumbnail, vốn cùng lỗi). Phần còn lại của B15 (giới hạn cache, timeout 5 s) xử lý ở bước 2.*

- **Vị trí:** [sw.js:250-262](../react-app/public/sw.js#L250) trong `networkFirstWithTimeout`:
  ```js
  const shouldCache = await checkContentChange(request, networkResponse.clone());
  if (shouldCache) await cache.put(request, networkResponse.clone());   // chờ đọc hết body
  return networkResponse;
  ```
- **Hậu quả:** `cache.put` chỉ resolve khi đã đọc **hết** body. Trang web nhận được response sau khi toàn bộ file đã tải xong.
  - `GET /api/music/download` ([musicDownloadQueue.js:121](../react-app/src/utils/musicDownloadQueue.js#L121)) đọc body theo từng chunk để hiện tiến trình. Response này không có ETag hay Last-Modified, nên `checkContentChange` trả `true`. Kết quả: thanh tiến trình đứng 0% suốt lúc tải rồi nhảy lên 100%. Cả file nằm trong RAM của SW (do stream bị tee) và **bị lưu thêm một bản** vào `reader-dynamic`, không bao giờ bị dọn.
  - Mọi API JSON đều chậm thêm một lần ghi Cache Storage trước khi tới trang.
- **Liên quan:** B15 đã ghi nhận chuyện nhân đôi dung lượng và timeout 5 s. Phần "chặn response" ở đây là mới.
- **Khắc phục:** trả response ngay, ghi cache ở nền bằng `event.waitUntil(cache.put(...))` (truyền `event` vào strategy). Loại hẳn `/api/music/download`, `/api/music/audio`, `/api/movie/video` khỏi SW (dùng `return;` để trình duyệt tự xử lý). Phần còn lại làm theo B15: chỉ cache các endpoint cần cho offline.

#### PF3. API liệt kê thư mục đọc cả bảng rồi mới lọc theo độ sâu bằng JS

> ✅ *Đã sửa 2026-11-05 bằng **index biểu thức** trên "thư mục cha" thay vì thêm cột `parent` (không phải sửa scanner/migrate, không có rủi ro chỗ insert nào quên điền cột). Đã bỏ `lyrics` khỏi `music-folder`; `LyricsModal` lấy lyrics từ `music-meta`.*

- **Vị trí:**
  - [music-folder.js:15-27](../backend/api/music/music-folder.js#L15): `SELECT folders.*, songs.artist, songs.album, songs.genre, songs.lyrics … WHERE path LIKE '%'`. Ở thư mục gốc, câu này đọc **toàn bộ thư viện kèm lời bài hát**, rồi lọc `depth === 1` bằng JS. Response cũng trả `lyrics` cho từng bài trong danh sách.
  - [movie-folder.js:22-24](../backend/api/movie/movie-folder.js#L22): `SELECT * … WHERE path LIKE '%'`, cùng kiểu.
  - [folder-loader.js:206-209](../backend/utils/folder-loader.js#L206) (manga, `useDb=1`) và hàm mới `loadFolderCountsFromDB` ([folder-loader.js:171-191](../backend/utils/folder-loader.js#L171), chưa commit): ở root, `LIKE '%'` lấy mọi folder của root.
  - [media-folders.js:38-44](../backend/api/media/media-folders.js#L38): `path LIKE ? AND path NOT LIKE ?` quét toàn bảng `media_items`.
- **Hậu quả:** chi phí tăng theo **tổng số bản ghi** chứ không theo số mục cần hiển thị. Index `idx_folders_path` không dùng được cho `LIKE` vì SQLite chỉ tối ưu `LIKE 'abc%'` khi cột có collation NOCASE hoặc bật `case_sensitive_like`. Ở music, lyrics có thể làm response nặng vài MB.
- **Khắc phục:**
  1. Thêm cột `parent` (đường dẫn thư mục cha, root là `''`) và index `(root, parent)` (movie/music thì `(parent)`). Truy vấn thành `WHERE parent = ?`, bỏ phần lọc depth trong JS. Scanner điền cột này, kèm migration một lần cho dữ liệu cũ.
  2. Bỏ `songs.lyrics` (có thể cả `genre`) khỏi `music-folder`. Lyrics đã có endpoint `music-meta` riêng để lấy khi cần.
  3. Chỉ chọn các cột cần thiết thay vì `SELECT *`.

### 🟠 Medium

#### PF4. Không chia nhỏ bundle: mọi trang nằm trong 1 file JS 1 MB

> ✅ *Đã sửa 2026-11-05: `React.lazy` cho 18 trang + tải trước khi rảnh (giữ offline), tách `vendor-react`/`vendor-motion`. Chưa làm `LazyMotion` và gộp bộ icon.*

- **Vị trí:** [App.jsx:15-34](../react-app/src/App.jsx#L15) import tĩnh cả 22 trang: MangaReader (2.318 dòng), Settings (1.848), MusicPlayer, MusicPlayerV2, các trang offline, DownloadManager… [lazyLoadComponents.js](../react-app/src/utils/lazyLoadComponents.js) đã có `React.lazy` cho DownloadManager nhưng không ai dùng.
- **Hậu quả:** lần mở đầu phải tải 288 kB gzip và parse/thực thi ~1 MB JS, kể cả khi chỉ vào trang chủ. Trên điện thoại tầm trung, riêng parse đã mất vài trăm ms. Mỗi lần sửa một dòng là cả file đổi hash, nên người dùng phải tải lại toàn bộ.
- **Khắc phục:** dùng `React.lazy` + `<Suspense>` theo route (Reader, các Player, Settings, `offline/*`, `downloads`, Media). Thêm `build.rollupOptions.output.manualChunks` để tách `vendor-react` (react, react-dom, router) và `vendor-motion` (framer-motion) cho cache ổn định giữa các lần deploy. Có thể cân nhắc `LazyMotion` + `domAnimation` của framer-motion (giảm từ ~335 kB xuống còn khoảng 1/3) và gom về một bộ icon.

#### PF5. Cache-Control của build React chưa đúng

> ✅ *Đã sửa 2026-11-05.*

- **Vị trí:** [server.js:122-128](../backend/server.js#L122). `express.static(dist, { maxAge: 30 ngày })` áp **cùng một** TTL cho cả file có hash (`/assets/*`) và file không hash (`manifest.webmanifest`, `favicon.*`, `default/*`, `sw.js`).
- **Hậu quả:** file có hash thiếu `immutable`, nên khi người dùng bấm reload trình duyệt vẫn gửi request revalidate. File không hash (manifest, icon) có thể bị giữ bản cũ tới 30 ngày. Riêng `sw.js` không bị ảnh hưởng vì trình duyệt luôn bỏ qua HTTP cache khi kiểm tra cập nhật SW.
- **Đi kèm:**
  - `express.static(frontend/public)` của frontend cũ được mount **trước** build React ([server.js:98](../backend/server.js#L98)), nên mỗi request asset React bị `stat` thêm một lần vô ích trong thư mục cũ.
  - SPA fallback chạy `fs.existsSync` và `console.log` ở mỗi lần điều hướng ([server.js:226-227](../backend/server.js#L226)).
- **Khắc phục:** mount riêng `/assets` với `maxAge: '1y', immutable: true`. Phần còn lại của `dist` để `Cache-Control: no-cache` (vẫn có ETag, nên trả 304). Kiểm tra `REACT_BUILD_PATH` một lần lúc khởi động. Chuyển (hoặc bỏ) phần mount `frontend/public` xuống sau build React.

#### PF6. Stream video/audio không cho trình duyệt cache

> ✅ *Đã sửa 2026-11-05: `private, max-age=3600` + ETag/Last-Modified, 304, If-Range.*

- **Vị trí:** [video.js:42](../backend/api/movie/video.js#L42) đặt `Cache-Control: no-store`. [audio.js:36-37](../backend/api/music/audio.js#L36) không đặt Cache-Control, Last-Modified hay ETag.
- **Hậu quả:** khi mở lại phim hoặc phát lặp một bài, file bị tải lại từ server. Qua Tailscale hay 4G, việc này tốn băng thông và phải chờ buffer lại. Trong khi đó route tĩnh `/video`, `/audio` cùng nội dung lại có `max-age=3600`.
- **Khắc phục:** đặt `Cache-Control: private, max-age=3600`, `Last-Modified` (đã có `stat`) và `ETag` dạng `"${size}-${mtimeMs}"`. Trong `streamFile`: trả 304 khi `If-None-Match`/`If-Modified-Since` khớp, và hỗ trợ `If-Range` (ETag không khớp thì trả 200 cả file thay vì 206).

#### PF7. Cache frontend không bị vô hiệu hoá sau khi scan hoặc xoá

> ✅ *Đã sửa 2026-11-05: [utils/cacheInvalidation.js](../react-app/src/utils/cacheInvalidation.js), gắn vào `apiService` nên mọi nơi gọi scan/reset/xoá đều được áp dụng.*

- **Vị trí:** [ScanModal.jsx](../react-app/src/components/common/ScanModal.jsx) không đụng tới cache nào. `deleteItem` của manga chỉ xoá cache của thư mục hiện tại, và làm bằng cách ghi `null` ([store/index.js:482-483](../react-app/src/store/index.js#L482)). `clearMangaCache` chỉ reset state trong bộ nhớ, không xoá localStorage.
- **Hậu quả:**
  - Scan xong, thư mục đã mở trong 15 phút qua vẫn hiện danh sách cũ, không có chapter hay bộ mới. Phần "Ngẫu nhiên" giữ bản cũ thêm 5 phút.
  - Xoá một bộ trong thư mục con thì thư mục cha vẫn hiện bộ đó (card có ảnh lỗi) cho tới khi cache hết hạn.
  - Người dùng phải tự vào Settings xoá cache.
- **Khắc phục:** sau khi scan, reset hoặc xoá thành công, gọi `clearSourceCache(sourceKey)` (đã có trong `cacheKeys.js`) cùng `queryClient.invalidateQueries()`. Cách bền hơn: backend trả `lastScanAt` theo source, và frontend đưa giá trị này vào key cache. Khi scan xong thì key đổi, cache cũ tự mất hiệu lực.

#### PF8. Folder cache trong localStorage không giới hạn dung lượng và không có cơ chế dọn

> ✅ *Đã sửa 2026-11-05 theo cách thứ hai (giữ localStorage, thêm giới hạn + dọn + xử lý đầy).*

- **Vị trí:** [mangaCache.js:65-80](../react-app/src/utils/mangaCache.js#L65). Mỗi thư mục được lưu nguyên danh sách, kể cả mảng `images` của thư mục có ảnh (`isSelfReader`). Entry hết hạn chỉ bị xoá khi đọc lại **đúng** key đó ([mangaCache.js:43-47](../react-app/src/utils/mangaCache.js#L43)). Lỗi khi ghi chỉ được `console.error` (comment trong code: *"Có thể thêm logic dọn dẹp cache cũ"*).
- **Hậu quả:** localStorage chỉ có ~5 MB cho mỗi origin. Duyệt nhiều thư mục thì đầy dần. Khi đã đầy, **mọi** `setItem` đều lỗi, kể cả zustand persist của favorites, cài đặt reader, `auth-storage` (token, source đang chọn) và lịch sử đã xem. Các lỗi này không hiện ra cho người dùng. D4 mới sửa riêng hàng đợi tải.
- **Khắc phục (chọn một):**
  - **(khuyên dùng)** Bỏ folder cache ở localStorage và dùng React Query. Muốn giữ qua lần reload thì dùng `persistQueryClient` với IndexedDB.
  - Hoặc thêm LRU: giới hạn khoảng 100 key, quét bỏ key hết hạn lúc khởi động, gặp `QuotaExceededError` thì xoá cache cũ nhất rồi thử ghi lại. Không lưu mảng `images`.

#### PF9. Timeline Media tính lại trên toàn bảng ở mỗi trang

> ✅ *Đã sửa 2026-11-05.*

- **Vị trí:** [media-folder.js:58-87](../backend/api/media/media-folder.js#L58). Mỗi lần gọi (trang 1, 2, 3…) chạy `COUNT(*)`, `SELECT *` và câu `timeline` có `GROUP BY date(...)` trên toàn bảng. Lọc `year`/`month` bằng `strftime(... date_taken ...) = ?` nên không dùng được index `idx_media_date_taken`.
- **Hậu quả:** cuộn vô hạn trong thư viện vài chục nghìn ảnh thì mỗi trang đều phải quét lại cả bảng và gom nhóm lại từ đầu.
- **Khắc phục:** lọc theo khoảng `date_taken >= ? AND date_taken < ?` (tính ms đầu và cuối tháng hoặc năm ở JS). Chỉ trả `timeline` khi `page=1`, hoặc tách thành endpoint riêng. Chỉ chọn các cột UI cần.

#### PF10. Một số đường đọc ổ đĩa vẫn đồng bộ và chặn event loop

> ✅ *Đã sửa 2026-11-05 (`useDb=0`, music/movie/media scan). Còn `readdirSync` của thư mục hiện tại trong `loadFolderFromDB` (một thư mục, không đệ quy).*

- **Vị trí:**
  - [folder-loader.js:52-57](../backend/utils/folder-loader.js#L52) (chế độ `useDb=0`): với **mỗi** thư mục con, gọi `findFirstImageRecursively` đồng bộ và đệ quy. Thư mục gốc có 1.000 bộ là hàng nghìn lần `readdirSync` trong một request. Lúc đó server không phục vụ được gì khác, và SW cắt request sau 5 s (B15).
  - [music-scan.js:66,142](../backend/utils/music-scan.js#L66) và [media-scan.js:139,193,231](../backend/utils/media-scan.js#L139) vẫn dùng `readdirSync`/`statSync`. P1 mới chuyển scan **manga** sang async.
- **Khắc phục:** dùng `findFirstImageRecursivelyAsync` (đã có sẵn trong `imageUtils.js`), giới hạn số tác vụ chạy song song. Chuyển `music-scan`/`media-scan` sang `fs.promises`.

### 🟢 Low

| ID | Vấn đề | Vị trí | Khắc phục |
|----|--------|--------|-----------|
| PF11 | ✅ *Đã sửa.* `next-chapter` lấy **mọi** path của root rồi sort tự nhiên ở **mỗi** lần bấm "chương sau" | [folder-cache.js:126-150](../backend/api/manga/folder-cache.js#L126) | Cache danh sách đã sort theo `(key, root)` trong bộ nhớ, xoá khi scan/reset/xoá |
| PF12 | ✅ *Đã sửa.* `GET`/`POST /favorite` chạy `PRAGMA table_info` (và có thể cả `ALTER TABLE`) ở mỗi request | [favorite.js:21-28,56-63](../backend/api/manga/favorite.js#L21) | Chuyển migration cột `favoriteAt` vào `getDB` |
| PF13 | ✅ *Đã sửa.* `recentGetCache` chỉ kiểm tra TTL khi đọc, không bao giờ `delete`. Map lớn dần suốt phiên và giữ nguyên các response chứa mảng ảnh | [api.js:21](../react-app/src/utils/api.js#L21) | Xoá entry hết hạn khi đọc, hoặc bỏ hẳn tầng này vì React Query đã dedupe |
| PF14 | 🟡 *Một phần: thêm hàm xoá cache dùng chung cho mọi tầng (PF7), chưa gộp các tầng về React Query.* Quá nhiều tầng cache cho cùng một dữ liệu (api.js → React Query → localStorage → SW → HTTP). Mỗi tầng có TTL và cách vô hiệu hoá riêng, đây là gốc của PF7. `favoriteCache.js` (310 dòng) phải vá từng tầng một | toàn frontend | React Query làm nguồn duy nhất. SW chỉ cache cho offline theo allowlist |
| PF15 | ✅ *Đã bỏ `immutable` (giữ 1 ngày). Phần mount theo key vẫn là P3.* Ảnh manga để `immutable` dù tên file không có hash. Thay ảnh cùng tên thì client giữ bản cũ tới 1 ngày, và nút reload cũng không lấy lại. Nhiều nguồn `ROOT_*` cùng mount `/manga`, nên mỗi ảnh phải `stat` qua từng root đứng trước (gộp với P3) | [server.js:51-57,81-96](../backend/server.js#L51) | Bỏ `immutable`, giữ ETag, có thể tăng `max-age` lên 7 ngày. Mount theo key (P3) |
| PF16 | ✅ *Đã sửa (3 ảnh song song).* Preload ảnh trong reader chạy **tuần tự** và nghỉ 50 ms giữa các ảnh. Với mạng có độ trễ cao, mỗi RTT chỉ tải được ~1 ảnh, và P2 còn cộng thêm một lần tra DNS cho mỗi ảnh | [MangaReader.jsx:604-626](../react-app/src/pages/manga/MangaReader.jsx#L604) | Cho 2–3 ảnh tải song song, bỏ khoảng nghỉ |
| PF17 | ✅ *Đã sửa (có migrate).* Key `recentViewed` của manga không có `sourceKey` (`recentViewed::<root>::<root>`), nên hai nguồn có thư mục gốc trùng tên dùng chung lịch sử | [cacheKeys.js:68](../react-app/src/constants/cacheKeys.js#L68) | Thêm `sourceKey` vào key, migrate key cũ một lần |
| PF18 | ✅ *Đã sửa: build bỏ `console.log/debug/info`; SW chỉ log khi `SW_DEBUG = true`.* Build production không bỏ `console.log`: có 302 lời gọi `log`/`debug`/`info`, nhiều cái nằm trên đường nóng (SW log ở mỗi request, preload log ở mỗi ảnh, log mỗi lần cache hit). Log kèm object còn giữ object đó trong bộ nhớ khi mở DevTools | [vite.config.js](../react-app/vite.config.js), [sw.js](../react-app/public/sw.js) | `esbuild: { pure: ['console.log', 'console.debug', 'console.info'] }` khi build production. Trong SW, chỉ log khi bật cờ `DEBUG` (liên quan M3) |

---

## 4. Issue cũ liên quan đến hiệu năng: trạng thái

Đã kiểm tra lại trong code hiện tại:

| ID | Tình trạng | Ghi chú thêm |
|----|-----------|--------------|
| **P2**: reverse DNS ở mỗi request | ✅ Đã sửa 2026-11-05 ([auth.js](../backend/middleware/auth.js)) | **Tác động lớn nhất** với truy cập qua Tailscale: một chapter 200 trang là 200 lần tra DNS, cộng thêm thumbnail. Đã làm: nhớ "cho phép" 5 phút, "bị chặn" 1 phút, lỗi DNS không nhớ. Các request đến cùng lúc dùng chung một lần tra. Giới hạn 1.000 IP |
| **B10**: `video-cache` với `mode` sai bị treo | ✅ Đã sửa 2026-11-05 | Thêm `return res.status(400)…` ở cuối handler |
| **B11**: `mode=top` join `views` không lọc `v.root` | ✅ Đã sửa 2026-11-05: `mode=top` (bước 1) và `POST /favorite` — frontend gửi `root`, backend chỉ đổi đúng root; client cũ không gửi `root` vẫn chạy như trước (bước 3) | Ngoài chuyện sai dữ liệu, câu này còn quét **toàn bộ** bảng `views` của mọi root. Thêm `WHERE v.root = ?` sẽ dùng được khoá chính `(root, path)` |
| **B14**: cache thumbnail của SW không chạy | ✅ Đã sửa 2026-11-05 | Chỉ nhận thumbnail trong `.thumbnail/` của `/video`, `/audio`, `/media` (không nhận ảnh gốc của Media), kiểm tra trước nhánh ảnh manga. Đã thấy chạy trên trình duyệt thật |
| **B15**: SW cache mọi `/api` GET, timeout 5 s | ✅ Đã sửa 2026-11-05 | Thay vì allowlist (có thể mất dữ liệu offline đang dùng): giữ tối đa 400 response API mới nhất. Quá 5 s: có cache → trả cache, mạng về sau vẫn cập nhật; chưa có cache → chờ tiếp thay vì 503 |
| **P3**: nhiều nguồn mount chung đường dẫn tĩnh | ❌ Còn | Xem PF15 |
| **P4**: IndexedDB mở connection mới ở mỗi thao tác | Chưa kiểm tra lại | — |
| **M3**: quá nhiều `console.*` | 🟡 Một phần | Bản build bỏ `console.log/debug/info` (268 → 1), SW tắt log mặc định (PF18). Mã nguồn vẫn còn các lời gọi, chưa có logger có cấp độ |

---

## 5. Những phần đã làm tốt

- Stream video/audio bằng `createReadStream` có hỗ trợ Range, không đọc cả file vào RAM (P1).
- Scan manga chạy async, có `memo` cho `hasImage` và khoá theo `(dbkey, root)`. Các scan khác đều incremental theo `mtime`.
- API GET được dedupe khi đang chạy (`inflightGet`). React Query có `staleTime` 5' và tắt refetch khi focus.
- Có `compression()`. Express tự gắn ETag cho JSON nên trình duyệt nhận 304.
- Reader có preload hai chiều và huỷ được. `readerPrefetch` tránh gọi API hai lần khi chuyển từ Home sang Reader.
- Cache offline chapter (`chapter-images`) tách riêng, không bị dọn theo phiên bản SW.
- `index.html` không bị cache, nên deploy bản mới là người dùng nhận ngay.

---

## 6. Lộ trình đề xuất

| Bước | Nội dung | Issue | Ước lượng |
|------|----------|-------|-----------|
| **1. Sửa nhanh, lợi lớn** ✅ | Cache reverse DNS theo IP. Bật WAL + `synchronous=NORMAL` trong một helper `openDB`. SW: không `await cache.put`, loại download/audio/video khỏi SW. Thêm 400 cho `video-cache`. Thêm `v.root` vào `mode=top` | P2, PF1 (phần pragma), PF2, B10, B11 | ~1–2 giờ |
| **2. Cache đúng và có dọn dẹp** ✅ | Xoá cache frontend sau scan/xoá. Giới hạn hoặc bỏ folder cache trong localStorage. Header `immutable` cho `/assets`. Cho phép cache video/audio stream có ETag. Allowlist cho SW | PF5, PF6, PF7, PF8, B15 | ~0,5–1 ngày |
| **3. Truy vấn và tải trang** ✅ | Cột `parent` + index, bỏ lyrics khỏi danh sách. Lọc timeline media theo khoảng thời gian. Gom ghi DB khi scan thành transaction. `React.lazy` theo route + `manualChunks`. Async hoá `useDb=0` và music/media scan | PF1 (phần transaction), PF3, PF4, PF9, PF10 | ~1–2 ngày |
| **4. Dọn dẹp** ✅ (trừ phần gộp tầng cache của PF14) | Gộp các tầng cache về React Query. Các mục Low | PF11–PF18, B14 | Tuỳ thời gian |

### Cách kiểm tra sau khi sửa

- **P2:** truy cập qua Tailscale, mở một chapter, xem log server. Mỗi IP chỉ được tra DNS một lần trong suốt TTL.
- **PF1:** đo thời gian quét lại một nguồn không có thay đổi, trước và sau khi sửa. Thử kéo ảnh trong reader lúc đang scan, không được giật.
- **PF2:** tải một bài FLAC lớn trong hàng đợi nhạc, thanh tiến trình phải tăng dần. Trong DevTools → Application → Cache Storage, `reader-dynamic` không được có file nhạc.
- **PF4:** chạy `npm run build`, chunk đầu phải dưới 300 kB (trước gzip). Mở tab Network khi vào trang chủ, không được tải code của Reader hay Player.
- **PF7:** quét một nguồn có chapter mới rồi quay lại thư mục đó, chapter mới phải hiện ngay.
- Có thể thêm header `Server-Timing` (thời gian DB và thời gian đọc đĩa) cho `folder-cache`, `music-folder`, `media-folder` để xem trực tiếp trong DevTools.

---

## 7. Đã sửa bước 1 (2026-11-05)

### 7.1 Bug hay cố ý? Sửa có mất gì?

Đối chiếu với lịch sử git trước khi sửa:

| Mục | Bug hay cố ý | Bằng chứng | Đánh đổi khi sửa |
|-----|--------------|-----------|------------------|
| **P2**: tra DNS ở mỗi request | **Thiếu sót.** Từ v2.0 (`94f832f`) chưa từng có cache | `git log -S "dns.reverse"` | IP đã được cho phép thì trong 5 phút không bị tra lại. Tailscale cấp IP cố định cho từng máy, nên rủi ro IP đổi chủ trong khoảng đó rất thấp. Đổi `ALLOWED_HOSTNAMES` vẫn phải restart như trước |
| **PF1**: SQLite chế độ mặc định | **Không ai chọn.** Không có pragma hay comment nào, chỉ là mặc định của thư viện | — | ① Có thêm `-wal`/`-shm` cạnh mỗi `.db`. Khi tắt server, chúng được gộp vào `.db`. Sao lưu lúc server đang chạy phải copy cả 3 file (đã ghi vào [readme](../readme.md)). ② `synchronous=NORMAL`: Node crash thì không mất gì. Mất điện/treo máy có thể mất vài lệnh ghi cuối (yêu thích, lượt xem), **DB không hỏng**. Không chấp nhận được thì đổi `SQLITE_SYNCHRONOUS` trong `db.js` thành `"FULL"`: không còn rủi ro, nhưng chỉ nhanh hơn trước ~4 lần (0,95 ms/dòng) thay vì ~50 lần. ③ Không có code nào xoá file `.db` khi đang mở, nên không có rủi ro file WAL "mồ côi" |
| **PF2**: SW `await cache.put` | **Tác dụng phụ ngoài ý muốn.** Bản đầu ghi cache không `await`. Commit `a1b98f2` thêm `await` cùng lúc với kiểm tra `status === 200`, để `try/catch` bắt được lỗi `cache.put` | `git log -S "await cache.put(request, networkResponse.clone())"` | **Không mất gì.** Vẫn bắt lỗi, vẫn cache như cũ cho offline, còn `event.waitUntil` giữ SW sống tới khi ghi xong. File nhạc tải về được lưu ra máy qua `<a download>`, phát nhạc/phim luôn nhận 206 (không bao giờ được cache), nên bỏ chúng khỏi SW không ảnh hưởng tính năng nào. **Không** đổi `CACHE_VERSION` để không xoá cache API offline: chỉ xoá đúng các bản sao file nhạc/phim cũ |
| **B10**: `video-cache` treo | **Bug.** `audio-cache.js` cùng loại có dòng trả 400, `video-cache.js` thiếu | — | Không có. Chỉ ảnh hưởng request có `mode` sai |
| **B11** (`mode=top`) | **Bug.** Bảng `views` có khoá `(root, path)`, câu cũ đã truyền `root` nhưng lọc nhầm vào bảng `folders` | `git log -S "rootKey"`: từ v2.0 frontend luôn gửi `rootKey: rootFolder` | **Không mất lượt xem nào.** Chỉ bỏ các dòng "ăn ké" của root khác có cùng path. Riêng phần `POST /favorite` của B11 chưa sửa vì frontend chưa gửi `root` |

> Ngoài bước 1: `Cache-Control: no-store` của `/api/movie/video` (PF6) được thêm trong commit "fix tua" (`8e13e69`), cùng lúc với cache video trong RAM (đã bỏ ở P1), nên **có thể là cố ý** để sửa lỗi tua. Khi làm PF6 cần thử lại thao tác tua.

### 7.2 Thay đổi

| File | Nội dung |
|------|----------|
| [backend/middleware/auth.js](../backend/middleware/auth.js) | `checkHostname()`: nhớ kết quả theo IP (cho phép 5', chặn 1', lỗi không nhớ). Request đến cùng lúc dùng chung một lần tra. Giới hạn 1.000 IP |
| [backend/utils/db.js](../backend/utils/db.js) | Helper `openDB()` (WAL + `synchronous=NORMAL`, không bật được WAL thì vẫn chạy ở chế độ cũ) cho cả 4 `get*DB`. `closeAllDBs()` |
| [backend/server.js](../backend/server.js) | Gọi `closeAllDBs()` trước `process.exit` khi nhận SIGINT/SIGTERM |
| [react-app/public/sw.js](../react-app/public/sw.js) | `runInBackground()` + `event.waitUntil` cho `networkFirstWithTimeout`, `navigationStrategy`, cache miss của thumbnail. `isStreamOrDownload()`: bỏ qua `/api/music/download`, `/api/music/audio`, `/api/movie/video` và mọi request có `Range`. `purgeStreamEntries()` lúc activate |
| [backend/api/movie/video-cache.js](../backend/api/movie/video-cache.js) | Trả `400 Invalid mode` |
| [backend/api/manga/folder-cache.js](../backend/api/manga/folder-cache.js) | `mode=top`: `JOIN folders f ON f.root = v.root AND f.path = v.path WHERE v.root = ?` |

### 7.3 Kiểm tra

Máy audit chưa cài dependency của backend (`express`, `dotenv`, `better-sqlite3`) và không có `.env`. Vì vậy mình copy đúng các file đã sửa sang thư mục tạm, thay thư viện thiếu bằng bản giả lập. SQLite là engine thật, chạy qua `node:sqlite`.

- **Backend (15/15 qua):**
  - P2: 50 request đồng thời → 1 lần tra DNS, 200 request tiếp theo → 0 lần, hết TTL thì tra lại. Bị chặn → 403 và được nhớ 1 phút. Lỗi DNS → 403, không nhớ. Cache giới hạn 1.000 IP.
  - PF1: cả 4 loại DB ở `wal`/`NORMAL`, schema đầy đủ. Đóng DB thì `-wal` được gộp và xoá, dữ liệu còn nguyên.
  - B10: mode sai → 400, `random`/`top` vẫn chạy.
  - B11: dữ liệu mẫu gồm `Naruto` ở hai root. Câu cũ (root=1) trả `Naruto:100, Naruto:5, OnePiece:3`, tức là trùng dòng và lẫn root. Câu mới trả `Naruto:5, OnePiece:3`. Kế hoạch truy vấn đổi từ `SCAN v` (quét `views` cho từng folder) sang `SEARCH v USING INDEX sqlite_autoindex_views_1 (root=? AND path=?)`.
- **Service Worker (9/9 qua, giả lập trong `vm`):** chạy cả bản cũ (git HEAD) và bản mới với cùng một `cache.put` cố tình chậm:
  - Bản cũ **chờ** ghi cache xong mới trả response. Bản mới **trả ngay**, và cache vẫn được ghi.
  - Offline vẫn trả bản cache. Download/audio/video/Range không đi qua SW, còn `video-cache`/`audio-cache` thì vẫn đi qua.
  - Navigation vẫn cache `/` và `/index.html`. Activate chỉ xoá bản sao file nhạc/phim. Lỗi quota không làm hỏng response.
- **Trình duyệt thật (Chromium trong Claude Browser, Vite dev):** SW mới cài và `activated`, điều khiển trang. Request đi qua SW nhận 200 và được ghi vào `reader-dynamic` ở nền. SW vẫn trả lời `GET_CACHE_INFO`. Không có lỗi nào từ SW.
- **Chưa kiểm tra:** chạy backend thật với dữ liệu thật (máy audit không có), tải nhạc thật xem thanh tiến trình, truy cập thật qua Tailscale.

---

## 8. Đã sửa bước 2–4 (2026-11-05)

Toàn bộ lộ trình ở [mục 6](#6-lộ-trình-đề-xuất) đã làm xong, trừ phần gộp các tầng cache về React Query của PF14 (xem [8.4](#84-chưa-làm)). Cũng như bước 1, mỗi mục được đối chiếu với lịch sử git trước khi sửa, và chọn cách sửa không làm mất dữ liệu hay tính năng.

### 8.1 Bug hay cố ý? Sửa có mất gì?

| Mục | Bug hay cố ý | Đánh đổi / có mất gì |
|-----|--------------|----------------------|
| **PF1** gom lệnh ghi khi scan | **Không ai chọn**: ghi riêng từng lệnh là cách viết đơn giản nhất | Trong lúc scan, mục vừa quét hiện ra với request khác chậm tối đa ~1 giây (hoặc 500 lệnh). Nếu một lô lỗi (VD vi phạm UNIQUE), lô bị rollback rồi chạy lại **từng lệnh**, nên kết quả giống hệt ghi lẻ: lệnh trước lỗi được lưu, lệnh lỗi ném ra (đã test). Bản ghi mới mà thư mục con cần sửa `otherName` được sửa thẳng trong lệnh INSERT đang chờ (đã test bằng thư mục rỗng làm tên khác) |
| **PF3** liệt kê thư mục | Đọc cả bảng: cách viết đơn giản, không cố ý. **Lyrics trong danh sách thì có dùng**: `FullPlayerModal` lấy lyrics từ item của danh sách | `LyricsModal` giờ lấy lyrics từ `/api/music/music-meta` của bài đang phát (`MusicPlayerProvider` vốn đã tải sẵn). Nếu request đó lỗi thì modal lyrics trống, trong khi trước đây vẫn có. Index biểu thức tạo một lần khi mở DB lần đầu sau khi cập nhật (thêm chút dung lượng DB). Kết quả liệt kê giống hệt cách cũ, kể cả không phân biệt hoa/thường như `LIKE` (đã so trên dữ liệu thật và dữ liệu giả có Unicode, `Vol_1`) |
| **PF4** lazy load trang | Không cố ý: `utils/lazyLoadComponents.js` có sẵn nhưng không được dùng | Lần đầu mở một trang có thể thấy vòng xoay rất ngắn trong lúc tải chunk. Việc tải trước tất cả trang khi trình duyệt rảnh làm khoảng chờ này gần như không còn. **Offline vẫn mở được mọi trang** nếu app đã từng mở online (đã test bằng cách tắt server rồi tải lại toàn trang) |
| **PF5** header build React | Không cố ý: một cấu hình dùng chung cho mọi file | `manifest`, `favicon`, `sw.js` hỏi lại server ở mỗi lần tải trang (nhận 304, vài trăm byte) |
| **PF6** cache stream | **Có thể cố ý**: `no-store` được thêm ở commit "fix tua" (`8e13e69`), cùng lúc với cache video trong RAM (cache đó đã bỏ ở P1) | Trình duyệt giữ phần video/audio đã xem tối đa 1 giờ (`private`). Khi tua, If-Range đảm bảo file đổi thì tải lại đúng. Nếu tua trên thiết bị nào đó bị lỗi trở lại thì đổi lại `no-store` ở `video.js` (1 dòng) |
| **PF7** xoá cache sau scan/xoá | Thiếu sót | Scan/reset xong thì danh sách "Ngẫu nhiên" được xáo lại (vì có dữ liệu mới). Xoá một item thì không xáo. **Lịch sử xem, yêu thích, cài đặt không bị xoá.** API lỗi thì không xoá gì |
| **PF8** giới hạn folder cache | Thiếu sót: comment trong code đã ghi *"Có thể thêm logic dọn dẹp cache cũ nếu đầy bộ nhớ"* | Nhớ tối đa 60 thư mục. Thư mục rất lớn (JSON > 250.000 ký tự) không được nhớ, mở lại thì tải từ server. localStorage đầy thì chỉ bỏ folder cache cũ, không đụng favorites/token |
| **PF9** timeline Media | Thiếu sót | Không mất gì. API vẫn trả timeline theo mặc định (tương thích ngược); chỉ bỏ khi client gửi `timeline=0` lúc **chỉ** đổi trang. Tải lại cùng trang (sau khi xoá, đổi yêu thích…) vẫn tính lại |
| **PF10** I/O đồng bộ | Phần còn sót sau P1 | Không mất gì. Tìm ảnh bìa tối đa 4 thư mục song song |
| **PF11** `next-chapter` | Không cố ý | Không mất gì. Cache tự hết hạn khi có thư mục thêm/xoá (đã test bằng cách thêm "Chap 3" rồi scan lại) |
| **PF12** `PRAGMA` mỗi request | Không cố ý | Không mất gì |
| **PF13** cache 1,5 s trong `api.js` | Không cố ý | Không mất gì |
| **PF15** ảnh manga `immutable` | Comment trong code cho thấy người viết định bật `immutable` *khi tên file có hash*, nhưng tên ảnh manga không có hash | Bấm reload trong reader sẽ hỏi lại server cho từng ảnh (nhận 304). Duyệt bình thường không đổi |
| **PF16** preload tuần tự | **Cố ý**: comment *"tránh overwhelm backend"* | Tải 3 ảnh song song thay vì 1 nên server nhận tải cao hơn một chút, vẫn có giới hạn. Một ảnh lỗi không còn làm dừng cả lượt preload |
| **PF17** key lịch sử manga | Format cũ được giữ có chủ đích để tương thích (comment *"Legacy format"*) | Lịch sử cũ (đang lẫn giữa các nguồn trùng tên root) được chép cho **từng** nguồn, key cũ vẫn giữ. Đã test: xoá lịch sử của một nguồn thì không bị khôi phục lại |
| **PF18** `console.log` | Không cố ý | Bản build không còn `console.log/info/debug` (`warn/error` vẫn giữ). Muốn gỡ lỗi production thì dùng bản dev. Với SW, đặt `SW_DEBUG = true` |
| **B11** yêu thích theo root | Bug | Không mất gì. Client cũ không gửi `root` vẫn chạy như trước |
| **B14** cache thumbnail SW | Bug | SW giữ tối đa 1.000 thumbnail (~30 MB). Mỗi lần xem thumbnail đã cache, SW hỏi lại ở nền; phần lớn được phục vụ từ HTTP cache nên không tốn mạng |
| **B15** cache API của SW | Bug | API chậm mà chưa có cache thì trang **chờ** tới khi server trả lời (giống như không có SW), không còn 503. Chỉ giữ 400 response API mới nhất, nên mục cũ hơn không còn dùng được khi offline |
| **B20** INSERT `songs` | Bug | Bản ghi `songs` mồ côi được ghi đè bằng metadata mới. Lyrics đã có được giữ nếu file không có lyrics nhúng |

### 8.2 Thay đổi

| File | Nội dung |
|------|----------|
| [backend/utils/scanHelpers.js](../backend/utils/scanHelpers.js) *(mới)* | `createWriteQueue` (gom lệnh ghi theo lô 500 lệnh / 1 s, lỗi thì chạy lại từng lệnh), `createThumbnailLookup` (đọc mỗi thư mục `.thumbnail` một lần), `pathExists` |
| [cache-scan.js](../backend/utils/cache-scan.js), [music-scan.js](../backend/utils/music-scan.js), [movie-scan.js](../backend/utils/movie-scan.js), [media-scan.js](../backend/utils/media-scan.js) | Dùng hàng đợi ghi; `readdir`/`stat` async; flush trước bước dọn `scanned = 0`. Media: flush trước khi đếm item và đếm bằng khoảng path (dùng index). Music: upsert `songs` (B20) |
| [backend/utils/db.js](../backend/utils/db.js) | `parentPathSql()`/`parentKey()` + index biểu thức thư mục cha (`COLLATE NOCASE`) cho manga/movie/music/media; cột `favoriteAt` migrate một lần |
| [folder-loader.js](../backend/utils/folder-loader.js), [movie-folder.js](../backend/api/movie/movie-folder.js), [music-folder.js](../backend/api/music/music-folder.js), [media-folders.js](../backend/api/media/media-folders.js) | Lấy con trực tiếp qua index; `music-folder` bỏ `lyrics`; `loadFolderFromDisk` async |
| [media-folder.js](../backend/api/media/media-folder.js) | Lọc năm/tháng theo khoảng `date_taken` (UTC, giống `strftime` cũ); `timeline=0` |
| [folder-cache.js](../backend/api/manga/folder-cache.js), [favorite.js](../backend/api/manga/favorite.js) | Cache `next-chapter`; `favorite` nhận `root` và bỏ `PRAGMA` mỗi request |
| [streamFile.js](../backend/utils/streamFile.js), [video.js](../backend/api/movie/video.js), [audio.js](../backend/api/music/audio.js) | ETag mạnh, `Last-Modified`, 304, If-Range; `Cache-Control: private, max-age=3600` |
| [backend/server.js](../backend/server.js) | `/assets` 1 năm `immutable`, file không hash `no-cache`; frontend cũ mount sau build React; ảnh manga bỏ `immutable`; kiểm tra build một lần lúc khởi động |
| [react-app/public/sw.js](../react-app/public/sw.js) | Giới hạn 400 response API; quá 5 s không còn trả 503; thumbnail (B14); `SW_DEBUG` |
| [App.jsx](../react-app/src/App.jsx), [vite.config.js](../react-app/vite.config.js) | `React.lazy` cho 18 trang + tải trước khi rảnh; `vendor-react`/`vendor-motion`; bỏ `console.log/info/debug` khi build |
| [queryClient.js](../react-app/src/queryClient.js) *(mới)*, [cacheInvalidation.js](../react-app/src/utils/cacheInvalidation.js) *(mới)*, [api.js](../react-app/src/utils/api.js) | Scan/reset/xoá thành công thì xoá cache của nguồn ở mọi tầng; cache 1,5 s có giới hạn và tự dọn |
| [mangaCache.js](../react-app/src/utils/mangaCache.js) | Tối đa 60 thư mục, bỏ mục quá lớn, dọn mục hết hạn lúc khởi động, xử lý localStorage đầy |
| [cacheKeys.js](../react-app/src/constants/cacheKeys.js) | Key lịch sử manga có `sourceKey` + migrate |
| [LyricsModal.jsx](../react-app/src/components/music/LyricsModal.jsx) | Lấy lyrics từ metadata của bài đang phát khi danh sách không có |
| [MediaHome.jsx](../react-app/src/pages/media/MediaHome.jsx), [MangaReader.jsx](../react-app/src/pages/manga/MangaReader.jsx), [store/index.js](../react-app/src/store/index.js) | Không hỏi lại timeline khi chỉ đổi trang; preload 3 ảnh song song; gửi `root` khi đổi yêu thích manga |

### 8.3 Kiểm tra

**Môi trường.** Máy audit không cài được dependency backend của repo: `better-sqlite3@11.10.0` không có bản build sẵn cho Node 24 (xem C10 trong ISSUES-REPORT). Vì vậy mình cài Express 5, `better-sqlite3` 12.11.1 (cùng API) và các gói còn lại vào thư mục tạm, không đụng `node_modules`/`package-lock` của repo. Dữ liệu giả gồm:

- manga: 2 thư mục gốc có cùng path `Naruto`, tên Unicode, cặp `Bleach_1`/`Bleach-1`, thư mục rỗng làm tên khác, `Chap 1/2/10`;
- nhạc có `.thumbnail`; phim 256 KB để thử Range;
- ảnh có ngày ở ranh giới năm.

**Bản cũ (git HEAD) và bản mới chạy song song trên cùng dữ liệu** để so kết quả.

| Bộ test | Kết quả | Nội dung |
|---------|---------|----------|
| E2E backend cũ ↔ mới (HTTP thật) | **44/44** | Danh sách manga (DB/ổ đĩa, Unicode, hoa/thường), movie, music, media **giống hệt bản cũ** (music trừ trường `lyrics`); `otherName`; `next-chapter` (thứ tự tự nhiên + tự hết hạn); 10 bộ lọc timeline trả cùng items/pagination/timeline; `timeline=0`; top view (cũ `Naruto:5, Naruto:2` → mới `Naruto:2`); favorite theo root; `video-cache` mode sai (cũ treo, mới 400); stream 206/304/If-Range/416/suffix range; header `/assets`, `manifest`, `sw.js`, ảnh manga, SPA fallback; file `-wal` |
| Backend đơn vị (`better-sqlite3` thật) | **23/23** | Hàng đợi (flush, maxOps, lỗi giữa lô, flush hẹn giờ, `stmt`); tra thumbnail (thứ tự đuôi, hoa/thường trên Windows); con trực tiếp giống cách cũ với 8 thư mục; `EXPLAIN QUERY PLAN` cho 7 truy vấn mới đều dùng đúng index |
| Service Worker (vm, so với bản HEAD) | **16/16** | 9 test bước 1 + API chậm (cũ 503 → mới 200), trả cache khi chậm rồi cập nhật bằng response về muộn, giới hạn 400 mục (asset không tính), thumbnail `.thumbnail` vào cache, ảnh gốc Media/manga không vào, thumbnail offline |
| Frontend (esbuild + localStorage giả lập có quota) | **12/12** | Folder cache: đọc/ghi, giới hạn 60, bỏ mục lớn, localStorage đầy không đụng favorites/token. Xoá cache theo nguồn: giữ lịch sử, đúng nguồn, React Query, gắn vào `apiService`, API lỗi không xoá. Migrate lịch sử: chép cho cả hai nguồn, không khôi phục sau khi xoá |
| Trình duyệt thật (Chromium, build production + backend mới) | Đạt | Trang chủ → chọn nguồn → MangaHome → Naruto (4 chương đúng thứ tự, có số trang) → reader (3 ảnh tải xong); trang Music liệt kê đúng; thumbnail vào `media-thumbnails-v1`; 41–45 chunk JS nằm trong cache; **tắt server rồi tải lại toàn trang**: app shell + chunk lấy từ cache, trang offline hiện bình thường; không có lỗi nào từ SW |

**Số đo.**

| Hạng mục | Trước | Sau |
|----------|-------|-----|
| JS tải lần đầu | 1 file **1.015 kB** (288 kB gzip) | `index` + `vendor-react` + `vendor-motion` = **583 kB** (180 kB gzip), các trang khác tải sau |
| `console.log` trong bản build | 268 | 1 |
| Liệt kê thư mục gốc (11.311 bản ghi, cùng kết quả) | 10,9 ms | **0,28 ms** |
| Liệt kê thư mục con (cùng dữ liệu) | 1,14 ms | **0,04 ms** |
| Ghi DB khi scan (5.000 lệnh, `better-sqlite3`) | 3,5 ms/dòng (17,5 s) | WAL: 0,047 ms/dòng · WAL + lô: **0,0034 ms/dòng** (17 ms) |

Các script test và dữ liệu giả nằm ở thư mục tạm của phiên làm việc, **không nằm trong repo** (repo chưa có hạ tầng test, xem C2).

### 8.4 Chưa làm

- **PF14, phần gộp các tầng cache về React Query.** Phải viết lại khoảng 10 hook/component (`useRandomItems`, `useRecentItems`, `favoriteCache.js`…) nên dễ gây lỗi giao diện. Vấn đề chính của PF14 là dữ liệu cũ sau khi scan/xoá; vấn đề đó đã được giải bằng hàm xoá cache dùng chung (PF7).
- **P3** (mount theo key): đổi định dạng URL ảnh và thumbnail đang lưu trong DB, nằm ngoài lộ trình này. **P4** chưa kiểm tra lại.
- PF4: chưa dùng `LazyMotion` cho framer-motion, chưa gộp hai bộ icon. PF1: chưa có `PRAGMA optimize`.
- Asset cũ (tên có hash) trong `reader-dynamic` vẫn tích luỹ sau mỗi lần deploy, vì giới hạn 400 mục chỉ tính response API.

### 8.5 Phát hiện thêm khi test (chưa sửa)

- **B25**: chạy production với `PORT` khác 3000/3001 rồi mở bằng `http://localhost:<port>` thì **trang trắng**. Lý do: CORS chặn cả file JS của app, trả 500. Bản cũ cũng bị y như vậy. Với cổng mặc định 3000 hoặc khi mở bằng IP thì không gặp. Cách tránh đã ghi vào [readme](../readme.md#7-xử-lý-sự-cố).
- **C10**: `better-sqlite3@11.10.0` không cài được trên Node 24 (Windows) nếu thiếu Visual Studio Build Tools. Dùng Node 20/22, hoặc nâng lên `better-sqlite3@12.x` (đã chạy qua toàn bộ test E2E ở trên).
