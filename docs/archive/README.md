# 📦 Kho Lưu Trữ Tài Liệu Lịch Sử & Đề Xuất Cũ (Archive)

> Thư mục này lưu trữ các tài liệu lịch sử, báo cáo sprint đã hoàn tất, đề xuất refactor chưa/không thực hiện, và tài liệu liên quan đến frontend legacy (V1).  
> **Mục đích:** Giữ lại lịch sử phát triển để tra cứu khi cần, đồng thời giúp cây thư mục `docs/` chính luôn sạch sẽ và tập trung vào code hiện hành.

---

## 🗂️ Danh mục lưu trữ

### 1. `legacy-frontend-v1/` (6 tệp)
Tài liệu về đợt chuyển đổi constants (`frontend/src/constants.js`) cho giao diện Vanilla JS từ tháng 07/2025. Hiện tại Frontend V1 đã ngừng phát triển (legacy), toàn bộ ứng dụng chính đã chuyển sang `react-app/`.
- `CONSTANTS-ANALYSIS.md`
- `CONSTANTS-MIGRATION.md`
- `CONSTANTS-MIGRATION-SUMMARY.md`
- `FINAL-SUMMARY.md`
- `PROJECT-INDEX.md`
- `README.md`

### 2. `react-refactor-proposal-2025/` (4 tệp)
Kế hoạch và phân tích đề xuất refactor React app từ tháng 10/2025 (đề xuất tách `Settings.jsx`, tách `store/index.js`...). Kế hoạch này chưa từng được thực hiện; danh mục dead code chuẩn xác đã được thay thế tại `docs/DEAD-CODE-REPORT.md`.
- `REFACTOR_PLAN.md`
- `CODE_ANALYSIS_REPORT.md`
- `ANALYSIS_SUMMARY.md`
- `UNUSED_HOOKS_ANALYSIS.md`

### 3. `download-queue-sprint-2025/` (3 tệp)
Kế hoạch triển khai, mockup và fix hiệu năng theo từng tuần khi làm tính năng Download Queue (01/2025). Tính năng đã hoàn thành và hoạt động ổn định; hướng dẫn sử dụng hiện hành nằm ở `react-app/docs/OFFLINE-GUIDE.md`.
- `DOWNLOAD-QUEUE-IMPLEMENTATION-PLAN.md`
- `DOWNLOAD-QUEUE-UI-MOCKUP.md`
- `PERFORMANCE-FIXES-SUMMARY.md`

### 4. Tài liệu tổng kết & preview cũ
- `MEDIA-GALLERY-SUMMARY.md` & `MEDIA-IMPLEMENTATION-SUMMARY.md`: Bản tổng kết sơ khai lúc mới làm Media Gallery (11/2025). Tài liệu chính thức hiện tại: `docs/MEDIA-GALLERY.md`.
- `Scan-music.md`: Bản nháp phân tích scan music (12/2025), đã được tích hợp vào `docs/SYSTEM-REPORT.md`.
- `CARD-REDESIGN-PREVIEW.html`: Mockup HTML tĩnh (104KB) dùng để preview trước khi chuyển thành component `ItemCard.jsx` và `BrowseLayout.jsx`.

