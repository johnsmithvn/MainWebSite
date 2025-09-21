// 📁 src/pages/offline/OfflineMusic.jsx
// 🎵 Offline music library page (placeholder)

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Music, Download, PlayCircle, ListMusic } from 'lucide-react';
import Button from '../../components/common/Button';

const OfflineMusic = () => {
  const navigate = useNavigate();

  const handleBackToOfflineHome = () => {
    navigate('/offline');
  };

  const handleGoToMusic = () => {
    navigate('/music');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            onClick={handleBackToOfflineHome}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              🎵 Music Offline
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Thư viện nhạc đã tải xuống
            </p>
          </div>
        </div>
      </div>

      {/* Coming Soon Content */}
      <div className="text-center py-16">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 max-w-lg mx-auto">
          <div className="text-8xl mb-6">🎵</div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Tính năng đang phát triển
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            Chức năng nghe nhạc offline đang được phát triển. 
            Bạn sẽ có thể tải xuống và nghe nhạc mà không cần kết nối internet trong tương lai gần.
          </p>

          {/* Features Preview */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Tính năng sẽ có:
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 text-left">
              <li className="flex items-center gap-2">
                <Download className="w-4 h-4 text-green-500" />
                Tải xuống bài hát và album để nghe offline
              </li>
              <li className="flex items-center gap-2">
                <ListMusic className="w-4 h-4 text-blue-500" />
                Tạo và quản lý playlist offline
              </li>
              <li className="flex items-center gap-2">
                <PlayCircle className="w-4 h-4 text-purple-500" />
                Phát nhạc liên tục không cần mạng
              </li>
              <li className="flex items-center gap-2">
                <Music className="w-4 h-4 text-orange-500" />
                Đồng bộ metadata và lyrics
              </li>
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 bg-red-500 rounded text-xs flex items-center justify-center text-white">
                  ♫
                </span>
                Hỗ trợ nhiều định dạng âm thanh
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <Button
              onClick={handleGoToMusic}
              className="flex items-center gap-2"
            >
              <Music className="w-4 h-4" />
              Nghe nhạc online
            </Button>
            <Button
              onClick={handleBackToOfflineHome}
              variant="outline"
            >
              Quay lại trang chính
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflineMusic;
