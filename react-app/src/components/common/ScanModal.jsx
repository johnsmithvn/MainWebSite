// 📁 src/components/common/ScanModal.jsx
// 🔄 Modal để scan folder với path input

import React, { useState, useEffect } from 'react';
import { RefreshCw, Folder, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';

const ScanModal = ({ 
  isOpen = false, 
  onClose, 
  onConfirm,
  type = 'music', // 'manga', 'movie', 'music'
  isScanning = false,
  progress = null // { current, total, message }
}) => {
  const [path, setPath] = useState('');
  const [error, setError] = useState('');
  const [shallow, setShallow] = useState(false);

  // Reset state khi modal đóng
  useEffect(() => {
    if (!isOpen) {
      setPath('');
      setError('');
      setShallow(false);
    }
  }, [isOpen]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && !isScanning) {
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isScanning, onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isScanning) {
      onClose?.();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate path format
    const cleanPath = path.trim();
    
    // Check for backslashes (Windows path)
    if (cleanPath.includes('\\')) {
      setError('❌ Sử dụng dấu / thay vì \\ (ví dụ: Albums/Rock)');
      return;
    }
    
    // Check for leading/trailing slashes
    if (cleanPath.startsWith('/') || cleanPath.endsWith('/')) {
      setError('❌ Không được bắt đầu hoặc kết thúc bằng dấu /');
      return;
    }
    
    // Check for double slashes
    if (cleanPath.includes('//')) {
      setError('❌ Không được có dấu // liên tiếp');
      return;
    }
    
    // Check for invalid characters (basic validation)
    const invalidChars = /[<>:"|?*]/;
    if (invalidChars.test(cleanPath)) {
      setError('❌ Path chứa ký tự không hợp lệ: < > : " | ? *');
      return;
    }
    
    // Remove leading/trailing slashes if any (defensive)
    const finalPath = cleanPath.replace(/^\/+|\/+$/g, '');
    
    onConfirm?.(finalPath, shallow);
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'manga': return 'Manga';
      case 'movie': return 'Movie';
      case 'music': return 'Music';
      default: return 'Media';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleBackdropClick}
        />

        {/* Modal Content */}
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4">
              <div className="flex items-center">
                <div className="mr-3 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <RefreshCw className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Scan {getTypeLabel()} Database
                </h3>
              </div>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit}>
              <div className="px-6 pb-6">
                {/* Info Box */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                  <div className="flex">
                    <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="ml-3">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        Nhập đường dẫn folder để scan (relative path từ root).
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        Để trống để scan toàn bộ database.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Path Input */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Folder className="w-4 h-4 inline mr-1" />
                    Folder Path
                  </label>
                  <input
                    type="text"
                    value={path}
                    onChange={(e) => {
                      setPath(e.target.value);
                      setError('');
                    }}
                    placeholder="Ví dụ: Albums/Rock hoặc để trống"
                    disabled={isScanning}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {error && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {error}
                    </p>
                  )}
                </div>

                {/* Shallow scan checkbox */}
                <div className="mb-4">
                  <label className="flex items-start space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50/60 dark:bg-gray-700/30 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={shallow}
                      onChange={(e) => setShallow(e.target.checked)}
                      disabled={isScanning}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <div className="text-sm text-left flex-1">
                      <p className="font-semibold text-gray-800 dark:text-gray-100">
                        Scan Shallow (không đệ quy)
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Chỉ quét các items ở level hiện tại, không quét vào các folder con. 
                        Lưu ý <span className="text-red-600 dark:text-red-400 font-semibold">chỉ sử dụng cho root</span> (không truyền path) vì bug logic delete.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Examples */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Ví dụ paths:</p>
                  <div className="flex flex-wrap gap-2">
                    {['New folder', '/', 'New folder/Rock'].map((example) => (
                      <button
                        key={example}
                        type="button"
                        onClick={() => setPath(example)}
                        disabled={isScanning}
                        className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Progress indicator */}
                {isScanning && progress && (
                  <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-700 dark:text-gray-300">
                        {progress.message || 'Đang scan...'}
                      </span>
                      {progress.total > 0 && (
                        <span className="text-gray-600 dark:text-gray-400">
                          {progress.current}/{progress.total}
                        </span>
                      )}
                    </div>
                    {progress.total > 0 && (
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <motion.div
                          className="bg-blue-500 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ 
                            width: `${Math.min((progress.current / progress.total) * 100, 100)}%` 
                          }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Success message */}
                {!isScanning && progress?.success && (
                  <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <div className="ml-3">
                        <p className="text-sm text-green-800 dark:text-green-200">
                          {progress.message || 'Scan hoàn tất!'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end space-x-3 px-6 py-4 bg-gray-50 dark:bg-gray-700 rounded-b-lg">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isScanning}
                >
                  {progress?.success ? 'Đóng' : (isScanning ? 'Đang scan...' : 'Hủy')}
                </Button>
                {!progress?.success && (
                  <Button
                    type="submit"
                    disabled={isScanning}
                    className="flex items-center gap-2"
                  >
                    {isScanning ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Đang scan...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Bắt đầu Scan
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default ScanModal;
