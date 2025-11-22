// 📁 src/pages/music/MusicPlayer.jsx
// 🎵 Spotify-style Music Player với design đẹp và hiện đại (single-file implementation)

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlay,
  FiPause,
  FiHeart,
  FiMoreHorizontal,
  FiDownload,
  FiClock,
  FiSearch,
  FiPlus,
  FiTrash2
} from 'react-icons/fi';
import { useAuthStore, useMusicStore, useUIStore } from '@/store';
import { DEFAULT_IMAGES } from '@/constants';
import { useRecentMusicManager } from '@/hooks/useMusicData';
import { useDebounceValue } from '@/hooks';
import { apiService } from '@/utils/api';
import { buildThumbnailUrl } from '@/utils/thumbnailUtils';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import PlayerFooter from '../../components/music/PlayerFooter';
import PlayerHeader from '../../components/music/PlayerHeader';
import PlaylistSidebar from '../../components/music/PlaylistSidebar';
import FullPlayerModal from '../../components/music/FullPlayerModal';
import LyricsModal from '../../components/music/LyricsModal';
import MusicDownloadModal from '../../components/music/MusicDownloadModal';
import { musicDownloadQueue } from '@/utils/musicDownloadQueue';

const MusicPlayer = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
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
    setCurrentTrack,
    playTrack,
    pauseTrack,
    resumeTrack,
    nextTrack,
    prevTrack,
    setVolume,
    toggleShuffle,
    setRepeat,
    setShuffle,
    playerSettings,
    updatePlayerSettings
  } = useMusicStore();

  const { showToast } = useUIStore();
  const { sourceKey, setSourceKey } = useAuthStore();

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

  // Player states
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [playlistTitle, setPlaylistTitle] = useState(null);
  const [currentPlaylistId, setCurrentPlaylistId] = useState(null); // Track current playlist ID
  const [library, setLibrary] = useState({ items: [], loading: false, error: null });
  const [activePlaylistId, setActivePlaylistId] = useState(null);
  const [headerCondensed, setHeaderCondensed] = useState(false);
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [trackMetadata, setTrackMetadata] = useState(null);
  const headerSentinelRef = useRef(null);

  // Audio ref
  const audioRef = useRef(null);
  // Removed viewedTracksRef to allow counting on every playback start
  const latestTrackRef = useRef(null);
  const dragIndexRef = useRef(-1);
  const isDraggingRef = useRef(false);
  const [dropIndicator, setDropIndicator] = useState({ index: -1, position: 'above' });
  const prevOrderBeforeShuffleRef = useRef(null);

  // Selection states for multi-select
  const [selectedTracks, setSelectedTracks] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Helper: bump viewCount locally for UI sync
  const bumpViewCount = useCallback((songPath) => {
    if (!songPath) return;
    try {
      // Update Zustand state without restarting playback
      useMusicStore.setState((state) => {
        const idx = state.currentPlaylist.findIndex((t) => t.path === songPath);
        if (idx === -1) return {};
        const oldItem = state.currentPlaylist[idx] || {};
        const newCount = Number(oldItem.viewCount ?? oldItem.views ?? 0) + 1;
        const updatedItem = { ...oldItem, viewCount: newCount };
        const newPlaylist = [...state.currentPlaylist];
        newPlaylist[idx] = updatedItem;
        const isCurrent = state.currentTrack?.path === songPath;
        return {
          currentPlaylist: newPlaylist,
          currentTrack: isCurrent ? updatedItem : state.currentTrack,
        };
      });
    } catch {}
  }, []);

  // Row click handler to avoid re-triggering the same track (prevents view loop)
  const handleRowClick = useCallback((e, track, index) => {
    e?.preventDefault?.();
    if (isDraggingRef.current) {
      // Ignore click triggered by drag-drop
      return;
    }
    // If clicking the same track that's already selected
    if (currentTrack?.path === track.path && currentIndex === index) {
      // If paused, just resume without resetting src
      if (!isPlaying) {
        try {
          const audio = audioRef.current;
          if (audio) {
            const p = audio.play();
            if (p) p.catch(() => {});
          }
          resumeTrack();
        } catch {}
      }
      return; // Do nothing if already playing this track
    }
    // Different track -> start it normally
    playTrack(track, currentPlaylist, index);
  }, [currentTrack?.path, currentIndex, isPlaying, playTrack, currentPlaylist, resumeTrack]);

  // DnD handlers
  const handleDragStart = (index) => {
    dragIndexRef.current = index;
    isDraggingRef.current = true;
  };

  const handleDragOver = (e, overIndex) => {
    // Needed to allow drop
    e.preventDefault();
    if (!e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const position = y < rect.height / 2 ? 'above' : 'below';
    setDropIndicator({ index: overIndex, position });
  };

  const handleDragEnd = () => {
    // Allow click again shortly after drag
    setTimeout(() => {
      isDraggingRef.current = false;
      dragIndexRef.current = -1;
      setDropIndicator({ index: -1, position: 'above' });
    }, 0);
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    e.stopPropagation();
    const from = dragIndexRef.current;
    if (from === -1 || dropIndex === -1) {
      handleDragEnd();
      return;
    }

    // Determine insertion index based on indicator position
    let insertIndex = dropIndicator.position === 'below' ? dropIndex + 1 : dropIndex;
    if (from < insertIndex) insertIndex -= 1; // adjust for removal shift

    // Reorder playlist locally
    const prev = useMusicStore.getState().currentPlaylist;
    if (!Array.isArray(prev) || prev.length === 0) {
      handleDragEnd();
      return;
    }
    const updated = [...prev];
    const [moved] = updated.splice(from, 1);
    updated.splice(Math.max(0, Math.min(insertIndex, updated.length)), 0, moved);

    // Keep the current track selection
    const currTrack = useMusicStore.getState().currentTrack;
  const newIndex = currTrack ? Math.max(0, updated.findIndex((t) => t.path === currTrack.path)) : insertIndex;
    useMusicStore.setState({ currentPlaylist: updated, currentIndex: newIndex });

    // Persist only when this session is a playlist id
    try {
      const shuffledOn = useMusicStore.getState().shuffle;
      if (!shuffledOn && effectivePlaylist && isPlaylistId(effectivePlaylist) && sourceKey) {
        const body = {
          key: sourceKey,
          playlistId: Number(effectivePlaylist),
          order: updated.map((t) => t.path),
        };
        const res = await fetch('/api/music/playlist/order', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || 'Failed to save order');
        }
        showToast('Đã lưu thứ tự playlist', 'success');
      }
    } catch (err) {
      showToast('Không thể lưu thứ tự: ' + (err.message || 'Lỗi không rõ'), 'error');
    } finally {
      handleDragEnd();
    }
  };

  // Keep a ref of the latest track for event handlers
  useEffect(() => {
    latestTrackRef.current = currentTrack || null;
  }, [currentTrack]);

  // Increase view when playback starts (every time)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const lastIncRef = { path: '', ts: 0 };

    const handlePlay = async () => {
      const track = latestTrackRef.current;
      const trackPath = track?.path;
      if (!trackPath || !sourceKey) return;

      // Debounce duplicate play events for the same track within 1s
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
        if (res.ok) {
          bumpViewCount(trackPath);
        }
      } catch (err) {
        console.warn('Failed to increase music view count:', err);
      }
    };

    audio.addEventListener('play', handlePlay);
    return () => {
      audio.removeEventListener('play', handlePlay);
    };
  }, [sourceKey, bumpViewCount]);

  // Compute effective inputs (navigation state has priority, fallback to query params)
  const effectivePath = stateFile || path || null;
  const effectivePlaylist = statePlaylist ?? playlistPath ?? null; // allow ''
  const effectiveKind = stateKind || (effectivePlaylist && !String(effectivePlaylist).includes('/') ? 'playlist' : (effectivePath ? 'audio' : 'folder'));

  // ========= Helpers =========
  function buildAudioUrl(audioPath) {
    if (!audioPath || !sourceKey) return null;
    return `/api/music/audio?key=${sourceKey}&file=${encodeURIComponent(audioPath)}`;
  }

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

  const getTrackInfo = useCallback(() => {
    if (!effectivePath) return null;
    const fileName = effectivePath.split('/').pop();
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    return {
      name: nameWithoutExt,
      path: effectivePath,
      artist: 'Unknown Artist',
      album: normalizeAlbum('Unknown Album'),
      thumbnail: null,
    };
  }, [effectivePath]);

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

  const handleAddToPlaylist = () => {
    if (!currentTrack && selectedTracks.size === 0) {
      showToast('Chưa có bài hát nào được chọn', 'warning');
      return;
    }
    
    // If in selection mode, use selected tracks
    if (isSelectionMode && selectedTracks.size > 0) {
      const tracksToAdd = currentPlaylist.filter(track => selectedTracks.has(track.path));
      window.dispatchEvent(new CustomEvent('openPlaylistModal', { 
        detail: { items: tracksToAdd } 
      }));
    } else {
      // Default: add current track
      window.dispatchEvent(new CustomEvent('openPlaylistModal', { 
        detail: { item: currentTrack } 
      }));
    }
  };

  // Selection handlers
  const toggleSelectTrack = useCallback((trackPath) => {
    setSelectedTracks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trackPath)) {
        newSet.delete(trackPath);
      } else {
        newSet.add(trackPath);
      }
      return newSet;
    });
  }, []);

  const selectAllTracks = useCallback(() => {
    setSelectedTracks(new Set(currentPlaylist.map(t => t.path)));
  }, [currentPlaylist]);

  const clearSelection = useCallback(() => {
    setSelectedTracks(new Set());
    setIsSelectionMode(false);
  }, []);

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(prev => !prev);
    if (isSelectionMode) {
      setSelectedTracks(new Set());
    }
  }, [isSelectionMode]);

  const handleAddSelectedToPlaylist = useCallback(() => {
    if (selectedTracks.size === 0) {
      showToast('Chưa chọn bài hát nào', 'warning');
      return;
    }
    
    const tracksToAdd = currentPlaylist.filter(track => selectedTracks.has(track.path));
    window.dispatchEvent(new CustomEvent('openPlaylistModal', { 
      detail: { items: tracksToAdd } 
    }));
  }, [selectedTracks, currentPlaylist, showToast]);

  // Remove tracks from current playlist
  const handleRemoveFromPlaylist = useCallback(async (trackPath) => {
    if (!currentPlaylistId || !sourceKey) {
      showToast('Không thể xóa khỏi playlist', 'error');
      return;
    }

    try {
      const response = await fetch('/api/music/playlist/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: sourceKey,
          playlistId: currentPlaylistId,
          path: trackPath
        })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      // Update local state - remove track from current playlist
      const updatedPlaylist = currentPlaylist.filter(track => track.path !== trackPath);
      useMusicStore.setState({ 
        currentPlaylist: updatedPlaylist,
        // Update currentIndex if needed
        currentIndex: currentIndex >= updatedPlaylist.length ? Math.max(0, updatedPlaylist.length - 1) : currentIndex
      });

      showToast('Đã xóa khỏi playlist', 'success');
    } catch (err) {
      console.error('Remove from playlist error:', err);
      showToast('Không thể xóa khỏi playlist: ' + err.message, 'error');
    }
  }, [currentPlaylistId, sourceKey, currentPlaylist, currentIndex, showToast]);

  // Remove multiple selected tracks from playlist
  const handleRemoveSelectedFromPlaylist = useCallback(async () => {
    if (selectedTracks.size === 0) {
      showToast('Chưa chọn bài hát nào', 'warning');
      return;
    }

    if (!currentPlaylistId || !sourceKey) {
      showToast('Không thể xóa khỏi playlist', 'error');
      return;
    }

    try {
      const pathsToRemove = Array.from(selectedTracks);
      const response = await fetch('/api/music/playlist/remove-multiple', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: sourceKey,
          playlistId: currentPlaylistId,
          paths: pathsToRemove
        })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      // Update local state - remove selected tracks
      const updatedPlaylist = currentPlaylist.filter(track => !selectedTracks.has(track.path));
      const newCurrentIndex = currentTrack ? updatedPlaylist.findIndex(t => t.path === currentTrack.path) : -1;
      
      useMusicStore.setState({ 
        currentPlaylist: updatedPlaylist,
        currentIndex: newCurrentIndex >= 0 ? newCurrentIndex : Math.max(0, updatedPlaylist.length - 1)
      });

      // Clear selection and exit selection mode
      setSelectedTracks(new Set());
      setIsSelectionMode(false);

      showToast(`Đã xóa ${pathsToRemove.length} bài khỏi playlist`, 'success');
    } catch (err) {
      console.error('Remove multiple from playlist error:', err);
      showToast('Không thể xóa khỏi playlist: ' + err.message, 'error');
    }
  }, [selectedTracks, currentPlaylistId, sourceKey, currentPlaylist, currentTrack, showToast]);

  const handleDownload = async () => {
    // Open modal instead of direct download
    setIsDownloadModalOpen(true);
  };

  const handleDownloadConfirm = (tracks) => {
    if (!sourceKey) {
      showToast('Thiếu source key', 'error');
      return;
    }

    try {
      // Add tracks to download queue
      musicDownloadQueue.addToQueue(tracks, sourceKey);
      
      if (tracks.length === 1) {
        showToast('Đã thêm 1 bài hát vào hàng chờ tải!', 'success');
      } else {
        showToast(`Đã thêm ${tracks.length} bài hát vào hàng chờ tải!`, 'success');
      }
    } catch (err) {
      showToast('Không thể thêm vào hàng chờ: ' + err.message, 'error');
    }
  };

  // Detect scroll to condense top header like screenshot 2 (robust: IntersectionObserver + fallback)
  useEffect(() => {
    let observer;
    const node = headerSentinelRef.current;
    if ('IntersectionObserver' in window && node) {
      observer = new IntersectionObserver(
        ([entry]) => {
          // Condense when sentinel leaves viewport (minus the sticky header height)
          setHeaderCondensed(!entry.isIntersecting);
        },
        { root: null, threshold: 0, rootMargin: '-64px 0px 0px 0px' }
      );
      observer.observe(node);
    } else {
      const onScroll = () => {
        const y = window.scrollY || document.documentElement.scrollTop || 0;
        setHeaderCondensed(y > 80);
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
      return () => window.removeEventListener('scroll', onScroll);
    }
    return () => {
      if (observer) observer.disconnect();
    };
  }, []);

  // Shuffle and repeat functions moved to PlayerFooter component

  // ========= Data loading =========
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
      setCurrentPlaylistId(Number(playlistId)); // Save current playlist ID

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
          album: normalizeAlbum('Unknown Album'),
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

  const loadFolderSongs = async (folderPathArg, selectedFileArg) => {
    try {
      if (!sourceKey) {
        showToast('Thiếu source key', 'error');
        return;
      }

      // Clear playlist ID since we're loading folder, not playlist
      setCurrentPlaylistId(null);

      const folderPath = folderPathArg;
      const selectedPath = selectedFileArg;

      if ((folderPath === undefined || folderPath === null) && !selectedPath) {
        showToast('Thiếu thông tin file/folder', 'error');
        return;
      }

      // If folder not provided but we have a selected file, derive parent folder.
      // Important: allow '' (empty string) as ROOT path.
      const derivedParent = selectedPath ? selectedPath.split('/').slice(0, -1).join('/') : null; // '' at root
      const hasExplicitFolder = folderPath !== undefined && folderPath !== null;
      const folderToLoad = hasExplicitFolder ? folderPath : derivedParent;
      if (folderToLoad === null || folderToLoad === undefined) {
        showToast('Không thể xác định thư mục chứa bài hát', 'error');
        return;
      }

      const response = await apiService.music.getFolders({ key: sourceKey, path: folderToLoad });
      const audioFiles = (response.data?.folders || []).filter((i) => i.type === 'audio' || i.type === 'file');
      


      // Sort exactly like MusicHome to maintain consistent order
      const sortedAudioFiles = [...audioFiles].sort((a, b) => {
        // Folders first, then audio files
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;
        // Then sort by name alphabetically (case-insensitive)
        return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
      });

  

      const playlist = sortedAudioFiles.map((file) => ({
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
          album: normalizeAlbum('Unknown Album'),
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
            album: normalizeAlbum('Unknown Album'),
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

  // Load whenever inputs change
  useEffect(() => {
    // Route by explicit kind first to avoid folder/playlist confusion
    if (effectiveKind === 'playlist' && effectivePlaylist !== null && effectivePlaylist !== undefined && effectivePlaylist !== '') {
      return void loadPlaylistById(effectivePlaylist, effectivePath || null);
    }
    if (effectiveKind === 'folder') {
      return void loadFolderSongs(effectivePlaylist ?? '', effectivePath || null);
    }
    if (effectiveKind === 'audio' && effectivePath) {
      return void loadFolderSongs(null, effectivePath);
    }
    // Fallbacks
    if (effectivePlaylist !== null && effectivePlaylist !== undefined) {
      if (isPlaylistId(effectivePlaylist)) return void loadPlaylistById(effectivePlaylist, effectivePath || null);
      return void loadFolderSongs(effectivePlaylist ?? '', effectivePath || null);
    }
    if (effectivePath) return void loadFolderSongs(null, effectivePath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveKind, effectivePlaylist, effectivePath, sourceKey]);

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
    // Only update src if changed
    if (audio.src !== window.location.origin + audioUrl) {
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
  const isFav = (t) => false; // Music doesn't have favorites system
  const folderTitle = (() => {
    if (effectivePlaylist) {
      if (isPlaylistId(effectivePlaylist)) return playlistTitle || `Playlist #${effectivePlaylist}`;
      return String(effectivePlaylist).split('/').pop();
    }
    if (effectivePath) {
      const parts = effectivePath.split('/');
      parts.pop();
      return parts.pop() || 'Now Playing';
    }
    return 'Now Playing';
  })();
  const headerArt = (currentTrack || currentPlaylist[0])
    ? buildThumbnailUrl(currentTrack || currentPlaylist[0], 'music')
    : DEFAULT_IMAGES.music;

  const normalizedFilter = '';
  const visiblePlaylist = currentPlaylist;

  // Load metadata for current track
  useEffect(() => {
    const loadMetadata = async () => {
      if (!currentTrack?.path || !sourceKey) {
        setTrackMetadata(null);
        return;
      }
      
      try {
        const response = await fetch(`/api/music/music-meta?key=${encodeURIComponent(sourceKey)}&path=${encodeURIComponent(currentTrack.path)}`);
        if (response.ok) {
          const metadata = await response.json();
          setTrackMetadata(metadata);
        } else {
          setTrackMetadata(null);
        }
      } catch (err) {
        console.warn('Failed to load track metadata:', err);
        setTrackMetadata(null);
      }
    };
    
    loadMetadata();
  }, [currentTrack?.path, sourceKey]);

  // Load user playlists for Library
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1f1f1f] via-[#121212] to-[#000] text-white">
      {/* Top Controls with centered search (sticky + condense on scroll) */}
      <PlayerHeader
        folderTitle={folderTitle}
        headerCondensed={headerCondensed}
        theme="v1"
      />

  {/* Sentinel for header condense detection */}
  <div ref={headerSentinelRef} aria-hidden className="h-0" />

  {/* Main layout: left Library sidebar, right content with header + bottom tracklist */}
  <div className="px-4 sm:px-6 mt-1 pb-[104px] grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 items-start">
        {/* Left: Library sidebar - replaced with PlaylistSidebar component */}
        <PlaylistSidebar 
          library={library}
          activePlaylistId={activePlaylistId}
          setActivePlaylistId={setActivePlaylistId}
          sourceKey={sourceKey}
        />

  {/* Right: Header banner and actions */}
  <div className="relative ml-1">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#50306e] via-transparent to-transparent opacity-60" />
          <div className="bg-gradient-to-b from-[#121212] via-[#121212]/95 to-transparent -mx-4 px-4 pt-1 pb-3">
            <div className="flex flex-col md:flex-row md:items-end gap-6">
            {/* Căn giữa ảnh cover trên mobile - Click to open lyrics */}
            <motion.img 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.4 }} 
              src={headerArt} 
              alt={(currentTrack?.name || currentPlaylist[0]?.name || folderTitle) || 'Cover'} 
              onError={(e) => (e.currentTarget.src = DEFAULT_IMAGES.music)} 
              className="w-48 h-48 md:w-56 md:h-56 object-cover rounded shadow-2xl mx-auto md:mx-0 cursor-pointer hover:scale-[1.02] transition-transform" 
              onClick={() => setIsLyricsOpen(true)}
              title="Click để xem lời bài hát"
            />
            <div className="flex-1 min-w-0">
              {/* Tên file (không extension) - font bé hơn, không uppercase */}
              <h2
                className="text-xl md:text-2xl font-bold tracking-normal mt-2 leading-tight cursor-pointer hover:opacity-80 active:opacity-60 transition-opacity lg:cursor-default lg:hover:opacity-100 lg:active:opacity-100"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
                title="Click để mở Full Player (mobile/tablet)"
                onClick={() => {
                  // Mobile and tablet: Click filename to open full player
                  const isMobileOrTablet = window.innerWidth <= 1024;
                  if (isMobileOrTablet) {
                    console.log('🎵 Opening Full Player from filename click');
                    setIsFullPlayerOpen(true);
                  }
                }}
              >
                {currentTrack?.name || (currentTrack?.path ? currentTrack.path.split('/').pop()?.replace(/\.[^/.]+$/, '') : folderTitle || 'NOW PLAYING')}
              </h2>
              
              {/* Thông tin metadata - tất cả trên 1 dòng và có thể click để copy */}
              <div className="mt-2 text-white/80 text-sm space-y-1">
                {/* Title - có thể click để copy */}
                {trackMetadata?.title && !shouldHideField(trackMetadata.title) && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold flex-shrink-0">Title:</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(trackMetadata.title);
                        showToast('Đã copy title!', 'success');
                      }}
                      className="hover:underline hover:text-white transition-colors truncate text-left"
                      title="Click để copy title"
                    >
                      {trackMetadata.title}
                    </button>
                  </div>
                )}
                
                {/* Folder - có thể click để navigate */}
                <div className="flex items-center gap-2">
                  <span className="font-semibold flex-shrink-0">Folder:</span>
                  <button
                    onClick={() => {
                      const parentPath = (currentTrack?.path || '').split('/').slice(0, -1).join('/');
                      if (parentPath) {
                        navigate(`/music?path=${encodeURIComponent(parentPath)}`);
                      } else {
                        navigate('/music');
                      }
                    }}
                    className="hover:underline hover:text-white transition-colors truncate text-left"
                    title="Mở thư mục chứa"
                  >
                    {(() => {
                      const p = (currentTrack?.path || '').split('/').slice(0, -1).join('/');
                      const name = p ? p.split('/').pop() : '';
                      return name || 'Home';
                    })()}
                  </button>
                </div>
                
                {/* Album - có thể click để copy */}
                {(() => {
                  const albumValue = normalizeAlbum(trackMetadata?.album || currentTrack?.album);
                  return !shouldHideField(albumValue) ? (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold flex-shrink-0">Album:</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(albumValue);
                          showToast('Đã copy album!', 'success');
                        }}
                        className="hover:underline hover:text-white transition-colors truncate text-left"
                        title="Click để copy album"
                      >
                        {albumValue}
                      </button>
                    </div>
                  ) : null;
                })()}
                
                {/* Artist - từ metadata hoặc currentTrack, có thể click để copy */}
                {(() => {
                  const artistValue = trackMetadata?.artist || currentTrack?.artist || 'Unknown Artist';
                  return !shouldHideField(artistValue) ? (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold flex-shrink-0">Artist:</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(artistValue);
                          showToast('Đã copy artist!', 'success');
                        }}
                        className="hover:underline hover:text-white transition-colors truncate text-left"
                        title="Click để copy artist"
                      >
                        {artistValue}
                      </button>
                    </div>
                  ) : null;
                })()}
              </div>
              
              {/* Stats info */}
              <div className="mt-4 text-white/80 text-sm flex flex-wrap items-center gap-2">
                <span className="whitespace-nowrap">{currentPlaylist.length} {currentPlaylist.length === 1 ? 'song' : 'songs'}</span>
                <span className="w-1 h-1 rounded-full bg-white/40" />
                <span className="whitespace-nowrap">{Number(currentTrack?.viewCount ?? currentTrack?.views ?? 0).toLocaleString()} Plays</span>
                {/* Genre info from metadata */}
                {trackMetadata?.genre && !shouldHideField(trackMetadata.genre) && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-white/40" />
                    <span className="whitespace-nowrap">{trackMetadata.genre}</span>
                  </>
                )}
              </div>
              <div className="mt-6 flex items-center gap-4">
                <button onClick={togglePlayPause} className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-400 text-black flex items-center justify-center shadow-lg" aria-label="Play">
                  {isPlaying ? <FiPause className="w-7 h-7" /> : <FiPlay className="w-7 h-7 ml-0.5" />}
                </button>
                <button 
                  onClick={handleAddToPlaylist}
                  className="p-3 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  title="Thêm vào playlist"
                >
                  <FiHeart className="w-6 h-6" />
                </button>
                <button 
                  onClick={handleDownload}
                  className="p-3 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  title="Tải xuống"
                >
                  <FiDownload className="w-6 h-6" />
                </button>
                <button 
                  onClick={toggleSelectionMode}
                  className={`p-3 rounded-full transition-colors ${isSelectionMode ? 'bg-green-500 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                  title={isSelectionMode ? "Thoát chế độ chọn" : "Chọn nhiều bài"}
                >
                  <FiPlus className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
          </div>
          {/* Selection toolbar - shown when in selection mode */}
          {isSelectionMode && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-4 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 flex flex-wrap items-center justify-center gap-3"
            >
              <div className="flex items-center gap-2 text-white/90">
                <span className="font-semibold">
                  {selectedTracks.size === 0 
                    ? 'Select tracks to add to playlist' 
                    : `Selected ${selectedTracks.size} tracks`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAllTracks}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
                >
                  All
                </button>
                <button
                  onClick={clearSelection}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
                >
                  Clear CB
                </button>
                <button
                  onClick={handleAddSelectedToPlaylist}
                  disabled={selectedTracks.size === 0}
                  className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-400 disabled:bg-gray-500 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
                >
                 Add
                </button>
                {/* Remove from playlist button - only show when viewing a playlist */}
                {currentPlaylistId && (
                  <button
                    onClick={handleRemoveSelectedFromPlaylist}
                    disabled={selectedTracks.size === 0}
                    className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-400 disabled:bg-gray-500 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            </motion.div>
          )}
          {/* Bottom: Full tracklist */}
          <div className="mt-4 mb-0.5 rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 420px)', minHeight: '300px' }}>
            <div className={`grid ${
              isSelectionMode 
                ? currentPlaylistId 
                  ? 'grid-cols-[40px_40px_1fr_56px_40px] md:grid-cols-[40px_40px_1fr_1fr_56px_72px_56px_40px] lg:grid-cols-[40px_40px_1fr_1fr_1fr_56px_72px_56px_40px]'
                  : 'grid-cols-[40px_40px_1fr_56px] md:grid-cols-[40px_40px_1fr_1fr_56px_72px_56px] lg:grid-cols-[40px_40px_1fr_1fr_1fr_56px_72px_56px]'
                : currentPlaylistId
                  ? 'grid-cols-[40px_1fr_56px_40px] md:grid-cols-[40px_1fr_1fr_56px_72px_56px_40px] lg:grid-cols-[40px_1fr_1fr_1fr_56px_72px_56px_40px]'
                  : 'grid-cols-[40px_1fr_56px] md:grid-cols-[40px_1fr_1fr_56px_72px_56px] lg:grid-cols-[40px_1fr_1fr_1fr_56px_72px_56px]'
            } gap-3 px-4 py-2 text-sm text-white/60 border-b border-white/10`}>
              {isSelectionMode && <div className="text-center">✓</div>}
              <div className="text-center">#</div>
              <div>Title</div>
              <div className="hidden lg:block">Album</div>
              <div className="hidden md:block">Folder</div>
              <div className="hidden md:block text-center">Format</div>
              <div className="hidden md:flex justify-end pr-2">Views</div>
              <div className="flex justify-end pr-2"><FiClock className="w-4 h-4" /></div>
              {currentPlaylistId && <div className="text-center">Action</div>}
            </div>

    <div className="divide-y divide-white/5 flex-1 overflow-y-auto">
              {currentPlaylist.map((track, index) => {
                const isSelected = selectedTracks.has(track.path);
                return (
                <div
                  key={track.path || index}
                  draggable={!isSelectionMode}
                  onDragStart={() => !isSelectionMode && handleDragStart(index)}
                  onDragOver={(e) => !isSelectionMode && handleDragOver(e, index)}
                  onDrop={(e) => !isSelectionMode && handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  onClick={(e) => {
                    if (isSelectionMode) {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleSelectTrack(track.path);
                    } else {
                      handleRowClick(e, track, index);
                    }
                  }}
      className={`relative grid ${
        isSelectionMode 
          ? currentPlaylistId 
            ? 'grid-cols-[40px_40px_1fr_56px_40px] md:grid-cols-[40px_40px_1fr_1fr_56px_72px_56px_40px] lg:grid-cols-[40px_40px_1fr_1fr_1fr_56px_72px_56px_40px]'
            : 'grid-cols-[40px_40px_1fr_56px] md:grid-cols-[40px_40px_1fr_1fr_56px_72px_56px] lg:grid-cols-[40px_40px_1fr_1fr_1fr_56px_72px_56px]'
          : currentPlaylistId
            ? 'grid-cols-[40px_1fr_56px_40px] md:grid-cols-[40px_1fr_1fr_56px_72px_56px_40px] lg:grid-cols-[40px_1fr_1fr_1fr_56px_72px_56px_40px]'
            : 'grid-cols-[40px_1fr_56px] md:grid-cols-[40px_1fr_1fr_56px_72px_56px] lg:grid-cols-[40px_1fr_1fr_1fr_56px_72px_56px]'
      } gap-3 px-4 py-2 items-center cursor-pointer hover:bg-white/5 transition-colors ${index === currentIndex ? 'bg-white/10' : ''} ${isSelected ? 'bg-green-500/20' : ''}`}
                >
                  {dropIndicator.index === index && !isSelectionMode && (
                    <div className={`absolute left-2 right-2 ${dropIndicator.position === 'above' ? 'top-0' : 'bottom-0'} h-0.5 bg-emerald-400 shadow-[0_0_0_2px_rgba(16,185,129,0.35)] rounded pointer-events-none`} />
                  )}
                  {isSelectionMode && (
                    <div 
                      className="text-center flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectTrack(track.path);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // Controlled by parent div onClick
                        onClick={(e) => e.stopPropagation()}
                        className="w-5 h-5 rounded border-2 border-white/30 bg-white/10 checked:bg-green-500 checked:border-green-500 cursor-pointer transition-colors"
                      />
                    </div>
                  )}
                  <div className="text-center text-white/60">
                    {index === currentIndex && isPlaying ? (<span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />) : (index + 1)}
                  </div>

                  <div className="min-w-0 flex items-center gap-3">
                    <img src={buildThumbnailUrl(track, 'music')} onError={(e) => (e.currentTarget.src = DEFAULT_IMAGES.music)} alt={track.name} className="w-10 h-10 rounded object-cover flex-none" />
                    <div className="min-w-0">
                      <div className={`${index === currentIndex ? 'text-green-400' : 'text-white'} truncate`}>{track.name}</div>
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
                    <span className="tabular-nums text-sm">{track.duration ? formatTime(track.duration) : '—'}</span>
                  </div>

                  {/* Action button - only show when viewing a playlist */}
                  {currentPlaylistId && (
                    <div className="flex items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFromPlaylist(track.path);
                        }}
                        className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors"
                        title="Xóa khỏi playlist"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )})}

              {currentPlaylist.length === 0 && (
                <div className="px-4 py-10 text-center text-white/60">Chưa có danh sách phát. Hãy chọn một bài để bắt đầu.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom player bar replaced with PlayerFooter component */}
      <PlayerFooter
        audioRef={audioRef}
        currentTime={currentTime}
        duration={duration}
        formatTime={formatTime}
        handleSeek={handleSeek}
        handleVolumeBar={handleVolumeBar}
        prevOrderBeforeShuffleRef={prevOrderBeforeShuffleRef}
        onOpenFullPlayer={() => setIsFullPlayerOpen(true)}
        theme="v1"
      />

      {/* Full Player Modal (Spotify-style) */}
      <FullPlayerModal
        isOpen={isFullPlayerOpen}
        onClose={() => setIsFullPlayerOpen(false)}
        audioRef={audioRef}
        currentTime={currentTime}
        duration={duration}
        formatTime={formatTime}
        handleSeek={handleSeek}
        handleVolumeBar={handleVolumeBar}
        prevOrderBeforeShuffleRef={prevOrderBeforeShuffleRef}
        trackMetadata={trackMetadata}
        theme="v1"
      />

      {/* Lyrics Modal - Shared with FullPlayerModal */}
      <LyricsModal
        isOpen={isLyricsOpen}
        onClose={() => setIsLyricsOpen(false)}
        currentTrack={{ ...currentTrack, ...trackMetadata }}
      />

      {/* Download Options Modal */}
      <MusicDownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        currentTrack={currentTrack}
        currentPlaylist={currentPlaylist}
        onDownload={handleDownloadConfirm}
      />

      {/* Audio Element */}
      <audio ref={audioRef} preload="metadata" className="hidden" />

      {loading && <LoadingOverlay />}
    </div>
  );
};

export default MusicPlayer;
