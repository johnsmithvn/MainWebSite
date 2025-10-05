import { Database } from 'lucide-react';
import { useAuthStore } from '../../store';
import { Button, DatabaseActions } from '../../components/common';
import { useModal } from '../../components/common/Modal';
import { 
  clearSourceCache, 
  clearTypeCache, 
  clearRecentViewCache
} from '../../constants/cacheKeys';

/**
 * CacheSettings Component
 * 
 * Quản lý cache và storage cho Manga/Movie/Music
 * - Xóa cache theo root folder (manga only)
 * - Xóa cache theo source
 * - Xóa cache + storage
 * - Xóa toàn bộ cache
 * - Hiển thị thông tin storage
 */
export default function CacheSettings() {
  // Get auth state to determine current content type
  const { sourceKey, rootFolder, getCurrentAuthState } = useAuthStore();
  
  // Get stores for cache clearing
  const clearMangaCache = useAuthStore(state => state.clearCache);
  const clearMovieCache = useAuthStore(state => state.clearMovieCache);
  const clearMusicCache = useAuthStore(state => state.clearMusicCache);
  const sharedClearRecentHistory = useAuthStore(state => state.clearRecentHistory);
  
  // Modal hook
  const { confirmModal, successModal, errorModal } = useModal();
  
  // Auto-detect content type from URL
  const currentContentType = window.location.pathname.includes('manga') 
    ? 'manga' 
    : window.location.pathname.includes('movie') 
    ? 'movie' 
    : window.location.pathname.includes('music') 
    ? 'music' 
    : null;

  // ==================== MANGA CACHE HANDLERS ====================
  
  const handleClearMangaCurrentRoot = () => {
    const { sourceKey, rootFolder } = getCurrentAuthState();
    confirmModal({
      title: '🗑️ Clear Manga Cache - Current Root',
      message: (
        <div className="text-left space-y-3">
          <p className="font-medium">Clear cache for current manga root only?</p>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
            <p className="font-semibold text-orange-800 dark:text-orange-200 mb-2">📋 What will be cleared:</p>
            <ul className="text-sm space-y-1 text-orange-700 dark:text-orange-300">
              <li>• React folder cache: <strong>react-folderCache::{sourceKey || 'current'}::{rootFolder || 'current'}::*</strong></li>
              <li>• Random cache: <strong>randomView::{sourceKey || 'current'}::{rootFolder || 'current'}::manga</strong></li>
              <li>• Source: <strong>{sourceKey || 'current'}</strong>, Root: <strong>{rootFolder || 'current'}</strong></li>
            </ul>
          </div>
        </div>
      ),
      confirmText: 'Clear Current Root',
      cancelText: 'Cancel',
      onConfirm: () => {
        const cleared = clearSourceCache(sourceKey, 'manga');
        successModal({
          title: '✅ Cleared!',
          message: `Current root manga cache cleared successfully. (${cleared} keys removed)`
        });
      }
    });
  };

  const handleClearMangaCurrentSource = () => {
    const { sourceKey } = getCurrentAuthState();
    confirmModal({
      title: '🗑️ Clear Manga Cache - Current Source',
      message: (
        <div className="text-left space-y-3">
          <p className="font-medium">Clear cache for current manga source?</p>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
            <p className="font-semibold text-orange-800 dark:text-orange-200 mb-2">📋 What will be cleared:</p>
            <ul className="text-sm space-y-1 text-orange-700 dark:text-orange-300">
              <li>• ALL React folder cache: <strong>react-folderCache::{sourceKey || 'current'}::*</strong></li>
              <li>• ALL random cache: <strong>randomView::{sourceKey || 'current'}::*::manga</strong></li>
              <li>• All roots within source: <strong>{sourceKey || 'current'}</strong></li>
            </ul>
          </div>
        </div>
      ),
      confirmText: 'Clear Current Source',
      cancelText: 'Cancel',
      onConfirm: () => {
        clearSourceCache(sourceKey, 'manga');
        successModal({
          title: '✅ Cleared!',
          message: 'Current source manga cache cleared successfully.'
        });
      }
    });
  };

  const handleClearMangaSourceAndStorage = () => {
    const { sourceKey } = getCurrentAuthState();
    confirmModal({
      title: '🗑️ Clear Manga Cache + Storage - Current Source',
      message: (
        <div className="text-left space-y-3">
          <p className="font-medium">Clear cache AND storage for current manga source?</p>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
            <p className="font-semibold text-orange-800 dark:text-orange-200 mb-2">📋 What will be cleared:</p>
            <ul className="text-sm space-y-1 text-orange-700 dark:text-orange-300">
              <li>• ALL React folder cache: <strong>react-folderCache::{sourceKey || 'current'}::*</strong></li>
              <li>• ALL random cache: <strong>randomView::{sourceKey || 'current'}::*::manga</strong></li>
              <li>• Manga app storage (settings, favorites, recent history)</li>
              <li>• Reading progress data</li>
            </ul>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border-l-4 border-yellow-400">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ <strong>Warning:</strong> This will also clear your manga settings and reading progress!
            </p>
          </div>
        </div>
      ),
      confirmText: 'Clear Source + Storage',
      cancelText: 'Cancel',
      onConfirm: () => {
        clearSourceCache(sourceKey, 'manga');
        clearMangaCache();
        successModal({
          title: '✅ Cleared!',
          message: 'Current source manga cache and storage cleared successfully.'
        });
      }
    });
  };

  const handleClearMangaAllSourcesAndStorage = () => {
    confirmModal({
      title: '💥 Clear ALL Manga Cache + Storage',
      message: (
        <div className="text-left space-y-3">
          <div className="font-medium">Clear ALL manga cache and storage?</div>
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <div className="font-semibold text-red-800 dark:text-red-200 mb-2">💀 What will be cleared:</div>
            <ul className="text-sm space-y-1 text-red-700 dark:text-red-300">
              <li>• ALL React folder cache: <strong>react-folderCache::*</strong></li>
              <li>• ALL old frontend cache: <strong>folderCache::*, mangaCache::*</strong></li>
              <li>• ALL random cache: <strong>randomView::*::*::manga</strong></li>
              <li>• ALL manga app storage: <strong>manga-storage</strong></li>
              <li>• ALL reading progress and recent history</li>
              <li>• ALL manga settings and favorites: <strong>manga.perPage</strong></li>
              <li>• ALL session storage manga data</li>
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
        // Clear all manga-related cache
        clearTypeCache('manga');
        clearMangaCache();
        
        // Clear session storage
        try {
          Object.keys(sessionStorage).forEach(key => {
            if (key.includes('manga') || key.includes('folderCache') || key.includes('randomView::') || key.includes('recentViewed')) {
              sessionStorage.removeItem(key);
            }
          });
        } catch (error) {
          console.warn('Error clearing sessionStorage:', error);
        }
        
        // Clear browser cache
        try {
          if ('caches' in window) {
            caches.keys().then(cacheNames => {
              cacheNames.forEach(cacheName => {
                if (cacheName.includes('manga') || cacheName.includes('folder')) {
                  caches.delete(cacheName);
                }
              });
            });
          }
        } catch (error) {
          console.warn('Error clearing browser caches:', error);
        }
        
        successModal({
          title: '💥 Completed!',
          message: 'ALL manga cache and storage cleared successfully. Please refresh the page.'
        });
      }
    });
  };

  // ==================== MOVIE CACHE HANDLERS ====================
  
  const handleClearMovieCurrentSource = () => {
    const { sourceKey } = getCurrentAuthState();
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
        clearSourceCache(sourceKey, 'movie');
        successModal({
          title: '✅ Cleared!',
          message: 'Current source movie cache cleared successfully.'
        });
      }
    });
  };

  const handleClearMovieSourceAndStorage = () => {
    const { sourceKey } = getCurrentAuthState();
    confirmModal({
      title: '🗑️ Clear Movie Cache + Storage - Current Source',
      message: (
        <div className="text-left space-y-3">
          <p className="font-medium">Clear cache AND storage for current movie source?</p>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="font-semibold text-blue-800 dark:text-blue-200 mb-2">📋 What will be cleared:</p>
            <ul className="text-sm space-y-1 text-blue-700 dark:text-blue-300">
              <li>• Folder cache: <strong>movie-folder-cache-{sourceKey || 'current'}</strong></li>
              <li>• Random cache: <strong>randomView::{sourceKey || 'current'}::undefined::movie</strong></li>
              <li>• Recent videos: <strong>recentViewedVideo::{sourceKey || 'current'}</strong></li>
              <li>• Movie app storage (settings, favorites)</li>
            </ul>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border-l-4 border-yellow-400">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ <strong>Warning:</strong> This will also clear your movie settings and favorites!
            </p>
          </div>
        </div>
      ),
      confirmText: 'Clear Source + Storage',
      cancelText: 'Cancel',
      onConfirm: () => {
        clearSourceCache(sourceKey, 'movie');
        clearMovieCache();
        successModal({
          title: '✅ Cleared!',
          message: 'Current source movie cache and storage cleared successfully.'
        });
      }
    });
  };

  const handleClearMovieAllSourcesAndStorage = () => {
    confirmModal({
      title: '💥 Clear ALL Movie Cache + Storage',
      message: (
        <div className="text-left space-y-3">
          <div className="font-medium">Clear ALL movie cache and storage?</div>
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <div className="font-semibold text-red-800 dark:text-red-200 mb-2">💀 What will be cleared:</div>
            <ul className="text-sm space-y-1 text-red-700 dark:text-red-300">
              <li>• ALL folder cache: <strong>movie-folder-cache-*</strong></li>
              <li>• ALL random cache: <strong>randomView::*::undefined::movie</strong></li>
              <li>• ALL recent videos: <strong>recentViewedVideo::*</strong></li>
              <li>• ALL movie app storage</li>
              <li>• ALL movie settings and favorites</li>
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
        clearTypeCache('movie');
        clearMovieCache();
        successModal({
          title: '💥 Completed!',
          message: 'ALL movie cache and storage cleared successfully.'
        });
      }
    });
  };

  // ==================== MUSIC CACHE HANDLERS ====================
  
  const handleClearMusicCurrentSource = () => {
    const { sourceKey } = getCurrentAuthState();
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
        clearSourceCache(sourceKey, 'music');
        successModal({
          title: '✅ Cleared!',
          message: 'Current source music cache cleared successfully.'
        });
      }
    });
  };

  const handleClearMusicSourceAndStorage = () => {
    const { sourceKey } = getCurrentAuthState();
    confirmModal({
      title: '🗑️ Clear Music Cache + Storage - Current Source',
      message: (
        <div className="text-left space-y-3">
          <p className="font-medium">Clear cache AND storage for current music source?</p>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
            <p className="font-semibold text-purple-800 dark:text-purple-200 mb-2">📋 What will be cleared:</p>
            <ul className="text-sm space-y-1 text-purple-700 dark:text-purple-300">
              <li>• Folder cache: <strong>music-folder-cache-{sourceKey || 'current'}</strong></li>
              <li>• Random cache: <strong>randomView::{sourceKey || 'current'}::undefined::music</strong></li>
              <li>• Recent music: <strong>recentViewedMusic::{sourceKey || 'current'}</strong></li>
              <li>• Music app storage (settings, playlists)</li>
            </ul>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border-l-4 border-yellow-400">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ <strong>Warning:</strong> This will also clear your music settings and playlists!
            </p>
          </div>
        </div>
      ),
      confirmText: 'Clear Source + Storage',
      cancelText: 'Cancel',
      onConfirm: () => {
        clearSourceCache(sourceKey, 'music');
        clearMusicCache();
        successModal({
          title: '✅ Cleared!',
          message: 'Current source music cache and storage cleared successfully.'
        });
      }
    });
  };

  const handleClearMusicAllSourcesAndStorage = () => {
    confirmModal({
      title: '💥 Clear ALL Music Cache + Storage',
      message: (
        <div className="text-left space-y-3">
          <div className="font-medium">Clear ALL music cache and storage?</div>
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <div className="font-semibold text-red-800 dark:text-red-200 mb-2">💀 What will be cleared:</div>
            <ul className="text-sm space-y-1 text-red-700 dark:text-red-300">
              <li>• ALL folder cache: <strong>music-folder-cache-*</strong></li>
              <li>• ALL random cache: <strong>randomView::*::undefined::music</strong></li>
              <li>• ALL recent music: <strong>recentViewedMusic::*</strong></li>
              <li>• ALL music app storage</li>
              <li>• ALL music settings and playlists</li>
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
        clearTypeCache('music');
        clearMusicCache();
        successModal({
          title: '💥 Completed!',
          message: 'ALL music cache and storage cleared successfully.'
        });
      }
    });
  };

  // ==================== GENERAL CACHE HANDLERS ====================
  
  const handleClearRecentHistory = () => {
    confirmModal({
      title: '🗑️ Xóa toàn bộ cache lịch sử xem',
      message: (
        <div className="text-left space-y-3">
          <p className="font-medium">Bạn có chắc chắn muốn xóa toàn bộ cache lịch sử xem?</p>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <p className="font-semibold text-gray-800 dark:text-gray-200 mb-2">📋 Những gì sẽ bị xóa:</p>
            <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
              <li>• Recent Manga: <strong>recentViewed::*::*</strong></li>
              <li>• Recent Movies: <strong>recentViewedVideo::*</strong></li>
              <li>• Recent Music: <strong>recentViewedMusic::*</strong></li>
              <li>• View history từ TẤT CẢ nguồn</li>
            </ul>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border-l-4 border-yellow-400">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ <strong>Lưu ý:</strong> Hành động này không thể hoàn tác và sẽ xóa lịch sử từ <strong>TẤT CẢ</strong> nguồn nội dung.
            </p>
          </div>
        </div>
      ),
      confirmText: 'Xóa tất cả lịch sử',
      cancelText: 'Hủy',
      onConfirm: () => {
        clearRecentViewCache();
        sharedClearRecentHistory('manga');
        sharedClearRecentHistory('movie');
        sharedClearRecentHistory('music');
        
        successModal({
          title: '✅ Đã xóa!',
          message: 'Đã xóa toàn bộ cache lịch sử xem thành công.'
        });
      }
    });
  };

  // ==================== RENDER ====================
  
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Cache & Storage Management
      </h3>
      
      {/* Cache Management */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Cache Management</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Quản lý bộ nhớ đệm để tối ưu hiệu năng và giải phóng không gian lưu trữ.
        </p>
        
        <div className="space-y-6">
          {/* Cache Type Display */}
          <div>
            <h5 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">
              Xóa cache - {currentContentType ? 
                (currentContentType === 'manga' ? '📚 Manga' : 
                 currentContentType === 'movie' ? '🎬 Movie' : '🎵 Music') : 
                'Chưa chọn nguồn'}
            </h5>
            
            {/* Show content type specific cache actions */}
            {currentContentType && sourceKey ? (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="space-y-4">
                  {currentContentType === 'manga' && (
                    <>
                      <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-l-4 border-orange-400">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Clear Current Root Cache</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Clear cache for current root folder only</p>
                          <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">📁 Scope: Current source + current root folder</p>
                        </div>
                        <Button variant="outline" onClick={handleClearMangaCurrentRoot} className="text-orange-600 hover:text-orange-700">
                          Clear Root
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg border-l-4 border-orange-500">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Clear Current Source Cache</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Clear all cache for current source (all roots)</p>
                          <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">🌐 Scope: Current source + all root folders</p>
                        </div>
                        <Button variant="outline" onClick={handleClearMangaCurrentSource} className="text-orange-600 hover:text-orange-700">
                          Clear Source
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-500">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Clear Source + Storage</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Clear source cache + manga app storage</p>
                          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">⚠️ Scope: Current source + app settings/favorites</p>
                        </div>
                        <Button variant="outline" onClick={handleClearMangaSourceAndStorage} className="text-yellow-600 hover:text-yellow-700">
                          Clear Source + Storage
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border-l-4 border-red-500">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Clear ALL Manga Data</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Nuclear option: ALL sources + ALL storage</p>
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">💥 Scope: Everything manga-related</p>
                        </div>
                        <Button variant="outline" onClick={handleClearMangaAllSourcesAndStorage} className="text-red-600 hover:text-red-700">
                          💥 Clear Everything
                        </Button>
                      </div>
                    </>
                  )}

                  {currentContentType === 'movie' && (
                    <>
                      <div className="flex items-center justify-between p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg border-l-4 border-blue-500">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Clear Current Source Cache</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Clear all cache for current movie source</p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">🌐 Scope: Current source + metadata cache</p>
                        </div>
                        <Button variant="outline" onClick={handleClearMovieCurrentSource} className="text-blue-600 hover:text-blue-700">
                          Clear Source
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-500">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Clear Source + Storage</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Clear source cache + movie app storage</p>
                          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">⚠️ Scope: Current source + app settings/favorites</p>
                        </div>
                        <Button variant="outline" onClick={handleClearMovieSourceAndStorage} className="text-yellow-600 hover:text-yellow-700">
                          Clear Source + Storage
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border-l-4 border-red-500">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Clear ALL Movie Data</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Nuclear option: ALL sources + ALL storage</p>
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">💥 Scope: Everything movie-related</p>
                        </div>
                        <Button variant="outline" onClick={handleClearMovieAllSourcesAndStorage} className="text-red-600 hover:text-red-700">
                          💥 Clear Everything
                        </Button>
                      </div>
                    </>
                  )}

                  {currentContentType === 'music' && (
                    <>
                      <div className="flex items-center justify-between p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg border-l-4 border-purple-500">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Clear Current Source Cache</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Clear all cache for current music source</p>
                          <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">🌐 Scope: Current source + metadata cache</p>
                        </div>
                        <Button variant="outline" onClick={handleClearMusicCurrentSource} className="text-purple-600 hover:text-purple-700">
                          Clear Source
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-400">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Clear Source + Storage</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Clear source cache + music app storage</p>
                          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">⚠️ Scope: Current source + app settings/playlists</p>
                        </div>
                        <Button variant="outline" onClick={handleClearMusicSourceAndStorage} className="text-yellow-600 hover:text-yellow-700">
                          Clear Source + Storage
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border-l-4 border-red-500">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Clear ALL Music Data</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Nuclear option: ALL sources + ALL storage</p>
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">💥 Scope: Everything music-related</p>
                        </div>
                        <Button variant="outline" onClick={handleClearMusicAllSourcesAndStorage} className="text-red-600 hover:text-red-700">
                          💥 Clear Everything
                        </Button>
                      </div>
                    </>
                  )}

                  {/* Database Operations Section */}
                  <div className="border-t pt-4 mt-6">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                      <Database className="w-5 h-5 mr-2" />
                      Database Operations
                    </h4>
                    
                    <DatabaseActions
                      contentType={currentContentType}
                      sourceKey={sourceKey}
                      rootFolder={rootFolder}
                      layout="vertical"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Database className="w-16 h-16 mx-auto mb-3 opacity-50" />
                <p>Chưa chọn nguồn nội dung. Vui lòng chọn Manga/Movie/Music để quản lý cache.</p>
              </div>
            )}
          </div>

          {/* Clear Recent History - Always available */}
          <div className="border-t pt-6">
            <h5 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">
              Lịch sử xem gần đây
            </h5>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Xóa toàn bộ lịch sử xem</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Xóa cache recent view từ TẤT CẢ nguồn (manga, movie, music)
                </p>
              </div>
              <Button variant="outline" onClick={handleClearRecentHistory}>
                Xóa lịch sử
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
