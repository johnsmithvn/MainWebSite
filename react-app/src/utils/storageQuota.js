/**
 * Storage Quota Management Utilities
 * Kiểm tra và quản lý dung lượng storage trước khi download
 */

// Ngưỡng cảnh báo storage (90% quota được sử dụng)
const STORAGE_WARNING_THRESHOLD = 0.9;

// Ngưỡng ngăn chặn download (95% quota được sử dụng)  
const STORAGE_CRITICAL_THRESHOLD = 0.95;

// Minimum free space required (50MB)
const MIN_REQUIRED_SPACE = 50 * 1024 * 1024; // 50MB in bytes

/**
 * Kiểm tra storage quota hiện tại
 * @returns {Promise<Object>} Storage information
 */
export async function checkStorageQuota() {
  try {
    if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
      return {
        supported: false,
        quota: 0,
        usage: 0,
        available: 0,
        percentage: 0,
        warning: 'Storage API không được hỗ trợ'
      };
    }

    const estimate = await navigator.storage.estimate();
    const quota = estimate.quota || 0;
    const usage = estimate.usage || 0;
    const available = quota - usage;
    const percentage = quota > 0 ? (usage / quota) : 0;

    return {
      supported: true,
      quota,
      usage,
      available,
      percentage,
      quotaFormatted: formatBytes(quota),
      usageFormatted: formatBytes(usage),
      availableFormatted: formatBytes(available),
      percentageFormatted: Math.round(percentage * 100) + '%'
    };
  } catch (error) {
    console.error('❌ Error checking storage quota:', error);
    return {
      supported: false,
      quota: 0,
      usage: 0,
      available: 0,
      percentage: 0,
      error: error.message
    };
  }
}

/**
 * Ước tính dung lượng cần thiết cho chapter
 * @param {Array} pageUrls - Danh sách URL của các trang
 * @returns {Promise<number>} Estimated size in bytes
 */
export async function estimateChapterSize(pageUrls) {
  if (!pageUrls || !Array.isArray(pageUrls) || pageUrls.length === 0) {
    return 0;
  }

  try {
    // Lấy mẫu 3 trang đầu để ước tính kích thước trung bình
    const sampleSize = Math.min(3, pageUrls.length);
    const sampleUrls = pageUrls.slice(0, sampleSize);
    
    let totalSampleSize = 0;
    let successfulSamples = 0;

    // Fetch HEAD request để lấy Content-Length
    for (const url of sampleUrls) {
      try {
        const response = await fetch(url, { 
          method: 'HEAD',
          mode: 'cors'
        });
        
        if (response.ok) {
          const contentLength = response.headers.get('Content-Length');
          if (contentLength) {
            totalSampleSize += parseInt(contentLength, 10);
            successfulSamples++;
          }
        }
      } catch (err) {
        console.warn('❌ Failed to get size for:', url.split('/').pop(), err.message);
      }
    }

    if (successfulSamples > 0) {
      // Tính kích thước trung bình và nhân với tổng số trang
      const averagePageSize = totalSampleSize / successfulSamples;
      const estimatedTotal = Math.ceil(averagePageSize * pageUrls.length);
      
      console.log(`📊 Estimated chapter size: ${formatBytes(estimatedTotal)} (${pageUrls.length} pages, avg: ${formatBytes(averagePageSize)})`);
      return estimatedTotal;
    } else {
      // Fallback: ước tính dựa trên kinh nghiệm (500KB/trang)
      const fallbackSize = pageUrls.length * 500 * 1024; // 500KB per page
      console.log(`📊 Fallback estimate: ${formatBytes(fallbackSize)} (${pageUrls.length} pages)`);
      return fallbackSize;
    }
  } catch (error) {
    console.error('❌ Error estimating chapter size:', error);
    // Fallback estimate
    return pageUrls.length * 500 * 1024; // 500KB per page
  }
}

/**
 * Kiểm tra xem có đủ dung lượng để download chapter hay không
 * @param {Array} pageUrls - Danh sách URL của các trang
 * @returns {Promise<Object>} Check result
 */
