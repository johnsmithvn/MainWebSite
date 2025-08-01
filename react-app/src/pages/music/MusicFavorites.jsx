// 📁 src/pages/music/MusicFavorites.jsx
// ❤️ Trang music yêu thích

import React, { useState } from 'react';
import { Heart, Search, Grid, List, Trash2, Play, Download, Clock, Music } from 'lucide-react';
import { useMusicStore, useUIStore } from '@/store';
import Button from '@/components/common/Button';

const MusicFavorites = () => {
  const { favorites, musicList, removeFavorite, searchTerm, setSearchTerm } = useMusicStore();
  const [viewMode, setViewMode] = useState('list');
  const [sortBy, setSortBy] = useState('dateAdded');

  // Sample favorite music
  const sampleFavoriteMusic = [
    {
      id: 1,
      title: "Bohemian Rhapsody",
      artist: "Queen",
      album: "A Night at the Opera",
      duration: "5:55",
      year: 1975,
      genre: "Rock",
      thumbnail: "/default/music-thumb.png",
      plays: 15420,
      format: "mp3",
      favoriteDate: new Date('2024-01-15'),
      lastPlayed: new Date('2024-01-20')
    },
    {
      id: 2,
      title: "Hotel California",
      artist: "Eagles", 
      album: "Hotel California",
      duration: "6:30",
      year: 1976,
      genre: "Rock",
      thumbnail: "/default/music-thumb.png",
      plays: 12350,
      format: "flac",
      favoriteDate: new Date('2024-01-10'),
      lastPlayed: new Date('2024-01-25')
    },
    {
      id: 3,
      title: "Billie Jean",
      artist: "Michael Jackson",
      album: "Thriller",
      duration: "4:54",
      year: 1982,
      genre: "Pop",
      thumbnail: "/default/music-thumb.png",
      plays: 18900,
      format: "mp3",
      favoriteDate: new Date('2024-01-12'),
      lastPlayed: new Date('2024-01-22')
    }
  ];

  const filteredFavorites = sampleFavoriteMusic.filter(track =>
    track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    track.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
    track.album.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedFavorites = [...filteredFavorites].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.title.localeCompare(b.title);
      case 'artist':
        return a.artist.localeCompare(b.artist);
      case 'dateAdded':
        return new Date(b.favoriteDate) - new Date(a.favoriteDate);
      case 'lastPlayed':
        return new Date(b.lastPlayed || 0) - new Date(a.lastPlayed || 0);
      case 'plays':
        return b.plays - a.plays;
      default:
        return 0;
    }
  });

  const handleRemoveFavorite = (trackId) => {
    if (window.confirm('Remove this song from favorites?')) {
      removeFavorite(trackId);
    }
  };

  const handlePlayAll = () => {
    // Navigate to player with playlist
    console.log('Playing all favorites...');
  };

  const totalDuration = sampleFavoriteMusic.reduce((total, track) => {
    const [min, sec] = track.duration.split(':').map(Number);
    return total + (min * 60 + sec);
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <Heart className="w-8 h-8 text-red-500 mr-3" />
              Favorite Music
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {sampleFavoriteMusic.length} songs • {Math.floor(totalDuration / 60)} minutes
            </p>
          </div>
          <div className="flex items-center gap-3">
            {sampleFavoriteMusic.length > 0 && (
              <Button
                variant="primary"
                onClick={handlePlayAll}
                icon={Play}
              >
                Play All
              </Button>
            )}
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
              <option value="name">Song Name</option>
              <option value="artist">Artist</option>
              <option value="lastPlayed">Last Played</option>
              <option value="plays">Most Played</option>
            </select>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {sampleFavoriteMusic.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No favorites yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Start adding songs to your favorites to see them here
          </p>
          <Button onClick={() => window.history.back()}>
            Browse Music
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
        <div className={`${
          viewMode === 'grid' 
            ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4' 
            : 'space-y-2'
        }`}>
          {sortedFavorites.map((track, index) => (
            <div
              key={track.id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg 
                        transition-all duration-200 group border border-gray-200 dark:border-gray-700
                        ${viewMode === 'list' ? 'flex items-center p-4' : 'p-4'}`}
            >
              {viewMode === 'grid' ? (
                <>
                  <div className="relative">
                    <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-md mb-3 
                                  overflow-hidden cursor-pointer">
                      <img
                        src={track.thumbnail}
                        alt={track.album}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 
                                    transition-all duration-300 flex items-center justify-center">
                        <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFavorite(track.id)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full
                               opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 
                               line-clamp-1 cursor-pointer hover:text-blue-500">
                    {track.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 line-clamp-1">
                    {track.artist}
                  </p>
                  <p className="text-xs text-gray-500 mb-2 line-clamp-1">
                    {track.album}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>{track.duration}</span>
                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {track.format.toUpperCase()}
                    </span>
                  </div>

                  <div className="text-xs text-gray-500 mb-3">
                    <p>Added: {track.favoriteDate.toLocaleDateString()}</p>
                    {track.lastPlayed && (
                      <p className="text-green-600 dark:text-green-400">
                        Last played: {track.lastPlayed.toLocaleDateString()}
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
                      Play
                    </Button>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleRemoveFavorite(track.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="w-4 h-4 mr-4 flex items-center justify-center">
                      <span className="text-sm text-gray-500">{index + 1}</span>
                    </div>
                    
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-md mr-4 
                                  flex-shrink-0 overflow-hidden cursor-pointer relative group">
                      <img
                        src={track.thumbnail}
                        alt={track.album}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 
                                    transition-all duration-300 flex items-center justify-center">
                        <Play className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0 mr-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate cursor-pointer hover:text-blue-500">
                        {track.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {track.artist}
                      </p>
                    </div>
                    
                    <div className="hidden md:block flex-1 min-w-0 mr-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {track.album}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="hidden sm:block text-xs">
                      <p>Added: {track.favoriteDate.toLocaleDateString()}</p>
                      {track.lastPlayed && (
                        <p className="text-green-600 dark:text-green-400">
                          Last: {track.lastPlayed.toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    
                    <span className="hidden md:block">{track.plays.toLocaleString()} plays</span>
                    <span>{track.duration}</span>
                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                      {track.format.toUpperCase()}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleRemoveFavorite(track.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Bulk Actions */}
      {sampleFavoriteMusic.length > 0 && (
        <div className="fixed bottom-6 right-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (window.confirm('Remove all songs from favorites?')) {
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
                onClick={handlePlayAll}
              >
                <Play className="w-4 h-4 mr-1" />
                Play All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {/* Export playlist */}}
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

export default MusicFavorites;
