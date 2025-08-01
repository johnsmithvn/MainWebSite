// 📁 src/pages/movie/MovieFavorites.jsx
// ❤️ Trang movie yêu thích

import React, { useState } from 'react';
import { Heart, Search, Grid, List, Trash2, Play, Download, Star } from 'lucide-react';
import { useMovieStore, useUIStore } from '@/store';
import Button from '@/components/common/Button';

const MovieFavorites = () => {
  const { favorites, movieList, removeFavorite, searchTerm, setSearchTerm } = useMovieStore();
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('dateAdded');

  // Sample favorite movies
  const sampleFavoriteMovies = [
    {
      id: 1,
      title: "Avatar: The Way of Water",
      duration: "3h 12m",
      year: 2022,
      genre: ["Action", "Adventure", "Sci-Fi"],
      rating: 8.1,
      thumbnail: "/default/video-thumb.png",
      description: "Jake Sully lives with his newfound family formed on the planet of Pandora.",
      views: 45000,
      favoriteDate: new Date('2024-01-15'),
      lastWatched: new Date('2024-01-20')
    },
    {
      id: 2,
      title: "Top Gun: Maverick",
      duration: "2h 10m",
      year: 2022,
      genre: ["Action", "Drama"],
      rating: 8.3,
      thumbnail: "/default/video-thumb.png",
      description: "After thirty years, Maverick is still pushing the envelope as a top naval aviator.",
      views: 38000,
      favoriteDate: new Date('2024-01-10'),
      lastWatched: new Date('2024-01-25')
    }
  ];

  const filteredFavorites = sampleFavoriteMovies.filter(movie =>
    movie.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedFavorites = [...filteredFavorites].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.title.localeCompare(b.title);
      case 'dateAdded':
        return new Date(b.favoriteDate) - new Date(a.favoriteDate);
      case 'lastWatched':
        return new Date(b.lastWatched || 0) - new Date(a.lastWatched || 0);
      case 'rating':
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

  const handleRemoveFavorite = (movieId) => {
    if (window.confirm('Remove this movie from favorites?')) {
      removeFavorite(movieId);
    }
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
              {sampleFavoriteMovies.length} movies in your favorites
            </p>
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

      {/* Empty State */}
      {sampleFavoriteMovies.length === 0 ? (
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
            ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' 
            : 'grid-cols-1'
        } gap-6`}>
          {sortedFavorites.map((movie) => (
            <div
              key={movie.id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl 
                        transition-all duration-200 group border border-gray-200 dark:border-gray-700
                        ${viewMode === 'list' ? 'flex items-center p-4' : 'overflow-hidden'}`}
            >
              {viewMode === 'grid' ? (
                <>
                  <div className="relative">
                    <div className="aspect-[16/9] bg-gray-200 dark:bg-gray-700 overflow-hidden cursor-pointer">
                      <img
                        src={movie.thumbnail}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 
                                    transition-all duration-300 flex items-center justify-center">
                        <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="absolute top-2 left-2">
                        <span className="bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                          {movie.duration}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFavorite(movie.id);
                          }}
                          className="p-1 bg-red-500 text-white rounded-full
                                   hover:bg-red-600 transition-colors"
                        >
                          <Heart className="w-4 h-4 fill-current" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2 
                                 line-clamp-1 cursor-pointer hover:text-blue-500">
                      {movie.title}
                    </h3>
                    
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
                      <span>{movie.year}</span>
                      <div className="flex items-center">
                        <Star className="w-3 h-3 text-yellow-500 mr-1" />
                        <span>{movie.rating}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {movie.genre.slice(0, 2).map((genre) => (
                        <span
                          key={genre}
                          className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 
                                   px-2 py-1 rounded"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>

                    <div className="text-xs text-gray-500 mb-3">
                      <p>Added: {movie.favoriteDate.toLocaleDateString()}</p>
                      {movie.lastWatched && (
                        <p className="text-green-600 dark:text-green-400">
                          Last watched: {movie.lastWatched.toLocaleDateString()}
                        </p>
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
                  </div>
                </>
              ) : (
                <>
                  <div className="w-32 h-18 bg-gray-200 dark:bg-gray-700 rounded-md mr-4 
                                flex-shrink-0 overflow-hidden cursor-pointer relative">
                    <img
                      src={movie.thumbnail}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1 left-1">
                      <span className="bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded">
                        {movie.duration}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1 cursor-pointer hover:text-blue-500">
                      {movie.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <span>{movie.year}</span>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-500 mr-1" />
                        <span>{movie.rating}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {movie.genre.map((genre) => (
                        <span
                          key={genre}
                          className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 
                                   px-2 py-1 rounded"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500">
                      <p>Added: {movie.favoriteDate.toLocaleDateString()}</p>
                      {movie.lastWatched && (
                        <p className="text-green-600 dark:text-green-400">
                          Last watched: {movie.lastWatched.toLocaleDateString()}
                        </p>
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
      {sampleFavoriteMovies.length > 0 && (
        <div className="fixed bottom-6 right-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (window.confirm('Remove all movies from favorites?')) {
                    // Clear all favorites logic
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
