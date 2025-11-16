// 📁 react-app/src/components/media/MediaGrid.jsx
// 📸 Media Grid Component (Google Photos-like)

import React from 'react';
import { Heart, Video, CheckCircle } from 'lucide-react';

function MediaGrid({ items, selectedItems, onSelectItem, onItemClick, onFavorite }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1">
      {items.map((item, index) => (
        <MediaGridItem
          key={item.id}
          item={item}
          index={index}
          isSelected={selectedItems.has(item.id)}
          onSelect={() => onSelectItem(item.id)}
          onClick={() => onItemClick(index)}
          onFavorite={(isFavorite) => onFavorite(item.id, isFavorite)}
        />
      ))}
    </div>
  );
}

function MediaGridItem({ item, index, isSelected, onSelect, onClick, onFavorite }) {
  const isVideo = item.type === 'video';
  
  // Thumbnail logic with fallback
  let thumbSrc;
  if (item.thumbnail) {
    thumbSrc = `/media/${item.path.split('/').slice(0, -1).join('/')}/${item.thumbnail}`;
  } else if (isVideo) {
    // Video fallback to default thumbnail
    thumbSrc = '/default/video-thumb.png';
  } else {
    // Image without thumbnail - use the image itself
    thumbSrc = `/media/${item.path}`;
  }

  const handleClick = (e) => {
    if (e.shiftKey || e.ctrlKey) {
      e.preventDefault();
      onSelect();
    } else {
      onClick();
    }
  };

  return (
    <div
      className={`relative aspect-square bg-gray-200 dark:bg-gray-800 cursor-pointer group overflow-hidden ${
        isSelected ? 'ring-4 ring-blue-500' : ''
      }`}
      onClick={handleClick}
    >
      <img
        src={thumbSrc}
        alt={item.name}
        className="w-full h-full object-cover transition-transform group-hover:scale-110"
        loading="lazy"
      />

      {/* Video indicator */}
      {isVideo && (
        <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
          <Video size={12} />
          {formatDuration(item.duration)}
        </div>
      )}

      {/* File name (show on hover or select) */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white text-xs transition-opacity ${
        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}>
        <div className="truncate">{item.name}</div>
      </div>

      {/* Selection checkbox - Always visible */}
      <div className="absolute top-2 left-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center hover:bg-white shadow-md"
        >
          {isSelected ? (
            <CheckCircle className="text-blue-600" size={20} fill="currentColor" />
          ) : (
            <div className="w-4 h-4 rounded-full border-2 border-gray-600"></div>
          )}
        </button>
      </div>

      {/* Favorite button */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavorite(!item.isFavorite);
          }}
          className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center"
        >
          <Heart
            size={16}
            className={item.isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-600'}
          />
        </button>
      </div>
    </div>
  );
}

function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default MediaGrid;
