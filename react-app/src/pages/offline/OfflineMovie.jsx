// 📁 src/pages/offline/OfflineMovie.jsx
// 🎬 Offline movie library page (placeholder)

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Film, Download } from 'lucide-react';
import Button from '../../components/common/Button';

const OfflineMovie = () => {
  const navigate = useNavigate();

  const handleBackToOfflineHome = () => {
    navigate('/offline');
  };

  const handleGoToMovies = () => {
    navigate('/movie');
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
              🎬 Movie Offline
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Thư viện phim đã tải xuống
            </p>
          </div>
        </div>
      </div>

      {/* Coming Soon Content */}
      <div className="text-center py-16">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 max-w-lg mx-auto">
          <div className="text-8xl mb-6">🎬</div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Tính năng đang phát triển
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            Chức năng xem phim offline đang được phát triển. 
            Bạn sẽ có thể tải xuống và xem phim mà không cần kết nối internet trong tương lai gần.
          </p>

          {/* Features Preview */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Tính năng sẽ có:
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 text-left">
              <li className="flex items-center gap-2">
                <Download className="w-4 h-4 text-green-500" />
                Tải xuống phim để xem offline
              </li>
              <li className="flex items-center gap-2">
                <Film className="w-4 h-4 text-blue-500" />
                Quản lý thư viện phim offline
              </li>
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 bg-purple-500 rounded text-xs flex items-center justify-center text-white">
                  HD
                </span>
                Hỗ trợ nhiều chất lượng video
              </li>
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 bg-orange-500 rounded text-xs flex items-center justify-center text-white">
                  ⚡
                </span>
                Tiếp tục xem từ vị trí đã dừng
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <Button
              onClick={handleGoToMovies}
              className="flex items-center gap-2"
            >
              <Film className="w-4 h-4" />
              Xem phim online
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

export default OfflineMovie;
