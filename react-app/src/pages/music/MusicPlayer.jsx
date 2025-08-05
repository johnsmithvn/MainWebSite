// 📁 src/pages/music/MusicPlayer.jsx
// 🎵 Music player với playlist, audio controls và tính năng nâng cao

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Repeat, Shuffle, Heart, Share, MoreHorizontal, Home,
  ChevronLeft, List, Clock, Music, Download, Sliders,
  Loader, RefreshCw, Headphones, Speaker, Mic, Radio
} from 'lucide-react';
import { useMusicStore, useUIStore, useAuthStore } from '@/store';
import { apiService } from '@/utils/api';
import Button from '@/components/common/Button';
import toast from 'react-hot-toast';

const MusicPlayer = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const path = searchParams.get('path'); // Đường dẫn đến audio file
  const playlistPath = searchParams.get('playlist'); // Path của playlist

  const { 
    currentTrack, 
    playlist, 
    playerSettings, 
    updatePlayerSettings,
    addToRecentPlayed,
    toggleFavorite,
    favorites,
    setCurrentTrack,
    setPlaylist
  } = useMusicStore();
  const { darkMode } = useUIStore();
  const { sourceKey } = useAuthStore();

  // === REFS ===
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);
  const canvasRef = useRef(null);
  const analyzerRef = useRef(null);

  // === STATE MANAGEMENT ===
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(playerSettings.volume || 0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffled, setIsShuffled] = useState(playerSettings.shuffle || false);
  const [repeatMode, setRepeatMode] = useState(playerSettings.repeat || 'off'); // off, one, all
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showEqualizer, setShowEqualizer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [audioContext, setAudioContext] = useState(null);
  const [visualizer, setVisualizer] = useState(false);

  // === COMPUTED VALUES ===
  const isFavorited = favorites.some(fav => fav.path === path);
  const audioUrl = buildAudioUrl(path);
  
  /**
   * 🔗 Build audio URL from path
   */
  function buildAudioUrl(audioPath) {
    if (!audioPath) return null;
    
    // Nếu đã là URL đầy đủ
    if (audioPath.startsWith('http') || audioPath.startsWith('/default/')) {
      return audioPath;
    }
    
    // Build URL cho audio static serving
    const cleanPath = audioPath.replace(/\\/g, '/');
    return `/audio/${cleanPath}`;
  }

  /**
   * 📊 Get track info from path
   */
  const getTrackInfo = useCallback(() => {
    if (!path) return { title: 'Unknown Track', artist: 'Unknown Artist', album: '' };
    
    const pathParts = path.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const albumName = pathParts[pathParts.length - 2] || '';
    const artistName = pathParts[pathParts.length - 3] || '';
    
    // Remove file extension
    const title = fileName.replace(/\.[^/.]+$/, '');
    
    return {
      title,
      artist: artistName || 'Unknown Artist',
      album: albumName,
      fullPath: path
    };
  }, [path]);

  const trackInfo = getTrackInfo();

  // === EFFECT HOOKS ===
  
  /**
   * 🎯 Initialize audio and load metadata
   */
  useEffect(() => {
    if (!path) {
      navigate('/music');
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    // Audio event handlers
    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      if (playerSettings.autoPlay) {
        audio.play();
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      
      // Update progress
      if (audio.buffered.length > 0) {
        const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
        setBuffered((bufferedEnd / audio.duration) * 100);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => handleTrackEnd();

    const handleError = (e) => {
      console.error('Audio error:', e);
      setError('Không thể tải nhạc. Vui lòng thử lại.');
      setIsLoading(false);
    };

    const handleVolumeChange = () => {
      setVolume(audio.volume);
      setIsMuted(audio.muted);
    };

    // Add event listeners
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('volumechange', handleVolumeChange);

    // Cleanup
    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [path, playerSettings.autoPlay, navigate]);

  /**
   * ⌨️ Keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Chỉ xử lý khi không có input nào được focus
      if (document.activeElement.tagName === 'INPUT' || 
          document.activeElement.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seekBy(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seekBy(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          adjustVolume(0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          adjustVolume(-0.1);
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'n':
          e.preventDefault();
          nextTrack();
          break;
        case 'p':
          e.preventDefault();
          previousTrack();
          break;
        case 's':
          e.preventDefault();
          toggleShuffle();
          break;
        case 'r':
          e.preventDefault();
          toggleRepeat();
          break;
        case 'l':
          e.preventDefault();
          setShowPlaylist(!showPlaylist);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showPlaylist]);

  /**
   * 💾 Save player settings
   */
  useEffect(() => {
    updatePlayerSettings({
      volume,
      shuffle: isShuffled,
      repeat: repeatMode
    });
  }, [volume, isShuffled, repeatMode, updatePlayerSettings]);

  /**
   * 📝 Add to recent played
   */
  useEffect(() => {
    if (path && currentTime > 30) { // Save after 30 seconds
      addToRecentPlayed({
        path,
        title: trackInfo.title,
        artist: trackInfo.artist,
        currentTime,
        duration,
        timestamp: Date.now()
      });
    }
  }, [path, currentTime, duration, trackInfo.title, trackInfo.artist, addToRecentPlayed]);

  // === CONTROL FUNCTIONS ===

  /**
   * ⏯️ Toggle play/pause
   */
  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  }, [isPlaying]);

  /**
   * ⏭️ Next track
   */
  const nextTrack = useCallback(() => {
    if (playlist.length === 0) return;

    let nextIndex;
    if (isShuffled) {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else {
      nextIndex = currentTrackIndex + 1;
      if (nextIndex >= playlist.length) {
        nextIndex = repeatMode === 'all' ? 0 : currentTrackIndex;
      }
    }
    
    if (nextIndex !== currentTrackIndex) {
      setCurrentTrackIndex(nextIndex);
      const nextTrack = playlist[nextIndex];
      navigate(`/music/player?path=${encodeURIComponent(nextTrack.path)}`);
    }
  }, [playlist, currentTrackIndex, isShuffled, repeatMode, navigate]);

  /**
   * ⏮️ Previous track
   */
  const previousTrack = useCallback(() => {
    if (playlist.length === 0) return;

    // If we're more than 3 seconds in, restart current track
    if (currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }

    let prevIndex;
    if (isShuffled) {
      prevIndex = Math.floor(Math.random() * playlist.length);
    } else {
      prevIndex = currentTrackIndex - 1;
      if (prevIndex < 0) {
        prevIndex = repeatMode === 'all' ? playlist.length - 1 : 0;
      }
    }
    
    setCurrentTrackIndex(prevIndex);
    const prevTrack = playlist[prevIndex];
    navigate(`/music/player?path=${encodeURIComponent(prevTrack.path)}`);
  }, [playlist, currentTrackIndex, currentTime, isShuffled, repeatMode, navigate]);

  /**
   * 🔄 Handle track end
   */
  const handleTrackEnd = useCallback(() => {
    if (repeatMode === 'one') {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else {
      nextTrack();
    }
  }, [repeatMode, nextTrack]);

  /**
   * ⏭️ Seek by seconds
   */
  const seekBy = useCallback((seconds) => {
    if (!audioRef.current) return;
    
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [currentTime, duration]);

  /**
   * 🔧 Handle progress bar click
   */
  const handleProgressClick = useCallback((e) => {
    if (!audioRef.current || !duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  /**
   * 🔊 Adjust volume
   */
  const adjustVolume = useCallback((delta) => {
    if (!audioRef.current) return;
    
    const newVolume = Math.max(0, Math.min(1, volume + delta));
    setVolume(newVolume);
    audioRef.current.volume = newVolume;
    
    if (newVolume === 0) {
      setIsMuted(true);
      audioRef.current.muted = true;
    } else if (isMuted) {
      setIsMuted(false);
      audioRef.current.muted = false;
    }
  }, [volume, isMuted]);

  /**
   * 🔇 Toggle mute
   */
  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audioRef.current.muted = newMuted;
  }, [isMuted]);

  /**
   * 🔀 Toggle shuffle
   */
  const toggleShuffle = useCallback(() => {
    setIsShuffled(!isShuffled);
  }, [isShuffled]);

  /**
   * 🔁 Toggle repeat mode
   */
  const toggleRepeat = useCallback(() => {
    const modes = ['off', 'one', 'all'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setRepeatMode(modes[nextIndex]);
  }, [repeatMode]);

  /**
   * ❤️ Toggle favorite
   */
  const handleToggleFavorite = useCallback(async () => {
    try {
      const { sourceKey } = useAuthStore.getState();
      await apiService.music.toggleFavorite(sourceKey, path, !isFavorited);
      toggleFavorite(path);
      toast.success(isFavorited ? 'Đã xóa khỏi yêu thích' : 'Đã thêm vào yêu thích');
    } catch (error) {
      console.error('Toggle favorite error:', error);
      toast.error('Có lỗi xảy ra');
    }
  }, [path, isFavorited, toggleFavorite]);

  /**
   * 🔄 Retry loading
   */
  const retryLoad = useCallback(() => {
    if (!audioRef.current) return;
    
    setError(null);
    setIsLoading(true);
    audioRef.current.load();
  }, []);

  /**
   * ⏰ Format time duration
   */
  const formatTime = useCallback((time) => {
    if (!time || !isFinite(time)) return '0:00';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // === RENDER FUNCTIONS ===

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl mb-4">Có lỗi xảy ra</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="space-x-4">
            <Button onClick={retryLoad} variant="primary">
              <RefreshCw className="w-4 h-4 mr-2" />
              Thử lại
            </Button>
            <Button onClick={() => navigate('/music')} variant="secondary">
              Quay lại
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-center text-white">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4" />
          <h2 className="text-xl mb-2">Đang tải nhạc...</h2>
          <p className="text-sm text-gray-400">{trackInfo.title}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="auto"
      />

      {/* Header */}
      <header className="flex items-center justify-between p-4 text-white">
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => navigate('/music')}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Đang phát</h1>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setShowPlaylist(!showPlaylist)}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
          >
            <List className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Player */}
      <div className="flex flex-col items-center px-8 py-12">
        {/* Album Art */}
        <div className="w-80 h-80 rounded-2xl bg-white/10 backdrop-blur-lg mb-8 overflow-hidden shadow-2xl">
          <img
            src="/default/music-thumb.png"
            alt="Album Art"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = '/default/music-thumb.png';
            }}
          />
        </div>

        {/* Track Info */}
        <div className="text-center text-white mb-8">
          <h2 className="text-2xl font-bold mb-2">{trackInfo.title}</h2>
          <p className="text-lg text-gray-300 mb-1">{trackInfo.artist}</p>
          <p className="text-gray-400">{trackInfo.album}</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-md mb-8">
          <div 
            ref={progressBarRef}
            className="relative h-2 bg-white/20 rounded-full cursor-pointer group"
            onClick={handleProgressClick}
          >
            {/* Buffered Progress */}
            <div 
              className="absolute inset-y-0 left-0 bg-white/40 rounded-full"
              style={{ width: `${buffered}%` }}
            />
            {/* Current Progress */}
            <div 
              className="absolute inset-y-0 left-0 bg-white rounded-full"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
            {/* Progress Handle */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full 
                        opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              style={{ left: `${(currentTime / duration) * 100}%`, marginLeft: '-8px' }}
            />
          </div>
          
          {/* Time Display */}
          <div className="flex justify-between text-sm text-gray-300 mt-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center space-x-6 mb-8">
          {/* Shuffle */}
          <Button
            onClick={toggleShuffle}
            variant="ghost"
            size="sm"
            className={`text-white hover:bg-white/20 ${isShuffled ? 'text-green-400' : ''}`}
          >
            <Shuffle className="w-5 h-5" />
          </Button>

          {/* Previous */}
          <Button
            onClick={previousTrack}
            variant="ghost"
            size="lg"
            className="text-white hover:bg-white/20"
          >
            <SkipBack className="w-6 h-6" />
          </Button>

          {/* Play/Pause */}
          <Button
            onClick={togglePlayPause}
            variant="ghost"
            size="xl"
            className="w-16 h-16 rounded-full bg-white text-purple-900 hover:bg-gray-100"
          >
            {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
          </Button>

          {/* Next */}
          <Button
            onClick={nextTrack}
            variant="ghost"
            size="lg"
            className="text-white hover:bg-white/20"
          >
            <SkipForward className="w-6 h-6" />
          </Button>

          {/* Repeat */}
          <Button
            onClick={toggleRepeat}
            variant="ghost"
            size="sm"
            className={`text-white hover:bg-white/20 ${repeatMode !== 'off' ? 'text-green-400' : ''}`}
          >
            <Repeat className="w-5 h-5" />
            {repeatMode === 'one' && <span className="text-xs absolute -top-1 -right-1">1</span>}
          </Button>
        </div>

        {/* Secondary Controls */}
        <div className="flex items-center justify-center space-x-4 text-white">
          {/* Favorite */}
          <Button
            onClick={handleToggleFavorite}
            variant="ghost"
            size="sm"
            className={`${isFavorited ? 'text-red-500' : 'text-white'} hover:bg-white/20`}
          >
            <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
          </Button>

          {/* Volume Control */}
          <div className="flex items-center space-x-2">
            <Button
              onClick={toggleMute}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => adjustVolume(parseFloat(e.target.value) - volume)}
              className="w-24 h-1 bg-white/20 rounded-full appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none 
                       [&::-webkit-slider-thumb]:w-3 
                       [&::-webkit-slider-thumb]:h-3 
                       [&::-webkit-slider-thumb]:bg-white 
                       [&::-webkit-slider-thumb]:rounded-full"
            />
          </div>

          {/* Equalizer */}
          <Button
            onClick={() => setShowEqualizer(!showEqualizer)}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
          >
            <Sliders className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Playlist Sidebar */}
      {showPlaylist && (
        <div className="fixed top-0 right-0 w-80 h-full bg-black/90 backdrop-blur-lg text-white p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Danh sách phát</h3>
            <Button
              onClick={() => setShowPlaylist(false)}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              ✕
            </Button>
          </div>
          
          <div className="space-y-2">
            {playlist.map((track, index) => (
              <div
                key={track.path}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  index === currentTrackIndex 
                    ? 'bg-white/20 border border-white/30' 
                    : 'hover:bg-white/10'
                }`}
                onClick={() => {
                  setCurrentTrackIndex(index);
                  navigate(`/music/player?path=${encodeURIComponent(track.path)}`);
                }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                    <Music className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{track.title || 'Unknown Track'}</p>
                    <p className="text-sm text-gray-400 truncate">{track.artist || 'Unknown Artist'}</p>
                  </div>
                  {index === currentTrackIndex && isPlaying && (
                    <div className="w-4 h-4 flex items-center justify-center">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Equalizer Panel */}
      {showEqualizer && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-lg rounded-lg p-4 text-white">
          <h3 className="text-lg font-semibold mb-4">Equalizer</h3>
          <div className="flex space-x-2">
            {['60Hz', '170Hz', '310Hz', '600Hz', '1kHz', '3kHz', '6kHz', '12kHz', '14kHz', '16kHz'].map((freq) => (
              <div key={freq} className="flex flex-col items-center">
                <input
                  type="range"
                  min="-12"
                  max="12"
                  defaultValue="0"
                  className="w-6 h-24 appearance-none bg-white/20 rounded-full 
                           [&::-webkit-slider-thumb]:appearance-none 
                           [&::-webkit-slider-thumb]:w-6 
                           [&::-webkit-slider-thumb]:h-3 
                           [&::-webkit-slider-thumb]:bg-white 
                           [&::-webkit-slider-thumb]:rounded-full"
                  style={{ writingMode: 'bt-lr' }}
                />
                <span className="text-xs mt-2">{freq}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicPlayer;
