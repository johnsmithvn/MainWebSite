// 📁 src/components/movie/MovieCard.jsx
// 🎬 Movie card component for folders and videos

import React from 'react';
import { Heart, Play, Folder, Clock, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMovieStore } from '@/store';
import { useRecentMoviesManager } from '@/hooks/useMovieData';
import { DEFAULT_IMAGES } from '@/constants';

const MovieCard = ({ item, showViews = false, onFavoriteChange, variant = 'grid', onDeleteClick }) => {
  const navigate = useNavigate();
  const { toggleFavorite } = useMovieStore();
  const { addRecentMovie } = useRecentMoviesManager();

  const handleClick = () => {
    console.log('🎬 MovieCard clicked:', { item, type: item.type, path: item.path });
    
    if (item.type === 'folder') {
      // Navigate to folder view
      const encodedPath = encodeURIComponent(item.path);
      const newUrl = `/movie?path=${encodedPath}`;
      console.log('🎬 Navigating to folder:', newUrl);
      navigate(newUrl);
    } else if (item.type === 'video' || item.type === 'file') {
      // Add to recent and navigate to player with stable URL using state
      addRecentMovie(item);
      console.log('🎬 Navigating to player with state');
      navigate('/movie/player', { state: { file: item.path } });
    }
  };

  const handleFavoriteClick = async (e) => {
    e.stopPropagation();
    try {
      console.log('❤️ MovieCard toggleFavorite:', { path: item.path, currentFavorite: item.isFavorite });
      
      // Gọi toggleFavorite từ store (đã có updateFavoriteInAllCaches)
      await toggleFavorite(item);
      onFavoriteChange?.(item, !item.isFavorite);
      
      console.log('✅ MovieCard favorite toggle completed');
    } catch (error) {
      console.error('❌ Error toggling favorite in MovieCard:', error);
    }
  };

  const handleDeleteClickInternal = (e) => {
    e.stopPropagation();
    if (onDeleteClick) {
      onDeleteClick(item);
    }
  };

  const displayName = item.name || item.path?.split('/').pop() || 'Unknown';
  const isVideo = item.type === 'video' || item.type === 'file';
  const isFolder = item.type === 'folder';
  const getTypeLabel = () => {
    if (isVideo) {
      const ext = item.path?.split('.').pop()?.toLowerCase();
      return `${ext || 'video'}`;
    }
    return 'Folder';
  };
  const typeLabel = getTypeLabel();

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
          <div className="w-16 h-12 sm:w-24 sm:h-16 bg-gray-200 dark:bg-gray-700 rounded-md 
                        flex-shrink-0 overflow-hidden">
            <img
              src={item.thumbnail || (isVideo ? DEFAULT_IMAGES.video : DEFAULT_IMAGES.folder)}
              alt={displayName}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.target.src = isVideo ? DEFAULT_IMAGES.video : DEFAULT_IMAGES.folder;
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
                {isFolder ? <Folder className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                {typeLabel}
              </span>
              {showViews && item.views > 0 && (
                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="w-3 h-3" />
                  {item.views} views
                </span>
              )}
            </div>
          </div>

          {/* Favorite button */}
          {isVideo && (
            <button
              onClick={handleFavoriteClick}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full
                        hover:bg-gray-100 dark:hover:bg-gray-700"
              title={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart 
                className={`w-5 h-5 ${
                  item.isFavorite 
                    ? 'fill-red-500 text-red-500' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              />
            </button>
          )}

          {/* Delete button */}
          <button
            onClick={handleDeleteClickInternal}
            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 
                     dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title={`Xóa ${item.type === 'folder' ? 'folder' : 'video'} khỏi DB`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl 
                 transition-all duration-200 cursor-pointer border border-gray-200 dark:border-gray-700 
                 overflow-hidden"
      onClick={handleClick}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <img
          src={item.thumbnail || (isVideo ? DEFAULT_IMAGES.video : DEFAULT_IMAGES.folder)}
          alt={displayName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.target.src = isVideo ? DEFAULT_IMAGES.video : DEFAULT_IMAGES.folder;
          }}
        />
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 
                      transition-all duration-300 flex items-center justify-center">
          {isVideo ? (
            <Play className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          ) : (
            <Folder className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>

        {/* Favorite button */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-1 sm:top-2 right-1 sm:right-2 p-0.5 sm:p-1 rounded-full bg-black bg-opacity-50 
                     hover:bg-opacity-70 transition-all duration-200 z-10"
        >
          <Heart 
            className={`w-3 h-3 sm:w-4 sm:h-4 ${
              item.isFavorite 
                ? 'text-red-500 fill-current' 
                : 'text-white'
            }`} 
          />
        </button>

        {/* Delete button */}
        <button
          onClick={handleDeleteClickInternal}
          className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 p-0.5 sm:p-1 rounded-full bg-red-500 
                     opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all duration-200 z-10"
        >
          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
        </button>

        {/* Type indicator */}
        <div className="absolute bottom-1 sm:bottom-2 left-1 sm:left-2">
          <span className="bg-black bg-opacity-75 text-white text-[9px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded flex items-center gap-0.5 sm:gap-1">
            {isVideo ? <Play className="w-2 h-2 sm:w-3 sm:h-3" /> : <Folder className="w-2 h-2 sm:w-3 sm:h-3" />}
            {typeLabel}
          </span>
        </div>

        {/* Views count - removed from overlay, moved to info section below */}
        {/* Views count moved to bottom info section */}
      </div>

      {/* Info */}
      <div className="p-2 sm:p-3">
        <h3 
          className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm line-clamp-2 mb-0.5 sm:mb-1"
          title={displayName}
        >
          {displayName}
        </h3>
        
        {/* Additional info */}
        <div className="flex items-center justify-between text-[9px] sm:text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-0.5 sm:gap-1">
            {isVideo ? <Play className="w-2 h-2 sm:w-3 sm:h-3" /> : <Folder className="w-2 h-2 sm:w-3 sm:h-3" />}
            {typeLabel}
          </span>
          
          {/* Views count moved here from overlay */}
          {showViews && item.views !== undefined ? (
            <span className="flex items-center gap-0.5 sm:gap-1">
              <Clock className="w-2 h-2 sm:w-3 sm:h-3" />
              {item.views?.toLocaleString() || 0}
            </span>
          ) : item.size ? (
            <span>{item.size}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
