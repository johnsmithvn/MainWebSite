/**
 * Download Queue - Helper Utilities
 * 
 * Provides utility functions for download queue operations:
 * - Title extraction from folder paths
 * - Status formatting
 * - Progress calculations
 * - Time estimations
 * - File size formatting
 */

import { DOWNLOAD_STATUS } from '../constants';

/**
 * Extract manga title from folder path
 * 
 * Handles paths like:
 * - ROOT_MANGAH/MangaTitle/Chapter
 * - ROOT_DOW/MangaTitle/Chapter
 * 
 * @param {string} folderPath - Full folder path
 * @returns {string} Manga title
 * 
 * @example
 * extractMangaTitle('ROOT_MANGAH/One Piece/Chapter 1')
 * // Returns: "One Piece"
 */
export function extractMangaTitle(folderPath) {
  if (!folderPath || typeof folderPath !== 'string') {
    return 'Unknown Manga';
  }

  try {
    // Remove trailing slash
    const cleanPath = folderPath.replace(/\/$/, '');
    
    // Split by slash and get second part (manga name)
    const parts = cleanPath.split('/');
    
    if (parts.length >= 2) {
      // ROOT/MangaName/Chapter structure
      return parts[1].trim();
    }
    
    // Fallback: use last part
    return parts[parts.length - 1].trim();
  } catch (error) {
    console.error('Error extracting manga title:', error);
    return 'Unknown Manga';
  }
}

/**
 * Extract chapter title from folder path
 * 
 * Handles paths like:
 * - ROOT_MANGAH/MangaTitle/Chapter 123
 * - ROOT_DOW/MangaTitle/Vol 5 Ch 45
 * 
 * @param {string} folderPath - Full folder path
 * @returns {string} Chapter title
 * 
 * @example
 * extractChapterTitle('ROOT_MANGAH/One Piece/Chapter 1')
 * // Returns: "Chapter 1"
 */
export function extractChapterTitle(folderPath) {
  if (!folderPath || typeof folderPath !== 'string') {
    return 'Unknown Chapter';
  }

  try {
    // Remove trailing slash
    const cleanPath = folderPath.replace(/\/$/, '');
    
    // Split by slash and get last part (chapter name)
    const parts = cleanPath.split('/');
    
    if (parts.length > 0) {
      return parts[parts.length - 1].trim();
    }
    
    return 'Unknown Chapter';
  } catch (error) {
    console.error('Error extracting chapter title:', error);
    return 'Unknown Chapter';
  }
}

/**
 * Format download status to user-friendly text
 * 
 * @param {string} status - Status constant
 * @returns {string} Formatted status text
 * 
 * @example
 * formatDownloadStatus('downloading')
 * // Returns: "Downloading"
 */
export function formatDownloadStatus(status) {
  const statusMap = {
    [DOWNLOAD_STATUS?.PENDING]: 'Pending',
    [DOWNLOAD_STATUS?.DOWNLOADING]: 'Downloading',
    [DOWNLOAD_STATUS?.PAUSED]: 'Paused',
    [DOWNLOAD_STATUS?.COMPLETED]: 'Completed',
    [DOWNLOAD_STATUS?.FAILED]: 'Failed',
    [DOWNLOAD_STATUS?.CANCELLED]: 'Cancelled',
    pending: 'Pending',
    downloading: 'Downloading',
    paused: 'Paused',
    completed: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled',
  };

  return statusMap[status] || 'Unknown';
}

/**
 * Calculate total progress across multiple tasks
 * 
 * @param {Map<string, Object>} tasks - Tasks Map from store
 * @param {Set<string>} activeDownloads - Active downloads Set
 * @returns {number} Average progress (0-100)
 * 
 * @example
 * calculateTotalProgress(tasks, activeDownloads)
 * // Returns: 45.5
 */
export function calculateTotalProgress(tasks, activeDownloads) {
  if (!tasks || tasks.size === 0) {
    return 0;
  }

  if (!activeDownloads || activeDownloads.size === 0) {
    return 0;
  }

  try {
    // Filter only downloading tasks
    const downloadingTasks = Array.from(tasks.values()).filter(
      task => task.status === 'downloading' && activeDownloads.has(task.id)
    );

    if (downloadingTasks.length === 0) {
      return 0;
    }

    // Calculate average progress
    const totalProgress = downloadingTasks.reduce(
      (sum, task) => sum + (task.progress || 0),
      0
    );

    return totalProgress / downloadingTasks.length;
  } catch (error) {
    console.error('Error calculating total progress:', error);
    return 0;
  }
}

/**
 * Estimate time remaining for download
 * 
 * @param {number} progress - Current progress (0-100)
 * @param {number} startTime - Download start timestamp
 * @returns {Object} Time estimation object
 * 
 * @example
 * estimateTimeRemaining(45, Date.now() - 60000)
 * // Returns: { remaining: 73333, eta: Date, elapsed: 60000 }
 */
export function estimateTimeRemaining(progress, startTime) {
  if (!startTime || progress <= 0) {
    return {
      remaining: null,
      eta: null,
      elapsed: 0,
    };
  }

  try {
    const now = Date.now();
    const elapsed = now - startTime;

    if (progress >= 100) {
      return {
        remaining: 0,
        eta: new Date(now),
        elapsed,
      };
    }

    // Calculate rate (progress per millisecond)
    const rate = progress / elapsed;

    if (rate <= 0) {
      return {
        remaining: null,
        eta: null,
        elapsed,
      };
    }

    // Calculate remaining progress and time
    const remainingProgress = 100 - progress;
    const remainingTime = remainingProgress / rate;

    return {
      remaining: Math.round(remainingTime),
      eta: new Date(now + remainingTime),
      elapsed,
    };
  } catch (error) {
    console.error('Error estimating time remaining:', error);
    return {
      remaining: null,
      eta: null,
      elapsed: 0,
    };
  }
}

