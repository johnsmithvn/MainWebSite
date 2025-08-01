// 📁 src/pages/music/MusicHome.jsx
// 🎵 Trang chủ music

import React, { useState, useEffect } from 'react';
import { Search, Heart, Play, Grid, List, Filter, Clock, Music } from 'lucide-react';
import { useMusicStore, useUIStore } from '@/store';
import Button from '@/components/common/Button';
import LoadingOverlay from '@/components/common/LoadingOverlay';

const MusicHome = () => {
  const { isLoading, toggleLoading } = useUIStore();
  const { musicList, favorites, currentSource, searchTerm, setSearchTerm } = useMusicStore();
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('name');
  const [filterBy, setFilterBy] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Sample music data
  const sampleMusic = [
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
      format: "mp3"
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
      format: "flac"
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
      format: "mp3"
    },
    {
      id: 4,
      title: "Stairway to Heaven",
      artist: "Led Zeppelin",
      album: "Led Zeppelin IV",
      duration: "8:02",
      year: 1971,
      genre: "Rock",
      thumbnail: "/default/music-thumb.png",
      plays: 14200,
      format: "mp3"
    }
  ];

  useEffect(() => {
    // Simulate loading
    toggleLoading();
    setTimeout(() => {
      toggleLoading();
    }, 1000);
  }, [currentSource]);

  const filteredMusic = sampleMusic.filter(track => {
    const matchesSearch = track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         track.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         track.album.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterBy === 'all' || 
                         (filterBy === 'favorites' && favorites.includes(track.id)) ||
                         track.genre.toLowerCase() === filterBy.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const sortedMusic = [...filteredMusic].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.title.localeCompare(b.title);
      case 'artist':
        return a.artist.localeCompare(b.artist);
      case 'year':
        return b.year - a.year;
      case 'plays':
        return b.plays - a.plays;
      case 'duration':
        return a.duration.localeCompare(b.duration);
      default:
        return 0;
    }
  });

  if (isLoading) {
    return <LoadingOverlay message="Loading music library..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              🎵 Music Library
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Source: {currentSource?.name || 'M_MUSIC'}
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
            placeholder="Search songs, artists, albums..."
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
                  <option value="name">Song Name</option>
                  <option value="artist">Artist</option>
                  <option value="year">Year</option>
                  <option value="plays">Most Played</option>
                  <option value="duration">Duration</option>
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
                  <option value="all">All Music</option>
                  <option value="favorites">Favorites</option>
                  <option value="rock">Rock</option>
                  <option value="pop">Pop</option>
                  <option value="jazz">Jazz</option>
                  <option value="classical">Classical</option>
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
            <Music className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{sampleMusic.length}</p>
              <p className="text-gray-600 dark:text-gray-400">Total Songs</p>
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
            <Clock className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.floor(sampleMusic.reduce((total, track) => {
                  const [min, sec] = track.duration.split(':').map(Number);
                  return total + (min * 60 + sec);
                }, 0) / 60)}m
              </p>
              <p className="text-gray-600 dark:text-gray-400">Total Duration</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Search className="w-8 h-8 text-purple-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredMusic.length}</p>
              <p className="text-gray-600 dark:text-gray-400">Search Results</p>
            </div>
          </div>
        </div>
      </div>

      {/* Music Grid/List */}
      {sortedMusic.length === 0 ? (
        <div className="text-center py-12">
          <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No music found
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
        } gap-4`}>
          {sortedMusic.map((track) => (
            <div
              key={track.id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg 
                        transition-all duration-200 cursor-pointer group border border-gray-200 dark:border-gray-700
                        ${viewMode === 'list' ? 'flex items-center p-4' : 'p-4'}`}
            >
              {viewMode === 'grid' ? (
                <>
                  <div className="relative aspect-square bg-gray-200 dark:bg-gray-700 rounded-md mb-3 
                                overflow-hidden">
                    <img
                      src={track.thumbnail}
                      alt={track.album}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 
                                  transition-all duration-300 flex items-center justify-center">
                      <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="absolute top-2 right-2">
                      <Heart className={`w-4 h-4 ${
                        favorites.includes(track.id) 
                          ? 'text-red-500 fill-current' 
                          : 'text-white opacity-70'
                      }`} />
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 
                               line-clamp-1">
                    {track.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 line-clamp-1">
                    {track.artist}
                  </p>
                  <p className="text-xs text-gray-500 mb-2 line-clamp-1">
                    {track.album}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{track.duration}</span>
                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {track.format.toUpperCase()}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-md mr-4 
                                flex-shrink-0 overflow-hidden relative group">
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
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {track.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {track.artist} • {track.album}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <span>{track.year}</span>
                      <span>{track.genre}</span>
                      <span>{track.plays.toLocaleString()} plays</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>{track.duration}</span>
                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                      {track.format.toUpperCase()}
                    </span>
                    <Heart className={`w-4 h-4 ${
                      favorites.includes(track.id) 
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

export default MusicHome;
