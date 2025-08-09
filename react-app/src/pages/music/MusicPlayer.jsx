// // 📁 src/pages/music/MusicPlayer.jsx
// // 🎵 Spotify-style Music Player với design đẹp và hiện đại

// import React, { useState, useRef, useEffect, useCallback } from 'react';
// import { useNavigate, useSearchParams } from 'react-router-dom';
// import { motion, AnimatePresence } from 'framer-motion';
// import {
//   FiPlay,
//   FiPause,
//   FiSkipBack,
//   FiSkipForward,
//   FiVolume2,
//   FiVolumeX,
//   FiShuffle,
//   FiRepeat,
//   FiList,
//   FiHeart,
//   FiMoreHorizontal,
//   FiHome,
//   FiDownload,
//   FiShare2,
//   FiMaximize2,
//   FiMinimize2,
//   FiChevronLeft,
//   FiChevronRight,
//   FiMusic
// } from 'react-icons/fi';
// import { useAuthStore, useMusicStore, useUIStore } from '@/store';
// import { useRecentMusicManager } from '@/hooks/useMusicData';
// import { apiService } from '@/utils/api';
// import LoadingOverlay from '@/components/common/LoadingOverlay';
// import Button from '@/components/common/Button';

// const MusicPlayer = () => {
//   const navigate = useNavigate();
//   const [searchParams] = useSearchParams();
//   const path = searchParams.get('file'); // Đường dẫn đến audio file
//   const playlistPath = searchParams.get('playlist'); // Path của playlist

//   const { 
//     currentTrack, 
//     currentPlaylist, 
//     currentIndex,
//     isPlaying,
//     volume,
//     shuffle,
//     repeat,
//     playerSettings, 
//     updatePlayerSettings,
//     toggleFavorite,
//     favorites,
//     setCurrentTrack,
//     setPlaylists,
//     playTrack,
//     pauseTrack,
//     resumeTrack,
//     nextTrack,
//     prevTrack,
//     setVolume
//   } = useMusicStore();
  
//   const { darkMode, showToast } = useUIStore();
//   const { sourceKey } = useAuthStore();
//   const { addRecentMusic } = useRecentMusicManager();

//   // === REFS ===
//   const audioRef = useRef(null);
//   const progressBarRef = useRef(null);

//   // === STATE MANAGEMENT ===
//   const [currentTime, setCurrentTime] = useState(0);
//   const [duration, setDuration] = useState(0);
//   const [buffered, setBuffered] = useState(0);
//   const [isMuted, setIsMuted] = useState(false);
//   const [showPlaylist, setShowPlaylist] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [isFullscreen, setIsFullscreen] = useState(false);

//   // === COMPUTED VALUES ===
//   const isFavorited = favorites.some(fav => fav.path === path);
  
//   /**
//    * 🔗 Build audio URL from path
//    */
//   function buildAudioUrl(audioPath) {
//     if (!audioPath || !sourceKey) return '';
//     return `/api/music/audio?key=${encodeURIComponent(sourceKey)}&file=${encodeURIComponent(audioPath)}`;
//   }

//   /**
//    * 📊 Get track info from path
//    */
//   const getTrackInfo = useCallback(() => {
//     if (!path) return { name: 'Unknown Track', artist: 'Unknown Artist', album: 'Unknown Album' };
    
//     const pathParts = path.split('/');
//     const fileName = pathParts[pathParts.length - 1];
//     const folderName = pathParts[pathParts.length - 2] || 'Unknown Album';
    
//     // Try to parse filename for metadata
//     const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
//     const parts = nameWithoutExt.split(' - ');
    
//     if (parts.length >= 2) {
//       return {
//         name: parts[1],
//         artist: parts[0],
//         album: folderName,
//         path: path,
//         thumbnail: `/api/music/thumbnail?key=${encodeURIComponent(sourceKey)}&file=${encodeURIComponent(path)}`
//       };
//     } else {
//       return {
//         name: nameWithoutExt,
//         artist: 'Unknown Artist',
//         album: folderName,
//         path: path,
//         thumbnail: '/default/music-thumb.png'
//       };
//     }
//   }, [path, sourceKey]);

//   const trackInfo = getTrackInfo();

//   // === EFFECT HOOKS ===
  
//   /**
//    * 🎯 Initialize audio and load metadata
//    */
//   useEffect(() => {
//     if (!path && !playlistPath) {
//       navigate('/music');
//       return;
//     }

