// 📁 src/pages/movie/MovieHome.jsx
// 🎬 Trang duyệt phim. Khung giao diện dùng chung với Manga/Music: BrowseLayout + useFolderBrowser.
// Trang chỉ giữ phần riêng của Movie: tải danh sách theo nguồn V_*, slider, xoá.

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMovieStore, useAuthStore } from '@/store';
import MovieCard from '@/components/movie/MovieCard';
import MovieRandomSection from '@/components/movie/MovieRandomSection';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';
import BrowseLayout from '@/components/common/BrowseLayout';
import useFolderBrowser, { naturalCompare } from '@/hooks/useFolderBrowser';

const fileExt = (item) => (item.type === 'folder' ? '' : item.path?.split('.').pop()?.toLowerCase() || '');

const SORT_OPTIONS = [
  { value: 'name', label: 'Tên A→Z' },
  { value: 'views', label: 'Xem nhiều' },
  { value: 'type', label: 'Loại file' },
];
const SORTERS = {
  views: (a, b) => (b.viewCount || 0) - (a.viewCount || 0),
  type: (a, b) => naturalCompare(fileExt(a), fileExt(b)),
};
// Lọc theo tên và đường dẫn, không phân biệt dấu
const searchFields = (item) => [item.name, item.path];

const MovieHome = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { sourceKey } = useAuthStore();
  const {
    movieList,
    currentPath,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    fetchMovieFolders,
    clearMovieCache,
    deleteItem
  } = useMovieStore();

  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Redirect to home only when there's no sourceKey; don't bounce when switching sections
  useEffect(() => {
    if (!sourceKey) navigate('/');
  }, [sourceKey, navigate]);

  // Clear cache when sourceKey changes (fetch handled by URL effect)
  useEffect(() => {
    if (sourceKey && sourceKey.startsWith('V_')) {
      clearMovieCache();
    }
  }, [sourceKey, clearMovieCache]);

  // Load path from URL (only when URL path changes)
  const lastFetchRef = React.useRef('');
  useEffect(() => {
    const pathFromUrl = searchParams.get('path') || '';
    const fetchKey = `${sourceKey || ''}|${pathFromUrl}`;
    if (!sourceKey || !sourceKey.startsWith('V_')) return;
    // Avoid duplicate fetch for same key (handles StrictMode double run)
    if (lastFetchRef.current === fetchKey && movieList.length > 0) return;
    lastFetchRef.current = fetchKey;
    fetchMovieFolders(pathFromUrl);
  }, [searchParams, fetchMovieFolders, sourceKey]);

  const browser = useFolderBrowser({
    type: 'movie',
    items: movieList,
    searchTerm,
    searchFields,
    sortOptions: SORT_OPTIONS,
    sorters: SORTERS,
  });

  // Mở một thư mục: chỉ đổi URL, việc tải do effect phía trên lo (tránh gọi API hai lần)
  const navigateToPath = (path) => setSearchParams(path ? { path } : {});

  const handleGoBack = () => {
    if (!currentPath) {
      navigate('/');
      return;
    }
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    navigateToPath(parts.join('/'));
  };

  return (
    <BrowseLayout
      type="movie"
      currentPath={currentPath}
      onNavigatePath={navigateToPath}
      onBack={handleGoBack}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      browser={browser}
      loading={loading}
      error={error}
      onRetry={() => fetchMovieFolders(currentPath)}
      topSlot={<div className="mb-4 sm:mb-6"><MovieRandomSection /></div>}
      emptyText="Thư mục này chưa có phim, hoặc chưa được quét."
      renderItem={(item, mode) => (
        <MovieCard
          key={item.path}
          item={item}
          variant={mode}
          onDeleteClick={(it) => setItemToDelete(it)}
        />
      )}
    >
      <DeleteConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={async () => {
          if (!itemToDelete) return;
          setIsDeleting(true);
          try {
            await deleteItem(itemToDelete.path);
            setItemToDelete(null);
          } catch (err) {
            console.error('Delete failed:', err);
          } finally {
            setIsDeleting(false);
          }
        }}
        itemName={itemToDelete?.name || itemToDelete?.path?.split('/').pop() || ''}
        itemType={itemToDelete?.type === 'folder' ? 'folder' : 'file'}
        isDeleting={isDeleting}
      />
    </BrowseLayout>
  );
};

export default MovieHome;
