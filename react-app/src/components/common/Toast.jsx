// 📁 src/components/common/Toast.jsx
// 🍞 Toast notification component

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/store';

const Toast = () => {
  const { toast, hideToast } = useUIStore();

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        hideToast();
      }, toast.duration || 3000);

      return () => clearTimeout(timer);
    }
  }, [toast.show, toast.duration, hideToast]);

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const getToastClasses = (type) => {
    const baseClasses = 'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white font-medium';
    
    switch (type) {
      case 'success':
        return `${baseClasses} bg-green-500`;
      case 'error':
        return `${baseClasses} bg-red-500`;
      case 'warning':
        return `${baseClasses} bg-yellow-500`;
      case 'info':
      default:
        return `${baseClasses} bg-blue-500`;
    }
  };

  return (
    <AnimatePresence>
      {toast.show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 min-w-[300px] max-w-[500px]"
        >
          <div className={getToastClasses(toast.type)}>
            <span className="text-lg">{getToastIcon(toast.type)}</span>
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={hideToast}
              className="text-white/80 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;
