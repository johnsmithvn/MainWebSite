// 📁 src/pages/manga/MangaHome.jsx
// 🏠 Trang duyệt manga. Khung giao diện (thanh công cụ, lưới, phân trang...) dùng chung: BrowseLayout + useFolderBrowser.
// Trang này chỉ giữ phần riêng của Manga: chọn thư mục gốc, tải danh sách, chuyển sang trình đọc,
// đầu trang bộ truyện ("Đọc tiếp"), nhảy về truyện vừa đọc (?focus=), xoá và yêu thích.

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMangaStore, useUIStore, useAuthStore } from '../../store';
import MangaCard from '../../components/manga/MangaCard';
import MangaRandomSection from '../../components/manga/MangaRandomSection';
import MangaSeriesHeader from '../../components/manga/MangaSeriesHeader';
import DeleteConfirmModal from '../../components/common/DeleteConfirmModal';
import BrowseLayout from '../../components/common/BrowseLayout';
import useFolderBrowser from '../../hooks/useFolderBrowser';
import { useRecentManager } from '../../hooks/useRecentManager';

// Manga chỉ lọc theo tên (API mode=path chỉ trả name/path/thumbnail và số đếm)
const searchFields = (item) => [item.name];

const MangaHome = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    mangaList,
    currentPath,
    loading,
    error,
    favorites,
    searchTerm,
    shouldNavigateToReader,
    favoritesRefreshTrigger, // Add this to listen for favorite changes
    setSearchTerm,
    fetchMangaFolders,
    fetchFavorites,
    toggleFavorite,
    deleteItem,
    clearNavigationFlag,
    clearMangaCache
  } = useMangaStore();

  const { sourceKey, rootFolder, setRootFolder } = useAuthStore();
  const { showToast } = useUIStore();
  const { getRecentItems } = useRecentManager('manga');

  const [localRefreshTrigger, setLocalRefreshTrigger] = useState(0); // For forcing re-renders
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const viewParam = searchParams.get('view');
  const showRandomSection = !searchParams.get('path') && viewParam !== 'folder';
  const focusParam = searchParams.get('focus');

  // Guard: ensure we have a sourceKey; then ensure a root is selected or present in URL
  useEffect(() => {
    if (!sourceKey) {
      navigate('/', { replace: true });
      return;
    }
    // Sync root from URL to store; or redirect to select if missing
    const urlRoot = searchParams.get('root') || '';
    if (urlRoot) {
      if (urlRoot !== rootFolder) {
        setRootFolder(urlRoot);
      }
    } else {
      if (!rootFolder) {
        navigate('/manga/select', { replace: true });
        return;
      }
      // Ensure root appears in URL for consistency/caching
      const params = new URLSearchParams(searchParams);
      params.set('root', rootFolder);
      // Use replace to avoid adding an extra history entry for normalization
      setSearchParams(params, { replace: true });
    }
  }, [sourceKey, rootFolder, searchParams, navigate, setRootFolder, setSearchParams]);

  // Clear cache when sourceKey changes (fetch handled by URL effect)
  useEffect(() => {
    if (sourceKey && sourceKey.startsWith('ROOT_')) {
      clearMangaCache();
    }
  }, [sourceKey, clearMangaCache]);

  // Track last favorites fetch / last fetched key to avoid duplicates (StrictMode)
  const lastFavKeyRef = React.useRef('');
  const lastFetchRef = React.useRef('');

  useEffect(() => {
    const urlPath = searchParams.get('path') || '';
    const fetchKey = `${sourceKey || ''}|${urlPath}`;

    if (sourceKey && sourceKey.startsWith('ROOT_')) {
      // Avoid duplicate fetch for same key (handles StrictMode double run)
      if (!(lastFetchRef.current === fetchKey && mangaList.length > 0)) {
        lastFetchRef.current = fetchKey;
        fetchMangaFolders(urlPath);
      }

      // Fetch favorites once per sourceKey/root
      const favKey = `${sourceKey}|${rootFolder}`;
      if (lastFavKeyRef.current !== favKey) {
        lastFavKeyRef.current = favKey;
        fetchFavorites();
      }
    }
  }, [searchParams, fetchMangaFolders, fetchFavorites, sourceKey, mangaList.length, rootFolder]);

  // Khi API trả về type 'reader' (thư mục chỉ có ảnh) thì mở thẳng trình đọc.
  // view=folder (từ trình đọc quay lại) thì giữ dạng thư mục.
  useEffect(() => {
    if (shouldNavigateToReader) {
      if (viewParam !== 'folder') {
        // Do NOT replace history so browser Back returns to the folder list
        navigate(`/manga/reader?path=${encodeURIComponent(shouldNavigateToReader)}`);
      }
      clearNavigationFlag();
    }
  }, [shouldNavigateToReader, navigate, clearNavigationFlag, viewParam]);

  // Force refresh khi favorites thay đổi
  useEffect(() => {
    if (favoritesRefreshTrigger > 0 && mangaList && mangaList.length > 0) {
      setLocalRefreshTrigger(prev => prev + 1);
    }
  }, [favoritesRefreshTrigger, mangaList]);

  // ===== Đầu trang bộ truyện (khi đang ở trong một thư mục) =====
  // Mục "__self__" (ảnh nằm ngay trong thư mục này) chuyển thành nút ở đầu trang, không hiện thành card nữa
  const selfItem = React.useMemo(() => mangaList?.find((m) => m.isSelfReader) || null, [mangaList]);
  const showSeriesHeader = Boolean(currentPath) && !loading && (mangaList?.length || 0) > 0;
  const gridSource = React.useMemo(
    () => (showSeriesHeader && selfItem ? mangaList.filter((m) => !m.isSelfReader) : mangaList || []),
    [mangaList, showSeriesHeader, selfItem]
  );

  const browser = useFolderBrowser({ type: 'manga', items: gridSource, searchTerm, searchFields });
  const { sortedItems, size, pageParam, updateParams } = browser;

  const navigateToPath = (path) => {
    const params = new URLSearchParams();
    if (path) params.set('path', path);
    params.set('page', '1');
    params.set('size', String(size));
    navigate(`/manga?${params.toString()}`);
  };

  const openReader = (path, extra = {}) => {
    const readerParams = new URLSearchParams();
    readerParams.set('path', path);
    Object.entries(extra).forEach(([k, v]) => readerParams.set(k, v));
    // Giữ URL trang hiện tại để nút Back của trình đọc quay về đúng chỗ
    readerParams.set('returnUrl', `${window.location.pathname}${window.location.search}`);
    navigate(`/manga/reader?${readerParams.toString()}`);
  };

  const handleFolderClick = (folder) => {
    if (folder.type === 'pdf') {
      openReader(folder.path, { type: 'pdf' }); // render PDF thay vì ảnh
      return;
    }
    if (folder.isSelfReader && folder.images) {
      openReader(folder.path);
      return;
    }
    // Thư mục con: mở bằng URL (API trả 'reader' thì effect phía trên tự chuyển sang trình đọc)
    navigateToPath(folder.path);
  };

  const handleGoBack = () => {
    if (!currentPath) {
      navigate('/');
      return;
    }
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    navigateToPath(parts.join('/'));
  };

  const handleToggleFavorite = async (item) => {
    try {
      // Gọi toggleFavorite từ store (đã có updateFavoriteInAllCaches)
      await toggleFavorite(item);
      // Force refresh local component để hiển thị thay đổi ngay lập tức
      setLocalRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Error toggling favorite:', err);
      showToast?.(err.message || 'Lỗi cập nhật yêu thích', 'error');
    }
  };

  const handleDeleteItem = async (path) => {
    setIsDeleting(true);
    try {
      const result = await deleteItem(path);
      showToast?.(result.data.message || 'Đã xóa folder', 'success');
      setItemToDelete(null);
      // Refresh lại danh sách
      await fetchMangaFolders(currentPath);
    } catch (err) {
      console.error('Error deleting item:', err);
      showToast?.(err.message || 'Lỗi khi xóa folder', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const seriesInfo = React.useMemo(() => {
    if (!showSeriesHeader) return null;
    const children = mangaList.filter((m) => !m.isSelfReader);
    return {
      name: currentPath.split('/').filter(Boolean).pop() || currentPath,
      cover: selfItem?.thumbnail || mangaList.find((m) => m.thumbnail)?.thumbnail || null,
      chapterCount: children.filter((m) => m.type !== 'pdf').length,
      pdfCount: children.filter((m) => m.type === 'pdf').length,
      imageCount: selfItem?.images?.length || 0,
    };
  }, [showSeriesHeader, mangaList, currentPath, selfItem]);

  // "Đọc tiếp": mục đọc gần nhất nằm trong thư mục này (lấy từ lịch sử Recent)
  const continueItem = React.useMemo(() => {
    if (!showSeriesHeader) return null;
    const prefix = `${currentPath}/`;
    return getRecentItems().find((r) => typeof r.path === 'string' && r.path.startsWith(prefix)) || null;
  }, [showSeriesHeader, currentPath, getRecentItems, mangaList]);

  // Card con chứa vị trí đang đọc (để đánh dấu "Đang đọc")
  const readingChildPath = React.useMemo(() => {
    if (!continueItem) return null;
    const child = gridSource.find((m) => continueItem.path === m.path || continueItem.path.startsWith(`${m.path}/`));
    return child?.path || null;
  }, [continueItem, gridSource]);

  // Quay lại từ trình đọc với ?focus=: tự chuyển tới trang có truyện vừa đọc
  const focusHandledRef = React.useRef('');
  useEffect(() => {
    if (!focusParam || !sortedItems?.length) return;
    const key = `${focusParam}|${size}`;
    if (focusHandledRef.current === key) return; // already handled
    focusHandledRef.current = key;
    const idx = sortedItems.findIndex(i => i.path === focusParam);
    if (idx >= 0) {
      const pageOfItem = Math.floor(idx / size) + 1;
      if (pageOfItem !== pageParam) updateParams({ page: String(pageOfItem) });
    }
  }, [focusParam, sortedItems, size, pageParam, updateParams]);

  // Lỗi tải danh sách: BrowseLayout giữ thanh công cụ và hiện thông báo kèm nút "Thử lại" (trước đây thay cả trang)
  let seriesHeader = null;
  if (seriesInfo) {
    const firstChild = sortedItems.find((m) => m.type !== 'pdf') || sortedItems[0];
    const primary = continueItem
      ? {
          label: `Đọc tiếp · ${continueItem.name === '__self__' ? seriesInfo.name : continueItem.name}`,
          onClick: () => openReader(continueItem.path),
        }
      : firstChild
        ? { label: 'Đọc từ đầu', onClick: () => handleFolderClick(firstChild) }
        : selfItem
          ? { label: 'Đọc ngay', onClick: () => handleFolderClick(selfItem) }
          : null;
    const isFav = favorites.some((f) => f.path === currentPath);
    seriesHeader = (
      <MangaSeriesHeader
        info={seriesInfo}
        continueItem={continueItem}
        primary={primary}
        onOpenImages={selfItem && sortedItems.length > 0 ? () => handleFolderClick(selfItem) : null}
        isFavorite={isFav}
        onToggleFavorite={() => handleToggleFavorite({ name: seriesInfo.name, path: currentPath, thumbnail: seriesInfo.cover, isFavorite: isFav })}
      />
    );
  }

  return (
    <BrowseLayout
      type="manga"
      currentPath={currentPath}
      onNavigatePath={navigateToPath}
      onBack={handleGoBack}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      browser={browser}
      loading={loading}
      error={error}
      onRetry={() => fetchMangaFolders(currentPath)}
      // Slider chỉ hiển thị ở thư mục gốc để giảm tải khi quay lại từ trình đọc
      topSlot={showRandomSection ? <div className="mb-4 sm:mb-6"><MangaRandomSection /></div> : null}
      headerSlot={seriesHeader}
      emptyText="Thư mục này chưa có truyện, hoặc chưa được quét."
      renderItem={(item, mode) => (
        <MangaCard
          key={`${item.path || item.name}-${localRefreshTrigger}`}
          manga={item}
          isFavorite={Boolean(item.isFavorite) || favorites.some(f => f.path === item.path)}
          onToggleFavorite={() => handleToggleFavorite(item)}
          onDeleteClick={(manga) => setItemToDelete(manga)}
          onClick={handleFolderClick}
          variant={mode}
          statusLabel={item.path === readingChildPath ? 'Đang đọc' : undefined}
        />
      )}
    >
      <DeleteConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={async () => {
          if (itemToDelete) {
            await handleDeleteItem(itemToDelete.path);
          }
        }}
        itemName={itemToDelete?.name || ''}
        itemType="manga folder"
        isDeleting={isDeleting}
      />
    </BrowseLayout>
  );
};

export default MangaHome;
