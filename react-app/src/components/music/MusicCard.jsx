// 📁 src/components/music/MusicCard.jsx
// 🎵 Lớp bọc của ItemCard cho Music: cách mở (thư mục / trình phát), "Ca sĩ · thời lượng", thao tác.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiFolder, FiList, FiPlus, FiTrash2, FiHeadphones } from 'react-icons/fi';
import { useAuthStore } from '@/store';
import ItemCard from '@/components/common/ItemCard';
import { formatDuration, stripExtension } from '@/utils/formatters';

const MusicCard = ({
  item,
  showViews = false,
  variant = 'grid',
  className = '',
  onDeleteClick
}) => {
  const navigate = useNavigate();
  const { sourceKey } = useAuthStore();

  const displayName = item.name || item.path?.split('/').pop() || 'Unknown';
  const isAudio = item.type === 'audio' || item.type === 'file';
  const isFolder = item.type === 'folder';
  const isPlaylist = item.isPlaylist;
  // Đuôi file đã hiện ở dòng phụ khi không có ca sĩ, nên tên trên card bỏ đuôi cho gọn
  const shownName = isAudio ? stripExtension(displayName) : displayName;

  const handleOpen = () => {
    if (isPlaylist) {
      navigate('/music/player', { state: { kind: 'playlist', playlist: item.path, key: sourceKey } });
    } else if (isAudio) {
      const folderPath = item.path?.split('/').slice(0, -1).join('/') || '';
      navigate('/music/player', { state: { kind: 'audio', file: item.path, playlist: folderPath, key: sourceKey } });
    } else if (isFolder) {
      navigate(`/music?path=${encodeURIComponent(item.path)}`);
    }
  };

  const openPlaylistModal = () => {
    window.dispatchEvent(new CustomEvent('openPlaylistModal', { detail: { item } }));
  };

  // Dòng phụ của bài hát: "Ca sĩ · 3:58" (API đã trả artist từ bảng songs và duration lúc quét)
  const durationSec = Number(item.duration);
  const durationLabel = isAudio && Number.isFinite(durationSec) && durationSec > 0 ? formatDuration(durationSec) : '';
  const ext = isAudio ? (item.path?.split('.').pop()?.toLowerCase() || 'audio') : '';
  const audioSub = [item.artist, durationLabel].filter(Boolean).join(' · ') || ext.toUpperCase();

  const subtitle = isPlaylist ? (
    <>
      <FiList className="flex-none" aria-hidden="true" />
      Playlist
    </>
  ) : isFolder ? (
    <>
      <FiFolder className="flex-none" aria-hidden="true" />
      Thư mục
    </>
  ) : (
    audioSub
  );

  // Thao tác trong bảng ⋯ / nhấn giữ / chuột phải
  const actions = [
    isAudio && {
      key: 'playlist',
      label: 'Thêm vào playlist',
      icon: FiPlus,
      onClick: openPlaylistModal,
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
      type="music"
      title={displayName}
      displayTitle={shownName}
      thumbnail={item.thumbnail}
      isFolder={isFolder || Boolean(isPlaylist)}
      thumbKind={isFolder ? 'folder' : 'music'}
      subtitle={subtitle}
      badgeBottomRight={showViews && item.viewCount > 0 ? { text: item.viewCount.toLocaleString('vi-VN'), icon: FiHeadphones } : undefined}
      playable={isAudio || Boolean(isPlaylist)}
      onOpen={handleOpen}
      actions={actions}
      sheetSubtitle={item.path}
      variant={variant === 'list' ? 'list' : 'grid'}
      className={className}
    />
  );
};

export default MusicCard;
