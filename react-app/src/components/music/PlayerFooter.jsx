// 📁 src/components/music/PlayerFooter.jsx
// 🎵 Shared Footer Player Component for both MusicPlayer v1 and v2
// Playback state/controls come from the global player (MusicPlayerProvider)

import React, { useState } from 'react';
import {
  FiPlay,
  FiPause,
  FiSkipBack,
  FiSkipForward,
  FiVolume2,
  FiVolumeX,
  FiShuffle,
  FiRepeat,
} from 'react-icons/fi';
import { useMusicStore } from '@/store';
import { buildThumbnailUrl } from '@/utils/thumbnailUtils';
import { DEFAULT_IMAGES } from '@/constants';
import SeekBar from './SeekBar';
import { useMusicPlayer, useMusicProgress, formatTime } from './musicPlayerContext';

const PlayerFooter = ({
  theme = 'v1' // 'v1' for Spotify-style, 'v2' for Zing-style
}) => {
  const currentTrack = useMusicStore((s) => s.currentTrack);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const volume = useMusicStore((s) => s.volume);
  const shuffle = useMusicStore((s) => s.shuffle);
  const repeat = useMusicStore((s) => s.repeat);
  const {
    togglePlayPause, seek, setVolumeLevel, toggleMute, toggleShuffle, toggleRepeat,
    playNext, playPrevious, openFullPlayer, trackMetadata,
  } = useMusicPlayer();
  const { currentTime, duration, buffered } = useMusicProgress();
  const [scrubTime, setScrubTime] = useState(null); // time shown while dragging the seek bar

  // Theme-specific styles
  const themeConfig = {
    v1: {
      bgColor: 'bg-[#121212]',
      accentColor: 'text-green-400',
      playButtonBg: 'bg-white',
      playButtonText: 'text-black',
      progressColor: 'bg-white',
      borderColor: 'border-white/10',
    },
    v2: {
      bgColor: 'bg-[#1a0f24]/95',
      accentColor: 'text-[#b58dff]',
      playButtonBg: 'bg-[#b58dff]',
      playButtonText: 'text-black',
      progressColor: 'bg-[#b58dff]',
      borderColor: 'border-white/10',
    }
  };

  const config = themeConfig[theme] || themeConfig.v1;
  const accentToggle = theme === 'v1' ? 'text-green-400 hover:text-green-300' : 'text-[#b58dff] hover:text-[#9d78eb]';
  const artist = trackMetadata?.artist || currentTrack?.artist || 'Unknown Artist';
  const cover = currentTrack ? (buildThumbnailUrl(currentTrack, 'music') || DEFAULT_IMAGES.music) : DEFAULT_IMAGES.music;

  const playButton = (sizeClass, iconClass) => (
    <button
      onClick={togglePlayPause}
      className={`${sizeClass} flex-none rounded-full ${config.playButtonBg} ${config.playButtonText} flex items-center justify-center hover:scale-105 transition-transform`}
      aria-label={isPlaying ? 'Tạm dừng' : 'Phát'}
      title={isPlaying ? 'Tạm dừng' : 'Phát'}
    >
      {isPlaying ? <FiPause className={iconClass} /> : <FiPlay className={`${iconClass} ml-0.5`} />}
    </button>
  );

  return (
    <div className={`fixed bottom-0 left-0 right-0 ${config.bgColor} z-50 backdrop-blur border-t ${config.borderColor} pb-[env(safe-area-inset-bottom)]`}>
      {/* Use a 3-column grid on desktop so center controls stay centered and sides truncate */}
      <div className="h-[100px] px-3 md:px-6 pt-1 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(320px,720px)_minmax(0,1fr)] items-center gap-1 md:gap-4">
        {/* Desktop: now playing (left) - click to open full player */}
        <button
          onClick={openFullPlayer}
          disabled={!currentTrack}
          className="hidden md:flex items-center gap-3 min-w-0 overflow-hidden justify-self-start text-left hover:bg-white/5 rounded-lg p-2 -ml-2 transition-colors"
          title="Mở trình phát toàn màn hình"
        >
          {currentTrack ? (
            <>
              <img
                src={cover}
                onError={(e) => (e.currentTarget.src = DEFAULT_IMAGES.music)}
                alt={currentTrack.name}
                className="w-12 h-12 rounded object-cover"
              />
              <div className="min-w-0 max-w-full w-[260px] sm:w-[320px] md:w-[360px] lg:w-[420px]">
                <div className="text-sm truncate whitespace-nowrap text-white" title={currentTrack.name}>
                  {currentTrack.name}
                </div>
                <div className="text-xs text-white/60 truncate whitespace-nowrap" title={artist}>
                  {artist}
                </div>
              </div>
            </>
          ) : (
            <div className="text-white/60 text-sm">No track selected</div>
          )}
        </button>

        {/* Mobile: song info (tap = full player) + main controls; shuffle/repeat live in the full player */}
        <div className="flex md:hidden items-center gap-2 min-w-0">
          <button
            onClick={openFullPlayer}
            disabled={!currentTrack}
            className="flex items-center gap-3 min-w-0 flex-1 text-left"
            aria-label="Mở trình phát toàn màn hình"
          >
            <img
              src={cover}
              onError={(e) => (e.currentTarget.src = DEFAULT_IMAGES.music)}
              alt=""
              className="w-10 h-10 rounded object-cover flex-none"
            />
            <div className="min-w-0">
              <div className="text-sm text-white truncate">{currentTrack?.name || 'Chưa chọn bài'}</div>
              <div className="text-xs text-white/60 truncate">{currentTrack ? artist : ''}</div>
            </div>
          </button>
          <button onClick={playPrevious} className="p-2 text-white" aria-label="Bài trước">
            <FiSkipBack className="w-5 h-5" />
          </button>
          {playButton('w-10 h-10', 'w-5 h-5')}
          <button onClick={playNext} className="p-2 text-white" aria-label="Bài tiếp">
            <FiSkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Controls + progress (Center) */}
        <div className="col-span-1 md:col-auto flex flex-col items-center justify-center w-full justify-self-center">
          <div className="hidden md:flex items-center gap-5">
            <button
              onClick={toggleShuffle}
              className={`transition-colors ${shuffle ? accentToggle : 'text-white/70 hover:text-white'}`}
              aria-label={shuffle ? 'Tắt phát ngẫu nhiên' : 'Phát ngẫu nhiên'}
              aria-pressed={shuffle}
              title="Phát ngẫu nhiên"
            >
              <FiShuffle className={`w-4 h-4 ${shuffle ? 'drop-shadow-sm' : ''}`} />
            </button>
            <button onClick={playPrevious} className="text-white hover:text-white/90" aria-label="Bài trước" title="Bài trước">
              <FiSkipBack className="w-5 h-5" />
            </button>
            {playButton('w-10 h-10', 'w-5 h-5')}
            <button onClick={playNext} className="text-white hover:text-white/90" aria-label="Bài tiếp" title="Bài tiếp">
              <FiSkipForward className="w-5 h-5" />
            </button>
            <button
              onClick={toggleRepeat}
              className={`transition-colors relative ${repeat !== 'none' ? accentToggle : 'text-white/70 hover:text-white'}`}
              aria-label={repeat === 'one' ? 'Lặp lại 1 bài' : repeat === 'all' ? 'Lặp lại tất cả' : 'Không lặp lại'}
              title={repeat === 'one' ? 'Lặp lại 1 bài' : repeat === 'all' ? 'Lặp lại tất cả' : 'Không lặp lại'}
            >
              <FiRepeat className={`w-4 h-4 ${repeat !== 'none' ? 'drop-shadow-sm' : ''}`} />
              {repeat === 'one' && (
                <span className={`absolute -top-1 -right-1 text-[10px] font-bold ${config.accentColor}`}>
                  1
                </span>
              )}
            </button>
          </div>
          <div className="w-full max-w-2xl flex items-center gap-3 md:mt-1">
            <span className="text-xs text-white/60 min-w-[34px] text-right tabular-nums">{formatTime(scrubTime ?? currentTime)}</span>
            <SeekBar
              value={currentTime}
              max={duration}
              buffered={buffered}
              step={5}
              onChange={setScrubTime}
              onCommit={(t) => { setScrubTime(null); seek(t); }}
              ariaLabel="Vị trí bài hát"
              formatValue={formatTime}
              fillClass={config.progressColor}
            />
            <span className="text-xs text-white/60 min-w-[34px] tabular-nums">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume (Right) */}
        <div className="hidden md:flex items-center gap-3 min-w-0 justify-end justify-self-end">
          <button onClick={toggleMute} className="text-white/80 hover:text-white" aria-label={volume === 0 ? 'Bật tiếng' : 'Tắt tiếng'} title={volume === 0 ? 'Bật tiếng' : 'Tắt tiếng'}>
            {volume === 0 ? <FiVolumeX className="w-5 h-5" /> : <FiVolume2 className="w-5 h-5" />}
          </button>
          <div className="w-28">
            <SeekBar
              value={volume}
              max={1}
              step={0.05}
              onChange={setVolumeLevel}
              onCommit={setVolumeLevel}
              ariaLabel="Âm lượng"
              formatValue={(v) => `${Math.round(v * 100)}%`}
              fillClass={config.progressColor}
            />
          </div>
          <span className="text-xs text-white/60 w-8 text-right tabular-nums">{Math.round(volume * 100)}</span>
        </div>
      </div>
    </div>
  );
};

export default PlayerFooter;
