// 📁 src/pages/music/MusicPlayerV2.jsx
// 🎵 Zing MP3-style Music Player (logic same as MusicPlayer, UI refreshed)

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiPlay,
  FiPause,
  FiClock,
  FiHeart,
  FiMoreHorizontal
} from 'react-icons/fi';
import { useAuthStore, useMusicStore, useUIStore } from '@/store';
import { useRecentMusicManager } from '@/hooks/useMusicData';
import { apiService } from '@/utils/api';
import { DEFAULT_IMAGES } from '@/constants';
import { buildThumbnailUrl } from '@/utils/thumbnailUtils';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import PlayerFooter from '../../components/music/PlayerFooter';
import PlayerHeader from '../../components/music/PlayerHeader';

const MusicPlayerV2 = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Read params/state like v1 (stable URL preferred via state)
  const path = searchParams.get('file');
  const playlistPath = searchParams.get('playlist');
  const { kind: stateKind, file: stateFile, playlist: statePlaylist, key: stateKey } = location.state || {};

  const {
    currentTrack,
    currentPlaylist,
    currentIndex,
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
    toggleShuffle,
    setRepeat,
    setShuffle,
  } = useMusicStore();

  const { showToast } = useUIStore();
  const { sourceKey, setSourceKey } = useAuthStore();
  const { playerSettings, updatePlayerSettings } = useMusicStore();

  // Prefer key from navigation state if provided, else navigate to home for source selection
  useEffect(() => {
    if (stateKey && sourceKey !== stateKey) {
      setSourceKey(stateKey);
    } else if (!sourceKey || !sourceKey.startsWith('M_')) {
      // No source or wrong source type (not music) -> go to home
      showToast('Vui lòng chọn source music', 'warning');
      navigate('/');
    }
  }, [stateKey, sourceKey, setSourceKey, navigate, showToast]);

  const { addRecentMusic } = useRecentMusicManager();

  // Local state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [playlistTitle, setPlaylistTitle] = useState(null);
  const [library, setLibrary] = useState({ items: [], loading: false, error: null });
  const [activePlaylistId, setActivePlaylistId] = useState(null);

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
  const effectivePlaylist = statePlaylist ?? playlistPath ?? null; // allow ''
  const effectiveKind = stateKind || (effectivePlaylist && !String(effectivePlaylist).includes('/') ? 'playlist' : (effectivePath ? 'audio' : 'folder'));

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
  const loadPlaylistById = async (playlistIdArg, selectedFileArg) => {
    try {
      if (!sourceKey) {
        showToast('Thiếu source key', 'error');
        return;
      }
      const playlistId = String(playlistIdArg);
      const res = await fetch(`/api/music/playlist/${encodeURIComponent(playlistId)}?key=${encodeURIComponent(sourceKey)}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const tracks = Array.isArray(data.tracks) ? data.tracks : [];
      const playlist = tracks.map((t) => ({
        ...t,
        name: t.name || (t.path ? t.path.split('/').pop() : 'Unknown'),
        thumbnail: buildThumbnailUrl(t, 'music'),
      }));

      setPlaylistTitle(data?.name || null);

      let startIndex = 0;
      if (selectedFileArg) {
        const idx = playlist.findIndex((x) => x.path === selectedFileArg);
        if (idx >= 0) startIndex = idx;
      }

      if (playlist.length > 0) {
        playTrack(playlist[startIndex], playlist, startIndex);
        addRecentMusic(playlist[startIndex]);
      } else if (selectedFileArg) {
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
        showToast('Playlist rỗng, phát 1 bài', 'warning');
      } else {
        showToast('Playlist rỗng', 'warning');
      }
    } catch (err) {
      showToast('Không thể load playlist: ' + (err.message || 'unknown error'), 'error');
    }
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
    if (effectiveKind === 'playlist' && effectivePlaylist !== null && effectivePlaylist !== undefined && effectivePlaylist !== '') {
      if (isPlaylistId(effectivePlaylist)) {
        return void loadPlaylistById(effectivePlaylist, effectivePath || null);
      }
      return void loadFolderSongs(effectivePlaylist, effectivePath || null);
    }
    if (effectiveKind === 'folder') {
      return void loadFolderSongs(effectivePlaylist ?? '', effectivePath || null);
    }
    if (effectiveKind === 'audio' && effectivePath) {
      return void loadFolderSongs(null, effectivePath);
    }
    if (effectivePlaylist !== null && effectivePlaylist !== undefined) {
      if (isPlaylistId(effectivePlaylist)) return void loadPlaylistById(effectivePlaylist, effectivePath || null);
      return void loadFolderSongs(effectivePlaylist ?? '', effectivePath || null);
    }
    if (effectivePath) return void loadFolderSongs(null, effectivePath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveKind, effectivePlaylist, effectivePath, sourceKey]);

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
    if (effectivePlaylist) {
      if (isPlaylistId(effectivePlaylist)) return playlistTitle || `Playlist #${effectivePlaylist}`;
      return effectivePlaylist.split('/').pop();
    }
    if (effectivePath) {
      const parts = effectivePath.split('/');
      parts.pop();
      return parts.pop() || 'Now Playing';
    }
    return 'Now Playing';
  })();

  const coverArt = (currentTrack || currentPlaylist[0])
    ? buildThumbnailUrl(currentTrack || currentPlaylist[0], 'music')
    : DEFAULT_IMAGES.music;

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
  const isFav = false; // Music doesn't have favorites system
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

  const normalizedFilter = '';
  const visiblePlaylist = currentPlaylist;

  // Load user playlists for Library (right panel)
  useEffect(() => {
    const load = async () => {
      if (!sourceKey) return;
      setLibrary((s) => ({ ...s, loading: true }));
      try {
        const songPath = (currentTrack?.path || effectivePath || '') || undefined;
        const res = await apiService.music.getPlaylists({ key: sourceKey, songPath });
        const rows = Array.isArray(res.data) ? res.data : [];
        setLibrary({ items: rows, loading: false, error: null });
      } catch (err) {
        setLibrary({ items: [], loading: false, error: err.message || 'Failed to load playlists' });
      }
    };
    load();
  }, [sourceKey, currentTrack?.path, effectivePath]);

  // Render
  return (
    <div className="min-h-screen bg-[#1b1026] text-white">
      {/* Top Bar with centered search (sticky) */}
      <PlayerHeader
        folderTitle={folderTitle}
        headerCondensed={false}
        theme="v2"
      />

      {/* Main: Left info + Center list + Right playlist panel */}
  <div className="px-4 sm:px-6 mt-1 pb-[104px]">
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr_320px] gap-6 items-start">
          {/* Left: Cover + Info + Actions */}
          <div className="pb-3">
            <div className="flex flex-col items-start gap-4">
            <div className="relative">
              <motion.img
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                src={coverArt}
                alt={currentTrack?.name || folderTitle}
                onError={(e) => (e.currentTarget.src = DEFAULT_IMAGES.music)}
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
              <button className="w-10 h-10 rounded-full bg-white/10 text-white/80 hover:bg-white/20 flex items-center justify-center" title="Khác">
                <FiMoreHorizontal className="w-5 h-5" />
              </button>
            </div>

            {/* Parent folder link */}
            <div className="text-xs text-white/50">
              Thư mục:
              <button
                className="ml-1 underline hover:text-white"
                onClick={() => {
                  if (parentInfo.parentPath) {
                    navigate(`/music?path=${encodeURIComponent(parentInfo.parentPath)}`);
                  } else {
                    navigate('/music');
                  }
                }}
              >
                {parentInfo.parentName || 'Home'}
              </button>
            </div>
          </div>
          </div>

          {/* Center: Main track list */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 200px)', minHeight: '400px' }}>
            <div className="grid grid-cols-[40px_1fr_56px] md:grid-cols-[40px_1fr_1fr_56px_72px_56px] lg:grid-cols-[40px_1fr_1fr_1fr_56px_72px_56px] gap-3 px-4 py-2 text-sm text-white/60 border-b border-white/10">
              <div className="text-center">#</div>
              <div>Songs</div>
              <div className="hidden lg:block">Album</div>
              <div className="hidden md:block">Folder</div>
              <div className="hidden md:block text-center">File Type</div>
              <div className="hidden md:flex justify-end pr-2">Views</div>
              <div className="flex justify-end pr-2"><FiClock className="w-4 h-4" /></div>
            </div>
            <div className="divide-y divide-white/5 flex-1 overflow-y-auto">
              {visiblePlaylist.map((track, index) => (
                <div
                  key={track.path || index}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  onClick={(e) => handleRowClick(e, track, index)}
                  className={`relative grid grid-cols-[40px_1fr_56px] md:grid-cols-[40px_1fr_1fr_56px_72px_56px] lg:grid-cols-[40px_1fr_1fr_1fr_56px_72px_56px] gap-3 px-4 py-2 items-center cursor-pointer hover:bg-white/5 transition-colors ${index === currentIndex ? 'bg-white/10' : ''}`}
                >
                  {dropIndicator.index === index && (
                    <div className={`absolute left-2 right-2 ${dropIndicator.position === 'above' ? 'top-0' : 'bottom-0'} h-0.5 bg-[#b58dff] shadow-[0_0_0_2px_rgba(181,141,255,0.35)] rounded pointer-events-none`} />
                  )}
                  <div className="text-center text-white/60">
                    {index === currentIndex && isPlaying ? (<span className="inline-block w-2 h-2 rounded-full bg-[#b58dff] animate-pulse" />) : (index + 1)}
                  </div>

                  <div className="min-w-0 flex items-center gap-3">
                    <img src={buildThumbnailUrl(track, 'music')} onError={(e) => (e.currentTarget.src = DEFAULT_IMAGES.music)} alt={track.name} className="w-10 h-10 rounded object-cover flex-none" />
                    <div className="min-w-0">
                      <div className={`${index === currentIndex ? 'text-[#b58dff]' : 'text-white'} truncate`}>{track.name}</div>
                      <div className="text-xs text-white/60 truncate">{track.artist || 'Unknown Artist'}</div>
                    </div>
                  </div>

                  <div className="hidden lg:block text-sm text-white/70 truncate">{track.album || '—'}</div>

                  <div className="hidden md:block text-sm text-white/70 truncate">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const parentPath = (track.path || '').split('/').slice(0, -1).join('/');
                        if (parentPath) {
                          navigate(`/music?path=${encodeURIComponent(parentPath)}`);
                        } else {
                          navigate('/music');
                        }
                      }}
                      className="hover:underline hover:text-white"
                      title="Mở thư mục chứa"
                    >
                      {(() => {
                        const p = (track.path || '').split('/').slice(0, -1).join('/');
                        const name = p ? p.split('/').pop() : '';
                        return name || 'Home';
                      })()}
                    </button>
                  </div>

                  <div className="hidden md:block text-sm text-white/70 text-center">
                    {(() => {
                      const ext = track.path?.split('.').pop();
                      return ext ? `${ext.toLowerCase()}` : '—';
                    })()}
                  </div>

                  <div className="hidden md:flex items-center justify-end pr-2 text-white/70 tabular-nums">{Number(track.viewCount ?? track.views ?? 0).toLocaleString()}</div>

                  <div className="flex items-center justify-end gap-3 pr-2 text-white/70">
                    <span className="tabular-nums text-sm">{track.duration ? `${Math.floor(track.duration / 60)}:${String(Math.floor(track.duration % 60)).padStart(2, '0')}` : '—'}</span>
                  </div>
                </div>
              ))}

              {visiblePlaylist.length === 0 && (
                <div className="px-4 py-10 text-center text-white/60">Không có bài hát phù hợp</div>
              )}
            </div>
          </div>

          {/* Right: Playlists Library panel */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 200px)', minHeight: '400px' }}>
            <div className="px-4 py-3 text-[11px] uppercase tracking-wider text-white/60 border-b border-white/10 flex items-center justify-between">
              <span>Playlists</span>
              <span className="text-white/40 text-[11px] hidden md:inline">Playlists</span>
            </div>
            <div className="p-3">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 21L15.803 15.803M18 10.5C18 14.0899 15.0899 17 11.5 17C7.91015 17 5 14.0899 5 10.5C5 6.91015 7.91015 4 11.5 4C15.0899 4 18 6.91015 18 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <input placeholder="Tìm playlist" className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/10 text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-white/30" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-white/10">
              {library.loading && <div className="px-4 py-2 text-white/60 text-sm">Đang tải…</div>}
              {!library.loading && library.items.length === 0 && (
                <div className="px-4 py-8 text-white/60 text-sm">Chưa có playlist</div>
              )}
              {!library.loading && library.items.length > 0 && (
                <div className="px-2 space-y-1">
                  {library.items.map((pl) => (
                    <button
                      key={pl.id}
                      onClick={() => {
                        setActivePlaylistId(pl.id);
                        navigate('/music/player', { state: { kind: 'playlist', playlist: String(pl.id), key: sourceKey } });
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-left ${activePlaylistId === pl.id ? 'bg-white/10' : ''}`}
                      title={pl.name}
                    >
                      <img src={pl.thumbnail || DEFAULT_IMAGES.music} onError={(e) => (e.currentTarget.src = DEFAULT_IMAGES.music)} alt={pl.name} className="w-9 h-9 rounded object-cover" />
                      <div className="min-w-0">
                        <div className="text-sm text-white truncate">{pl.name}</div>
                        <div className="text-[11px] text-white/60 truncate">{new Date(pl.updatedAt || Date.now()).toLocaleDateString()}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
  </div>
      </div>

      {/* Bottom Controls replaced with PlayerFooter component */}
      <PlayerFooter
        audioRef={audioRef}
        currentTime={currentTime}
        duration={duration}
        formatTime={formatTime}
        handleSeek={handleSeek}
        handleVolumeBar={handleVolumeBar}
        prevOrderBeforeShuffleRef={prevOrderBeforeShuffleRef}
        theme="v2"
      />

      {/* Audio Element */}
      <audio ref={audioRef} preload="metadata" className="hidden" />

      {loading && <LoadingOverlay />}
    </div>
  );
};

export default MusicPlayerV2;
