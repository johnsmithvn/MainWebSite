// 📁 src/components/music/PlayerFooter.jsx
// 🎵 Shared Footer Player Component for both MusicPlayer v1 and v2

import React, { useRef } from 'react';
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

const PlayerFooter = ({ 
  audioRef, 
  currentTime, 
  duration, 
  formatTime, 
  handleSeek, 
  handleVolumeBar,
  prevOrderBeforeShuffleRef,
  theme = 'v1' // 'v1' for Spotify-style, 'v2' for Zing-style
}) => {
  const {
    currentTrack,
    currentPlaylist,
    isPlaying,
    volume,
    shuffle,
    repeat,
    playTrack,
    pauseTrack,
    resumeTrack,
    nextTrack,
    prevTrack,
    setVolume,
  } = useMusicStore();

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      if (isPlaying) {
        audio.pause();
        pauseTrack();
      } else {
        const p = audio.play();
        if (p) await p;
        resumeTrack();
      }
    } catch (err) {
      console.error('Failed to play/pause audio:', err);
    }
  };

  const toggleShuffle = () => {
    const store = useMusicStore.getState();
    const currentlyShuffled = store.shuffle;
    if (!currentlyShuffled) {
      // Save current order to restore later, then shuffle
      const current = [...(store.currentPlaylist || [])];
      prevOrderBeforeShuffleRef.current = current;
      if (current.length <= 1) {
        useMusicStore.setState({ shuffle: true });
        return;
      }
      const shuffled = [...current];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const currTrack = store.currentTrack;
      const newIndex = currTrack ? Math.max(0, shuffled.findIndex((t) => t.path === currTrack.path)) : 0;
      useMusicStore.setState({ shuffle: true, currentPlaylist: shuffled, currentIndex: newIndex });
    } else {
      // Restore previous order
      const restore = prevOrderBeforeShuffleRef.current;
      if (Array.isArray(restore) && restore.length > 0) {
        const currTrack = store.currentTrack;
        const newIndex = currTrack ? Math.max(0, restore.findIndex((t) => t.path === currTrack.path)) : 0;
        useMusicStore.setState({ shuffle: false, currentPlaylist: restore, currentIndex: newIndex });
      } else {
        useMusicStore.setState({ shuffle: false });
      }
    }
  };

  const toggleRepeat = () => {
    const current = useMusicStore.getState().repeat;
    const next = current === 'none' ? 'all' : current === 'all' ? 'one' : 'none';
    useMusicStore.setState({ repeat: next });
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (volume === 0) {
      setVolume(0.5);
      audio.volume = 0.5;
    } else {
      setVolume(0);
      audio.volume = 0;
    }
  };

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

  return (
    <div className={`fixed bottom-0 left-0 right-0 h-[100px] ${config.bgColor} z-50 backdrop-blur border-t ${config.borderColor}`}>
      {/* Use a 3-column grid so center controls stay centered and sides truncate */}
      <div className="h-full px-4 md:px-6 pt-1 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(320px,720px)_minmax(0,1fr)] items-center gap-4">
        {/* Now playing (Left) */}
        <div className="hidden md:flex items-center gap-3 min-w-0 overflow-hidden justify-self-start">
          {currentTrack ? (
            <>
              <img
                src={buildThumbnailUrl(currentTrack, 'music') || DEFAULT_IMAGES.music}
                onError={(e) => (e.currentTarget.src = DEFAULT_IMAGES.music)}
                alt={currentTrack.name}
                className="w-12 h-12 rounded object-cover"
              />
              <div className="min-w-0 max-w-full w-[260px] sm:w-[320px] md:w-[360px] lg:w-[420px]">
                <div className="text-sm truncate whitespace-nowrap text-white" title={currentTrack.name}>
                  {currentTrack.name}
                </div>
                <div className="text-xs text-white/60 truncate whitespace-nowrap" title={currentTrack.artist || 'Unknown Artist'}>
                  {currentTrack.artist || 'Unknown Artist'}
                </div>
              </div>
            </>
          ) : (
            <div className="text-white/60 text-sm">No track selected</div>
          )}
        </div>

        {/* Controls + progress (Center) */}
        <div className="col-span-1 md:col-auto flex flex-col items-center justify-center w-full justify-self-center">
          <div className="flex items-center gap-5">
            <button 
              onClick={toggleShuffle} 
              className={`transition-colors ${shuffle 
                ? (theme === 'v1' ? 'text-green-400 hover:text-green-300' : 'text-[#b58dff] hover:text-[#9d78eb]') 
                : 'text-white/70 hover:text-white'
              }`}
            >
              <FiShuffle className={`w-4 h-4 ${shuffle ? 'drop-shadow-sm' : ''}`} />
            </button>
            <button onClick={prevTrack} className="text-white hover:text-white/90">
              <FiSkipBack className="w-5 h-5" />
            </button>
            <button 
              onClick={togglePlayPause} 
              className={`w-10 h-10 rounded-full ${config.playButtonBg} ${config.playButtonText} flex items-center justify-center hover:scale-105 transition-transform`}
            >
              {isPlaying ? <FiPause className="w-5 h-5" /> : <FiPlay className="w-5 h-5 ml-0.5" />}
            </button>
            <button onClick={nextTrack} className="text-white hover:text-white/90">
              <FiSkipForward className="w-5 h-5" />
            </button>
            <button 
              onClick={toggleRepeat} 
              className={`transition-colors relative ${repeat !== 'none' 
                ? (theme === 'v1' ? 'text-green-400 hover:text-green-300' : 'text-[#b58dff] hover:text-[#9d78eb]') 
                : 'text-white/70 hover:text-white'
              }`}
            >
              <FiRepeat className={`w-4 h-4 ${repeat !== 'none' ? 'drop-shadow-sm' : ''}`} />
              {repeat === 'one' && (
                <span className={`absolute -top-1 -right-1 text-[10px] font-bold ${
                  theme === 'v1' ? 'text-green-400' : 'text-[#b58dff]'
                }`}>
                  1
                </span>
              )}
            </button>
          </div>
          <div className="w-full max-w-2xl flex items-center gap-3 mt-2">
            <span className="text-xs text-white/60 min-w-[34px] text-right">{formatTime(currentTime)}</span>
            <div className="h-1 w-full bg-white/20 rounded-full cursor-pointer" onClick={handleSeek}>
              <div className={`h-full ${config.progressColor} rounded-full relative`} style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}>
                <div className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 ${config.progressColor} rounded-full`} />
              </div>
            </div>
            <span className="text-xs text-white/60 min-w-[34px]">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume (Right) */}
        <div className="hidden md:flex items-center gap-3 min-w-0 justify-end justify-self-end">
          <button onClick={toggleMute} className="text-white/80 hover:text-white">
            {volume === 0 ? <FiVolumeX className="w-5 h-5" /> : <FiVolume2 className="w-5 h-5" />}
          </button>
          <div className="w-28 h-1 bg-white/20 rounded-full cursor-pointer" onClick={handleVolumeBar}>
            <div className={`h-full ${config.progressColor} rounded-full`} style={{ width: `${Math.round(volume * 100)}%` }} />
          </div>
          <span className="text-xs text-white/60 w-8 text-right">{Math.round(volume * 100)}</span>
        </div>
      </div>
    </div>
  );
};

export default PlayerFooter;
