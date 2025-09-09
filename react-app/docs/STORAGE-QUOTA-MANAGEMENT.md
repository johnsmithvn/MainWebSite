# Storage Quota Management Documentation

## Tổng quan

Hệ thống Storage Quota Management được thiết kế để kiểm tra và quản lý dung lượng storage trước khi download chapter, đảm bảo user experience tốt và tránh lỗi out-of-storage.

## Kiến trúc

### Core Components

1. **`storageQuota.js`** - Utility functions chính
2. **`StorageQuotaModal.jsx`** - React component hiển thị storage info
3. **`MangaReader.jsx`** - Integration với download flow

### Storage Thresholds

- **Warning Threshold**: 90% - Hiển thị cảnh báo nhưng vẫn cho phép download
- **Critical Threshold**: 95% - Ngăn chặn download hoàn toàn  
- **Minimum Buffer**: 50MB - Dung lượng tối thiểu phải còn lại

## API Functions

### `checkStorageQuota()`

Kiểm tra storage quota hiện tại của browser.

```javascript
const storageInfo = await checkStorageQuota();
console.log(storageInfo);
// {
//   supported: true,
//   quota: 120000000000,      // Total quota in bytes
//   usage: 85000000000,       // Used space in bytes  
//   available: 35000000000,   // Available space in bytes
//   percentage: 0.708,        // Usage percentage (0-1)
//   quotaFormatted: "111.76 GB",
//   usageFormatted: "79.16 GB", 
//   availableFormatted: "32.60 GB",
//   percentageFormatted: "71%"
// }
```

### `estimateChapterSize(pageUrls)`

Ước tính dung lượng cần thiết cho chapter.

```javascript
const pageUrls = [
  'https://example.com/page1.jpg',
  'https://example.com/page2.jpg',
  // ... more pages
];

const estimatedBytes = await estimateChapterSize(pageUrls);
console.log(`Estimated size: ${estimatedBytes} bytes`);
```

**Logic ước tính:**
1. Lấy mẫu 3 trang đầu bằng HEAD requests
2. Tính kích thước trung bình từ Content-Length headers
3. Nhân với tổng số trang
4. Fallback 500KB/page nếu không lấy được headers

### `checkStorageForDownload(pageUrls)`

Function chính để validate storage trước download.

```javascript
const checkResult = await checkStorageForDownload(pageUrls);

if (checkResult.canDownload) {
  // Proceed with download
  if (checkResult.warning) {
    // Show warning but allow download
    showWarningModal(checkResult);
  } else {
    // Direct download
    proceedWithDownload();
  }
} else {
  // Block download and show error
  showErrorModal(checkResult);
}
```

**Return object:**
```javascript
{
  canDownload: boolean,           // Main decision flag
  reason: string,                 // Reason code
  message: string,                // User-friendly message
  warning?: string,               // Optional warning message
  storageInfo: object,            // Full storage information
  estimatedSize: number,          // Estimated download size
  estimatedSizeFormatted: string  // Human-readable size
}
```

**Reason codes:**
- `sufficient_space` - OK to download
- `storage_critical` - Usage > 95%
- `insufficient_space` - Not enough space for chapter
- `would_exceed_critical` - Download would push > 95%
- `insufficient_buffer` - Would leave < 50MB free
- `storage_api_unsupported` - Browser doesn't support Storage API

## React Integration

### StorageQuotaModal Component

```jsx
<StorageQuotaModal
  isOpen={showStorageQuotaModal}
  onClose={() => setShowStorageQuotaModal(false)}
  storageInfo={storageCheckResult?.storageInfo || {}}
  estimatedSize={storageCheckResult?.estimatedSize || 0}
  canDownload={storageCheckResult?.canDownload || false}
  message={storageCheckResult?.message || ''}
  warning={storageCheckResult?.warning || ''}
  chapterTitle="Chapter Title"
  onConfirm={async () => {
    setShowStorageQuotaModal(false);
    await proceedWithDownload();
  }}
  onCancel={() => setShowStorageQuotaModal(false)}
/>
```

### Download Flow Integration

```javascript
const handleDownloadChapter = async () => {
  try {
    // 1. Check storage quota first
    const checkResult = await checkStorageForDownload(currentImages);
    
    if (!checkResult.canDownload) {
      // Show error modal
      setStorageCheckResult(checkResult);
      setShowStorageQuotaModal(true);
      return;
    }
    
    if (checkResult.warning) {
      // Show warning modal with confirm option
      setStorageCheckResult(checkResult);
      setShowStorageQuotaModal(true);
      return;
    }
    
    // 2. Proceed with download
    await proceedWithDownload();
    
  } catch (error) {
    console.error('Storage check failed:', error);
  }
};
```

