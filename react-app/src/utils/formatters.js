// 📁 src/utils/formatters.js
// 🔧 Formatting utilities

/**
 * Format bytes thành chuỗi dễ đọc
 * @param {number} bytes 
 * @returns {string}
 */
export const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  if (i === 0) return bytes + ' B';
  
  const value = bytes / Math.pow(k, i);
  
  // Nếu là MB và > 100MB thì chuyển sang GB
  if (i === 2 && value > 100) {
    const gb = bytes / Math.pow(k, 3);
    return parseFloat(gb.toFixed(2)) + ' GB';
  }
  
  return parseFloat(value.toFixed(2)) + ' ' + sizes[i];
};

// Alias for backward compatibility and consistency
export const formatFileSize = formatBytes;

/**
 * Bỏ đuôi file khỏi tên để hiển thị trên card (đuôi đã có ở dòng phụ)
 * @param {string} name - Ví dụ "Phim (2024) 1080p.mkv"
 * @returns {string} Ví dụ "Phim (2024) 1080p"
 */
export const parentFolderName = (path = '') => {
  // "Bộ truyện/Chương 12" → "Bộ truyện"; mục ở cấp gốc → ''
  const parts = String(path).split('/').filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 2] : '';
};

/**
 * Thời điểm tương đối, ngắn gọn, tiếng Việt: "vừa xong", "5 phút trước", "2 giờ trước", "3 ngày trước"...
 * @param {number|string|Date} date
 */
export const formatRelativeVi = (date) => {
  if (!date) return '';
  const t = new Date(date).getTime();
  if (Number.isNaN(t)) return '';
  const minutes = Math.floor((Date.now() - t) / 60000);
  if (minutes < 1) return 'vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  if (days < 30) return `${Math.floor(days / 7)} tuần trước`;
  if (days < 365) return `${Math.floor(days / 30)} tháng trước`;
  return `${Math.floor(days / 365)} năm trước`;
};

export const stripExtension = (name = '') => {
  const s = String(name);
  const stripped = s.replace(/\.[a-z0-9]{2,5}$/i, '');
  return stripped || s;
};

/**
 * Format view count number to readable format
 * @param {number} count - The view count
 * @returns {string} Formatted string
 */
export const formatViewCount = (count) => {
  if (!count || count === 0) return '0';
  
  if (count < 1000) {
    return count.toString();
  } else if (count < 1000000) {
    return `${(count / 1000).toFixed(1)}K`;
  } else {
    return `${(count / 1000000).toFixed(1)}M`;
  }
};

/**
 * Format duration to readable format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted string (MM:SS or HH:MM:SS)
 */
export const formatDuration = (seconds) => {
  if (!seconds || seconds === 0) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Get file extension from filename
 * @param {string} filename - The filename
 * @returns {string} File extension
 */
export const getFileExtension = (filename) => {
  if (!filename) return '';
  return filename.split('.').pop()?.toLowerCase() || '';
};

/**
 * Check if file is image
 * @param {string} filename - The filename
 * @returns {boolean} True if image
 */
export const isImageFile = (filename) => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
  return imageExtensions.includes(getFileExtension(filename));
};

/**
 * Check if file is video
 * @param {string} filename - The filename
 * @returns {boolean} True if video
 */
export const isVideoFile = (filename) => {
  const videoExtensions = ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'];
  return videoExtensions.includes(getFileExtension(filename));
};

/**
 * Check if file is audio
 * @param {string} filename - The filename
 * @returns {boolean} True if audio
 */
export const isAudioFile = (filename) => {
  const audioExtensions = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'];
  return audioExtensions.includes(getFileExtension(filename));
};

/**
 * Format timestamp to localized date string  
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Formatted date string
 */
export const formatDate = (timestamp) => {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

