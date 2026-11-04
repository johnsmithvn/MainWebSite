// 📁 src/components/music/PlaylistSidebar.jsx
// 🎵 Responsive Playlist Sidebar with toggle for mobile

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiList, FiX } from 'react-icons/fi';
import { DEFAULT_IMAGES } from '@/constants';

// Accent-insensitive match (same idea as MusicHome search)
const normalize = (str = '') => str
  .toLowerCase()
  .normalize('NFD')
  .replace(/\p{Diacritic}/gu, '');

const PlaylistSidebar = ({
  library,
  activePlaylistId,
  setActivePlaylistId,
  sourceKey
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const needle = normalize(query.trim());
  const visiblePlaylists = needle
    ? library.items.filter((pl) => normalize(pl.name || '').includes(needle))
    : library.items;

  const sidebarContent = (
    <>
      <div className="px-4 py-3 text-xs uppercase tracking-wider text-white/60 border-b border-white/10 flex items-center justify-between">
        <span>Playlists</span>
        {/* Close button - mobile drawer only */}
        <button
          onClick={() => setIsOpen(false)}
          className="md:hidden p-1.5 -mr-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10"
          aria-label="Đóng playlist"
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>
      <div className="p-3">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 w-4 h-4" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm playlist"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/10 text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {library.loading && <div className="px-4 py-2 text-white/60 text-sm">Đang tải…</div>}
        {!library.loading && library.items.length === 0 && (
          <div className="px-4 py-6 text-white/60 text-sm">Chưa có playlist</div>
        )}
        {!library.loading && library.items.length > 0 && visiblePlaylists.length === 0 && (
          <div className="px-4 py-6 text-white/60 text-sm">Không tìm thấy playlist</div>
        )}
        {!library.loading && visiblePlaylists.length > 0 && (
          <div className="px-2 space-y-1">
            {visiblePlaylists.map((pl) => (
              <button
                key={pl.id}
                onClick={() => {
                  setActivePlaylistId(pl.id);
                  navigate('/music/player', { state: { kind: 'playlist', playlist: String(pl.id), key: sourceKey } });
                  setIsOpen(false); // Close sidebar on mobile after selection
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-left ${activePlaylistId === pl.id ? 'bg-white/10' : ''}`}
                title={pl.name}
              >
                <img 
                  src={pl.thumbnail || DEFAULT_IMAGES.music} 
                  onError={(e) => (e.currentTarget.src = DEFAULT_IMAGES.music)} 
                  alt={pl.name} 
                  className="w-9 h-9 rounded object-cover" 
                />
                <div className="min-w-0">
                  <div className="text-sm text-white truncate">{pl.name}</div>
                  <div className="text-[11px] text-white/60 truncate">
                    {new Date(pl.updatedAt || Date.now()).toLocaleDateString()}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Toggle button for mobile - floating */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-20 left-4 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-gray-400 hover:text-gray-300 shadow-lg transition-all duration-200 backdrop-blur-sm border border-white/10"
        aria-label="Mở playlist"
      >
        {/* List icon: the header already has a 🎵 button that goes to the music library */}
        <FiList className="w-5 h-5" />
      </button>

      {/* Desktop sidebar - always visible */}
      <div className="hidden md:flex rounded-2xl border border-white/10 bg-white/[0.04] flex-col" style={{ height: 'calc(100vh - 200px)' }}>
        {sidebarContent}
      </div>

      {/* Mobile sidebar - overlay with backdrop */}
      {isOpen && (
        <>
          {/* Backdrop - above the sticky header (z-40) and the player footer (z-50) */}
          <div
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[55]"
            onClick={() => setIsOpen(false)}
          />

          {/* Sidebar panel */}
          <div className="md:hidden fixed left-0 top-0 bottom-0 w-[280px] z-[60] rounded-r-2xl border-r border-white/10 bg-gradient-to-b from-[#1f1f1f] via-[#121212] to-[#000] shadow-2xl flex flex-col animate-slide-in">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
};

export default PlaylistSidebar;
