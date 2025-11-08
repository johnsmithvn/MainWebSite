// 📁 src/components/music/MusicCard.jsx
// 🎵 Music card component for folders and audio files

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlay, FiFolder, FiMusic, FiPlus } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useMusicStore, useAuthStore } from '@/store';
import { DEFAULT_IMAGES } from '@/constants';

const MusicCard = ({ 
  item, 
  showViews = false, 
  onFavoriteChange,
  variant = 'default', // 'default', 'compact', 'slider'
  className = ''
}) => {
  const navigate = useNavigate();
  const { /* remove favorites for music */ } = useMusicStore();
  const { sourceKey } = useAuthStore();

  // Normalize item data
  const displayName = item.name || item.path?.split('/').pop() || 'Unknown';
  const isAudio = item.type === 'audio' || item.type === 'file';
  const isFolder = item.type === 'folder';
  const isPlaylist = item.isPlaylist;
  const isFavorite = false; // Favorite removed for music

  // Handle thumbnail URL với fallback cho music
  const getThumbnailUrl = () => {
    if (item.thumbnail && item.thumbnail !== 'null') {
      return item.thumbnail;
    }
    
    // Fallback thumbnails cho music
    if (isAudio) {
      return DEFAULT_IMAGES.music;
    } else if (isFolder) {
      return DEFAULT_IMAGES.folder;
    }
    
    return DEFAULT_IMAGES.cover;
  };

  const handleClick = () => {
    const encodedPath = encodeURIComponent(item.path);
    
    if (isPlaylist) {
      // Open player with playlist context, keep URL stable
      navigate('/music/player', { state: { kind: 'playlist', playlist: item.path, key: sourceKey } });
    } else if (isAudio) {
      // Open player with both file and its parent folder as playlist context
      const folderPath = item.path?.split('/').slice(0, -1).join('/') || '';
      navigate('/music/player', { state: { kind: 'audio', file: item.path, playlist: folderPath, key: sourceKey } });
    } else if (isFolder) {
      // Navigate to folder browser
      navigate(`/music?path=${encodedPath}`);
    }
  };

  const handleAddToPlaylist = (e) => {
    e.stopPropagation();
    // Dispatch global event consumed by PlaylistModal
    window.dispatchEvent(new CustomEvent('openPlaylistModal', { detail: { item } }));
  };

  const cardVariants = {
    default: 'bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200',
    compact: 'bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200',
    slider: 'bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200',
    list: 'bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200',
    grid: 'bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200'
  };

  const getTypeIcon = () => {
    if (isPlaylist) return <FiMusic className="w-3 h-3" />;
    if (isAudio) return <FiPlay className="w-3 h-3" />;
    return <FiFolder className="w-3 h-3" />;
  };

  const getTypeLabel = () => {
    if (isPlaylist) return 'Playlist';
    if (isAudio) {
      const ext = item.path?.split('.').pop()?.toLowerCase();
      return `${ext || 'audio'}`;
    }
    return 'Folder';
  };

  // List view layout (like Manga)
  if (variant === 'list') {
    return (
      <div
        onClick={handleClick}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg 
                  transition-all duration-200 cursor-pointer group flex items-center p-2 sm:p-4"
      >
        <div className="flex items-center gap-2 sm:gap-4 w-full">
          {/* Thumbnail */}
          <div className="w-12 h-16 sm:w-16 sm:h-20 bg-gray-200 dark:bg-gray-700 rounded-md 
                        flex-shrink-0 overflow-hidden">
            <img
              src={getThumbnailUrl()}
              alt={displayName}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.target.src = isAudio ? DEFAULT_IMAGES.music : DEFAULT_IMAGES.folder;
              }}
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white 
                          truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 
                          transition-colors">
              {displayName}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
                            bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                {getTypeIcon()}
                {getTypeLabel()}
              </span>
              {showViews && item.viewCount > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {item.viewCount} plays
                </span>
              )}
            </div>
          </div>

          {/* Action button */}
          {isAudio && (
            <button
              onClick={handleAddToPlaylist}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full
                        hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Add to playlist"
            >
              <FiPlus className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={`
        relative cursor-pointer group overflow-hidden
        ${cardVariants[variant]}
        ${className}
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
    >
      {/* Thumbnail */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={getThumbnailUrl()}
          alt={displayName}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.target.src = isAudio ? DEFAULT_IMAGES.music : DEFAULT_IMAGES.folder;
          }}
        />
        
        {/* Play overlay for audio */}
        {(isAudio || isPlaylist) && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <FiPlay className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white drop-shadow-lg" />
          </div>
        )}

        {/* Add to playlist button (top-right, outlined translucent) */}
        <motion.button
          className="absolute top-1 sm:top-2 right-1 sm:right-2 h-6 w-6 sm:h-8 sm:w-8 flex items-center justify-center rounded-full border-[1.5px] sm:border-2 border-white/80 text-white bg-black/30 hover:bg-black/40 backdrop-blur-sm shadow-md transition-all"
          onClick={handleAddToPlaylist}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Thêm vào playlist"
        >
          <FiPlus className="w-3 h-3 sm:w-4 sm:h-4" />
        </motion.button>

  {/* Type indicator - top-left */}
        <div className="absolute top-1 sm:top-2 left-1 sm:left-2">
          <div className="flex items-center space-x-0.5 sm:space-x-1 bg-black/60 backdrop-blur-sm text-white px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-xs">
            {getTypeIcon()}
            <span>{getTypeLabel()}</span>
          </div>
        </div>

        {/* View count moved to bottom info section */}
      </div>

      {/* Content */}
      <div className="p-2 sm:p-3">
        <h3 className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm line-clamp-2 mb-0.5 sm:mb-1">
          {displayName}
        </h3>
        
        {/* Additional info */}
        <div className="flex items-center justify-between text-[9px] sm:text-xs text-gray-500 dark:text-gray-400">
          <span>{getTypeLabel()}</span>
          
          {/* Views count moved here from overlay, or duration */}
          {showViews && item.views ? (
            <span className="flex items-center gap-0.5 sm:gap-1">
              <FiMusic className="w-2 h-2 sm:w-3 sm:h-3" />
              {item.views}
            </span>
          ) : item.duration ? (
            <span>{formatDuration(item.duration)}</span>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
};

// Helper function to format duration
const formatDuration = (seconds) => {
  if (!seconds) return '';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default MusicCard;
