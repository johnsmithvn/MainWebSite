// 📁 src/components/common/Modal.jsx
// 🔔 Modal component chung cho confirm, alert, và custom content

import React, { useEffect, useState } from 'react';
import { X, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';

const ModalBase = ({
  isOpen = false,
  onClose,
  onConfirm,
  title = '',
  message = '',
  type = 'default', // 'default', 'confirm', 'success', 'warning', 'error'
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  children,
  className = '',
  showCloseButton = true,
  closeOnBackdrop = true,
  size = 'md' // 'sm', 'md', 'lg', 'xl'
}) => {
  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
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
  }, [isOpen, onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && closeOnBackdrop) {
      onClose?.();
    }
  };

  const handleConfirm = () => {
    onConfirm?.();
    onClose?.();
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-red-500" />;
      case 'confirm':
        return <AlertTriangle className="w-6 h-6 text-orange-500" />;
      default:
        return <Info className="w-6 h-6 text-blue-500" />;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'max-w-sm';
      case 'lg':
        return 'max-w-2xl';
      case 'xl':
        return 'max-w-4xl';
      default:
        return 'max-w-md';
    }
  };

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
              className={`relative w-full ${getSizeClasses()} bg-white dark:bg-gray-800 rounded-lg shadow-xl ${className}`}
            >
              {/* Header */}
              {(title || showCloseButton) && (
                <div className="flex items-center justify-between p-6 pb-4">
                  <div className="flex items-center">
                    {(type !== 'default' || message) && (
                      <div className="mr-3">
                        {getIcon()}
                      </div>
                    )}
                    {title && (
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {typeof title === 'string' ? title : title.title || ''}
                      </h3>
                    )}
                  </div>
                  {showCloseButton && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClose}
                      className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  )}
                </div>
              )}

              {/* Body */}
              <div className="px-6 pb-6">
                {message && (
                  <div className="text-gray-600 dark:text-gray-300 mb-6">
                    {typeof message === 'string' ? (
                      <p>{message}</p>
                    ) : (
                      message
                    )}
                  </div>
                )}
                {children}
              </div>

              {/* Footer - Show buttons for confirm type or when onConfirm is provided */}
              {(type === 'confirm' || onConfirm) && (
                <div className="flex justify-end space-x-3 px-6 py-4 bg-gray-50 dark:bg-gray-700 rounded-b-lg">
                  <Button
                    variant="outline"
                    onClick={onClose}
                  >
                    {cancelText}
                  </Button>
                  <Button
                    variant={type === 'error' || type === 'warning' ? 'danger' : 'primary'}
                    onClick={handleConfirm}
                  >
                    {confirmText}
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Hook để sử dụng Modal dễ dàng hơn
export const useModal = () => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'default',
    title: '',
    message: '',
    onConfirm: null
  });

  const openModal = (config) => {
    setModalState({
      isOpen: true,
      ...config
    });
  };

  const closeModal = () => {
    setModalState(prev => ({
      ...prev,
      isOpen: false
    }));
  };

  const confirmModal = (config) => {
    // Support both object config and legacy (title, message, type) params
    let modalConfig;
    
    if (typeof config === 'string') {
      // Legacy format: confirmModal(title, message, type)
      const title = config;
      const message = arguments[1];
      const type = arguments[2] || 'confirm';
      modalConfig = { title, message, type };
    } else {
      // New object format: confirmModal({ title, message, ... })
      modalConfig = { type: 'confirm', ...config };
    }
    
    return new Promise((resolve) => {
      openModal({
        ...modalConfig,
        onConfirm: () => {
          closeModal();
          if (modalConfig.onConfirm) modalConfig.onConfirm();
          resolve(true);
        },
        onClose: () => {
          closeModal();
          resolve(false);
        }
      });
    });
  };

  const alertModal = (config) => {
    openModal({
      type: 'info',
      ...config
    });
  };

  const errorModal = (config) => {
    openModal({
      type: 'error',
      ...config
    });
  };

  const successModal = (config) => {
    openModal({
      type: 'success',
      ...config
    });
  };

  return {
    modalState,
    openModal,
    closeModal,
    confirmModal,
    alertModal,
    errorModal,
    successModal,
    Modal: (props) => {
      return (
        <ModalBase
          {...modalState}
          {...props}
          isOpen={modalState.isOpen}
          onClose={modalState.onClose || closeModal}
          onConfirm={modalState.onConfirm}
        />
      );
    }
  };
};

export default ModalBase;
