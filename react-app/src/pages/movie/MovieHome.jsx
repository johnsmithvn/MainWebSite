// 📁 src/pages/movie/MovieHome.jsx
// 🎬 Trang chủ movie

import React, { useState, useEffect } from 'react';
import { Search, Heart, Play, Grid, List, Filter, Clock, Star } from 'lucide-react';
import { useMovieStore, useUIStore } from '@/store';
import Button from '@/components/common/Button';
import LoadingOverlay from '@/components/common/LoadingOverlay';

const MovieHome = () => {
  const { isLoading, toggleLoading } = useUIStore();
  const { movieList, favorites, currentSource, searchTerm, setSearchTerm } = useMovieStore();
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('name');
  const [filterBy, setFilterBy] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Sample movie data
  const sampleMovies = [
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
      type: "movie"
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
      type: "movie"
    },
    {
      id: 3,
      title: "Black Panther: Wakanda Forever",
      duration: "2h 41m",
      year: 2022,
      genre: ["Action", "Adventure", "Drama"],
      rating: 6.7,
      thumbnail: "/default/video-thumb.png",
      description: "The people of Wakanda fight to protect their home from intervening world powers.",
      views: 42000,
      type: "movie"
    },
    {
      id: 4,
      title: "Doctor Strange in the Multiverse of Madness",
      duration: "2h 6m",
      year: 2022,
      genre: ["Action", "Adventure", "Fantasy"],
      rating: 6.9,
      thumbnail: "/default/video-thumb.png",
      description: "Doctor Strange teams up with a mysterious teenage girl.",
      views: 35000,
      type: "movie"
    }
  ];

  useEffect(() => {
    // Simulate loading
    toggleLoading();
    setTimeout(() => {
      toggleLoading();
    }, 1000);
  }, [currentSource]);

  const filteredMovies = sampleMovies.filter(movie => {
    const matchesSearch = movie.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterBy === 'all' || 
                         (filterBy === 'favorites' && favorites.includes(movie.id)) ||
                         movie.genre.some(g => g.toLowerCase() === filterBy.toLowerCase());
    return matchesSearch && matchesFilter;
  });

  const sortedMovies = [...filteredMovies].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.title.localeCompare(b.title);
      case 'year':
        return b.year - a.year;
      case 'rating':
        return b.rating - a.rating;
      case 'views':
        return b.views - a.views;
      default:
        return 0;
    }
  });

  if (isLoading) {
    return <LoadingOverlay message="Loading movies..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              🎬 Movie Library
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Source: {currentSource?.name || 'Unknown'}
            </p>
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
            placeholder="Search movies..."
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
                  <option value="year">Year</option>
                  <option value="rating">Rating</option>
                  <option value="views">Views</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Filter by:
                </label>
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Movies</option>
                  <option value="favorites">Favorites</option>
                  <option value="action">Action</option>
                  <option value="adventure">Adventure</option>
                  <option value="drama">Drama</option>
                  <option value="sci-fi">Sci-Fi</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Play className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{sampleMovies.length}</p>
              <p className="text-gray-600 dark:text-gray-400">Total Movies</p>
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
            <Star className="w-8 h-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(sampleMovies.reduce((sum, movie) => sum + movie.rating, 0) / sampleMovies.length).toFixed(1)}
              </p>
              <p className="text-gray-600 dark:text-gray-400">Avg Rating</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Search className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredMovies.length}</p>
              <p className="text-gray-600 dark:text-gray-400">Search Results</p>
            </div>
          </div>
        </div>
      </div>

      {/* Movies Grid/List */}
      {sortedMovies.length === 0 ? (
        <div className="text-center py-12">
          <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No movies found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div className={`grid ${
          viewMode === 'grid' 
            ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' 
            : 'grid-cols-1'
        } gap-6`}>
          {sortedMovies.map((movie) => (
            <div
              key={movie.id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl 
                        transition-all duration-200 cursor-pointer group border border-gray-200 dark:border-gray-700
                        ${viewMode === 'list' ? 'flex items-center p-4' : 'overflow-hidden'}`}
            >
              {viewMode === 'grid' ? (
                <>
                  <div className="relative aspect-[16/9] bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <img
                      src={movie.thumbnail}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 
                                  transition-all duration-300 flex items-center justify-center">
                      <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="absolute top-2 right-2">
                      <Heart className={`w-5 h-5 ${
                        favorites.includes(movie.id) 
                          ? 'text-red-500 fill-current' 
                          : 'text-white opacity-70'
                      }`} />
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <span className="bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                        {movie.duration}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2 line-clamp-1">
                      {movie.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
                      <span>{movie.year}</span>
                      <div className="flex items-center">
                        <Star className="w-3 h-3 text-yellow-500 mr-1" />
                        <span>{movie.rating}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
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
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {movie.description}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-32 h-18 bg-gray-200 dark:bg-gray-700 rounded-md mr-4 
                                flex-shrink-0 overflow-hidden relative">
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
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {movie.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <span>{movie.year}</span>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-500 mr-1" />
                        <span>{movie.rating}</span>
                      </div>
                      <span>{movie.views.toLocaleString()} views</span>
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
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {movie.description}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <Heart className={`w-5 h-5 ${
                      favorites.includes(movie.id) 
                        ? 'text-red-500 fill-current' 
                        : 'text-gray-400'
                    }`} />
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

export default MovieHome;
