import React from 'react';
import { X, HardDrive, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { STORAGE_CRITICAL_THRESHOLD, STORAGE_WARNING_THRESHOLD } from '../../utils/storageQuota';

const StorageQuotaModal = ({ 
  isOpen, 
  onClose, 
  storageInfo, 
  estimatedSize, 
  canDownload, 
  message, 
  warning,
  onConfirm,
  onCancel,
  chapterTitle = ''
}) => {
  if (!isOpen) return null;

  const getStatusColor = () => {
    if (!canDownload) return 'text-red-400';
    if (warning) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getStatusIcon = () => {
    if (!canDownload) return <XCircle className="w-6 h-6 text-red-400" />;
    if (warning) return <AlertTriangle className="w-6 h-6 text-yellow-400" />;
    return <CheckCircle className="w-6 h-6 text-green-400" />;
  };

  const getProgressBarColor = () => {
    const percentage = storageInfo.percentage * 100;
    if (percentage >= STORAGE_CRITICAL_THRESHOLD * 100) return 'bg-red-500';
    if (percentage >= STORAGE_WARNING_THRESHOLD * 100) return 'bg-yellow-500';
    if (percentage >= 75) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    if (i === 0) return bytes + ' B';
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-gray-900 text-gray-100 rounded-xl shadow-2xl ring-1 ring-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <HardDrive className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold">Storage Quota Check</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors rounded-md p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Chapter Info */}
          {chapterTitle && (
            <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-300">Chapter</h3>
              <p className="text-white font-medium">{chapterTitle}</p>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center gap-3 mb-4">
            {getStatusIcon()}
            <div>
              <p className={`font-medium ${getStatusColor()}`}>
                {canDownload ? 'Có thể download' : 'Không thể download'}
              </p>
              <p className="text-sm text-gray-400">{message}</p>
            </div>
          </div>

          {/* Warning */}
          {warning && (
            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <p className="text-sm text-yellow-300">{warning}</p>
              </div>
            </div>
          )}

          {/* Storage Progress */}
          {storageInfo.supported && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-300">Storage Usage</span>
                <span className="text-sm text-gray-400">
                  {Math.round(storageInfo.percentage * 100)}%
                </span>
              </div>
              
              <div className="w-full bg-gray-700 rounded-full h-3 mb-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${getProgressBarColor()}`}
                  style={{ width: `${Math.round(storageInfo.percentage * 100)}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Đã sử dụng</p>
                  <p className="font-medium text-white">{storageInfo.usageFormatted}</p>
                </div>
                <div>
                  <p className="text-gray-400">Còn lại</p>
                  <p className="font-medium text-white">{storageInfo.availableFormatted}</p>
                </div>
                <div>
                  <p className="text-gray-400">Tổng dung lượng</p>
                  <p className="font-medium text-white">{storageInfo.quotaFormatted}</p>
                </div>
                {estimatedSize && (
                  <div>
                    <p className="text-gray-400">Cần download</p>
                    <p className="font-medium text-white">{formatBytes(estimatedSize)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Not Supported */}
          {!storageInfo.supported && (
            <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
              <p className="text-sm text-gray-400">
                Trình duyệt không hỗ trợ Storage API. Download sẽ tiếp tục bình thường.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-800/50 border-t border-white/10">
          <button
            onClick={onCancel || onClose}
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            Hủy
          </button>
          {canDownload && onConfirm && (
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              Tiếp tục download
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StorageQuotaModal;
