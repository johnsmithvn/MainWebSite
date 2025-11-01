// 📁 src/components/common/DownloadProgressModal.jsx
// 📥 Download progress modal component

import React from 'react';
import { X, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { PROGRESS_COLORS } from '@/constants/colors';
import { formatBytes } from '@/utils/formatters';

const DownloadProgressModal = ({
  isOpen,
  onClose,
  progress,
  isDownloading,
  chapterTitle = 'Chapter'
}) => {
  if (!isOpen) return null;

  // Handle keyboard navigation for modal close
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && !isDownloading && progress.status === 'completed') {
      onClose();
    }
  };

  // Handle overlay click to close modal
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !isDownloading && progress.status === 'completed') {
      onClose();
    }
  };

  const getStatusColor = () => {
    switch (progress.status) {
      case 'completed': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'downloading': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (progress.status) {
      case 'completed': return <CheckCircle size={20} className="text-green-400" />;
      case 'error': return <AlertCircle size={20} className="text-red-400" />;
      case 'downloading': return <Download size={20} className="text-blue-400 animate-bounce" />;
      default: return <Download size={20} className="text-gray-400" />;
    }
  };

  const progressPercentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      tabIndex={progress.status === 'completed' && !isDownloading ? 0 : -1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="download-modal-title"
      aria-describedby="download-modal-description"
    >
      <div className="relative w-full max-w-md bg-gray-900 text-gray-100 rounded-xl shadow-2xl ring-1 ring-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <h2 id="download-modal-title" className="text-lg font-semibold">Download Chapter</h2>
          </div>
          {progress.status === 'completed' && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Đóng"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Content */}
        <div id="download-modal-description" className="px-6 py-6 space-y-4">
          {/* Chapter info */}
          <div>
            <p className="text-sm text-gray-400 mb-1">Đang tải:</p>
            <p className="font-medium text-white truncate">{chapterTitle}</p>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className={getStatusColor()}>
                {progress.status === 'starting' && 'Đang khởi tạo...'}
                {progress.status === 'downloading' && 'Đang tải...'}
                {progress.status === 'completed' && 'Hoàn thành!'}
                {progress.status === 'error' && 'Có lỗi xảy ra'}
              </span>
              <span className="text-gray-300">
                {progress.current} / {progress.total}
              </span>
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  progress.status === 'completed' ? PROGRESS_COLORS.completed :
                  progress.status === 'error' ? PROGRESS_COLORS.error :
                  PROGRESS_COLORS.downloading
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            
            <div className="text-center text-sm text-gray-400">
              {progressPercentage}%
            </div>
          </div>

          {/* Current page info */}
          {progress.status === 'downloading' && progress.currentUrl && (
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Trang hiện tại:</p>
              <p className="text-xs text-gray-300 font-mono truncate">
                {progress.currentUrl.split('/').pop()}
              </p>
            </div>
          )}

          {/* Error message */}
          {progress.status === 'error' && progress.error && (
            <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-3">
              <p className="text-sm text-red-400">{progress.error}</p>
            </div>
          )}

          {/* Completion info */}
          {progress.status === 'completed' && progress.totalBytes && (
            <div className="bg-green-900/20 border border-green-500/20 rounded-lg p-3">
              <p className="text-sm text-green-400">
                Đã tải thành công {progress.total} trang 
                {progress.totalBytes && ` (${formatBytes(progress.totalBytes)})`}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isDownloading && (
          <div className="px-6 py-4 bg-gray-800/60 border-t border-white/5">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-sm font-medium rounded-md bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            >
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DownloadProgressModal;
