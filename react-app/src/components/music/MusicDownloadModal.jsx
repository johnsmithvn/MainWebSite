// 📁 src/components/music/MusicDownloadModal.jsx
// 📥 Music Download Options Modal with queue management

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiDownload, FiMusic, FiList, FiCheck } from 'react-icons/fi';

const MusicDownloadModal = ({ 
  isOpen, 
  onClose, 
  currentTrack,
  currentPlaylist = [],
  onDownload
}) => {
  const [downloadOption, setDownloadOption] = useState('current'); // 'current' or 'playlist'

  const handleDownload = () => {
    if (downloadOption === 'current') {
      onDownload([currentTrack]);
    } else {
      onDownload(currentPlaylist);
    }
    onClose();
  };

  if (!isOpen || !currentTrack) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 rounded-2xl shadow-2xl ring-1 ring-white/10 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <FiDownload className="w-5 h-5 text-green-400" />
              </div>
              <h2 className="text-lg font-semibold">Tải xuống nhạc</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors rounded-lg p-2 hover:bg-white/10"
              aria-label="Đóng"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-4">
            {/* Current Track Info */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="w-12 h-12 rounded bg-gray-700 flex items-center justify-center flex-shrink-0">
                <FiMusic className="w-6 h-6 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{currentTrack.name}</p>
                <p className="text-sm text-gray-400 truncate">
                  {currentTrack.artist || 'Unknown Artist'}
                </p>
              </div>
            </div>

            {/* Download Options */}
            <div className="space-y-3">
              <p className="text-sm text-gray-400 font-medium">Chọn tùy chọn tải xuống:</p>
              
              {/* Option 1: Current Track */}
              <button
                onClick={() => setDownloadOption('current')}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  downloadOption === 'current'
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-white/10 hover:border-white/20 bg-white/5'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  downloadOption === 'current'
                    ? 'border-green-500 bg-green-500'
                    : 'border-gray-400'
                }`}>
                  {downloadOption === 'current' && <FiCheck className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">Bài hát hiện tại</p>
                  <p className="text-sm text-gray-400">Chỉ tải 1 bài hát đang phát</p>
                </div>
                <FiMusic className="w-5 h-5 text-gray-400" />
              </button>

              {/* Option 2: Full Playlist */}
              <button
                onClick={() => setDownloadOption('playlist')}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  downloadOption === 'playlist'
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-white/10 hover:border-white/20 bg-white/5'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  downloadOption === 'playlist'
                    ? 'border-green-500 bg-green-500'
                    : 'border-gray-400'
                }`}>
                  {downloadOption === 'playlist' && <FiCheck className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">Toàn bộ danh sách</p>
                  <p className="text-sm text-gray-400">
                    Tải {currentPlaylist.length} bài hát trong playlist
                  </p>
                </div>
                <FiList className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Info */}
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <p className="text-xs text-blue-300 flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">ℹ️</span>
                <span>
                  {downloadOption === 'current' 
                    ? 'Bài hát sẽ được tải xuống ngay lập tức.'
                    : 'Các bài hát sẽ được thêm vào hàng chờ và tải lần lượt. Bạn có thể đóng modal và tiếp tục nghe nhạc.'
                  }
                </span>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-white/5 border-t border-white/10 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg bg-green-600 hover:bg-green-500 transition-colors flex items-center justify-center gap-2"
            >
              <FiDownload className="w-4 h-4" />
              <span>Tải xuống</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MusicDownloadModal;
