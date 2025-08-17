// 📁 src/components/common/SettingsModal.jsx
// ⚙️ Settings modal component

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { 
  X, 
  Settings, 
  Volume2,
  Eye,
  Globe,
  Palette,
  Database,
  HardDrive,
  RotateCcw,
  Save
} from 'lucide-react';
import { useUIStore, useAuthStore, useMangaStore, useMovieStore, useMusicStore, useSharedSettingsStore } from '../../store';

const PlayerUISelector = () => {
  const { playerSettings, updatePlayerSettings } = useMusicStore();
  const current = playerSettings?.playerUI || 'v1';
  return (
    <div className="grid grid-cols-2 gap-4">
      <button
        onClick={() => updatePlayerSettings({ playerUI: 'v1' })}
        className={`p-4 rounded-lg border-2 transition-all ${
          current === 'v1'
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
        }`}
      >
        <div className="font-medium">Spotify-like (V1)</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">Giao diện hiện tại</div>
      </button>
      <button
        onClick={() => updatePlayerSettings({ playerUI: 'v2' })}
        className={`p-4 rounded-lg border-2 transition-all ${
          current === 'v2'
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
        }`}
      >
        <div className="font-medium">Zing MP3 (V2)</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">Mới</div>
      </button>
    </div>
  );
};