//     const initializePlayer = async () => {
//       setIsLoading(true);
//       setError(null);

//       try {
//         if (playlistPath) {
//           // Load playlist
//           await loadPlaylistSongs(playlistPath);
//         } else if (path) {
//           // Load single file and folder
//           await loadFolderSongs();
//         }
//       } catch (err) {
//         console.error('Failed to initialize player:', err);
//         setError('Failed to load music');
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     initializePlayer();
//   }, [path, playlistPath, sourceKey, navigate]);

//   // Audio event handlers
//   useEffect(() => {
//     const audio = audioRef.current;
//     if (!audio) return;

//     const updateTime = () => setCurrentTime(audio.currentTime);
//     const updateDuration = () => setDuration(audio.duration);
//     const updateBuffered = () => {
//       if (audio.buffered.length > 0) {
//         setBuffered(audio.buffered.end(audio.buffered.length - 1));
//       }
//     };

//     const handleLoadedMetadata = () => {
//       setDuration(audio.duration);
//       updateBuffered();
//     };

//     const handleEnded = () => {
//       if (repeat === 'one') {
//         audio.currentTime = 0;
//         audio.play();
//       } else {
//         nextTrack();
//       }
//     };

//     const handleError = (e) => {
//       console.error('Audio error:', e);
//       setError('Failed to play audio');
//     };

//     audio.addEventListener('timeupdate', updateTime);
//     audio.addEventListener('loadedmetadata', handleLoadedMetadata);
//     audio.addEventListener('progress', updateBuffered);
//     audio.addEventListener('ended', handleEnded);
//     audio.addEventListener('error', handleError);

//     return () => {
//       audio.removeEventListener('timeupdate', updateTime);
//       audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
//       audio.removeEventListener('progress', updateBuffered);
//       audio.removeEventListener('ended', handleEnded);
//       audio.removeEventListener('error', handleError);
//     };
//   }, [repeat, nextTrack]);

//   // Auto-play when track changes
//   useEffect(() => {
//     const audio = audioRef.current;
//     if (audio && currentTrack && playerSettings.autoPlay) {
//       audio.src = buildAudioUrl(currentTrack.path);
//       audio.load();
//       if (isPlaying) {
//         audio.play().catch(console.error);
//       }
//     }
//   }, [currentTrack, playerSettings.autoPlay, isPlaying]);

//   // Volume control
//   useEffect(() => {
//     const audio = audioRef.current;
//     if (audio) {
//       audio.volume = isMuted ? 0 : volume;
//     }
//   }, [volume, isMuted]);

//   /**
//    * ⌨️ Keyboard shortcuts
//    */
//   useEffect(() => {
//     const handleKeyPress = (e) => {
//       // Don't handle shortcuts when typing
//       if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

//       switch (e.code) {
//         case 'Space':
//           e.preventDefault();
//           togglePlayPause();
//           break;
//         case 'ArrowLeft':
//           e.preventDefault();
//           seekRelative(-10);
//           break;
//         case 'ArrowRight':
//           e.preventDefault();
//           seekRelative(10);
//           break;
//         case 'ArrowUp':
//           e.preventDefault();
//           setVolume(Math.min(1, volume + 0.1));
//           break;
//         case 'ArrowDown':
//           e.preventDefault();
//           setVolume(Math.max(0, volume - 0.1));
//           break;
//         case 'KeyM':
//           e.preventDefault();
//           toggleMute();
//           break;
//         case 'KeyL':
//           e.preventDefault();
//           setShowPlaylist(!showPlaylist);
//           break;
//         case 'KeyF':
//           e.preventDefault();
//           toggleFullscreen();
//           break;
//       }
//     };

//     window.addEventListener('keydown', handleKeyPress);
//     return () => window.removeEventListener('keydown', handleKeyPress);
//   }, [showPlaylist, volume, isPlaying]);

//   // === AUDIO FUNCTIONS ===

//   const loadFolderSongs = async () => {
//     try {
//       const pathParts = path.split('/');
//       pathParts.pop(); // Remove filename
//       const folderPath = pathParts.join('/');

//       const response = await apiService.music.getFolders({
//         key: sourceKey,
//         path: folderPath
//       });

//       const audioFiles = response.data.folders.filter(item => 
//         item.type === 'audio' || item.type === 'file'
//       );

