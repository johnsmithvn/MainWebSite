import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Trash2,
  Info,
  ArrowLeft,
  Database,
  HardDrive,
  Layers,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { DEFAULT_IMAGES } from '../../constants';
import Button from '../../components/common/Button';
import {
  getChapters,
  deleteChapterCompletely,
  clearAllOfflineData,
  getStorageAnalysis
} from '../../utils/offlineLibrary';
import { formatDate, formatSize } from '../../utils/formatters';
import toast from 'react-hot-toast';

const getMangaPathFromChapterId = (chapterId = '') => {
  const cleanPath = chapterId.replace(/\/__self__$/, '');
  const segments = cleanPath.split('/').filter(Boolean);
  if (segments.length <= 1) return cleanPath;
  return segments.slice(0, -1).join('/');
};

const decodeSegment = (segment = '') => {
  try {
    return decodeURIComponent(segment);
  } catch (error) {
    return segment;
  }
};

const getFallbackMangaTitle = (mangaPath = '') => {
  if (!mangaPath) return 'Manga không tên';
  const segments = mangaPath.split('/').filter(Boolean);
  if (segments.length === 0) return 'Manga không tên';
  return decodeSegment(segments[segments.length - 1]) || 'Manga không tên';
};

const formatSourceLabel = (sourceKey) => {
  if (!sourceKey) return 'Nguồn không xác định';
  const withoutPrefix = sourceKey.replace(/^(ROOT_|V_|M_)/, '');
  return withoutPrefix
    .split(/[-_]/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(' ');
};

const getFormattedSize = (bytes) => {
  if (typeof bytes !== 'number' || Number.isNaN(bytes)) {
    return 'Không rõ';
  }
  if (bytes <= 0) {
    return '0 MB';
  }
  return formatSize(bytes);
};

export default function OfflineMangaLibrary() {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storageStats, setStorageStats] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [chapterToDelete, setChapterToDelete] = useState(null);
  const [showStorageInfoModal, setShowStorageInfoModal] = useState(false);
  const [activeSourceKey, setActiveSourceKey] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    try {
      setLoading(true);
      const items = await getChapters();
      setChapters(items);

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

  const sourcesData = useMemo(() => {
    const map = new Map();

    chapters.forEach((chapter) => {
      const sourceKey = chapter.sourceKey || 'UNKNOWN_SOURCE';
      if (!map.has(sourceKey)) {
        map.set(sourceKey, {
          sourceKey,
          displayName: formatSourceLabel(sourceKey),
          bytes: 0,
          latestUpdatedAt: 0,
          chapters: [],
          mangaMap: new Map(),
        });
      }

      const entry = map.get(sourceKey);
      entry.chapters.push(chapter);
      entry.bytes += chapter.bytes || 0;
      const chapterUpdatedAt = chapter.updatedAt || chapter.createdAt || 0;
      entry.latestUpdatedAt = Math.max(entry.latestUpdatedAt, chapterUpdatedAt);

      const mangaPath = getMangaPathFromChapterId(chapter.id || '');
      if (!entry.mangaMap.has(mangaPath)) {
        entry.mangaMap.set(mangaPath, {
          id: mangaPath,
          title: chapter.mangaTitle || getFallbackMangaTitle(mangaPath),
          coverImage: chapter.coverImage || chapter.pageUrls?.[0] || DEFAULT_IMAGES.cover,
          totalBytes: 0,
          lastUpdatedAt: 0,
          chapters: [],
        });
      }

      const mangaEntry = entry.mangaMap.get(mangaPath);
      mangaEntry.chapters.push(chapter);
      mangaEntry.totalBytes += chapter.bytes || 0;
      mangaEntry.lastUpdatedAt = Math.max(mangaEntry.lastUpdatedAt, chapterUpdatedAt);

      if (!mangaEntry.coverImage) {
        mangaEntry.coverImage = chapter.coverImage || chapter.pageUrls?.[0] || DEFAULT_IMAGES.cover;
      }
      if (!mangaEntry.title || mangaEntry.title === 'Unknown' || mangaEntry.title === 'Unknown Manga') {
        mangaEntry.title = chapter.mangaTitle || getFallbackMangaTitle(mangaPath);
      }
    });

    const sources = Array.from(map.values()).map((entry) => {
      const mangaList = Array.from(entry.mangaMap.values()).map((manga) => ({
        ...manga,
        chapters: manga.chapters
          .slice()
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
      }));

      mangaList.sort((a, b) => (b.lastUpdatedAt || 0) - (a.lastUpdatedAt || 0));

      return {
        sourceKey: entry.sourceKey,
        displayName: entry.displayName,
        bytes: entry.bytes,
        latestUpdatedAt: entry.latestUpdatedAt,
        chapterCount: entry.chapters.length,
        mangaCount: mangaList.length,
        mangaList,
      };
    });

    return sources.sort((a, b) => (b.latestUpdatedAt || 0) - (a.latestUpdatedAt || 0));
  }, [chapters]);

  useEffect(() => {
    if (activeSourceKey && !sourcesData.some((source) => source.sourceKey === activeSourceKey)) {
      setActiveSourceKey(null);
    }
  }, [activeSourceKey, sourcesData]);

  useEffect(() => {
    setSearchQuery('');
  }, [activeSourceKey]);

  const activeSource = useMemo(() => {
    if (!activeSourceKey) return null;
    return sourcesData.find((source) => source.sourceKey === activeSourceKey) || null;
  }, [activeSourceKey, sourcesData]);

  const filteredMangaList = useMemo(() => {
    if (!activeSource) return [];
    const query = searchQuery.trim().toLowerCase();
    if (!query) return activeSource.mangaList;

    return activeSource.mangaList.filter((manga) => {
      const titleMatch = manga.title?.toLowerCase().includes(query);
      if (titleMatch) return true;
      return manga.chapters.some((chapter) => {
        const haystack = `${chapter.chapterTitle || ''} ${chapter.mangaTitle || ''} ${chapter.id || ''}`.toLowerCase();
        return haystack.includes(query);
      });
    });
  }, [activeSource, searchQuery]);

  const handleDelete = async (id) => {
    try {
      const chapter = chapters.find((c) => c.id === id);
      if (!chapter) {
        toast.error('Chapter không tồn tại');
        return;
      }

      setChapterToDelete(chapter);
      setShowDeleteModal(true);
    } catch (err) {
      console.error('Error preparing delete:', err);
      toast.error('❌ Lỗi khi chuẩn bị xóa chapter');
    }
  };

  const handleConfirmDelete = async () => {
    if (!chapterToDelete) return;

    try {
      setShowDeleteModal(false);
      toast.loading('Đang xóa chapter...', { id: 'delete-chapter' });

      const result = await deleteChapterCompletely(chapterToDelete.id);

      if (result.success) {
        await load();
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

  const handleClearAll = async () => {
    try {
      setShowClearModal(false);

      if (chapters.length === 0) {
        toast.info('Không có dữ liệu để xóa');
        return;
      }

      toast.loading('Đang xóa tất cả dữ liệu offline...', { id: 'clear-all' });

      const result = await clearAllOfflineData();

      if (result.success) {
        await load();
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

  const totalSources = sourcesData.length;
  const totalChapters = chapters.length;
  const totalSize = useMemo(
    () => sourcesData.reduce((sum, source) => sum + (source.bytes || 0), 0),
    [sourcesData]
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-300">
            <span className="text-xl">📴</span>
          </div>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-400">
                  Chế độ Offline
                </p>
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                  Tiếp tục đọc manga đã tải xuống
                </h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Chọn nguồn đã lưu để xem danh sách manga và chapter tương ứng. Nội dung sẽ được tách riêng theo từng nguồn.
                </p>
              </div>
              {storageStats?.formattedSize && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:border-gray-600 dark:bg-gray-700/60 dark:text-gray-300">
                  Dung lượng đã dùng: {storageStats.formattedSize}
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
              <span>{totalSources} nguồn</span>
              <span>{totalChapters} chapter offline</span>
              <span>Tổng dung lượng: {getFormattedSize(totalSize)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {storageStats?.generatedAt
            ? `Cập nhật lần cuối: ${formatDate(storageStats.generatedAt)}`
            : 'Chưa có thống kê chi tiết'}
        </div>
        <div className="flex items-center gap-2">
          {storageStats && (
            <Button
              variant="outline"
              size="xs"
              className="gap-1.5 border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-200"
              onClick={() => setShowStorageInfoModal(true)}
            >
              <Info size={14} />
              <span>Xem thống kê</span>
            </Button>
          )}
          {chapters.length > 0 && (
            <Button
              variant="outline"
              size="xs"
              onClick={() => setShowClearModal(true)}
              className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <Trash2 size={14} />
              <span>Xóa tất cả</span>
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="mt-10 flex items-center justify-center rounded-2xl border border-dashed border-gray-300 p-16 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          Đang tải dữ liệu offline...
        </div>
      ) : chapters.length === 0 ? (
        <EmptyOfflineState />
      ) : activeSource ? (
        <SourceDetail
          source={activeSource}
          onBack={() => setActiveSourceKey(null)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          mangaList={filteredMangaList}
          onRead={handleRead}
          onDelete={handleDelete}
        />
      ) : (
        <SourcesOverview
          sources={sourcesData}
          onSelect={setActiveSourceKey}
        />
      )}

      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Xóa toàn bộ dữ liệu offline</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Thao tác này sẽ xóa {totalChapters} chapter trên {totalSources} nguồn đã lưu.
                </p>
              </div>
            </div>

            {storageStats && (
              <div className="mb-6 space-y-2 rounded-lg bg-gray-50 p-4 text-sm text-gray-600 dark:bg-gray-700/40 dark:text-gray-300">
                <div className="flex justify-between"><span>Tổng chapter:</span><span className="font-medium text-gray-900 dark:text-white">{storageStats.chapters.count}</span></div>
                <div className="flex justify-between"><span>Tổng ảnh:</span><span className="font-medium text-gray-900 dark:text-white">{storageStats.chapters.totalImages}</span></div>
                <div className="flex justify-between"><span>Dung lượng giải phóng:</span><span className="font-medium text-red-600 dark:text-red-400">{storageStats.formattedSize}</span></div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
              <Button variant="outline" onClick={() => setShowClearModal(false)}>
                Hủy
              </Button>
              <Button onClick={handleClearAll} className="bg-red-600 hover:bg-red-700 text-white">
                Xóa tất cả
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && chapterToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Xóa chapter khỏi thiết bị</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Bạn có chắc muốn xóa chapter này không?</p>
              </div>
            </div>

            <div className="mb-6 space-y-4">
              <div className="flex items-start gap-3">
                <img
                  src={chapterToDelete.pageUrls?.[0] || DEFAULT_IMAGES.cover}
                  alt="Chapter cover"
                  className="h-20 w-16 rounded border border-gray-200 object-cover dark:border-gray-600"
                  onError={(e) => {
                    e.target.src = DEFAULT_IMAGES.cover;
                  }}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white line-clamp-2" title={chapterToDelete.chapterTitle || chapterToDelete.id}>
                    {chapterToDelete.chapterTitle || chapterToDelete.id}
                  </h4>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Manga: {chapterToDelete.mangaTitle || getFallbackMangaTitle(getMangaPathFromChapterId(chapterToDelete.id))}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Tải ngày: {chapterToDelete.createdAt ? formatDate(chapterToDelete.createdAt) : 'Không rõ'}
                  </p>
                </div>
              </div>
              {chapterToDelete.bytes && (
                <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600 dark:bg-gray-700/40 dark:text-gray-300">
                  Dung lượng: {getFormattedSize(chapterToDelete.bytes)}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Hủy
              </Button>
              <Button onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
                Xóa chapter
              </Button>
            </div>
          </div>
        </div>
      )}

      {showStorageInfoModal && storageStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Thống kê lưu trữ offline</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Cập nhật lần cuối: {storageStats?.generatedAt ? formatDate(storageStats.generatedAt) : 'Không xác định'}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowStorageInfoModal(false)}>
                Đóng
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/40">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Chapters</h4>
                <p className="mt-1 text-2xl font-semibold text-primary-600 dark:text-primary-400">{storageStats.chapters.count}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{storageStats.chapters.totalImages} ảnh</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/40">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Dung lượng</h4>
                <p className="mt-1 text-2xl font-semibold text-green-600 dark:text-green-400">{storageStats.formattedSize}</p>
                {storageStats.quota && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Đã dùng {storageStats.quota.percentage}% quota</p>
                )}
              </div>
            </div>

            {storageStats.quota && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Dung lượng chi tiết</h4>
                <div className="mt-2 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className={`h-2 rounded-full ${
                      storageStats.quota.percentage > 90
                        ? 'bg-red-500'
                        : storageStats.quota.percentage > 75
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(100, storageStats.quota.percentage)}%` }}
                  ></div>
                </div>
                <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Đã dùng: {formatSize(storageStats.quota.usage)}</span>
                  <span>Còn trống: {formatSize(storageStats.quota.available)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const EmptyOfflineState = () => (
  <div className="mt-10 rounded-2xl border border-dashed border-gray-300 p-12 text-center text-sm text-gray-600 dark:border-gray-700 dark:text-gray-400">
    <div className="text-5xl mb-4">📚</div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Chưa có chapter nào được lưu</h3>
    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
      Tải chapter yêu thích trong chế độ đọc để xem chúng tại đây khi không có kết nối.
    </p>
  </div>
);

const SourcesOverview = ({ sources, onSelect }) => (
  <div className="mt-8 space-y-4">
    <div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Nguồn manga đã lưu</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Danh sách các nguồn hiện có dữ liệu offline. Chọn một nguồn để xem manga tương ứng.
      </p>
    </div>

    <div className="space-y-3">
      {sources.map((source) => (
        <SourceCard key={source.sourceKey} source={source} onSelect={onSelect} />
      ))}
    </div>
  </div>
);

const SourceCard = ({ source, onSelect }) => (
  <button
    onClick={() => onSelect(source.sourceKey)}
    className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left transition-all duration-200 hover:border-primary-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-primary-500"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-300">
          <Database size={18} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">{source.displayName}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {source.mangaCount} manga · {source.chapterCount} chapter
          </p>
        </div>
      </div>
      <div className="text-right text-xs text-gray-500 dark:text-gray-400">
        <div>Dung lượng: {getFormattedSize(source.bytes)}</div>
        <div>Cập nhật: {source.latestUpdatedAt ? formatDate(source.latestUpdatedAt) : 'Không rõ'}</div>
      </div>
    </div>
    <div className="mt-4 flex items-center justify-between text-sm font-medium text-primary-600 dark:text-primary-400">
      <span>Xem danh sách manga</span>
      <ChevronRight size={18} />
    </div>
  </button>
);

const SourceDetail = ({ source, onBack, searchQuery, onSearchChange, mangaList, onRead, onDelete }) => (
  <div className="mt-8 space-y-6">
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-200"
        onClick={onBack}
      >
        <ArrowLeft size={16} />
        Tất cả nguồn
      </Button>
      <span className="text-sm text-gray-500 dark:text-gray-400">Đang xem: {source.displayName}</span>
    </div>

    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tổng quan nguồn</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nguồn này chứa {source.mangaCount} manga và {source.chapterCount} chapter offline.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:w-1/2">
          <StatItem icon={Database} label="Manga" value={source.mangaCount} />
          <StatItem icon={Layers} label="Chapter" value={source.chapterCount} />
          <StatItem icon={HardDrive} label="Dung lượng" value={getFormattedSize(source.bytes)} />
          <StatItem icon={Calendar} label="Cập nhật" value={source.latestUpdatedAt ? formatDate(source.latestUpdatedAt) : 'Không rõ'} />
        </div>
      </div>
    </div>

    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm theo tên manga hoặc chapter..."
          className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
      </div>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Đang hiển thị {mangaList.length} / {source.mangaList.length} manga đã lưu.
      </p>
    </div>

    {mangaList.length === 0 ? (
      <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
        Không tìm thấy manga phù hợp với từ khóa.
      </div>
    ) : (
      <div className="space-y-4">
        {mangaList.map((manga) => (
          <MangaOfflineCard key={manga.id} manga={manga} onRead={onRead} onDelete={onDelete} />
        ))}
      </div>
    )}
  </div>
);

const StatItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-600 dark:bg-gray-700/40">
    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white text-primary-600 shadow-sm dark:bg-gray-800 dark:text-primary-400">
      <Icon size={16} />
    </div>
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</div>
      <div className="text-sm font-semibold text-gray-900 dark:text-white">{value}</div>
    </div>
  </div>
);

const MangaOfflineCard = ({ manga, onRead, onDelete }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="flex h-28 w-full flex-shrink-0 overflow-hidden rounded-xl border border-gray-200 sm:w-24 dark:border-gray-600">
        <img
          src={manga.coverImage || DEFAULT_IMAGES.cover}
          alt={manga.title}
          className="h-full w-full object-cover"
          onError={(e) => {
            e.target.src = DEFAULT_IMAGES.cover;
          }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-2" title={manga.title}>
              {manga.title}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {manga.chapters.length} chapter · {getFormattedSize(manga.totalBytes)}
            </p>
          </div>
          <div className="text-right text-xs text-gray-500 dark:text-gray-400">
            Cập nhật: {manga.lastUpdatedAt ? formatDate(manga.lastUpdatedAt) : 'Không rõ'}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {manga.chapters.map((chapter) => (
            <ChapterRow key={chapter.id} chapter={chapter} onRead={onRead} onDelete={onDelete} />
          ))}
        </div>
      </div>
    </div>
  </div>
);

const ChapterRow = ({ chapter, onRead, onDelete }) => {
  const handleReadClick = (event) => {
    event.stopPropagation();
    onRead(chapter);
  };

  const handleDeleteClick = (event) => {
    event.stopPropagation();
    onDelete(chapter.id);
  };

  const chapterTitle = chapter.chapterTitle || decodeSegment(chapter.id?.split('/')?.pop() || '');

  return (
    <div
      className="group flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm transition hover:border-primary-200 hover:bg-primary-50 dark:border-gray-600 dark:bg-gray-700/40 dark:hover:border-primary-500"
      onClick={() => onRead(chapter)}
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium text-gray-900 dark:text-white line-clamp-1">{chapterTitle}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {chapter.createdAt ? formatDate(chapter.createdAt) : 'Không rõ'}
          {chapter.totalPages ? ` • ${chapter.totalPages} trang` : ''}
          {chapter.bytes ? ` • ${getFormattedSize(chapter.bytes)}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button size="xs" onClick={handleReadClick}>
          Đọc
        </Button>
        <button
          onClick={handleDeleteClick}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 transition hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
          title="Xóa chapter"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};
