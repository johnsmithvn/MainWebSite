// 📁 src/components/common/LoadingOverlay.jsx
// ⏳ Loading overlay component

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LoadingOverlay = ({ loading = false, className = "", message = "Đang tải..." }) => {
  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`absolute inset-0 z-10 flex items-center justify-center bg-black/30 backdrop-blur-sm ${className}`}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-black/70 rounded-xl p-4 shadow-lg"
          >
            <div className="flex flex-col items-center space-y-3">
              <div className="relative">
                <div className="h-8 w-8 rounded-full border-3 border-white/30"></div>
                <div className="absolute inset-0 h-8 w-8 rounded-full border-t-3 border-white animate-spin"></div>
              </div>
              <p className="text-sm font-medium text-white">
                {message}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingOverlay;
