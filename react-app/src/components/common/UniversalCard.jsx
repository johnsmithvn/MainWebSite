// 📁 src/components/common/UniversalCard.jsx
// 🎯 Universal card component cho manga, movie, music

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlay, FiFolder, FiMusic, FiHeart, FiEye, FiClock } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store';
import { useRecentManager } from '@/hooks/useRecentManager';
import { apiService } from '@/utils/api';
import { buildThumbnailUrl } from '@/utils/thumbnailUtils';

const UniversalCard = ({ 
  item, 
  type = 'manga', // 'manga', 'movie', 'music'
  isFavorite = false,
  showViews = false, 
  onToggleFavorite,
  variant = 'default', // 'default', 'compact', 'slider'
  className = '',
  // New: control what appears in the bottom-left overlay: 'type' or 'views'
  overlayMode = 'type'
}) => {
  const navigate = useNavigate();
  const { sourceKey, rootFolder } = useAuthStore();
  const { addRecentItem } = useRecentManager(type);
  
  // Internal state for favorite status to update UI immediately
  const [currentFavoriteState, setCurrentFavoriteState] = useState(Boolean(isFavorite));
  
  // Update internal state when prop changes
  useEffect(() => {
    const booleanFavorite = Boolean(isFavorite);
    setCurrentFavoriteState(booleanFavorite);
    // Only log when there's an actual change to reduce spam
    if (booleanFavorite !== currentFavoriteState) {
      console.log('🔄 UniversalCard favorite updated:', { 
        path: item?.path?.split('/').pop(), // Only show filename for cleaner logs
        from: currentFavoriteState,
        to: booleanFavorite
      });
    }
  }, [isFavorite, item?.path]); // Add item.path as dependency

  // Normalize item data based on type
  const getItemData = () => {
    const baseName = item.name || item.path?.split('/').pop() || 'Unknown';
    
    if (type === 'manga') {
      return {
        displayName: baseName === '__self__' ? 'Đọc ngay' : baseName,
        isReadable: item.name === '__self__' || (item.images && item.images.length > 0),
        isFolder: !item.images || item.images.length === 0,
        thumbnail: getThumbnailUrl(),
        typeIcon: item.images ? FiPlay : FiFolder,
        typeLabel: item.images ? 'Đọc truyện' : 'Thư mục'
      };
    } else if (type === 'movie') {
      const isVideo = item.type === 'video' || item.type === 'file';
      return {
        displayName: baseName,
        isReadable: isVideo,
        isFolder: item.type === 'folder',
        thumbnail: getThumbnailUrl(),
        typeIcon: isVideo ? FiPlay : FiFolder,
        typeLabel: isVideo ? 'Video' : 'Thư mục'
      };
    } else if (type === 'music') {
      const isAudio = item.type === 'audio' || item.type === 'file';
      const isPlaylist = item.isPlaylist;
      return {
        displayName: baseName,
        isReadable: isAudio || isPlaylist,
        isFolder: item.type === 'folder' && !isPlaylist,
        thumbnail: getThumbnailUrl(),
        typeIcon: isAudio || isPlaylist ? FiMusic : FiFolder,
        typeLabel: isPlaylist ? 'Playlist' : isAudio ? 'Audio' : 'Thư mục'
      };
    }
    
    return {
      displayName: baseName,
      isReadable: false,
      isFolder: true,
      thumbnail: getThumbnailUrl(),
      typeIcon: FiFolder,
      typeLabel: 'Unknown'
    };
  };

  // Get thumbnail URL using utility
  const getThumbnailUrl = () => {
    return buildThumbnailUrl(item, type, sourceKey);
  };

  // Handle click navigation
  const handleClick = async () => {
    const encodedPath = encodeURIComponent(item.path);
    
    // Add to recent items before navigation
    try {
      addRecentItem(item);
      console.log('➕ Added to recent:', { type, name: item.name, path: item.path });
    } catch (error) {
      console.warn('Failed to add to recent:', error);
    }
    
    // Increase view count for content items (not folders)
    if (type === 'manga' && (item.name === '__self__' || (item.images && item.images.length > 0))) {
      try {
        await apiService.system.increaseViewManga({
          path: item.path,
          dbkey: sourceKey,
          rootKey: rootFolder
        });
        console.log('📈 View count increased for manga:', item.path);
      } catch (error) {
        console.warn('Failed to increase view count for manga:', error);
      }
    } else if (type === 'movie' && (item.type === 'video' || item.type === 'file')) {
      // NOTE: View count is handled by MoviePlayer component
      // Don't increase view count here to avoid duplicate calls
      console.log('🎬 Movie click - view will be increased by MoviePlayer');
      /*
      try {
        // Use direct fetch for movie-specific endpoint
        await fetch('/api/increase-view/movie', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: sourceKey,
            path: item.path
          })
        });
        console.log('📈 View count increased for movie:', item.path);
      } catch (error) {
        console.warn('Failed to increase view count for movie:', error);
      }
      */
    } else if (type === 'music' && (item.type === 'audio' || item.type === 'file' || item.isPlaylist)) {
      // NOTE: View count for music is handled inside MusicPlayer on playback to ensure exactly-once semantics
      // Avoid calling increase-view here to prevent duplicate counts on initial navigation
      // console.log('🎵 Music click - view will be increased by MusicPlayer on play');
    }
    
    // Navigate based on type
    if (type === 'manga') {
      if (item.name === '__self__' || (item.images && item.images.length > 0)) {
        // Navigate to reader with return URL for proper back navigation
        const readerParams = new URLSearchParams();
        readerParams.set('path', item.path);
        if (window.location.pathname === '/manga') {
          readerParams.set('returnUrl', `${window.location.pathname}${window.location.search}`);
        }
        navigate(`/manga/reader?${readerParams.toString()}`);
      } else {
        // Navigate to manga folder
        navigate(`/manga?path=${encodedPath}`);
      }
    } else if (type === 'movie') {
      const isVideo = item.type === 'video' || item.type === 'file';
      if (isVideo) {
        // Navigate to movie player with state (stable URL)
        navigate('/movie/player', { state: { file: item.path, key: sourceKey } });
      } else {
        // Navigate to movie folder
        navigate(`/movie?path=${encodedPath}`);
      }
    } else if (type === 'music') {
      const isAudio = item.type === 'audio' || item.type === 'file';
      const isPlaylist = item.isPlaylist;
      if (isPlaylist) {
        // Open player with playlist context, keep URL stable
        navigate('/music/player', { state: { playlist: item.path, key: sourceKey } });
      } else if (isAudio) {
        const folderPath = item.path?.split('/').slice(0, -1).join('/') || '';
        // Pass both file and its parent folder so player can build playlist correctly
        navigate('/music/player', { state: { file: item.path, playlist: folderPath, key: sourceKey } });
      } else {
        // For music folders clicked from sliders -> open directly as playlist in player
        navigate('/music/player', { state: { playlist: item.path, key: sourceKey } });
      }
    }
  };

  const handleFavoriteClick = async (e) => {
    e.stopPropagation();
    
    // Update UI immediately for responsive feel
    const newFavoriteState = !currentFavoriteState;
    setCurrentFavoriteState(newFavoriteState);
    
    // Call parent callback if provided
    if (onToggleFavorite) {
      try {
        await onToggleFavorite(item);
        console.log('✅ Favorite toggle completed via parent callback');
      } catch (error) {
        // If error, revert UI state
        setCurrentFavoriteState(currentFavoriteState);
        console.error('❌ Error in parent favorite toggle, reverting UI:', error);
      }
    }
  };

  const itemData = getItemData();
  const TypeIcon = itemData.typeIcon;

  const cardVariants = {
    default: 'bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200',
    compact: 'bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200',
    slider: 'bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200'
  };

  // Aspect ratio based on type
  const getAspectRatio = () => {
    if (type === 'music') return 'aspect-square';
    if (type === 'movie') return 'aspect-video';
    return 'aspect-[3/4]'; // manga default
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
      <div className={`relative ${getAspectRatio()} overflow-hidden`}>
        <img
          src={itemData.thumbnail}
          alt={itemData.displayName}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            if (type === 'movie') {
              const isVideo = item.type === 'video' || item.type === 'file';
              e.target.src = isVideo ? '/default/video-thumb.png' : '/default/folder-thumb.png';
            } else if (type === 'music') {
              const isAudio = item.type === 'audio' || item.type === 'file';
              e.target.src = isAudio ? '/default/music-thumb.png' : '/default/folder-thumb.png';
            } else {
              e.target.src = '/default/default-cover.jpg';
            }
          }}
        />
        
        {/* Play overlay for readable content */}
        {itemData.isReadable && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <TypeIcon className="w-12 h-12 text-white drop-shadow-lg" />
          </div>
        )}

        {/* Favorite button */}
        <motion.button
          className={`
            absolute top-2 right-2 p-2 rounded-full backdrop-blur-sm transition-colors duration-200
            ${currentFavoriteState 
              ? 'bg-red-500/80 text-white hover:bg-red-600/80' 
              : 'bg-black/20 text-white hover:bg-black/40'
            }
          `}
          onClick={handleFavoriteClick}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <FiHeart className={`w-4 h-4 ${currentFavoriteState ? 'fill-current' : ''}`} />
        </motion.button>

        {/* Bottom-left overlay: type label or views depending on overlayMode */}
        <div className="absolute bottom-2 left-2">
          {overlayMode === 'views' ? (
            <div className="flex items-center space-x-1 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs">
              <FiEye className="w-3 h-3" />
              <span>{(item?.views ?? item?.viewCount ?? item?.count ?? 0)}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs">
              <TypeIcon className="w-3 h-3" />
              <span>{itemData.typeLabel}</span>
            </div>
          )}
        </div>

        {/* View count (bottom-right). Hide if overlayMode already shows views to avoid duplication */}
        {showViews && overlayMode !== 'views' && (item?.views ?? item?.viewCount ?? item?.count) !== undefined && (
          <div className="absolute bottom-2 right-2">
            <div className="flex items-center space-x-1 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs">
              <FiEye className="w-3 h-3" />
              <span>{item?.views ?? item?.viewCount ?? item?.count ?? 0}</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2 mb-1">
          {itemData.displayName}
        </h3>
        
        {/* Additional info */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{itemData.typeLabel}</span>
          {item.size && (
            <span className="text-xs">{formatSize(item.size)}</span>
          )}
          {item.duration && (
            <span className="text-xs">{formatDuration(item.duration)}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Helper functions
const formatSize = (bytes) => {
  if (!bytes) return '';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

const formatDuration = (seconds) => {
  if (!seconds) return '';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default UniversalCard;
