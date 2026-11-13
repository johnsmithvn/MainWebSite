# 📚 Mục lục tài liệu — MainWebSite

> **Cập nhật:** 2026-11-13. Toàn bộ tài liệu đã được rà soát và đối chiếu với mã nguồn thực tế.  
> **Tài liệu cài đặt & sử dụng lần đầu: đọc [../readme.md](../readme.md).**
>
> 🏷️ **Quy ước trạng thái:**  
> ✅ **Hiện hành** — Khớp với code thực tế, tài liệu tham khảo chính.  
> ⚠️ **Lỗi thời một phần** — Có thông tin lệch so với code mới (có banner cảnh báo cụ thể ở đầu file).  
> 📦 **Lưu trữ (Archive)** — Bản ghi lịch sử, sprint cũ đã hoàn thành, hoặc đề xuất chưa thực hiện.

---

## 🌟 1. Tài liệu kiến trúc & hệ thống chính (Nên đọc)

| Tài liệu | Trạng thái | Nội dung tóm tắt |
|----------|:----------:|------------------|
| [../readme.md](../readme.md) | ✅ | **Hướng dẫn cài đặt & vận hành**: Yêu cầu môi trường, cài nhanh 5 bước, cấu hình `.env`, Tailscale + HTTPS, xử lý sự cố. |
| [SYSTEM-REPORT.md](SYSTEM-REPORT.md) | ✅ | **Báo cáo tổng quan toàn hệ thống (Single Source of Truth)**: Kiến trúc tổng thể, Express backend, SQLite WAL, Scanners, danh mục API đầy đủ, React app, Offline PWA. |
| [ISSUES-REPORT.md](ISSUES-REPORT.md) | ✅ | Bảng theo dõi 57 issue (Critical, High, Medium, Low) kèm vị trí code cụ thể và lộ trình sửa đổi. Đã cập nhật các đợt fix bảo mật (S1–S9, D1–D4, B1–B10, P1, C8, C9). |
| [PERFORMANCE-CACHE-REPORT.md](PERFORMANCE-CACHE-REPORT.md) | ✅ | Báo cáo kiểm toán cache & hiệu năng: Bản đồ 6 tầng cache, kết quả benchmark SQLite WAL (~68×), code splitting và lộ trình tối ưu 4 bước đã hoàn tất. |
| [DEAD-CODE-REPORT.md](DEAD-CODE-REPORT.md) | ✅ | Báo cáo chi tiết ~6.700 dòng dead code (backend & frontend) kèm vị trí và mức độ an toàn khi dọn dẹp. |
| [UI-CONSISTENCY-REPORT.md](UI-CONSISTENCY-REPORT.md) | ✅ | So sánh UI/UX và logic giữa 4 phân hệ Manga · Movie · Music · Media (lỗi bất đồng bộ U1–U11). |
| [MUSIC-UX-REVIEW.md](MUSIC-UX-REVIEW.md) | ✅ | Đánh giá Music Player v1 (Spotify) & v2 (Zing). Ghi nhận hoàn thành P0 & P1 (Global player, mini-player, Media Session API, thanh tua kéo được). |
| [CARD-REDESIGN-PROPOSAL.md](CARD-REDESIGN-PROPOSAL.md) | ✅ | Thiết kế lại hệ thống card: Đã hoàn tất P1–P6, đưa vào sử dụng `ItemCard` và khung `BrowseLayout` dùng chung. |
| [BACKEND-ANALYSIS.md](BACKEND-ANALYSIS.md) | ✅ | Phân tích chi tiết backend: Express 5, route, middleware, `pathSafety`, whitelist IP và cơ chế streaming. |
| [MEDIA-GALLERY.md](MEDIA-GALLERY.md) | ✅ | Tài liệu chuẩn của Media Gallery: API, schema DB, timeline, albums, lightbox và các loại file hỗ trợ. |
| [MEDIA-GALLERY-QUICKSTART.md](MEDIA-GALLERY-QUICKSTART.md) | ✅ | Hướng dẫn nhanh cho Media Gallery: Cấu hình nguồn, tạo thumbnail, các chế độ xem và thao tác ảnh. |

---

## 📱 2. Tài liệu React App (`react-app/docs/`)

