# Storage Quota Management

## 1. Mục tiêu & phạm vi

Module quota được dùng cho mọi thao tác tải chapter trong reader. Bộ utility đặt trong [`react-app/src/utils/storageQuota.js`](../src/utils/storageQuota.js) và UI chính là [`StorageQuotaModal`](../src/components/common/StorageQuotaModal.jsx). Tài liệu này phản ánh đúng logic hiện tại sau các chỉnh sửa gần nhất.

## 2. Thành phần chính

| Thành phần | Vai trò |
|------------|--------|
| `storageQuota.js` | Cung cấp API kiểm tra quota, ước lượng dung lượng chapter, validate trước khi download và helper tạo modal. |
| `StorageQuotaModal.jsx` | Modal React tái sử dụng được, hiển thị thông tin quota + xác nhận tải. |
| `MangaReader.jsx` | Gọi các hàm quota trước khi thực hiện lưu offline, quản lý state mở modal. |

## 3. Ngưỡng & cấu hình

| Hằng số | Giá trị | Mô tả |
|---------|---------|-------|
| `STORAGE_WARNING_THRESHOLD` | `0.9` (90%) | Hiển thị cảnh báo nhưng vẫn cho phép tải. |
| `STORAGE_CRITICAL_THRESHOLD` | `0.95` (95%) | Block thao tác tải. |
| `STORAGE_INFO_THRESHOLD` | `0.75` (75%) | Dùng cho UI báo sớm (hiển thị màu sắc khác). |
| `MIN_REQUIRED_SPACE` | 50 MB desktop / 25 MB mobile (tự động xác định) | Dung lượng tối thiểu phải còn trống sau khi tải xong. Có thể override bằng biến môi trường `VITE_MIN_STORAGE_SPACE` (đơn vị MB). |

## 4. API chi tiết

### 4.1 `checkStorageQuota()`

- Kiểm tra `navigator.storage.estimate()` nếu browser hỗ trợ.
- Trả về object gồm quota, usage, available, phần trăm và chuỗi đã format (dùng `formatBytes`).
- Nếu API không hỗ trợ: `supported: false` và cho phép tiếp tục tải (fall-back logic vẫn đảm bảo user không bị chặn vô lý).

```javascript
const info = await checkStorageQuota();
// { supported, quota, usage, available, percentage, quotaFormatted, ... }
```

### 4.2 `estimateChapterSize(pageUrls)`

- Lấy tối đa 3 URL đầu để gửi HEAD request và đọc `Content-Length`.
- Tính trung bình và nhân với tổng số trang.
- Nếu tất cả HEAD thất bại: fallback cố định 500 KB/trang.
- Log ra console để dễ debug (ví dụ `📊 Estimated chapter size: 42.3 MB`).

### 4.3 `checkStorageForDownload(pageUrls)`

- Gọi hai hàm trên, sau đó áp các rule:
  1. Block ngay nếu `%usage >= 95%` (`storage_critical`).
  2. Block nếu dung lượng ước tính lớn hơn phần còn trống (`insufficient_space`).
  3. Block nếu sau khi tải xong sẽ vượt 95% (`would_exceed_critical`).
  4. Block nếu phần trống còn lại < `MIN_REQUIRED_SPACE` (`insufficient_buffer`).
  5. Nếu vẫn ổn nhưng `%usage >= 90%` ⇒ gắn thêm `warning` để UI hiển thị cảnh báo.

```javascript
const result = await checkStorageForDownload(pageUrls);
// { canDownload, reason, message, warning?, storageInfo, estimatedSize, ... }
```

### 4.4 Helper cho UI

- `showStorageConfirmDialog(checkResult, modalConfirm)` – tạo confirm dialog (dùng modal nội bộ nếu truyền hàm, fallback sang `window.confirm/alert` nếu không).
- `createStorageInfoModal(storageInfo)` – trả về payload để render modal thông tin quota nhanh (bao gồm màu sắc tương ứng với ngưỡng).
- ⚠️ Hai helper `showStorageConfirmDialog` và `createStorageInfoModal` hiện **không được gọi ở đâu** — `MangaReader` render trực tiếp `StorageQuotaModal` (xem [DEAD-CODE-REPORT.md](../../docs/DEAD-CODE-REPORT.md)).

## 5. Luồng tích hợp trong MangaReader

Pseudo-code (đã rút gọn từ `MangaReader.jsx`):

```javascript
const handleDownloadChapter = async () => {
  const checkResult = await checkStorageForDownload(currentImages);

  if (!checkResult.canDownload) {
    setStorageCheckResult(checkResult);
    setShowStorageQuotaModal(true);
    return;
  }

  if (checkResult.warning) {
    setStorageCheckResult(checkResult);
    setShowStorageQuotaModal(true); // user phải xác nhận lại
    return;
  }

  await proceedWithDownload();
};
```

Modal nhận props `storageInfo`, `estimatedSize`, `message`, `warning`, và callback `onConfirm/onCancel` để tiếp tục/quay lại.

## 6. UI & UX note

- **Thanh tiến trình**: logic màu đặt trong component (xanh <75%, xanh dương 75–90%, vàng 90–95%, đỏ >95%).
- **Icon trạng thái**: `CheckCircle` / `AlertTriangle` / `XCircle` tương ứng đủ dung lượng, cảnh báo, chặn.
- **Thông điệp**: mọi message được build sẵn trong `storageQuota.js` nhằm thống nhất văn phong, tránh lặp lại ở nhiều nơi.
- **Mobile UX**: modal được tối ưu padding nhỏ, hiển thị rõ dung lượng còn lại và kích thước chapter dự kiến.

## 7. Xử lý lỗi & fallback

| Tình huống | Hành vi hiện tại | Gợi ý xử lý |
|------------|------------------|-------------|
| Browser không hỗ trợ Storage API | Trả về `supported: false`, không chặn tải. | Có thể hiển thị toast “Không thể kiểm tra dung lượng” để user chủ động quản lý. |
| HEAD request thất bại (CORS/timeout) | Log warning, dùng fallback 500 KB/trang. | Nếu server cung cấp size qua API riêng, có thể override hàm estimate. |
| Người dùng bị chặn vì `%usage` cao | Modal hiển thị lý do + số MB cần thiết. | Gợi ý người dùng xóa chapter cũ trong trang Offline Library. |

## 8. Kiểm thử nhanh

1. Mở DevTools → Application → Storage để quan sát quota/usage thực tế.
2. Trong console chạy `await checkStorageQuota()` để xem thông tin format đúng chưa.
3. Giả lập warning bằng cách sửa tạm `STORAGE_WARNING_THRESHOLD` xuống 0.01 và thử tải chương → modal phải hiển thị cảnh báo.
4. Dùng Chrome DevTools “Clear storage” để kiểm tra trường hợp API không hỗ trợ (trên Safari/iOS).

## 9. Mẹo mở rộng

- Có thể cache kết quả `estimateChapterSize` theo URL chương trong session để tránh lặp HEAD request nếu user spam tải.
- Kết hợp với service worker: khi chuẩn bị download hàng loạt, gọi `checkStorageQuota()` trước để cảnh báo sớm, tránh việc lưu dở dang giữa chừng.
- Khi cần thay đổi ngưỡng cho từng user, thêm logic đọc cấu hình từ server và override các hằng số trước khi export.