const SettingsModal = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { 
    animationsEnabled,
    toggleAnimations
  } = useUIStore();
  
  const { sourceKey } = useAuthStore();
  const { 
    clearMangaCache,
    readerSettings,
    updateReaderSettings,
    mangaSettings,
    updateMangaSettings
  } = useMangaStore();
  const { clearMovieCache } = useMovieStore();
  const { clearMusicCache, playerSettings, updatePlayerSettings } = useMusicStore();

  const [activeTab, setActiveTab] = useState('appearance');

  // Auto select tab based on current route
  useEffect(() => {
    if (isOpen) {
      if (location.pathname.includes('/manga/reader')) {
        setActiveTab('reader');
      } else if (location.pathname.includes('/movie') || location.pathname.includes('/music')) {
        setActiveTab('player');
      } else {
        setActiveTab('appearance');
      }
    }
  }, [isOpen, location.pathname]);

  const settingsTabs = [
    { id: 'appearance', label: 'Giao diện', icon: Palette },
    { 
      id: 'reader', 
      label: (sourceKey && sourceKey.startsWith('V_')) ? 'Manga' : 'Đọc truyện', 
      icon: Eye 
    },
    { id: 'player', label: 'Phát media', icon: Volume2 },
    { id: 'cache', label: 'Bộ nhớ đệm', icon: HardDrive },
    { id: 'system', label: 'Hệ thống', icon: Database },
  ];

  const { clearAllCache: sharedClearAllCache } = useSharedSettingsStore();

  const handleClearCache = async (type) => {
    try {
      switch (type) {
        case 'manga':
          await clearMangaCache();
          break;
        case 'movie':
          await clearMovieCache();
          break;
        case 'music':
          await clearMusicCache();
          break;
        case 'all':
          // Use shared cache clearing + individual store clearing
          sharedClearAllCache();
          await Promise.all([clearMangaCache(), clearMovieCache(), clearMusicCache()]);
          break;
      }
      console.log(`Cleared ${type} cache successfully`);
    } catch (error) {
      console.error(`Error clearing ${type} cache:`, error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Cài đặt
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 dark:bg-gray-900 p-4 border-r border-gray-200 dark:border-gray-700">
            <nav className="space-y-2">
              {settingsTabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <IconComponent className="w-5 h-5 mr-3" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto max-h-[60vh]">
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Giao diện
                </h3>
                
                {/* Animations */}
                <div>
                  <label className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Hiệu ứng chuyển động
                    </span>
                    <button
                      onClick={toggleAnimations}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        animationsEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          animationsEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Bật/tắt hiệu ứng chuyển tiếp và animation. Để tùy chỉnh theme, vui lòng vào trang Settings chính.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'cache' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Quản lý bộ nhớ đệm
                </h3>
                
                {/* Source Key Info */}
                {sourceKey && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Globe className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-700 dark:text-blue-300">
                        Source hiện tại: {sourceKey}
                      </span>
                    </div>
                  </div>
                )}

                {/* Cache Management */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                    Xóa bộ nhớ đệm
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Xóa dữ liệu đã lưu trong bộ nhớ để giải phóng không gian và cập nhật nội dung mới.
                  </p>
                  
                  <div className="space-y-4">
                    {/* Individual Cache Buttons */}
                    <div>
                      <h5 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Xóa cache từng loại</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                          onClick={() => handleClearCache('manga')}
                          className="flex items-center justify-center px-4 py-3 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg transition-colors"
                        >
                          <HardDrive className="w-4 h-4 mr-2" />
                          Manga Cache
                        </button>
                        <button
                          onClick={() => handleClearCache('movie')}
                          className="flex items-center justify-center px-4 py-3 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg transition-colors"
                        >
                          <HardDrive className="w-4 h-4 mr-2" />
                          Movie Cache
                        </button>
                        <button
                          onClick={() => handleClearCache('music')}
                          className="flex items-center justify-center px-4 py-3 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg transition-colors"
                        >
                          <HardDrive className="w-4 h-4 mr-2" />
                          Music Cache
                        </button>
                      </div>
                    </div>

                    {/* All Cache Button */}
                    <div>
                      <h5 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Xóa tất cả</h5>
                      <button
                        onClick={() => handleClearCache('all')}
                        className="w-full flex items-center justify-center px-4 py-3 bg-red-100 hover:bg-red-200 dark:bg-red-800/30 dark:hover:bg-red-800/50 text-red-800 dark:text-red-200 rounded-lg transition-colors font-medium"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Xóa tất cả cache & dữ liệu
                      </button>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        ⚠️ Thao tác này sẽ xóa toàn bộ lịch sử xem, random cache và top view cache.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Hệ thống
                </h3>
                
                {/* Source Key Info */}
                {sourceKey && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Globe className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-700 dark:text-blue-300">
                        Source hiện tại: {sourceKey}
                      </span>
                    </div>
                  </div>
                )}

                {/* System Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                    Thông tin hệ thống
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Phiên bản:</span>
                        <span className="text-gray-900 dark:text-white">React v5.0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Trình duyệt:</span>
                        <span className="text-gray-900 dark:text-white">{navigator.userAgent.split(' ').slice(-2).join(' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Ngôn ngữ:</span>
                        <span className="text-gray-900 dark:text-white">{navigator.language}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Reader Settings Tab */}
            {activeTab === 'reader' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {(sourceKey && sourceKey.startsWith('V_')) ? 'Cài đặt Manga' : 'Cài đặt đọc truyện'}
                </h3>
                
                {/* Preload Count */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Số trang preload: {readerSettings.preloadCount}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={readerSettings.preloadCount}
                    onChange={(e) => {
                      const newCount = parseInt(e.target.value);
                      console.log('🔧 Updating preload count to:', newCount);
                      updateReaderSettings({ preloadCount: newCount });
                    }}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>1</span>
                    <span>20</span>
                  </div>
                </div>

                {/* Reading Mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Chế độ đọc
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => updateReaderSettings({ readingMode: 'single' })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        readerSettings.readingMode === 'single'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="text-center">
                        <div className="font-medium">Trang đơn</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Hiển thị 1 trang</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => updateReaderSettings({ readingMode: 'double' })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        readerSettings.readingMode === 'double'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="text-center">
                        <div className="font-medium">Trang đôi</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Hiển thị 2 trang</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Reading Direction */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Hướng đọc
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => updateReaderSettings({ readingDirection: 'ltr' })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        readerSettings.readingDirection === 'ltr'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="text-center">
                        <div className="font-medium">Trái → Phải</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Left to Right</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => updateReaderSettings({ readingDirection: 'rtl' })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        readerSettings.readingDirection === 'rtl'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="text-center">
                        <div className="font-medium">Phải → Trái</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Right to Left</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Zoom Mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Chế độ zoom
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => updateReaderSettings({ zoomMode: 'fit-width' })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        readerSettings.zoomMode === 'fit-width'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="text-center">
                        <div className="font-medium text-sm">Vừa chiều rộng</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => updateReaderSettings({ zoomMode: 'fit-height' })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        readerSettings.zoomMode === 'fit-height'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="text-center">
                        <div className="font-medium text-sm">Vừa chiều cao</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => updateReaderSettings({ zoomMode: 'original' })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        readerSettings.zoomMode === 'original'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="text-center">
                        <div className="font-medium text-sm">Kích thước gốc</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Manga Load Settings */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    🗄️ Manga Settings
                  </label>
                  
                  <div className="space-y-4">
                    {/* Use Database */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">Load từ Database</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Bật: Duyệt folder nhanh từ DB đã scan | Tắt: Đọc trực tiếp từ ổ đĩa
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={mangaSettings.useDb}
                          onChange={(e) => updateMangaSettings({ useDb: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {/* Lazy Load */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">Lazy Load Images</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Bật: Tiết kiệm RAM, tải từng ảnh | Tắt: Tải tất cả ảnh (mượt hơn)
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={mangaSettings.lazyLoad}
                          onChange={(e) => updateMangaSettings({ lazyLoad: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'player' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Phát media</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Giao diện Music Player mặc định
                  </label>
                  <PlayerUISelector />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            Lưu cài đặt
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default SettingsModal;
