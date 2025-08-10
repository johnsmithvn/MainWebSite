// 📁 src/pages/manga/MangaHome.jsx
// 🏠 Trang chủ manga - hiển thị danh sách manga

import React, { useState, useEffect } from 'react';
import { Search, Heart, BookOpen, Grid, List, Filter, Loader, ArrowLeft, RefreshCw } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMangaStore, useUIStore, useAuthStore } from '../../store';
import Button from '../../components/common/Button';
import MangaCard from '../../components/manga/MangaCard';
import MangaRandomSection from '../../components/manga/MangaRandomSection';

const MangaHome = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
  
  const { sourceKey, rootFolder } = useAuthStore();
  
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('name');
  const [showFilters, setShowFilters] = useState(false);
  const [localRefreshTrigger, setLocalRefreshTrigger] = useState(0); // For forcing re-renders
  const viewParam = searchParams.get('view');
  const showRandomSection = !searchParams.get('path') && viewParam !== 'folder';

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
    console.log('� MangaHome: URL path changed to:', urlPath);

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

  useEffect(() => {
    // Debug: Log manga list when it changes
    console.log('Manga list updated:', mangaList);
  }, [mangaList]);

  // Effect để handle navigation to reader khi API trả về type: 'reader'
  // Respect view=folder flag to force list view when coming from reader
  useEffect(() => {
    if (shouldNavigateToReader) {
      if (viewParam === 'folder') {
        // Skip redirect to reader when explicitly forcing folder view
        clearNavigationFlag();
      } else {
        navigate(`/manga/reader?path=${encodeURIComponent(shouldNavigateToReader)}`, { replace: true });
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
      navigate(`/manga/reader?path=${encodeURIComponent(folder.path)}`);
      return;
    }
    
    // Ngược lại -> navigate đến subfolder bằng URL giống Movie
    console.log('📁 Navigating to subfolder via URL:', folder.path);
    navigate(`/manga${folder.path ? `?path=${encodeURIComponent(folder.path)}` : ''}`);
  };

  const handleBackClick = () => {
    const pathParts = (currentPath || '').split('/').filter(Boolean);
    pathParts.pop();
    const newPath = pathParts.join('/');
    navigate(`/manga${newPath ? `?path=${encodeURIComponent(newPath)}` : ''}`);
  };

  // Generate breadcrumb items (same logic as Movie)
  const breadcrumbItems = () => {
    if (!currentPath) return [{ name: 'Manga', path: '' }];
    const pathParts = currentPath.split('/').filter(Boolean);
    const items = [{ name: 'Manga', path: '' }];
    let currentBreadcrumbPath = '';
    pathParts.forEach((part) => {
      currentBreadcrumbPath += (currentBreadcrumbPath ? '/' : '') + part;
      items.push({ name: part, path: currentBreadcrumbPath });
    });
    return items;
  };

  // Handle refresh like Movie
  const handleRefresh = () => {
    fetchMangaFolders(currentPath || '');
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
        return list.sort((a, b) => a.name?.localeCompare(b.name) || 0);
      case 'date':
        return list.sort((a, b) => new Date(b.lastModified || 0) - new Date(a.lastModified || 0));
      case 'size':
        return list.sort((a, b) => (b.size || 0) - (a.size || 0));
      default:
        return list;
    }
  }, [filteredManga, sortBy]);

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
  {/* Random Sections - chỉ hiển thị ở root để giảm tải khi quay lại từ Reader */}
  {showRandomSection && <MangaRandomSection />}
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {currentPath && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackClick}
                icon={ArrowLeft}
              >
                Back
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                📚 Manga Library
              </h1>
              {/* Breadcrumb UI like Movie */}
              <nav className="flex mt-2" aria-label="Breadcrumb">
                <ol className="inline-flex items-center space-x-1 md:space-x-3">
                  {breadcrumbItems().map((item, index) => (
                    <li key={index} className="inline-flex items-center">
                      {index > 0 && (
                        <svg className="w-6 h-6 text-gray-400 mx-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {index === breadcrumbItems().length - 1 ? (
                        <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                          {item.name}
                        </span>
                      ) : (
                        <button
                          onClick={() => navigate(`/manga${item.path ? `?path=${encodeURIComponent(item.path)}` : ''}`)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
                        >
                          {item.name}
                        </button>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              icon={RefreshCw}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              icon={Filter}
            >
              Filters
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              icon={Grid}
            />
            <Button
              variant={viewMode === 'list' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              icon={List}
            />
          </div>
        </div>

        {/* Search bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm kiếm manga..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <BookOpen className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{mangaList.length}</p>
              <p className="text-gray-600 dark:text-gray-400">Total Items</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Heart className="w-8 h-8 text-red-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{favorites.length}</p>
              <p className="text-gray-600 dark:text-gray-400">Favorites</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Search className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredManga.length}</p>
              <p className="text-gray-600 dark:text-gray-400">Search Results</p>
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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {sortedManga.map((item, index) => (
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
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {sortedManga.map((item, index) => (
            <div
              key={`${item.path || item.name || index}`}
              onClick={() => handleFolderClick(item)}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg 
                        transition-all duration-200 cursor-pointer group flex items-center p-4"
            >
              <div className="flex items-center gap-4 w-full">
                <div className="w-16 h-20 bg-gray-200 dark:bg-gray-700 rounded-md 
                              flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {item.isDirectory ? (
                    <div className="text-4xl">📁</div>
                  ) : (
                    <img
                      src={item.thumbnail || '/default/default-cover.jpg'}
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
                  <div className="text-4xl hidden">📖</div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1" title={item.name || item.path || 'Unknown'}>
                    {item.name && item.name !== '()' ? item.name : (item.path || 'Unknown Item')}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {item.isDirectory ? 'Folder' : 'File'}
                    {item.size && ` • ${(item.size / 1024 / 1024).toFixed(1)} MB`}
                  </p>
                  {item.lastModified && (
                    <p className="text-xs text-gray-500">
                      Modified: {new Date(item.lastModified).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MangaHome;
