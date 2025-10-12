// 📁 src/pages/downloads/DownloadTaskCard.jsx
// 📋 Individual Download Task Card Component

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  X,
  RotateCcw,
  Trash2,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Ban,
  FolderOpen
} from 'lucide-react';
import useDownloadQueueStore, { DOWNLOAD_STATUS } from '../../store/downloadQueueStore';
import { toast } from 'react-hot-toast';
import { formatFileSize, formatDuration } from '../../utils/formatters';

/**
 * Download Task Card Component
 * Displays individual download task with progress and controls
 * 
 * @component
 * @param {Object} props
 * @param {Object} props.task - Download task object
 * @returns {JSX.Element}
 */
const DownloadTaskCard = ({ task }) => {
  const navigate = useNavigate();
  const [showActions, setShowActions] = useState(false);

  // Store actions
  const {
    pauseTask,
    resumeTask,
    cancelTask,
    retryTask,
    removeFromQueue
  } = useDownloadQueueStore();

  // Calculate time info
  const timeInfo = useMemo(() => {
    if (!task.startedAt) return null;

    const elapsed = task.completedAt 
      ? task.completedAt - task.startedAt
      : Date.now() - task.startedAt;

    if (task.status === DOWNLOAD_STATUS.DOWNLOADING && task.progress > 0) {
      const estimatedTotal = (elapsed / task.progress) * 100;
      const remaining = estimatedTotal - elapsed;
      return {
        elapsed,
        remaining: remaining > 0 ? remaining : 0,
        speed: task.downloadedSize / (elapsed / 1000) // bytes per second
      };
    }

    return { elapsed, remaining: 0, speed: 0 };
  }, [task]);

  // Status config
  const statusConfig = {
    [DOWNLOAD_STATUS.PENDING]: {
      icon: Clock,
      text: 'Chờ tải',
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-100 dark:bg-yellow-900/30'
    },
    [DOWNLOAD_STATUS.DOWNLOADING]: {
      icon: Loader2,
      text: 'Đang tải',
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      animate: true
    },
    [DOWNLOAD_STATUS.COMPLETED]: {
      icon: CheckCircle,
      text: 'Hoàn thành',
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900/30'
    },
    [DOWNLOAD_STATUS.FAILED]: {
      icon: XCircle,
      text: 'Thất bại',
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-100 dark:bg-red-900/30'
    },
    [DOWNLOAD_STATUS.PAUSED]: {
      icon: Pause,
      text: 'Tạm dừng',
      color: 'text-gray-600 dark:text-gray-400',
      bg: 'bg-gray-100 dark:bg-gray-700'
    },
    [DOWNLOAD_STATUS.CANCELLED]: {
      icon: Ban,
      text: 'Đã hủy',
      color: 'text-gray-600 dark:text-gray-400',
      bg: 'bg-gray-100 dark:bg-gray-700'
    }
  };

  const status = statusConfig[task.status] || statusConfig[DOWNLOAD_STATUS.PENDING];
  const StatusIcon = status.icon;

  // Action handlers
  const handlePause = () => {
    try {
      pauseTask(task.id);
      toast.success('Đã tạm dừng download');
    } catch (error) {
      toast.error('Không thể tạm dừng: ' + error.message);
    }
  };

  const handleResume = () => {
    try {
      resumeTask(task.id);
      toast.success('Đã tiếp tục download');
    } catch (error) {
      toast.error('Không thể tiếp tục: ' + error.message);
    }
  };

  const handleCancel = () => {
    try {
      cancelTask(task.id);
      toast.success('Đã hủy download');
    } catch (error) {
      toast.error('Không thể hủy: ' + error.message);
    }
  };

  const handleRetry = () => {
    try {
      retryTask(task.id);
      toast.success('Đang thử lại download');
    } catch (error) {
      toast.error('Không thể thử lại: ' + error.message);
    }
  };

  const handleDelete = () => {
    try {
      removeFromQueue(task.id);
      toast.success('Đã xóa khỏi danh sách');
    } catch (error) {
      toast.error('Không thể xóa: ' + error.message);
    }
  };

  const handleViewChapter = () => {
    // ✅ Validate and encode path components
    const source = typeof task.source === 'string' ? task.source : '';
    const mangaId = typeof task.mangaId === 'string' ? task.mangaId : '';
    const chapterId = typeof task.chapterId === 'string' ? task.chapterId : '';
    
    if (!source || !mangaId || !chapterId) {
      toast.error('Không thể mở chapter: thông tin không hợp lệ');
      return;
    }
    
    const encodedSource = encodeURIComponent(source);
    const encodedMangaId = encodeURIComponent(mangaId);
    const encodedChapterId = encodeURIComponent(chapterId);
    
    // Navigate to manga reader with this chapter
    navigate(`/manga/reader/${encodedChapterId}`, {
      state: {
        source: encodedSource,
        mangaPath: `${encodedSource}/${encodedMangaId}`,
        chapterPath: `${encodedSource}/${encodedMangaId}/${encodedChapterId}`
      }
    });
  };

  return (
    <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {/* Status Icon */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full ${status.bg} flex items-center justify-center`}>
          <StatusIcon className={`w-5 h-5 ${status.color} ${status.animate ? 'animate-spin' : ''}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                {task.mangaTitle}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {task.chapterTitle}
              </p>
            </div>

            {/* Source Badge */}
            <span className="flex-shrink-0 px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded">
              {task.source}
            </span>
          </div>

          {/* Progress Bar */}
          {(task.status === DOWNLOAD_STATUS.DOWNLOADING || task.status === DOWNLOAD_STATUS.PAUSED) && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                <span>{task.currentPage} / {task.totalPages} pages</span>
                <span>{Math.round(task.progress)}%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Info Row */}
          <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 mb-3">
            {/* Status */}
            <span className={`flex items-center gap-1 ${status.color}`}>
              <StatusIcon className="w-3 h-3" />
              {status.text}
            </span>

            {/* Size */}
            {task.downloadedSize > 0 && (
              <span>
                {formatFileSize(task.downloadedSize)}
                {task.totalSize > 0 && ` / ${formatFileSize(task.totalSize)}`}
              </span>
            )}

            {/* Time */}
            {timeInfo && timeInfo.elapsed > 0 && (
              <>
                <span>⏱️ {formatDuration(timeInfo.elapsed)}</span>
                {task.status === DOWNLOAD_STATUS.DOWNLOADING && timeInfo.remaining > 0 && (
                  <span>còn ~{formatDuration(timeInfo.remaining)}</span>
                )}
              </>
            )}

            {/* Speed */}
            {timeInfo && timeInfo.speed > 0 && task.status === DOWNLOAD_STATUS.DOWNLOADING && (
              <span>⚡ {formatFileSize(timeInfo.speed)}/s</span>
            )}

            {/* Retry count */}
            {task.retryCount > 0 && (
              <span className="text-yellow-600 dark:text-yellow-400">
                🔄 Thử lại {task.retryCount}
              </span>
            )}
          </div>

          {/* Error Message */}
          {task.error && (
            <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-400">
              ⚠️ {task.error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Downloading: Pause, Cancel */}
            {task.status === DOWNLOAD_STATUS.DOWNLOADING && (
              <>
                <button
                  onClick={handlePause}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-dark-700 rounded hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors flex items-center gap-1"
                >
                  <Pause className="w-3 h-3" />
                  Tạm dừng
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Hủy
                </button>
              </>
            )}

            {/* Paused: Resume, Cancel */}
            {task.status === DOWNLOAD_STATUS.PAUSED && (
              <>
                <button
                  onClick={handleResume}
                  className="px-3 py-1.5 text-xs font-medium text-primary-700 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30 rounded hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors flex items-center gap-1"
                >
                  <Play className="w-3 h-3" />
                  Tiếp tục
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Hủy
                </button>
              </>
            )}

            {/* Failed: Retry, Delete */}
            {task.status === DOWNLOAD_STATUS.FAILED && (
              <>
                <button
                  onClick={handleRetry}
                  className="px-3 py-1.5 text-xs font-medium text-primary-700 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30 rounded hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Thử lại
                </button>
                <button
                  onClick={handleDelete}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-dark-700 rounded hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Xóa
                </button>
              </>
            )}

            {/* Completed: View, Delete */}
            {task.status === DOWNLOAD_STATUS.COMPLETED && (
              <>
                <button
                  onClick={handleViewChapter}
                  className="px-3 py-1.5 text-xs font-medium text-primary-700 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30 rounded hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors flex items-center gap-1"
                >
                  <FolderOpen className="w-3 h-3" />
                  Xem chapter
                </button>
                <button
                  onClick={handleDelete}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-dark-700 rounded hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Xóa
                </button>
              </>
            )}

            {/* Cancelled: Delete */}
            {task.status === DOWNLOAD_STATUS.CANCELLED && (
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-dark-700 rounded hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Xóa
              </button>
            )}

            {/* Pending: Cancel */}
            {task.status === DOWNLOAD_STATUS.PENDING && (
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Hủy
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadTaskCard;
