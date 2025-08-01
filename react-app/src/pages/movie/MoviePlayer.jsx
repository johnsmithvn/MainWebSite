// 📁 src/pages/movie/MoviePlayer.jsx
// 🎬 Movie player với video controls

import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, Settings, Home, RotateCcw,
  ChevronLeft, ChevronRight, Monitor, Smartphone, Heart
} from 'lucide-react';
import { useMovieStore, useUIStore } from '@/store';
import Button from '@/components/common/Button';

const MoviePlayer = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const movieId = searchParams.get('id');

  const { currentMovie, playerSettings, updatePlayerSettings } = useMovieStore();
  const { darkMode } = useUIStore();

  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const controlsTimeoutRef = useRef(null);

  // Sample movie data
  const sampleMovie = {
    id: movieId || '1',
    title: 'Sample Movie',
    year: 2023,
    duration: '2h 15m',
    genre: ['Action', 'Adventure'],
    rating: 8.5,
    description: 'A sample movie for demonstration purposes.',
    videoUrl: '/sample-video.mp4', // Would be actual video URL
    subtitles: [
      { lang: 'en', label: 'English', url: '/subtitles/en.vtt' },
      { lang: 'vi', label: 'Vietnamese', url: '/subtitles/vi.vtt' }
    ]
  };

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setIsLoading(false), 1500);
  }, [movieId]);

  useEffect(() => {
    // Auto hide controls
    if (showControls && isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, isPlaying]);

  const handleMouseMove = () => {
    setShowControls(true);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      const time = pos * duration;
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      videoRef.current.muted = newMuted;
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      videoRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const skipTime = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const formatTime = (time) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading movie...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen bg-black overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-screen object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={togglePlay}
      >
        {/* Placeholder since we don't have actual video */}
        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
          <div className="text-white text-center">
            <Play className="w-16 h-16 mx-auto mb-4" />
            <p className="text-xl">Video Player Placeholder</p>
            <p className="text-gray-400">Click to simulate play/pause</p>
          </div>
        </div>
      </video>

      {/* Top Controls */}
      <div className={`fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black to-transparent 
                     transition-opacity duration-300 ${
                       showControls ? 'opacity-100' : 'opacity-0'
                     }`}>
        <div className="flex items-center justify-between p-6 text-white">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              icon={ChevronLeft}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{sampleMovie.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-300">
                <span>{sampleMovie.year}</span>
                <span>{sampleMovie.duration}</span>
                <span>★ {sampleMovie.rating}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={Heart}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              Add to Favorites
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              icon={Settings}
              className="text-white hover:bg-white hover:bg-opacity-20"
            />
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed top-20 right-6 z-50 bg-black bg-opacity-90 rounded-lg p-6 w-80 text-white">
          <h3 className="text-lg font-semibold mb-4">Player Settings</h3>
          
          <div className="space-y-4">
            {/* Quality */}
            <div>
              <label className="block text-sm font-medium mb-2">Quality</label>
              <select className="w-full bg-gray-800 text-white rounded p-2">
                <option value="auto">Auto</option>
                <option value="1080p">1080p</option>
                <option value="720p">720p</option>
                <option value="480p">480p</option>
              </select>
            </div>

            {/* Subtitles */}
            <div>
              <label className="block text-sm font-medium mb-2">Subtitles</label>
              <select className="w-full bg-gray-800 text-white rounded p-2">
                <option value="off">Off</option>
                {sampleMovie.subtitles.map((sub) => (
                  <option key={sub.lang} value={sub.lang}>
                    {sub.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Playback Speed */}
            <div>
              <label className="block text-sm font-medium mb-2">Speed</label>
              <select className="w-full bg-gray-800 text-white rounded p-2">
                <option value="0.5">0.5x</option>
                <option value="0.75">0.75x</option>
                <option value="1" selected>Normal</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black to-transparent 
                     transition-opacity duration-300 ${
                       showControls ? 'opacity-100' : 'opacity-0'
                     }`}>
        {/* Progress Bar */}
        <div className="px-6 pb-2">
          <div 
            className="w-full h-2 bg-gray-600 rounded-full cursor-pointer"
            onClick={handleSeek}
          >
            <div 
              className="h-full bg-red-600 rounded-full relative"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            >
              <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 
                            w-4 h-4 bg-red-600 rounded-full shadow-lg" />
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between px-6 pb-6 text-white">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => skipTime(-10)}
              icon={SkipBack}
              className="text-white hover:bg-white hover:bg-opacity-20"
            />
            <Button
              variant="ghost"
              size="lg"
              onClick={togglePlay}
              icon={isPlaying ? Pause : Play}
              className="text-white hover:bg-white hover:bg-opacity-20"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => skipTime(10)}
              icon={SkipForward}
              className="text-white hover:bg-white hover:bg-opacity-20"
            />
            
            {/* Volume Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                icon={isMuted ? VolumeX : Volume2}
                className="text-white hover:bg-white hover:bg-opacity-20"
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-20"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              icon={isFullscreen ? Minimize : Maximize}
              className="text-white hover:bg-white hover:bg-opacity-20"
            />
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Buffering...</p>
          </div>
        </div>
      )}

      {/* Click zones for mobile */}
      <div className="fixed inset-0 z-10 md:hidden">
        <div className="h-full flex">
          <div className="w-1/3 h-full" onDoubleClick={() => skipTime(-10)} />
          <div className="w-1/3 h-full" onClick={togglePlay} />
          <div className="w-1/3 h-full" onDoubleClick={() => skipTime(10)} />
        </div>
      </div>
    </div>
  );
};

export default MoviePlayer;
