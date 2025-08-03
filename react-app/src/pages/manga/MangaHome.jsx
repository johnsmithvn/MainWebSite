// 📁 src/pages/manga/MangaHome.jsx
// 🏠 Trang chủ manga - hiển thị danh sách manga

import React, { useState, useEffect } from 'react';
import { Search, Heart, BookOpen, Grid, List, Filter, Loader, ArrowLeft, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMangaStore, useUIStore, useAuthStore } from '../../store';
import Button from '../../components/common/Button';
import MangaRandomSection from '../../components/manga/MangaRandomSection';

const MangaHome = () => {
  const navigate = useNavigate();
  const { 
    mangaList, 
    currentPath, 
    loading, 
    error,
    favorites,
    searchTerm, 
    shouldNavigateToReader,
    setSearchTerm,
    fetchMangaFolders,
    fetchFavorites,
    clearNavigationFlag
  } = useMangaStore();
  
  const { sourceKey, rootFolder } = useAuthStore();
  
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('name');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Fetch manga folders và favorites khi component mount
    fetchMangaFolders();
    fetchFavorites();
  }, [fetchMangaFolders, fetchFavorites]);

  useEffect(() => {
    // Debug: Log manga list when it changes
    console.log('Manga list updated:', mangaList);
  }, [mangaList]);

  // Effect để handle navigation to reader khi API trả về type: 'reader'
  useEffect(() => {
    if (shouldNavigateToReader) {
      console.log('🚀 Navigating to reader for path:', shouldNavigateToReader);
      navigate(`/manga/reader?path=${encodeURIComponent(shouldNavigateToReader)}`);
      clearNavigationFlag(); // Clear flag sau khi navigate
    }
  }, [shouldNavigateToReader, navigate, clearNavigationFlag]);

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
    
    // Ngược lại -> navigate đến subfolder (loadFolder equivalent)
    console.log('📁 Loading subfolder:', folder.path);
    fetchMangaFolders(folder.path);
  };

  const handleBackClick = () => {
    const pathParts = currentPath.split('/');
    pathParts.pop();
    const newPath = pathParts.join('/');
    fetchMangaFolders(newPath);
  };

  const filteredManga = mangaList?.filter(manga =>
    manga.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const sortedManga = [...filteredManga].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name?.localeCompare(b.name) || 0;
      case 'date':
        return new Date(b.lastModified || 0) - new Date(a.lastModified || 0);
      case 'size':
        return (b.size || 0) - (a.size || 0);
      default:
        return 0;
    }
  });

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
      {/* Random Sections - Chỉ hiển thị khi ở root path */}
      {!currentPath && <MangaRandomSection />}
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              📚 Manga Library
            </h1>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mt-2">
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
              <p className="text-gray-600 dark:text-gray-400">
                Path: /{currentPath || 'Root'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
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
      ) : (
        <div className={`grid ${
          viewMode === 'grid' 
            ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6' 
            : 'grid-cols-1'
        } gap-4`}>
          {sortedManga.map((item, index) => (
            <div
              key={`${item.path || item.name || index}`}
              onClick={() => handleFolderClick(item)}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg 
                        transition-all duration-200 cursor-pointer group
                        ${viewMode === 'list' ? 'flex items-center p-4' : 'p-3'}`}
            >
              {viewMode === 'grid' ? (
                <>
                  <div className="aspect-[3/4] bg-gray-200 dark:bg-gray-700 rounded-md mb-3 
                                overflow-hidden flex items-center justify-center">
                    {item.isDirectory ? (
                      <div className="text-6xl">📁</div>
                    ) : (
                      <img
                        src={item.thumbnail || '/default/default-cover.jpg'}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          console.error('Thumbnail failed to load:', e.target.src);
                          // Đơn giản: chỉ fallback không thử decode nữa
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                    )}
                    <div className="text-6xl hidden">📖</div>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 
                               line-clamp-2" title={item.name || item.path || 'Unknown'}>
                    {item.name && item.name !== '()' ? item.name : (item.path || 'Unknown Item')}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {item.isDirectory ? 'Folder' : 'File'}
                  </p>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MangaHome;
