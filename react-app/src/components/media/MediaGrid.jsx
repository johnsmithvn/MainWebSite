// 📁 react-app/src/components/media/MediaGrid.jsx
// 📸 Media Grid Component (Google Photos-like)

import React from 'react';
import { Heart, Video, CheckCircle, FileText, Music, File, Archive, FileCode, Trash2 } from 'lucide-react';
import { FiHeart, FiCheckCircle, FiTrash2 } from 'react-icons/fi';
import useCardActions from '@/hooks/useCardActions';
import CardThumb from '@/components/common/CardThumb';
import CardActionSheet from '@/components/common/CardActionSheet';
import { CARD_GRIDS } from '@/constants';
import { mediaUrl, parentDir } from '@/utils/mediaUrl';

// Helper: Get file type icon
function FileTypeIcon({ type, size = 20 }) {
  const iconProps = { size };

  switch (type) {
    case 'audio':
      return <Music {...iconProps} className="text-purple-400" />;
    case 'pdf':
      return <FileText {...iconProps} className="text-red-400" />;
    case 'text':
      return <FileText {...iconProps} className="text-blue-400" />;
    case 'document':
      return <FileText {...iconProps} className="text-blue-500" />;
    case 'archive':
      return <Archive {...iconProps} className="text-orange-400" />;
    case 'code':
      return <FileCode {...iconProps} className="text-green-400" />;
    default:
      return <File {...iconProps} className="text-gray-400" />;
  }
}

function MediaGrid({ items, selectedItems, onSelectItem, onItemClick, onFavorite, onDeleteClick }) {
  // Đang chọn nhiều (đã chọn ít nhất 1 ảnh): hiện ô chọn trên mọi ảnh và chạm ảnh = chọn/bỏ chọn
  const selectionMode = selectedItems.size > 0;
  return (
    <div className={CARD_GRIDS.media}>
      {items.map((item, index) => (
        <MediaGridItem
          key={item.id}
          item={item}
          index={index}
          selectionMode={selectionMode}
          isSelected={selectedItems.has(item.id)}
          onSelect={() => onSelectItem(item.id)}
          onClick={() => onItemClick(index)}
          onFavorite={(isFavorite) => onFavorite(item.id, isFavorite)}
          onDeleteClick={onDeleteClick ? () => onDeleteClick(item) : undefined}
        />
      ))}
    </div>
  );
}

/** Nguồn thumbnail theo thứ tự thử: thumbnail đã tạo → file ảnh gốc. Hết nguồn thì CardThumb hiện ô dự phòng. */
function mediaThumbSources(item) {
  const isImage = item.type === 'image';
  const sources = [];
  if (item.thumbnail) {
    sources.push(mediaUrl(parentDir(item.path), item.thumbnail));
  }
  if (isImage && item.path) {
    sources.push(mediaUrl(item.path));
  }
  return sources;
}

function MediaGridItem({ item, isSelected, selectionMode, onSelect, onClick, onFavorite, onDeleteClick }) {
  const isVideo = item.type === 'video';
  const isImage = item.type === 'image';
  const isViewable = isImage || isVideo;
  const { open: actionsOpen, closeSheet, pressHandlers } = useCardActions();

  const handleClick = (e) => {
    // Shift/Ctrl + click, hoặc đang ở chế độ chọn nhiều: chọn / bỏ chọn thay vì mở ảnh
    if (e.shiftKey || e.ctrlKey || selectionMode) {
      e.preventDefault();
      onSelect();
    } else {
      onClick();
    }
  };

  // Bảng thao tác khi nhấn giữ (cảm ứng) hoặc chuột phải: thay cho nút chỉ hiện lúc rê chuột
  const actions = [
    {
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
    onDeleteClick && {
      key: 'delete',
      label: 'Xoá khỏi cơ sở dữ liệu',
      icon: FiTrash2,
      danger: true,
      onClick: onDeleteClick,
    },
  ];

  return (
    <>
      <div
        className={`card-pressable relative aspect-square bg-gray-200 dark:bg-gray-800 cursor-pointer group overflow-hidden ${
          isSelected ? 'ring-4 ring-blue-500' : ''
        }`}
        onClick={handleClick}
        {...pressHandlers}
      >
        {isViewable ? (
          <CardThumb
            src={mediaThumbSources(item)}
            alt={item.name}
            kind={isVideo ? 'movie' : 'media'}
            className="group-hover:scale-110"
          />
        ) : (
          // Non-viewable file: Show icon
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 dark:from-gray-800 dark:to-black">
            <FileTypeIcon type={item.type} size={48} />
            <div className="mt-2 text-white text-xs opacity-70 px-2 text-center line-clamp-2">
              {item.name}
            </div>
          </div>
        )}

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
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center hover:bg-white shadow-md"
            aria-label={isSelected ? 'Bỏ chọn' : 'Chọn'}
          >
            {isSelected ? (
              <CheckCircle className="text-blue-600" size={20} fill="currentColor" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-gray-600"></div>
            )}
          </button>
        </div>

        {/* ❤: luôn hiện khi đã thích; chưa thích thì chỉ hiện lúc rê chuột (ẩn hẳn trên màn hình cảm ứng) */}
        <div className={`absolute top-2 right-2 transition-opacity ${
          item.isFavorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 [@media(hover:none)]:hidden'
        }`}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFavorite(!item.isFavorite);
            }}
            className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center"
            aria-label={item.isFavorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
          >
            <Heart
              size={16}
              className={item.isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-600'}
            />
          </button>
        </div>

        {/* Nút xoá: chỉ hiện lúc rê chuột; trên màn hình cảm ứng dùng nhấn giữ */}
        {onDeleteClick && (
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity [@media(hover:none)]:hidden">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteClick();
              }}
              className="w-6 h-6 rounded-full bg-red-600/90 hover:bg-red-700 flex items-center justify-center shadow-md"
              aria-label="Xoá khỏi cơ sở dữ liệu"
            >
              <Trash2 size={14} className="text-white" />
            </button>
          </div>
        )}
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

export default MediaGrid;
