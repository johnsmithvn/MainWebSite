// 📁 src/pages/manga/MangaHome.jsx
// 🏠 Trang chủ manga - hiển thị danh sách manga

import React, { useState, useEffect, useRef } from 'react';
import { Search, Heart, BookOpen, Grid, List, Filter, Loader, ArrowLeft } from 'lucide-react';
import { FiArrowLeft, FiHome, FiGrid, FiList } from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMangaStore, useUIStore, useAuthStore } from '../../store';
import Button from '../../components/common/Button';
import Breadcrumb from '../../components/common/Breadcrumb';
import MangaCard from '../../components/manga/MangaCard';
import MangaRandomSection from '../../components/manga/MangaRandomSection';
import { DEFAULT_IMAGES } from '../../constants';

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
    clearNavigationFlag,
    clearMangaCache
  } = useMangaStore();
  
  const { sourceKey, rootFolder, setRootFolder } = useAuthStore();
  
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('name');
  const [showFilters, setShowFilters] = useState(false);
  const [localRefreshTrigger, setLocalRefreshTrigger] = useState(0); // For forcing re-renders
  const viewParam = searchParams.get('view');
  const showRandomSection = !searchParams.get('path') && viewParam !== 'folder';
  const focusParam = searchParams.get('focus');
  // Pagination state from URL with localStorage-backed default for page size
  const pageParam = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const sizeParam = (() => {
    const urlVal = parseInt(searchParams.get('size') || '', 10);
    if (!Number.isNaN(urlVal) && urlVal > 0) return urlVal;
    try {
      const stored = parseInt(localStorage.getItem('manga.perPage') || '', 10);
      if (!Number.isNaN(stored) && stored > 0) return stored;
    } catch (_) {}
    return 30;
  })();
  const [jumpOpen, setJumpOpen] = useState(false);
  const [jumpValue, setJumpValue] = useState(String(pageParam));
  const headerRef = useRef(null);

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

  // Helper to update URL params
  const updateParams = (patch = {}) => {
    const obj = Object.fromEntries(searchParams.entries());
    const next = { ...obj, ...patch };
    // Remove empty keys
    Object.keys(next).forEach((k) => {
      if (next[k] === undefined || next[k] === null || next[k] === '') delete next[k];
    });
    setSearchParams(next);
  };

  // Clear cache when sourceKey changes (fetch handled by URL effect)
  useEffect(() => {
    if (sourceKey && sourceKey.startsWith('ROOT_')) {
      console.log('🏠 MangaHome: SourceKey changed to:', sourceKey, '- Clearing cache');
      clearMangaCache();
    }
  }, [sourceKey, clearMangaCache]);

  // Track last favorites fetch to avoid duplicates (StrictMode)
  const lastFavKeyRef = React.useRef('');

  // Track last fetched key to avoid duplicate fetches (similar to Movie)
  const lastFetchRef = React.useRef('');

  useEffect(() => {
    // Handle URL path parameter
    const urlPath = searchParams.get('path') || '';
    const fetchKey = `${sourceKey || ''}|${urlPath}`;

  if (sourceKey && sourceKey.startsWith('ROOT_')) {
      // Avoid duplicate fetch for same key (handles StrictMode double run)
      if (lastFetchRef.current === fetchKey && mangaList.length > 0) {
        console.log('📚 MangaHome: Skipping fetch, same fetchKey and list already loaded');
      } else {
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

  // Persist per-page selection whenever it changes (including via URL)
  useEffect(() => {
    try { localStorage.setItem('manga.perPage', String(sizeParam)); } catch (_) {}
  }, [sizeParam]);

  // Effect để handle navigation to reader khi API trả về type: 'reader'
  // Respect view=folder flag to force list view when coming from reader
  useEffect(() => {
    if (shouldNavigateToReader) {
      if (viewParam === 'folder') {
        // Skip redirect to reader when explicitly forcing folder view
        clearNavigationFlag();
      } else {
        // Do NOT replace history so browser Back returns to the folder list
        navigate(`/manga/reader?path=${encodeURIComponent(shouldNavigateToReader)}`);
        clearNavigationFlag(); // Clear flag sau khi navigate
      }
    }
  }, [shouldNavigateToReader, navigate, clearNavigationFlag, viewParam]);

  // Force refresh khi favorites thay đổi
  useEffect(() => {
    if (favoritesRefreshTrigger > 0 && mangaList && mangaList.length > 0) {
      console.log('🔄 MangaHome GridView: Favorites changed, updating display');
      setLocalRefreshTrigger(prev => prev + 1);
    }
  }, [favoritesRefreshTrigger, mangaList]);

  const handleFolderClick = (folder) => {
    console.log('🔍 Clicked folder:', folder);
    
    // Logic theo frontend cũ - không validation path
    // if (folder.isSelfReader && folder.images) -> go to reader
    // else -> loadFolder(folder.path)
    
  if (folder.isSelfReader && folder.images) {
      // Đây là selfReader entry với images -> đi đến reader
      console.log('📖 Opening reader for selfReader with images:', folder.path);
      const readerParams = new URLSearchParams();
      readerParams.set('path', folder.path);
      // Preserve current manga home URL for back navigation
      readerParams.set('returnUrl', `${window.location.pathname}${window.location.search}`);
      navigate(`/manga/reader?${readerParams.toString()}`);
      return;
    }
    
    // Ngược lại -> navigate đến subfolder bằng URL giống Movie
  console.log('📁 Navigating to subfolder via URL:', folder.path);
  const params = new URLSearchParams();
  if (folder.path) params.set('path', folder.path);
  params.set('page', '1');
  params.set('size', String(sizeParam));
  navigate(`/manga?${params.toString()}`);
  };

  const handleBackClick = () => {
    const pathParts = (currentPath || '').split('/').filter(Boolean);
    pathParts.pop();
  const newPath = pathParts.join('/');
  const params = new URLSearchParams();
  if (newPath) params.set('path', newPath);
  params.set('page', '1');
  params.set('size', String(sizeParam));
  navigate(`/manga${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const handleGoBack = () => {
    if (!currentPath) {
      // If at root, navigate to home page
      navigate('/');
      return;
    }
    
    handleBackClick();
  };

  // Generate breadcrumb items
  const breadcrumbItems = () => {
    const items = [
      { label: '📖 Manga', path: '' }
    ];
    
    if (currentPath) {
      const pathParts = currentPath.split('/').filter(Boolean);
      let accumPath = '';
      
      pathParts.forEach((part, index) => {
        accumPath += (accumPath ? '/' : '') + part;
        items.push({
          label: part,
          path: accumPath,
          isLast: index === pathParts.length - 1
        });
      });
    }
    
    return items;
  };

  const handleToggleFavorite = async (item) => {
    try {
      console.log('❤️ MangaHome GridView toggleFavorite:', { path: item.path, currentFavorite: item.isFavorite });
      
      // Gọi toggleFavorite từ store (đã có updateFavoriteInAllCaches)
      await toggleFavorite(item);
      
      // Force refresh local component để hiển thị thay đổi ngay lập tức
      setLocalRefreshTrigger(prev => prev + 1);
      
      // Refresh favorites list to update UI
      fetchFavorites();
      
      console.log('✅ MangaHome GridView favorite toggle completed');
    } catch (error) {
      console.error('❌ Error toggling favorite in MangaHome GridView:', error);
    }
  };

  const filteredManga = React.useMemo(() => (
    mangaList?.filter(manga =>
      manga.name?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || []
  ), [mangaList, searchTerm]);

  const sortedManga = React.useMemo(() => {
    const list = [...filteredManga];
    switch (sortBy) {
      case 'name':
        // Natural sorting for grid view like Windows Explorer
        return list.sort((a, b) => {
          const nameA = a.name || '';
          const nameB = b.name || '';
          
          // Use localeCompare with numeric option for natural sorting
          return nameA.localeCompare(nameB, undefined, { 
            numeric: true, 
            sensitivity: 'base',
            caseFirst: 'upper'
          });
        });
      case 'date':
        return list.sort((a, b) => new Date(b.lastModified || 0) - new Date(a.lastModified || 0));
      case 'size':
        return list.sort((a, b) => (b.size || 0) - (a.size || 0));
      default:
        return list;
    }
  }, [filteredManga, sortBy]);

  // Pagination calculations
  const totalItems = sortedManga.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / sizeParam));
  const currentPage = Math.min(pageParam, totalPages);
  const startIndex = (currentPage - 1) * sizeParam;
  const endIndex = Math.min(startIndex + sizeParam, totalItems);
  const pageItems = sortedManga.slice(startIndex, endIndex);

  const goToPage = (page) => {
    const p = Math.max(1, Math.min(totalPages, page));
    updateParams({ page: String(p) });
    setJumpValue(String(p));
    // Smoothly scroll to the header title
    if (headerRef.current) {
      headerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const changePageSize = (size) => {
    const s = Math.max(1, parseInt(size, 10) || 30);
    // Persist selection
    try { localStorage.setItem('manga.perPage', String(s)); } catch (_) {}
    updateParams({ size: String(s), page: '1' });
    // Also scroll to the header to keep context
    if (headerRef.current) {
      headerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // If coming from reader with focus param, auto-jump to the page that contains the focused item
  const focusHandledRef = React.useRef('');
  useEffect(() => {
    if (!focusParam || !sortedManga?.length) return;
    const key = `${focusParam}|${sizeParam}`;
    if (focusHandledRef.current === key) return; // already handled
    const idx = sortedManga.findIndex(i => i.path === focusParam);
    if (idx >= 0) {
      const pageOfItem = Math.floor(idx / sizeParam) + 1;
      if (pageOfItem !== pageParam) {
        focusHandledRef.current = key;
        updateParams({ page: String(pageOfItem) });
        // no scroll change here; optional: scroll header
      } else {
        focusHandledRef.current = key;
      }
    } else {
      // If not found, still mark handled to avoid loops
      focusHandledRef.current = key;
    }
  }, [focusParam, sortedManga, sizeParam, pageParam]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Đang tải danh sách manga...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Lỗi: {error}</p>
          <Button onClick={() => fetchMangaFolders(currentPath)}>
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Random Sections - chỉ hiển thị ở root để giảm tải khi quay lại từ Reader */}
      {showRandomSection && (
        <div className="mb-1 p-1 sm:p-2">
          <MangaRandomSection />
        </div>
      )}

      <div className="p-1 sm:p-2">
        {/* Main Content Container */}
        <div className="manga-main-container bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2 sm:p-3">
          {/* Header */}
          <div className="mb-4 sm:mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-4 flex-1">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Back button - responsive text */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleGoBack}
                icon={currentPath ? FiArrowLeft : FiHome}
                className="flex-shrink-0"
              >
                <span className="hidden sm:inline">
                  {currentPath ? 'Back' : 'Home'}
                </span>
              </Button>

              {/* Breadcrumb */}
              <Breadcrumb
                items={breadcrumbItems()}
                onNavigate={(path) => {
                  // Navigate with proper params
                  const params = new URLSearchParams();
                  if (path) params.set('path', path);
                  params.set('page', '1');
                  params.set('size', String(sizeParam));
                  navigate(`/manga${params.toString() ? `?${params.toString()}` : ''}`);
                }}
              />
            </div>
          </div>
          
          {/* Controls - responsive layout */}
          <div className="flex items-center gap-2 sm:gap-3 lg:justify-end justify-start">
            {/* Per-page selector */}
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">Per page:</span>
              <select
                value={sizeParam}
                onChange={(e) => changePageSize(e.target.value)}
                className="px-1.5 py-1 sm:px-2 sm:py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-xs sm:text-sm text-gray-900 dark:text-white"
              >
                {[12, 24, 30, 48, 60, 96].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            
            {/* Filter button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              icon={Filter}
              className="flex-shrink-0"
            >
              <span className="hidden sm:inline ml-2">Filter</span>
            </Button>
            
            {/* View mode toggle */}
            <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-0.5 sm:p-1">
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                icon={FiGrid}
                className="rounded-md"
                title="Grid view"
              />
              <Button
                variant={viewMode === 'list' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                icon={FiList}
                className="rounded-md"
                title="List view"
              />
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
          <input
            type="text"
            placeholder="Tìm kiếm manga..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 sm:pl-10 pr-4 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-800 text-sm sm:text-base text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sort by:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="name">Name</option>
                  <option value="date">Last Updated</option>
                  <option value="views">Most Viewed</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-white dark:bg-gray-800 p-2 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <BookOpen className="w-5 h-5 sm:w-8 sm:h-8 text-blue-500 mr-2 sm:mr-3" />
            <div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{mangaList.length}</p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Items</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-2 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Heart className="w-5 h-5 sm:w-8 sm:h-8 text-red-500 mr-2 sm:mr-3" />
            <div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{favorites.length}</p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Favorites</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-2 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Search className="w-5 h-5 sm:w-8 sm:h-8 text-green-500 mr-2 sm:mr-3" />
            <div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{filteredManga.length}</p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Search Results</p>
            </div>
          </div>
        </div>
      </div>

  {/* Folder/File Grid */}
      {sortedManga.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No items found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search or check the folder path
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
            {pageItems.map((item, index) => (
              <MangaCard
                key={`${item.path || item.name || index}-${localRefreshTrigger}`}
                manga={item}
                isFavorite={Boolean(item.isFavorite) || favorites.some(f => f.path === item.path)}
                onToggleFavorite={() => 
                  handleToggleFavorite(item)
                }
                onClick={handleFolderClick}
                showViews={false}
                variant="grid"
                className="w-full"
              />
            ))}
          </div>
          {/* Pagination Controls */}
          <div className="mt-4 sm:mt-6 flex items-center justify-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="text-xs sm:text-sm px-2 sm:px-3"
            >
              ⬅ Prev
            </Button>
            <button
              onClick={() => setJumpOpen(true)}
              className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs sm:text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              title="Jump to page"
            >
              <span className="hidden sm:inline">Page </span>{currentPage} / {totalPages}
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="text-xs sm:text-sm px-2 sm:px-3"
            >
              Next ➡
            </Button>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:gap-4">
          {pageItems.map((item, index) => (
            <div
              key={`${item.path || item.name || index}`}
              onClick={() => handleFolderClick(item)}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg 
                        transition-all duration-200 cursor-pointer group flex items-center p-2 sm:p-4"
            >
              <div className="flex items-center gap-2 sm:gap-4 w-full">
                <div className="w-12 h-16 sm:w-16 sm:h-20 bg-gray-200 dark:bg-gray-700 rounded-md 
                              flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {item.isDirectory ? (
                    <div className="text-2xl sm:text-4xl">📁</div>
                  ) : (
                    <img
                      src={item.thumbnail || DEFAULT_IMAGES.cover}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('List thumbnail failed to load:', e.target.src);
                        // Đơn giản: chỉ fallback không thử decode nữa
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                  )}
                  <div className="text-2xl sm:text-4xl hidden">📖</div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-1 truncate" title={item.name || item.path || 'Unknown'}>
                    {item.name && item.name !== '()' ? item.name : (item.path || 'Unknown Item')}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1 sm:mb-2">
                    {item.isDirectory ? 'Folder' : 'File'}
                    {item.size && ` • ${(item.size / 1024 / 1024).toFixed(1)} MB`}
                  </p>
                  {item.lastModified && (
                    <p className="text-xs text-gray-500 hidden sm:block">
                      Modified: {new Date(item.lastModified).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

        </div> {/* End of manga-main-container */}

      {/* Jump to page Modal */}
      {jumpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm p-5">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Jump to page</h3>
            <div className="space-y-3">
              <input
                type="number"
                min={1}
                max={totalPages}
                value={jumpValue}
                onChange={(e) => setJumpValue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">Total pages: {totalPages}</p>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setJumpOpen(false)}>Cancel</Button>
                <Button
                  size="sm"
                  onClick={() => {
                    const num = parseInt(jumpValue, 10);
                    if (!isNaN(num)) {
                      goToPage(num);
                    }
                    setJumpOpen(false);
                  }}
                >
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default MangaHome;
