// 📁 react-app/src/components/media/MediaAlbums.jsx
// 📚 Media Albums Component

import React, { useState } from 'react';
import { Plus, Folder, Trash2 } from 'lucide-react';
import { useModal } from '../common/Modal.jsx';

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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
  let coverSrc = null;
  if (album.coverImage) {
    coverSrc = `/media/${album.coverImage}`;
  } else if (album.coverThumbnail) {
    const dir = (album.coverItemPath || '').split('/').slice(0, -1).join('/');
    if (dir && album.coverThumbnail) {
      coverSrc = `/media/${dir}/${album.coverThumbnail}`;
    }
  } else if (album.coverItemPath) {
    coverSrc = `/media/${album.coverItemPath}`;
  }

  return (
    <button
      onClick={onClick}
      className="group relative aspect-square rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800 hover:scale-105 transition-transform"
    >
      {coverSrc ? (
        <img src={coverSrc} alt={album.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Folder size={64} className="text-gray-400 dark:text-gray-600" />
        </div>
      )}

      {/* Delete button */}
      {onDelete && (
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Xác nhận xóa sẽ được xử lý ở handler onDelete (đã dùng confirmModal)
              onDelete();
            }}
            className="w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center"
            title="Delete album"
          >
            <Trash2 size={18} className="text-red-600" />
          </button>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
        <div className="text-white font-medium">{album.name}</div>
        <div className="text-white/80 text-sm">{album.itemCount} items</div>
      </div>
    </button>
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