//       const playlist = audioFiles.map(file => ({
//         ...file,
//         name: file.name || file.path.split('/').pop(),
//         thumbnail: file.thumbnail || '/default/music-thumb.png'
//       }));

//       const currentIndex = playlist.findIndex(track => track.path === path);
      
//       playTrack(trackInfo, playlist, Math.max(0, currentIndex));
      
//       // Add to recent
//       addRecentMusic(trackInfo);
//     } catch (error) {
//       console.error('Failed to load folder songs:', error);
//       throw error;
//     }
//   };

//   const loadPlaylistSongs = async (id) => {
//     try {
//       const response = await apiService.music.getPlaylist(id, { key: sourceKey });
//       const tracks = response.data.tracks || [];
      
//       const playlist = tracks.map(track => ({
//         ...track,
//         thumbnail: track.thumbnail || '/default/music-thumb.png'
//       }));

//       if (playlist.length > 0) {
//         playTrack(playlist[0], playlist, 0);
//         addRecentMusic(playlist[0]);
//       }
//     } catch (error) {
//       console.error('Failed to load playlist:', error);
//       throw error;
//     }
//   };

//   const togglePlayPause = () => {
//     const audio = audioRef.current;
//     if (!audio) return;

//     if (isPlaying) {
//       audio.pause();
//       pauseTrack();
//     } else {
//       audio.play().catch(console.error);
//       resumeTrack();
//     }
//   };

//   const toggleMute = () => {
//     setIsMuted(!isMuted);
//   };

//   const seekTo = (time) => {
//     const audio = audioRef.current;
//     if (audio) {
//       audio.currentTime = time;
//       setCurrentTime(time);
//     }
//   };

//   const seekRelative = (seconds) => {
//     const audio = audioRef.current;
//     if (audio) {
//       const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
//       seekTo(newTime);
//     }
//   };

//   const handleProgressClick = (e) => {
//     const progressBar = progressBarRef.current;
//     if (!progressBar || !duration) return;

//     const rect = progressBar.getBoundingClientRect();
//     const clickX = e.clientX - rect.left;
//     const percentage = clickX / rect.width;
//     const newTime = percentage * duration;
    
//     seekTo(newTime);
//   };

//   const toggleFavoriteTrack = async () => {
//     try {
//       await toggleFavorite(trackInfo);
//       showToast(
//         isFavorited ? 'Removed from favorites' : 'Added to favorites',
//         'success'
//       );
//     } catch (error) {
//       showToast('Failed to update favorites', 'error');
//     }
//   };

//   const toggleFullscreen = () => {
//     setIsFullscreen(!isFullscreen);
//   };

//   const formatTime = (time) => {
//     if (isNaN(time)) return '0:00';
//     const minutes = Math.floor(time / 60);
//     const seconds = Math.floor(time % 60);
//     return `${minutes}:${seconds.toString().padStart(2, '0')}`;
//   };

//   if (isLoading) {
//     return <LoadingOverlay message="Loading music player..." />;
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
//         <div className="text-center">
//           <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
//             Failed to load music
//           </h2>
//           <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
//           <Button onClick={() => navigate('/music')} variant="primary">
//             Back to Music
//           </Button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
//       {/* Top Navigation Bar */}
//       <div className="flex items-center justify-between p-6 bg-black/20 backdrop-blur-sm">
//         <div className="flex items-center space-x-4">
//           <button
//             onClick={() => navigate(-1)}
//             className="p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
//           >
//             <FiChevronLeft className="w-6 h-6 text-white" />
//           </button>
//           <button
//             onClick={() => navigate(1)}
//             className="p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
//           >
//             <FiChevronRight className="w-6 h-6 text-white" />
//           </button>
//         </div>
        
//         <div className="flex items-center space-x-4">
//           <button
//             onClick={() => setShowPlaylist(!showPlaylist)}
//             className={`px-4 py-2 rounded-full transition-colors ${
//               showPlaylist 
//                 ? 'bg-green-500 text-black' 
//                 : 'bg-black/40 text-white hover:bg-black/60'
//             }`}
//           >
//             <FiList className="w-5 h-5" />
//           </button>
//           <button
//             onClick={() => navigate('/music')}
//             className="px-4 py-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
//           >
//             <FiHome className="w-5 h-5" />
//           </button>
//         </div>
//       </div>

