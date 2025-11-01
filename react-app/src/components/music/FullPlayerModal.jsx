// 📁 src/components/music/FullPlayerModal.jsx
// 🎵 Full Screen Player Modal (Spotify-style) - Opens from player footer

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX,
  FiChevronDown,
  FiHeart,
  FiMoreHorizontal,
  FiPlay,
  FiPause,
  FiSkipBack,
  FiSkipForward,
  FiShuffle,
  FiRepeat,
  FiVolume2,
  FiVolumeX,
  FiMaximize2,
  FiMinimize2,
  FiPlus,
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useMusicStore, useUIStore } from '@/store';
import { buildThumbnailUrl } from '@/utils/thumbnailUtils';
import { DEFAULT_IMAGES } from '@/constants';
import LyricsModal from './LyricsModal';

const FullPlayerModal = ({ 
  isOpen, 
  onClose, 
  audioRef,
  currentTime,
  duration,
  formatTime,
  handleSeek,
  handleVolumeBar,
  prevOrderBeforeShuffleRef,
  trackMetadata,
  theme = 'v1'
}) => {
  const {
    currentTrack,
    currentPlaylist,
    isPlaying,
    volume,
    shuffle,
    repeat,
    pauseTrack,
    resumeTrack,
    nextTrack,
    prevTrack,
    setVolume,
  } = useMusicStore();

  const { showToast } = useUIStore();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(0); // 0: none, -1: left, 1: right

  // Helper function to normalize album name
  const normalizeAlbum = (album) => {
    if (!album) return 'Unknown Album';
    const normalized = album.toLowerCase();
    if (normalized.includes('mp3.zing') || normalized.includes('nhaccuatui')) {
      return 'Unknown Album';
    }
    return album;
  };

  // Helper function to check if value should be hidden
  const shouldHideField = (value) => {
    if (!value) return true;
    const normalized = value.toLowerCase();
    return normalized === 'unknown album' || 
           normalized === 'unknown artist' || 
           normalized === 'unknown' ||
           normalized.includes('mp3.zing') || 
           normalized.includes('nhaccuatui');
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

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

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleAlbumArtClick = () => {
    console.log('🎵 Album art clicked, opening lyrics modal');
    console.log('Current track:', currentTrack);
    setIsLyricsOpen(true);
  };

  const handleSwipe = (direction) => {
    console.log('🎵 Swipe detected:', direction);
    setSwipeDirection(direction);
    
    // Trigger next/prev track
    if (direction === -1) {
      // Swipe left = next track
      nextTrack();
    } else if (direction === 1) {
      // Swipe right = previous track
      prevTrack();
    }
    
    // Reset direction after animation
    setTimeout(() => {
      setSwipeDirection(0);
    }, 300);
  };

  const handleCopyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Đã copy!', {
        duration: 1500,
        icon: '📋',
      });
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Không thể copy vào clipboard');
    }
  };

  const handleAddToPlaylist = () => {
    if (!currentTrack) {
      showToast('Chưa có bài hát nào đang phát', 'warning');
      return;
    }
    // Dispatch event to open playlist modal
    window.dispatchEvent(new CustomEvent('openPlaylistModal', { 
      detail: { item: currentTrack } 
    }));
  };

  // Theme configs
  const themeConfig = {
    v1: {
      bgGradient: 'from-[#1f1f1f] via-[#121212] to-[#000]',
      accentColor: 'text-green-400',
      accentBg: 'bg-green-400',
      playButtonBg: 'bg-white',
      playButtonText: 'text-black',
      progressColor: 'bg-white',
      trackColor: 'bg-white/20',
    },
    v2: {
      bgGradient: 'from-[#2d1b4e] via-[#1a0f24] to-[#0f0518]',
      accentColor: 'text-[#b58dff]',
      accentBg: 'bg-[#b58dff]',
      playButtonBg: 'bg-[#b58dff]',
      playButtonText: 'text-black',
      progressColor: 'bg-[#b58dff]',
      trackColor: 'bg-white/20',
    }
  };

  const config = themeConfig[theme] || themeConfig.v1;

  if (!currentTrack) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`fixed inset-0 z-[100] bg-gradient-to-b ${config.bgGradient} flex flex-col`}
          >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Close full player"
            >
              <FiChevronDown className="w-7 h-7 text-white" />
            </button>
            <div className="text-center flex-1">
              <div className="text-xs text-white/60 uppercase tracking-wider">Album</div>
              <div className="text-sm text-white font-medium">
                {(() => {
                  const albumValue = normalizeAlbum(trackMetadata?.album || currentTrack.album);
                  return shouldHideField(albumValue) ? 'Music Album' : albumValue;
                })()}
              </div>
            </div>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Toggle fullscreen"
            >
              {isFullscreen ? (
                <FiMinimize2 className="w-5 h-5 text-white" />
              ) : (
                <FiMaximize2 className="w-5 h-5 text-white" />
              )}
            </button>
          </div>

          {/* Main Content */}
          <div className={`flex-1 flex flex-col ${isFullscreen ? 'px-8 py-6' : 'px-6 py-8'} overflow-y-auto`}>
            {/* Album Art with Swipe */}
            <div className="flex-1 flex items-center justify-center mb-8 relative overflow-hidden">
              <motion.div
                key={currentTrack?.path} // Re-mount on track change for animation
                initial={{ scale: 0.8, opacity: 0, x: swipeDirection === 0 ? 0 : (swipeDirection === -1 ? 100 : -100) }}
                animate={{ scale: 1, opacity: 1, x: 0 }}
                exit={{ scale: 0.8, opacity: 0, x: swipeDirection === -1 ? -100 : 100 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(event, info) => {
                  const swipeThreshold = 100;
                  if (Math.abs(info.offset.x) > swipeThreshold) {
                    // Swipe left (offset.x < 0) = next track
                    // Swipe right (offset.x > 0) = prev track
                    const direction = info.offset.x < 0 ? -1 : 1;
                    handleSwipe(direction);
                  }
                }}
                className={`relative ${isFullscreen ? 'w-full max-w-2xl' : 'w-full max-w-md'} aspect-square cursor-pointer group`}
                onClick={handleAlbumArtClick}
                whileTap={{ scale: 0.98 }}
              >
                <img
                  src={buildThumbnailUrl(currentTrack, 'music') || DEFAULT_IMAGES.music}
                  onError={(e) => (e.currentTarget.src = DEFAULT_IMAGES.music)}
                  alt={currentTrack.name}
                  className="w-full h-full object-cover rounded-lg shadow-2xl transition-transform group-hover:scale-[1.02] pointer-events-none select-none"
                  draggable={false}
                />
                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="text-white text-center">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm font-medium">Xem lời bài hát</p>
                    <p className="text-xs text-white/60 mt-1">Vuốt trái/phải để đổi bài</p>
                  </div>
                </div>
                {/* Animated equalizer overlay when playing */}
                {isPlaying && (
                  <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center pointer-events-none">
                    <div className="flex items-end gap-1 h-12">
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          className={config.accentBg}
                          style={{ width: '4px', borderRadius: '2px' }}
                          animate={{
                            height: ['20%', '100%', '30%', '80%', '40%'],
                          }}
                          transition={{
                            duration: 1 + i * 0.1,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
              
              {/* Swipe indicators */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: swipeDirection === 1 ? 1 : 0, x: swipeDirection === 1 ? 0 : -50 }}
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
              >
                <div className={`${config.accentBg} rounded-full p-3 shadow-lg`}>
                  <FiSkipBack className="w-6 h-6 text-black" />
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: swipeDirection === -1 ? 1 : 0, x: swipeDirection === -1 ? 0 : 50 }}
                className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
              >
                <div className={`${config.accentBg} rounded-full p-3 shadow-lg`}>
                  <FiSkipForward className="w-6 h-6 text-black" />
                </div>
              </motion.div>
            </div>

            {/* Track Info */}
            <div className="mb-6">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 mr-4">
                  {/* Song Name - Click to copy (no icon, just toast) */}
                  <button
                    onClick={() => handleCopyToClipboard(currentTrack.name, 'name')}
                    className="w-full text-left hover:bg-white/5 rounded-lg px-2 py-1 -mx-2 transition-colors mb-1"
                    title="Click để copy tên bài hát"
                  >
                    <h1 
                      className="text-xl md:text-2xl font-bold tracking-normal leading-tight text-white"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {currentTrack.name}
                    </h1>
                  </button>
                  
                  {/* Title - hiển thị từ metadata */}
                  {trackMetadata?.title && !shouldHideField(trackMetadata.title) && (
                    <button
                      onClick={() => handleCopyToClipboard(trackMetadata.title, 'title')}
                      className="w-full text-left hover:bg-white/5 rounded-lg px-2 py-1 -mx-2 transition-colors mb-1"
                      title="Click để copy title"
                    >
                      <div 
                        className="text-sm text-white/80"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        <span className="font-semibold">Title:</span> {trackMetadata.title}
                      </div>
                    </button>
                  )}
                  
                  {/* Artist - Click to copy (no icon, just toast) + Action buttons */}
                  {(() => {
                    const artistValue = trackMetadata?.artist || currentTrack.artist || 'Unknown Artist';
                    return !shouldHideField(artistValue) ? (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleCopyToClipboard(artistValue, 'artist')}
                          className="flex-1 text-left hover:bg-white/5 rounded-lg px-2 py-1 -mx-2 transition-colors"
                          title="Click để copy tên nghệ sĩ"
                        >
                          <p className="text-base md:text-lg text-white/70 line-clamp-2">
                            {artistValue}
                          </p>
                        </button>
                        
                        {/* Action buttons inline with artist */}
                        <button 
                          onClick={handleAddToPlaylist}
                          className="p-2 rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
                          title="Thêm vào playlist"
                        >
                          <FiHeart className="w-6 h-6 text-white/70 hover:text-white" />
                        </button>
                      </div>
                    ) : (
                      // Chỉ hiển thị action button nếu không có artist
                      <div className="flex justify-end">
                        <button 
                          onClick={handleAddToPlaylist}
                          className="p-2 rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
                          title="Thêm vào playlist"
                        >
                          <FiHeart className="w-6 h-6 text-white/70 hover:text-white" />
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div 
                className={`h-1.5 ${config.trackColor} rounded-full cursor-pointer mb-2`}
                onClick={handleSeek}
              >
                <div 
                  className={`h-full ${config.progressColor} rounded-full relative transition-all`}
                  style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                >
                  <div className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 ${config.progressColor} rounded-full shadow-lg opacity-0 hover:opacity-100 transition-opacity`} />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-8 mb-6">
              <button
                onClick={toggleShuffle}
                className={`transition-colors ${shuffle ? config.accentColor : 'text-white/60 hover:text-white'}`}
              >
                <FiShuffle className="w-5 h-5" />
              </button>
              <button onClick={prevTrack} className="text-white/80 hover:text-white transition-colors">
                <FiSkipBack className="w-8 h-8" />
              </button>
              <button
                onClick={togglePlayPause}
                className={`w-16 h-16 rounded-full ${config.playButtonBg} ${config.playButtonText} flex items-center justify-center hover:scale-105 transition-transform shadow-xl`}
              >
                {isPlaying ? (
                  <FiPause className="w-8 h-8" />
                ) : (
                  <FiPlay className="w-8 h-8 ml-1" />
                )}
              </button>
              <button onClick={nextTrack} className="text-white/80 hover:text-white transition-colors">
                <FiSkipForward className="w-8 h-8" />
              </button>
              <button
                onClick={toggleRepeat}
                className={`transition-colors relative ${repeat !== 'none' ? config.accentColor : 'text-white/60 hover:text-white'}`}
              >
                <FiRepeat className="w-5 h-5" />
                {repeat === 'one' && (
                  <span className={`absolute -top-1 -right-1 text-[10px] font-bold ${config.accentColor}`}>
                    1
                  </span>
                )}
              </button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center justify-center gap-4 max-w-md mx-auto w-full">
              <button onClick={toggleMute} className="text-white/70 hover:text-white transition-colors">
                {volume === 0 ? (
                  <FiVolumeX className="w-5 h-5" />
                ) : (
                  <FiVolume2 className="w-5 h-5" />
                )}
              </button>
              <div 
                className={`flex-1 h-1 ${config.trackColor} rounded-full cursor-pointer`}
                onClick={handleVolumeBar}
              >
                <div 
                  className={`h-full ${config.progressColor} rounded-full relative`}
                  style={{ width: `${Math.round(volume * 100)}%` }}
                >
                  <div className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 ${config.progressColor} rounded-full`} />
                </div>
              </div>
              <span className="text-xs text-white/60 w-10 text-right">{Math.round(volume * 100)}%</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Lyrics Modal */}
    <LyricsModal
      isOpen={isLyricsOpen}
      onClose={() => setIsLyricsOpen(false)}
      currentTrack={currentTrack}
    />
  </>
  );
};

export default FullPlayerModal;
