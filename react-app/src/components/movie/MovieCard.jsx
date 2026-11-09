// 📁 src/components/movie/MovieCard.jsx
// 🎬 Lớp bọc của ItemCard cho Movie: cách mở (thư mục / trình phát), dòng phụ, thời lượng, thao tác.

import React from 'react';
import { FiHeart, FiFolder, FiTrash2, FiEye } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useMovieStore } from '@/store';
import { useRecentMoviesManager } from '@/hooks/useMovieData';
import ItemCard from '@/components/common/ItemCard';
import { formatBytes, formatDuration, stripExtension } from '@/utils/formatters';

// onOpenFolder(item): trang duyệt truyền vào để giữ sort/size khi mở thư mục (AUDIT R5); nơi khác giữ cách mở cũ
const MovieCard = ({ item, showViews = false, onFavoriteChange, variant = 'grid', onDeleteClick, subtitle, badgeTopLeft, onOpenFolder }) => {
  const navigate = useNavigate();
  const { toggleFavorite } = useMovieStore();
  const { addRecentMovie } = useRecentMoviesManager();

  const isVideo = item.type === 'video' || item.type === 'file';
  const isFolder = item.type === 'folder';

  const handleOpen = () => {
    if (isFolder) {
      if (onOpenFolder) onOpenFolder(item);
      else navigate(`/movie?path=${encodeURIComponent(item.path)}`);
    } else if (isVideo) {
      // Add to recent and navigate to player with stable URL using state
      addRecentMovie(item);
      navigate('/movie/player', { state: { file: item.path } });
    }
  };

  const toggleItemFavorite = async () => {
    try {
      // Gọi toggleFavorite từ store (đã có updateFavoriteInAllCaches)
      await toggleFavorite(item);
      onFavoriteChange?.(item, !item.isFavorite);
    } catch (error) {
      console.error('❌ Error toggling favorite in MovieCard:', error);
    }
  };

  const displayName = item.name || item.path?.split('/').pop() || 'Unknown';
  // Đuôi file đã hiện ở dòng phụ, nên tên trên card bỏ đuôi cho gọn
  const shownName = isVideo ? stripExtension(displayName) : displayName;
  const ext = isVideo ? (item.path?.split('.').pop()?.toLowerCase() || 'video') : '';
  // DB lưu size bằng byte; trước đây card in thẳng số byte (ví dụ "4509715660")
  const sizeBytes = Number(item.size);
  const sizeLabel = Number.isFinite(sizeBytes) && sizeBytes > 0 ? formatBytes(sizeBytes) : '';
  // Thời lượng (giây, đo lúc quét) ở góc dưới phải ảnh, đúng quy ước của video
  const durationSec = Number(item.duration);
  const durationLabel = isVideo && Number.isFinite(durationSec) && durationSec > 0 ? formatDuration(durationSec) : '';

  const defaultSubtitle = isFolder ? (
    <>
      <FiFolder className="flex-none" aria-hidden="true" />
      Thư mục
    </>
  ) : showViews && item.viewCount > 0 ? (
    <>
      <FiEye className="flex-none" aria-hidden="true" />
      {item.viewCount.toLocaleString('vi-VN')} lượt xem
    </>
  ) : (
    // "MKV · 4.2 GB"
    [ext.toUpperCase(), sizeLabel].filter(Boolean).join(' · ')
  );

  // Thao tác trong bảng ⋯ / nhấn giữ / chuột phải
  const actions = [
    {
      key: 'favorite',
      label: item.isFavorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích',
      icon: FiHeart,
      onClick: toggleItemFavorite,
    },
    onDeleteClick && {
      key: 'delete',
      label: 'Xoá khỏi cơ sở dữ liệu',
      icon: FiTrash2,
      danger: true,
      onClick: () => onDeleteClick(item),
    },
  ];

  return (
    <ItemCard
      type="movie"
      title={displayName}
      displayTitle={shownName}
      thumbnail={item.thumbnail}
      isFolder={isFolder}
      subtitle={subtitle ?? defaultSubtitle}
      badgeTopLeft={badgeTopLeft}
      badgeBottomRight={durationLabel || undefined}
      favorite={Boolean(item.isFavorite)}
      playable={isVideo}
      onOpen={handleOpen}
      actions={actions}
      sheetSubtitle={item.path}
      variant={variant === 'list' ? 'list' : 'grid'}
    />
  );
};

export default MovieCard;
