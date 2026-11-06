# 🐞 BÁO CÁO ISSUES — MainWebSite

> **Ngày rà soát:** 2026-10-29 · **Commit:** `a511bcd` (nhánh `main`)
> **Phương pháp:** đọc toàn bộ backend, các module lõi của React app (store, api, service worker, offline, download queue, player, reader), đối chiếu từng lời gọi frontend với route backend. Mọi issue dưới đây đều có vị trí code cụ thể. Mục nào chưa chạy thử để xác nhận được ghi rõ là *"cần kiểm tra"*.
> **Liên quan:** [SYSTEM-REPORT.md](SYSTEM-REPORT.md) · [DEAD-CODE-REPORT.md](DEAD-CODE-REPORT.md)
> **Cập nhật 2026-11-04:** đã sửa **S1, S2, S3, S7** (kèm B17), rồi toàn bộ nhóm High còn lại **S4, S5, S6, D1, B1, B2, P1** (kèm B18), rồi nhóm dữ liệu **B12, B13, D2, D3, D4** trên branch `fix/security-path-traversal`, chưa merge vào `main`. Kiểm chứng bằng test chạy trên code thật (code cũ ở HEAD tái hiện được D1, code mới không); chưa chạy thử trên app thật. Helper chung: [backend/utils/pathSafety.js](../backend/utils/pathSafety.js). Thêm 3 issue tìm thấy khi rà hướng dẫn cài đặt và đã sửa luôn: **B24** (CORS khi mở bằng IP LAN), **C8** (build có thể ra bản development), **C9** (`allowedHosts` của Vite).

## Tổng quan

| Mức độ | Số lượng | Ý nghĩa |
|--------|---------:|---------|
| 🔴 Critical | 3 | Đọc được file bất kỳ / chèn SQL / vượt qua lớp chặn truy cập |
| 🟠 High | 8 | Mất dữ liệu, lộ mật khẩu, tính năng chính hỏng, server có thể crash/treo |
| 🟡 Medium | 25 | Tính năng phụ hỏng, sai dữ liệu, rủi ro hiệu năng, build/cấu hình sai |
| 🟢 Low | 21 | Cấu hình, độ bền, chất lượng code, docs |

Mã issue: **S** = bảo mật · **D** = mất/sai dữ liệu · **B** = bug chức năng · **P** = hiệu năng · **C** = cấu hình/tooling/docs · **M** = khả năng bảo trì.

---

## 🔴 Critical

### S1. Path traversal ở các endpoint stream/download → đọc được file bất kỳ ngoài thư mục media

