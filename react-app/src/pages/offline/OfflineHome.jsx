// 📁 src/pages/offline/OfflineHome.jsx
// 🏠 Offline mode selection page

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServiceWorker } from '@/hooks/useServiceWorker';

const OfflineHome = () => {
  const navigate = useNavigate();
  const { supported, ready, controller } = useServiceWorker();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto redirect to main app when online
      setTimeout(() => {
        navigate('/');
      }, 2000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [navigate]);

  const handleModeSelect = (mode) => {
    switch (mode) {
      case 'manga':
        navigate('/offline-manga');
        break;
      case 'movie':
        navigate('/offline-movie');
        break;
      case 'music':
        navigate('/offline-music');
        break;
      default:
        break;
    }
  };

  const handleRetryConnection = () => {
    window.location.reload();
  };

  const handleGoToMain = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center p-5">
      <div className="text-center max-w-lg w-full">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">📱 Offline Mode</h1>
          <div className="flex items-center justify-center mb-4">
            <div className={`w-2 h-2 rounded-full mr-2 ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400 animate-pulse'}`}></div>
            <span className="text-sm opacity-90">
              {isOnline ? 'Đã kết nối - đang chuyển hướng...' : 'Không có kết nối mạng'}
            </span>
          </div>
          <p className="text-lg opacity-90">
            Chọn loại nội dung bạn muốn truy cập offline
          </p>
        </div>

        {/* Mode Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Manga Mode */}
          <div 
            onClick={() => handleModeSelect('manga')}
            className="bg-white/20 backdrop-blur-lg border-2 border-white/30 rounded-2xl p-8 cursor-pointer transition-all duration-300 hover:transform hover:-translate-y-2 hover:bg-white/30 hover:border-white/50 hover:shadow-2xl group"
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">📚</div>
            <h3 className="text-xl font-semibold mb-2">Manga</h3>
            <p className="text-sm opacity-80">Đọc truyện offline</p>
          </div>

          {/* Movie Mode - Coming Soon */}
          <div className="bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-2xl p-8 opacity-60 cursor-not-allowed relative">
            <div className="absolute top-2 right-2 bg-white/20 px-2 py-1 rounded-full text-xs font-medium">
              Soon
            </div>
            <div className="text-5xl mb-4">🎬</div>
            <h3 className="text-xl font-semibold mb-2">Movie</h3>
            <p className="text-sm opacity-80">Xem phim offline</p>
          </div>

          {/* Music Mode - Coming Soon */}
          <div className="bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-2xl p-8 opacity-60 cursor-not-allowed relative">
            <div className="absolute top-2 right-2 bg-white/20 px-2 py-1 rounded-full text-xs font-medium">
              Soon
            </div>
            <div className="text-5xl mb-4">🎵</div>
            <h3 className="text-xl font-semibold mb-2">Music</h3>
            <p className="text-sm opacity-80">Nghe nhạc offline</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center flex-wrap">
          <button
            onClick={handleRetryConnection}
            className="bg-white/20 border-2 border-white/30 px-6 py-3 rounded-lg hover:bg-white/30 hover:transform hover:-translate-y-1 transition-all duration-300"
          >
            🔄 Kiểm tra kết nối
          </button>
          <button
            onClick={handleGoToMain}
            className="bg-white/20 border-2 border-white/30 px-6 py-3 rounded-lg hover:bg-white/30 hover:transform hover:-translate-y-1 transition-all duration-300"
          >
            🏠 Trang chủ
          </button>
        </div>

        {/* Service Worker Status */}
        {supported && (
          <div className="mt-8 text-xs opacity-60">
            SW: {ready ? '✅' : '⏳'} | Cache: {controller ? '✅' : '❌'}
          </div>
        )}
      </div>
    </div>
  );
};

export default OfflineHome;