//       <div className="flex h-[calc(100vh-88px)]">
//         {/* Main Content */}
//         <div className="flex-1 flex flex-col items-center justify-center p-8">
//           {currentTrack ? (
//             <>
//               {/* Album Art */}
//               <motion.div
//                 initial={{ scale: 0.8, opacity: 0 }}
//                 animate={{ scale: 1, opacity: 1 }}
//                 transition={{ duration: 0.5 }}
//                 className="mb-8"
//               >
//                 <div className="relative group">
//                   <img
//                     src={currentTrack.thumbnail || '/default/music-thumb.png'}
//                     alt={currentTrack.name}
//                     className="w-80 h-80 object-cover rounded-2xl shadow-2xl"
//                     onError={(e) => {
//                       e.target.src = '/default/music-thumb.png';
//                     }}
//                   />
//                   <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-2xl transition-colors duration-300"></div>
//                 </div>
//               </motion.div>

//               {/* Track Info */}
//               <motion.div
//                 initial={{ y: 20, opacity: 0 }}
//                 animate={{ y: 0, opacity: 1 }}
//                 transition={{ duration: 0.5, delay: 0.2 }}
//                 className="text-center mb-8"
//               >
//                 <h1 className="text-4xl font-bold text-white mb-2 max-w-2xl">
//                   {currentTrack.name}
//                 </h1>
//                 <p className="text-xl text-gray-300">
//                   {currentTrack.artist || 'Unknown Artist'}
//                 </p>
//                 {currentTrack.album && (
//                   <p className="text-lg text-gray-400 mt-1">
//                     {currentTrack.album}
//                   </p>
//                 )}
//               </motion.div>

//               {/* Action Buttons */}
//               <motion.div
//                 initial={{ y: 20, opacity: 0 }}
//                 animate={{ y: 0, opacity: 1 }}
//                 transition={{ duration: 0.5, delay: 0.3 }}
//                 className="flex items-center space-x-4 mb-8"
//               >
//                 <button
//                   onClick={() => toggleFavorite(currentTrack)}
//                   className={`p-3 rounded-full transition-colors ${
//                     favorites.some(f => f.path === currentTrack.path)
//                       ? 'text-green-500 hover:text-green-400'
//                       : 'text-gray-400 hover:text-white'
//                   }`}
//                 >
//                   <FiHeart className="w-6 h-6" />
//                 </button>
//                 <button className="p-3 rounded-full text-gray-400 hover:text-white transition-colors">
//                   <FiDownload className="w-6 h-6" />
//                 </button>
//                 <button className="p-3 rounded-full text-gray-400 hover:text-white transition-colors">
//                   <FiShare2 className="w-6 h-6" />
//                 </button>
//                 <button className="p-3 rounded-full text-gray-400 hover:text-white transition-colors">
//                   <FiMoreHorizontal className="w-6 h-6" />
//                 </button>
//               </motion.div>

//               {/* Playback Controls */}
//               <motion.div
//                 initial={{ y: 20, opacity: 0 }}
//                 animate={{ y: 0, opacity: 1 }}
//                 transition={{ duration: 0.5, delay: 0.4 }}
//                 className="w-full max-w-2xl"
//               >
//                 {/* Progress Bar */}
//                 <div className="flex items-center space-x-4 mb-6">
//                   <span className="text-sm text-gray-400 min-w-[40px]">
//                     {formatTime(currentTime)}
//                   </span>
//                   <div 
//                     className="flex-1 h-2 bg-gray-600 rounded-full cursor-pointer group"
//                     onClick={handleSeek}
//                   >
//                     <div
//                       className="h-full bg-white rounded-full relative group-hover:bg-green-500 transition-colors"
//                       style={{ width: `${(currentTime / duration) * 100}%` }}
//                     >
//                       <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
//                     </div>
//                   </div>
//                   <span className="text-sm text-gray-400 min-w-[40px]">
//                     {formatTime(duration)}
//                   </span>
//                 </div>

//                 {/* Main Controls */}
//                 <div className="flex items-center justify-center space-x-6">
//                   <button
//                     onClick={toggleShuffle}
//                     className={`p-2 rounded transition-colors ${
//                       shuffle ? 'text-green-500' : 'text-gray-400 hover:text-white'
//                     }`}
//                   >
//                     <FiShuffle className="w-5 h-5" />
//                   </button>

//                   <button
//                     onClick={prevTrack}
//                     className="p-2 text-white hover:text-gray-300 transition-colors"
//                   >
//                     <FiSkipBack className="w-6 h-6" />
//                   </button>

