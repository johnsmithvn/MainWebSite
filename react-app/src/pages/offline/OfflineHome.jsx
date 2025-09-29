import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/common/Button';
import { getChapters } from '@/utils/offlineLibrary';
import { formatDate, formatSize } from '@/utils/formatters';

const getMangaPathFromChapterId = (chapterId = '') => {
  const cleanPath = chapterId.replace(/\/__self__$/, '');
  const segments = cleanPath.split('/').filter(Boolean);
  if (segments.length <= 1) return cleanPath;
  return segments.slice(0, -1).join('/');
};

const formatSourceLabel = (sourceKey = '') => {
  if (!sourceKey) return 'Nguồn không xác định';
  const withoutPrefix = sourceKey.replace(/^(ROOT_|V_|M_)/, '');
  return withoutPrefix
    .split(/[-_]/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(' ');
};

const formatSizeSafe = (bytes) => {
  if (!bytes || Number.isNaN(bytes)) return '0 MB';
  return formatSize(bytes);
};

const OfflineHome = () => {
  const navigate = useNavigate();
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const items = await getChapters();
        if (mounted) {
          setChapters(items || []);
        }
      } catch (error) {
        console.error('Failed to load offline chapters', error);
        if (mounted) {
          setChapters([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const sources = useMemo(() => {
    const map = new Map();

    chapters.forEach((chapter) => {
      const sourceKey = chapter?.sourceKey || 'UNKNOWN_SOURCE';

      if (!map.has(sourceKey)) {
        map.set(sourceKey, {
          sourceKey,
          displayName: formatSourceLabel(sourceKey),
          rootFolder: chapter?.rootFolder || chapter?.root || null,
          bytes: 0,
          chapterCount: 0,
          mangaPaths: new Set(),
          lastUpdated: 0,
        });
      }

      const entry = map.get(sourceKey);
      entry.chapterCount += 1;
      entry.bytes += chapter?.bytes || 0;
      const chapterUpdatedAt = chapter?.updatedAt || chapter?.createdAt || 0;
      entry.lastUpdated = Math.max(entry.lastUpdated, chapterUpdatedAt);

      const mangaPath = getMangaPathFromChapterId(chapter?.id || '');
      if (mangaPath) {
        entry.mangaPaths.add(mangaPath);
      }

      if (!entry.rootFolder && (chapter?.rootFolder || chapter?.root)) {
        entry.rootFolder = chapter?.rootFolder || chapter?.root;
      }
    });

    return Array.from(map.values())
      .map((entry) => ({
        sourceKey: entry.sourceKey,
        displayName: entry.displayName,
        rootFolder: entry.rootFolder,
        chapterCount: entry.chapterCount,
        mangaCount: entry.mangaPaths.size,
        bytes: entry.bytes,
        lastUpdated: entry.lastUpdated,
      }))
      .sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
  }, [chapters]);

  const totalSummary = useMemo(() => {
    const totalChapters = chapters.length;
    const totalSources = sources.length;
    const totalBytes = sources.reduce((acc, source) => acc + (source.bytes || 0), 0);

    return {
      totalChapters,
      totalSources,
      totalBytes,
    };
  }, [chapters.length, sources]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div className="text-center space-y-3">
        <div className="text-5xl">📚</div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
          Chọn nguồn manga đã tải xuống
        </h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Mỗi nguồn (root) chứa danh sách manga riêng biệt. Hãy chọn nguồn cần đọc để mở thư viện offline tương ứng.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 text-xs md:text-sm text-gray-500 dark:text-gray-400">
        <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1">
          {totalSummary.totalSources} nguồn offline
        </span>
        <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1">
          {totalSummary.totalChapters} chapter đã lưu
        </span>
        <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1">
          Tổng dung lượng: {formatSizeSafe(totalSummary.totalBytes)}
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-primary-500"></div>
        </div>
      ) : sources.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900/40 text-center py-12 px-6 space-y-4">
          <div className="text-5xl">🗂️</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Chưa có dữ liệu offline</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Hãy quay lại khi trực tuyến và tải xuống chapter để đọc offline. Sau khi tải, nguồn sẽ hiển thị tại đây.
          </p>
          <Button onClick={() => navigate('/')}>Về trang chủ</Button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {sources.map((source) => (
            <div
              key={source.sourceKey}
              className="flex flex-col rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/90 shadow-sm p-6 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-400">Nguồn</p>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {source.displayName}
                  </h2>
                  {source.rootFolder && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 break-all">
                      Root: {source.rootFolder}
                    </p>
                  )}
                </div>
                <span className="rounded-full bg-primary-50 text-primary-600 dark:bg-primary-500/20 dark:text-primary-200 px-3 py-1 text-xs font-semibold">
                  {source.mangaCount} manga
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <p>
                  <span className="font-medium text-gray-900 dark:text-white">{source.chapterCount}</span> chapter đã lưu
                </p>
                <p>Dung lượng: {formatSizeSafe(source.bytes)}</p>
                {source.lastUpdated ? (
                  <p>Cập nhật lần cuối: {formatDate(source.lastUpdated)}</p>
                ) : (
                  <p className="text-gray-400 dark:text-gray-500">Chưa có thời gian cập nhật</p>
                )}
              </div>

              <Button
                className="w-full justify-center"
                onClick={() => navigate(`/offline/manga?source=${encodeURIComponent(source.sourceKey)}`)}
              >
                Mở thư viện
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="text-center text-xs text-gray-500 dark:text-gray-400">
        Lưu ý: nội dung offline chỉ hiển thị đúng với nguồn đã chọn. Hãy đảm bảo bạn đã tải chapter cho nguồn tương ứng trước khi chuyển sang chế độ offline.
      </div>
    </div>
  );
};

export default OfflineHome;
