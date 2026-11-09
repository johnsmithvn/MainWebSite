// 📁 react-app/src/components/media/MediaTimeline.jsx
// 📅 Media Timeline Component (Google Photos style)

import React from 'react';
import { Video, Heart, CheckCircle } from 'lucide-react';
import { FiHeart, FiCheckCircle } from 'react-icons/fi';
import useCardActions from '@/hooks/useCardActions';
import CardThumb from '@/components/common/CardThumb';
import CardActionSheet from '@/components/common/CardActionSheet';
import { CARD_GRIDS } from '@/constants';
import { mediaUrl, parentDir } from '@/utils/mediaUrl';

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
          <div className={CARD_GRIDS.media}>
            {group.items.map((item) => (
              <TimelinePhoto
                key={item.id}
                item={item}
                selectionMode={(selectedItems?.size || 0) > 0}
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

function TimelinePhoto({ item, isSelected, selectionMode, onSelect, onClick, onFavorite }) {
  const isVideo = item.type === 'video';
  const { open: actionsOpen, closeSheet, pressHandlers } = useCardActions();

  // Nguồn thumbnail thử lần lượt: thumbnail đã tạo → file ảnh gốc. Hết nguồn thì CardThumb hiện ô dự phòng
  // (trước đây ảnh lỗi rơi về folder-thumb.png nên trông như một thư mục).
  const thumbSources = [];
  if (item.thumbnail) {
    thumbSources.push(mediaUrl(parentDir(item.path), item.thumbnail));
  }
  if (!isVideo && item.path) {
    thumbSources.push(mediaUrl(item.path));
  }

  // Bảng thao tác khi nhấn giữ (cảm ứng) hoặc chuột phải
  const actions = [
    onFavorite && {
      key: 'favorite',
      label: item.isFavorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích',
      icon: FiHeart,
      onClick: () => onFavorite(!item.isFavorite),
    },
    {
      key: 'select',
      label: isSelected ? 'Bỏ chọn' : 'Chọn',
      icon: FiCheckCircle,
      onClick: onSelect,
    },
  ];

  const handleClick = (e) => {
    // Shift/Ctrl + click, hoặc đang ở chế độ chọn nhiều: chọn / bỏ chọn thay vì mở ảnh
    if (e.shiftKey || e.ctrlKey || selectionMode) {
      e.preventDefault();
      onSelect();
    } else {
      onClick();
    }
  };

  return (
    <>
    <div
      className={`card-pressable relative aspect-square bg-gray-200 dark:bg-gray-800 cursor-pointer group overflow-hidden ${
        isSelected ? 'ring-4 ring-blue-500' : ''
      }`}
      onClick={handleClick}
      {...pressHandlers}
    >
      <CardThumb
        src={thumbSources}
        alt={item.name}
        kind={isVideo ? 'movie' : 'media'}
        className="group-hover:scale-110"
      />

      {/* Video indicator */}
      {isVideo && (
        <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
          <Video size={12} />
          {formatDuration(item.duration)}
        </div>
      )}

      {/* File name (show on hover or select) */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white text-xs transition-opacity pointer-events-none ${
        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}>
        <div className="truncate">{item.name}</div>
      </div>

      {/* Ô chọn: chỉ hiện khi rê chuột, khi đang chọn nhiều hoặc ảnh đã được chọn (trên cảm ứng: nhấn giữ → "Chọn") */}
      <div className={`absolute top-2 left-2 transition-opacity ${
        isSelected || selectionMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 [@media(hover:none)]:hidden'
      }`}>
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

      {/* ❤: hiện khi đã thích hoặc đang chọn; còn lại chỉ hiện lúc rê chuột (ẩn hẳn trên màn hình cảm ứng, dùng nhấn giữ) */}
      <div className={`absolute top-2 right-2 transition-opacity ${
        isSelected || item.isFavorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 [@media(hover:none)]:hidden'
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

    {actionsOpen && (
      <CardActionSheet title={item.name} subtitle={item.path} actions={actions} onClose={closeSheet} />
    )}
    </>
  );
}

function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default MediaTimeline;
