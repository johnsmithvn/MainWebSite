// 📁 src/pages/manga/MangaFavorites.jsx
// ❤️ Trang manga yêu thích

import React, { useState } from 'react';
import { Heart, Search, Grid, List, Trash2, BookOpen, Download } from 'lucide-react';
import { useMangaStore, useUIStore } from '@/store';
import Button from '@/components/common/Button';

const MangaFavorites = () => {
  const { favorites, mangaList, removeFavorite, searchTerm, setSearchTerm } = useMangaStore();
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('dateAdded');

  // Get favorite manga details
  const favoriteManga = mangaList.filter(manga => favorites.includes(manga.id));

  const filteredFavorites = favoriteManga.filter(manga =>
    manga.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedFavorites = [...filteredFavorites].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.title.localeCompare(b.title);
      case 'dateAdded':
        return new Date(b.favoriteDate || b.lastUpdated) - new Date(a.favoriteDate || a.lastUpdated);
      case 'lastRead':
        return new Date(b.lastRead || 0) - new Date(a.lastRead || 0);
      default:
        return 0;
    }
  });

  const handleRemoveFavorite = (mangaId) => {
    if (window.confirm('Remove this manga from favorites?')) {
      removeFavorite(mangaId);
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
              Favorite Manga
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {favorites.length} manga in your favorites
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
              <option value="lastRead">Last Read</option>
            </select>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {favorites.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No favorites yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Start adding manga to your favorites to see them here
          </p>
          <Button onClick={() => window.history.back()}>
            Browse Manga
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
            ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6' 
            : 'grid-cols-1'
        } gap-4`}>
          {sortedFavorites.map((manga) => (
            <div
              key={manga.id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg 
                        transition-all duration-200 group border border-gray-200 dark:border-gray-700
                        ${viewMode === 'list' ? 'flex items-center p-4' : 'p-3'}`}
            >
              {viewMode === 'grid' ? (
                <>
                  <div className="relative">
                    <div className="aspect-[3/4] bg-gray-200 dark:bg-gray-700 rounded-md mb-3 
                                  overflow-hidden cursor-pointer">
                      <img
                        src={manga.thumbnail || '/default/default-cover.jpg'}
                        alt={manga.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveFavorite(manga.id)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full
                               opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 
                               line-clamp-2 cursor-pointer hover:text-blue-500">
                    {manga.title}
                  </h3>
                  
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {manga.chapters} chapters
                  </p>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500">
                      Added: {new Date(manga.favoriteDate || manga.lastUpdated).toLocaleDateString()}
                    </span>
                    {manga.lastRead && (
                      <span className="text-xs text-green-600 dark:text-green-400">
                        Last read: {new Date(manga.lastRead).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-1 mt-2">
                    <Button
                      variant="outline"
                      size="xs"
                      className="flex-1"
                      onClick={() => {/* Navigate to reader */}}
                    >
                      <BookOpen className="w-3 h-3 mr-1" />
                      Read
                    </Button>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleRemoveFavorite(manga.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-20 bg-gray-200 dark:bg-gray-700 rounded-md mr-4 
                                flex-shrink-0 overflow-hidden cursor-pointer">
                    <img
                      src={manga.thumbnail || '/default/default-cover.jpg'}
                      alt={manga.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1 cursor-pointer hover:text-blue-500">
                      {manga.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {manga.chapters} chapters • {manga.views} views
                    </p>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-gray-500">
                        Added: {new Date(manga.favoriteDate || manga.lastUpdated).toLocaleDateString()}
                      </span>
                      {manga.lastRead && (
                        <span className="text-xs text-green-600 dark:text-green-400">
                          Last read: {new Date(manga.lastRead).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {/* Navigate to reader */}}
                    >
                      <BookOpen className="w-4 h-4 mr-1" />
                      Read
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveFavorite(manga.id)}
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
                  if (window.confirm('Remove all manga from favorites?')) {
                    favorites.forEach(id => removeFavorite(id));
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

export default MangaFavorites;
