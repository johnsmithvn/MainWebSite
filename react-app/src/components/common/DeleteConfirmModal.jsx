// 📁 src/components/common/DeleteConfirmModal.jsx
// 🗑️ Reusable delete confirmation modal

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';

const DeleteConfirmModal = ({
  isOpen = false,
  onClose,
  onConfirm,
  title = 'Xác nhận xóa',
  itemName = '',
  itemType = 'item', // 'item', 'folder', 'file'
  description = '',
  isDeleting = false,
  children
}) => {
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isDeleting) {
      onClose?.();
    }
  };

  const handleConfirm = () => {
    onConfirm?.();
  };

  // Close on Escape key
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
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
  }, [isOpen, isDeleting, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
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
              className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {title}
                  </h3>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-4">
                {children ? (
                  children
                ) : (
                  <>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      {itemType === 'folder' ? (
                        <>
                          Bạn có chắc muốn xóa folder{' '}
                          <span className="font-semibold text-gray-900 dark:text-white">
                            "{itemName}"
                          </span>{' '}
                          khỏi database?
                        </>
                      ) : (
                        <>
                          Bạn có chắc muốn xóa{' '}
                          <span className="font-semibold text-gray-900 dark:text-white">
                            "{itemName}"
                          </span>{' '}
                          khỏi database?
                        </>
                      )}
                    </p>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        <span className="font-semibold">⚠️ Lưu ý:</span>
                      </p>
                      <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 space-y-1 ml-4">
                        {itemType === 'folder' ? (
                          <>
                            <li>• Folder và tất cả nội dung bên trong sẽ bị xóa khỏi database</li>
                            <li>• Tất cả metadata liên quan sẽ bị xóa (songs, playlists)</li>
                            <li>• File trên disk vẫn được giữ nguyên</li>
                          </>
                        ) : (
                          <>
                            <li>• Item sẽ bị xóa khỏi database</li>
                            <li>• Metadata và references liên quan sẽ bị xóa</li>
                            <li>• File trên disk vẫn được giữ nguyên</li>
                          </>
                        )}
                      </ul>
                    </div>

                    {description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                        {description}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-end gap-3">
                  <Button
                    variant="secondary"
                    onClick={onClose}
                    disabled={isDeleting}
                  >
                    Hủy
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleConfirm}
                    disabled={isDeleting}
                    className="min-w-[100px]"
                  >
                    {isDeleting ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang xóa...
                      </span>
                    ) : (
                      'Xóa'
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DeleteConfirmModal;
