import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Trash2, Calendar, Eye, Grid, List, Home } from 'lucide-react';
import { DEFAULT_IMAGES } from '../../constants';
import Button from '../../components/common/Button';
import { getChapters, deleteChapterCompletely, clearAllOfflineData, getStorageAnalysis } from '../../utils/offlineLibrary';
import { formatDate, formatSize } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function OfflineManga() {
  const [chapters, setChapters] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'name'
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list'
  const [loading, setLoading] = useState(true);
  const [storageStats, setStorageStats] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [chapterToDelete, setChapterToDelete] = useState(null);
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
    setChapterToDelete(id);
    setShowDeleteModal(true);
  };

  // Actual delete function
  const handleConfirmDelete = async () => {
    if (!chapterToDelete) return;

    const toastId = 'delete-chapter';
    try {
      toast.loading('🗑️ Đang xóa chapter...', { id: toastId });
      
      const result = await deleteChapterCompletely(chapterToDelete);
      
      if (result.success) {
        // Remove from state
        setChapters(prev => prev.filter(c => c.id !== chapterToDelete));
        
        // Reload stats
        const stats = await getStorageAnalysis();
        setStorageStats(stats);
        
        toast.success(
          `✅ Đã xóa chapter (tiết kiệm ${Math.round(result.bytesFreed / (1024 * 1024) * 10) / 10} MB)`,
          { id: toastId, duration: 5000 }
        );
      } else {
        toast.error(`❌ Lỗi xóa chapter: ${result.message}`, { id: toastId });
      }
    } catch (err) {
      console.error('Error deleting chapter:', err);
      toast.error('❌ Lỗi khi xóa chapter', { id: toastId });
    } finally {
      setShowDeleteModal(false);
      setChapterToDelete(null);
    }
  };

  // 🧹 Clear all offline data
  const handleClearAll = async () => {
    const toastId = 'clear-all';
    try {
      toast.loading('🧹 Đang xóa tất cả dữ liệu...', { id: toastId });
      
      const result = await clearAllOfflineData();
      
      if (result.success) {
        setChapters([]);
        
        // Reload stats
        const stats = await getStorageAnalysis();
        setStorageStats(stats);
        
        toast.success(
          `✅ Đã xóa tất cả dữ liệu offline - ` +
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

  const handleGoHome = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải thư viện offline...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              📚 Offline Library
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Thư viện manga đã tải xuống
            </p>
          </div>
          <Button
            onClick={handleGoHome}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Trang chủ
          </Button>
        </div>

        {/* Storage Stats */}
        {storageStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <div className="text-sm text-gray-600 dark:text-gray-400">Chapters</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {storageStats.totalChapters}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <div className="text-sm text-gray-600 dark:text-gray-400">Tổng trang</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {storageStats.totalImages}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <div className="text-sm text-gray-600 dark:text-gray-400">Dung lượng</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatSize(storageStats.totalBytes)}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <div className="text-sm text-gray-600 dark:text-gray-400">Quota</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {storageStats.quotaInfo ? (
                  <>
                    {formatSize(storageStats.quotaInfo.usage)} / {formatSize(storageStats.quotaInfo.quota)}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                      <div 
                        className={`h-2 rounded-full ${
                          storageStats.quotaInfo.percentage >= 0.9 ? 'bg-red-500' :
                          storageStats.quotaInfo.percentage >= 0.7 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(storageStats.quotaInfo.percentage * 100, 100)}%` }}
                      ></div>
                    </div>
                  </>
                ) : 'N/A'}
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm chapter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          {/* Controls Row */}
          <div className="flex gap-2 items-center">
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="name">Tên A-Z</option>
            </select>

            {/* View Mode */}
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-indigo-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-indigo-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Clear All */}
            {chapters.length > 0 && (
              <Button
                onClick={() => setShowClearModal(true)}
                variant="danger"
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Xóa tất cả
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {filteredAndSortedChapters.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {chapters.length === 0 ? 'Chưa có manga offline' : 'Không tìm thấy kết quả'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {chapters.length === 0 
              ? 'Hãy download một số chapter để đọc offline'
              : `Không có chapter nào khớp với "${searchQuery}"`
            }
          </p>
          {chapters.length === 0 && (
            <Button
              onClick={() => navigate('/manga')}
              className="inline-flex items-center gap-2"
            >
              🔍 Tìm manga để download
            </Button>
          )}
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        }>
          {filteredAndSortedChapters.map((chapter) => (
            viewMode === 'grid' ? (
              <ChapterCard
                key={chapter.id}
                chapter={chapter}
                onRead={handleRead}
                onDelete={handleDelete}
                formatDate={formatDate}
                formatSize={formatSize}
              />
            ) : (
              <ChapterListItem
                key={chapter.id}
                chapter={chapter}
                onRead={handleRead}
                onDelete={handleDelete}
                formatDate={formatDate}
                formatSize={formatSize}
              />
            )
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Xác nhận xóa chapter
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Bạn có chắc muốn xóa chapter này? Dữ liệu sẽ được xóa vĩnh viễn.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setShowDeleteModal(false)}
                variant="outline"
              >
                Hủy
              </Button>
              <Button
                onClick={handleConfirmDelete}
                variant="danger"
              >
                Xóa
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Xóa tất cả dữ liệu offline
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Bạn có chắc muốn xóa TẤT CẢ chapters offline? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setShowClearModal(false)}
                variant="outline"
              >
                Hủy
              </Button>
              <Button
                onClick={() => {
                  setShowClearModal(false);
                  handleClearAll();
                }}
                variant="danger"
              >
                Xóa tất cả
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
  const coverImage = chapter.coverImage || DEFAULT_IMAGES.cover;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden group hover:shadow-xl transition-shadow">
      {/* Cover Image */}
      <div className="aspect-[3/4] overflow-hidden">
        <img
          src={coverImage}
          alt={chapter.mangaTitle || chapter.chapterTitle || 'Chapter'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src = DEFAULT_IMAGES.cover;
          }}
        />
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 line-clamp-2">
          {chapter.mangaTitle || 'Unknown Manga'}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-xs mb-2 line-clamp-1">
          {chapter.chapterTitle || chapter.id}
        </p>
        
        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {chapter.totalPages || 0} trang
          </span>
          <span>{formatSize(chapter.bytes || 0)}</span>
        </div>
        
        {/* Date */}
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-500 mb-3">
          <Calendar className="w-3 h-3 mr-1" />
          {formatDate(chapter.createdAt)}
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={() => onRead(chapter)}
            className="flex-1 text-sm py-2"
          >
            Đọc
          </Button>
          <Button
            onClick={() => onDelete(chapter.id)}
            variant="danger"
            className="px-3 py-2"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Chapter List Item Component
const ChapterListItem = ({ chapter, onRead, onDelete, formatDate, formatSize }) => {
  const coverImage = chapter.coverImage || DEFAULT_IMAGES.cover;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex items-center gap-4 hover:shadow-lg transition-shadow">
      {/* Cover Image */}
      <div className="w-16 h-20 rounded overflow-hidden flex-shrink-0">
        <img
          src={coverImage}
          alt={chapter.mangaTitle || chapter.chapterTitle || 'Chapter'}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = DEFAULT_IMAGES.cover;
          }}
        />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-1 truncate">
          {chapter.mangaTitle || 'Unknown Manga'}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 truncate">
          {chapter.chapterTitle || chapter.id}
        </p>
        
        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {chapter.totalPages || 0} trang
          </span>
          <span>{formatSize(chapter.bytes || 0)}</span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(chapter.createdAt)}
          </span>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex gap-2 flex-shrink-0">
        <Button
          onClick={() => onRead(chapter)}
          className="text-sm"
        >
          Đọc
        </Button>
        <Button
          onClick={() => onDelete(chapter.id)}
          variant="danger"
          className="px-3"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
