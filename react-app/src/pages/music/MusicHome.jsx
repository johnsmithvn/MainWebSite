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
  FiRefreshCw,
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
    clearMusicCache 
  } = useMusicStore();
  
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('name');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [musicPerPage, setMusicPerPage] = useState(() => {
    const urlVal = parseInt(searchParams.get('size') || '', 10);
    if (!Number.isNaN(urlVal) && urlVal > 0) return urlVal;
    try {
      const stored = parseInt(localStorage.getItem('music.perPage') || '', 10);
      if (!Number.isNaN(stored) && stored > 0) return stored;
    } catch (_) {}
    return PAGINATION.MUSIC_PER_PAGE;
  });

  // Track last fetch to avoid duplicate calls (StrictMode/multiple effects)
  const lastFetchRef = useRef('');

  // Redirect to home if no sourceKey selected
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

  // Pagination (per-page selectable)
  const totalPages = Math.ceil(musicList.length / musicPerPage);
  const currentMusic = musicList.slice(
    currentPage * musicPerPage,
    (currentPage + 1) * musicPerPage
  );

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

  // Handle refresh
  const handleRefresh = () => {
    console.log('🔄 Refreshing music folder:', currentPath);
    fetchMusicFolders(currentPath);
  };

  // Filter and sort music
  const filteredMusic = musicList.filter(music => 
    !searchTerm || 
    music.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    music.artist?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    music.album?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedMusic = [...filteredMusic].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.name || '').localeCompare(b.name || '');
      case 'artist':
        return (a.artist || '').localeCompare(b.artist || '');
      case 'album':
        return (a.album || '').localeCompare(b.album || '');
      case 'type':
        // Folders first, then audio files
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;
        return (a.name || '').localeCompare(b.name || '');
      case 'views':
        return (b.viewCount || 0) - (a.viewCount || 0);
      default:
        return 0;
    }
  });

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
      {/* Random slider: always show (kept when navigating folders) */}
      <div className="mb-8">
        <MusicRandomSection />
      </div>

      <div className="p-6">
        {/* Header with breadcrumb and controls */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              {/* Back button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleGoBack}
                icon={currentPath ? FiArrowLeft : FiHome}
                className="flex-shrink-0"
              >
                {currentPath ? 'Back' : 'Home'}
              </Button>

              {/* Breadcrumb */}
              <Breadcrumb
                items={breadcrumbItems()}
                onNavigate={(path) => {
                  // Only update URL; fetching is handled by URL effect to avoid duplicate API calls
                  setSearchParams(path ? { path } : {});
                }}
              />
            </div>

            <div className="flex items-center space-x-3">
              {/* Per-page selector */}
              <div className="flex items-center gap-2 mr-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">Per page</span>
                <select
                  value={musicPerPage}
                  onChange={(e) => handlePerPageChange(e.target.value)}
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                >
                  {[12, 24, 30, 48, 60, 96].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              {/* View mode toggle */}
              <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  icon={FiGrid}
                  className="rounded-md"
                />
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  icon={FiList}
                  className="rounded-md"
                />
              </div>

              {/* Filters toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                icon={FiFilter}
              >
                Filters
              </Button>

              {/* Refresh */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                icon={FiRefreshCw}
                disabled={loading}
              >
                Refresh
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search music, artists, albums..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <FiMusic className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{musicList.length}</p>
                <p className="text-gray-600 dark:text-gray-400">Total Items</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <FiFolder className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {musicList.filter(item => item.type === 'folder').length}
                </p>
                <p className="text-gray-600 dark:text-gray-400">Folders</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <FiPlay className="w-8 h-8 text-purple-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {musicList.filter(item => item.type === 'audio' || item.type === 'file').length}
                </p>
                <p className="text-gray-600 dark:text-gray-400">Audio Files</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <FiSearch className="w-8 h-8 text-orange-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredMusic.length}</p>
                <p className="text-gray-600 dark:text-gray-400">Search Results</p>
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
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="ml-auto text-red-600 border-red-300 hover:bg-red-50"
              >
                Retry
              </Button>
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
            {!searchTerm && (
              <Button
                variant="primary"
                onClick={handleRefresh}
                className="mt-4"
                icon={FiRefreshCw}
              >
                Refresh Folder
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className={`grid gap-4 ${
              viewMode === 'grid' 
                ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6' 
                : 'grid-cols-1'
            }`}>
              {currentMusic.map((music, index) => (
                <MusicCard
                  key={music.path || index}
                  item={music}
                  showViews={true}
                  variant={viewMode === 'list' ? 'compact' : 'default'}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  showInfo={true}
                  totalItems={filteredMusic.length}
                  itemsPerPage={musicPerPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MusicHome;
