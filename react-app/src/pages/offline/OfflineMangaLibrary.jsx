import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Trash2, Calendar, Eye, Grid, List, Info } from 'lucide-react';
import { DEFAULT_IMAGES } from '../../constants';
import Button from '../../components/common/Button';
import { getChapters, deleteChapterCompletely, clearAllOfflineData, getStorageAnalysis } from '../../utils/offlineLibrary';
import { formatDate, formatSize } from '../../utils/formatters';
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
  const [chapterToDelete, setChapterToDelete] = useState(null);
  const [showStorageInfoModal, setShowStorageInfoModal] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    try {
      setLoading(true);
      const items = await getChapters();
      setChapters(items);
      
      // Load storage statistics
      const stats = await getStorageAnalysis();
      setStorageStats(stats);
    } catch (err) {
      console.error('Error loading chapters:', err);
      toast.error('Lỗi tải danh sách chapter');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Filtered and sorted chapters
  const filteredAndSortedChapters = useMemo(() => {
    let filtered = chapters.filter(chapter => {
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
  }, [chapters, searchQuery, sortBy]);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="sr-only">Manga Offline Library</h1>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
            {chapters.length} chapter{chapters.length !== 1 ? 's' : ''} đã tải offline
          </p>

          {(storageStats || chapters.length > 0) && (
            <div className="flex items-center justify-center sm:justify-end gap-2">
              {storageStats && (
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setShowStorageInfoModal(true)}
                  className="sm:hidden border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 gap-1.5"
                >
                  <Info size={14} />
                  <span>Xem thông tin</span>
                </Button>
              )}

              {chapters.length > 0 && (
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setShowClearModal(true)}
                  className="border-red-200 hover:bg-red-50 text-red-600 dark:border-red-800 dark:hover:bg-red-900/20 dark:text-red-400 gap-1.5 sm:px-3 sm:py-1.5 sm:text-sm"
                >
                  <Trash2 size={14} />
                  <span>Xóa tất cả</span>
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Storage Statistics */}
        {storageStats && (
          <div className="hidden sm:block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {storageStats.chapters.count}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Chapters</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {storageStats.chapters.totalImages}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Ảnh</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {storageStats.formattedSize}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Dung lượng</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {storageStats.quota ? `${storageStats.quota.percentage}%` : 'N/A'}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Đã dùng</div>
              </div>
            </div>
            
            {/* Storage quota bar */}
            {storageStats.quota && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <span>Storage quota</span>
                  <span>{storageStats.quota.percentage}% used</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      storageStats.quota.percentage > 90 ? 'bg-red-500' :
                      storageStats.quota.percentage > 75 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(100, storageStats.quota.percentage)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Used: {formatSize(storageStats.quota.usage)}</span>
                  <span>Available: {formatSize(storageStats.quota.available)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {storageStats && (
          <div className="sm:hidden text-xs text-gray-500 dark:text-gray-400 text-center">
            Cập nhật lần cuối: {storageStats?.generatedAt ? formatDate(storageStats.generatedAt) : 'Không xác định'}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-5 mb-5">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between">
          {/* Search */}
          <div className="relative w-full sm:flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm chapter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          />
        </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="name">Tên A-Z</option>
            </select>

            {/* View Mode */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5 sm:p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
                title="Grid view"
              >
                <Grid size={16} />
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
                <List size={16} />
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
            {chapters.length === 0 ? 'Chưa có chapter nào' : 'Không tìm thấy chapter'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {chapters.length === 0 
              ? 'Hãy download một số chapter để đọc offline'
              : 'Thử thay đổi từ khóa tìm kiếm'
            }
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

      {/* Storage Info Modal for mobile */}
      {showStorageInfoModal && storageStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                <Info className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Thông tin lưu trữ</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tổng quan dung lượng offline hiện tại</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40">
                <div className="text-xl font-semibold text-primary-600 dark:text-primary-400">
                  {storageStats.chapters.count}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Chapters</div>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40">
                <div className="text-xl font-semibold text-green-600 dark:text-green-400">
                  {storageStats.chapters.totalImages}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Ảnh</div>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40">
                <div className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                  {storageStats.formattedSize}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Dung lượng</div>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40">
                <div className="text-xl font-semibold text-purple-600 dark:text-purple-400">
                  {storageStats.quota ? `${storageStats.quota.percentage}%` : 'N/A'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Đã dùng</div>
              </div>
            </div>

            {storageStats.quota && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Storage quota</span>
                  <span>{storageStats.quota.percentage}% used</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      storageStats.quota.percentage > 90
                        ? 'bg-red-500'
                        : storageStats.quota.percentage > 75
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(100, storageStats.quota.percentage)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Đã dùng: {formatSize(storageStats.quota.usage)}</span>
                  <span>Còn trống: {formatSize(storageStats.quota.available)}</span>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setShowStorageInfoModal(false)}>
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Chapter Card Component
const ChapterCard = ({ chapter, onRead, onDelete, formatDate, formatSize }) => {
  const coverImage = chapter.pageUrls?.[0] || DEFAULT_IMAGES.cover;
  const title = chapter.mangaTitle || chapter.chapterTitle || chapter.id || 'Unknown';
  const totalPages = chapter.totalPages ?? chapter.pageUrls?.length ?? 0;
  const downloadedDate = chapter.createdAt ? formatDate(chapter.createdAt) : 'Không rõ';

  const handleRead = () => {
    onRead(chapter);
  };

  const handleDelete = (event) => {
    event.stopPropagation();
    onDelete(chapter.id);
  };

  return (
    <div
      className="group bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700 p-3 cursor-pointer"
      onClick={handleRead}
    >
      <div className="relative">
        <div className="aspect-[3/4] bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden mb-3">
          <img
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              e.target.src = DEFAULT_IMAGES.cover;
            }}
          />
        </div>

        <div className="absolute top-3 left-3 bg-black/70 text-white px-2 py-1 rounded-md text-xs font-medium">
          {totalPages} trang
        </div>
      </div>

      <h3
        className="font-semibold text-gray-900 dark:text-white text-sm mb-2 line-clamp-2 hover:text-primary-500"
        title={title}
      >
        {title}
      </h3>

      <div className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
        {chapter.bytes && <span>Dung lượng: {formatSize(chapter.bytes)}</span>}
        <span className="flex items-center gap-1">
          <Calendar size={12} />
          <span>Tải ngày: {downloadedDate}</span>
        </span>
      </div>

      <div className="flex gap-2 mt-3">
        <Button
          variant="outline"
          size="xs"
          onClick={(event) => {
            event.stopPropagation();
            onRead(chapter);
          }}
          className="flex-1"
        >
          <Eye size={14} className="mr-1" />
          Đọc
        </Button>
        <Button
          variant="outline"
          size="xs"
          onClick={handleDelete}
          className="text-red-500 hover:text-red-600"
        >
          <Trash2 size={14} />
        </Button>
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
