// 📁 src/pages/music/MusicPlayer.jsx
// 🎵 Spotify-style Music Player với design đẹp và hiện đại (single-file implementation)

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  FiClock,
  FiLayout,
  FiSearch
} from 'react-icons/fi';
import { useAuthStore, useMusicStore, useUIStore } from '@/store';
import { useRecentMusicManager } from '@/hooks/useMusicData';
import { useDebounceValue } from '@/hooks';
import { apiService } from '@/utils/api';
import { buildThumbnailUrl } from '@/utils/thumbnailUtils';
import LoadingOverlay from '@/components/common/LoadingOverlay';

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
    toggleFavorite,
    favorites,
    setCurrentTrack,
    playTrack,
    pauseTrack,
    resumeTrack,
    nextTrack,
    prevTrack,
    setVolume,
    playerSettings,
    updatePlayerSettings
  } = useMusicStore();

  const { showToast } = useUIStore();
  const { sourceKey, setSourceKey } = useAuthStore();

  // Prefer key from navigation state if provided, else default to M_MUSIC
  useEffect(() => {
    if (stateKey && sourceKey !== stateKey) {
      setSourceKey(stateKey);
    } else if (!sourceKey || sourceKey === 'ROOT_FANTASY') {
      setSourceKey('M_MUSIC');
    }
  }, [stateKey, sourceKey, setSourceKey]);

  const { addRecentMusic } = useRecentMusicManager();

  // Player states
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [playlistTitle, setPlaylistTitle] = useState(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchWrapRef = useRef(null);
  const suggestionsListRef = useRef(null);
  const searchAbortRef = useRef(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchLoadingMore, setSearchLoadingMore] = useState(false);
  const [searchOffset, setSearchOffset] = useState(0);
  const [searchHasMore, setSearchHasMore] = useState(false);
  const SEARCH_LIMIT = 30;
  const [library, setLibrary] = useState({ items: [], loading: false, error: null });
  const [activePlaylistId, setActivePlaylistId] = useState(null);
  const [headerCondensed, setHeaderCondensed] = useState(false);
  const headerSentinelRef = useRef(null);

  // Audio ref
  const audioRef = useRef(null);
  // Removed viewedTracksRef to allow counting on every playback start
  const latestTrackRef = useRef(null);
  const dragIndexRef = useRef(-1);
  const isDraggingRef = useRef(false);
  const [dropIndicator, setDropIndicator] = useState({ index: -1, position: 'above' });
  const prevOrderBeforeShuffleRef = useRef(null);

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

  // Close search suggestions when clicking outside
  useEffect(() => {
    const onDocClick = (e) => {
      if (!searchWrapRef.current) return;
      if (!searchWrapRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
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

  const getTrackInfo = useCallback(() => {
    if (!effectivePath) return null;
    const fileName = effectivePath.split('/').pop();
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    return {
      name: nameWithoutExt,
      path: effectivePath,
      artist: 'Unknown Artist',
      album: 'Unknown Album',
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

  const loadFolderSongs = async (folderPathArg, selectedFileArg) => {
    try {
      if (!sourceKey) {
        showToast('Thiếu source key', 'error');
        return;
      }

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
  const isFav = (t) => favorites.some((f) => f.path === t.path);
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
    : '/default/music-thumb.png';

  const normalizedFilter = (filterQuery || '').trim().toLowerCase();
  const visiblePlaylist = normalizedFilter
    ? currentPlaylist.filter((t) => {
        const fields = [t?.name, t?.artist, t?.album, t?.path].filter(Boolean).join(' ').toLowerCase();
        return fields.includes(normalizedFilter);
      })
    : currentPlaylist;
  // Debounced query for API suggestions
  const debouncedQuery = useDebounceValue(filterQuery, 300);

  // Fetch suggestions from API (like SearchModal)
  const fetchSuggestions = useCallback(async (q, pageOffset = 0, isLoadMore = false) => {
    if (!q || q.trim().length < 2 || !sourceKey) return { items: [], hasMore: false };
    // cancel previous unless loading more
    let controller;
    if (!isLoadMore) {
      if (searchAbortRef.current) searchAbortRef.current.abort();
      controller = new AbortController();
      searchAbortRef.current = controller;
    }
    try {
      if (isLoadMore) setSearchLoadingMore(true); else setSearchLoading(true);
      const resp = await apiService.music.getAudioCache({
        mode: 'search',
        key: sourceKey,
        q,
        type: 'all',
        limit: SEARCH_LIMIT,
        offset: pageOffset,
      }, isLoadMore ? {} : { signal: controller?.signal });
      const items = resp?.data?.folders || [];
      return { items, hasMore: items.length === SEARCH_LIMIT };
    } catch (err) {
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
        console.error('Player search error:', err);
      }
      return { items: [], hasMore: false };
    } finally {
      if (isLoadMore) setSearchLoadingMore(false); else setSearchLoading(false);
    }
  }, [SEARCH_LIMIT, sourceKey]);

  // Load suggestions when query changes
  useEffect(() => {
    if (!searchOpen) return; // only fetch when dropdown open
    if (!debouncedQuery || debouncedQuery.trim().length < 2) {
      setSearchResults([]);
      setSearchOffset(0);
      setSearchHasMore(false);
      return;
    }
    const run = async () => {
      const { items, hasMore } = await fetchSuggestions(debouncedQuery, 0, false);
      setSearchResults(items);
      setSearchOffset(items.length);
      setSearchHasMore(hasMore);
    };
    run();
  }, [debouncedQuery, searchOpen, fetchSuggestions]);

  // Infinite scroll inside suggestions
  const handleSuggestionsScroll = useCallback(async () => {
    const el = suggestionsListRef.current;
    if (!el || searchLoading || searchLoadingMore || !searchHasMore) return;
    const threshold = 80;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - threshold) {
      const { items, hasMore } = await fetchSuggestions(debouncedQuery, searchOffset, true);
      if (items.length > 0) {
        setSearchResults((prev) => [...prev, ...items]);
        setSearchOffset(searchOffset + items.length);
        setSearchHasMore(hasMore);
      } else {
        setSearchHasMore(false);
      }
    }
  }, [debouncedQuery, fetchSuggestions, searchHasMore, searchLoading, searchLoadingMore, searchOffset]);

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
      <div
        className={`sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 ${headerCondensed ? 'py-2' : 'py-4'} gap-3 backdrop-blur border-b border-white/10 transition-[background-color,box-shadow,padding] duration-200 ${
          headerCondensed ? 'bg-[#121212]/95 shadow-[0_2px_10px_rgba(0,0,0,0.35)]' : 'bg-[#121212]/70'
        }`}
      >
        {/* Left controls: nav + mode + home */}
        <div className="flex items-center gap-2 min-w-[220px]">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-white/10 hover:bg-white/20"><FiChevronLeft className="w-5 h-5" /></button>
          <button onClick={() => navigate(1)} className="p-2 rounded-full bg-white/10 hover:bg-white/20"><FiChevronRight className="w-5 h-5" /></button>
          {(() => {
            const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
            const isMobile = /Mobi|Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (typeof window !== 'undefined' && window.innerWidth <= 768);
            return (
              <button
                onClick={() => {
                  if (isMobile) return;
                  const next = playerSettings?.playerUI === 'v2' ? 'v1' : 'v2';
                  updatePlayerSettings({ playerUI: next });
                  navigate('/music/player', { replace: true, state: location.state });
                }}
                className={`px-3 py-1.5 rounded-full ${isMobile ? 'bg-white/10 text-white/60 cursor-not-allowed' : 'bg-white/10 hover:bg-white/20 text-white'} text-sm hidden md:flex items-center gap-2`}
                title={isMobile ? 'Không khả dụng trên mobile' : 'Đổi giao diện Music Player'}
                disabled={isMobile}
              >
                <FiLayout className="w-4 h-4" /> {playerSettings?.playerUI === 'v2' ? 'Zing' : 'Spotify'}
              </button>
            );
          })()}
          <button onClick={() => navigate('/music')} className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-sm hidden sm:inline-flex">
            <FiHome className="inline w-4 h-4 mr-1" /> Music Home
          </button>
          {headerCondensed && (
            <span className="ml-2 hidden md:inline text-white font-semibold truncate max-w-[40vw]">
              {folderTitle}
            </span>
          )}
        </div>

        {/* Center search */}
        <div className="flex-1 max-w-2xl mx-auto w-full" ref={searchWrapRef}>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 w-4 h-4" />
            <input
              value={filterQuery}
              onChange={(e) => {
                const v = e.target.value;
                setFilterQuery(v);
                setSearchOpen(v.trim().length >= 2);
              }}
              onFocus={() => setSearchOpen((v) => v || filterQuery.trim().length >= 2)}
              placeholder="Bạn muốn phát gì?"
              className="w-full pl-9 pr-3 py-2 rounded-full bg-white/10 text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-white/30"
            />
            {/* Suggestions dropdown (like SearchModal) */}
            <AnimatePresence>
              {searchOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50"
                >
                  <div className="max-h-80 overflow-y-auto" ref={suggestionsListRef} onScroll={handleSuggestionsScroll}>
                    {searchLoading && (
                      <div className="p-3 text-sm text-white/60">Đang tìm kiếm…</div>
                    )}
                    {!searchLoading && searchResults.map((item, i) => (
                      <div
                        key={(item.path || '') + '-' + i}
                        className="flex items-center gap-3 p-3 hover:bg-white/10 cursor-pointer"
                        onClick={() => {
                          setSearchOpen(false);
                          // Navigate similar to SearchModal behavior
                          const isPlaylist = item.isPlaylist;
                          const isAudio = item.type === 'audio' || item.type === 'file';
                          if (isPlaylist) {
                            navigate('/music/player', { state: { kind: 'playlist', playlist: item.path, key: sourceKey } });
                          } else if (isAudio) {
                            const folderPath = item.path?.split('/').slice(0, -1).join('/') || '';
                            navigate('/music/player', { state: { kind: 'audio', file: item.path, playlist: folderPath, key: sourceKey } });
                          } else {
                            navigate('/music/player', { state: { kind: 'folder', playlist: item.path, key: sourceKey } });
                          }
                        }}
                      >
                        <img
                          src={buildThumbnailUrl(item, 'music')}
                          onError={(e) => (e.currentTarget.src = '/default/music-thumb.png')}
                          alt={item.name}
                          className="w-8 h-8 rounded object-cover flex-none"
                        />
                        <div className="min-w-0">
                          <div className="text-sm text-white truncate" title={item.name}>{item.name}</div>
                          <div className="text-[11px] text-white/60 truncate" title={item.artist || ''}>{item.artist || ''}</div>
                        </div>
                      </div>
                    ))}
                    {searchLoadingMore && (
                      <div className="p-3 text-center text-xs text-white/60">Đang tải thêm…</div>
                    )}
                    {!searchLoading && searchResults.length === 0 && (
                      <div className="p-3 text-sm text-white/60">Không tìm thấy kết quả</div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right spacer */}
        <div className="min-w-[120px]" />
      </div>

  {/* Sentinel for header condense detection */}
  <div ref={headerSentinelRef} aria-hidden className="h-0" />

  {/* Main layout: left Library sidebar, right content with header + bottom tracklist */}
  <div className="px-4 sm:px-6 mt-1 pb-[100px] grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 items-start">
        {/* Left: Library sidebar */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] h-[60vh] md:h-[72vh] flex flex-col">
          <div className="px-4 py-3 text-xs uppercase tracking-wider text-white/60 border-b border-white/10 flex items-center justify-between">
            <span>Thư viện</span>
            <span className="text-white/40 text-[11px]">Playlists</span>
          </div>
          <div className="p-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 w-4 h-4" />
              <input placeholder="Tìm playlist" className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/10 text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-white/30" />
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
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-left ${activePlaylistId === pl.id ? 'bg-white/10' : ''}`}
                    title={pl.name}
                  >
                    <img src={pl.thumbnail || '/default/music-thumb.png'} onError={(e) => (e.currentTarget.src = '/default/music-thumb.png')} alt={pl.name} className="w-9 h-9 rounded object-cover" />
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

  {/* Right: Header banner and actions */}
  <div className="relative ml-1">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#50306e] via-transparent to-transparent opacity-60" />
          <div className="flex flex-col md:flex-row md:items-end gap-6">
            <motion.img initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} src={headerArt} alt={(currentTrack?.name || currentPlaylist[0]?.name || folderTitle) || 'Cover'} onError={(e) => (e.currentTarget.src = '/default/music-thumb.png')} className="w-48 h-48 md:w-56 md:h-56 object-cover rounded shadow-2xl" />
            <div className="flex-1">
              <h2
                className="text-3xl md:text-5xl font-extrabold tracking-tight mt-2 leading-tight"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
                title={currentTrack?.album || folderTitle || 'NOW PLAYING'}
              >
                {currentTrack?.album?.toUpperCase?.() || folderTitle?.toUpperCase?.() || 'NOW PLAYING'}
              </h2>
              <div className="mt-4 text-white/80 text-sm flex items-center gap-2">
                <span
                  className="min-w-0 max-w-[300px] flex items-baseline gap-1"
                  title={currentTrack?.artist || 'Unknown Artist'}
                >
                  <span className="font-semibold flex-none">Artist:</span>
                  <span className="truncate whitespace-nowrap">{currentTrack?.artist || 'Unknown Artist'}</span>
                </span>
                <span className="w-1 h-1 rounded-full bg-white/40" />
                <span>{currentPlaylist.length} {currentPlaylist.length === 1 ? 'song' : 'songs'}</span>
                <span className="w-1 h-1 rounded-full bg-white/40" />
                <span>{Number(currentTrack?.viewCount ?? currentTrack?.views ?? 0).toLocaleString()} Plays</span>
              </div>
              <div className="mt-6 flex items-center gap-4">
                <button onClick={togglePlayPause} className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-400 text-black flex items-center justify-center shadow-lg" aria-label="Play">
                  {isPlaying ? <FiPause className="w-7 h-7" /> : <FiPlay className="w-7 h-7 ml-0.5" />}
                </button>
                {currentTrack && (
                  <button onClick={() => toggleFavorite(currentTrack)} className={`p-3 rounded-full transition-colors ${isFav(currentTrack) ? 'text-green-400' : 'text-white/70 hover:text-white'}`}>
                    <FiHeart className="w-6 h-6" />
                  </button>
                )}
                <button className="p-3 rounded-full text-white/70 hover:text-white"><FiDownload className="w-6 h-6" /></button>
                <button className="p-3 rounded-full text-white/70 hover:text-white"><FiMoreHorizontal className="w-6 h-6" /></button>
              </div>
            </div>
          </div>
          {/* Bottom: Full tracklist */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
            <div className="grid grid-cols-[40px_1fr_56px] md:grid-cols-[40px_1fr_1fr_72px_56px] lg:grid-cols-[40px_1fr_1fr_1fr_72px_56px] gap-3 px-4 py-2 text-sm text-white/60 border-b border-white/10">
              <div className="text-center">#</div>
              <div>Title</div>
              <div className="hidden lg:block">Album</div>
              <div className="hidden md:block">Folder</div>
              <div className="hidden md:flex justify-end pr-2">Views</div>
              <div className="flex justify-end pr-2"><FiClock className="w-4 h-4" /></div>
            </div>

    <div className="divide-y divide-white/5">
              {currentPlaylist.map((track, index) => (
                <div
                  key={track.path || index}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  onClick={(e) => handleRowClick(e, track, index)}
      className={`relative grid grid-cols-[40px_1fr_56px] md:grid-cols-[40px_1fr_1fr_72px_56px] lg:grid-cols-[40px_1fr_1fr_1fr_72px_56px] gap-3 px-4 py-2 items-center cursor-pointer hover:bg-white/5 transition-colors ${index === currentIndex ? 'bg-white/10' : ''}`}
                >
                  {dropIndicator.index === index && (
                    <div className={`absolute left-2 right-2 ${dropIndicator.position === 'above' ? 'top-0' : 'bottom-0'} h-0.5 bg-emerald-400 shadow-[0_0_0_2px_rgba(16,185,129,0.35)] rounded pointer-events-none`} />
                  )}
                  <div className="text-center text-white/60">
                    {index === currentIndex && isPlaying ? (<span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />) : (index + 1)}
                  </div>

                  <div className="min-w-0 flex items-center gap-3">
                    <img src={buildThumbnailUrl(track, 'music')} onError={(e) => (e.currentTarget.src = '/default/music-thumb.png')} alt={track.name} className="w-10 h-10 rounded object-cover flex-none" />
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

                  <div className="hidden md:flex items-center justify-end pr-2 text-white/70 tabular-nums">{Number(track.viewCount ?? track.views ?? 0).toLocaleString()}</div>

                  <div className="flex items-center justify-end gap-3 pr-2 text-white/70">
                    <span className="tabular-nums text-sm">{track.duration ? formatTime(track.duration) : '—'}</span>
                  </div>
                </div>
              ))}

              {currentPlaylist.length === 0 && (
                <div className="px-4 py-10 text-center text-white/60">Chưa có danh sách phát. Hãy chọn một bài để bắt đầu.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom player bar */}
  <div className="fixed bottom-0 left-0 right-0 h-[100px] bg-[#121212] z-50 backdrop-blur border-t border-white/10">
        {/* Use a 3-column grid so center controls stay centered and sides truncate */}
        <div className="h-full px-4 md:px-6 pt-1 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(320px,720px)_minmax(0,1fr)] items-center gap-4">
          {/* Now playing (Left) */}
          <div className="hidden md:flex items-center gap-3 min-w-0 overflow-hidden justify-self-start">
            {currentTrack ? (
              <>
                <img
                  src={buildThumbnailUrl(currentTrack, 'music') || '/default/music-thumb.png'}
                  onError={(e) => (e.currentTarget.src = '/default/music-thumb.png')}
                  alt={currentTrack.name}
                  className="w-12 h-12 rounded object-cover"
                />
                <div className="min-w-0 max-w-full w-[260px] sm:w-[320px] md:w-[360px] lg:w-[420px]">
                  <div className="text-sm truncate whitespace-nowrap" title={currentTrack.name}>{currentTrack.name}</div>
                  <div className="text-xs text-white/60 truncate whitespace-nowrap" title={currentTrack.artist || 'Unknown Artist'}>{currentTrack.artist || 'Unknown Artist'}</div>
                </div>
              </>
            ) : (
              <div className="text-white/60 text-sm">No track selected</div>
            )}
          </div>

          {/* Controls + progress (Center) */}
          <div className="col-span-1 md:col-auto flex flex-col items-center justify-center w-full justify-self-center">
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

          {/* Volume (Right) */}
          <div className="hidden md:flex items-center gap-3 min-w-0 justify-end justify-self-end">
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
