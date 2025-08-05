// 📁 src/pages/movie/MoviePlayer.jsx
// 🎬 Movie player với đầy đủ video controls và tính năng

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, Settings, Home, RotateCcw,
  ChevronLeft, ChevronRight, Monitor, Smartphone, Heart,
  Share, Download, Subtitles, Loader, RefreshCw
} from 'lucide-react';
import { useMovieStore, useUIStore, useAuthStore } from '@/store';
import { useRecentManager } from '@/hooks/useRecentManager';
import { apiService } from '@/utils/api';
import Button from '@/components/common/Button';
import toast from 'react-hot-toast';

const MoviePlayer = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const path = searchParams.get('path'); // Đường dẫn đến video file
  const startTime = parseFloat(searchParams.get('t')) || 0; // Start time in seconds

  const { 
    currentMovie, 
    playerSettings, 
    updatePlayerSettings,
    toggleFavorite,
    favorites
  } = useMovieStore();
  const { darkMode } = useUIStore();
  const { sourceKey } = useAuthStore();
  const { addRecentItem } = useRecentManager('movie');

  // === REFS ===
  const videoRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const progressBarRef = useRef(null);

  // === STATE MANAGEMENT ===
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(startTime);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(playerSettings.volume || 1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(playerSettings.playbackRate || 1);
  const [quality, setQuality] = useState(playerSettings.quality || 'auto');
  const [subtitles, setSubtitles] = useState([]);
  const [currentSubtitle, setCurrentSubtitle] = useState(null);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);

  // === COMPUTED VALUES ===
  const isFavorited = favorites.some(fav => fav.path === path);
  const videoUrl = buildVideoUrl(path);
  
  /**
   * 🔗 Build video URL from path
   */
  function buildVideoUrl(videoPath) {
    if (!videoPath) return null;
    
    // Nếu đã là URL đầy đủ
    if (videoPath.startsWith('http') || videoPath.startsWith('/default/')) {
      return videoPath;
    }
    
    // Build URL cho video static serving
    const cleanPath = videoPath.replace(/\\/g, '/');
    return `/video/${cleanPath}`;
  }

  /**
   * 📊 Get movie info from path
   */
  const getMovieInfo = useCallback(() => {
    if (!path) return { title: 'Unknown Movie', folder: '' };
    
    const pathParts = path.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const folderName = pathParts[pathParts.length - 2] || '';
    
    // Remove file extension
    const title = fileName.replace(/\.[^/.]+$/, '');
    
    return {
      title,
      folder: folderName,
      fullPath: path
    };
  }, [path]);

  const movieInfo = getMovieInfo();

  // === EFFECT HOOKS ===
  
  /**
   * 🎯 Initialize video and load metadata
   */
  useEffect(() => {
    if (!path) {
      navigate('/movie');
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    // Video event handlers
    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      video.currentTime = startTime;
      setCurrentTime(startTime);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      if (playerSettings.autoPlay) {
        video.play();
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Update progress
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBuffered((bufferedEnd / video.duration) * 100);
      }
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setLoadingProgress((bufferedEnd / video.duration) * 100);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    const handleError = (e) => {
      console.error('Video error:', e);
      setError('Không thể tải video. Vui lòng thử lại.');
      setIsLoading(false);
    };

    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    // Add event listeners
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('error', handleError);
    video.addEventListener('volumechange', handleVolumeChange);

    // Cleanup
    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('error', handleError);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [path, startTime, playerSettings.autoPlay, navigate]);

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
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'Escape':
          if (isFullscreen) {
            e.preventDefault();
            exitFullscreen();
          }
          break;
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          e.preventDefault();
          const percent = parseInt(e.key) * 10;
          seekToPercent(percent);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  /**
   * 🎮 Auto-hide controls
   */
  useEffect(() => {
    const resetControlsTimeout = () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      
      setShowControls(true);
      
      if (isPlaying && !showSettings) {
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
    };

    resetControlsTimeout();
    
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, showSettings]);

  /**
   * 💾 Save player settings
   */
  useEffect(() => {
    updatePlayerSettings({
      volume,
      playbackRate,
      quality
    });
  }, [volume, playbackRate, quality, updatePlayerSettings]);

  /**
   * 📝 Add to recent viewed
   */
  useEffect(() => {
    if (path && currentTime > 30) { // Save after 30 seconds
      addRecentItem({
        path,
        name: movieInfo.title, // Use 'name' instead of 'title' for consistency
        currentTime,
        duration,
        thumbnail: null,
        timestamp: Date.now()
      });
    }
  }, [path, currentTime, duration, movieInfo.title, addRecentItem]);

  // === CONTROL FUNCTIONS ===

  /**
   * ⏯️ Toggle play/pause
   */
  const togglePlayPause = useCallback(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  }, [isPlaying]);

  /**
   * ⏭️ Seek by seconds
   */
  const seekBy = useCallback((seconds) => {
    if (!videoRef.current) return;
    
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [currentTime, duration]);

  /**
   * 📍 Seek to percentage
   */
  const seekToPercent = useCallback((percent) => {
    if (!videoRef.current || !duration) return;
    
    const newTime = (percent / 100) * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  /**
   * 🔧 Handle progress bar click
   */
  const handleProgressClick = useCallback((e) => {
    if (!videoRef.current || !duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * duration;
    
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  /**
   * 🔊 Adjust volume
   */
  const adjustVolume = useCallback((delta) => {
    if (!videoRef.current) return;
    
    const newVolume = Math.max(0, Math.min(1, volume + delta));
    setVolume(newVolume);
    videoRef.current.volume = newVolume;
    
    if (newVolume === 0) {
      setIsMuted(true);
      videoRef.current.muted = true;
    } else if (isMuted) {
      setIsMuted(false);
      videoRef.current.muted = false;
    }
  }, [volume, isMuted]);

  /**
   * 🔇 Toggle mute
   */
  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    videoRef.current.muted = newMuted;
  }, [isMuted]);

  /**
   * 🎚️ Change playback rate
   */
  const changePlaybackRate = useCallback((rate) => {
    if (!videoRef.current) return;
    
    setPlaybackRate(rate);
    videoRef.current.playbackRate = rate;
  }, []);

  /**
   * 🖥️ Toggle fullscreen
   */
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      if (videoRef.current?.requestFullscreen) {
        videoRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  }, []);

  /**
   * ❌ Exit fullscreen
   */
  const exitFullscreen = useCallback(() => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  /**
   * ❤️ Toggle favorite
   */
  const handleToggleFavorite = useCallback(async () => {
    try {
      await apiService.movie.toggleFavorite(path);
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
    if (!videoRef.current) return;
    
    setError(null);
    setIsLoading(true);
    videoRef.current.load();
  }, []);

  /**
   * 🖱️ Handle mouse move to show controls
   */
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    if (isPlaying && !showSettings) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying, showSettings]);

  // === UTILITY FUNCTIONS ===

  /**
   * ⏰ Format time duration
   */
  const formatTime = useCallback((time) => {
    if (!time || !isFinite(time)) return '0:00';
    
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // === RENDER FUNCTIONS ===

  /**
   * 🎬 Render main component
   */
  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl mb-4">Có lỗi xảy ra</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="space-x-4">
            <Button onClick={retryLoad} variant="primary">
              <RefreshCw className="w-4 h-4 mr-2" />
              Thử lại
            </Button>
            <Button onClick={() => navigate('/movie')} variant="secondary">
              Quay lại
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4" />
          <h2 className="text-xl mb-2">Đang tải video...</h2>
          <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-400 mt-2">{Math.round(loadingProgress)}%</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-screen bg-black overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain"
        autoPlay={playerSettings.autoPlay}
        muted={isMuted}
        onClick={togglePlayPause}
      />

      {/* Controls Overlay */}
      <div className={`
        absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40
        transition-opacity duration-300
        ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}>
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => navigate('/movie')}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-white">{movieInfo.title}</h1>
              <p className="text-sm text-gray-300">{movieInfo.folder}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={handleToggleFavorite}
              variant="ghost"
              size="sm"
              className={`${isFavorited ? 'text-red-500' : 'text-white'} hover:bg-white/20`}
            >
              <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
            </Button>
            <Button
              onClick={() => setShowSettings(!showSettings)}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Center Play Button */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              onClick={togglePlayPause}
              variant="ghost"
              size="lg"
              className="w-20 h-20 rounded-full bg-white/20 hover:bg-white/30 text-white"
            >
              <Play className="w-8 h-8 ml-1" />
            </Button>
          </div>
        )}

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {/* Progress Bar */}
          <div className="mb-4">
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
                className="absolute inset-y-0 left-0 bg-blue-500 rounded-full"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
              {/* Progress Handle */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full 
                          opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `${(currentTime / duration) * 100}%`, marginLeft: '-8px' }}
              />
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Play/Pause */}
              <Button
                onClick={togglePlayPause}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </Button>

              {/* Skip Buttons */}
              <Button
                onClick={() => seekBy(-10)}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <SkipBack className="w-5 h-5" />
              </Button>
              <Button
                onClick={() => seekBy(10)}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <SkipForward className="w-5 h-5" />
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
                  className="w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none 
                           [&::-webkit-slider-thumb]:w-3 
                           [&::-webkit-slider-thumb]:h-3 
                           [&::-webkit-slider-thumb]:bg-blue-500 
                           [&::-webkit-slider-thumb]:rounded-full"
                />
              </div>

              {/* Time Display */}
              <span className="text-white text-sm font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {/* Playback Speed */}
              <select
                value={playbackRate}
                onChange={(e) => changePlaybackRate(parseFloat(e.target.value))}
                className="bg-white/20 text-white text-sm rounded px-2 py-1 border-none outline-none"
              >
                <option value="0.5">0.5x</option>
                <option value="0.75">0.75x</option>
                <option value="1">1x</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
              </select>

              {/* Fullscreen */}
              <Button
                onClick={toggleFullscreen}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-16 right-4 bg-black/90 rounded-lg p-4 min-w-64 text-white">
          <h3 className="text-lg font-semibold mb-4">Cài đặt phát</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Chất lượng</label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                className="w-full bg-white/20 rounded px-3 py-2 text-white"
              >
                <option value="auto">Tự động</option>
                <option value="1080p">1080p</option>
                <option value="720p">720p</option>
                <option value="480p">480p</option>
                <option value="360p">360p</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tốc độ phát</label>
              <input
                type="range"
                min="0.25"
                max="3"
                step="0.25"
                value={playbackRate}
                onChange={(e) => changePlaybackRate(parseFloat(e.target.value))}
                className="w-full"
              />
              <span className="text-sm text-gray-400">{playbackRate}x</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Tự động phát</span>
              <input
                type="checkbox"
                checked={playerSettings.autoPlay}
                onChange={(e) => updatePlayerSettings({ autoPlay: e.target.checked })}
                className="rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoviePlayer;