//                   <button
//                     onClick={togglePlayPause}
//                     className="p-4 bg-white text-black rounded-full hover:scale-105 transition-transform shadow-lg"
//                   >
//                     {isPlaying ? (
//                       <FiPause className="w-6 h-6" />
//                     ) : (
//                       <FiPlay className="w-6 h-6 ml-1" />
//                     )}
//                   </button>

//                   <button
//                     onClick={nextTrack}
//                     className="p-2 text-white hover:text-gray-300 transition-colors"
//                   >
//                     <FiSkipForward className="w-6 h-6" />
//                   </button>

//                   <button
//                     onClick={toggleRepeat}
//                     className={`p-2 rounded transition-colors ${
//                       repeat !== 'none' ? 'text-green-500' : 'text-gray-400 hover:text-white'
//                     }`}
//                   >
//                     <FiRepeat className="w-5 h-5" />
//                   </button>
//                 </div>

//                 {/* Volume Control */}
//                 <div className="flex items-center justify-center space-x-4 mt-6">
//                   <button
//                     onClick={toggleMute}
//                     className="text-gray-400 hover:text-white transition-colors"
//                   >
//                     {volume === 0 ? (
//                       <FiVolumeX className="w-5 h-5" />
//                     ) : (
//                       <FiVolume2 className="w-5 h-5" />
//                     )}
//                   </button>
//                   <div className="w-32 h-1 bg-gray-600 rounded-full">
//                     <div
//                       className="h-full bg-white rounded-full"
//                       style={{ width: `${volume * 100}%` }}
//                     ></div>
//                   </div>
//                   <span className="text-sm text-gray-400 min-w-[30px]">
//                     {Math.round(volume * 100)}
//                   </span>
//                 </div>
//               </motion.div>
//             </>
//           ) : (
//             /* No Track State */
//             <motion.div
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               className="text-center"
//             >
//               <div className="w-32 h-32 bg-gray-800 rounded-2xl flex items-center justify-center mb-6 mx-auto">
//                 <FiMusic className="w-16 h-16 text-gray-600" />
//               </div>
//               <h2 className="text-2xl font-bold text-white mb-2">No track selected</h2>
//               <p className="text-gray-400">Choose a song to start playing</p>
//             </motion.div>
//           )}
//         </div>

//         {/* Playlist Sidebar */}
//         <AnimatePresence>
//           {showPlaylist && (
//             <motion.div
//               initial={{ x: '100%' }}
//               animate={{ x: 0 }}
//               exit={{ x: '100%' }}
//               transition={{ type: 'spring', damping: 20, stiffness: 100 }}
//               className="w-96 bg-black/40 backdrop-blur-xl border-l border-gray-700/50"
//             >
//               <div className="p-6 border-b border-gray-700/50">
//                 <h3 className="text-xl font-bold text-white">
//                   Now Playing
//                 </h3>
//                 <p className="text-sm text-gray-400 mt-1">
//                   {currentPlaylist.length} {currentPlaylist.length === 1 ? 'song' : 'songs'}
//                 </p>
//               </div>
              
//               <div className="overflow-y-auto h-[calc(100vh-200px)]">
//                 <div className="p-4 space-y-2">
//                   {currentPlaylist.map((track, index) => (
//                     <motion.div
//                       key={track.path || index}
//                       initial={{ opacity: 0, y: 20 }}
//                       animate={{ opacity: 1, y: 0 }}
//                       transition={{ delay: index * 0.05 }}
//                       className={`group p-3 rounded-lg cursor-pointer transition-all duration-200 ${
//                         index === currentIndex 
//                           ? 'bg-green-500/20 border border-green-500/50' 
//                           : 'hover:bg-white/10'
//                       }`}
//                       onClick={() => playTrack(track, currentPlaylist, index)}
//                     >
//                       <div className="flex items-center space-x-3">
//                         <div className="relative">
//                           <img
//                             src={track.thumbnail || '/default/music-thumb.png'}
//                             alt={track.name}
//                             className="w-12 h-12 object-cover rounded-lg"
//                             onError={(e) => {
//                               e.target.src = '/default/music-thumb.png';
//                             }}
//                           />
//                           {index === currentIndex && isPlaying && (
//                             <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
//                               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
//                             </div>
//                           )}
//                         </div>
//                         <div className="flex-1 min-w-0">
//                           <p className={`font-medium truncate ${
//                             index === currentIndex ? 'text-green-400' : 'text-white'
//                           }`}>
//                             {track.name}
//                           </p>
//                           <p className="text-sm text-gray-400 truncate">
//                             {track.artist || 'Unknown Artist'}
//                           </p>
//                         </div>
//                         <div className="opacity-0 group-hover:opacity-100 transition-opacity">
//                           <button
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               toggleFavorite(track);
//                             }}
//                             className={`p-1 rounded transition-colors ${
//                               favorites.some(f => f.path === track.path)
//                                 ? 'text-green-500'
//                                 : 'text-gray-400 hover:text-white'
//                             }`}
//                           >
//                             <FiHeart className="w-4 h-4" />
//                           </button>
//                         </div>
//                       </div>
//                     </motion.div>
//                   ))}
//                 </div>
//               </div>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>