## UI Components

### Progress Bar Color Coding

```css
/* Green: 0-75% usage */
.storage-progress-green { background: #10b981; }

/* Blue: 75-90% usage */ 
.storage-progress-blue { background: #3b82f6; }

/* Yellow: 90-95% usage (warning) */
.storage-progress-yellow { background: #f59e0b; }

/* Red: 95%+ usage (critical) */
.storage-progress-red { background: #ef4444; }
```

### Status Icons

- ✅ `CheckCircle` - OK to download
- ⚠️ `AlertTriangle` - Warning (can download)
- ❌ `XCircle` - Error (cannot download)
- 💾 `HardDrive` - Storage icon

## Error Handling

### Network Errors
```javascript
// Handle HEAD request failures gracefully
try {
  const response = await fetch(url, { method: 'HEAD', mode: 'cors' });
  // Process Content-Length
} catch (err) {
  console.warn('Failed to get size for:', url);
  // Continue with fallback estimation
}
```

### Browser Compatibility
```javascript
if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
  return {
    supported: false,
    canDownload: true, // Allow download if quota check unsupported
    reason: 'storage_api_unsupported'
  };
}
```

### Quota API Errors
```javascript
try {
  const estimate = await navigator.storage.estimate();
  // Process estimate
} catch (error) {
  console.error('Storage estimate failed:', error);
  // Return fallback result
}
```

## Best Practices

### Performance

1. **Efficient Sampling**: Chỉ lấy mẫu 3 trang đầu thay vì tất cả
2. **HEAD Requests**: Dùng HEAD thay vì GET để tiết kiệm bandwidth
3. **Caching Results**: Cache estimation results trong session
4. **Fallback Strategy**: Luôn có fallback estimate

### User Experience

1. **Progressive Disclosure**: Hiển thị info theo mức độ phù hợp
2. **Clear Messaging**: Thông báo rõ ràng về lý do không thể download
3. **Actionable Guidance**: Hướng dẫn cụ thể cách giải quyết (xóa data)
4. **Non-blocking Warnings**: Warning không block action, chỉ inform

### Error Recovery

1. **Graceful Degradation**: Hoạt động được khi Storage API không có
2. **Partial Failures**: Continue estimation khi một số pages fail
3. **User Override**: Cho phép user force download trong emergency
4. **Retry Logic**: Retry failed size checks với exponential backoff

## Testing

### Manual Testing

1. Open browser DevTools Console
2. Run test script từ `test-storage-quota.js`
3. Test với different storage levels
4. Verify modal behavior

### Automated Testing

```javascript
// Test storage quota check
describe('Storage Quota', () => {
  test('should return storage info', async () => {
    const result = await checkStorageQuota();
    expect(result).toHaveProperty('supported');
    expect(result).toHaveProperty('quota');
  });
  
  test('should estimate chapter size', async () => {
    const urls = ['url1', 'url2', 'url3'];
    const size = await estimateChapterSize(urls);
    expect(size).toBeGreaterThan(0);
  });
});
```

## Monitoring & Analytics

### Console Logging

```javascript
console.log('📊 Storage Check:', {
  canDownload: result.canDownload,
  reason: result.reason,
  usagePercentage: Math.round(result.storageInfo.percentage * 100),
  estimatedMB: Math.round(result.estimatedSize / 1024 / 1024)
});
```

### Error Tracking

```javascript
// Track storage-related errors
if (!result.canDownload) {
  analytics.track('download_blocked', {
    reason: result.reason,
    storageUsage: result.storageInfo.percentage,
    estimatedSize: result.estimatedSize
  });
}
```

## Troubleshooting

### Common Issues

1. **"Storage API không được hỗ trợ"**
   - Browser cũ hoặc incognito mode
   - Feature sẽ fallback và allow download

2. **Size estimation không chính xác**
   - CORS issues với image server
   - Fallback to 500KB/page estimate

3. **Modal không hiển thị**
   - Check React state management
   - Verify modal z-index và positioning

4. **Download bị block nhầm**
   - Check threshold constants
   - Verify calculation logic
   - Consider adjusting thresholds

### Debug Commands

```javascript
// Check current storage in console
const info = await checkStorageQuota();
console.table(info);

// Estimate specific chapter
const size = await estimateChapterSize(pageUrls);
console.log('Estimated:', size, 'bytes');

// Full download check
const check = await checkStorageForDownload(pageUrls);
console.log('Download check:', check);
```
