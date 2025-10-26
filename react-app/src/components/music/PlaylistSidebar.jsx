// 📁 src/components/music/PlaylistSidebar.jsx
// 🎵 Responsive Playlist Sidebar with toggle for mobile

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiList, FiX } from 'react-icons/fi';
import { DEFAULT_IMAGES } from '@/constants';

const PlaylistSidebar = ({ 
  library, 
  activePlaylistId, 
  setActivePlaylistId, 
  sourceKey 
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const sidebarContent = (
    <>
      <div className="px-4 py-3 text-xs uppercase tracking-wider text-white/60 border-b border-white/10 flex items-center justify-between">
        <span>Playlist</span>
        <span className="text-white/40 text-[11px]">Playlists</span>
      </div>
      <div className="p-3">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 w-4 h-4" />
          <input 
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
        {!library.loading && library.items.length > 0 && (
          <div className="px-2 space-y-1">
            {library.items.map((pl) => (
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
        className="md:hidden fixed top-20 left-4 z-50 p-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg transition-all duration-200"
        aria-label="Toggle Playlist"
      >
        {isOpen ? <FiX className="w-5 h-5" /> : <FiList className="w-5 h-5" />}
      </button>

      {/* Desktop sidebar - always visible */}
      <div className="hidden md:flex rounded-2xl border border-white/10 bg-white/[0.04] flex-col" style={{ height: 'calc(100vh - 200px)' }}>
        {sidebarContent}
      </div>

      {/* Mobile sidebar - overlay with backdrop */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Sidebar panel */}
          <div className="md:hidden fixed left-0 top-0 bottom-0 w-[280px] z-50 rounded-r-2xl border-r border-white/10 bg-gradient-to-b from-[#1f1f1f] via-[#121212] to-[#000] shadow-2xl flex flex-col animate-slide-in">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
};

export default PlaylistSidebar;
