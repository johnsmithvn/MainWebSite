// 📁 src/components/music/MusicCard.jsx
// 🎵 Music card component for folders and audio files

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlay, FiFolder, FiMusic, FiHeart } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useMusicStore, useAuthStore } from '@/store';

const MusicCard = ({ 
  item, 
  showViews = false, 
  onFavoriteChange,
  variant = 'default', // 'default', 'compact', 'slider'
  className = ''
}) => {
  const navigate = useNavigate();
  const { toggleFavorite, favorites } = useMusicStore();
  const { sourceKey } = useAuthStore();

  // Normalize item data
  const displayName = item.name || item.path?.split('/').pop() || 'Unknown';
  const isAudio = item.type === 'audio' || item.type === 'file';
  const isFolder = item.type === 'folder';
  const isPlaylist = item.isPlaylist;
  const isFavorite = Boolean(item.isFavorite || favorites.some(fav => fav.path === item.path));

  // Handle thumbnail URL với fallback cho music
  const getThumbnailUrl = () => {
    if (item.thumbnail && item.thumbnail !== 'null') {
      return item.thumbnail;
    }
    
    // Fallback thumbnails cho music
    if (isAudio) {
      return '/default/music-thumb.png';
    } else if (isFolder) {
      return '/default/folder-thumb.png';
    }
    
    return '/default/default-cover.jpg';
  };

  const handleClick = () => {
    const encodedPath = encodeURIComponent(item.path);
    
    if (isPlaylist) {
      // Navigate to playlist player
      navigate(`/music/player?playlist=${encodedPath}&key=${sourceKey}`);
    } else if (isAudio) {
      // Navigate to audio player
      navigate(`/music/player?file=${encodedPath}&key=${sourceKey}`);
    } else if (isFolder) {
      // Navigate to folder
      navigate(`/music?path=${encodedPath}`);
    }
  };

  const handleFavoriteClick = async (e) => {
    e.stopPropagation();
    
    try {
      console.log('❤️ MusicCard toggleFavorite:', { path: item.path, currentFavorite: isFavorite });
      
      // Gọi toggleFavorite từ store (đã có updateFavoriteInAllCaches)
      await toggleFavorite(item);
      if (onFavoriteChange) {
        onFavoriteChange(item, !isFavorite);
      }
      
      console.log('✅ MusicCard favorite toggle completed');
    } catch (error) {
      console.error('❌ Error toggling favorite in MusicCard:', error);
    }
  };

  const cardVariants = {
    default: 'bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200',
    compact: 'bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200',
    slider: 'bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200'
  };

  const getTypeIcon = () => {
    if (isPlaylist) return <FiMusic className="w-3 h-3" />;
    if (isAudio) return <FiPlay className="w-3 h-3" />;
    return <FiFolder className="w-3 h-3" />;
  };

  const getTypeLabel = () => {
    if (isPlaylist) return 'Playlist';
    if (isAudio) return 'Audio';
    return 'Thư mục';
  };

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
          onError={(e) => {
            e.target.src = isAudio ? '/default/music-thumb.png' : '/default/folder-thumb.png';
          }}
        />
        
        {/* Play overlay for audio */}
        {(isAudio || isPlaylist) && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <FiPlay className="w-12 h-12 text-white drop-shadow-lg" />
          </div>
        )}

        {/* Favorite button */}
        <motion.button
          className={`
            absolute top-2 right-2 p-2 rounded-full backdrop-blur-sm transition-colors duration-200
            ${isFavorite 
              ? 'bg-red-500/80 text-white hover:bg-red-600/80' 
              : 'bg-black/20 text-white hover:bg-black/40'
            }
          `}
          onClick={handleFavoriteClick}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <FiHeart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </motion.button>

        {/* Type indicator */}
        <div className="absolute bottom-2 left-2">
          <div className="flex items-center space-x-1 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs">
            {getTypeIcon()}
            <span>{getTypeLabel()}</span>
          </div>
        </div>

        {/* View count or duration */}
        {showViews && item.views && (
          <div className="absolute bottom-2 right-2">
            <div className="flex items-center space-x-1 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs">
              <FiMusic className="w-3 h-3" />
              <span>{item.views}</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2 mb-1">
          {displayName}
        </h3>
        
        {/* Additional info */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{getTypeLabel()}</span>
          {item.duration && (
            <span className="text-xs">{formatDuration(item.duration)}</span>
          )}
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
