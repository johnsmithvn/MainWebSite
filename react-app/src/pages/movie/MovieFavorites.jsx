// 📁 src/pages/movie/MovieFavorites.jsx
// ❤️ Trang movie yêu thích với tích hợp API backend

import React, { useState, useEffect } from 'react';
import { Heart, Play, Grid, List, Search, ArrowLeft, Loader, Folder } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMovieStore, useUIStore } from '@/store';
import Button from '@/components/common/Button';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import MovieCard from '@/components/movie/MovieCard';
import { PAGINATION } from '@/constants';

const MovieFavorites = () => {
  const navigate = useNavigate();
  const { loading: globalLoading } = useUIStore();
  const { 
    favorites, 
    removeFavorite, 
    fetchFavorites, 
    toggleFavorite,
    loading: movieLoading 
  } = useMovieStore();
  
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('dateAdded');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [folderPage, setFolderPage] = useState(0);
  const [videoPage, setVideoPage] = useState(0);
  const [folderOpen, setFolderOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(true);

  const perPageFolder = PAGINATION.MOVIE_FAVORITES_FOLDER_PER_PAGE;
  const perPageVideo = PAGINATION.MOVIE_FAVORITES_VIDEO_PER_PAGE;

  // Load favorites when component mounts
  useEffect(() => {
    const loadFavorites = async () => {
      setLoading(true);
      try {
        await fetchFavorites();
      } catch (err) {
        setError('Failed to load favorites');
        console.error('Load favorites error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, [fetchFavorites]);

  // Filter and sort favorites
  const filteredFavorites = favorites.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.path?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const sortedFavorites = [...filteredFavorites].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.name || '').localeCompare(b.name || '');
      case 'type':
        return (a.type || '').localeCompare(b.type || '');
      case 'dateAdded':
      default:
        return (b.favoriteDate || 0) - (a.favoriteDate || 0);
    }
  });

  // Separate folders and videos
  const allFolders = sortedFavorites.filter(item => item.type === 'folder');
  const allVideos = sortedFavorites.filter(item => item.type === 'video' || item.type === 'file');

  // Pagination
  const folderTotalPages = Math.ceil(allFolders.length / perPageFolder);
  const videoTotalPages = Math.ceil(allVideos.length / perPageVideo);
  
  const currentFolders = allFolders.slice(
    folderPage * perPageFolder,
    (folderPage + 1) * perPageFolder
  );
  
  const currentVideos = allVideos.slice(
    videoPage * perPageVideo,
    (videoPage + 1) * perPageVideo
  );

  const handleFavoriteChange = async (item, newFavoriteState) => {
    // The item was already toggled in the store, so we just need to handle UI updates
    if (!newFavoriteState) {
      // Item was unfavorited, so we could refresh favorites or just let the store handle it
      await fetchFavorites();
    }
  };

  const handlePageChange = (type, page) => {
    if (type === 'folder') {
      setFolderPage(page);
    } else {
      setVideoPage(page);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPagination = (currentPage, totalPages, onPageChange) => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-center gap-4 mt-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
        >
          ⬅ Previous
        </Button>

        <div className="flex items-center gap-2">
          {[...Array(Math.min(5, totalPages))].map((_, i) => {
            const pageNum = Math.max(0, Math.min(currentPage - 2, totalPages - 5)) + i;
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`px-3 py-1 rounded ${
                  pageNum === currentPage
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {pageNum + 1}
              </button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
        >
          Next ➡
        </Button>
      </div>
    );
  };

  const renderSection = (title, items, currentPage, totalPages, onPageChange, isOpen, setOpen, icon) => {
    if (items.length === 0) return null;

    return (
      <details 
        className="mb-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
        open={isOpen}
        onToggle={(e) => setOpen(e.target.open)}
      >
        <summary className="px-6 py-4 bg-gray-50 dark:bg-gray-700 cursor-pointer font-medium text-gray-900 dark:text-white flex items-center gap-2">
          {icon}
          {title} ({items.length})
        </summary>
        
        <div className="p-6">
          <div className={`grid ${
            viewMode === 'grid' 
              ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' 
              : 'grid-cols-1'
          } gap-6`}>
            {items.map((item) => (
              <div key={item.path} className="relative">
                <MovieCard
                  item={item}
                  showViews={false}
                  onFavoriteChange={handleFavoriteChange}
                />
                <div className="absolute top-2 left-2 bg-black/60 text-[10px] text-white px-2 py-0.5 rounded">
                  {item.favoriteDate ? new Date(item.favoriteDate).toLocaleDateString() : ''}
                </div>
              </div>
            ))}
          </div>

          {renderPagination(currentPage, totalPages, onPageChange)}
          
          {totalPages > 1 && (
            <div className="text-center mt-2 text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage + 1} of {totalPages}
            </div>
          )}
        </div>
      </details>
    );
  };

  if (loading || movieLoading || globalLoading) {
    return <LoadingOverlay message="Loading favorites..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/movie')}
              icon={ArrowLeft}
            >
              Back to Movies
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                ❤️ Movie Favorites
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {filteredFavorites.length} favorite items
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
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

        {/* Search and Sort */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
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
          
          <div className="flex items-center gap-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
              <option value="type">Type</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">Error: {error}</p>
        </div>
      )}

      {/* Empty state */}
      {filteredFavorites.length === 0 && !loading && (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {searchTerm ? 'No matching favorites' : 'No favorites yet'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm ? 'Try adjusting your search' : 'Start adding movies to your favorites'}
          </p>
        </div>
      )}

      {/* Favorites sections */}
      {filteredFavorites.length > 0 && (
        <>
          {renderSection(
            '📁 Favorite Folders',
            currentFolders,
            folderPage,
            folderTotalPages,
            (page) => handlePageChange('folder', page),
            folderOpen,
            setFolderOpen,
            <Folder className="w-5 h-5" />
          )}

          {renderSection(
            '🎬 Favorite Videos',
            currentVideos,
            videoPage,
            videoTotalPages,
            (page) => handlePageChange('video', page),
            videoOpen,
            setVideoOpen,
            <Play className="w-5 h-5" />
          )}
        </>
      )}
    </div>
  );
};

export default MovieFavorites;