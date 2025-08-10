// 📁 src/pages/music/MusicPlayerV2.jsx
// 🎵 Zing MP3-style Music Player (logic same as MusicPlayer, UI refreshed)

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
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
  FiChevronLeft,
  FiChevronRight,
  FiHome,
  FiFolder,
  FiLayout,
  FiHeart,
  FiMoreHorizontal
} from 'react-icons/fi';
import { useAuthStore, useMusicStore, useUIStore } from '@/store';
import { useRecentMusicManager } from '@/hooks/useMusicData';
import { apiService } from '@/utils/api';
import { buildThumbnailUrl } from '@/utils/thumbnailUtils';
import LoadingOverlay from '@/components/common/LoadingOverlay';

const MusicPlayerV2 = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Read params/state like v1 (stable URL preferred via state)
  const path = searchParams.get('file');
  const playlistPath = searchParams.get('playlist');
  const { file: stateFile, playlist: statePlaylist, key: stateKey } = location.state || {};

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
    playTrack,
    pauseTrack,
    resumeTrack,
    nextTrack,
    prevTrack,
    setVolume,
  } = useMusicStore();

  const { showToast } = useUIStore();
  const { sourceKey, setSourceKey } = useAuthStore();
  const { playerSettings, updatePlayerSettings } = useMusicStore();

  // Prefer key from navigation state if provided, else default to M_MUSIC
  useEffect(() => {
    if (stateKey && sourceKey !== stateKey) {
      setSourceKey(stateKey);
    } else if (!sourceKey || sourceKey === 'ROOT_FANTASY') {
      setSourceKey('M_MUSIC');
    }
  }, [stateKey, sourceKey, setSourceKey]);

  const { addRecentMusic } = useRecentMusicManager();

  // Local state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Audio
  const audioRef = useRef(null);
  const latestTrackRef = useRef(null);
  const dragIndexRef = useRef(-1);
  const isDraggingRef = useRef(false);
  const [dropIndicator, setDropIndicator] = useState({ index: -1, position: 'above' });
  const prevOrderBeforeShuffleRef = useRef(null);

  // Helper: bump viewCount locally (UI sync)
  const bumpViewCount = useCallback((songPath) => {
    if (!songPath) return;
    try {
      useMusicStore.setState((state) => {
        const idx = state.currentPlaylist.findIndex((t) => t.path === songPath);
        if (idx === -1) return {};
        const oldItem = state.currentPlaylist[idx] || {};
        const newCount = Number(oldItem.viewCount ?? oldItem.views ?? 0) + 1;
        const updatedItem = { ...oldItem, viewCount: newCount };
        const newPlaylist = [...state.currentPlaylist];
        newPlaylist[idx] = updatedItem;
        const isCurrent = state.currentTrack?.path === songPath;
        return { currentPlaylist: newPlaylist, currentTrack: isCurrent ? updatedItem : state.currentTrack };
      });
    } catch {}
  }, []);

  // Keep latest track
  useEffect(() => {
    latestTrackRef.current = currentTrack || null;
  }, [currentTrack]);

  // Increase view on play with debounce
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const lastIncRef = { path: '', ts: 0 };
    const handlePlay = async () => {
      const track = latestTrackRef.current;
      const trackPath = track?.path;
      if (!trackPath || !sourceKey) return;
      const now = Date.now();
      if (lastIncRef.path === trackPath && now - lastIncRef.ts < 1000) return;
      lastIncRef.path = trackPath;
      lastIncRef.ts = now;
      try {
        const res = await fetch('/api/increase-view/music', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: sourceKey, path: trackPath })
        });
        if (res.ok) bumpViewCount(trackPath);
      } catch (err) {
        console.warn('Failed to increase music view count:', err);
      }
    };

    audio.addEventListener('play', handlePlay);
    return () => audio.removeEventListener('play', handlePlay);
  }, [sourceKey, bumpViewCount]);

  // Effective inputs
  const effectivePath = stateFile || path || null;
  const effectivePlaylist = statePlaylist || playlistPath || null;

  // Helpers
  function buildAudioUrl(audioPath) {
    if (!audioPath || !sourceKey) return null;
    return `/api/music/audio?key=${sourceKey}&file=${encodeURIComponent(audioPath)}`;
  }

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleRowClick = useCallback((e, track, index) => {
    e?.preventDefault?.();
  if (isDraggingRef.current) return;
    if (currentTrack?.path === track.path && currentIndex === index) {
      if (!isPlaying) {
        const audio = audioRef.current;
        if (audio) {
          const p = audio.play();
          if (p) p.catch(() => {});
        }
        resumeTrack();
      }
      return;
    }
    playTrack(track, currentPlaylist, index);
  }, [currentTrack?.path, currentIndex, isPlaying, playTrack, currentPlaylist, resumeTrack]);

  // Drag & Drop handlers
  const handleDragStart = (index) => {
    dragIndexRef.current = index;
    isDraggingRef.current = true;
  };
  const handleDragOver = (e, overIndex) => {
    e.preventDefault();
    if (!e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const position = y < rect.height / 2 ? 'above' : 'below';
    setDropIndicator({ index: overIndex, position });
  };
  const handleDragEnd = () => {
    setTimeout(() => {
      isDraggingRef.current = false;
      dragIndexRef.current = -1;
      setDropIndicator({ index: -1, position: 'above' });
    }, 0);
  };
  const isPlaylistId = (val) => {
    if (val === null || val === undefined) return false;
    if (typeof val === 'number') return true;
    if (typeof val === 'string') return !val.includes('/');
    return false;
  };
  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    e.stopPropagation();
    const from = dragIndexRef.current;
    if (from === -1 || dropIndex === -1) {
      handleDragEnd();
      return;
    }
    let insertIndex = dropIndicator.position === 'below' ? dropIndex + 1 : dropIndex;
    const prev = useMusicStore.getState().currentPlaylist;
    if (!Array.isArray(prev) || prev.length === 0) {
      handleDragEnd();
      return;
    }
    if (from < insertIndex) insertIndex -= 1;
    const updated = [...prev];
    const [moved] = updated.splice(from, 1);
    updated.splice(Math.max(0, Math.min(insertIndex, updated.length)), 0, moved);
    const currTrack = useMusicStore.getState().currentTrack;
    const newIndex = currTrack ? Math.max(0, updated.findIndex((t) => t.path === currTrack.path)) : insertIndex;
    useMusicStore.setState({ currentPlaylist: updated, currentIndex: newIndex });
    try {
      const effPlaylist = statePlaylist || playlistPath || null;
      if (effPlaylist && isPlaylistId(effPlaylist) && sourceKey) {
        const res = await fetch('/api/music/playlist/order', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: sourceKey, playlistId: Number(effPlaylist), order: updated.map((t) => t.path) })
        });
        if (!res.ok) throw new Error(await res.text());
        showToast('Đã lưu thứ tự playlist', 'success');
      }
    } catch (err) {
      showToast('Không thể lưu thứ tự: ' + (err.message || 'Lỗi không rõ'), 'error');
    } finally {
      handleDragEnd();
    }
  };

  // Load folder songs (same logic as v1)
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
      let startIndex = 0;
      if (selectedPath) {
        const idx = playlist.findIndex((t) => t.path === selectedPath);
        if (idx >= 0) startIndex = idx;
      }
      if (playlist.length > 0) {
        playTrack(playlist[startIndex], playlist, startIndex);
        addRecentMusic(playlist[startIndex]);
      } else if (selectedPath) {
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

  // Trigger load when inputs change
  useEffect(() => {
    if (effectivePlaylist) {
      loadFolderSongs(effectivePlaylist, effectivePath || null);
      return;
    }
    if (effectivePath) {
      loadFolderSongs(null, effectivePath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectivePlaylist, effectivePath, sourceKey]);

  // Audio element lifecycle
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);
    const handleEnded = () => {
      if (repeat === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else {
        nextTrack();
      }
    };
    const handleError = () => {
      setError('Failed to load audio');
      showToast('Audio load error', 'error');
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [repeat, nextTrack, showToast]);

  // Auto update src when track changes (only if changed)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack || !sourceKey) return;
    const audioUrl = buildAudioUrl(currentTrack.path);
    if (!audioUrl) return;
    const absolute = window.location.origin + audioUrl;
    if (audio.src !== absolute) {
      audio.src = audioUrl;
      audio.load();
    }
    const handleCanPlay = () => {
      if (isPlaying && audio.paused) {
        audio.play().catch((err) => {
          setError('Failed to play audio: ' + err.message);
          showToast('Không thể phát nhạc: ' + err.message, 'error');
        });
      }
      audio.removeEventListener('canplay', handleCanPlay);
    };
    const handleLoadError = () => {
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

  // Controls
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

  // Derived
  const folderTitle = (() => {
    if (effectivePlaylist) return effectivePlaylist.split('/').pop();
    if (effectivePath) {
      const parts = effectivePath.split('/');
      parts.pop();
      return parts.pop() || 'Now Playing';
    }
    return 'Now Playing';
  })();

  const coverArt = (currentTrack || currentPlaylist[0])
    ? buildThumbnailUrl(currentTrack || currentPlaylist[0], 'music')
    : '/default/music-thumb.png';

  // Derived meta for header
  const albumName = currentTrack?.album || currentPlaylist[0]?.album || folderTitle;
  const artistName = currentTrack?.artist || currentPlaylist[0]?.artist || 'Unknown Artist';
  // Show views of the current track (not the whole playlist) to reflect selection changes
  const displayViews = (() => {
    if (currentTrack) return Number(currentTrack.viewCount ?? currentTrack.views ?? 0);
    // fallback when nothing is selected yet
    const first = (currentPlaylist || [])[0];
    return first ? Number(first.viewCount ?? first.views ?? 0) : 0;
  })();
  const isFav = currentTrack ? (favorites || []).some((f) => f.path === currentTrack.path) : false;
  const parentInfo = (() => {
    const full = (currentTrack?.path || effectivePath || '') || '';
    if (!full) return { parentPath: '', parentName: '' };
    const parts = full.split('/');
    parts.pop();
    const parentPath = parts.join('/');
    const parentName = parts.pop() || '';
    return { parentPath, parentName };
  })();

  // Handle unmount
  useEffect(() => {
    return () => {
      setLoading(false);
      setError(null);
    };
  }, []);

  // Render
  return (
    <div className="min-h-screen bg-[#1b1026] text-white">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-white/10 hover:bg-white/20">
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => navigate(1)} className="p-2 rounded-full bg-white/10 hover:bg-white/20">
            <FiChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {(() => {
            const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
            const isMobile = /Mobi|Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (typeof window !== 'undefined' && window.innerWidth <= 768);
            return (
              <button
                onClick={() => {
                  if (isMobile) return; // disable switch on mobile
                  const next = playerSettings?.playerUI === 'v2' ? 'v1' : 'v2';
                  updatePlayerSettings({ playerUI: next });
                  navigate('/music/player', { replace: true, state: location.state });
                }}
                className={`px-3 py-1.5 rounded-full ${isMobile ? 'bg-white/10 text-white/60 cursor-not-allowed' : 'bg-white/10 hover:bg-white/20 text-white'} text-sm flex items-center gap-2`}
                title={isMobile ? 'Không khả dụng trên mobile' : 'Đổi giao diện Music Player'}
                disabled={isMobile}
              >
                <FiLayout className="w-4 h-4" /> {playerSettings?.playerUI === 'v2' ? 'Zing' : 'Spotify'}
              </button>
            );
          })()}
          <button onClick={() => navigate('/music')} className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-sm">
            <FiHome className="inline w-4 h-4 mr-1" /> Music Home
          </button>
        </div>
      </div>

      {/* Main: Left info + Right full playlist */}
      <div className="px-6 pb-28">
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8 items-start">
          {/* Left: Cover + Info + Actions */}
          <div className="flex flex-col items-start gap-4">
            <div className="relative">
              <motion.img
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                src={coverArt}
                alt={currentTrack?.name || folderTitle}
                onError={(e) => (e.currentTarget.src = '/default/music-thumb.png')}
                className="w-64 h-64 md:w-72 md:h-72 rounded-xl object-cover shadow-2xl"
              />
              {/* Center play overlay like Zing */}
              <button
                onClick={togglePlayPause}
                className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-black/50 hover:bg-black/60 text-white flex items-center justify-center shadow-lg"
                aria-label="Play/Pause"
                style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
              >
                {isPlaying ? <FiPause className="w-6 h-6" /> : <FiPlay className="w-6 h-6 ml-0.5" />}
              </button>
            </div>

            {/* Info */}
            <div className="w-full">
              <div className="text-sm uppercase text-white/60 tracking-wide">{folderTitle}</div>
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight mt-2 line-clamp-2">{albumName}</h1>
              <div className="mt-2 text-white/70 text-sm">
                <div className="flex items-center gap-2 min-h-[1.25rem]">
                  <span className="truncate flex-1">{artistName}</span>
                  <span className="w-1 h-1 rounded-full bg-white/30 hidden md:inline" />
                  <span className="hidden md:inline">{displayViews.toLocaleString()} lượt xem</span>
                </div>
                <div className="md:hidden mt-1 text-white/70 text-sm">
                  {displayViews.toLocaleString()} lượt xem
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-1 flex items-center gap-3">
              <button
                onClick={togglePlayPause}
                className="px-5 py-2 rounded-full bg-[#8246ff] hover:bg-[#6f30ff] text-white font-semibold shadow-lg"
              >
                {isPlaying ? 'Tạm dừng' : 'Phát tất cả'}
              </button>
              {currentTrack && (
                <button
                  onClick={() => toggleFavorite(currentTrack)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isFav ? 'bg-white/20 text-[#ffd1dc]' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}
                  title={isFav ? 'Bỏ yêu thích' : 'Yêu thích'}
                >
                  <FiHeart className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
                </button>
              )}
              <button className="w-10 h-10 rounded-full bg-white/10 text-white/80 hover:bg-white/20 flex items-center justify-center" title="Khác">
                <FiMoreHorizontal className="w-5 h-5" />
              </button>
            </div>

            {/* Parent folder link */}
            {parentInfo.parentName && (
              <div className="text-xs text-white/50">
                Thư mục:
                <button
                  className="ml-1 underline hover:text-white"
                  onClick={() => {
                    if (parentInfo.parentPath) navigate(`/music?path=${encodeURIComponent(parentInfo.parentPath)}`);
                  }}
                >
                  {parentInfo.parentName}
                </button>
              </div>
            )}
          </div>

          {/* Right: Full playlist */}
          <div className="min-w-0">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-white/60 mb-2">
              <div className="flex items-center gap-2">
                <span>Bài hát</span>
              </div>
              <span className="hidden md:block">Thời gian</span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
              <div className="divide-y divide-white/10">
                {(currentPlaylist && currentPlaylist.length > 0) ? (
                  currentPlaylist.map((track, idx) => {
                    const active = currentIndex === idx;
                    const thumb = buildThumbnailUrl(track, 'music') || '/default/music-thumb.png';
                    const timeVal = (typeof track?.duration === 'number' && !isNaN(track.duration))
                      ? track.duration
                      : (typeof track?.length === 'number' ? track.length : null);
                    return (
                      <button
                        key={track.path || idx}
                        draggable
                        onDragStart={() => handleDragStart(idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDrop={(e) => handleDrop(e, idx)}
                        onDragEnd={handleDragEnd}
                        onClick={(e) => handleRowClick(e, track, idx)}
                        className={`relative w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/10 transition-colors ${active ? 'bg-white/10' : ''}`}
                      >
                        {dropIndicator.index === idx && (
                          <span
                            className={`absolute left-3 right-3 ${dropIndicator.position === 'above' ? 'top-0' : 'bottom-0'} h-0.5 bg-[#b58dff] shadow-[0_0_0_2px_rgba(181,141,255,0.35)] rounded pointer-events-none`}
                          />
                        )}
                        <span className="w-8 text-center text-white/60">
                          {active ? (isPlaying ? <FiPause className="inline w-4 h-4" /> : <FiPlay className="inline w-4 h-4 ml-0.5" />) : (idx + 1)}
                        </span>
                        <img
                          src={thumb}
                          onError={(e) => (e.currentTarget.src = '/default/music-thumb.png')}
                          alt={track.name}
                          className="w-10 h-10 rounded object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm truncate ${active ? 'font-semibold' : ''}`}>{track.name}</div>
                          <div className="text-xs text-white/60 truncate">{track.artist || track.album || 'Unknown'}</div>
                        </div>
                        <span className="w-24 text-right text-xs text-white/60 hidden md:block">
                          {timeVal ? `${Math.floor(timeVal / 60)}:${String(Math.floor(timeVal % 60)).padStart(2, '0')}` : '--:--'}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="px-4 py-8 text-white/60 text-sm">Playlist trống</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="fixed bottom-0 left-0 right-0 h-22 bg-[#1a0f24]/95 backdrop-blur border-t border-white/10">
        <div className="h-full px-4 md:px-6 flex items-center gap-4">
          {/* Now Playing */}
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

          {/* Transport */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="flex items-center gap-5">
              <button
                onClick={() => {
                  const store = useMusicStore.getState();
                  if (!store.shuffle) {
                    const current = [...(store.currentPlaylist || [])];
                    prevOrderBeforeShuffleRef.current = current;
                    if (current.length <= 1) {
                      useMusicStore.setState({ shuffle: true });
                    } else {
                      const shuffled = [...current];
                      for (let i = shuffled.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                      }
                      const currTrack = store.currentTrack;
                      const newIndex = currTrack ? Math.max(0, shuffled.findIndex((t) => t.path === currTrack.path)) : 0;
                      useMusicStore.setState({ shuffle: true, currentPlaylist: shuffled, currentIndex: newIndex });
                    }
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
                }}
                className={`text-white/70 hover:text-white ${shuffle ? '!text-[#b58dff]' : ''}`}
              >
                <FiShuffle className="w-4 h-4" />
              </button>
              <button onClick={prevTrack} className="text-white hover:text-white/90">
                <FiSkipBack className="w-5 h-5" />
              </button>
              <button onClick={togglePlayPause} className="w-10 h-10 rounded-full bg-[#b58dff] text-black flex items-center justify-center hover:scale-105 transition-transform">
                {isPlaying ? <FiPause className="w-5 h-5" /> : <FiPlay className="w-5 h-5 ml-0.5" />}
              </button>
              <button onClick={nextTrack} className="text-white hover:text-white/90">
                <FiSkipForward className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  const cur = useMusicStore.getState().repeat;
                  const next = cur === 'none' ? 'all' : cur === 'all' ? 'one' : 'none';
                  useMusicStore.setState({ repeat: next });
                }}
                className={`text-white/70 hover:text-white ${repeat !== 'none' ? '!text-[#b58dff]' : ''}`}
              >
                <FiRepeat className="w-4 h-4" />
              </button>
            </div>
            <div className="w-full max-w-2xl flex items-center gap-3 mt-2">
              <span className="text-xs text-white/60 min-w-[34px] text-right">{formatTime(currentTime)}</span>
              <div className="h-1 w-full bg-white/20 rounded-full cursor-pointer" onClick={handleSeek}>
                <div className="h-full bg-[#b58dff] rounded-full relative" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-[#b58dff] rounded-full" />
                </div>
              </div>
              <span className="text-xs text-white/60 min-w-[34px]">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume */}
          <div className="hidden md:flex items-center gap-3 min-w-[180px] justify-end">
            <button
              onClick={() => {
                if (volume === 0) {
                  setVolume(0.5);
                  if (audioRef.current) audioRef.current.volume = 0.5;
                } else {
                  setVolume(0);
                  if (audioRef.current) audioRef.current.volume = 0;
                }
              }}
              className="text-white/80 hover:text-white"
            >
              {volume === 0 ? <FiVolumeX className="w-5 h-5" /> : <FiVolume2 className="w-5 h-5" />}
            </button>
            <div className="w-28 h-1 bg-white/20 rounded-full cursor-pointer" onClick={handleVolumeBar}>
              <div className="h-full bg-[#b58dff] rounded-full" style={{ width: `${Math.round(volume * 100)}%` }} />
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

export default MusicPlayerV2;