//       {/* Audio Element */}
//       <audio
//         ref={audioRef}
//         preload="metadata"
//         className="hidden"
//       />

//       {/* Loading Overlay */}
//       {(loading || globalLoading) && <LoadingOverlay />}
//     </div>
//   );
// };

// export default MusicPlayer;
//       {/* Audio element */}
//       <audio 
//         ref={audioRef}
//         src={buildAudioUrl(currentTrack?.path || path)}
//         preload="metadata"
//       />

//       {/* Main player layout */}
//       <div className="flex flex-col h-screen">
//         {/* Top bar */}
//         <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm">
//           <div className="flex items-center space-x-4">
//             <Button
//               variant="ghost"
//               size="sm"
//               onClick={() => navigate('/music')}
//               icon={FiHome}
//               className="text-white hover:bg-white/10"
//             >
//               Back
//             </Button>
//             <h1 className="text-lg font-semibold">Music Player</h1>
//           </div>
          
//           <div className="flex items-center space-x-2">
//             <Button
//               variant="ghost"
//               size="sm"
//               onClick={() => setShowPlaylist(!showPlaylist)}
//               icon={FiList}
//               className="text-white hover:bg-white/10"
//             >
//               Playlist
//             </Button>
//             <Button
//               variant="ghost"
//               size="sm"
//               onClick={toggleFullscreen}
//               icon={isFullscreen ? FiMinimize2 : FiMaximize2}
//               className="text-white hover:bg-white/10"
//             />
//           </div>
//         </div>

//         {/* Main content */}
//         <div className="flex-1 flex">
//           {/* Player section */}
//           <div className={`flex-1 flex flex-col items-center justify-center p-8 ${showPlaylist ? 'lg:w-2/3' : 'w-full'}`}>
//             {/* Album art */}
//             <div className="w-80 h-80 mb-8 relative">
//               <img
//                 src={currentTrack?.thumbnail || trackInfo.thumbnail}
//                 alt={currentTrack?.name || trackInfo.name}
//                 className="w-full h-full object-cover rounded-2xl shadow-2xl"
//                 onError={(e) => {
//                   e.target.src = '/default/music-thumb.png';
//                 }}
//               />
              
//               {/* Visualizer overlay */}
//               {isPlaying && (
//                 <div className="absolute inset-0 bg-black/30 rounded-2xl flex items-center justify-center">
//                   <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin" />
//                 </div>
//               )}
//             </div>

//             {/* Track info */}
//             <div className="text-center mb-8 max-w-md">
//               <h2 className="text-3xl font-bold mb-2 truncate">
//                 {currentTrack?.name || trackInfo.name}
//               </h2>
//               <p className="text-xl text-gray-300 mb-1 truncate">
//                 {currentTrack?.artist || trackInfo.artist}
//               </p>
//               <p className="text-lg text-gray-400 truncate">
//                 {currentTrack?.album || trackInfo.album}
//               </p>
//             </div>

//             {/* Progress bar */}
//             <div className="w-full max-w-md mb-6">
//               <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
//                 <span>{formatTime(currentTime)}</span>
//                 <span>{formatTime(duration)}</span>
//               </div>
//               <div
//                 ref={progressBarRef}
//                 className="h-2 bg-gray-700 rounded-full cursor-pointer relative overflow-hidden"
//                 onClick={handleProgressClick}
//               >
//                 {/* Buffered progress */}
//                 <div
//                   className="absolute top-0 left-0 h-full bg-gray-600 rounded-full"
//                   style={{ width: `${(buffered / duration) * 100 || 0}%` }}
//                 />
//                 {/* Current progress */}
//                 <div
//                   className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
//                   style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
//                 />
//               </div>
//             </div>

