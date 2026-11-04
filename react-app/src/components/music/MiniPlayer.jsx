// 📁 src/components/music/MiniPlayer.jsx
// 🎶 Mini player bar shown at the bottom of every page while music plays (outside the full-screen players)

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiPlay, FiPause, FiSkipBack, FiSkipForward, FiMaximize2, FiX } from 'react-icons/fi';
import { useMusicStore } from '@/store';
import { buildThumbnailUrl } from '@/utils/thumbnailUtils';
import { DEFAULT_IMAGES } from '@/constants';
import { useMusicPlayer, useMusicProgress } from './musicPlayerContext';

// Full-screen routes have their own controls (or own sound): no mini player there
const HIDDEN_ROUTE_PREFIXES = ['/music/player', '/movie/player', '/manga/reader'];

// Height of the bar (without safe-area inset); pages add this as bottom padding
export const MINI_PLAYER_HEIGHT = 64;

export const useMiniPlayerVisible = () => {
  const hasTrack = useMusicStore((s) => !!s.currentTrack);
  const { pathname } = useLocation();
  return hasTrack && !HIDDEN_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
};

const MiniPlayer = () => {
  const navigate = useNavigate();
  const visible = useMiniPlayerVisible();
  const currentTrack = useMusicStore((s) => s.currentTrack);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const queueKey = useMusicStore((s) => s.queueKey);
  const { togglePlayPause, playNext, playPrevious, openFullPlayer, stopPlayback, trackMetadata } = useMusicPlayer();
  const { currentTime, duration } = useMusicProgress();

  if (!visible || !currentTrack) return null;

  const name = (currentTrack.name || currentTrack.path?.split('/').pop() || '').replace(/\.[^/.]+$/, '');
  const artist = trackMetadata?.artist || currentTrack.artist || '';
  const pct = duration ? Math.min(100, (currentTime / duration) * 100) : 0;

  // No kind/file/playlist in state: the player page shows the current queue without reloading it
  const openPlayerPage = () => navigate('/music/player', { state: { key: queueKey } });

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 bg-[#181818]/95 backdrop-blur text-white border-t border-white/10 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(0,0,0,0.35)]">
      {/* Thin progress line */}
      <div className="h-0.5 bg-white/10">
        <div className="h-full bg-green-400 transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>

      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 h-16 max-w-screen-2xl mx-auto">
        <button
          onClick={openPlayerPage}
          className="flex items-center gap-3 min-w-0 flex-1 text-left rounded-lg -ml-1 p-1 hover:bg-white/5 transition-colors"
          title="Mở trình phát nhạc"
        >
          <img
            src={buildThumbnailUrl(currentTrack, 'music') || DEFAULT_IMAGES.music}
            onError={(e) => (e.currentTarget.src = DEFAULT_IMAGES.music)}
            alt=""
            className="w-11 h-11 rounded object-cover flex-none"
          />
          <div className="min-w-0">
            <div className="text-sm font-medium truncate" title={name}>{name}</div>
            {artist && <div className="text-xs text-white/60 truncate">{artist}</div>}
          </div>
        </button>

        <button onClick={playPrevious} className="hidden sm:flex p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10" aria-label="Bài trước" title="Bài trước">
          <FiSkipBack className="w-5 h-5" />
        </button>
        <button
          onClick={togglePlayPause}
          className="w-10 h-10 flex-none rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
          aria-label={isPlaying ? 'Tạm dừng' : 'Phát'}
          title={isPlaying ? 'Tạm dừng' : 'Phát'}
        >
          {isPlaying ? <FiPause className="w-5 h-5" /> : <FiPlay className="w-5 h-5 ml-0.5" />}
        </button>
        <button onClick={playNext} className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10" aria-label="Bài tiếp" title="Bài tiếp">
          <FiSkipForward className="w-5 h-5" />
        </button>
        <button onClick={openFullPlayer} className="hidden sm:flex p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10" aria-label="Mở toàn màn hình" title="Mở toàn màn hình">
          <FiMaximize2 className="w-4 h-4" />
        </button>
        <button onClick={stopPlayback} className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10" aria-label="Tắt nhạc" title="Tắt nhạc">
          <FiX className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default MiniPlayer;
