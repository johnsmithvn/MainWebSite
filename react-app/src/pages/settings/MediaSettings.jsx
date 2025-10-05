import { useMangaStore, useMovieStore, useMusicStore } from '../../store';
import { DatabaseActions } from '../../components/common';
import { useAuthStore } from '../../store';

/**
 * MediaSettings Component
 * 
 * Cài đặt cho Manga/Movie/Music
 * - Manga: Preload count, scroll images per page, recent history, lazy load
 * - Movie: Video quality settings
 * - Music: Audio quality settings
 * - Database operations (scan/delete/reset)
 */
export default function MediaSettings() {
  // Manga settings
  const readerSettings = useMangaStore(state => state.readerSettings);
  const updateReaderSettings = useMangaStore(state => state.updateReaderSettings);
  const mangaSettings = useMangaStore(state => state.settings);
  const updateMangaSettings = useMangaStore(state => state.updateSettings);
  
  // Auth for database operations
  const { sourceKey, rootFolder } = useAuthStore();
  
  // Auto-detect content type from URL
  const currentContentType = window.location.pathname.includes('manga') 
    ? 'manga' 
    : window.location.pathname.includes('movie') 
    ? 'movie' 
    : window.location.pathname.includes('music') 
    ? 'music' 
    : null;

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Media Settings
      </h3>
      
      {/* Manga Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">📚 Manga Settings</h4>
        <div className="space-y-4">
          {/* Preload Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Số trang preload: {readerSettings.preloadCount}
            </label>
            <input
              type="range"
              min="1"
              max="20"
              value={readerSettings.preloadCount}
              onChange={(e) => updateReaderSettings({ preloadCount: parseInt(e.target.value) })}
              className="w-full max-w-xs"
            />
            <p className="text-xs text-gray-500 mt-1">Số ảnh được tải trước để đọc mượt hơn</p>
          </div>

          {/* Scroll Images Per Page */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ảnh mỗi trang (Scroll): {readerSettings.scrollImagesPerPage}
            </label>
            <input
              type="range"
              min="20"
              max="400"
              step="20"
              value={readerSettings.scrollImagesPerPage || 200}
              onChange={(e) => updateReaderSettings({ scrollImagesPerPage: parseInt(e.target.value) })}
              className="w-full max-w-xs"
            />
            <p className="text-xs text-gray-500 mt-1">Điều chỉnh số ảnh trong mỗi trang của chế độ cuộn. Số thấp giúp chuyển trang nhanh hơn.</p>
          </div>

          {/* Recent History Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Số lượng lịch sử lưu: {mangaSettings.recentHistoryCount}
            </label>
            <input
              type="range"
              min="5"
              max="50"
              value={mangaSettings.recentHistoryCount}
              onChange={(e) => updateMangaSettings({ recentHistoryCount: parseInt(e.target.value) })}
              className="w-full max-w-xs"
            />
            <p className="text-xs text-gray-500 mt-1">Số manga được lưu trong lịch sử xem</p>
          </div>

          {/* Enable Recent Tracking */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Theo dõi lịch sử xem</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tự động lưu manga vừa xem</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={mangaSettings.enableRecentTracking}
                onChange={(e) => updateMangaSettings({ enableRecentTracking: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Use Database */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Sử dụng Database</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Load folder từ DB thay vì disk</p>
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
              <p className="font-medium text-gray-900 dark:text-white">Lazy Loading</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tải ảnh khi cần thiết</p>
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

      {/* Quality Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quality Settings</h4>
        <div className="space-y-4">
          {/* Video Quality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Video Quality
            </label>
            <select className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="auto">Auto</option>
              <option value="1080p">1080p</option>
              <option value="720p">720p</option>
              <option value="480p">480p</option>
            </select>
          </div>
          
          {/* Audio Quality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Audio Quality
            </label>
            <select className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="high">High (320kbps)</option>
              <option value="medium">Medium (192kbps)</option>
              <option value="low">Low (128kbps)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Database Operations */}
      {currentContentType && sourceKey && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            🗄️ Database Operations
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Quản lý database cho {currentContentType === 'manga' ? '📚 Manga' : 
                                  currentContentType === 'movie' ? '🎬 Movie' : '🎵 Music'}
          </p>
          
          <DatabaseActions
            contentType={currentContentType}
            sourceKey={sourceKey}
            rootFolder={rootFolder}
            layout="vertical"
          />
        </div>
      )}
    </div>
  );
}
