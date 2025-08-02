// 📁 src/pages/movie/MovieFavorites.jsx
// ❤️ Trang movie yêu thích với tích hợp API backend

import React, { useState, useEffect } from 'react';
import { Heart, Search, Grid, List, Trash2, Play, Download, Star, RefreshCw, Clock } from 'lucide-react';
import { useMovieStore, useUIStore } from '@/store';
import Button from '@/components/common/Button';

const MovieFavorites = () => {
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

  // Load favorites when component mounts
  useEffect(() => {
    const loadFavorites = async () => {
      setLoading(true);
      setError('');
      try {
        await fetchFavorites();
      } catch (err) {
        setError('Failed to load favorite movies. Please try again.');
        console.error('Error loading movie favorites:', err);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, [fetchFavorites]);

  // Filter and sort favorites
  const filteredFavorites = favorites.filter(movie =>
    movie.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    movie.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedFavorites = [...filteredFavorites].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.title || a.name || '').localeCompare(b.title || b.name || '');
      case 'dateAdded':
        return new Date(b.favoriteDate || b.lastUpdated || 0) - new Date(a.favoriteDate || a.lastUpdated || 0);
      case 'lastWatched':
        return new Date(b.lastWatched || 0) - new Date(a.lastWatched || 0);
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      default:
        return 0;
    }
  });

  // Handle remove favorite with API call
  const handleRemoveFavorite = async (movieId) => {
    if (window.confirm('Remove this movie from favorites?')) {
      try {
        await toggleFavorite(movieId); // This will remove if already favorite
        // Refresh the favorites list
        await fetchFavorites();
      } catch (err) {
        console.error('Error removing favorite:', err);
        setError('Failed to remove from favorites. Please try again.');
      }
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setLoading(true);
    setError('');
    try {
      await fetchFavorites();
    } catch (err) {
      setError('Failed to refresh favorites. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format duration for display
  const formatDuration = (duration) => {
    if (!duration) return 'Unknown';
    if (typeof duration === 'string') return duration;
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <Heart className="w-8 h-8 text-red-500 mr-3" />
              Favorite Movies
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {favorites.length} movies in your favorites
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              icon={RefreshCw}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh'}
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
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="dateAdded">Date Added</option>
              <option value="name">Name</option>
              <option value="lastWatched">Last Watched</option>
              <option value="rating">Rating</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading favorites...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-800 dark:text-red-200">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && favorites.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No favorites yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Start adding movies to your favorites to see them here
          </p>
          <Button onClick={() => window.history.back()}>
            Browse Movies
          </Button>
        </div>
      ) : sortedFavorites.length === 0 ? (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No results found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search term
          </p>
        </div>
      ) : (
        /* Favorites Grid/List */
        <div className={`grid ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' 
            : 'grid-cols-1'
        } gap-4`}>
          {sortedFavorites.map((movie) => (
            <div
              key={movie.id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg 
                        transition-all duration-200 group border border-gray-200 dark:border-gray-700
                        ${viewMode === 'list' ? 'flex items-center p-4' : 'p-3'}`}
            >
              {viewMode === 'grid' ? (
                <>
                  <div className="relative">
                    <div className="aspect-[16/9] bg-gray-200 dark:bg-gray-700 rounded-md mb-3 
                                  overflow-hidden cursor-pointer">
                      <img
                        src={movie.thumbnail || '/default/video-thumb.png'}
                        alt={movie.title || movie.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      {/* Play overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 
                                    transition-opacity flex items-center justify-center">
                        <Play className="w-12 h-12 text-white fill-white" />
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFavorite(movie.id)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full
                               opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 
                               line-clamp-2 cursor-pointer hover:text-blue-500">
                    {movie.title || movie.name}
                  </h3>
                  
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDuration(movie.duration)}
                    </span>
                    {movie.rating && (
                      <span className="flex items-center">
                        <Star className="w-3 h-3 mr-1 text-yellow-500" />
                        {movie.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-1 mb-3">
                    <span className="text-xs text-gray-500">
                      Added: {new Date(movie.favoriteDate || movie.lastUpdated).toLocaleDateString()}
                    </span>
                    {movie.lastWatched && (
                      <span className="text-xs text-green-600 dark:text-green-400">
                        Last watched: {new Date(movie.lastWatched).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="xs"
                      className="flex-1"
                      onClick={() => {/* Navigate to player */}}
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Watch
                    </Button>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleRemoveFavorite(movie.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-24 h-16 bg-gray-200 dark:bg-gray-700 rounded-md mr-4 
                                flex-shrink-0 overflow-hidden cursor-pointer relative">
                    <img
                      src={movie.thumbnail || '/default/video-thumb.png'}
                      alt={movie.title || movie.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 hover:opacity-100 
                                  transition-opacity flex items-center justify-center">
                      <Play className="w-6 h-6 text-white fill-white" />
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1 cursor-pointer hover:text-blue-500">
                      {movie.title || movie.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatDuration(movie.duration)}
                      </span>
                      {movie.rating && (
                        <span className="flex items-center">
                          <Star className="w-4 h-4 mr-1 text-yellow-500" />
                          {movie.rating.toFixed(1)}
                        </span>
                      )}
                      <span>{movie.views || 0} views</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-gray-500">
                        Added: {new Date(movie.favoriteDate || movie.lastUpdated).toLocaleDateString()}
                      </span>
                      {movie.lastWatched && (
                        <span className="text-xs text-green-600 dark:text-green-400">
                          Last watched: {new Date(movie.lastWatched).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {/* Navigate to player */}}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Watch
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveFavorite(movie.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Bulk Actions */}
      {favorites.length > 0 && (
        <div className="fixed bottom-6 right-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (window.confirm('Remove all movies from favorites?')) {
                    favorites.forEach(movie => handleRemoveFavorite(movie.id));
                  }
                }}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {/* Export favorites */}}
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieFavorites;