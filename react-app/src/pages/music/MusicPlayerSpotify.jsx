// 📁 src/pages/music/MusicPlayerSpotify.jsx
// 🎵 Spotify-style Music Player với design đẹp và hiện đại

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  FiList,
  FiHeart,
  FiMoreHorizontal,
  FiHome,
  FiDownload,
  FiShare2,
  FiChevronLeft,
  FiChevronRight,
  FiMusic
} from 'react-icons/fi';
import { useAuthStore, useMusicStore, useUIStore } from '@/store';
import { useRecentMusicManager } from '@/hooks/useMusicData';
import { apiService } from '@/utils/api';
import LoadingOverlay from '@/components/common/LoadingOverlay';

const MusicPlayerSpotify = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const path = searchParams.get('file');
  const playlistPath = searchParams.get('playlist');

  console.log('🎵 MusicPlayerSpotify component mounted');
  console.log('🎵 MusicPlayerSpotify received params:', { path, playlistPath });

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
    setVolume
  } = useMusicStore();
  
  const { darkMode, showToast } = useUIStore();
  const { sourceKey, setSourceKey } = useAuthStore();
  
  // Debug sourceKey - check if it's set correctly for music
  console.log('🔑 Current sourceKey:', sourceKey);
  console.log('🔑 Auth store state:', useAuthStore.getState());
  
  // Ensure sourceKey is set to M_MUSIC for music player
  useEffect(() => {
    if (!sourceKey || sourceKey === 'ROOT_FANTASY') {
      console.log('🔑 Setting sourceKey to M_MUSIC for music player');
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
  const [showPlaylist, setShowPlaylist] = useState(false);

  // Audio ref
  const audioRef = useRef(null);

  /**
   * 🎵 Build audio URL từ path
   */
  function buildAudioUrl(audioPath) {
    if (!audioPath || !sourceKey) {
      console.log('🎵 buildAudioUrl: Missing audioPath or sourceKey');
      return null;
    }
    
    const url = `/api/music/audio?key=${sourceKey}&file=${encodeURIComponent(audioPath)}`;
    console.log('🎵 Built audio URL:', url);
    return url;
  }

  /**
   * 🎵 Get track info từ path
   */
  const getTrackInfo = useCallback(() => {
    if (!path) return null;
    
    const fileName = path.split('/').pop();
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
    
    return {
      name: nameWithoutExt,
      path: path,
      artist: 'Unknown Artist',
      album: 'Unknown Album',
      thumbnail: null
    };
  }, [path]);

  /**
   * 🎵 Format time helper
   */
  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  /**
   * 🎵 Toggle play/pause
   */
  const togglePlayPause = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) {
      console.error('❌ Audio element not found');
      return;
    }

    try {
      if (isPlaying) {
        audio.pause();
        pauseTrack();
        console.log('⏸️ Audio paused');
      } else {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          await playPromise;
          resumeTrack();
          console.log('▶️ Audio playing');
        }
      }
    } catch (error) {
      console.error('🔥 Play/pause error:', error);
      setError('Failed to play/pause audio: ' + error.message);
      showToast('Không thể play/pause: ' + error.message, 'error');
    }
  }, [isPlaying, pauseTrack, resumeTrack, showToast]);

  /**
   * 🎵 Handle seek
   */
  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  /**
   * 🎵 Toggle mute
   */
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

  /**
   * 🎵 Toggle shuffle
   */
  const toggleShuffle = () => {
    // Implement shuffle logic
    console.log('🔀 Toggle shuffle');
  };

  /**
   * 🎵 Toggle repeat
   */
  const toggleRepeat = () => {
    // Implement repeat logic
    console.log('🔁 Toggle repeat');
  };

  /**
   * 🎵 Load folder songs for playlist mode
   */
  const loadFolderSongs = async () => {
    try {
      console.log('🎵 Loading folder songs for path:', path);
      
      if (!path || !sourceKey) {
        console.error('❌ Missing path or sourceKey:', { path, sourceKey });
        showToast('Thiếu thông tin file hoặc source key', 'error');
        return;
      }
      
      const pathParts = path.split('/');
      pathParts.pop(); // Remove filename
      const folderPath = pathParts.join('/');

      console.log('🎵 Fetching folder:', folderPath, 'with sourceKey:', sourceKey);
      const response = await apiService.music.getFolders({
        key: sourceKey,
        path: folderPath
      });

      console.log('🎵 API Response:', response.data);

      const audioFiles = response.data.folders.filter(item => 
        item.type === 'audio' || item.type === 'file'
      );

      console.log('🎵 Audio files found:', audioFiles.length);

      const playlist = audioFiles.map(file => ({
        ...file,
        name: file.name || file.path.split('/').pop(),
        thumbnail: file.thumbnail || '/default/music-thumb.png'
      }));

      // Get current track info
      const currentTrackInfo = getTrackInfo();
      console.log('🎵 Current track info:', currentTrackInfo);
      
      const currentIndex = playlist.findIndex(track => track.path === path);
      console.log('🎵 Current track index:', currentIndex);
      
      if (currentIndex >= 0) {
        console.log('🎵 Playing track from playlist:', playlist[currentIndex]);
        playTrack(playlist[currentIndex], playlist, currentIndex);
        
        // Add to recent
        addRecentMusic(playlist[currentIndex]);
      } else {
        // If not found in playlist, create a single track from current file
        console.log('🎵 Track not found in folder, playing single track');
        const singleTrack = {
          ...currentTrackInfo,
          path: path,
          thumbnail: null
        };
        playTrack(singleTrack, [singleTrack], 0);
        addRecentMusic(singleTrack);
      }
    } catch (error) {
      console.error('🔥 Failed to load folder songs:', error);
      console.error('🔥 Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Fallback: play as single track even if folder loading fails
      try {
        const currentTrackInfo = getTrackInfo();
        const singleTrack = {
          ...currentTrackInfo,
          path: path,
          thumbnail: null
        };
        console.log('🎵 Error fallback - playing single track:', singleTrack);
        playTrack(singleTrack, [singleTrack], 0);
        addRecentMusic(singleTrack);
        showToast('Không thể load playlist, chỉ phát 1 bài', 'warning');
      } catch (fallbackError) {
        console.error('🔥 Even fallback failed:', fallbackError);
        showToast('Không thể phát nhạc: ' + (error.response?.data?.message || error.message), 'error');
      }
    }
  };

  // Initial load effect
  useEffect(() => {
    if (path && sourceKey && !currentTrack) {
      console.log('🎵 Initial load - path:', path, 'sourceKey:', sourceKey);
      loadFolderSongs();
    }
  }, [path, sourceKey]);

  // Audio element effects
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      console.log('🎵 Audio metadata loaded, duration:', audio.duration);
    };
    const updateBuffered = () => {
      if (audio.buffered.length > 0) {
        setBuffered(audio.buffered.end(audio.buffered.length - 1));
      }
    };
    const handleEnded = () => {
      console.log('🎵 Audio ended');
      if (repeat === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else {
        nextTrack();
      }
    };
    const handleError = (e) => {
      console.error('🔥 Audio error:', e);
      console.error('🔥 Audio error details:', {
        error: e.target.error,
        src: e.target.src,
        networkState: e.target.networkState,
        readyState: e.target.readyState
      });
      setError('Failed to load audio: ' + (e.target.error?.message || 'Unknown error'));
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

  // Auto-play when track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && currentTrack && sourceKey) {
      const audioUrl = buildAudioUrl(currentTrack.path);
      console.log('🎵 Setting audio source:', audioUrl);
      console.log('🎵 Current track:', currentTrack);
      console.log('🎵 Is playing state:', isPlaying);
      
      if (!audioUrl) {
        console.error('❌ Failed to build audio URL');
        setError('Không thể tạo URL audio');
        return;
      }
      
      // Set source and load
      audio.src = audioUrl;
      audio.load();
      
      // Add load event listener to ensure audio is ready before playing
      const handleCanPlay = () => {
        console.log('🎵 Audio can play, attempting to play...');
        if (isPlaying) {
          audio.play().catch(err => {
            console.error('🔥 Audio play error:', err);
            setError('Failed to play audio: ' + err.message);
            showToast('Không thể phát nhạc: ' + err.message, 'error');
          });
        }
        audio.removeEventListener('canplay', handleCanPlay);
      };
      
      const handleLoadError = (e) => {
        console.error('🔥 Audio load error:', e);
        setError('Failed to load audio source');
        showToast('Không thể load audio: ' + (e.target?.error?.message || 'Unknown error'), 'error');
        audio.removeEventListener('error', handleLoadError);
      };
      
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('error', handleLoadError);
      
      // Cleanup on unmount or source change
      return () => {
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('error', handleLoadError);
      };
    }
  }, [currentTrack, isPlaying, sourceKey, showToast]);

  // Volume control
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between p-6 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
          >
            <FiChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={() => navigate(1)}
            className="p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
          >
            <FiChevronRight className="w-6 h-6 text-white" />
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowPlaylist(!showPlaylist)}
            className={`px-4 py-2 rounded-full transition-colors ${
              showPlaylist 
                ? 'bg-green-500 text-black' 
                : 'bg-black/40 text-white hover:bg-black/60'
            }`}
          >
            <FiList className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/music')}
            className="px-4 py-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
          >
            <FiHome className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-88px)]">
        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {currentTrack ? (
            <>
              {/* Album Art */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
              >
                <div className="relative group">
                  <img
                    src={currentTrack.thumbnail || '/default/music-thumb.png'}
                    alt={currentTrack.name}
                    className="w-80 h-80 object-cover rounded-2xl shadow-2xl"
                    onError={(e) => {
                      e.target.src = '/default/music-thumb.png';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-2xl transition-colors duration-300"></div>
                </div>
              </motion.div>

              {/* Track Info */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-center mb-8"
              >
                <h1 className="text-4xl font-bold text-white mb-2 max-w-2xl">
                  {currentTrack.name}
                </h1>
                <p className="text-xl text-gray-300">
                  {currentTrack.artist || 'Unknown Artist'}
                </p>
                {currentTrack.album && (
                  <p className="text-lg text-gray-400 mt-1">
                    {currentTrack.album}
                  </p>
                )}
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex items-center space-x-4 mb-8"
              >
                <button
                  onClick={() => toggleFavorite(currentTrack)}
                  className={`p-3 rounded-full transition-colors ${
                    favorites.some(f => f.path === currentTrack.path)
                      ? 'text-green-500 hover:text-green-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <FiHeart className="w-6 h-6" />
                </button>
                <button className="p-3 rounded-full text-gray-400 hover:text-white transition-colors">
                  <FiDownload className="w-6 h-6" />
                </button>
                <button className="p-3 rounded-full text-gray-400 hover:text-white transition-colors">
                  <FiShare2 className="w-6 h-6" />
                </button>
                <button className="p-3 rounded-full text-gray-400 hover:text-white transition-colors">
                  <FiMoreHorizontal className="w-6 h-6" />
                </button>
              </motion.div>

              {/* Playback Controls */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="w-full max-w-2xl"
              >
                {/* Progress Bar */}
                <div className="flex items-center space-x-4 mb-6">
                  <span className="text-sm text-gray-400 min-w-[40px]">
                    {formatTime(currentTime)}
                  </span>
                  <div 
                    className="flex-1 h-2 bg-gray-600 rounded-full cursor-pointer group"
                    onClick={handleSeek}
                  >
                    <div
                      className="h-full bg-white rounded-full relative group-hover:bg-green-500 transition-colors"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    >
                      <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                  </div>
                  <span className="text-sm text-gray-400 min-w-[40px]">
                    {formatTime(duration)}
                  </span>
                </div>

                {/* Main Controls */}
                <div className="flex items-center justify-center space-x-6">
                  <button
                    onClick={toggleShuffle}
                    className={`p-2 rounded transition-colors ${
                      shuffle ? 'text-green-500' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <FiShuffle className="w-5 h-5" />
                  </button>

                  <button
                    onClick={prevTrack}
                    className="p-2 text-white hover:text-gray-300 transition-colors"
                  >
                    <FiSkipBack className="w-6 h-6" />
                  </button>

                  <button
                    onClick={togglePlayPause}
                    className="p-4 bg-white text-black rounded-full hover:scale-105 transition-transform shadow-lg"
                  >
                    {isPlaying ? (
                      <FiPause className="w-6 h-6" />
                    ) : (
                      <FiPlay className="w-6 h-6 ml-1" />
                    )}
                  </button>

                  <button
                    onClick={nextTrack}
                    className="p-2 text-white hover:text-gray-300 transition-colors"
                  >
                    <FiSkipForward className="w-6 h-6" />
                  </button>

                  <button
                    onClick={toggleRepeat}
                    className={`p-2 rounded transition-colors ${
                      repeat !== 'none' ? 'text-green-500' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <FiRepeat className="w-5 h-5" />
                  </button>
                </div>

                {/* Volume Control */}
                <div className="flex items-center justify-center space-x-4 mt-6">
                  <button
                    onClick={toggleMute}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {volume === 0 ? (
                      <FiVolumeX className="w-5 h-5" />
                    ) : (
                      <FiVolume2 className="w-5 h-5" />
                    )}
                  </button>
                  <div className="w-32 h-1 bg-gray-600 rounded-full">
                    <div
                      className="h-full bg-white rounded-full"
                      style={{ width: `${volume * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-400 min-w-[30px]">
                    {Math.round(volume * 100)}
                  </span>
                </div>
              </motion.div>
            </>
          ) : (
            /* No Track State */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <div className="w-32 h-32 bg-gray-800 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <FiMusic className="w-16 h-16 text-gray-600" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">No track selected</h2>
              <p className="text-gray-400">Choose a song to start playing</p>
            </motion.div>
          )}
        </div>

        {/* Playlist Sidebar */}
        <AnimatePresence>
          {showPlaylist && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              className="w-96 bg-black/40 backdrop-blur-xl border-l border-gray-700/50"
            >
              <div className="p-6 border-b border-gray-700/50">
                <h3 className="text-xl font-bold text-white">
                  Now Playing
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  {currentPlaylist.length} {currentPlaylist.length === 1 ? 'song' : 'songs'}
                </p>
              </div>
              
              <div className="overflow-y-auto h-[calc(100vh-200px)]">
                <div className="p-4 space-y-2">
                  {currentPlaylist.map((track, index) => (
                    <motion.div
                      key={track.path || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`group p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        index === currentIndex 
                          ? 'bg-green-500/20 border border-green-500/50' 
                          : 'hover:bg-white/10'
                      }`}
                      onClick={() => playTrack(track, currentPlaylist, index)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <img
                            src={track.thumbnail || '/default/music-thumb.png'}
                            alt={track.name}
                            className="w-12 h-12 object-cover rounded-lg"
                            onError={(e) => {
                              e.target.src = '/default/music-thumb.png';
                            }}
                          />
                          {index === currentIndex && isPlaying && (
                            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium truncate ${
                            index === currentIndex ? 'text-green-400' : 'text-white'
                          }`}>
                            {track.name}
                          </p>
                          <p className="text-sm text-gray-400 truncate">
                            {track.artist || 'Unknown Artist'}
                          </p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(track);
                            }}
                            className={`p-1 rounded transition-colors ${
                              favorites.some(f => f.path === track.path)
                                ? 'text-green-500'
                                : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            <FiHeart className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Audio Element */}
      <audio
        ref={audioRef}
        preload="metadata"
        className="hidden"
      />

      {/* Loading Overlay */}
      {loading && <LoadingOverlay />}
    </div>
  );
};

export default MusicPlayerSpotify;
