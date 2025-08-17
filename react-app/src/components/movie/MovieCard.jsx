// 📁 src/components/movie/MovieCard.jsx
// 🎬 Movie card component for folders and videos

import React from 'react';
import { Heart, Play, Folder, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMovieStore } from '@/store';
import { useRecentMoviesManager } from '@/hooks/useMovieData';

const MovieCard = ({ item, showViews = false, onFavoriteChange }) => {
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

  const displayName = item.name || item.path?.split('/').pop() || 'Unknown';
  const isVideo = item.type === 'video' || item.type === 'file';
  const isFolder = item.type === 'folder';
  const getTypeLabel = () => {
    if (isVideo) {
      const ext = item.path?.split('.').pop()?.toLowerCase();
      return `.${ext || 'video'}`;
    }
    return 'Folder';
  };
  const typeLabel = getTypeLabel();

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
          src={item.thumbnail || (isVideo ? '/default/video-thumb.png' : '/default/folder-thumb.png')}
          alt={displayName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src = isVideo ? '/default/video-thumb.png' : '/default/folder-thumb.png';
          }}
        />
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 
                      transition-all duration-300 flex items-center justify-center">
          {isVideo ? (
            <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          ) : (
            <Folder className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>

        {/* Favorite button */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-2 right-2 p-1 rounded-full bg-black bg-opacity-50 
                     hover:bg-opacity-70 transition-all duration-200 z-10"
        >
          <Heart 
            className={`w-4 h-4 ${
              item.isFavorite 
                ? 'text-red-500 fill-current' 
                : 'text-white'
            }`} 
          />
        </button>

        {/* Type indicator */}
        <div className="absolute bottom-2 left-2">
          <span className="bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
            {isVideo ? <Play className="w-3 h-3" /> : <Folder className="w-3 h-3" />}
            {typeLabel}
          </span>
        </div>

        {/* Views count */}
        {showViews && item.views !== undefined && (
          <div className="absolute bottom-2 right-2">
            <span className="bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {item.views?.toLocaleString() || 0}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 
          className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2 mb-1"
          title={displayName}
        >
          {displayName}
        </h3>
        
        {/* Additional info */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            {isVideo ? <Play className="w-3 h-3" /> : <Folder className="w-3 h-3" />}
            {typeLabel}
          </span>
          
          {item.size && (
            <span>{item.size}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
