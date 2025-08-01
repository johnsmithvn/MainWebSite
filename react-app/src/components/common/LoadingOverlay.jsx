// 📁 src/components/common/LoadingOverlay.jsx
// ⏳ Loading overlay component

import React from 'react';
import { motion } from 'framer-motion';

const LoadingOverlay = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-white dark:bg-dark-800 rounded-2xl p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-primary-200 dark:border-primary-800"></div>
            <div className="absolute inset-0 h-12 w-12 rounded-full border-t-4 border-primary-600 animate-spin"></div>
          </div>
          <p className="text-lg font-medium text-gray-900 dark:text-white">
            Đang tải...
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LoadingOverlay;