| Tài liệu | Trạng thái | Nội dung tóm tắt |
|----------|:----------:|------------------|
| [README.md](../react-app/docs/README.md) | ✅ | Hướng dẫn React app, cấu trúc thư mục, môi trường, scripts, offline. |
| [OFFLINE-GUIDE.md](../react-app/docs/OFFLINE-GUIDE.md) | ✅ | Hướng dẫn đọc offline PWA, cơ chế lưu trữ IndexedDB (`offline-manga`), hàng đợi Download Queue. |
| [SERVICE-WORKER-ANALYSIS.md](../react-app/docs/SERVICE-WORKER-ANALYSIS.md) | ✅ | Phân tích Service Worker v3.1.0 (`public/sw.js`), các cache bucket và cơ chế network-first. |
| [STORAGE-QUOTA-MANAGEMENT.md](../react-app/docs/STORAGE-QUOTA-MANAGEMENT.md) | ✅ | Quản lý dung lượng cache trên thiết bị người dùng. |
| [PLAYLIST-SIDEBAR-RESPONSIVE.md](../react-app/docs/PLAYLIST-SIDEBAR-RESPONSIVE.md) | ✅ | Tài liệu responsive cho thanh sidebar playlist của Music player. |
| [ARCHITECTURE.md](../react-app/docs/ARCHITECTURE.md) | ⚠️ | Phân tích kiến trúc React app từ 09/2025. Đầu file có bảng đối chiếu các tính năng mô tả dự kiến so với code thực tế. |
| [DATA_FLOW.md](../react-app/docs/DATA_FLOW.md) | ⚠️ | Phân tích luồng dữ liệu (nhiều đoạn code minh họa ý tưởng). Đầu file có bảng đối chiếu hàm thực tế. |

---

## ⚠️ 3. Tài liệu cũ cần lưu ý (Lỗi thời một phần)

| Tài liệu | Trạng thái | Điểm lệch so với code hiện tại |
|----------|:----------:|--------------------------------|
| [DATABASE-SCAN-ANALYSIS.md](DATABASE-SCAN-ANALYSIS.md) | ⚠️ | Viết trước khi có scanner Media Gallery (`utils/media-scan.js`) và tuỳ chọn quét `shallow`. |
| [PARTIAL-SCAN-SUMMARY.md](PARTIAL-SCAN-SUMMARY.md) | ⚠️ | Viết trước khi có tuỳ chọn `shallow` (đã có banner đầu file ghi rõ cập nhật). |
| [FRONTEND_V2-ANALYSIS.md](FRONTEND_V2-ANALYSIS.md) | ⚠️ | Phân tích React app từ 09/2025: Thiếu Media Gallery (`/media`), Download Queue (`/downloads`), PDF reader. |
| [FRONTEND_V1-ANALYSIS.md](FRONTEND_V1-ANALYSIS.md) | 📦 | Phân tích Frontend V1 (Vanilla JS). Giữ lại làm tư liệu tham khảo cho giao diện legacy. |

---

## 📦 4. Kho lưu trữ lịch sử & đề xuất cũ (`docs/archive/`)

Các tài liệu dưới đây đã hoàn tất hoặc không còn áp dụng trực tiếp cho codebase hiện tại, được chuyển vào [docs/archive/](archive/README.md) để tránh rác thư mục chính:

* **[legacy-frontend-v1/](archive/legacy-frontend-v1/)** (6 tệp): Tài liệu migrate constants cho Frontend V1 (07/2025).
* **[react-refactor-proposal-2025/](archive/react-refactor-proposal-2025/)** (4 tệp): Đề xuất refactor tách store/settings từ 10/2025 (chưa thực hiện).
* **[download-queue-sprint-2025/](archive/download-queue-sprint-2025/)** (3 tệp): Kế hoạch và mockup sprint Download Queue (01/2025).
* **Tài liệu tổng kết cũ**:
  * [MEDIA-GALLERY-SUMMARY.md](archive/MEDIA-GALLERY-SUMMARY.md) & [MEDIA-IMPLEMENTATION-SUMMARY.md](archive/MEDIA-IMPLEMENTATION-SUMMARY.md) (11/2025)
  * [Scan-music.md](archive/Scan-music.md) (12/2025)
  * [CARD-REDESIGN-PREVIEW.html](archive/CARD-REDESIGN-PREVIEW.html) (Mockup HTML preview card redesign)
