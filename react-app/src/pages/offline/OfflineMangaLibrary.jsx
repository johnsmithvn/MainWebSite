import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Trash2, Calendar, Eye, Grid, List, Info } from 'lucide-react';
import { DEFAULT_IMAGES } from '../../constants';
import Button from '../../components/common/Button';
import StorageInfoModal from '../../components/common/StorageInfoModal';
import { getChapters, deleteChapterCompletely, clearAllOfflineData, getStorageAnalysis, getStorageAnalysisBySource } from '../../utils/offlineLibrary';
import { formatDate, formatSize } from '../../utils/formatters';
import { formatSourceLabel } from '../../utils/offlineHelpers';
import toast from 'react-hot-toast';

export default function OfflineMangaLibrary() {
  const [chapters, setChapters] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'name'
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list'
  const [loading, setLoading] = useState(true);
  const [storageStats, setStorageStats] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [chapterToDelete, setChapterToDelete] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sourceFilter = searchParams.get('source');

  const load = async () => {
    try {
      setLoading(true);
      const items = await getChapters();
      setChapters(items);
      
      // Load storage statistics - based on source filter
      let stats;
      if (sourceFilter) {
        stats = await getStorageAnalysisBySource(sourceFilter);
      } else {
        stats = await getStorageAnalysis();
      }
      setStorageStats(stats);
    } catch (err) {
      console.error('Error loading chapters:', err);
      toast.error('Lỗi tải danh sách chapter');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 🚫 Chặn xem tất cả - phải có source
    if (!sourceFilter) {
      navigate('/offline', { replace: true });
      toast('Vui lòng chọn nguồn để xem chapters', {
        icon: 'ℹ️',
        duration: 3000,
      });
      return;
    }
    
    load();
  }, [sourceFilter, navigate]); // Re-load when source filter changes

  const availableSources = useMemo(() => {
    const map = new Map();

    chapters.forEach((chapter) => {
      const key = chapter?.sourceKey || 'UNKNOWN_SOURCE';

      if (!map.has(key)) {
        map.set(key, {
          sourceKey: key,
          displayName: formatSourceLabel(key),
          chapterCount: 0,
          mangaTitles: new Set(),
        });
      }

      const entry = map.get(key);
      entry.chapterCount += 1;
      if (chapter?.mangaTitle) {
        entry.mangaTitles.add(chapter.mangaTitle);
      }
    });

    return Array.from(map.values())
      .map((entry) => ({
        sourceKey: entry.sourceKey,
        displayName: entry.displayName,
        chapterCount: entry.chapterCount,
        mangaCount: entry.mangaTitles.size,
      }))
      .sort((a, b) => b.chapterCount - a.chapterCount);
  }, [chapters]);

  const activeSourceInfo = useMemo(() => {
    if (!sourceFilter) return null;
    return availableSources.find((source) => source.sourceKey === sourceFilter) || null;
  }, [availableSources, sourceFilter]);

  // Filtered and sorted chapters
  const filteredAndSortedChapters = useMemo(() => {
    let filtered = chapters.filter((chapter) => {
      if (sourceFilter) {
        const key = chapter?.sourceKey || 'UNKNOWN_SOURCE';
        if (key !== sourceFilter) {
          return false;
        }
      }

      const searchLower = searchQuery.toLowerCase();
      const title = (chapter.mangaTitle || chapter.chapterTitle || chapter.id || '').toLowerCase();
      return title.includes(searchLower);
    });

    // Sort chapters
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return (b.createdAt || 0) - (a.createdAt || 0);
        case 'oldest':
          return (a.createdAt || 0) - (b.createdAt || 0);
        case 'name':
          const nameA = (a.mangaTitle || a.chapterTitle || a.id || '').toLowerCase();
          const nameB = (b.mangaTitle || b.chapterTitle || b.id || '').toLowerCase();
          return nameA.localeCompare(nameB);
        default:
          return 0;
      }
    });

    return filtered;
  }, [chapters, searchQuery, sortBy, sourceFilter]);

  // 🗑️ Enhanced delete function with proper cache cleanup
  const handleDelete = async (id) => {
    try {
      const chapter = chapters.find((c) => c.id === id);
      if (!chapter) {
        toast.error('Chapter không tồn tại');
        return;
      }

      // Show delete confirmation modal
      setChapterToDelete(chapter);
      setShowDeleteModal(true);
    } catch (err) {
      console.error('Error preparing delete:', err);
      toast.error('❌ Lỗi khi chuẩn bị xóa chapter');
    }
  };

  // Actual delete function
  const handleConfirmDelete = async () => {
    if (!chapterToDelete) return;
    
    try {
      setShowDeleteModal(false);
      
      // Show loading state
      toast.loading('Đang xóa chapter...', { id: 'delete-chapter' });

      // Delete completely (metadata + images)
      const result = await deleteChapterCompletely(chapterToDelete.id);
      
      if (result.success) {
        await load(); // Reload data
        toast.success(
          `✅ Đã xóa thành công!\n` +
          `${result.stats.deletedImages}/${result.stats.totalImages} ảnh đã xóa\n` +
          `Tiết kiệm ${Math.round(result.stats.bytesFreed / (1024 * 1024) * 10) / 10} MB`,
          { id: 'delete-chapter', duration: 4000 }
        );
      } else {
        toast.error(`❌ Lỗi xóa chapter: ${result.message}`, { id: 'delete-chapter' });
      }
    } catch (err) {
      console.error('Error deleting chapter:', err);
      toast.error('❌ Lỗi khi xóa chapter', { id: 'delete-chapter' });
    } finally {
      setChapterToDelete(null);
    }
  };

  // 🧹 Clear all offline data
  const handleClearAll = async () => {
    try {
      setShowClearModal(false);
      
      if (chapters.length === 0) {
        toast.info('Không có dữ liệu để xóa');
        return;
      }

      // Show loading state
      toast.loading('Đang xóa tất cả dữ liệu offline...', { id: 'clear-all' });

      const result = await clearAllOfflineData();
      
      if (result.success) {
        await load(); // Reload data
        toast.success(
          `🎉 Đã xóa tất cả!\n` +
          `${result.chaptersDeleted} chapters\n` +
          `${result.imagesDeleted} ảnh\n` +
          `Tiết kiệm ${Math.round(result.bytesFreed / (1024 * 1024) * 10) / 10} MB`,
          { id: 'clear-all', duration: 5000 }
        );
      } else {
        toast.error(`❌ Lỗi xóa dữ liệu: ${result.message}`, { id: 'clear-all' });
      }
    } catch (err) {
      console.error('Error clearing all data:', err);
      toast.error('❌ Lỗi khi xóa tất cả dữ liệu', { id: 'clear-all' });
    }
  };

  const handleRead = (chapter) => {
    navigate(`/manga/reader/${encodeURIComponent(chapter.id)}?offline=1`);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 dark:text-gray-400">Đang tải...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Action Buttons - Centered */}
      <div className="mb-6 flex flex-wrap gap-2 justify-center">
        {activeSourceInfo && activeSourceInfo.mangaCount > 0 && (
          <div className="w-full text-center mb-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {activeSourceInfo.mangaCount} manga
            </p>
          </div>
        )}
        
        {storageStats && (
          <Button
            variant="outline"
            onClick={() => setShowStorageModal(true)}
            className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/20"
          >
            <Info size={16} />
            <span className="ml-1">Thông tin lưu trữ</span>
          </Button>
        )}
        {chapters.length > 0 && (
          <Button
            variant="outline"
            onClick={() => setShowClearModal(true)}
            className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
          >
            <Trash2 size={16} />
            <span className="ml-1">Xóa tất cả</span>
          </Button>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm chapter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="name">Tên A-Z</option>
            </select>

            {/* View Mode */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
                title="Grid view"
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
                title="List view"
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredAndSortedChapters.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {chapters.length === 0
              ? 'Chưa có chapter nào'
              : sourceFilter
                ? 'Không tìm thấy chapter trong nguồn đã chọn'
                : 'Không tìm thấy chapter'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {chapters.length === 0
              ? 'Hãy download một số chapter để đọc offline'
              : sourceFilter
                ? 'Hãy thử chọn nguồn khác hoặc kiểm tra lại dữ liệu đã tải'
                : 'Thử thay đổi từ khóa tìm kiếm'}
          </p>
        </div>
      )}

      {/* Content */}
      {filteredAndSortedChapters.length > 0 && (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredAndSortedChapters.map((chapter) => (
                <ChapterCard
                  key={chapter.id}
                  chapter={chapter}
                  onRead={handleRead}
                  onDelete={handleDelete}
                  formatDate={formatDate}
                  formatSize={formatSize}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAndSortedChapters.map((chapter) => (
                <ChapterListItem
                  key={chapter.id}
                  chapter={chapter}
                  onRead={handleRead}
                  onDelete={handleDelete}
                  formatDate={formatDate}
                  formatSize={formatSize}
                />
              ))}
            </div>
          )}
        </>
      )}
      
      {/* Clear All Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Xóa tất cả dữ liệu offline
                </h3>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Bạn có chắc chắn muốn xóa tất cả {chapters.length} chapters đã tải offline không?
              </p>
              
              {storageStats && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Chapters:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {storageStats.chapters.count}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Ảnh:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {storageStats.chapters.totalImages}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Dung lượng sẽ giải phóng:</span>
                    <span className="font-medium text-red-600 dark:text-red-400">
                      {storageStats.formattedSize}
                    </span>
                  </div>
                </div>
              )}
              
              <p className="text-sm text-red-600 dark:text-red-400 mt-4 font-medium">
                ⚠️ Hành động này không thể hoàn tác!
              </p>
            </div>
            
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowClearModal(false)}
              >
                Hủy
              </Button>
              <Button
                onClick={handleClearAll}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Xóa tất cả
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Chapter Confirmation Modal */}
      {showDeleteModal && chapterToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Xóa chapter
                </h3>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Bạn có chắc muốn xóa chapter này không?
              </p>
              
              {/* Chapter Info */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <img 
                    src={chapterToDelete.pageUrls?.[0] || DEFAULT_IMAGES.cover} 
                    alt="Chapter cover"
                    className="w-12 h-16 object-cover rounded border border-gray-200 dark:border-gray-600"
                    onError={(e) => {
                      e.target.src = DEFAULT_IMAGES.cover;
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-white line-clamp-2 mb-1">
                      {chapterToDelete.mangaTitle || chapterToDelete.chapterTitle || 'Unknown'}
                    </h4>
                    <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                      <div>{chapterToDelete.totalPages || 0} trang</div>
                      <div>
                        {chapterToDelete.bytes 
                          ? `${Math.round(chapterToDelete.bytes / (1024 * 1024) * 10) / 10} MB` 
                          : 'Unknown size'
                        }
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Sẽ xóa:</span>{' '}
                    {chapterToDelete.totalPages || 0} ảnh và{' '}
                    {chapterToDelete.bytes 
                      ? `${Math.round(chapterToDelete.bytes / (1024 * 1024) * 10) / 10} MB` 
                      : 'Unknown'
                    } dữ liệu
                  </p>
                </div>
              </div>
              
              <p className="text-sm text-red-600 dark:text-red-400 mt-4 font-medium">
                ⚠️ Hành động này không thể hoàn tác!
              </p>
            </div>
            
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setChapterToDelete(null);
                }}
              >
                Hủy
              </Button>
              <Button
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Xóa chapter
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Storage Info Modal */}
      <StorageInfoModal 
        isOpen={showStorageModal}
        onClose={() => setShowStorageModal(false)}
        storageStats={storageStats}
      />
    </div>
  );
}

// Chapter Card Component
const ChapterCard = ({ chapter, onRead, onDelete, formatDate, formatSize }) => {
  const coverImage = chapter.pageUrls?.[0] || DEFAULT_IMAGES.cover;
  const title = chapter.mangaTitle || chapter.chapterTitle || chapter.id || 'Unknown';
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Cover Image */}
      <div className="relative aspect-[3/4] bg-gray-100 dark:bg-gray-700">
        <img
          src={coverImage}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            e.target.src = DEFAULT_IMAGES.cover;
          }}
        />
        
        {/* Pages badge - Always visible */}
        <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-md text-xs font-medium">
          {chapter.totalPages} trang
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-3 mb-2 min-h-[3.6rem]">
          {title}
        </h3>
        
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mb-3">
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>{formatDate(chapter.createdAt)}</span>
          </div>
          {chapter.bytes && (
            <div>Size: {formatSize(chapter.bytes)}</div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => onRead(chapter)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-1.5"
          >
            <Eye size={14} />
            <span className="ml-1">Đọc</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(chapter.id)}
            className="flex-shrink-0 text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20 text-xs py-1.5 px-2"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Chapter List Item Component
const ChapterListItem = ({ chapter, onRead, onDelete, formatDate, formatSize }) => {
  const coverImage = chapter.pageUrls?.[0] || DEFAULT_IMAGES.cover;
  const title = chapter.mangaTitle || chapter.chapterTitle || chapter.id || 'Unknown';
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        {/* Thumbnail */}
        <div className="flex-shrink-0 w-16 h-20 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
          <img
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.target.src = DEFAULT_IMAGES.cover;
            }}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-white text-base line-clamp-1 mb-1">
            {title}
          </h3>
          
          <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
            <div className="flex items-center gap-4">
              <span>{chapter.totalPages} trang</span>
              {chapter.bytes && <span>{formatSize(chapter.bytes)}</span>}
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>{formatDate(chapter.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => onRead(chapter)}
            className="bg-primary-600 hover:bg-primary-700 text-white"
          >
            <Eye size={16} />
            <span className="hidden sm:inline ml-1">Đọc</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(chapter.id)}
            className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
          >
            <Trash2 size={16} />
            <span className="hidden sm:inline ml-1">Xóa</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
