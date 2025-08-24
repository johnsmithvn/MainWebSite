// 📁 src/pages/movie/MoviePlayer.jsx
// 🎬 Movie player page with full functionality from old frontend

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore, useMovieStore, useUIStore } from '@/store';
import { useRecentManager } from '@/hooks';
import { apiService } from '@/utils/api';
import { PAGINATION } from '@/constants';
import Header from '@/components/common/Header';
import Sidebar from '@/components/common/Sidebar';
import SearchModal from '@/components/common/SearchModal';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import Toast from '@/components/common/Toast';
import MovieRandomSection from '@/components/movie/MovieRandomSection';

const MoviePlayer = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const videoRef = useRef(null);
  const gestureTargetRef = useRef(null);
  
  // Get file and key from URL params or navigation state
  const fileParam = searchParams.get('file');
  const keyParam = searchParams.get('key');
  const { file: stateFile, key: stateKey } = location.state || {};
  const initialFile = stateFile || fileParam || '';
  const initialKey = stateKey || keyParam || '';

  const { sourceKey, setSourceKey, token, isSecureKey } = useAuthStore();
  const { toggleFavorite, favorites, fetchFavorites, favoritesRefreshTrigger } = useMovieStore();
  const { 
    sidebarOpen, 
    setSidebarOpen,
    showToast, 
    searchModalOpen, 
    toggleSearchModal 
  } = useUIStore();
  
  const { addRecentItem } = useRecentManager('movie');

  // Local state
  const [currentFile, setCurrentFile] = useState(initialFile);
  const [videoName, setVideoName] = useState('');
  const [folderName, setFolderName] = useState('');
  const [folderPath, setFolderPath] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [videoList, setVideoList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [error, setError] = useState('');
  
  // Separate loading states for different actions
  const [videoLoading, setVideoLoading] = useState(false); // For video initialization
  const [thumbnailLoading, setThumbnailLoading] = useState(false); // For thumbnail setting
  const [randomLoading, setRandomLoading] = useState(false); // For random jump
  
  // Video gesture controls
  const [dragStartX, setDragStartX] = useState(null);
  const [startTime, setStartTime] = useState(0);
  const [dragging, setDragging] = useState(false);
  
  // Constants from old frontend
  const SKIP_SECONDS = 10;
  const PIXELS_PER_SECOND = 10;
  const SWIPE_THRESHOLD = 5;

  // Track last initialized combination to avoid duplicate init (StrictMode / key sync)
  const lastInitRef = useRef({ file: null, key: null });
  const viewCountStateRef = useRef({ path: '', counted: false });

  // Close sidebar on player load to avoid conflicts with video controls
  useEffect(() => {
    console.log('🎬 MoviePlayer mounted - closing sidebar');
    setSidebarOpen(false);
  }, [setSidebarOpen]);

  // Debug log when sidebar state changes
  useEffect(() => {
    console.log('🎬 MoviePlayer sidebar state changed:', sidebarOpen);
  }, [sidebarOpen]);

  // Sync current file from URL/state when either changes
  useEffect(() => {
    const nextFile = stateFile || fileParam || '';
    if (nextFile !== currentFile) {
      setCurrentFile(nextFile);
    }
  }, [stateFile, fileParam, currentFile]);

  // Set sourceKey from state/URL if provided
  useEffect(() => {
    const nextKey = stateKey || keyParam;
    if (nextKey && nextKey !== sourceKey) {
      setSourceKey(nextKey);
    }
  }, [stateKey, keyParam, sourceKey, setSourceKey]);

  // Authentication check
  useEffect(() => {
    if (isSecureKey(sourceKey) && !token) {
      showToast('❌ Cần đăng nhập để xem video này', 'error');
      navigate('/');
      return;
    }
  }, [sourceKey, token, isSecureKey, navigate, showToast]);

  // Initialize video when file/key changes
  useEffect(() => {
    if (!currentFile) {
      setError('❌ Thiếu file');
      return;
    }

    const resolvedKey = keyParam || sourceKey;
    if (!resolvedKey) {
      setError('❌ Thiếu sourceKey');
      return;
    }

    // If URL has key but store not yet synced, wait to avoid double init
    if (keyParam && sourceKey !== keyParam) return;

    initializeVideo();
  }, [currentFile, sourceKey, keyParam]);

  // Load video info and setup
  const initializeVideo = useCallback(async () => {
    if (!currentFile || !sourceKey) return;

    // Guard against duplicate initialization with same file+key
    if (
      lastInitRef.current.file === currentFile &&
      lastInitRef.current.key === sourceKey
    ) {
      return;
    }
    lastInitRef.current = { file: currentFile, key: sourceKey };
    
    setVideoLoading(true);
    setError('');

    try {
      // Extract folder info
      const parts = currentFile.split('/').filter(Boolean);
      const videoFileName = parts[parts.length - 1];
      const parentFolderPath = parts.slice(0, -1).join('/');
      const parentFolderName = parts.at(-2) || 'Home';

      setVideoName(videoFileName);
      setFolderPath(parentFolderPath);
      setFolderName(parentFolderName);

      // Set video source
      if (videoRef.current) {
        const videoSrc = `/api/movie/video?key=${sourceKey}&file=${encodeURIComponent(currentFile)}${
          token ? `&token=${encodeURIComponent(token)}` : ''
        }`;
        videoRef.current.src = videoSrc;
        // Ensure the video element reloads when the source changes
        if (typeof videoRef.current.load === 'function') {
          videoRef.current.load();
        }
        // Reset view count state for this file
        viewCountStateRef.current = { path: currentFile, counted: false };
      }

      // Load sibling videos
      await loadSiblingVideos(parentFolderPath, currentFile);
      
      // Check if current video is favorited
      await checkFavoriteStatus();
      
      // Save to recent
      saveToRecent(videoFileName, currentFile);
      
    } catch (err) {
      console.error('Error initializing video:', err);
      setError('❌ Lỗi khi khởi tạo video');
    } finally {
      setVideoLoading(false);
    }
  }, [currentFile, sourceKey, token]);

  // Load videos in the same folder
  const loadSiblingVideos = async (folderPath, currentFile) => {
    try {
      const response = await apiService.movie.getFolders({
        key: sourceKey,
        path: folderPath
      });
      
      const allItems = response.data.folders || [];
      const videosOnly = allItems.filter(item => 
        item.type === 'video' || item.type === 'file'
      );
      
      setVideoList(videosOnly);
      
      const index = videosOnly.findIndex(v => v.path === currentFile);
      setCurrentIndex(index);
      
    } catch (err) {
      console.error('Error loading sibling videos:', err);
      showToast('❌ Lỗi khi tải danh sách video', 'error');
    }
  };

  // Check if current video is in favorites
  const checkFavoriteStatus = async () => {
    try {
      await fetchFavorites();
      const found = favorites.find(v => v.path === currentFile);
      setIsFavorite(!!found);
    } catch (err) {
      console.warn('Failed to check favorite status:', err);
    }
  };

  // Update favorite status when favorites change
  useEffect(() => {
    const found = favorites.find(v => v.path === currentFile);
    setIsFavorite(!!found);
  }, [favorites, currentFile, favoritesRefreshTrigger]);

  // Toggle favorite status
  const handleToggleFavorite = async () => {
    try {
      const videoItem = {
        path: currentFile,
        name: videoName,
        type: 'video',
        thumbnail: getVideoThumbnail(currentFile)
      };
      
      await toggleFavorite(videoItem);
      showToast(
        isFavorite ? '💔 Đã bỏ yêu thích' : '❤️ Đã thêm vào yêu thích', 
        'success'
      );
    } catch (err) {
      console.error('Error toggling favorite:', err);
      showToast('❌ Lỗi khi thay đổi yêu thích', 'error');
    }
  };

  // Set thumbnail for current video
  const handleSetThumbnail = async () => {
    try {
      setThumbnailLoading(true);
      
      // Extract thumbnail for the video
      await apiService.movie.extractThumbnail({
        key: sourceKey,
        path: currentFile
      });
      
      // Set as folder thumbnail using the old API path
      await fetch('/api/movie/set-thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          key: sourceKey, 
          folderPath, 
          srcPath: currentFile 
        })
      });
      
      showToast('✅ Đã đặt thumbnail', 'success');
    } catch (err) {
      console.error('Error setting thumbnail:', err);
      showToast('❌ Lỗi đặt thumbnail', 'error');
    } finally {
      setThumbnailLoading(false);
    }
  };

  // Increase view count once per file after threshold seconds of playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Reset when file changes
    viewCountStateRef.current = { path: currentFile, counted: false };

    const THRESHOLD_SECONDS = 3;
    const handleTimeUpdate = async () => {
      if (!currentFile || !sourceKey) return;
      const state = viewCountStateRef.current;
      if (state.path !== currentFile) {
        viewCountStateRef.current = { path: currentFile, counted: false };
        return;
      }
      if (!state.counted && video.currentTime >= THRESHOLD_SECONDS) {
        try {
          await fetch('/api/increase-view/movie', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: sourceKey, path: currentFile })
          });
        } catch (err) {
          console.warn('Failed to increase movie view count:', err);
        } finally {
          viewCountStateRef.current.counted = true;
        }
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [currentFile, sourceKey]);

  // Save to recent viewed
  const saveToRecent = (fileName, filePath) => {
    try {
      const videoBaseName = fileName.replace(/\.(mp4|mkv|ts|avi|mov|webm|wmv)$/i, '');
      const thumbnail = `.thumbnail/${videoBaseName}.jpg`;
      
      addRecentItem({
        name: fileName,
        path: filePath,
        thumbnail: getVideoThumbnail(filePath),
        type: 'video'
      });
    } catch (err) {
      console.error('Error saving to recent:', err);
    }
  };

  // Get video thumbnail URL
  const getVideoThumbnail = (videoPath) => {
    const parts = videoPath.split('/');
    const fileName = parts.pop();
    const baseName = fileName.replace(/\.(mp4|mkv|ts|avi|mov|webm|wmv)$/i, '');
    const folderPrefix = parts.join('/');
    
    if (folderPrefix) {
      const safeFolderPrefix = folderPrefix.split('/').map(encodeURIComponent).join('/');
      return `/video/${safeFolderPrefix}/.thumbnail/${encodeURIComponent(baseName)}.jpg`;
    }
    return `/video/.thumbnail/${encodeURIComponent(baseName)}.jpg`;
  };

  // Navigate to parent folder
  const handleFolderClick = () => {
    if (folderPath) {
      navigate(`/movie?path=${encodeURIComponent(folderPath)}`);
    } else {
      navigate('/movie');
    }
  };

  // Navigate to previous video
  const handlePrevVideo = () => {
    if (currentIndex > 0) {
      const prevVideo = videoList[currentIndex - 1];
      navigate('/movie/player', { state: { file: prevVideo.path, key: sourceKey } });
    }
  };

  // Navigate to next video  
  const handleNextVideo = () => {
    if (currentIndex < videoList.length - 1) {
      const nextVideo = videoList[currentIndex + 1];
      navigate('/movie/player', { state: { file: nextVideo.path, key: sourceKey } });
    }
  };

  // Navigate to specific episode
  const handleEpisodeClick = (video) => {
    if (video.path !== currentFile) {
      navigate('/movie/player', { state: { file: video.path, key: sourceKey } });
    }
  };

  // Random video jump
  const handleRandomJump = async () => {
    try {
      setRandomLoading(true);
      const response = await apiService.movie.getVideoCache({
        mode: 'random',
        type: 'file',
        key: sourceKey
      });
      
      const data = response.data;
      const list = Array.isArray(data) ? data : data.folders;
      const videosOnly = list.filter(v => v.type === 'video' || v.type === 'file');
      
      if (!videosOnly.length) {
        showToast('❌ Không có video ngẫu nhiên', 'error');
        return;
      }
      
      const randomVideo = videosOnly[Math.floor(Math.random() * videosOnly.length)];
      if (randomVideo?.path) {
        navigate('/movie/player', { state: { file: randomVideo.path, key: sourceKey } });
      }
    } catch (err) {
      console.error('Error random jump:', err);
      showToast('❌ Không thể tải video ngẫu nhiên', 'error');
    } finally {
      setRandomLoading(false);
    }
  };

  // Open with ExoPlayer (for Android webview)
  const handleOpenExoPlayer = () => {
    const videoUrl = `/api/movie/video?key=${sourceKey}&file=${encodeURIComponent(currentFile)}${
      token ? `&token=${encodeURIComponent(token)}` : ''
    }`;
    
    if (window.Android?.openExoPlayer) {
      window.Android.openExoPlayer(`${location.origin}${videoUrl}`);
    } else {
      showToast('❌ Ứng dụng không hỗ trợ ExoPlayer', 'error');
    }
  };

  // Video gesture controls
  const handlePointerDown = (e) => {
    if (!videoRef.current) return;

    e.preventDefault();
    setDragStartX(e.clientX);
    setStartTime(videoRef.current.currentTime);
    setDragging(false);

    if (gestureTargetRef.current) {
      gestureTargetRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e) => {
    if (dragStartX === null || !videoRef.current) return;
    
    const diff = e.clientX - dragStartX;
    if (!dragging && Math.abs(diff) >= SWIPE_THRESHOLD) {
      setDragging(true);
    }
    
    if (!dragging) return;
    
    e.preventDefault();
    const preview = startTime + diff / PIXELS_PER_SECOND;
    videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.duration, preview));
  };

  const handlePointerUp = (e) => {
    if (dragStartX === null || !videoRef.current) return;

    const diff = e.clientX - dragStartX;
    if (dragging) {
      e.preventDefault();
      const skipped = Math.floor(diff / PIXELS_PER_SECOND);
      // Removed toast for skip gesture
    } else {
      // Forward tap to the video element for native controls
      videoRef.current.click();
    }

    setDragStartX(null);
    setDragging(false);

    if (gestureTargetRef.current) {
      gestureTargetRef.current.releasePointerCapture(e.pointerId);
    }
  };

  const handlePointerCancel = () => {
    setDragStartX(null);
    setDragging(false);
  };

  // Double tap to skip
  const handleDoubleClick = (e) => {
    if (!videoRef.current) return;
    
    const x = e.clientX;
    const width = videoRef.current.clientWidth;
    
    if (x < width / 2) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - SKIP_SECONDS);
      // Removed skip back toast
    } else {
      videoRef.current.currentTime = Math.min(
        videoRef.current.duration,
        videoRef.current.currentTime + SKIP_SECONDS
      );
      // Removed skip forward toast
    }
  };

  // Header buttons
  const headerButtons = [
    {
      icon: isFavorite ? '❤️' : '🤍',
      title: isFavorite ? 'Bỏ yêu thích' : 'Thêm yêu thích',
      onClick: handleToggleFavorite
    },
    {
      icon: thumbnailLoading ? '⏳' : '🖼️',
      title: thumbnailLoading ? 'Đang đặt thumbnail...' : 'Đặt thumbnail',
      onClick: handleSetThumbnail,
      disabled: thumbnailLoading
    },
    {
      icon: '🔍',
      title: 'Tìm kiếm',
      onClick: toggleSearchModal
    }
  ];

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-xl font-semibold mb-2">{error}</h2>
          <button
            onClick={() => navigate('/movie')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
      {/* Header */}
      <Header
        title={
          <button
            onClick={handleFolderClick}
            className="flex items-center gap-2 hover:bg-white/10 px-3 py-2 rounded transition-colors"
            title={folderPath || 'Quay lại thư mục'}
          >
            <span>📁</span>
            <span className="font-semibold">{folderName}</span>
          </button>
        }
        buttons={headerButtons}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Sidebar with lower z-index for video player */}
      {sidebarOpen && (
        <>
          {/* Backdrop above video to dim and capture clicks */}
          <div 
            className="fixed inset-0 bg-black/20"
            style={{ zIndex: 2147483645 }}
            onClick={() => setSidebarOpen(false)}
          />

          {/* Extra transparent overlay to ensure we block any video interactions */}
          <div
            className="fixed inset-0"
            style={{ zIndex: 2147483646, pointerEvents: 'auto' }}
            onClick={() => setSidebarOpen(false)}
          />
          
          {/* Sidebar forced on top of video */}
          <div
            className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-72 shadow-lg pointer-events-auto"
            style={{ zIndex: 2147483647 }}
          >
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} type="movie" />
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="pt-16">
        <div className="max-w-6xl mx-auto p-4">
          {/* Video Info Header */}
          <div className="text-center mb-6">
            <button
              onClick={handleFolderClick}
              className="inline-block mb-4 hover:bg-gray-100 dark:hover:bg-gray-800 px-4 py-2 rounded-lg transition-colors"
              title={`${videoName} - Click để về thư mục: ${folderPath || 'Trang chủ'}`}
            >
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {videoName}
              </h1>
            </button>

            {/* ExoPlayer Button */}
            <div>
              <button
                onClick={handleOpenExoPlayer}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                ▶ Mở bằng ExoPlayer
              </button>
            </div>
          </div>

          {/* Video Player */}
          <div className="mb-6 relative">
            <video
              key={currentFile}
              ref={videoRef}
              controls
              className="w-full rounded-lg shadow-lg"
              style={{ maxHeight: '70vh' }}
              onDoubleClick={handleDoubleClick}
            />
            {/* Gesture overlay */}
            <div
              ref={gestureTargetRef}
              className="absolute inset-0"
              style={{
                background: 'transparent',
                cursor: dragging ? 'grabbing' : 'grab',
                touchAction: 'none'
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
            />
            {/* Video Loading Overlay */}
            <LoadingOverlay 
              loading={videoLoading} 
              message="Đang tải video..." 
            />
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handlePrevVideo}
              disabled={currentIndex <= 0}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              ⬅ Tập trước
            </button>

            <button
              onClick={handleRandomJump}
              disabled={randomLoading}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {randomLoading ? '⏳ Đang tải...' : '🎲 Xem ngẫu nhiên'}
            </button>

            <button
              onClick={handleNextVideo}
              disabled={currentIndex >= videoList.length - 1}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Tập sau ➡
            </button>
          </div>

          {/* Episode List */}
          {videoList.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Danh sách tập ({videoList.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {videoList.map((video, index) => (
                  <button
                    key={video.path}
                    onClick={() => handleEpisodeClick(video)}
                    className={`px-3 py-2 rounded text-sm transition-colors ${
                      video.path === currentFile
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    Tập {index + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Random Sections */}
          <MovieRandomSection />
        </div>
      </div>

      {/* Search Modal */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={toggleSearchModal}
        type="movie"
      />
      
      {/* Toast */}
      <Toast />
    </div>
  );
};

export default MoviePlayer;