//             {/* Controls */}
//             <div className="flex items-center space-x-6 mb-6">
//               <Button
//                 variant="ghost"
//                 size="lg"
//                 onClick={toggleFavoriteTrack}
//                 icon={FiHeart}
//                 className={`text-2xl ${isFavorited ? 'text-red-500' : 'text-white'} hover:bg-white/10`}
//               />
              
//               <Button
//                 variant="ghost"
//                 size="lg"
//                 onClick={prevTrack}
//                 icon={FiSkipBack}
//                 className="text-2xl text-white hover:bg-white/10"
//               />
              
//               <Button
//                 variant="primary"
//                 size="xl"
//                 onClick={togglePlayPause}
//                 icon={isPlaying ? FiPause : FiPlay}
//                 className="text-3xl bg-blue-600 hover:bg-blue-700 rounded-full p-4"
//               />
              
//               <Button
//                 variant="ghost"
//                 size="lg"
//                 onClick={nextTrack}
//                 icon={FiSkipForward}
//                 className="text-2xl text-white hover:bg-white/10"
//               />
              
//               <Button
//                 variant="ghost"
//                 size="lg"
//                 onClick={() => setShowPlaylist(!showPlaylist)}
//                 icon={FiMoreHorizontal}
//                 className="text-2xl text-white hover:bg-white/10"
//               />
//             </div>

//             {/* Volume and additional controls */}
//             <div className="flex items-center space-x-4">
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 onClick={() => useMusicStore.getState().toggleShuffle()}
//                 icon={FiShuffle}
//                 className={`${shuffle ? 'text-blue-500' : 'text-white'} hover:bg-white/10`}
//               />
              
//               <div className="flex items-center space-x-2">
//                 <Button
//                   variant="ghost"
//                   size="sm"
//                   onClick={toggleMute}
//                   icon={isMuted ? FiVolumeX : FiVolume2}
//                   className="text-white hover:bg-white/10"
//                 />
//                 <input
//                   type="range"
//                   min="0"
//                   max="1"
//                   step="0.1"
//                   value={isMuted ? 0 : volume}
//                   onChange={(e) => setVolume(parseFloat(e.target.value))}
//                   className="w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
//                 />
//               </div>
              
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 onClick={() => useMusicStore.getState().setRepeat(repeat === 'none' ? 'all' : repeat === 'all' ? 'one' : 'none')}
//                 icon={FiRepeat}
//                 className={`${repeat !== 'none' ? 'text-blue-500' : 'text-white'} hover:bg-white/10`}
//               />
//             </div>
//           </div>

//           {/* Playlist sidebar */}
//           <AnimatePresence>
//             {showPlaylist && (
//               <motion.div
//                 initial={{ x: '100%' }}
//                 animate={{ x: 0 }}
//                 exit={{ x: '100%' }}
//                 className="w-1/3 min-w-80 bg-black/40 backdrop-blur-sm border-l border-gray-700 p-6 overflow-y-auto"
//               >
//                 <h3 className="text-xl font-bold mb-4">Playlist ({currentPlaylist.length})</h3>
//                 <div className="space-y-2">
//                   {currentPlaylist.map((track, index) => (
//                     <div
//                       key={track.path || index}
//                       className={`p-3 rounded-lg cursor-pointer transition-colors ${
//                         index === currentIndex 
//                           ? 'bg-blue-600/50 border border-blue-500' 
//                           : 'bg-white/5 hover:bg-white/10'
//                       }`}
//                       onClick={() => playTrack(track, currentPlaylist, index)}
//                     >
//                       <div className="flex items-center space-x-3">
//                         <img
//                           src={track.thumbnail}
//                           alt={track.name}
//                           className="w-12 h-12 object-cover rounded"
//                           onError={(e) => {
//                             e.target.src = '/default/music-thumb.png';
//                           }}
//                         />
//                         <div className="flex-1 min-w-0">
//                           <p className="font-semibold truncate">{track.name}</p>
//                           <p className="text-sm text-gray-400 truncate">{track.artist || 'Unknown Artist'}</p>
//                         </div>
//                         {index === currentIndex && isPlaying && (
//                           <div className="text-blue-500">
//                             <FiPlay className="w-4 h-4" />
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </motion.div>
//             )}
//           </AnimatePresence>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default MusicPlayer;