- **Vị trí:** [backend/api/movie/video.js:33](../backend/api/movie/video.js#L33), [backend/api/music/audio.js:30](../backend/api/music/audio.js#L30), [backend/api/music/download.js:17](../backend/api/music/download.js#L17), [backend/api/media/media-cache.js:22](../backend/api/media/media-cache.js#L22)
- **Mô tả:** `path.join(rootPath, req.query.file)` không kiểm tra kết quả còn nằm trong `rootPath`. Ví dụ `GET /api/music/download?key=M_MUSIC&file=../../../<đường dẫn>` trả về bất kỳ file nào **trên cùng ổ đĩa** với thư mục gốc (trên Windows `path.join` không nhảy sang ổ khác; nếu repo nằm cùng ổ với thư mục media thì đọc được cả `backend/.env` chứa `SECURITY_PASSWORD`). `media-cache` có cùng lỗi qua tham số `:filename` (*cần kiểm tra* hành vi decode `%2F` của Express 5).
- **Ảnh hưởng:** ai vượt qua whitelist IP (xem S3 — rất dễ) đều đọc được file ngoài thư mục media với quyền của tiến trình Node.
- **Khắc phục:** tạo helper chung, ví dụ `resolveInsideRoot(rootPath, rel)` dùng `path.resolve` rồi kiểm tra `abs === root || abs.startsWith(root + path.sep)`; áp dụng cho mọi endpoint nhận đường dẫn (xem thêm S7).
- **Trạng thái:** ✅ Đã sửa (2026-11-04). `resolveInsideRoot` ghép path giống `path.join` (client hợp lệ không đổi), so sánh không phân biệt hoa/thường trên Windows, từ chối input không phải chuỗi (query lặp lại) và null byte. Path ra ngoài root → **403**. `media-cache` bị giới hạn trong `<root>/.thumbnail/`.

### S2. SQL injection ở `GET /api/media/media-folder`

- **Vị trí:** [backend/api/media/media-folder.js:68](../backend/api/media/media-folder.js#L68)
- **Mô tả:** `ORDER BY ${sortBy} ${order}` lấy thẳng từ query string. Kẻ tấn công có thể chèn biểu thức con (`sortBy=(CASE WHEN (SELECT …) THEN name ELSE path END)`) để dò dữ liệu, hoặc làm lỗi truy vấn.
- **Khắc phục:** whitelist `sortBy ∈ {date_taken, name, size, modified, createdAt}` và `order ∈ {ASC, DESC}`.
- **Trạng thái:** ✅ Đã sửa (2026-11-04). Whitelist `date_taken, name, size, modified, createdAt, type`. Giá trị lạ thì dùng mặc định `date_taken DESC`; `order` không phân biệt hoa/thường.

### S3. Vượt qua whitelist IP bằng header `X-Forwarded-For`

- **Vị trí:** [backend/middleware/auth.js:24](../backend/middleware/auth.js#L24)
- **Mô tả:** `clientIP = req.headers["x-forwarded-for"] || req.connection.remoteAddress`. Server listen trực tiếp `0.0.0.0` (không có reverse proxy), nên client chỉ cần gửi `X-Forwarded-For: 127.0.0.1` là được coi là IP hợp lệ.
- **Ảnh hưởng:** lớp bảo vệ chính (whitelist) vô hiệu; kết hợp S1 thành đọc file tuỳ ý từ bất kỳ máy nào kết nối được tới cổng.
- **Khắc phục:** dùng `req.socket.remoteAddress`; chỉ tin `X-Forwarded-For` khi cấu hình `app.set('trust proxy', …)` và dùng `req.ip`.
- **Trạng thái:** ✅ Đã sửa (2026-11-04). `auth.js` chỉ đọc `req.socket.remoteAddress`; `::1` được coi là `127.0.0.1`; không xác định được IP → 403 (trước đây crash). Lưu ý còn lại: ở dev mode mọi request qua Vite proxy (`:3001`) đều có IP `127.0.0.1` nên luôn qua whitelist. Từ trước tới giờ vẫn vậy, vì Vite không gửi `X-Forwarded-For`.

---

## 🟠 High

### S4. Static route không áp dụng bảo vệ `SECURITY`

- **Vị trí:** [backend/server.js:74-120](../backend/server.js#L74), [backend/middleware/security.js:13](../backend/middleware/security.js#L13)
- **Mô tả:** `security.js` chỉ yêu cầu token khi request có `key` thuộc `SECURITY`. Ảnh/video/nhạc được serve qua `/manga/<root>/…`, `/video/…`, `/audio/…`, `/media/…` **không có `key`** → nội dung của nguồn "bảo mật" (vd. `ROOT_MANGA`, `V_MOVIE`) tải được mà không cần mật khẩu nếu biết đường dẫn (tên thư mục thường đoán được).
- **Khắc phục:** mount static theo key (`/manga/:key/...`) và kiểm tra token, hoặc stream mọi nội dung bảo mật qua API có kiểm tra.
- **Trạng thái:** ✅ Đã sửa (2026-11-04), không đổi URL ảnh/video.
  - `/api/login` đặt cookie HttpOnly `ms_auth` (SameSite=Lax); `security.js` đặt lại cookie khi một request hợp lệ chưa có cookie.
  - [middleware/protectStatic.js](../backend/middleware/protectStatic.js) bọc `express.static` của nguồn thuộc `SECURITY`: chưa có cookie hợp lệ mà file thuộc nguồn đó → **401**; file của nguồn khác cùng mount vẫn phục vụ bình thường.
  - Vào lại trang chủ thì frontend gọi `POST /api/logout` để xoá cookie, khớp với việc trang chủ vốn xoá token.
  - Còn lại (không đổi so với trước): `<audio src="/api/music/audio?key=…">` và ảnh `/api/media/cache/…` của nguồn bảo mật vẫn bị 401 vì API không nhận cookie (cố ý, chống CSRF) và các thẻ này không gửi token — cùng nhóm với B6.

### S5. Mật khẩu được dùng làm token và bị lộ ở nhiều nơi

- **Vị trí:** [backend/routes/system.js:28](../backend/routes/system.js#L28), [react-app/src/pages/movie/MoviePlayer.jsx:163](../react-app/src/pages/movie/MoviePlayer.jsx#L163) và `:470`, [backend/middleware/index.js:30](../backend/middleware/index.js#L30)
- **Mô tả:** `/api/login` trả về `{ token: SECURITY_PASSWORD }`. Token = mật khẩu, lưu plaintext trong `localStorage` (2 nơi: `userToken` và `auth-storage`), gắn vào URL video (`&token=…`) → nằm trong lịch sử trình duyệt, log ExoPlayer/Android, log server. Rate limiter bị tắt và so sánh mật khẩu không constant-time → có thể brute-force `/api/login` không giới hạn.
- **Khắc phục:** sinh token ngẫu nhiên có hạn (HMAC/JWT) thay vì trả mật khẩu; rate-limit riêng cho `/api/login`; dùng `crypto.timingSafeEqual`.
- **Trạng thái:** ✅ Đã sửa (2026-11-04) — [utils/authToken.js](../backend/utils/authToken.js).
  - Token = `v1.` + HMAC-SHA256(secret, mật khẩu); secret ngẫu nhiên lưu ở `backend/data/.auth-secret` (gitignored, tự tạo) → không suy ra được mật khẩu, không đổi khi restart, mất hiệu lực khi đổi mật khẩu hoặc xoá file secret.
  - So sánh mật khẩu và token bằng `timingSafeEqual`. Sai 10 lần / 15 phút / IP → **429** (frontend báo "Nhập sai quá nhiều lần").
  - Token mới vẫn nằm trong localStorage và trong URL video (`&token=`, cần cho ExoPlayer), nhưng không còn là mật khẩu.
  - Đánh đổi: thiết bị đã đăng nhập trước bản này phải **đăng nhập lại một lần**; token không có hạn (hết hạn chỉ khi đổi mật khẩu), để không bắt người dùng đăng nhập lại định kỳ.

### S6. Tham số `dbkey` vs `key` khiến kiểm tra bảo mật bị bỏ qua

- **Vị trí:** [backend/middleware/security.js:13](../backend/middleware/security.js#L13); các endpoint dùng `dbkey`: [manga/delete-item.js:13](../backend/api/manga/delete-item.js#L13), [manga/favorite.js:12](../backend/api/manga/favorite.js#L12), [movie/favorite-movie.js:12](../backend/api/movie/favorite-movie.js#L12), [increase-view.js:17](../backend/api/increase-view.js#L17)
- **Mô tả:** middleware chỉ đọc `req.query.key || req.body.key`. Các endpoint nhận `dbkey` không bị kiểm tra → client chưa đăng nhập vẫn **xoá bản ghi DB** của `ROOT_MANGA` (`DELETE /api/manga/delete-item`) hoặc đổi favorite của nguồn bảo mật.
- **Khắc phục:** thống nhất một tên tham số (`key`), hoặc để middleware đọc cả `dbkey`.
- **Trạng thái:** ✅ Đã sửa (2026-11-04). `security.js` đọc cả `key` và `dbkey` ở query lẫn body, kể cả khi tham số bị lặp (mảng — trước đây gây lỗi 500). Không đổi tên tham số nên frontend không phải sửa.

### S7. Path traversal ở endpoint liệt kê/ghi file

- **Vị trí:** [backend/utils/folder-loader.js:27-28](../backend/utils/folder-loader.js#L27) (qua `folder-cache?mode=path`), [backend/api/manga/pdf.js:28-31](../backend/api/manga/pdf.js#L28), [backend/api/movie/set-thumbnail.js:23-34](../backend/api/movie/set-thumbnail.js#L23), [backend/api/music/set-thumbnail.js:23-34](../backend/api/music/set-thumbnail.js#L23), các `extract-thumbnail`
- **Mô tả:** `root`/`path`/`folderPath`/`srcPath` không được kiểm tra: liệt kê được cây thư mục ngoài root (`folder-cache`), đọc PDF ngoài root (`pdf.js` chỉ kiểm tra với chính `root` do client gửi), tạo thư mục `.thumbnail` và ghi file ảnh ra ngoài root (`folder-thumbnail`, `extract-thumbnail` gọi ffmpeg ghi file).
- **Khắc phục:** dùng chung helper của S1.
- **Trạng thái:** ✅ Đã sửa (2026-11-04).
  - `folder-loader` (cả 3 hàm): `root` và `path` ra ngoài thì trả danh sách rỗng.
  - `pdf.js`: kiểm tra cả `root` lẫn `path`.
  - `folder-thumbnail` và `playlist-thumbnail`: kiểm tra cả `srcPath` lẫn `folderPath` trước khi `mkdir`/`copyFile`.
  - `extract-thumbnail` (movie/music): kiểm tra một lần ở route, vì các lần đệ quy chỉ đi xuống tên lấy từ `readdir`.
  - Symlink nằm trong thư mục media vẫn được đi theo, việc tạo symlink là do chủ máy quyết định.

### D1. Scan *partial* + *shallow* xoá nhầm toàn bộ con trực tiếp của thư mục được scan

- **Vị trí:** [backend/utils/movie-scan.js:147](../backend/utils/movie-scan.js#L147) và `:104`, [backend/utils/music-scan.js:127](../backend/utils/music-scan.js#L127), [backend/utils/media-scan.js:182](../backend/utils/media-scan.js#L182)
- **Mô tả:** với `path = "A"`, `shallow = true`: phase 1 đặt `scanned = 0` cho `A` và các con trực tiếp `A/*`; vòng lặp gặp `A` → upsert `A` nhưng **không đệ quy** vì `shallow` → các con `A/*` không bao giờ được đánh dấu lại → phase 3 **xoá hết** chúng khỏi DB (mất favorite, viewCount, liên kết album; với music còn xoá `songs` nên playlist mất bài). Với music và scope lồng nhau (`A/B`), scanner thậm chí không đi tới được `A/B` vì thư mục cha cũng bị chặn đệ quy. Riêng movie, dòng 104 không truyền `shallow` khi đi xuống thư mục cha nên scope lồng nhau lại bị scan *deep* (không nhất quán).
- **Tái hiện:** Sidebar → Scan → nhập path + tick "shallow" ([ScanModal.jsx:181](../react-app/src/components/common/ScanModal.jsx#L181)).
- **Khắc phục:** khi `relPath === scopePath` thì vẫn đệ quy **một cấp** (chỉ xử lý con trực tiếp); với thư mục cha của scope luôn đi xuống; truyền `shallow` ở movie-scan dòng 104. Viết test cho 4 tổ hợp (full/partial × deep/shallow).
- **Trạng thái:** ✅ Đã sửa (2026-11-04) đúng như cách trên ở cả 3 scanner (music còn được đi qua thư mục cha của scope). Scan full và scan deep không đổi. Test: cây `A/{x/deep, y, B/{c, sub/d}}` — code cũ xoá nhầm 3 bản ghi khi shallow `A`; code mới không xoá gì, và khi xoá `A/B/c` trên ổ đĩa thì shallow `A/B` chỉ xoá đúng bản ghi đó. Ghi chú về shallow trong ScanModal đã đổi lại cho đúng.

### B1. Scan manga từ ScanModal luôn lỗi 400

- **Vị trí:** [react-app/src/components/common/DatabaseActions.jsx:149](../react-app/src/components/common/DatabaseActions.jsx#L149) ↔ [backend/api/manga/scan.js:12-15](../backend/api/manga/scan.js#L12)
- **Mô tả:** frontend gửi `{ dbkey, path, shallow }`, backend yêu cầu `{ root, key }` → `400 "Missing root or db"`. Backend manga cũng không hỗ trợ partial/shallow. (Luồng cũ `performScan` trong `utils/databaseOperations.js:79` gửi đúng `{ root, key }` nhưng nút Scan hiện tại đi qua ScanModal.)
- **Khắc phục:** gửi `{ key: sourceKey, root: rootFolder }`; ẩn ô path/shallow với manga cho tới khi backend hỗ trợ.
- **Trạng thái:** ✅ Đã sửa (2026-11-04). `DatabaseActions` gửi `{ key, root }` (báo lỗi rõ nếu chưa chọn root). `ScanModal` có prop `supportsPartial`: với manga thì ẩn ô path, shallow và ví dụ, thay bằng ghi chú "quét toàn bộ thư mục gốc đang chọn". `manga/scan` và `manga/reset-cache` kiểm tra thêm `root` không ra ngoài nguồn (403).

### B2. `mode=reset` của movie/music không `await` scan → trả kết quả rỗng, có thể làm sập server

- **Vị trí:** [backend/api/movie/reset-movie-db.js:28](../backend/api/movie/reset-movie-db.js#L28), [backend/api/music/reset-music-db.js:32](../backend/api/music/reset-music-db.js#L32)
- **Mô tả:** `scanXFolderToDB()` là async nhưng không được `await` → response trả `stats: {}` ngay khi DB vừa bị xoá trắng; scan chạy nền, nếu lỗi (vd. `EACCES` khi `readdirSync`) thì thành *unhandled rejection* → Node ≥15 mặc định **thoát tiến trình**.
- **Khắc phục:** `const stats = await …` và handler `async`.
- **Trạng thái:** ✅ Đã sửa (2026-11-04). Response trả về sau khi scan xong (frontend đã đặt `timeout: 0` cho reset nên không bị cắt ngang), lỗi scan thành response 500 thay vì làm sập server.

### P1. Đọc file đồng bộ vào RAM và scan manga đồng bộ chặn event loop

- **Vị trí:** [backend/api/movie/video.js:60-66](../backend/api/movie/video.js#L60), [backend/api/music/audio.js:49-55](../backend/api/music/audio.js#L49), [backend/utils/cache-scan.js](../backend/utils/cache-scan.js)
- **Mô tả:** video < 2GB (và ≤ 50%RAM/5) được `fs.readFileSync` toàn bộ vào RAM **trên luồng xử lý request**; mỗi cache LRU được phép tới 50% RAM (video + audio = tới 100% RAM). Trong lúc đọc file vài GB, mọi request khác bị treo. Scan manga (`scanFolderRecursive`) hoàn toàn đồng bộ, lại gọi `hasImageRecursively` lặp lại ở mỗi cấp (độ phức tạp ~O(n·depth)) → server không phản hồi suốt thời gian scan.
- **Khắc phục:** bỏ cache RAM cho video (OS page cache đã đủ), chỉ stream bằng `createReadStream`; chuyển cache-scan sang `fs.promises` hoặc worker thread.
- **Trạng thái:** ✅ Đã sửa (2026-11-04).
  - Video/audio: bỏ hẳn cache LRU, stream qua [utils/streamFile.js](../backend/utils/streamFile.js) bằng `stream.pipeline` (đóng file khi client ngắt, lỗi đọc file không làm crash). Header và mã trả về giữ nguyên; Range vượt cuối file nay được cắt về cuối file theo chuẩn thay vì 416. `lru-cache` không còn được dùng ở đâu.
  - Scan manga: viết lại bằng `fs.promises` + nhớ kết quả `hasImageRecursively` trong một lần scan (hết lặp O(n·depth)). Test so với code cũ ở HEAD: stats và mọi cột trong DB giống hệt. Thêm khoá theo `(key, root)` để hai lần scan/reset cùng root không chạy chồng lên nhau (bản sync trước đây tự tuần tự).
  - Đánh đổi: trong lúc *Reset DB Manga*, danh sách manga có thể hiện thiếu cho tới khi quét xong (trước đây cả server đứng chờ).

---

## 🟡 Medium

| ID | Vấn đề | Vị trí | Khắc phục đề xuất |
|----|--------|--------|-------------------|
| B3 | Nút "đặt thumbnail" trong MoviePlayer gọi `/api/movie/set-thumbnail` (không tồn tại) → 404, nhưng vẫn báo "✅ Đã đặt thumbnail" vì `fetch` không throw khi 404 | [MoviePlayer.jsx:264](../react-app/src/pages/movie/MoviePlayer.jsx#L264) | Gọi `/api/movie/folder-thumbnail` và kiểm tra `res.ok` |
| B4 | Nhiều method trong `apiService` trỏ sai endpoint (hiện chưa ai gọi nhưng là bẫy): `movie.setThumbnail`, `music.setThumbnail` (`/set-thumbnail` không tồn tại), `music.createPlaylist` (`/playlists` thay vì `/playlist`), `music.updatePlaylist` (không có route), `music.deletePlaylist` (sai shape), `media.getStats` (`/media-stats` thay vì `/stats`) | [utils/api.js:171,198-203,233](../react-app/src/utils/api.js#L171) | Sửa hoặc xoá (xem DEAD-CODE-REPORT) |
| B5 | `deleteItem` của movie/music store đọc `result.type`/`result.message` trên **axios response** (phải là `result.data.*`) → toast hiện "undefined", item con của folder không bị gỡ khỏi danh sách | [store/index.js:788,803,1013,1021](../react-app/src/store/index.js#L788) | ✅ *Đã sửa 2026-11-04 (thay đổi chưa commit của phiên làm UI-CONSISTENCY): đọc `result.data`* |
| B6 | ~30 lời gọi `fetch()` trực tiếp không gắn `x-secure-token` → với nguồn bảo mật: hàng đợi tải chapter thất bại 401, đếm view movie/music thất bại âm thầm, thao tác playlist lỗi nếu `M_*` được bảo vệ | [downloadWorker.js:343](../react-app/src/workers/downloadWorker.js#L343), [UniversalCard.jsx:143](../react-app/src/components/common/UniversalCard.jsx#L143), MusicPlayer/PlaylistModal | Dùng `apiService` (axios) hoặc helper `fetchWithAuth` |
| B7 | Khi thêm chapter vào hàng đợi, MangaReader gọi thêm `POST /api/increase-view` với payload `{ source, mangaPath }` sai hoàn toàn → luôn 400 | [MangaReader.jsx:1311-1317](../react-app/src/pages/manga/MangaReader.jsx#L1311) | Xoá lời gọi này (view đã được đếm ở dòng 176) |
| B8 | Thumbnail thư mục Media không hiển thị: scanner chỉ lưu **tên file** trong `.thumbnail/` nhưng UI ghép `/media/<folder>/<file>` (thiếu `.thumbnail/`), không encode URL | [media-scan.js:191-196](../backend/utils/media-scan.js#L191), [MediaHome.jsx:348](../react-app/src/pages/media/MediaHome.jsx#L348) | Lưu `".thumbnail/<file>"` như các loại khác, encode từng segment |
| B9 | Extract thumbnail movie cho thư mục chỉ chứa thư mục con → `copyFileSync` vào `.thumbnail` chưa tồn tại → ENOENT → cả request 500 (bản music có `mkdirSync`, bản movie thì không) | [extract-movie-thumbnail.js:75-78](../backend/api/movie/extract-movie-thumbnail.js#L75) | `fs.mkdirSync(thumbDir, { recursive: true })` |
| B10 | ✅ *Đã sửa 2026-11-05: trả `400 Invalid mode`.* `GET /api/movie/video-cache` với `mode` không hợp lệ không trả response → request treo tới timeout | [video-cache.js:71-127](../backend/api/movie/video-cache.js#L71) | Thêm `return res.status(400)…` cuối handler |
| B11 | ✅ *Đã sửa 2026-11-05: `mode=top` lọc `v.root` (dùng khoá chính thay vì quét toàn bảng `views`); `POST /favorite` nhận `root` (frontend đã gửi), client cũ không gửi `root` vẫn chạy như trước.* Favorite manga cập nhật `WHERE path = ?` không lọc `root` → đổi favorite cùng path ở root khác; `mode=top` join `views` không so `v.root` | [manga/favorite.js:30](../backend/api/manga/favorite.js#L30), [folder-cache.js:63](../backend/api/manga/folder-cache.js#L63) | Thêm điều kiện `root` |
| B12 | ✅ *Đã sửa 2026-11-04: `getMusicDB` có map riêng `dbMusicMap`.* `getDB` và `getMusicDB` dùng **chung** map cache `dbMap` → tuỳ thứ tự gọi, một key music có thể nhận connection với schema manga (thiếu migration `songs/playlists`) hoặc ngược lại | [utils/db.js:23,134](../backend/utils/db.js#L23) | Tách map riêng như `dbMovieMap`/`dbMediaMap` |
| B13 | ✅ *Đã sửa 2026-11-04: helper [utils/sqlLike.js](../backend/utils/sqlLike.js) + `ESCAPE '\'` cho mọi so khớp tiền tố đường dẫn trong 3 scanner, 4 `delete-item`, `movie-folder`, `music-folder`, `folder-loader`. Test: code cũ quét path `Vol_1` xoá nhầm 4 bản ghi của `Vol-1`/`VolX1`, code mới chỉ xoá đúng bản ghi cần xoá. Ô tìm kiếm theo tên (`name LIKE '%…%'`) chưa escape — chỉ ảnh hưởng kết quả tìm, không ảnh hưởng dữ liệu.* Pattern `LIKE '${path}/%'` không escape `_` và `%` → xoá/sweep nhầm thư mục tên gần giống (`Vol_1/%` khớp cả `Vol-1/…`) | `*/delete-item.js`, `*-scan.js`, `movie-folder.js`, `music-folder.js`, `folder-loader.js` | Escape + `ESCAPE '\'` (đã làm đúng ở `media-folders.js`) hoặc so `substr(path,1,len)` |
| B14 | ✅ *Đã sửa 2026-11-05 (PERFORMANCE-CACHE-REPORT mục 8): chỉ nhận thumbnail trong `.thumbnail/`, kiểm tra trước `isMangaImage`.* Cache thumbnail của SW gần như không bao giờ chạy: `isMangaImage` bắt mọi `destination === 'image'` trước, và `isThumbnailRequest` so `/movie/`, `/music/` trong khi URL thật là `/video/`, `/audio/` | [sw.js:508,517](../react-app/public/sw.js#L508) | Sắp lại thứ tự kiểm tra, sửa pattern |
| B15 | ✅ *Đã sửa 2026-11-05 (PERFORMANCE-CACHE-REPORT PF2, mục 8): ghi cache ở nền; download/audio/video và request có Range không đi qua SW (bản sao cũ được xoá khi SW mới kích hoạt); giữ tối đa 400 response API mới nhất (thay cho allowlist, để không mất dữ liệu offline); quá 5 s mà có cache thì trả cache, chưa có cache thì chờ mạng thay vì 503.* SW cache **mọi** GET `/api/*` trả 200 vào `reader-dynamic` (không giới hạn, không dọn), kể cả file nhạc tải qua `/api/music/download` (nhân đôi dung lượng); timeout 5s trả 503 cho API chậm nhưng vẫn sống (vd. `folder-cache` đọc từ đĩa) | [sw.js:238-279,501](../react-app/public/sw.js#L238) | Allowlist endpoint cần offline; loại trừ stream/download; bỏ timeout cho request online |
| D2 | ✅ *Đã sửa 2026-11-04: `mode=reset` của music giữ `playlists` + `playlist_items` (nối theo `songPath` nên vẫn khớp sau khi quét lại; bài không còn trên ổ đĩa tự bị bỏ qua khi xem playlist). `mode=delete` vẫn xoá cả playlist như cảnh báo trên UI; các câu cảnh báo ở Sidebar và Settings đã sửa cho khớp. Media: "Xoá DB Media" vốn đã cảnh báo mất album/yêu thích — giữ nguyên.* "Reset cache" music xoá luôn **playlist** người dùng tạo; reset media xoá **album** | [reset-music-db.js:22,30](../backend/api/music/reset-music-db.js#L22), [reset-media-db.js:20](../backend/api/media/reset-media-db.js#L20) | Giữ playlists/albums hoặc cảnh báo rõ ở UI |
| D3 | ✅ *Đã sửa 2026-11-04 ở cả tải trực tiếp (`offlineLibrary.downloadChapter`) lẫn hàng đợi (`downloadWorker`): thiếu trang thì không lưu, báo `Tải thiếu N/M trang`, hàng đợi tự retry rồi chuyển `failed`; dọn các trang lẻ vừa cache, trừ khi chapter đã có bản đầy đủ từ trước.* Tải chapter offline vẫn lưu như "hoàn tất" khi có trang tải lỗi → đọc offline thiếu trang mà không báo | [offlineLibrary.js:426-437](../react-app/src/utils/offlineLibrary.js#L426) | Ghi `failedPages`, đánh dấu chưa hoàn tất / cho retry |
| D4 | ✅ *Đã sửa 2026-11-04: task đã kết thúc không lưu `pageUrls`, chỉ giữ 200 task kết thúc gần nhất, bỏ `abortController` (trước đây thành `{}` rồi `.abort()` lỗi khi load lại); storage riêng bắt `QuotaExceededError` và khi đầy thì chỉ lưu task chưa xong.* `download-queue-storage` lưu **tất cả** task (kể cả đã xong, kèm mảng `pageUrls`) vào localStorage, không giới hạn; cả app không xử lý `QuotaExceededError` | [downloadQueueStore.js:656](../react-app/src/store/downloadQueueStore.js#L656) | Không persist `pageUrls` của task completed; giới hạn lịch sử |
| S8 | CORS chấp nhận **mọi** origin `*.ts.net` kèm `credentials: true` → trang của người khác trên Tailscale Funnel (cũng là `*.ts.net`) có thể đọc API thông qua trình duyệt người dùng (IP người dùng nằm trong whitelist) | [cors.js:88,109](../backend/middleware/cors.js#L88) | Chỉ cho phép đúng domain thiết bị của mình |
| S9 | `express.static` với `dotfiles: "allow"` trên mọi thư mục media → lộ `.env`, `.git`… nếu chúng nằm trong thư mục media | [server.js:79,90,101,112](../backend/server.js#L79) | `dotfiles: "ignore"`, chỉ cho phép `.thumbnail` |
| S10 | Endpoint nhận `key` tuỳ ý rồi gọi `getMovieDB/getMusicDB/getMediaDB(key)` mà không kiểm tra key có trong `.env` → tạo file `.db` rác trong `backend/data/` theo yêu cầu client | `movie-folder.js`, `music-folder.js`, `playlist.js`, `album-manager.js`, `increase-view.js`… | Validate bằng `getRootPath(key)` trong một middleware chung |
| P2 | ✅ *Đã sửa 2026-11-05: cache theo IP (cho phép 5', chặn 1', lỗi DNS không nhớ), request đến cùng lúc dùng chung một lần tra.* Reverse DNS cho **mỗi** request không thuộc whitelist IP, không cache → mỗi ảnh manga từ client Tailscale là một lần tra DNS | [auth.js:36](../backend/middleware/auth.js#L36) | Cache kết quả theo IP (TTL vài phút) |
| P3 | Nhiều nguồn cùng loại mount chung một đường dẫn tĩnh (`/video`, `/audio`, `/media`, `/manga`) → file trùng đường dẫn tương đối giữa hai nguồn bị "đè", URL không mang key | [server.js:74-120](../backend/server.js#L74) | Mount `/<type>/<KEY>/…` |
| P4 | Mỗi thao tác IndexedDB mở một connection mới và không bao giờ `close()` | [offlineLibrary.js:52-81](../react-app/src/utils/offlineLibrary.js#L52) | Cache một connection, xử lý `onversionchange` |
| B24 | Mở app bằng **IP LAN** (VD `http://192.168.1.10:3000`): mọi request POST/PUT/DELETE (đăng nhập, scan, yêu thích…) bị CORS chặn. Trình duyệt luôn gửi header `Origin` với các request này kể cả khi cùng origin, còn `cors.js` coi "không có Origin" mới là cùng origin và chỉ chấp nhận `CORS_DEV_CONFIG` + `*.ts.net`. Xem/duyệt (GET) vẫn chạy nên lỗi khó nhận ra (*chưa chạy thử trên thiết bị*) | [cors.js:71-118](../backend/middleware/cors.js#L71) | ✅ *Đã sửa 2026-11-04:* chấp nhận origin là **IP** trùng header `Host` (production); ở dev chấp nhận mọi origin là IP nội bộ (10/8, 172.16/12, 192.168/16, 127/8, 169.254/16, 100.64/10, `::1`, `fc00::/7`, `fe80::/10`) vì Vite proxy đổi `Host`. Domain lạ trùng `Host` vẫn bị chặn (chống DNS rebinding). Đã test 20 trường hợp với `cors` được stub |
| C8 | Bản build React có thể là **development**: (1) template cũ đặt `NODE_ENV=development` trong `react-app/.env`, và Vite 4.5 áp giá trị này cho cả `vite build` (`isProduction = false`); (2) `build:prod` chạy `set NODE_ENV=production && vite build` trên Windows → `NODE_ENV` có dấu cách cuối (`"production "`), Vite cũng không coi là production. Kiểm tra: tìm chuỗi `should have a unique "key" prop` trong `react-app/dist/assets/*.js` — có nghĩa là bản dev (*cần kiểm tra*) | [react-app/package.json:10](../react-app/package.json#L10), `react-app/.env` | ✅ *Đã sửa 2026-11-04:* template bỏ `NODE_ENV`; `build:prod` dùng `set "NODE_ENV=production"` (đã thử trong cmd: ra đúng `"production"`, bản cũ ra `"production "`). Nếu `.env` đang dùng còn dòng `NODE_ENV`, nên xoá |
| C9 | `allowedHosts` trong `vite.config.js` dùng RegExp `/.*\.ts\.net$/`, nhưng Vite 4.5 chỉ so khớp chuỗi → mở dev server bằng domain Tailscale bị chặn *"Blocked request. This host is not allowed"*, trừ khi domain nằm trong `VITE_HMR_HOST`/`VITE_ALLOWED_HOSTS`. Comment trong file ghi ngược lại | [vite.config.js:53-60](../react-app/vite.config.js#L53) | ✅ *Đã sửa 2026-11-04:* thay RegExp bằng chuỗi `'.ts.net'` (dấu chấm đầu = mọi subdomain) |

---

## 🟢 Low

| ID | Vấn đề | Vị trí |
|----|--------|--------|
| B16 | `sendLog()` gọi `apiService.log.send` nhưng `apiService` không có `log` → luôn lỗi (bị nuốt bằng `console.warn`); endpoint `/api/log` do đó không được dùng | [utils/logger.js:5](../react-app/src/utils/logger.js#L5) |
| B17 | `getRootPath(undefined)` ném TypeError trước khi validate → 500 thay vì 400 (`list-roots`, `video`, `audio`, `download`, `reset-cache/all`…). ✅ *Đã sửa 2026-11-04: `getRootPath` trả `undefined` khi key không phải chuỗi* | [routes/system.js:55](../backend/routes/system.js#L55), [config.js:45](../backend/utils/config.js#L45) |
| B18 | ✅ *Đã sửa 2026-11-04 cùng P1 (`utils/streamFile.js`).* Parse header Range không hỗ trợ dạng suffix `bytes=-500` → `NaN` trong `Content-Range` | `video.js:77-81`, `audio.js:65-69` |
| B19 | MIME thiếu: `audio.js` không có m4a/aac/opus, `video.js` không có mov/m4v (dù scanner index các đuôi này) | `audio.js:40-43`, `video.js:44-49` |
| B20 | ✅ *Đã sửa 2026-11-05: `INSERT … ON CONFLICT(path) DO UPDATE`, giữ lyrics đã có nếu file không có lyrics nhúng.* Scan music dùng `INSERT INTO songs` (không `OR REPLACE`) → nếu còn bản ghi `songs` mồ côi, lỗi UNIQUE làm dừng cả scan | [music-scan.js:196-201](../backend/utils/music-scan.js#L196) |
| B21 | `react-hot-toast` không hỗ trợ option `action` → nút "Xem tiến trình" không hiển thị | [MangaReader.jsx:1270,1303](../react-app/src/pages/manga/MangaReader.jsx#L1270) |
| B22 | `MusicPlayerRouter` tính `isMobile` mỗi lần render, không theo dõi resize | [App.jsx:32-40](../react-app/src/App.jsx#L32) |
| B25 | Chạy **production** với `PORT` khác 3000/3001 rồi mở bằng `http://localhost:<port>` → trang trắng: script `type="module"` gửi header `Origin`, CORS ở production chỉ chấp nhận origin trong `CORS_DEV_CONFIG`/mặc định (`localhost:3000,3001`) hoặc IP trùng `Host` (B24), nên trả 500 cho chính file JS của app. Mở bằng IP hoặc cổng mặc định thì không bị (đã thử trên git HEAD, 2026-11-05) | [cors.js](../backend/middleware/cors.js) | Thêm `localhost:<port>` vào `CORS_DEV_CONFIG`; hoặc cho phép origin trùng `Host` cả với `localhost` |
| B23 | Store có field "ma": `useMusicStore.setCurrentMusic` set `currentMusic` không khai báo; `manga-storage` persist `recentViewed` không tồn tại | [store/index.js:488,861](../react-app/src/store/index.js#L488) |
| S11 | `/api/log` không giới hạn kích thước/tần suất → spam log server | [api/log.js](../backend/api/log.js) |
| S12 | HSTS được gửi cả khi chạy HTTP; `X-XSS-Protection` đã lỗi thời | [server.js:26-38](../backend/server.js#L26) |
| C1 | Thiếu `backend/.env` → crash lúc require (`readFileSync` không try/catch). `.env.template` thiếu ví dụ `MEDIA_*`; `VITE_MIN_STORAGE_SPACE=10 #gb` nhưng code hiểu là **MB**; `VITE_ALLOWED_HOSTS=ALLOWED_IPS` là placeholder dễ hiểu nhầm. ✅ *Hai template đã viết lại 2026-11-04; crash khi thiếu `.env` vẫn còn* | [config.js:8](../backend/utils/config.js#L8), [auth.js:9](../backend/middleware/auth.js#L9), [storageQuota.js:36](../react-app/src/utils/storageQuota.js#L36) |
| C2 | `npm run lint` không chạy được: repo không có file cấu hình ESLint. Không có test, không có CI | `react-app/package.json` |
| C3 | Script phụ thuộc Windows: `build:prod` dùng `set NODE_ENV=…`, `clean` dùng `rmdir /s /q`, `check:build` dùng `if exist`. *Một phần: `build:prod` / `npm run prod` đã chạy được trên mọi OS (2026-11-04); `clean`, `check:build` vẫn chỉ Windows* | `package.json` các workspace |
| C4 | `server.https: true` trong Vite mà không có chứng chỉ/plugin `@vitejs/plugin-basic-ssl` (*cần kiểm tra*). Điều kiện bật là `VITE_ENABLE_HTTPS=true` **hoặc** `NODE_ENV=production` — `vite preview` mặc định `NODE_ENV=production` và `preview.https` kế thừa `server.https`, nên `npm run preview` cũng bị ảnh hưởng | [vite.config.js:71](../react-app/vite.config.js#L71) |
| C5 | Manifest PWA chỉ có `favicon.ico` 64px (Chrome cần icon PNG 192 & 512 để cài đặt); `index.html` khai báo `type="image/svg+xml"` cho file `.ico` | `public/manifest.webmanifest`, `index.html` |
| C6 | Phiên bản không đồng nhất: root/react `5.0.10`, backend `5.0.0`, `/api/health` trả `1.0.0` | [api/health.js:22](../backend/api/health.js#L22) |
| C10 | `better-sqlite3@11.10.0` (đang khoá trong lock) không có bản build sẵn cho **Node 24** trên Windows → `npm install` phải tự biên dịch, lỗi nếu thiếu Visual Studio Build Tools (đã gặp 2026-11-05 với Node 24.20). `better-sqlite3@12.x` có bản build sẵn và đã chạy qua toàn bộ test E2E | `backend/package.json` | Dùng Node 20/22, hoặc nâng `better-sqlite3` lên 12.x |
| C7 | `CHANGELOG.md` ghi "scope-aware thumbnail extraction (scopePath/shallow)" nhưng backend `extract-thumbnail` bỏ qua `shallow`/scope; mục này ghi ngày `2024-12-14` (nhiều khả năng là 2025-12-14) | `CHANGELOG.md` mục Unreleased |
| M1 | Component quá lớn: `MangaReader.jsx` 2.318 dòng, `Settings.jsx` 1.848, `MusicPlayer.jsx` 1.377; `MusicPlayer` và `MusicPlayerV2` trùng phần lớn logic | `react-app/src/pages/**` |
| M2 | Logic trùng lặp: `findThumbnail` ×4 (movie/music/media-scan, thumbnailUtils), `getVideoDuration` ×2, `checkCorsSupport` + tải ảnh ×2 (`offlineLibrary` và `downloadWorker`), build URL thumbnail movie ×2 trong store, `folder-thumbnail` movie/music gần như y hệt, `/api/list-roots` khai báo 2 lần | xem DEAD-CODE-REPORT |
| M3 | 🟡 *Một phần 2026-11-05: bản build bỏ `console.log/debug/info`, SW tắt log mặc định (`SW_DEBUG`).* 521 lời gọi `console.*` trong frontend (285 `console.log`), CORS log **mỗi request** ở dev; không có logger có cấp độ | toàn repo |
| M4 | `/api/source-keys.js` trả JavaScript rồi `Home.jsx` bóc bằng regex + `JSON.parse` — nên trả JSON | [Home.jsx:60-90](../react-app/src/pages/Home.jsx#L60) |

---

## Lộ trình khắc phục đề xuất

| Giai đoạn | Nội dung | Issue |
|-----------|----------|-------|
| **0 — Hotfix bảo mật** (ưu tiên ngay) | Helper `resolveInsideRoot` cho mọi endpoint nhận path; whitelist ORDER BY; bỏ tin `X-Forwarded-For`; thống nhất `key`; token ngẫu nhiên + rate-limit login; thu hẹp CORS; `dotfiles: ignore` | S1–S10 (✅ S1–S7 đã xong) |
| **1 — Toàn vẹn dữ liệu** | Sửa logic shallow/partial + test; `await` reset; tách `dbMap`; escape LIKE; giữ playlist/album khi reset | D1–D4, B2, B12, B13 (✅ tất cả) |
| **2 — Tính năng hỏng** | Scan manga, set thumbnail movie, deleteItem toast, fetch có token, media folder thumbnail, extract thumbnail movie, video-cache treo | B1, B3–B11, B14–B16 (✅ B1, B5) |
| **3 — Hiệu năng** | Bỏ `readFileSync` cho media, scan manga async, cache reverse DNS, SW allowlist. Chi tiết hơn: [PERFORMANCE-CACHE-REPORT.md](PERFORMANCE-CACHE-REPORT.md) | P1–P4, B15 (✅ P1, P2, B15; còn P3, P4) |
| **4 — Dọn dẹp** | Xoá dead code, thêm ESLint + vài test scanner + CI, tách component lớn, logger có cấp độ | M1–M4, C1–C7, DEAD-CODE-REPORT |