export async function checkStorageForDownload(pageUrls) {
  const storageInfo = await checkStorageQuota();
  
  if (!storageInfo.supported) {
    return {
      canDownload: true, // Allow download if quota check is not supported
      reason: 'storage_api_unsupported',
      message: 'Không thể kiểm tra quota, download sẽ tiếp tục',
      storageInfo,
      estimatedSize: 0
    };
  }

  const estimatedSize = await estimateChapterSize(pageUrls);
  const { available, percentage } = storageInfo;

  // Kiểm tra nếu đã vượt ngưỡng critical
  if (percentage >= STORAGE_CRITICAL_THRESHOLD) {
    return {
      canDownload: false,
      reason: 'storage_critical',
      message: `Storage đã sử dụng ${Math.round(percentage * 100)}%. Vui lòng xóa bớt dữ liệu offline.`,
      storageInfo,
      estimatedSize,
      estimatedSizeFormatted: formatBytes(estimatedSize)
    };
  }

  // Kiểm tra nếu không đủ dung lượng cho chapter này
  if (estimatedSize > available) {
    return {
      canDownload: false,
      reason: 'insufficient_space',
      message: `Cần ${formatBytes(estimatedSize)} nhưng chỉ còn ${formatBytes(available)} khả dụng.`,
      storageInfo,
      estimatedSize,
      estimatedSizeFormatted: formatBytes(estimatedSize)
    };
  }

  // Kiểm tra nếu sau khi download sẽ vượt ngưỡng critical
  const afterDownloadUsage = storageInfo.usage + estimatedSize;
  const afterDownloadPercentage = storageInfo.quota > 0 ? (afterDownloadUsage / storageInfo.quota) : 0;
  
  if (afterDownloadPercentage >= STORAGE_CRITICAL_THRESHOLD) {
    return {
      canDownload: false,
      reason: 'would_exceed_critical',
      message: `Download sẽ khiến storage vượt ${Math.round(STORAGE_CRITICAL_THRESHOLD * 100)}%. Vui lòng xóa bớt dữ liệu.`,
      storageInfo,
      estimatedSize,
      estimatedSizeFormatted: formatBytes(estimatedSize),
      afterDownloadPercentage: Math.round(afterDownloadPercentage * 100)
    };
  }

  // Kiểm tra nếu không đủ minimum required space
  const remainingAfterDownload = available - estimatedSize;
  if (remainingAfterDownload < MIN_REQUIRED_SPACE) {
    return {
      canDownload: false,
      reason: 'insufficient_buffer',
      message: `Cần để lại ít nhất ${formatBytes(MIN_REQUIRED_SPACE)} trống. Vui lòng xóa bớt dữ liệu.`,
      storageInfo,
      estimatedSize,
      estimatedSizeFormatted: formatBytes(estimatedSize)
    };
  }

  // Cảnh báo nếu đã vượt ngưỡng warning
  let warning = null;
  if (percentage >= STORAGE_WARNING_THRESHOLD) {
    warning = `Storage đã sử dụng ${Math.round(percentage * 100)}%. Hãy cân nhắc xóa bớt dữ liệu offline.`;
  }

  return {
    canDownload: true,
    reason: 'sufficient_space',
    message: `Có thể download. Cần ${formatBytes(estimatedSize)}, còn ${formatBytes(available)} khả dụng.`,
    warning,
    storageInfo,
    estimatedSize,
    estimatedSizeFormatted: formatBytes(estimatedSize)
  };
}

/**
 * Format bytes thành chuỗi dễ đọc
 * @param {number} bytes 
 * @returns {string}
 */
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  if (i === 0) return bytes + ' B';
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Hiển thị modal xác nhận download với thông tin storage
 * @param {Object} checkResult - Kết quả từ checkStorageForDownload
 * @returns {Promise<boolean>} User confirmation
 */
export function showStorageConfirmDialog(checkResult) {
  return new Promise((resolve) => {
    const { canDownload, message, warning, estimatedSizeFormatted, storageInfo } = checkResult;
    
    let dialogMessage = message;
    if (warning) {
      dialogMessage += '\n\n⚠️ ' + warning;
    }
    
    if (canDownload) {
      dialogMessage += `\n\nDung lượng ước tính: ${estimatedSizeFormatted}`;
      dialogMessage += `\nStorage hiện tại: ${storageInfo.usageFormatted} / ${storageInfo.quotaFormatted} (${storageInfo.percentageFormatted})`;
      dialogMessage += '\n\nBạn có muốn tiếp tục download?';
      
      const confirmed = window.confirm(dialogMessage);
      resolve(confirmed);
    } else {
      alert('❌ ' + dialogMessage);
      resolve(false);
    }
  });
}

/**
 * Tạo modal thông tin storage quota chi tiết (React component friendly)
 * @param {Object} storageInfo 
 * @returns {Object} Modal data
 */
export function createStorageInfoModal(storageInfo) {
  if (!storageInfo.supported) {
    return {
      title: 'Storage Information',
      content: 'Trình duyệt không hỗ trợ Storage API',
      type: 'info'
    };
  }

  const { percentage, quotaFormatted, usageFormatted, availableFormatted } = storageInfo;
  let type = 'info';
  let statusIcon = '💾';
  
  if (percentage >= STORAGE_CRITICAL_THRESHOLD) {
    type = 'error';
    statusIcon = '🚨';
  } else if (percentage >= STORAGE_WARNING_THRESHOLD) {
    type = 'warning';
    statusIcon = '⚠️';
  }

  return {
    title: `${statusIcon} Storage Information`,
    content: `
      <div class="storage-info">
        <div class="storage-bar">
          <div class="storage-progress" style="width: ${Math.round(percentage * 100)}%"></div>
        </div>
        <div class="storage-details">
          <p><strong>Đã sử dụng:</strong> ${usageFormatted}</p>
          <p><strong>Tổng dung lượng:</strong> ${quotaFormatted}</p>
          <p><strong>Còn lại:</strong> ${availableFormatted}</p>
          <p><strong>Phần trăm:</strong> ${Math.round(percentage * 100)}%</p>
        </div>
      </div>
    `,
    type,
    percentage: Math.round(percentage * 100)
  };
}

export { STORAGE_WARNING_THRESHOLD, STORAGE_CRITICAL_THRESHOLD, MIN_REQUIRED_SPACE };
