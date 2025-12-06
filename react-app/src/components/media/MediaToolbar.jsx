// 📁 react-app/src/components/media/MediaToolbar.jsx
// 🛠️ Media Toolbar Component

import React, { useState } from 'react';
import { Grid, Calendar, Folder, Heart, X, FolderPlus } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

// NOTE: selectedCount trước đây được truyền trực tiếp (number). Điều đó làm AlbumPicker gửi số lượng thay vì danh sách ID.
// Fix: truyền selectedItems (Set) để AlbumPicker có thể gửi đúng các itemIds.
function MediaToolbar({ dbkey, view, selectedItems, onClearSelection, onAddToAlbum, albums }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showAlbumPicker, setShowAlbumPicker] = useState(false);

  const selectedCount = selectedItems?.size || 0;

  const setView = (newView) => {
    setSearchParams({ key: dbkey, view: newView });
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left: View Tabs */}
          <div className="flex items-center gap-4">
            <nav className="flex gap-2">
              <ViewTab
                icon={<Grid size={18} />}
                label="Photos"
                active={view === 'photos'}
                onClick={() => setView('photos')}
              />
              <ViewTab
                icon={<Calendar size={18} />}
                label="Timeline"
                active={view === 'timeline'}
                onClick={() => setView('timeline')}
              />
              <ViewTab
                icon={<Folder size={18} />}
                label="Albums"
                active={view === 'albums'}
                onClick={() => setView('albums')}
              />
              <ViewTab
                icon={<Heart size={18} />}
                label="Favorites"
                active={view === 'favorites'}
                onClick={() => setView('favorites')}
              />
            </nav>
          </div>

          {/* Right: Actions (only show when selection > 0) */}
          <div className="flex items-center gap-3">
            {selectedCount > 0 && (
              <>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedCount} selected
                </span>
                <button
                  onClick={() => setShowAlbumPicker(true)}
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                >
                  <FolderPlus size={18} />
                  Add to Album
                </button>
                <button
                  onClick={onClearSelection}
                  className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  <X size={18} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Album Picker Modal */}
      {showAlbumPicker && (
        <AlbumPickerModal
          albums={albums}
          onSelect={(albumId) => {
            onAddToAlbum(albumId, selectedItems);
            setShowAlbumPicker(false);
          }}
          onClose={() => setShowAlbumPicker(false)}
        />
      )}
    </div>
  );
}

function ViewTab({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
        active
          ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function AlbumPickerModal({ albums, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Select Album</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {albums.map((album) => (
            <button
              key={album.id}
              onClick={() => onSelect(album.id)}
              className="w-full text-left px-4 py-3 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="font-medium text-gray-900 dark:text-white">{album.name}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{album.itemCount} items</div>
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default MediaToolbar;
