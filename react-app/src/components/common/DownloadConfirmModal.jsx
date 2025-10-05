// 📁 src/components/common/DownloadConfirmModal.jsx
// ⚠️ Download confirmation modal with re-download warning

import React from 'react';
import { X, Download, AlertTriangle, Loader2 } from 'lucide-react';

const DownloadConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  isAlreadyDownloaded = false,
  chapterTitle = 'Chapter'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-gray-900 text-gray-100 rounded-xl shadow-2xl ring-1 ring-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            {isAlreadyDownloaded ? (
              <AlertTriangle size={20} className="text-yellow-400" />
            ) : (
              <Download size={20} className="text-blue-400" />
            )}
            <h2 className="text-lg font-semibold">
              {isAlreadyDownloaded ? 'Cảnh báo' : 'Xác nhận tải xuống'}
            </h2>
          </div>
          {!isLoading && (
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
        <div className="px-6 py-6 space-y-4">
          {isLoading ? (
            // Loading state
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 size={40} className="text-blue-400 animate-spin" />
              <p className="text-sm text-gray-400">Đang kiểm tra dung lượng...</p>
            </div>
          ) : (
            <>
              {/* Chapter info */}
              <div>
                <p className="text-sm text-gray-400 mb-2">Chapter:</p>
                <p className="font-medium text-white bg-gray-800 rounded-lg px-4 py-2 truncate">
                  {chapterTitle}
                </p>
              </div>

              {/* Warning or Info */}
              {isAlreadyDownloaded ? (
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 space-y-2">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle size={18} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-400 mb-1">
                        Chapter đã được tải xuống
                      </p>
                      <p className="text-xs text-gray-400">
                        Nếu tiếp tục, chapter cũ sẽ bị xóa và tải lại từ đầu. 
                        Bạn có chắc chắn muốn tải lại không?
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <Download size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-blue-400">
                        Chapter sẽ được tải xuống để đọc offline. Bạn có muốn tiếp tục không?
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!isLoading && (
          <div className="px-6 py-4 bg-gray-800/60 border-t border-white/5 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium rounded-md bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 text-white transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 text-white transition-colors ${
                isAlreadyDownloaded
                  ? 'bg-yellow-600 hover:bg-yellow-500 focus:ring-yellow-500'
                  : 'bg-blue-600 hover:bg-blue-500 focus:ring-blue-500'
              }`}
            >
              {isAlreadyDownloaded ? 'Tải lại' : 'Tải xuống'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DownloadConfirmModal;