/**
 * Format time duration to human-readable string
 * 
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration
 * 
 * @example
 * formatDuration(125000)
 * // Returns: "2m 5s"
 */
export function formatDuration(ms) {
  if (!ms || ms <= 0) {
    return '0s';
  }

  try {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      const remainingHours = hours % 24;
      return remainingHours > 0 
        ? `${days}d ${remainingHours}h`
        : `${days}d`;
    }

    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0
        ? `${hours}h ${remainingMinutes}m`
        : `${hours}h`;
    }

    if (minutes > 0) {
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0
        ? `${minutes}m ${remainingSeconds}s`
        : `${minutes}m`;
    }

    return `${seconds}s`;
  } catch (error) {
    console.error('Error formatting duration:', error);
    return '0s';
  }
}

/**
 * Format file size to human-readable string
 * 
 * @param {number} bytes - Size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted size
 * 
 * @example
 * formatFileSize(1536000)
 * // Returns: "1.46 MB"
 */
export function formatFileSize(bytes, decimals = 2) {
  if (!bytes || bytes === 0) {
    return '0 B';
  }

  try {
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  } catch (error) {
    console.error('Error formatting file size:', error);
    return '0 B';
  }
}

/**
 * Calculate download speed
 * 
 * @param {number} downloadedBytes - Bytes downloaded
 * @param {number} elapsedMs - Time elapsed in milliseconds
 * @returns {string} Formatted speed (e.g., "1.5 MB/s")
 * 
 * @example
 * calculateDownloadSpeed(1536000, 1000)
 * // Returns: "1.46 MB/s"
 */
export function calculateDownloadSpeed(downloadedBytes, elapsedMs) {
  if (!downloadedBytes || !elapsedMs || elapsedMs <= 0) {
    return '0 B/s';
  }

  try {
    // Calculate bytes per second
    const bytesPerSecond = (downloadedBytes / elapsedMs) * 1000;

    return `${formatFileSize(bytesPerSecond)}/s`;
  } catch (error) {
    console.error('Error calculating download speed:', error);
    return '0 B/s';
  }
}

/**
 * Get status color for UI
 * 
 * @param {string} status - Download status
 * @returns {string} Tailwind color class
 * 
 * @example
 * getStatusColor('downloading')
 * // Returns: "text-blue-500"
 */
export function getStatusColor(status) {
  const colorMap = {
    pending: 'text-gray-500',
    downloading: 'text-blue-500',
    paused: 'text-yellow-500',
    completed: 'text-green-500',
    failed: 'text-red-500',
    cancelled: 'text-gray-400',
  };

  return colorMap[status] || 'text-gray-500';
}

/**
 * Get status icon name (lucide-react)
 * 
 * @param {string} status - Download status
 * @returns {string} Icon name
 * 
 * @example
 * getStatusIcon('downloading')
 * // Returns: "Download"
 */
export function getStatusIcon(status) {
  const iconMap = {
    pending: 'Clock',
    downloading: 'Download',
    paused: 'Pause',
    completed: 'CheckCircle',
    failed: 'XCircle',
    cancelled: 'X',
  };

  return iconMap[status] || 'HelpCircle';
}

/**
 * Validate task object structure
 * 
 * @param {Object} task - Task object to validate
 * @returns {boolean} True if valid
 */
export function isValidTask(task) {
  if (!task || typeof task !== 'object') {
    return false;
  }

  // Required fields
  const requiredFields = [
    'id',
    'mangaId',
    'chapterId',
    'folderPath',
    'source',
    'totalPages',
    'status',
  ];

  return requiredFields.every(field => task[field] !== undefined);
}

/**
 * Generate task ID from chapter info
 * 
 * @param {string} mangaId - Manga ID
 * @param {string} chapterId - Chapter ID
 * @param {string} source - Source name
 * @returns {string} Unique task ID
 * 
 * @example
 * generateTaskId('123', '456', 'ROOT_MANGAH')
 * // Returns: "ROOT_MANGAH-123-456"
 */
export function generateTaskId(mangaId, chapterId, source) {
  return `${source}-${mangaId}-${chapterId}`;
}

/**
 * Check if task can be retried
 * 
 * @param {Object} task - Task object
 * @param {number} maxRetries - Maximum retry count
 * @returns {boolean} True if can retry
 */
export function canRetryTask(task, maxRetries = 3) {
  if (!task) {
    return false;
  }

  return (
    task.status === 'failed' &&
    (task.retryCount || 0) < maxRetries
  );
}

/**
 * Get next retry delay with exponential backoff
 * 
 * @param {number} retryCount - Current retry count
 * @param {number} baseDelay - Base delay in ms (default 1000)
 * @returns {number} Delay in milliseconds
 * 
 * @example
 * getRetryDelay(2)
 * // Returns: 4000 (1000 * 2^2)
 */
export function getRetryDelay(retryCount, baseDelay = 1000) {
  return baseDelay * Math.pow(2, retryCount);
}

export default {
  extractMangaTitle,
  extractChapterTitle,
  formatDownloadStatus,
  calculateTotalProgress,
  estimateTimeRemaining,
  formatDuration,
  formatFileSize,
  calculateDownloadSpeed,
  getStatusColor,
  getStatusIcon,
  isValidTask,
  generateTaskId,
  canRetryTask,
  getRetryDelay,
};
