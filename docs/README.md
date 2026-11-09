# 📚 Mục lục tài liệu — MainWebSite

> Cập nhật 2026-11-09 (sau khi PR #123 đã merge vào `main`). Mỗi tài liệu được gắn trạng thái sau khi đối chiếu với code. **Cài đặt lần đầu: đọc [../readme.md](../readme.md).**
>
> ✅ **Hiện hành** — khớp với code · ⚠️ **Lỗi thời một phần** — có banner ghi rõ phần sai · 📜 **Lịch sử** — ghi lại một đợt làm việc đã xong · 📋 **Đề xuất** — kế hoạch chưa thực hiện

## Bắt đầu từ đây

| Tài liệu | Trạng thái | Nội dung |
|----------|-----------|----------|
| [../readme.md](../readme.md) | ✅ | **Hướng dẫn cài đặt** (viết lại 2026-11-04): yêu cầu (Node 20/≥22), cài nhanh 5 bước, giải thích từng biến `.env`, cho thiết bị khác truy cập, dev/prod, quét dữ liệu lần đầu, Tailscale + HTTPS, chứng chỉ Android, bảng xử lý sự cố |
| [AUDIT-2026-11-09.md](AUDIT-2026-11-09.md) | ✅ | **Rà soát mới nhất** (sau PR #123): chạy app thật (production) với dữ liệu giả và thư viện 27.000 file; 7 lỗi mới R1–R7 (nặng nhất: F5 ở trang Manga/Media ra 404 hoặc trang cũ hỏng; ảnh Media có `#` không hiện), 7 vấn đề hiệu năng mới PF19–PF25 (ảnh bìa là ảnh gốc, quét Media gọi ffprobe cho mỗi ảnh), số đo hiệu năng, trạng thái mọi mục cũ còn mở, thứ tự sửa đề xuất — **đã sửa R1–R5 và PF20** (mục 8: bug hay cố ý, đã đổi gì, kiểm chứng trên app thật, đánh đổi) |
| [SYSTEM-REPORT.md](SYSTEM-REPORT.md) | ✅ | Báo cáo tổng quan toàn hệ thống: kiến trúc, backend, DB, scanner, **danh mục API đầy đủ**, React app, offline, build |
| [ISSUES-REPORT.md](ISSUES-REPORT.md) | ✅ | 57 issue phân theo mức độ (3 critical, 8 high) kèm vị trí code và lộ trình sửa — đã sửa toàn bộ Critical + High (S1–S7, D1, B1, B2, P1), nhóm dữ liệu (B12, B13, D2, D3, D4) cùng B5, B17, B18, B24, C8, C9 — 2026-11-04 (PR #122); B3, B7–B10, S8, S9 — 2026-11-08 |
| [PERFORMANCE-CACHE-REPORT.md](PERFORMANCE-CACHE-REPORT.md) | ✅ | Audit cache & hiệu năng (2026-11-05): bản đồ 6 tầng cache, số đo bundle (1 MB JS, 288 kB gzip) và SQLite (WAL nhanh ~68×), 18 issue mới PF1–PF18 + đối chiếu P2/B10/B11/B14/B15 còn tồn, lộ trình 4 bước — **đã sửa và test cả 4 bước** (mục 7–8: bug hay cố ý, đánh đổi, kết quả test cũ/mới; còn P3, P4 và phần gộp tầng cache của PF14). Đo lại với thư viện lớn và PF19–PF25: [AUDIT-2026-11-09.md](AUDIT-2026-11-09.md) |
| [DEAD-CODE-REPORT.md](DEAD-CODE-REPORT.md) | ✅ | ~6.700 dòng code không dùng, cách dọn an toàn |
| [UI-CONSISTENCY-REPORT.md](UI-CONSISTENCY-REPORT.md) | ✅ | So sánh UI/UX và logic giữa Manga · Movie · Music · Media, 11 bug do lệch nhau (U1–U11; còn U5, U7 là chủ ý của tác giả), khung chung đã làm 2026-11-05 |
| [MUSIC-UX-REVIEW.md](MUSIC-UX-REVIEW.md) | ✅ | Đánh giá Music Player v1 (Spotify) & v2 (Zing): mobile, kéo-thả, thanh tua, trạng thái tải, 14 lỗi (M1–M14), lộ trình P0–P2 — nhóm P0 và P1 (trình phát toàn cục, mini-player, Media Session, SeekBar, skeleton) đã làm và kiểm tra lại (2026-11-04) |
| [CARD-REDESIGN-PROPOSAL.md](CARD-REDESIGN-PROPOSAL.md) | ✅ | Thiết kế lại card 4 loại và bố cục trang duyệt: tỉ lệ ảnh, lưới, tên 2 dòng, badge, thao tác, skeleton, ảnh lỗi, dark mode — **đã làm hết P1–P6** (2026-11-05): một `ItemCard` cho mọi loại, khung `BrowseLayout` + `useFolderBrowser` dùng chung cho Manga/Movie/Music (thanh công cụ dính, trang lưu trên URL), một bảng màu slate, Media/Album/Playlist/Yêu thích dùng chung card và lưới. Bản xem: [CARD-REDESIGN-PREVIEW.html](CARD-REDESIGN-PREVIEW.html) |

## Backend & dữ liệu (`docs/`)

| Tài liệu | Trạng thái | Ghi chú |
|----------|-----------|---------|
| [BACKEND-ANALYSIS.md](BACKEND-ANALYSIS.md) | ✅ | Đã cập nhật cây thư mục, API, cấu hình, lớp bảo mật |
| [DATABASE-SCAN-ANALYSIS.md](DATABASE-SCAN-ANALYSIS.md) | ⚠️ | Viết trước khi có media scanner và tuỳ chọn `shallow` |
| [PARTIAL-SCAN-SUMMARY.md](PARTIAL-SCAN-SUMMARY.md) | ⚠️ | Viết trước khi có `shallow` — banner đầu file mô tả hành vi hiện tại |
| [Scan-music.md](Scan-music.md) | 📜 | Phân tích luồng scan music 12/2025 |
| [MEDIA-GALLERY.md](MEDIA-GALLERY.md) | ✅ | Tài liệu chính của Media Gallery: API, schema, route, định dạng file (đối chiếu lại 2026-11-04) |
| [MEDIA-GALLERY-QUICKSTART.md](MEDIA-GALLERY-QUICKSTART.md) | ✅ | Viết lại 2026-11-04: khai báo nguồn, thumbnail, quét, các chế độ xem, thao tác, xử lý sự cố |
| [MEDIA-GALLERY-SUMMARY.md](MEDIA-GALLERY-SUMMARY.md) | 📜 | Tổng kết lúc hoàn thành 11/2025 |
| [MEDIA-IMPLEMENTATION-SUMMARY.md](MEDIA-IMPLEMENTATION-SUMMARY.md) | 📜 | Danh sách file tạo lúc triển khai 11/2025 |
| [FRONTEND_V2-ANALYSIS.md](FRONTEND_V2-ANALYSIS.md) | ⚠️ | Phân tích React app 09/2025 — thiếu media, downloads, PDF |
| [FRONTEND_V1-ANALYSIS.md](FRONTEND_V1-ANALYSIS.md) | 📜 | Frontend legacy |

## React app (`react-app/docs/`)

| Tài liệu | Trạng thái | Ghi chú |
|----------|-----------|---------|
| [README.md](../react-app/docs/README.md) | ✅ | Tính năng, cấu trúc, env (đã sửa `VITE_ALLOWED_HOSTS`, cảnh báo `NODE_ENV`), scripts, auth, offline |
| [OFFLINE-GUIDE.md](../react-app/docs/OFFLINE-GUIDE.md) | ✅ | Đã bổ sung download queue, `media-thumbnails-v1` |
| [SERVICE-WORKER-ANALYSIS.md](../react-app/docs/SERVICE-WORKER-ANALYSIS.md) | ✅ | Cập nhật lên v3.1.0, ghi rõ vấn đề B14/B15 |
| [STORAGE-QUOTA-MANAGEMENT.md](../react-app/docs/STORAGE-QUOTA-MANAGEMENT.md) | ✅ | Ngưỡng 50MB desktop / 25MB mobile |
| [PLAYLIST-SIDEBAR-RESPONSIVE.md](../react-app/docs/PLAYLIST-SIDEBAR-RESPONSIVE.md) | ✅ | Playlist sidebar responsive (10/2025) |
| [ARCHITECTURE.md](../react-app/docs/ARCHITECTURE.md) | ⚠️ | Thiết kế 09/2025 — đầu file có bảng đối chiếu từng mục với code (lazy, ProtectedRoute, retry, virtual scrolling, test **không** có trong code) |
| [DATA_FLOW.md](../react-app/docs/DATA_FLOW.md) | ⚠️ | Nhiều đoạn code chỉ là minh hoạ — đầu file có bảng đối chiếu (`getCacheKey`, `optimisticUpdate`, `useVirtualizedData` không tồn tại) |
| [Download queue/](../react-app/docs/Download%20queue/) (3 file) | 📜 | Kế hoạch, mockup, performance fixes của download queue |
| [refactor/](../react-app/refactor/) (4 file) | 📋 | Đề xuất refactor 10/2025, chưa thực hiện |

## Frontend legacy (`frontend/docs/`)

6 tài liệu về đợt migrate constants 07/2025 của frontend vanilla JS — 📜 lịch sử, không áp dụng cho React app.

## Khác

- [`../CHANGELOG.md`](../CHANGELOG.md) — nhật ký thay đổi chi tiết (ISSUES C7: mục scope/shallow cho extract thumbnail đã được ghi chú là backend chưa hỗ trợ).
- `.github/prompts/`, `.github/instructions/`, `Promt.md` — prompt/hướng dẫn cho trợ lý AI, không phải tài liệu sản phẩm.
