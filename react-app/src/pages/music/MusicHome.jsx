// 📁 src/pages/music/MusicHome.jsx
// 🎵 Trang duyệt nhạc. Khung giao diện dùng chung với Manga/Movie: BrowseLayout + useFolderBrowser.
// Trang chỉ giữ phần riêng của Music: tải danh sách theo nguồn M_*, slider, xoá.

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore, useMusicStore } from '@/store';
import MusicCard from '@/components/music/MusicCard';
import MusicRandomSection from '@/components/music/MusicRandomSection';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';
import BrowseLayout from '@/components/common/BrowseLayout';
import useFolderBrowser, { naturalCompare } from '@/hooks/useFolderBrowser';

// Thư mục luôn lên đầu (khai báo trong config/contentTypes), rồi sắp theo lựa chọn
const SORT_OPTIONS = [
  { value: 'name', label: 'Tên A→Z' },
  { value: 'artist', label: 'Ca sĩ' },
  { value: 'album', label: 'Album' },
  { value: 'views', label: 'Nghe nhiều' },
];
const SORTERS = {
  artist: (a, b) => naturalCompare(a.artist || '', b.artist || ''),
  album: (a, b) => naturalCompare(a.album || '', b.album || ''),
  views: (a, b) => (b.viewCount || 0) - (a.viewCount || 0),
};
// Lọc theo tên, ca sĩ, album, tiêu đề, đường dẫn; không phân biệt dấu
const searchFields = (item) => [item.name, item.artist, item.album, item.title, item.path];

const MusicHome = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { sourceKey } = useAuthStore();
  const {
    musicList,
    currentPath,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    fetchMusicFolders,
    clearMusicCache,
    deleteItem
  } = useMusicStore();

  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Track last fetch to avoid duplicate calls (StrictMode/multiple effects)
  const lastFetchRef = useRef('');

  // Redirect to home only when there's no sourceKey; don't bounce when switching sections
  useEffect(() => {
    if (!sourceKey) navigate('/');
  }, [sourceKey, navigate]);

  // Clear cache when sourceKey changes (do not fetch here to avoid duplicate with URL effect)
  useEffect(() => {
    if (sourceKey) {
      clearMusicCache();
      // Reset last fetch guard so URL effect can fetch once
      lastFetchRef.current = '';
    }
  }, [sourceKey, clearMusicCache]);

  // Load path from URL and fetch (single place to fetch)
  useEffect(() => {
    const urlPath = searchParams.get('path') || '';
    const fetchKey = `${sourceKey || ''}|${urlPath}`;
    if (lastFetchRef.current === fetchKey) return;
    // Only for music sources, like Movie/Manga
    if (sourceKey && sourceKey.startsWith('M_')) {
      lastFetchRef.current = fetchKey;
      fetchMusicFolders(urlPath);
    }
  }, [searchParams, fetchMusicFolders, sourceKey]);

  const browser = useFolderBrowser({
    type: 'music',
    items: musicList,
    searchTerm,
    searchFields,
    sortOptions: SORT_OPTIONS,
    sorters: SORTERS,
  });

  // Mở một thư mục: chỉ đổi URL, việc tải do effect phía trên lo
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
      type="music"
      currentPath={currentPath}
      onNavigatePath={navigateToPath}
      onBack={handleGoBack}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      browser={browser}
      loading={loading}
      error={error}
      onRetry={() => fetchMusicFolders(currentPath)}
      topSlot={<div className="mb-4 sm:mb-6"><MusicRandomSection /></div>}
      emptyText="Thư mục này chưa có bài hát, hoặc chưa được quét."
      renderItem={(item, mode) => (
        <MusicCard
          key={item.path}
          item={item}
          showViews={true}
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

export default MusicHome;
