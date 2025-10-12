// 📁 src/utils/downloadNotifications.js
// 🔔 Download Queue Notification Manager

import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle, Download, AlertTriangle } from 'lucide-react';

/**
 * Notification Manager for Download Queue
 * Handles toast notifications and browser notifications
 */
class DownloadNotificationManager {
  constructor() {
    this.permission = 'default';
    this.checkPermission();
  }

  /**
   * Check current notification permission
   */
  checkPermission() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  /**
   * Request browser notification permission
   * @returns {Promise<string>} Permission status
   */
  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return 'denied';
    }

    if (this.permission === 'granted') {
      return 'granted';
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Show toast notification with action button
   * @param {Object} options
   */
  showToast({ type, title, message, action, onActionClick }) {
    const config = {
      duration: 5000,
      position: 'top-right'
    };

    const content = (t) => (
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          {type === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
          {type === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
          {type === 'info' && <Download className="w-5 h-5 text-blue-500" />}
          {type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {title}
          </p>
          {message && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {message}
            </p>
          )}

          {/* Action Button */}
          {action && (
            <button
              onClick={() => {
                onActionClick?.();
                toast.dismiss(t.id);
              }}
              className="mt-2 px-3 py-1.5 text-xs font-medium text-primary-700 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30 rounded hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
            >
              {action}
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={() => toast.dismiss(t.id)}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );

    toast.custom(content, config);
  }

  /**
   * Show browser notification
   * @param {Object} options
   */
  async showBrowserNotification({
    title,
    body,
    icon,
    badge,
    tag,
    onClick,
    onClose
  }) {
    // Check permission
    if (this.permission !== 'granted') {
      console.warn('Browser notifications not permitted');
      return null;
    }

    if (!('Notification' in window)) {
      return null;
    }

    try {
      const notification = new Notification(title, {
        body,
        icon: icon || '/default/favicon.png',
        badge: badge || '/default/favicon.png',
        tag: tag || `download-${Date.now()}`,
        requireInteraction: false,
        silent: false
      });

      // Click handler
      if (onClick) {
        notification.onclick = (event) => {
          event.preventDefault();
          window.focus();
          onClick();
          notification.close();
        };
      }

      // Close handler
      if (onClose) {
        notification.onclose = onClose;
      }

      // Auto close after 10 seconds
      setTimeout(() => {
        notification.close();
      }, 10000);

      return notification;
    } catch (error) {
      console.error('Failed to show browser notification:', error);
      return null;
    }
  }

  /**
   * Notify when task added to queue
   */
  notifyTaskAdded(task, onViewQueue) {
    this.showToast({
      type: 'info',
      title: 'Đã thêm vào queue',
      message: `${task.chapterTitle || task.chapterId}`,
      action: 'Xem queue',
      onActionClick: onViewQueue
    });
  }

  /**
   * Notify when download starts
   */
  notifyDownloadStarted(task) {
    this.showToast({
      type: 'info',
      title: 'Bắt đầu tải xuống',
      message: `${task.chapterTitle || task.chapterId}`
    });
  }

  /**
   * Notify when download completes
   */
  async notifyDownloadComplete(task, onViewChapter) {
    // Toast notification
    this.showToast({
      type: 'success',
      title: 'Download hoàn thành',
      message: `${task.chapterTitle || task.chapterId}`,
      action: 'Xem chapter',
      onActionClick: onViewChapter
    });

    // Browser notification (if in background)
    if (document.hidden) {
      await this.showBrowserNotification({
        title: '✅ Download hoàn thành',
        body: `${task.mangaTitle} - ${task.chapterTitle}`,
        tag: `download-complete-${task.id}`,
        onClick: onViewChapter
      });
    }
  }

  /**
   * Notify when download fails
   */
  async notifyDownloadFailed(task, onRetry) {
    // Toast notification
    this.showToast({
      type: 'error',
      title: 'Download thất bại',
      message: task.error || `${task.chapterTitle || task.chapterId}`,
      action: 'Thử lại',
      onActionClick: onRetry
    });

    // Browser notification (if in background)
    if (document.hidden) {
      await this.showBrowserNotification({
        title: '❌ Download thất bại',
        body: `${task.mangaTitle} - ${task.chapterTitle}\n${task.error || 'Unknown error'}`,
        tag: `download-failed-${task.id}`,
        onClick: onRetry
      });
    }
  }

  /**
   * Notify when download is paused
   */
  notifyDownloadPaused(task) {
    this.showToast({
      type: 'info',
      title: 'Download đã tạm dừng',
      message: `${task.chapterTitle || task.chapterId}`
    });
  }

  /**
   * Notify when download is cancelled
   */
  notifyDownloadCancelled(task) {
    this.showToast({
      type: 'warning',
      title: 'Download đã hủy',
      message: `${task.chapterTitle || task.chapterId}`
    });
  }

  /**
   * Notify when all downloads complete
   */
  async notifyAllDownloadsComplete(count, onViewQueue) {
    // Toast notification
    this.showToast({
      type: 'success',
      title: 'Tất cả downloads hoàn thành',
      message: `${count} chapter${count > 1 ? 's' : ''} đã tải xong`,
      action: 'Xem queue',
      onActionClick: onViewQueue
    });

    // Browser notification
    if (document.hidden) {
      await this.showBrowserNotification({
        title: '🎉 Tất cả downloads hoàn thành',
        body: `${count} chapter${count > 1 ? 's' : ''} đã tải xong`,
        tag: 'all-downloads-complete',
        onClick: onViewQueue
      });
    }
  }

  /**
   * Notify storage quota warning
   */
  notifyStorageWarning(percentUsed) {
    this.showToast({
      type: 'warning',
      title: 'Bộ nhớ sắp đầy',
      message: `${percentUsed.toFixed(0)}% bộ nhớ đã sử dụng. Xóa các chapters cũ để giải phóng dung lượng.`
    });
  }

  /**
   * Notify storage quota exceeded
   */
  notifyStorageExceeded() {
    this.showToast({
      type: 'error',
      title: 'Hết bộ nhớ',
      message: 'Không thể tải thêm. Vui lòng xóa các chapters cũ.'
    });
  }

  /**
   * Clear all toast notifications
   */
  clearAll() {
    toast.dismiss();
  }
}

// Export singleton instance
export const downloadNotifications = new DownloadNotificationManager();

// Export class for testing
export { DownloadNotificationManager };
