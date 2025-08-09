// 📁 src/pages/music/MusicPlayer.jsx
// 🎵 Spotify-style Music Player với design đẹp và hiện đại (single-file implementation)

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiPlay,
  FiPause,
  FiSkipBack,
  FiSkipForward,
  FiVolume2,
  FiVolumeX,
  FiShuffle,
  FiRepeat,
  FiHeart,
  FiMoreHorizontal,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiHome,
  FiClock
} from 'react-icons/fi';
import { useAuthStore, useMusicStore, useUIStore } from '@/store';
import { useRecentMusicManager } from '@/hooks/useMusicData';
import { apiService } from '@/utils/api';
import { buildThumbnailUrl } from '@/utils/thumbnailUtils';
import LoadingOverlay from '@/components/common/LoadingOverlay';

const MusicPlayer = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const path = searchParams.get('file');
  const playlistPath = searchParams.get('playlist');

  const {
    currentTrack,
    currentPlaylist,
    currentIndex,
    isPlaying,
    volume,
    shuffle,
    repeat,
    toggleFavorite,
    favorites,
    setCurrentTrack,
    playTrack,
    pauseTrack,
    resumeTrack,
    nextTrack,
    prevTrack,
    setVolume,
  } = useMusicStore();

  const { showToast } = useUIStore();
  const { sourceKey, setSourceKey } = useAuthStore();

  // Ensure sourceKey is set to M_MUSIC for music player
  useEffect(() => {
    if (!sourceKey || sourceKey === 'ROOT_FANTASY') {
      setSourceKey('M_MUSIC');
    }
  }, [sourceKey, setSourceKey]);

  const { addRecentMusic } = useRecentMusicManager();

  // Player states
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Audio ref
  const audioRef = useRef(null);
  // Removed viewedTracksRef to allow counting on every playback start
  const latestTrackRef = useRef(null);

  // Keep a ref of the latest track for event handlers
  useEffect(() => {
    latestTrackRef.current = currentTrack || null;
  }, [currentTrack]);

  // Increase view when playback starts (every time)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = async () => {
      const track = latestTrackRef.current;
      const trackPath = track?.path;
      if (!trackPath || !sourceKey) return;

      try {
        await fetch('/api/increase-view/music', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: sourceKey, path: trackPath })
        });
      } catch (err) {
        console.warn('Failed to increase music view count:', err);
      }
    };

    audio.addEventListener('play', handlePlay);
    return () => {
      audio.removeEventListener('play', handlePlay);
    };
  }, [sourceKey]);

  // ========= Helpers =========
  function buildAudioUrl(audioPath) {
    if (!audioPath || !sourceKey) return null;
    return `/api/music/audio?key=${sourceKey}&file=${encodeURIComponent(audioPath)}`;
  }

  const getTrackInfo = useCallback(() => {
    if (!path) return null;
    const fileName = path.split('/').pop();
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    return {
      name: nameWithoutExt,
      path,
      artist: 'Unknown Artist',
      album: 'Unknown Album',
      thumbnail: null,
    };
  }, [path]);

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const togglePlayPause = useCallback(async () => {
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
      setError('Failed to play/pause audio: ' + err.message);
      showToast('Không thể play/pause: ' + err.message, 'error');
    }
  }, [isPlaying, pauseTrack, resumeTrack, showToast]);

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    const newTime = percent * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeBar = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    setVolume(percent);
    audio.volume = percent;
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

  const toggleShuffle = () => {
    // Optional: wire to store shuffle logic
    showToast('Shuffle toggled', 'info');
  };

  const toggleRepeat = () => {
    // Optional: wire to store repeat logic
    showToast('Repeat toggled', 'info');
  };

  // ========= Data loading =========
  const loadFolderSongs = async (folderPathArg, selectedFileArg) => {
    try {
      if (!sourceKey) {
        showToast('Thiếu source key', 'error');
        return;
      }

      const folderPath = folderPathArg;
      const selectedPath = selectedFileArg;

      if (!folderPath && !selectedPath) {
        showToast('Thiếu thông tin file/folder', 'error');
        return;
      }

      // If folder not provided but we have a selected file, derive parent folder
      const folderToLoad = folderPath || (selectedPath ? selectedPath.split('/').slice(0, -1).join('/') : null);
      if (!folderToLoad) {
        showToast('Không thể xác định thư mục chứa bài hát', 'error');
        return;
      }

      const response = await apiService.music.getFolders({ key: sourceKey, path: folderToLoad });
      const audioFiles = (response.data?.folders || []).filter((i) => i.type === 'audio' || i.type === 'file');
      const playlist = audioFiles.map((file) => ({
        ...file,
        name: file.name || file.path.split('/').pop(),
        thumbnail: buildThumbnailUrl(file, 'music'),
      }));

      // Determine initial track
      let startIndex = 0;
      if (selectedPath) {
        const idx = playlist.findIndex((t) => t.path === selectedPath);
        if (idx >= 0) startIndex = idx;
      }

      if (playlist.length > 0) {
        playTrack(playlist[startIndex], playlist, startIndex);
        addRecentMusic(playlist[startIndex]);
      } else if (selectedPath) {
        // Fallback: single track only
        const fileName = selectedPath.split('/').pop();
        const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
        const singleTrack = {
          name: nameWithoutExt,
          path: selectedPath,
          artist: 'Unknown Artist',
          album: 'Unknown Album',
          thumbnail: buildThumbnailUrl({ path: selectedPath, type: 'audio', thumbnail: null }, 'music'),
        };
        playTrack(singleTrack, [singleTrack], 0);
        addRecentMusic(singleTrack);
        showToast('Không tìm thấy playlist, phát 1 bài', 'warning');
      } else {
        showToast('Thư mục không có bài hát hợp lệ', 'warning');
      }
    } catch (err) {
      if (selectedFileArg) {
        try {
          const fileName = selectedFileArg.split('/').pop();
          const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
          const singleTrack = {
            name: nameWithoutExt,
            path: selectedFileArg,
            artist: 'Unknown Artist',
            album: 'Unknown Album',
            thumbnail: buildThumbnailUrl({ path: selectedFileArg, type: 'audio', thumbnail: null }, 'music'),
          };
          playTrack(singleTrack, [singleTrack], 0);
          addRecentMusic(singleTrack);
          showToast('Không thể load playlist, chỉ phát 1 bài', 'warning');
          return;
        } catch {}
      }
      showToast('Không thể phát nhạc: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  // Load whenever URL params change
  useEffect(() => {
    // If playlist is provided, load that folder and optionally select specific file
    if (playlistPath) {
      loadFolderSongs(playlistPath, path || null);
      return;
    }
    // Else, if only file is provided, derive folder and load
    if (path) {
      loadFolderSongs(null, path);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlistPath, path, sourceKey]);

  // Initial load (handled by the URL-change effect above)
  // useEffect(() => {
  //   if (path && sourceKey && !currentTrack) {
  //     loadFolderSongs();
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [path, sourceKey]);

  // Audio element effects
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);
    const updateBuffered = () => {
      if (audio.buffered?.length > 0) {
        setBuffered(audio.buffered.end(audio.buffered.length - 1));
      }
    };
    const handleEnded = () => {
      if (repeat === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else {
        nextTrack();
      }
    };
    const handleError = (e) => {
      setError('Failed to load audio');
      showToast('Audio load error', 'error');
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('progress', updateBuffered);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('progress', updateBuffered);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [repeat, nextTrack, showToast]);

  // Auto play when track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack || !sourceKey) return;
    const audioUrl = buildAudioUrl(currentTrack.path);
    if (!audioUrl) return;
    audio.src = audioUrl;
    audio.load();
    const handleCanPlay = () => {
      if (isPlaying) {
        audio.play().catch((err) => {
          setError('Failed to play audio: ' + err.message);
          showToast('Không thể phát nhạc: ' + err.message, 'error');
        });
      }
      audio.removeEventListener('canplay', handleCanPlay);
    };
    const handleLoadError = (e) => {
      setError('Failed to load audio source');
      showToast('Không thể load audio', 'error');
      audio.removeEventListener('error', handleLoadError);
    };
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleLoadError);
    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleLoadError);
    };
  }, [currentTrack, isPlaying, sourceKey, showToast]);

  // Volume sync
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [volume]);

  // ======== Derived UI Data ========
  const isFav = (t) => favorites.some((f) => f.path === t.path);
  const folderTitle = (() => {
    if (playlistPath) return playlistPath.split('/').pop();
    if (path) {
      const parts = path.split('/');
      parts.pop();
      return parts.pop() || 'Now Playing';
    }
    return 'Now Playing';
  })();
  const headerArt = (currentTrack || currentPlaylist[0])
    ? buildThumbnailUrl(currentTrack || currentPlaylist[0], 'music')
    : '/default/music-thumb.png';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1f1f1f] via-[#121212] to-[#000] text-white">
      {/* Top Controls */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-white/10 hover:bg-white/20">
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => navigate(1)} className="p-2 rounded-full bg-white/10 hover:bg-white/20">
            <FiChevronRight className="w-5 h-5" />
          </button>
        </div>
        <button onClick={() => navigate('/music')} className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-sm">
          <FiHome className="inline w-4 h-4 mr-1" /> Music Home
        </button>
      </div>

      {/* Header Banner */}
      <div className="relative px-6 pb-6">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#50306e] via-transparent to-transparent opacity-60" />
        <div className="flex flex-col md:flex-row md:items-end gap-6">
          <motion.img
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            src={headerArt}
            alt={(currentTrack?.name || currentPlaylist[0]?.name || folderTitle) || 'Cover'}
            onError={(e) => (e.currentTarget.src = '/default/music-thumb.png')}
            className="w-48 h-48 md:w-56 md:h-56 object-cover rounded shadow-2xl"
          />
          <div className="flex-1">
            <div className="text-xs uppercase text-white/70 font-semibold">Playlist</div>
            <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight mt-2">
              {currentTrack?.album?.toUpperCase?.() || folderTitle?.toUpperCase?.() || 'NOW PLAYING'}
            </h1>
            <div className="mt-4 text-white/80 text-sm flex items-center gap-2">
              <span className="font-semibold">Music</span>
              <span className="w-1 h-1 rounded-full bg-white/40" />
              <span>{currentPlaylist.length} {currentPlaylist.length === 1 ? 'song' : 'songs'}</span>
            </div>
            <div className="mt-6 flex items-center gap-4">
              <button
                onClick={togglePlayPause}
                className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-400 text-black flex items-center justify-center shadow-lg"
                aria-label="Play"
              >
                {isPlaying ? <FiPause className="w-7 h-7" /> : <FiPlay className="w-7 h-7 ml-0.5" />}
              </button>
              {currentTrack && (
                <button
                  onClick={() => toggleFavorite(currentTrack)}
                  className={`p-3 rounded-full transition-colors ${isFav(currentTrack) ? 'text-green-400' : 'text-white/70 hover:text-white'}`}
                >
                  <FiHeart className="w-6 h-6" />
                </button>
              )}
              <button className="p-3 rounded-full text-white/70 hover:text-white"><FiDownload className="w-6 h-6" /></button>
              <button className="p-3 rounded-full text-white/70 hover:text-white"><FiMoreHorizontal className="w-6 h-6" /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Tracklist */}
      <div className="px-2 sm:px-6 pb-32">
        <div className="grid grid-cols-[40px_1fr_1fr_60px] gap-3 px-4 py-2 text-sm text-white/60 border-b border-white/10">
          <div className="text-center">#</div>
          <div>Title</div>
          <div className="hidden sm:block">Album</div>
          <div className="flex justify-end pr-2"><FiClock className="w-4 h-4" /></div>
        </div>

        <div className="divide-y divide-white/5">
          {currentPlaylist.map((track, index) => (
            <div
              key={track.path || index}
              onClick={() => playTrack(track, currentPlaylist, index)}
              className={`grid grid-cols-[40px_1fr_1fr_60px] gap-3 px-4 py-2 items-center cursor-pointer hover:bg-white/5 transition-colors ${
                index === currentIndex ? 'bg-white/10' : ''
              }`}
            >
              <div className="text-center text-white/60">
                {index === currentIndex && isPlaying ? (
                  <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                ) : (
                  index + 1
                )}
              </div>

              <div className="min-w-0 flex items-center gap-3">
                <img
                  src={buildThumbnailUrl(track, 'music')}
                  onError={(e) => (e.currentTarget.src = '/default/music-thumb.png')}
                  alt={track.name}
                  className="w-10 h-10 rounded object-cover flex-none"
                />
                <div className="min-w-0">
                  <div className={`truncate ${index === currentIndex ? 'text-green-400' : 'text-white'}`}>{track.name}</div>
                  <div className="text-xs text-white/60 truncate">{track.artist || 'Unknown Artist'}</div>
                </div>
              </div>

              <div className="hidden sm:block text-sm text-white/70 truncate">{track.album || '—'}</div>

              <div className="flex items-center justify-end gap-3 pr-2 text-white/70">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(track);
                  }}
                  className={`hover:text-white ${isFav(track) ? 'text-green-400' : ''}`}
                  aria-label="Favorite"
                >
                  <FiHeart className="w-4 h-4" />
                </button>
                <span className="tabular-nums text-sm">{track.duration ? formatTime(track.duration) : '—'}</span>
              </div>
            </div>
          ))}

          {currentPlaylist.length === 0 && (
            <div className="px-4 py-10 text-center text-white/60">Chưa có danh sách phát. Hãy chọn một bài để bắt đầu.</div>
          )}
        </div>
      </div>

      {/* Bottom player bar */}
      <div className="fixed bottom-0 left-0 right-0 h-24 bg-[#121212]/95 backdrop-blur border-t border-white/10">
        <div className="h-full px-4 md:px-6 flex items-center gap-4">
          {/* Now playing */}
          <div className="hidden md:flex items-center gap-3 min-w-[220px]">
            {currentTrack ? (
              <>
                <img
                  src={buildThumbnailUrl(currentTrack, 'music') || '/default/music-thumb.png'}
                  onError={(e) => (e.currentTarget.src = '/default/music-thumb.png')}
                  alt={currentTrack.name}
                  className="w-12 h-12 rounded object-cover"
                />
                <div className="min-w-0">
                  <div className="text-sm truncate">{currentTrack.name}</div>
                  <div className="text-xs text-white/60 truncate">{currentTrack.artist || 'Unknown Artist'}</div>
                </div>
              </>
            ) : (
              <div className="text-white/60 text-sm">No track selected</div>
            )}
          </div>

          {/* Controls + progress */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="flex items-center gap-5">
              <button onClick={toggleShuffle} className={`text-white/70 hover:text-white ${shuffle ? '!text-green-400' : ''}`}> <FiShuffle className="w-4 h-4" /> </button>
              <button onClick={prevTrack} className="text-white hover:text-white/90"> <FiSkipBack className="w-5 h-5" /> </button>
              <button onClick={togglePlayPause} className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform">
                {isPlaying ? <FiPause className="w-5 h-5" /> : <FiPlay className="w-5 h-5 ml-0.5" />}
              </button>
              <button onClick={nextTrack} className="text-white hover:text-white/90"> <FiSkipForward className="w-5 h-5" /> </button>
              <button onClick={toggleRepeat} className={`text-white/70 hover:text-white ${repeat !== 'none' ? '!text-green-400' : ''}`}> <FiRepeat className="w-4 h-4" /> </button>
            </div>
            <div className="w-full max-w-2xl flex items-center gap-3 mt-2">
              <span className="text-xs text-white/60 min-w-[34px] text-right">{formatTime(currentTime)}</span>
              <div className="h-1 w-full bg-white/20 rounded-full cursor-pointer" onClick={handleSeek}>
                <div className="h-full bg-white rounded-full relative" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-white rounded-full" />
                </div>
              </div>
              <span className="text-xs text-white/60 min-w-[34px]">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume */}
          <div className="hidden md:flex items-center gap-3 min-w-[180px] justify-end">
            <button onClick={toggleMute} className="text-white/80 hover:text-white">
              {volume === 0 ? <FiVolumeX className="w-5 h-5" /> : <FiVolume2 className="w-5 h-5" />}
            </button>
            <div className="w-28 h-1 bg-white/20 rounded-full cursor-pointer" onClick={handleVolumeBar}>
              <div className="h-full bg-white rounded-full" style={{ width: `${Math.round(volume * 100)}%` }} />
            </div>
            <span className="text-xs text-white/60 w-8 text-right">{Math.round(volume * 100)}</span>
          </div>
        </div>
      </div>

      {/* Audio Element */}
      <audio ref={audioRef} preload="metadata" className="hidden" />

      {loading && <LoadingOverlay />}
    </div>
  );
};

export default MusicPlayer;
