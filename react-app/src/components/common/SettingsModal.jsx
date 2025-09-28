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
  Save,
  HardDrive
} from 'lucide-react';
import { useUIStore, useAuthStore, useMangaStore, useMusicStore, useMovieStore, useSharedSettingsStore } from '../../store';
import { clearSourceCache, clearAllCache as clearAllCacheKeys, clearTypeCache, clearRecentViewCache, CACHE_PREFIXES } from '../../constants/cacheKeys';
import { optimizeCache, getCacheStats } from '../../utils/cacheOptimizer';
import { getContentTypeFromSourceKey } from '../../utils/databaseOperations';
import DatabaseActions from './DatabaseActions';
import { useModal } from './Modal';
// ...existing code...

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
  const { clearMusicCache, playerSettings, updatePlayerSettings } = useMusicStore();
  const { clearMovieCache } = useMovieStore();
  const { clearAllCache: sharedClearAllCache, clearRecentHistory: sharedClearRecentHistory } = useSharedSettingsStore();

  const [activeTab, setActiveTab] = useState('appearance');
  const [cacheStats, setCacheStats] = useState(null);

  // Modal hook
  const { 
    confirmModal, 
    successModal, 
    errorModal,
    Modal: ModalComponent
  } = useModal();

  // Get current auth state for cache operations
  const getCurrentAuthState = () => {
    const { sourceKey, rootFolder } = useAuthStore.getState();
    return { sourceKey, rootFolder };
  };

  // 🎯 Handle cache optimization
  const handleCacheOptimization = async () => {
    confirmModal({
      title: '🎯 Optimize Cache',
      message: (
        <div className="text-left space-y-3">
          <p className="font-medium">Tối ưu cache để giảm dung lượng không cần thiết?</p>
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <p className="font-semibold text-green-800 dark:text-green-200 mb-2">🎯 Sẽ được tối ưu (SAFE MODE):</p>
            <ul className="text-sm space-y-1 text-green-700 dark:text-green-300">
              <li>• Giảm random items từ 20 → 10 (vẫn giữ cache)</li>
              <li>• Giảm recent items từ 20 → 15 (vẫn giữ cache)</li>
              <li>• Dọn cache hết hạn và trùng lặp</li>
              <li>• Chỉ cleanup aggressive khi storage đầy</li>
            </ul>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="font-semibold text-blue-800 dark:text-blue-200 mb-2">🚨 LUÔN giữ cho offline:</p>
            <ul className="text-sm space-y-1 text-blue-700 dark:text-blue-300">
              <li>• <strong>Library cache</strong> (để vào app khi offline)</li>
              <li>• <strong>Navigation cache</strong> (để điều hướng offline)</li>
              <li>• <strong>Favorites cache</strong> (danh sách yêu thích)</li>
              <li>• <strong>Grid view cache</strong> (xem danh sách offline)</li>
              <li>• <strong>Chapter images</strong> (đọc manga offline)</li>
            </ul>
          </div>
        </div>
      ),
      confirmText: 'Optimize Now',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const cleared = await optimizeCache();
          const stats = getCacheStats();
          setCacheStats(stats);
          
          successModal({
            title: '✅ Optimization Complete!',
            message: (
              <div className="text-left space-y-2">
                <p>Cache đã được tối ưu thành công!</p>
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <ul className="text-sm space-y-1">
                    <li>• <strong>{cleared}</strong> items đã được xóa</li>
                    <li>• Cache size: <strong>{(stats.size / 1024 / 1024).toFixed(2)} MB</strong></li>
                    <li>• Total cache entries: <strong>{stats.total}</strong></li>
                  </ul>
                </div>
              </div>
            )
          });
        } catch (error) {
          errorModal({
            title: '❌ Error',
            message: `Lỗi khi tối ưu cache: ${error.message}`
          });
        }
      }
    });
  };

  // Cache Clear Functions for Current Source
  const handleClearCurrentSourceCache = () => {
    const { sourceKey, rootFolder } = getCurrentAuthState();
    const contentType = getContentTypeFromSourceKey(sourceKey);
    
    // Auto-detect which type to clear based on sourceKey
    if (contentType === 'manga') {
      confirmModal({
        title: '🗑️ Clear Manga Cache - Current Root',
        message: (
          <div className="text-left space-y-3">
            <p className="font-medium">Clear cache for current manga root only?</p>
            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
              <p className="font-semibold text-orange-800 dark:text-orange-200 mb-2">📋 What will be cleared:</p>
              <ul className="text-sm space-y-1 text-orange-700 dark:text-orange-300">
                <li>• React folder cache: <strong>{CACHE_PREFIXES.REACT_FOLDER_CACHE}::{sourceKey || 'current'}::{rootFolder || 'current'}::*</strong></li>
                <li>• Random cache: <strong>{CACHE_PREFIXES.RANDOM_VIEW}::{sourceKey || 'current'}::{rootFolder || 'current'}::manga</strong></li>
                <li>• Source: <strong>{sourceKey || 'current'}</strong>, Root: <strong>{rootFolder || 'current'}</strong></li>
              </ul>
            </div>
          </div>
        ),
        confirmText: 'Clear Current Root',
        cancelText: 'Cancel',
        onConfirm: () => {
          try {
            // Use centralized cache clearing for current root
            const cleared = clearSourceCache(sourceKey, 'manga');
            
            successModal({
              title: '✅ Cleared!',
              message: `Current root manga cache cleared successfully. (${cleared} keys removed)`
            });
          } catch (error) {
            errorModal({
              title: '❌ Error',
              message: `Lỗi khi xóa cache: ${error.message}`
            });
          }
        }
      });
    } else if (contentType === 'movie') {
      confirmModal({
        title: '🗑️ Clear Movie Cache - Current Source',
        message: (
          <div className="text-left space-y-3">
            <p className="font-medium">Clear cache for current movie source?</p>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="font-semibold text-blue-800 dark:text-blue-200 mb-2">📋 What will be cleared:</p>
              <ul className="text-sm space-y-1 text-blue-700 dark:text-blue-300">
                <li>• Folder cache: <strong>movie-folder-cache-{sourceKey || 'current'}</strong></li>
                <li>• Random cache: <strong>randomView::{sourceKey || 'current'}::undefined::movie</strong></li>
                <li>• Recent videos: <strong>recentViewedVideo::{sourceKey || 'current'}</strong></li>
              </ul>
            </div>
          </div>
        ),
        confirmText: 'Clear Current Source',
        cancelText: 'Cancel',
        onConfirm: () => {
          try {
            // Clear cache for current movie source using centralized utility
            clearSourceCache(sourceKey, 'movie');
            
            successModal({
              title: '✅ Cleared!',
              message: 'Current source movie cache cleared successfully.'
            });
          } catch (error) {
            errorModal({
              title: '❌ Error',
              message: `Lỗi khi xóa cache: ${error.message}`
            });
          }
        }
      });
    } else if (contentType === 'music') {
      confirmModal({
        title: '🗑️ Clear Music Cache - Current Source',
        message: (
          <div className="text-left space-y-3">
            <p className="font-medium">Clear cache for current music source?</p>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
              <p className="font-semibold text-purple-800 dark:text-purple-200 mb-2">📋 What will be cleared:</p>
              <ul className="text-sm space-y-1 text-purple-700 dark:text-purple-300">
                <li>• Folder cache: <strong>music-folder-cache-{sourceKey || 'current'}</strong></li>
                <li>• Random cache: <strong>randomView::{sourceKey || 'current'}::undefined::music</strong></li>
                <li>• Recent music: <strong>recentViewedMusic::{sourceKey || 'current'}</strong></li>
              </ul>
            </div>
          </div>
        ),
        confirmText: 'Clear Current Source',
        cancelText: 'Cancel',
        onConfirm: () => {
          try {
            // Clear cache for current music source using centralized utility
            clearSourceCache(sourceKey, 'music');
            
            successModal({
              title: '✅ Cleared!',
              message: 'Current source music cache cleared successfully.'
            });
          } catch (error) {
            errorModal({
              title: '❌ Error',
              message: `Lỗi khi xóa cache: ${error.message}`
            });
          }
        }
      });
    } else {
      // Generic fallback
      confirmModal({
        title: '🗑️ Clear Cache - Current Source',
        message: (
          <div className="text-left space-y-3">
            <p className="font-medium">Clear cache for current source?</p>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="font-semibold text-blue-800 dark:text-blue-200 mb-2">📋 What will be cleared:</p>
              <ul className="text-sm space-y-1 text-blue-700 dark:text-blue-300">
                <li>• Cache cho source: <strong>{sourceKey || 'current'}</strong></li>
                <li>• Folder cache và random cache</li>
                <li>• Recent history cho source này</li>
              </ul>
            </div>
          </div>
        ),
        confirmText: 'Clear Cache',
        cancelText: 'Cancel',
        onConfirm: () => {
          try {
            // Clear cache for current source - auto detect type
            clearSourceCache(sourceKey, contentType || 'manga');
            
            successModal({
              title: '✅ Cache cleared!',
              message: `Cache cho source "${sourceKey}" đã được xóa.`
            });
          } catch (error) {
            errorModal({
              title: '❌ Error',
              message: `Lỗi khi xóa cache: ${error.message}`
            });
          }
        }
      });
    }
  };

  // Clear Recent History
  const handleClearRecentHistory = () => {
    confirmModal({
      title: '🕒 Clear Recent History',
      message: (
        <div className="text-left space-y-3">
          <p className="font-medium">Clear all recent view history?</p>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
            <p className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">📋 What will be cleared:</p>
            <ul className="text-sm space-y-1 text-yellow-700 dark:text-yellow-300">
              <li>• Recent manga/movie/music history</li>
              <li>• Last viewed items</li>
              <li>• Quick access cache</li>
            </ul>
          </div>
        </div>
      ),
      confirmText: 'Clear History',
      cancelText: 'Cancel',
      onConfirm: () => {
        try {
          // Use centralized recent view cache clearing
          clearRecentViewCache();
          
          successModal({
            title: '✅ History cleared!',
            message: 'Lịch sử xem gần đây đã được xóa.'
          });
        } catch (error) {
          errorModal({
            title: '❌ Error',
            message: `Lỗi khi xóa history: ${error.message}`
          });
        }
      }
    });
  };

  // Clear All Cache - Nuclear option
  const handleClearAllCache = () => {
    confirmModal({
      title: '💥 Clear ALL Cache',
      message: (
        <div className="text-left space-y-3">
          <div className="font-medium">Clear ALL cache data?</div>
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <div className="font-semibold text-red-800 dark:text-red-200 mb-2">💀 What will be cleared:</div>
            <ul className="text-sm space-y-1 text-red-700 dark:text-red-300">
              <li>• ALL manga/movie/music cache</li>
              <li>• ALL folder cache và random cache</li>
              <li>• ALL recent history</li>
              <li>• Browser localStorage cache</li>
            </ul>
          </div>
          <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg border border-red-300 dark:border-red-700">
            <div className="font-bold text-red-800 dark:text-red-200">
              ❌ This action cannot be undone!
            </div>
          </div>
        </div>
      ),
      confirmText: '💥 Clear Everything',
      cancelText: 'Cancel',
      onConfirm: () => {
        try {
          // Use centralized cache clearing - clear all cache keys
          clearAllCacheKeys();
          
          successModal({
            title: '✅ All cache cleared!',
            message: 'Tất cả cache đã được xóa. Trang sẽ reload...'
          });
          // Reload page after a short delay
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } catch (error) {
          errorModal({
            title: '❌ Error',
            message: `Lỗi khi xóa cache: ${error.message}`
          });
        }
      }
    });
  };

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
    { id: 'cache', label: 'Cache & Storage', icon: HardDrive },
    { id: 'system', label: 'Hệ thống', icon: Database },
  ];

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
                  Cache & Storage Management
                </h3>
                
                {/* Cache Management */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white">
                    📦 Cache Management
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Quản lý bộ nhớ đệm để tối ưu hiệu năng và giải phóng không gian lưu trữ.
                  </p>
                  
                  {/* Cache Action Buttons */}
                  <div className="grid grid-cols-1 gap-3">
                    <button
                      onClick={handleCacheOptimization}
                      className="flex items-center justify-between p-4 border border-green-300 dark:border-green-600 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-5 h-5 text-green-600">🎯</div>
                        <div className="text-left">
                          <div className="font-medium text-gray-900 dark:text-white">Optimize Cache</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Giảm cache không cần thiết, giữ lại offline essentials
                          </div>
                        </div>
                      </div>
                      <span className="text-green-600 text-sm">Recommended</span>
                    </button>

                    <button
                      onClick={handleClearCurrentSourceCache}
                      className="flex items-center justify-between p-4 border border-blue-300 dark:border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <HardDrive className="w-5 h-5 text-blue-600" />
                        <div className="text-left">
                          <div className="font-medium text-gray-900 dark:text-white">Clear Current Source Cache</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Xóa cache cho source hiện tại: {sourceKey || 'Unknown'}
                          </div>
                        </div>
                      </div>
                      <span className="text-blue-600 text-sm">Manual</span>
                    </button>

                    <button
                      onClick={handleClearRecentHistory}
                      className="flex items-center justify-between p-4 border border-yellow-300 dark:border-yellow-600 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-5 h-5 text-yellow-600">🕒</div>
                        <div className="text-left">
                          <div className="font-medium text-gray-900 dark:text-white">Clear Recent History</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Xóa lịch sử xem gần đây
                          </div>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={handleClearAllCache}
                      className="flex items-center justify-between p-4 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-5 h-5 text-red-600">💥</div>
                        <div className="text-left">
                          <div className="font-medium text-gray-900 dark:text-white">Clear ALL Cache</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Xóa toàn bộ cache (Nuclear option)
                          </div>
                        </div>
                      </div>
                      <span className="text-red-600 text-sm">Danger</span>
                    </button>
                  </div>
                </div>

                {/* Database Operations */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white">
                    🗄️ Database Operations
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Quản lý cơ sở dữ liệu cho nguồn hiện tại.
                  </p>
                  
                  <DatabaseActions variant="database" />
                </div>

                {/* Info Notice */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-400">
                  <div className="flex items-start space-x-3">
                    <HardDrive className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800 dark:text-blue-200">
                        Lưu ý quan trọng
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        • <strong>Cache Management</strong>: Xóa dữ liệu tạm thời để tối ưu hiệu năng<br/>
                        • <strong>Scan</strong>: Quét và cập nhật database với nội dung mới<br/>
                        • <strong>Delete DB</strong>: Xóa toàn bộ database (không thể hoàn tác)<br/>
                        • <strong>Reset DB</strong>: Xóa và quét lại từ đầu<br/>
                        • Các thao tác này có thể mất thời gian và sẽ hiển thị loading toàn màn hình
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

                {/* Notice about Cache Management */}
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-l-4 border-green-400">
                  <div className="flex items-start space-x-3">
                    <HardDrive className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-800 dark:text-green-200">
                        Quản lý Cache & Database
                      </h4>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        Bạn có thể quản lý bộ nhớ đệm, xóa cache, và thực hiện Database Operations (Scan/Delete/Reset) 
                        ngay tại tab <strong>Cache & Storage</strong> trong modal này, hoặc vào trang Settings chính.
                      </p>
                    </div>
                  </div>
                </div>

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
      
      {/* Modal Component for confirmations */}
      <ModalComponent />
    </div>
  );
};

export default SettingsModal;
