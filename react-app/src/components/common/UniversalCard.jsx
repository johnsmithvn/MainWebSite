// 📁 src/components/common/UniversalCard.jsx
// 🎯 Card trong các slider (Ngẫu nhiên, Xem nhiều, Đọc tiếp) cho manga, movie, music.
// Lớp bọc của ItemCard: giữ cách mở item theo từng loại, còn giao diện dùng chung với lưới.

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHeart, FiEye, FiPlus, FiTrash2 } from 'react-icons/fi';
import { useAuthStore } from '@/store';
import { useRecentManager } from '@/hooks/useRecentManager';
import { buildThumbnailUrl } from '@/utils/thumbnailUtils';
import ItemCard from '@/components/common/ItemCard';
import { formatDuration } from '@/utils/formatters';

const UniversalCard = ({
  item,
  type = 'manga', // 'manga', 'movie', 'music'
  isFavorite = false,
  showViews = false,
  showDeleteView = false, // "Xoá lượt xem" trong bảng thao tác (hàng Xem nhiều)
  onToggleFavorite,
  onDeleteView,
  className = '',
  // 'views': hiện lượt xem ở góc dưới phải ảnh
  overlayMode = 'type',
  // Dòng phụ thay cho nhãn loại (ví dụ tên thư mục cha)
  subtitle,
  // Badge góc trên trái: chuỗi hoặc { text, tone } (ví dụ hạng #1, "2 giờ trước")
  badgeTopLeft,
}) => {
  const navigate = useNavigate();
  const { sourceKey } = useAuthStore();
  const { addRecentItem } = useRecentManager(type);

  // Internal state for favorite status to update UI immediately
  const [currentFavoriteState, setCurrentFavoriteState] = useState(Boolean(isFavorite));
  useEffect(() => {
    setCurrentFavoriteState(Boolean(isFavorite));
  }, [isFavorite, item?.path]);

  // Normalize item data based on type
  const getItemData = () => {
    const baseName = item.name || item.path?.split('/').pop() || 'Unknown';

    if (type === 'manga') {
      return {
        displayName: baseName === '__self__' ? 'Đọc ngay' : baseName,
        isReadable: item.name === '__self__' || (item.images && item.images.length > 0),
        isFolder: !item.images || item.images.length === 0,
        typeLabel: item.images ? 'Đọc truyện' : 'Thư mục'
      };
    } else if (type === 'movie') {
      const isVideo = item.type === 'video' || item.type === 'file';
      const ext = isVideo ? item.path?.split('.').pop()?.toLowerCase() : null;
      return {
        displayName: baseName,
        isReadable: isVideo,
        isFolder: item.type === 'folder',
        typeLabel: isVideo ? `${(ext || 'video').toUpperCase()}` : 'Thư mục'
      };
    } else if (type === 'music') {
      const isAudio = item.type === 'audio' || item.type === 'file';
      const isPlaylist = item.isPlaylist;
      const ext = isAudio ? item.path?.split('.').pop()?.toLowerCase() : null;
      return {
        displayName: baseName,
        isReadable: isAudio || isPlaylist,
        isFolder: item.type === 'folder' && !isPlaylist,
        typeLabel: isPlaylist ? 'Playlist' : isAudio ? `${(ext || 'audio').toUpperCase()}` : 'Thư mục'
      };
    }

    return { displayName: baseName, isReadable: false, isFolder: true, typeLabel: '' };
  };

  // Handle click navigation
  const handleOpen = () => {
    const encodedPath = encodeURIComponent(item.path);

    // Add to recent items before navigation
    try {
      addRecentItem(item);
    } catch (error) {
      console.warn('Failed to add to recent:', error);
    }
    // NOTE: lượt xem được đếm ở MangaReader / MoviePlayer / MusicPlayer, không đếm ở đây (tránh đếm 2 lần)

    if (type === 'manga') {
      // PDF: mở trình đọc với cờ type=pdf
      if (item.type === 'pdf') {
        const readerParams = new URLSearchParams();
        readerParams.set('path', item.path);
        readerParams.set('type', 'pdf');
        if (window.location.pathname === '/manga') {
          readerParams.set('returnUrl', `${window.location.pathname}${window.location.search}`);
        }
        navigate(`/manga/reader?${readerParams.toString()}`);
      } else if (item.name === '__self__' || (item.images && item.images.length > 0)) {
        const readerParams = new URLSearchParams();
        readerParams.set('path', item.path);
        if (window.location.pathname === '/manga') {
          readerParams.set('returnUrl', `${window.location.pathname}${window.location.search}`);
        }
        navigate(`/manga/reader?${readerParams.toString()}`);
      } else {
        navigate(`/manga?path=${encodedPath}`);
      }
    } else if (type === 'movie') {
      const isVideo = item.type === 'video' || item.type === 'file';
      if (isVideo) {
        navigate('/movie/player', { state: { file: item.path, key: sourceKey } });
      } else {
        navigate(`/movie?path=${encodedPath}`);
      }
    } else if (type === 'music') {
      const isAudio = item.type === 'audio' || item.type === 'file';
      if (item.isPlaylist) {
        navigate('/music/player', { state: { kind: 'playlist', playlist: item.path, key: sourceKey } });
      } else if (isAudio) {
        const folderPath = item.path?.split('/').slice(0, -1).join('/') || '';
        navigate('/music/player', { state: { kind: 'audio', file: item.path, playlist: folderPath, key: sourceKey } });
      } else {
        // Thư mục nhạc trong slider: phát cả thư mục trong player
        navigate('/music/player', { state: { kind: 'folder', playlist: item.path, key: sourceKey } });
      }
    }
  };

  const toggleFavorite = async () => {
    const previous = currentFavoriteState;
    setCurrentFavoriteState(!previous); // cập nhật giao diện ngay
    if (onToggleFavorite) {
      try {
        await onToggleFavorite(item);
      } catch (error) {
        setCurrentFavoriteState(previous);
        console.error('❌ Error in parent favorite toggle, reverting UI:', error);
      }
    }
  };

  const itemData = getItemData();
  const views = item?.views ?? item?.viewCount ?? item?.count;
  const durationSec = Number(item?.duration);
  const durationLabel = Number.isFinite(durationSec) && durationSec > 0 ? formatDuration(durationSec) : '';

  // Góc dưới phải: lượt xem (hàng Xem nhiều / Ngẫu nhiên) hoặc thời lượng
  const badgeBottomRight = (overlayMode === 'views' || showViews) && views !== undefined
    ? { text: Number(views).toLocaleString('vi-VN'), icon: FiEye }
    : durationLabel || undefined;

  // Thao tác trong bảng ⋯ / nhấn giữ / chuột phải
  const actions = [
    type !== 'music' && onToggleFavorite && {
      key: 'favorite',
      label: currentFavoriteState ? 'Bỏ yêu thích' : 'Thêm vào yêu thích',
      icon: FiHeart,
      onClick: toggleFavorite,
    },
    type === 'music' && {
      key: 'playlist',
      label: 'Thêm vào playlist',
      icon: FiPlus,
      onClick: () => window.dispatchEvent(new CustomEvent('openPlaylistModal', { detail: { item } })),
    },
    showDeleteView && onDeleteView && {
      key: 'delete-view',
      label: 'Xoá lượt xem',
      icon: FiTrash2,
      danger: true,
      onClick: () => onDeleteView(item),
    },
  ];

  return (
    <ItemCard
      type={type}
      title={itemData.displayName}
      thumbnail={buildThumbnailUrl(item, type, sourceKey)}
      thumbKind={type === 'manga' ? (item.type === 'pdf' ? 'pdf' : 'manga') : itemData.isFolder ? 'folder' : undefined}
      isFolder={type !== 'manga' && itemData.isFolder}
      subtitle={subtitle || itemData.typeLabel}
      badgeTopLeft={badgeTopLeft}
      badgeBottomRight={badgeBottomRight}
      favorite={type !== 'music' && currentFavoriteState}
      playable={type !== 'manga' && itemData.isReadable}
      onOpen={handleOpen}
      actions={actions}
      sheetSubtitle={item.path}
      variant="slider"
      className={`w-full ${className}`}
    />
  );
};

export default UniversalCard;
