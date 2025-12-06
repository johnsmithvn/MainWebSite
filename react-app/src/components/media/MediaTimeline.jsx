// 📁 react-app/src/components/media/MediaTimeline.jsx
// 📅 Media Timeline Component (Google Photos style)

import React from 'react';
import { Video, Heart, CheckCircle } from 'lucide-react';

function MediaTimeline({ items, selectedItems, onSelectItem, onItemClick, onFavorite }) {
  // Group items by year-month
  const grouped = items.reduce((acc, item, index) => {
    const date = new Date(item.date_taken || item.modified);
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!acc[yearMonth]) {
      acc[yearMonth] = {
        items: [],
        year: date.getFullYear(),
        month: date.toLocaleString('vi-VN', { month: 'long' })
      };
    }
    acc[yearMonth].items.push({ ...item, originalIndex: index });
    return acc;
  }, {});

  // Sort by date descending (newest first)
  const sortedGroups = Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <div className="space-y-8">
      {sortedGroups.map(([yearMonth, group]) => (
        <div key={yearMonth}>
          {/* Month/Year Header - Fixed to match toolbar height (64px) */}
          <div className="bg-gray-50 dark:bg-gray-900 py-3 z-10 mb-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {group.month} năm {group.year}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {group.items.length} ảnh
            </p>
          </div>

          {/* Photo Grid - Same size as Photos view */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1">
            {group.items.map((item) => (
              <TimelinePhoto
                key={item.id}
                item={item}
                isSelected={selectedItems?.has(item.id)}
                onSelect={() => onSelectItem?.(item.id)}
                onClick={() => onItemClick(item.originalIndex)}
                onFavorite={(isFavorite) => onFavorite?.(item.id, isFavorite)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TimelinePhoto({ item, isSelected, onSelect, onClick, onFavorite }) {
  const isVideo = item.type === 'video';
  
  // Thumbnail logic with fallback
  let thumbSrc;
  if (item.thumbnail) {
    thumbSrc = `/media/${item.path.split('/').slice(0, -1).join('/')}/${item.thumbnail}`;
  } else if (isVideo) {
    thumbSrc = '/default/video-thumb.png';
  } else {
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

  const handleImageError = (e) => {
    // Fallback to default thumbnail on error
    if (isVideo) {
      e.target.src = '/default/video-thumb.png';
    } else {
      e.target.src = '/default/folder-thumb.png';
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
        onError={handleImageError}
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

      {/* Action buttons (show on hover or select) - Only Favorite */}
      <div className={`absolute top-2 right-2 transition-opacity ${
        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}>
        {/* Favorite */}
        {onFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFavorite(!item.isFavorite);
            }}
            className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center hover:bg-white shadow-md"
            title={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              size={16}
              className={item.isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-600'}
            />
          </button>
        )}
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

export default MediaTimeline;
