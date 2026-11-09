// 📁 react-app/src/components/media/MediaAlbums.jsx
// 📚 Media Albums Component

import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useModal } from '../common/Modal.jsx';
import ItemCard from '../common/ItemCard';
import { CARD_GRIDS } from '@/constants';
import { mediaUrl, parentDir } from '@/utils/mediaUrl';

function MediaAlbums({ albums, onCreateAlbum, onSelectAlbum, onDeleteAlbum }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { confirmModal, Modal } = useModal();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Albums</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />
          New Album
        </button>
      </div>

      <div className={CARD_GRIDS.mediaFolders}>
        {albums.map((album) => (
          <AlbumCard
            key={album.id}
            album={album}
            onClick={() => onSelectAlbum(album.id)}
            onDelete={async () => {
              if (!onDeleteAlbum) return;
              const ok = await confirmModal({
                title: 'Xóa album',
                message: `Xóa album "${album.name}"?\n\nẢnh trong album sẽ KHÔNG bị xóa.`,
                type: 'confirm',
                confirmText: 'Xóa',
                cancelText: 'Hủy'
              });
              if (ok) onDeleteAlbum(album.id);
            }}
          />
        ))}
      </div>

      {showCreateModal && (
        <CreateAlbumModal
          onSubmit={(name, description) => {
            onCreateAlbum(name, description);
            setShowCreateModal(false);
          }}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Global modal instance for confirmations/alerts */}
      <Modal />
    </div>
  );
}

function AlbumCard({ album, onClick, onDelete }) {
  // Build cover image source: prefer explicit coverImage; else derive from album's first item
  // URL mã hoá từng đoạn (tên có #, ?, % — docs/AUDIT-2026-11-09.md, R2). Thumbnail của ảnh nằm ở thư mục gốc
  // (dir rỗng) trước đây bị bỏ qua để tránh "//" trong URL; mediaUrl tự bỏ đoạn rỗng nên dùng được.
  let coverSrc = null;
  if (album.coverImage) {
    coverSrc = mediaUrl(album.coverImage);
  } else if (album.coverThumbnail) {
    if (album.coverItemPath) {
      coverSrc = mediaUrl(parentDir(album.coverItemPath), album.coverThumbnail);
    }
  } else if (album.coverItemPath) {
    coverSrc = mediaUrl(album.coverItemPath);
  }

  // Album dùng chung ItemCard: ảnh bìa vuông, mép xếp chồng, "N mục", xoá trong bảng ⋯ (xác nhận bằng confirmModal)
  return (
    <ItemCard
      type="media"
      title={album.name}
      thumbnail={coverSrc}
      isFolder
      thumbKind="folder"
      subtitle={`${Number(album.itemCount || 0).toLocaleString('vi-VN')} mục`}
      onOpen={onClick}
      actions={[
        onDelete && {
          key: 'delete',
          label: 'Xoá album',
          icon: Trash2,
          danger: true,
          onClick: onDelete,
        },
      ]}
    />
  );
}

function CreateAlbumModal({ onSubmit, onClose }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim(), description.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Create New Album</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Album Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Summer Vacation 2024"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={3}
              placeholder="Photos from our trip..."
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MediaAlbums;
