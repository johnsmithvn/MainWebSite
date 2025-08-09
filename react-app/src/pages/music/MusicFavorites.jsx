// 📁 src/pages/music/MusicFavorites.jsx
// ❤️ Trang music yêu thích với tích hợp API backend

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiHeart, 
  FiMusic, 
  FiFolder, 
  FiSearch, 
  FiGrid, 
  FiList,
  FiChevronDown,
  FiChevronUp,
  FiRefreshCw,
  FiTrash2
} from 'react-icons/fi';
import { useUIStore, useMusicStore } from '@/store';
import { PAGINATION } from '@/constants';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import Button from '@/components/common/Button';
import MusicCard from '@/components/music/MusicCard';
import Pagination from '@/components/common/Pagination';

const MusicFavorites = () => {
  const navigate = useNavigate();
  const { loading: globalLoading } = useUIStore();
  const { 
    favorites, 
    removeFavorite, 
    fetchFavorites, 
    toggleFavorite,
    loading: musicLoading 
  } = useMusicStore();
  
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('dateAdded');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [folderPage, setFolderPage] = useState(0);
  const [audioPage, setAudioPage] = useState(0);
  const [folderOpen, setFolderOpen] = useState(false);
  const [audioOpen, setAudioOpen] = useState(true);

  const perPageFolder = PAGINATION.MUSIC_FAVORITES_FOLDER_PER_PAGE || 12;
  const perPageAudio = PAGINATION.MUSIC_FAVORITES_AUDIO_PER_PAGE || 20;

  // Load favorites when component mounts
  useEffect(() => {
    const loadFavorites = async () => {
      setLoading(true);
      try {
        await fetchFavorites();
      } catch (err) {
        setError('Failed to load favorites');
        console.error('Failed to load music favorites:', err);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, [fetchFavorites]);

  // Filter and sort favorites
  const filteredFavorites = favorites.filter(item => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      item.name?.toLowerCase().includes(searchLower) ||
      item.artist?.toLowerCase().includes(searchLower) ||
      item.album?.toLowerCase().includes(searchLower) ||
      item.path?.toLowerCase().includes(searchLower)
    );
  });

  const sortedFavorites = [...filteredFavorites].sort((a, b) => {
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
      case 'dateAdded':
      default:
        // Newest first (assuming newer items are at the end of favorites array)
        return favorites.indexOf(b) - favorites.indexOf(a);
    }
  });

  // Separate folders and audio files
  const allFolders = sortedFavorites.filter(item => item.type === 'folder');
  const allAudio = sortedFavorites.filter(item => item.type === 'audio' || item.type === 'file');

  // Pagination
  const folderTotalPages = Math.ceil(allFolders.length / perPageFolder);
  const audioTotalPages = Math.ceil(allAudio.length / perPageAudio);
  
  const currentFolders = allFolders.slice(
    folderPage * perPageFolder,
    (folderPage + 1) * perPageFolder
  );
  
  const currentAudio = allAudio.slice(
    audioPage * perPageAudio,
    (audioPage + 1) * perPageAudio
  );

  const handleFavoriteChange = async (item, newFavoriteState) => {
    try {
      if (newFavoriteState) {
        await toggleFavorite(item);
      } else {
        await removeFavorite(item);
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      setError('Failed to update favorite');
    }
  };

  const handlePageChange = (type, page) => {
    if (type === 'folder') {
      setFolderPage(page);
    } else {
      setAudioPage(page);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPagination = (currentPage, totalPages, onPageChange) => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="mt-6">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          showInfo={false}
        />
      </div>
    );
  };

  const renderSection = (title, items, currentPage, totalPages, onPageChange, isOpen, setOpen, icon) => {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setOpen(!isOpen)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center space-x-3">
            {icon}
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title} ({items.length})
            </h2>
          </div>
          {isOpen ? 
            <FiChevronUp className="w-5 h-5 text-gray-500" /> : 
            <FiChevronDown className="w-5 h-5 text-gray-500" />
          }
        </button>
        
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-200 dark:border-gray-700"
          >
            <div className="p-4">
              {items.length === 0 ? (
                <div className="text-center py-8">
                  <FiMusic className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No favorites in this category
                  </p>
                </div>
              ) : (
                <>
                  <div className={`grid gap-4 ${
                    viewMode === 'grid' 
                      ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6' 
                      : 'grid-cols-1'
                  }`}>
                    {items.map((item, index) => (
                      <MusicCard
                        key={item.path || index}
                        item={{ ...item, isFavorite: true }}
                        showViews={true}
                        onFavoriteChange={() => handleFavoriteChange(item, false)}
                        variant={viewMode === 'list' ? 'compact' : 'default'}
                      />
                    ))}
                  </div>
                  {renderPagination(currentPage, totalPages, onPageChange)}
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  if (loading || musicLoading || globalLoading) {
    return <LoadingOverlay message="Loading music favorites..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <FiHeart className="w-8 h-8 text-red-500 mr-3" />
              Music Favorites
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Your favorite music collection ({favorites.length} items)
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
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
            
            {/* Refresh button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchFavorites()}
              icon={FiRefreshCw}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Search and sort */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search favorites..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Sort by:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="dateAdded">Date Added</option>
              <option value="name">Name</option>
              <option value="artist">Artist</option>
              <option value="album">Album</option>
              <option value="type">Type</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-red-600 dark:text-red-400">{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError('')}
              className="text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30"
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Favorites content */}
      {favorites.length === 0 ? (
        <div className="text-center py-12">
          <FiHeart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No favorites yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start adding music to your favorites to see them here
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/music')}
            icon={FiMusic}
          >
            Browse Music
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Audio Files Section */}
          {renderSection(
            '🎵 Audio Files',
            currentAudio,
            audioPage,
            audioTotalPages,
            (page) => handlePageChange('audio', page),
            audioOpen,
            setAudioOpen,
            <FiMusic className="w-5 h-5 text-blue-500" />
          )}

          {/* Folders Section */}
          {renderSection(
            '📁 Folders',
            currentFolders,
            folderPage,
            folderTotalPages,
            (page) => handlePageChange('folder', page),
            folderOpen,
            setFolderOpen,
            <FiFolder className="w-5 h-5 text-green-500" />
          )}
        </div>
      )}
    </div>
  );
};

export default MusicFavorites;
