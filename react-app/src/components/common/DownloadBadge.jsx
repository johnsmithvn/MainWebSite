// 📁 src/components/common/DownloadBadge.jsx
// 📥 Floating Download Badge Component

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useDownloadQueueStore, { DOWNLOAD_STATUS } from '../../store/downloadQueueStore';

/**
 * Floating Download Badge Component
 * Shows when there are active downloads with progress ring and counter
 * Positioned fixed bottom-right, navigates to /downloads on click
 * 
 * @component
 * @returns {JSX.Element|null}
 */
const DownloadBadge = () => {
  const navigate = useNavigate();

  // Subscribe to store
  const { tasks, activeDownloads } = useDownloadQueueStore();

  // Calculate total progress across all active downloads
  const totalProgress = useMemo(() => {
    if (activeDownloads.size === 0) return 0;

    const activeTasksArray = Array.from(tasks.values()).filter(task =>
      task.status === DOWNLOAD_STATUS.DOWNLOADING
    );

    if (activeTasksArray.length === 0) return 0;

    const totalProgressSum = activeTasksArray.reduce(
      (sum, task) => sum + task.progress,
      0
    );

    return totalProgressSum / activeTasksArray.length;
  }, [tasks, activeDownloads]);

  // Don't render if no active downloads
  if (activeDownloads.size === 0) return null;

  // SVG circle calculations for progress ring
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (totalProgress / 100) * circumference;

  const handleClick = () => {
    navigate('/downloads');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="fixed bottom-6 right-6 z-50"
        style={{ zIndex: 9999 }}
      >
        <div className="relative group">
          {/* Main Button */}
          <button
            onClick={handleClick}
            className="relative w-14 h-14 rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group-hover:scale-110"
            aria-label={`${activeDownloads.size} downloads in progress`}
          >
            {/* Download Icon */}
            <Download className="w-6 h-6" />

            {/* Progress Ring */}
            <svg
              className="absolute top-0 left-0 w-full h-full -rotate-90"
              style={{ filter: 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))' }}
            >
              {/* Background Circle */}
              <circle
                cx="28"
                cy="28"
                r={radius}
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="3"
                fill="none"
              />
              {/* Progress Circle */}
              <circle
                cx="28"
                cy="28"
                r={radius}
                stroke="rgba(255, 255, 255, 0.9)"
                strokeWidth="3"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{
                  transition: 'stroke-dashoffset 0.3s ease'
                }}
              />
            </svg>

            {/* Counter Badge */}
            <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-dark-900 shadow-md animate-pulse">
              {activeDownloads.size}
            </span>
          </button>

          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-gray-900 dark:bg-dark-700 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
              <div className="font-semibold mb-1">
                {activeDownloads.size} download{activeDownloads.size > 1 ? 's' : ''} đang chạy
              </div>
              <div className="text-gray-300 dark:text-gray-400">
                {Math.round(totalProgress)}% hoàn thành
              </div>
              <div className="text-gray-400 dark:text-gray-500 text-[10px] mt-1">
                Click để xem chi tiết
              </div>
              {/* Arrow */}
              <div className="absolute top-full right-4 w-2 h-2 bg-gray-900 dark:bg-dark-700 transform rotate-45 -mt-1" />
            </div>
          </div>

          {/* Pulse Animation (when downloading) */}
          <div className="absolute inset-0 rounded-full bg-primary-500 opacity-20 animate-ping" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DownloadBadge;
