// 📁 src/pages/music/MusicHome.jsx
// 🎵 Trang chủ music với tích hợp API backend

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiMusic, 
  FiHeart, 
  FiClock, 
  FiSearch, 
  FiGrid, 
  FiList, 
  FiFilter,
  FiArrowLeft,
  FiHome,
  FiPlay,
  FiFolder
} from 'react-icons/fi';
import { useAuthStore, useUIStore, useMusicStore } from '@/store';
import { PAGINATION } from '@/constants';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import Button from '@/components/common/Button';
import MusicCard from '@/components/music/MusicCard';
import Breadcrumb from '@/components/common/Breadcrumb';
import Pagination from '@/components/common/Pagination';
import MusicRandomSection from '@/components/music/MusicRandomSection';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';

const MusicHome = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { sourceKey } = useAuthStore();
  const { loading: globalLoading } = useUIStore();
  
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
  
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('name');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [musicPerPage, setMusicPerPage] = useState(() => {
    const urlVal = parseInt(searchParams.get('size') || '', 10);
    if (!Number.isNaN(urlVal) && urlVal > 0) return urlVal;
    try {
      const stored = parseInt(localStorage.getItem('music.perPage') || '', 10);
      if (!Number.isNaN(stored) && stored > 0) return stored;
    } catch (_) {}
    return PAGINATION.MUSIC_PER_PAGE;
  });

  // Ensure selector options always include the configured default (MUSIC_PER_PAGE)
  const musicPerPageOptions = React.useMemo(() => {
    const base = [1, 12, 24, 30, 48, 60, 96];
    const withDefault = [PAGINATION.MUSIC_PER_PAGE, ...base];
    // Unique & sorted ascending
    return Array.from(new Set(withDefault)).sort((a, b) => a - b);
  }, []);

  // Track last fetch to avoid duplicate calls (StrictMode/multiple effects)
  const lastFetchRef = useRef('');

  // Redirect to home only when there's no sourceKey; don't bounce when switching sections
  useEffect(() => {
    if (!sourceKey) {
      navigate('/');
      return;
    }
  }, [sourceKey, navigate]);

  // Clear cache when sourceKey changes (do not fetch here to avoid duplicate with URL effect)
  useEffect(() => {
    if (sourceKey) {
      console.log('🎵 SourceKey changed, clearing cache:', sourceKey);
      clearMusicCache();
      // Reset last fetch guard so URL effect can fetch once
      lastFetchRef.current = '';
    }
  }, [sourceKey, clearMusicCache]);

  // Persist per-page whenever it changes (including via URL)
  useEffect(() => {
    try { localStorage.setItem('music.perPage', String(musicPerPage)); } catch (_) {}
  }, [musicPerPage]);

  // NOTE: We'll paginate AFTER filtering & sorting for correct search results
  let totalPages = 0;
  let currentMusic = [];

  // Load path from URL and fetch (single place to fetch)
  useEffect(() => {
    const urlPath = searchParams.get('path') || '';
    const fetchKey = `${sourceKey || ''}|${urlPath}`;

    // If already fetched this combination, skip
    if (lastFetchRef.current === fetchKey) return;

    // If path differs from current or it's first load, fetch once
    if (sourceKey) {
      console.log('🎵 Loading music for path:', urlPath);
      lastFetchRef.current = fetchKey;
      fetchMusicFolders(urlPath);
    }
  }, [searchParams, fetchMusicFolders, sourceKey]);

  // Reset page when path changes
  useEffect(() => {
    setCurrentPage(0);
  }, [currentPath, musicList]);

  // Handle back navigation
  const handleBackClick = () => {
    const pathParts = currentPath.split('/').filter(Boolean);
    pathParts.pop(); // Remove last part
    const parentPath = pathParts.join('/');
    
    // Update URL without triggering re-fetch since we're using fetchMusicFolders
    setSearchParams(parentPath ? { path: parentPath } : {});
    fetchMusicFolders(parentPath);
  };

  // Generate breadcrumb items
  const breadcrumbItems = () => {
    const items = [
      { label: '🎵 Music', path: '' }
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

  // Normalize helper to make search accent-insensitive
  const normalize = (str = '') => str
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
  const needle = normalize(searchTerm);

  // Filter (apply normalized search across relevant fields)
  const filteredMusic = musicList.filter(music => {
    if (!needle) return true;
    return [music.name, music.artist, music.album, music.title, music.path]
      .some(val => normalize(val || '').includes(needle));
  });

  const sortedMusic = [...filteredMusic].sort((a, b) => {
    // ALWAYS put folders first, then files (regardless of sortBy option)
    if (a.type === 'folder' && b.type !== 'folder') return -1;
    if (a.type !== 'folder' && b.type === 'folder') return 1;
    
    // Within same type group, apply the selected sort
    switch (sortBy) {
      case 'name':
        return (a.name || '').localeCompare(b.name || '');
      case 'artist':
        return (a.artist || '').localeCompare(b.artist || '');
      case 'album':
        return (a.album || '').localeCompare(b.album || '');
      case 'type':
        // Already sorted by type above, now sort by name within type
        return (a.name || '').localeCompare(b.name || '');
      case 'views':
        return (b.viewCount || 0) - (a.viewCount || 0);
      default:
        return 0;
    }
  });

  // Pagination after sorting
  totalPages = Math.ceil(sortedMusic.length / musicPerPage) || 1;
  currentMusic = sortedMusic.slice(
    currentPage * musicPerPage,
    (currentPage + 1) * musicPerPage
  );

  // Reset page on search or sort changes
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, sortBy]);
  useEffect(() => {
    if (currentPage >= totalPages) setCurrentPage(0);
  }, [totalPages]);

  // Handle navigation
  const handleGoBack = () => {
    if (currentPath) {
      handleBackClick();
    } else {
      navigate('/');
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePerPageChange = (val) => {
    const n = Math.max(1, parseInt(val, 10) || PAGINATION.MUSIC_PER_PAGE);
    setMusicPerPage(n);
    setCurrentPage(0);
  };

  if (loading || globalLoading) {
    return <LoadingOverlay message="Loading music library..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Random slider: luôn hiển thị và căng ngang bằng header */}
      <div className="p-3 sm:p-6 pb-0">{/* Thêm padding ngang để khớp với header */}
        <MusicRandomSection />{/* Section random cho music */}
      </div>

      <div className="p-3 sm:p-6">
        {/* Main Content Container */}
        <div className="music-main-container bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-6">
          {/* Header with breadcrumb and controls */}
          <div className="mb-6">
          {/* First row: Navigation and breadcrumb */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="flex items-center gap-3">
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
                <div className="min-w-0 flex-1">
                  <Breadcrumb
                    items={breadcrumbItems()}
                    onNavigate={(path) => {
                      // Only update URL; fetching is handled by URL effect to avoid duplicate API calls
                      setSearchParams(path ? { path } : {});
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Controls - responsive layout */}
            <div className="flex items-center gap-2 sm:gap-3 lg:justify-end justify-start">
              {/* Per-page selector */}
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">Per page:</span>
                <select
                  value={musicPerPage}
                  onChange={(e) => handlePerPageChange(e.target.value)}
                  className="px-1.5 py-1 sm:px-2 sm:py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-xs sm:text-sm text-gray-900 dark:text-white"
                >
                  {musicPerPageOptions.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              
              {/* Filters toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                icon={FiFilter}
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
          <div className="relative max-w-md mb-3 sm:mb-4">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Search music, artists, albums..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 sm:pl-10 pr-4 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-800 text-sm sm:text-base text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
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
                    <option value="artist">Artist</option>
                    <option value="album">Album</option>
                    <option value="type">Type</option>
                    <option value="views">Most Played</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Statistics cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
          <div className="bg-white dark:bg-gray-800 p-2 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <FiMusic className="w-5 h-5 sm:w-8 sm:h-8 text-blue-500 mr-2 sm:mr-3" />
              <div>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{musicList.length}</p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Items</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-2 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <FiFolder className="w-5 h-5 sm:w-8 sm:h-8 text-green-500 mr-2 sm:mr-3" />
              <div>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {musicList.filter(item => item.type === 'folder').length}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Folders</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-2 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <FiPlay className="w-5 h-5 sm:w-8 sm:h-8 text-purple-500 mr-2 sm:mr-3" />
              <div>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {musicList.filter(item => item.type === 'audio' || item.type === 'file').length}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Audio Files</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-2 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <FiSearch className="w-5 h-5 sm:w-8 sm:h-8 text-orange-500 mr-2 sm:mr-3" />
              <div>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{filteredMusic.length}</p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Search Results</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-600 dark:text-red-400">
                <strong>Error:</strong> {error}
              </div>
            </div>
          </div>
        )}

        {/* Music list */}
        {sortedMusic.length === 0 ? (
          <div className="text-center py-12">
            <FiMusic className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'No music found' : 'No music in this folder'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'This folder appears to be empty or not yet scanned'
              }
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 sm:gap-3">
              {currentMusic.map((music, index) => (
                <MusicCard
                  key={music.path || index}
                  item={music}
                  showViews={true}
                  variant="grid"
                  onDeleteClick={(item) => setItemToDelete(item)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex flex-col items-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalItems={filteredMusic.length}
                  itemsPerPage={musicPerPage}
                  enableJump={true}
                  center
                />
                <div className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage + 1} of {totalPages} • {filteredMusic.length} result{filteredMusic.length === 1 ? '' : 's'}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-2 sm:gap-4">
              {currentMusic.map((music, index) => (
                <MusicCard
                  key={music.path || index}
                  item={music}
                  showViews={true}
                  variant="list"
                  onDeleteClick={(item) => setItemToDelete(item)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex flex-col items-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalItems={filteredMusic.length}
                  itemsPerPage={musicPerPage}
                  enableJump={true}
                  center
                />
                <div className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage + 1} of {totalPages} • {filteredMusic.length} result{filteredMusic.length === 1 ? '' : 's'}
                </div>
              </div>
            )}
          </>
        )}
        </div> {/* End of music-main-container */}
      </div>

      {/* Delete Confirmation Modal - Single instance */}
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
    </div>
  );
};

export default MusicHome;
