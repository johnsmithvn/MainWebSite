// 📁 src/components/music/MusicPlayerProvider.jsx
// 🎧 Global music playback: ONE <audio> for the whole app (music keeps playing while browsing),
// shared controls for PlayerFooter / FullPlayerModal / MiniPlayer, Media Session (lock screen, headset keys)

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore, useMusicStore, useUIStore } from '@/store';
import { useRecentMusicManager } from '@/hooks/useMusicData';
import { buildThumbnailUrl } from '@/utils/thumbnailUtils';
import { shuffleArray } from '@/utils/shuffle';
import { DEFAULT_IMAGES } from '@/constants';
import { MusicPlayerContext, MusicProgressContext } from './musicPlayerContext';
import FullPlayerModal from './FullPlayerModal';
import MiniPlayer from './MiniPlayer';

const buildAudioUrl = (musicKey, audioPath) => `/api/music/audio?key=${musicKey}&file=${encodeURIComponent(audioPath)}`;

// Seconds after which "previous" restarts the current track instead of going back
const RESTART_THRESHOLD = 3;

const MusicPlayerProvider = ({ children }) => {
  const location = useLocation();
  const { showToast } = useUIStore();
  const { sourceKey } = useAuthStore();
  const { addRecentMusic } = useRecentMusicManager();

  const currentTrack = useMusicStore((s) => s.currentTrack);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const volume = useMusicStore((s) => s.volume);
  const queueKey = useMusicStore((s) => s.queueKey);
  const playerUI = useMusicStore((s) => s.playerSettings?.playerUI);

  // Key used for audio/meta/view requests: the key the queue was loaded with, not the section being browsed
  const musicKey = queueKey || (sourceKey && sourceKey.startsWith('M_') ? sourceKey : null);

  const audioRef = useRef(null);
  const prevOrderBeforeShuffleRef = useRef(null);
  const switchingRef = useRef(false); // true while a new src loads (its 'pause' event is not a user pause)
  const lastVolumeRef = useRef(0.5);
  const musicKeyRef = useRef(musicKey);
  musicKeyRef.current = musicKey;

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [trackMetadata, setTrackMetadata] = useState(null);
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);

  // ========= Low-level helpers =========
  const playAudio = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !audio.getAttribute('src')) return;
    try {
      await audio.play();
    } catch (err) {
      if (err?.name === 'AbortError') return; // interrupted by loading another track
      useMusicStore.getState().pauseTrack();
      if (err?.name === 'NotAllowedError') {
        showToast('Trình duyệt chặn tự phát nhạc - bấm ▶ để nghe', 'info');
      } else {
        showToast('Không thể phát nhạc: ' + (err?.message || 'lỗi không rõ'), 'error');
      }
    }
  }, [showToast]);

  // Update viewCount of a song in the queue without restarting playback
  const bumpViewCount = useCallback((songPath) => {
    useMusicStore.setState((state) => {
      const idx = state.currentPlaylist.findIndex((t) => t.path === songPath);
      if (idx === -1) return {};
      const oldItem = state.currentPlaylist[idx] || {};
      const updatedItem = { ...oldItem, viewCount: Number(oldItem.viewCount ?? oldItem.views ?? 0) + 1 };
      const newPlaylist = [...state.currentPlaylist];
      newPlaylist[idx] = updatedItem;
      return {
        currentPlaylist: newPlaylist,
        currentTrack: state.currentTrack?.path === songPath ? updatedItem : state.currentTrack,
      };
    });
  }, []);

  // ========= Audio element events (registered once) =========
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;
    const store = () => useMusicStore.getState();
    const lastInc = { path: '', ts: 0 };

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onProgress = () => {
      if (audio.buffered?.length > 0) setBuffered(audio.buffered.end(audio.buffered.length - 1));
    };
    const onCanPlay = () => {
      switchingRef.current = false;
      if (store().isPlaying && audio.paused) playAudio();
    };
    const onEnded = () => {
      const { currentIndex, currentPlaylist, repeat } = store();
      const isLast = currentIndex >= currentPlaylist.length - 1;
      if (repeat === 'one' || (repeat === 'all' && currentPlaylist.length <= 1)) {
        // Replay the same track (nextTrack would return the same track and not restart it)
        audio.currentTime = 0;
        playAudio();
      } else if (isLast && repeat !== 'all') {
        // End of queue: stop, so the UI does not keep showing "playing"
        store().pauseTrack();
      } else {
        store().nextTrack();
      }
    };
    const onError = () => {
      switchingRef.current = false;
      if (!audio.getAttribute('src')) return;
      store().pauseTrack();
      showToast('Không thể load audio', 'error');
    };
    // Keep the store in sync when playback is changed outside our buttons (OS media keys, headset, browser UI)
    const onPlay = async () => {
      if (!store().isPlaying) store().resumeTrack();

      // Count a view + recent on every playback start (1s debounce for duplicate events)
      const track = store().currentTrack;
      const key = musicKeyRef.current;
      if (!track?.path || !key) return;
      const now = Date.now();
      if (lastInc.path === track.path && now - lastInc.ts < 1000) return;
      lastInc.path = track.path;
      lastInc.ts = now;
      try {
        addRecentMusic(track, key);
      } catch (err) {
        console.warn('Failed to add recent music:', err);
      }
      try {
        const res = await fetch('/api/increase-view/music', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, path: track.path }),
        });
        if (res.ok) bumpViewCount(track.path);
      } catch (err) {
        console.warn('Failed to increase music view count:', err);
      }
    };
    const onPause = () => {
      // 'pause' also fires when a track ends or while a new src loads: not a user pause
      const atEnd = audio.ended || (Number.isFinite(audio.duration) && audio.currentTime >= audio.duration - 0.1);
      if (switchingRef.current || atEnd) return;
      if (store().isPlaying) store().pauseTrack();
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('progress', onProgress);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('progress', onProgress);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playAudio, bumpViewCount, showToast]);

  // ========= Store -> audio: load the current track, follow isPlaying =========
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack?.path || !musicKey) return;
    const url = buildAudioUrl(musicKey, currentTrack.path);
    if (audio.src !== window.location.origin + url) {
      switchingRef.current = true;
      setCurrentTime(0);
      setDuration(currentTrack.duration || 0);
      setBuffered(0);
      audio.src = url;
      audio.load(); // 'canplay' starts playback when isPlaying
      return;
    }
    if (isPlaying && audio.paused && audio.readyState >= 2) playAudio();
    if (!isPlaying && !audio.paused) audio.pause();
  }, [currentTrack?.path, currentTrack?.duration, musicKey, isPlaying, playAudio]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    if (volume > 0) lastVolumeRef.current = volume;
  }, [volume]);

  // Metadata of the current track (title/artist/album/genre/lyrics from the songs table)
  useEffect(() => {
    let cancelled = false;
    const path = currentTrack?.path;
    if (!path || !musicKey) {
      setTrackMetadata(null);
      return undefined;
    }
    (async () => {
      try {
        const res = await fetch(`/api/music/music-meta?key=${encodeURIComponent(musicKey)}&path=${encodeURIComponent(path)}`);
        const data = res.ok ? await res.json() : null;
        if (!cancelled) setTrackMetadata(data && data.path ? data : null);
      } catch (err) {
        if (!cancelled) setTrackMetadata(null);
      }
    })();
    return () => { cancelled = true; };
  }, [currentTrack?.path, musicKey]);

  // A video takes over the sound: pause music when the movie player opens
  useEffect(() => {
    if (location.pathname.startsWith('/movie/player') && audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
  }, [location.pathname]);

  // ========= Controls =========
  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    const store = useMusicStore.getState();
    if (!audio || !store.currentTrack) return;
    if (store.isPlaying) {
      audio.pause();
      store.pauseTrack();
    } else {
      store.resumeTrack();
      playAudio();
    }
  }, [playAudio]);

  const seek = useCallback((time) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) return;
    const t = Math.min(Math.max(time, 0), audio.duration);
    audio.currentTime = t;
    setCurrentTime(t);
  }, []);

  const setVolumeLevel = useCallback((value) => {
    const v = Math.min(Math.max(value, 0), 1);
    useMusicStore.getState().setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  const toggleMute = useCallback(() => {
    const { volume: v } = useMusicStore.getState();
    setVolumeLevel(v === 0 ? (lastVolumeRef.current || 0.5) : 0);
  }, [setVolumeLevel]);

  const playNext = useCallback(() => {
    useMusicStore.getState().nextTrack();
  }, []);

  // Like most players: past the first seconds, "previous" restarts the current track
  const playPrevious = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > RESTART_THRESHOLD) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    useMusicStore.getState().prevTrack();
  }, []);

  const toggleShuffle = useCallback(() => {
    const store = useMusicStore.getState();
    if (!store.shuffle) {
      // Save current order to restore later, then shuffle (current track stays where the user can see it)
      const current = [...(store.currentPlaylist || [])];
      prevOrderBeforeShuffleRef.current = current;
      if (current.length <= 1) {
        useMusicStore.setState({ shuffle: true });
        return;
      }
      const shuffled = shuffleArray(current);
      const newIndex = store.currentTrack ? Math.max(0, shuffled.findIndex((t) => t.path === store.currentTrack.path)) : 0;
      useMusicStore.setState({ shuffle: true, currentPlaylist: shuffled, currentIndex: newIndex });
    } else {
      const restore = prevOrderBeforeShuffleRef.current;
      if (Array.isArray(restore) && restore.length > 0) {
        const newIndex = store.currentTrack ? Math.max(0, restore.findIndex((t) => t.path === store.currentTrack.path)) : 0;
        useMusicStore.setState({ shuffle: false, currentPlaylist: restore, currentIndex: newIndex });
      } else {
        useMusicStore.setState({ shuffle: false });
      }
    }
  }, []);

  const toggleRepeat = useCallback(() => {
    const current = useMusicStore.getState().repeat;
    const next = current === 'none' ? 'all' : current === 'all' ? 'one' : 'none';
    useMusicStore.setState({ repeat: next });
  }, []);

  // Apply the (persisted) shuffle mode to a freshly loaded list so the Shuffle button matches the order.
  // The selected track stays first; the original order is kept for "shuffle off".
  const buildQueue = useCallback((list, startIndex) => {
    if (!useMusicStore.getState().shuffle || list.length <= 1) {
      prevOrderBeforeShuffleRef.current = null;
      return { queue: list, index: startIndex };
    }
    prevOrderBeforeShuffleRef.current = list;
    const rest = shuffleArray(list.filter((_, i) => i !== startIndex));
    return { queue: [list[startIndex], ...rest], index: 0 };
  }, []);

  // Stop and forget the queue (mini player close button)
  const stopPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    setIsFullPlayerOpen(false);
    useMusicStore.setState({
      isPlaying: false, currentTrack: null, currentPlaylist: [], currentIndex: 0, queueSource: null,
    });
  }, []);

  const openFullPlayer = useCallback(() => setIsFullPlayerOpen(true), []);
  const closeFullPlayer = useCallback(() => setIsFullPlayerOpen(false), []);

  // ========= Media Session: lock screen / notification / headset controls =========
  const controlsRef = useRef({});
  controlsRef.current = { togglePlayPause, playNext, playPrevious, seek };

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return undefined;
    const ms = navigator.mediaSession;
    const handlers = {
      play: () => { if (!useMusicStore.getState().isPlaying) controlsRef.current.togglePlayPause(); },
      pause: () => { if (useMusicStore.getState().isPlaying) controlsRef.current.togglePlayPause(); },
      previoustrack: () => controlsRef.current.playPrevious(),
      nexttrack: () => controlsRef.current.playNext(),
      seekto: (details) => { if (details?.seekTime != null) controlsRef.current.seek(details.seekTime); },
      seekbackward: (details) => controlsRef.current.seek((audioRef.current?.currentTime || 0) - (details?.seekOffset || 10)),
      seekforward: (details) => controlsRef.current.seek((audioRef.current?.currentTime || 0) + (details?.seekOffset || 10)),
    };
    Object.entries(handlers).forEach(([action, handler]) => {
      try { ms.setActionHandler(action, handler); } catch { /* action not supported by this browser */ }
    });
    return () => {
      Object.keys(handlers).forEach((action) => {
        try { ms.setActionHandler(action, null); } catch { /* ignore */ }
      });
    };
  }, []);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    const ms = navigator.mediaSession;
    if (!currentTrack) {
      ms.metadata = null;
      return;
    }
    const title = trackMetadata?.title || (currentTrack.name || currentTrack.path?.split('/').pop() || '').replace(/\.[^/.]+$/, '');
    const artUrl = buildThumbnailUrl(currentTrack, 'music') || DEFAULT_IMAGES.music;
    try {
      ms.metadata = new window.MediaMetadata({
        title,
        artist: trackMetadata?.artist || currentTrack.artist || '',
        album: trackMetadata?.album || currentTrack.album || '',
        artwork: [{ src: new URL(artUrl, window.location.origin).href, sizes: '512x512' }],
      });
    } catch { /* MediaMetadata unsupported */ }
  }, [currentTrack, trackMetadata]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = currentTrack ? (isPlaying ? 'playing' : 'paused') : 'none';
  }, [isPlaying, currentTrack]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaSession?.setPositionState) return;
    if (!duration || !Number.isFinite(duration)) return;
    try {
      navigator.mediaSession.setPositionState({ duration, position: Math.min(currentTime, duration), playbackRate: 1 });
    } catch { /* invalid state while switching tracks */ }
  }, [Math.floor(currentTime), duration]); // eslint-disable-line react-hooks/exhaustive-deps

  // ========= Context values =========
  const controls = useMemo(() => ({
    audioRef,
    musicKey,
    trackMetadata,
    isFullPlayerOpen,
    openFullPlayer,
    closeFullPlayer,
    togglePlayPause,
    seek,
    setVolumeLevel,
    toggleMute,
    playNext,
    playPrevious,
    toggleShuffle,
    toggleRepeat,
    buildQueue,
    stopPlayback,
  }), [musicKey, trackMetadata, isFullPlayerOpen, openFullPlayer, closeFullPlayer, togglePlayPause, seek,
    setVolumeLevel, toggleMute, playNext, playPrevious, toggleShuffle, toggleRepeat, buildQueue, stopPlayback]);

  const progress = useMemo(() => ({ currentTime, duration, buffered }), [currentTime, duration, buffered]);

  return (
    <MusicPlayerContext.Provider value={controls}>
      <MusicProgressContext.Provider value={progress}>
        {children}
        <audio ref={audioRef} preload="metadata" className="hidden" />
        <FullPlayerModal theme={playerUI === 'v2' ? 'v2' : 'v1'} />
        <MiniPlayer />
      </MusicProgressContext.Provider>
    </MusicPlayerContext.Provider>
  );
};

export default MusicPlayerProvider;
