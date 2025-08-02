// 📁 src/pages/manga/MangaReader.jsx
// 📖 Manga reader component với chế độ đọc vertical/horizontal và lazy loading

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ChevronRight, RotateCcw, ZoomIn, ZoomOut,
  Settings, Home, BookOpen, Monitor, Smartphone, Menu,
  Eye, EyeOff, SkipForward, SkipBack, Maximize, Minimize,
  Heart, Share, RefreshCw
} from 'lucide-react';
import { useMangaStore, useUIStore, useAuthStore } from '../../store';
import { apiService } from '../../utils/api';
import { READER } from '../../constants';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';
import './MangaReader.css';

const MangaReader = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const path = searchParams.get('path'); // Đường dẫn đến chapter/folder
  const startPage = parseInt(searchParams.get('page')) || 0;

  const { 
    currentManga, 
    readerSettings, 
    updateReaderSettings,
    addToRecentViewed,
    toggleFavorite,
    favorites
  } = useMangaStore();
  const { darkMode } = useUIStore();
  const { sourceKey, rootFolder } = useAuthStore();

  // === STATE MANAGEMENT ===
  const [images, setImages] = useState([]); // Danh sách URL ảnh
  const [currentPage, setCurrentPage] = useState(startPage);
  const [currentImageIndex, setCurrentImageIndex] = useState(0); // Index trong images array
  const [zoom, setZoom] = useState(readerSettings.zoom || 100);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [loadedImages, setLoadedImages] = useState(new Set()); // Track loaded images for lazy loading

  // === REFS ===
  const readerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const intersectionObserverRef = useRef(null);
  const imagesContainerRef = useRef(null);

  // === COMPUTED VALUES ===
  const imagesPerPage = READER.IMAGES_PER_PAGE || 200;
  const isVerticalMode = readerSettings.readingMode === 'vertical';
  const isFavorited = favorites.some(fav => fav.path === path);
  
  // Tính số trang dựa trên số ảnh và images per page
  const calculatedTotalPages = Math.ceil(images.length / imagesPerPage);
  
  // Lấy ảnh cho trang hiện tại
  const currentPageImages = images.slice(
    currentPage * imagesPerPage,
    (currentPage + 1) * imagesPerPage
  );

  // === EFFECT HOOKS ===
  
  // Load manga images khi component mount hoặc path thay đổi
  useEffect(() => {
    if (!path || !sourceKey) {
      setError('Missing path or source key');
      setIsLoading(false);
      return;
    }
    
    loadMangaImages();
  }, [path, sourceKey]);

  // Auto-hide controls sau khi hiển thị
  useEffect(() => {
    if (showControls) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Tránh xử lý khi đang focus vào input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          if (isVerticalMode) {
            previousPage();
          } else {
            previousImage();
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (isVerticalMode) {
            nextPage();
          } else {
            nextImage();
          }
          break;
        case 'ArrowUp':
          if (!isVerticalMode) {
            e.preventDefault();
            previousImage();
          }
          break;
        case 'ArrowDown':
          if (!isVerticalMode) {
            e.preventDefault();
            nextImage();
          }
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'Escape':
          if (isFullscreen) {
            e.preventDefault();
            toggleFullscreen();
          }
          break;
        case 's':
        case 'S':
          e.preventDefault();
          setShowSettings(!showSettings);
          break;
        case ' ': // Spacebar
          e.preventDefault();
          if (isVerticalMode) {
            // Scroll down in vertical mode
            window.scrollBy(0, window.innerHeight * 0.8);
          } else {
            nextImage();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVerticalMode, isFullscreen, showSettings]);

  // Intersection Observer cho lazy loading
  useEffect(() => {
    if (!readerSettings.lazyLoad) return;

    intersectionObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.dataset.src;
            if (src && !loadedImages.has(src)) {
              img.src = src;
              img.classList.add('loading');
              img.onload = () => {
                img.classList.remove('loading');
                setLoadedImages(prev => new Set([...prev, src]));
              };
              img.onerror = () => {
                img.classList.add('error');
                console.error('Failed to load image:', src);
              };
            }
          }
        });
      },
      {
        rootMargin: '100px' // Preload images 100px before they enter viewport
      }
    );

    return () => {
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
    };
  }, [readerSettings.lazyLoad, loadedImages]);

  // Update intersection observer when images change
  useEffect(() => {
    if (intersectionObserverRef.current && imagesContainerRef.current) {
      const images = imagesContainerRef.current.querySelectorAll('img[data-src]');
      images.forEach(img => {
        intersectionObserverRef.current.observe(img);
      });
    }
  }, [currentPageImages, isVerticalMode]);

  // Save recent viewed
  useEffect(() => {
    if (path && images.length > 0) {
      const pathParts = path.split('/');
      const folderName = pathParts[pathParts.length - 1] === '__self__'
        ? pathParts[pathParts.length - 2] || 'Manga'
        : pathParts[pathParts.length - 1] || 'Manga';

      addToRecentViewed({
        name: folderName,
        path,
        thumbnail: images[0] || '/default/default-cover.jpg',
        lastRead: Date.now()
      });
    }
  }, [path, images]);

  // === API FUNCTIONS ===
  
  /**
   * 📖 Load danh sách ảnh từ API
   */
  const loadMangaImages = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Gọi API để lấy danh sách ảnh trong folder - theo logic frontend gốc
      const apiParams = {
        mode: 'path',
        path: path, // Giữ nguyên path, có thể kết thúc với /__self__
        key: sourceKey,
        root: rootFolder,
        useDb: '1'
      };
      
      console.log('Making API call with params:', apiParams);
      console.log('Full API URL would be:', `/api/manga/folder-cache?${new URLSearchParams(apiParams).toString()}`);
      
      const response = await apiService.manga.getFolders(apiParams);

      console.log('API Response:', response.data); // Debug: show full API response

      let imageList = [];
      
      // Theo logic frontend gốc: nếu type === "reader" và có images array
      if (response.data && response.data.type === 'reader' && Array.isArray(response.data.images)) {
        imageList = response.data.images.map(buildImageUrl);
        console.log('Loaded images from reader API:', imageList.length, 'images');
        console.log('Sample image URLs:', imageList.slice(0, 3)); // Debug: show first 3 URLs
      } else if (response.data && response.data.images && response.data.images.length > 0) {
        // Fallback: API returned images array directly
        imageList = response.data.images.map(buildImageUrl);
        console.log('Loaded images from API:', imageList.length, 'images');
        console.log('Sample image URLs:', imageList.slice(0, 3)); // Debug: show first 3 URLs
      } else {
        console.warn('No images found in API response or wrong type');
        console.log('Response type:', response.data?.type);
        console.log('Response images:', response.data?.images);
        
        throw new Error('No images found in this manga folder');
      }

      setImages(imageList);
      setTotalPages(Math.ceil(imageList.length / imagesPerPage));
      
      // Increase view count
      if (sourceKey && rootFolder) {
        try {
          await apiService.system.increaseView({
            path,
            dbkey: sourceKey,
            rootKey: rootFolder
          });
        } catch (error) {
          console.warn('Failed to increase view count:', error);
        }
      }

    } catch (error) {
      console.error('Error loading manga images:', error);
      setError('Failed to load manga images. Please try again.');
      toast.error('Không thể tải ảnh manga');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 🖼️ Check if file is image
   */
  const isImageFile = (filename) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
    return imageExtensions.some(ext => 
      filename.toLowerCase().endsWith(ext)
    );
  };

  /**
   * 🔗 Build image URL from path - đơn giản hóa
   */
  const buildImageUrl = (imagePath) => {
    // Nếu path đã là URL đầy đủ thì return luôn
    if (imagePath.startsWith('http') || imagePath.startsWith('/default/')) {
      return imagePath;
    }
    
    // Backend đã build sẵn URL với /manga/ prefix, chỉ cần return
    console.log('Using image path as-is:', imagePath);
    return imagePath;
  };

  // === NAVIGATION FUNCTIONS ===

  /**
   * ➡️ Next page (in paginated mode)
   */
  const nextPage = useCallback(() => {
    if (currentPage < calculatedTotalPages - 1) {
      setCurrentPage(prev => prev + 1);
      setCurrentImageIndex(0); // Reset to first image of new page
      
      // Scroll to top nếu vertical mode
      if (isVerticalMode) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [currentPage, calculatedTotalPages, isVerticalMode]);

  /**
   * ⬅️ Previous page (in paginated mode)
   */
  const previousPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
      setCurrentImageIndex(0); // Reset to first image of new page
      
      // Scroll to top nếu vertical mode
      if (isVerticalMode) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [currentPage, isVerticalMode]);

  /**
   * ➡️ Next image (in horizontal mode)
   */
  const nextImage = useCallback(() => {
    if (currentImageIndex < currentPageImages.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
    } else if (currentPage < calculatedTotalPages - 1) {
      // Auto advance to next page
      nextPage();
    }
  }, [currentImageIndex, currentPageImages.length, currentPage, calculatedTotalPages, nextPage]);

  /**
   * ⬅️ Previous image (in horizontal mode)
   */
  const previousImage = useCallback(() => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    } else if (currentPage > 0) {
      // Auto go back to previous page
      previousPage();
      // Set to last image of previous page
      setTimeout(() => {
        const prevPageImages = images.slice(
          (currentPage - 1) * imagesPerPage,
          currentPage * imagesPerPage
        );
        setCurrentImageIndex(prevPageImages.length - 1);
      }, 100);
    }
  }, [currentImageIndex, currentPage, previousPage, images, imagesPerPage]);

  /**
   * 🔄 Toggle fullscreen mode
   */
  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      readerRef.current?.requestFullscreen?.() || 
      readerRef.current?.webkitRequestFullscreen?.() ||
      readerRef.current?.msRequestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.() || 
      document.webkitExitFullscreen?.() ||
      document.msExitFullscreen?.();
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  /**
   * 🔍 Zoom controls
   */
  const zoomIn = useCallback(() => {
    const newZoom = Math.min(zoom + 25, READER.MAX_ZOOM || 300);
    setZoom(newZoom);
    updateReaderSettings({ zoom: newZoom });
  }, [zoom, updateReaderSettings]);

  const zoomOut = useCallback(() => {
    const newZoom = Math.max(zoom - 25, READER.MIN_ZOOM || 50);
    setZoom(newZoom);
    updateReaderSettings({ zoom: newZoom });
  }, [zoom, updateReaderSettings]);

  /**
   * 🎯 Jump to specific page
   */
  const jumpToPage = useCallback((pageNum) => {
    const targetPage = Math.max(0, Math.min(pageNum - 1, calculatedTotalPages - 1));
    setCurrentPage(targetPage);
    setCurrentImageIndex(0);
    
    if (isVerticalMode) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [calculatedTotalPages, isVerticalMode]);

  /**
   * ❤️ Toggle favorite
   */
  const handleToggleFavorite = useCallback(async () => {
    try {
      const pathParts = path.split('/');
      const folderName = pathParts[pathParts.length - 1] === '__self__'
        ? pathParts[pathParts.length - 2] || 'Manga'
        : pathParts[pathParts.length - 1] || 'Manga';

      toggleFavorite({
        name: folderName,
        path,
        thumbnail: images[0] || '/default/default-cover.jpg'
      });

      // Gọi API để sync với backend
      if (sourceKey) {
        await apiService.manga.toggleFavorite(path, sourceKey);
      }

      toast.success(isFavorited ? 'Đã xóa khỏi yêu thích' : 'Đã thêm vào yêu thích');
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Không thể cập nhật yêu thích');
    }
  }, [path, images, isFavorited, toggleFavorite, sourceKey]);

  /**
   * 🖱️ Handle mouse/touch events
   */
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
  }, []);

  /**
   * 📱 Handle click zones (for touch navigation)
   */
  const handleClickZone = useCallback((zone) => {
    // zone: 'left', 'center', 'right'
    if (zone === 'left') {
      if (isVerticalMode) {
        previousPage();
      } else {
        previousImage();
      }
    } else if (zone === 'right') {
      if (isVerticalMode) {
        nextPage();
      } else {
        nextImage();
      }
    } else if (zone === 'center') {
      setShowControls(!showControls);
    }
  }, [isVerticalMode, nextPage, previousPage, nextImage, previousImage, showControls]);

  // === RENDER HELPERS ===

  /**
   * 🖼️ Render single image with lazy loading support
   */
  const renderImage = useCallback((src, index, isLazyLoad = false) => {
    const imageKey = `${src}-${index}`;
    
    // Style for vertical mode vs horizontal mode
    const baseStyle = {
      transform: `scale(${zoom / 100})`,
      transformOrigin: 'top center',
      display: 'block',
      backgroundColor: '#f0f0f0',
    };
    
    const verticalStyle = {
      ...baseStyle,
      width: '100%',
      maxWidth: '100%',
      height: 'auto',
      minHeight: '300px',
      objectFit: 'contain'
    };

    const horizontalStyle = {
      ...baseStyle,
      width: '100%',
      maxWidth: '100%',
      height: 'auto',
      objectFit: 'contain'
    };
    
    const imageProps = {
      className: `reader-image ${isVerticalMode ? 'vertical-image' : 'horizontal-image'} mx-auto`,
      alt: `Page ${currentPage * imagesPerPage + index + 1}`,
      draggable: false,
      style: isVerticalMode ? verticalStyle : horizontalStyle
    };

    console.log('Rendering image:', src, 'Mode:', isVerticalMode ? 'vertical' : 'horizontal');

    if (isLazyLoad && readerSettings.lazyLoad) {
      return (
        <img
          key={imageKey}
          {...imageProps}
          data-src={src}
          src={loadedImages.has(src) ? src : '/default/loading.gif'}
          loading="lazy"
        />
      );
    } else {
      return (
        <img
          key={imageKey}
          {...imageProps}
          src={src}
          onLoad={(e) => {
            console.log('Image loaded successfully:', src);
            e.target.classList.remove('loading');
            e.target.style.backgroundColor = 'transparent';
            setLoadedImages(prev => new Set([...prev, src]));
          }}
          onError={(e) => {
            console.error('Image failed to load:', src);
            e.target.classList.add('error');
            // Đơn giản: chỉ fallback, không thử decode
            e.target.src = '/default/default-cover.jpg'; 
            e.target.style.backgroundColor = '#ffebee';
          }}
        />
      );
    }
  }, [currentPage, imagesPerPage, zoom, isVerticalMode, readerSettings.lazyLoad, loadedImages]);

  // === LOADING AND ERROR STATES ===
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg">Đang tải manga...</p>
          <p className="text-sm text-gray-400 mt-2">Vui lòng đợi trong giây lát</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-white mb-2">Lỗi tải manga</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              icon={ChevronLeft}
            >
              Quay lại
            </Button>
            <Button
              variant="primary"
              onClick={loadMangaImages}
              icon={RefreshCw}
            >
              Thử lại
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center max-w-md mx-auto px-4">
          <BookOpen className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Không tìm thấy ảnh</h2>
          <p className="text-gray-400 mb-6">Thư mục này không chứa ảnh manga nào.</p>
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            icon={ChevronLeft}
          >
            Quay lại
          </Button>
        </div>
      </div>
    );
  }
  // === MAIN RENDER ===
  return (
    <div
      ref={readerRef}
      className={`relative min-h-screen transition-colors duration-200 ${
        readerSettings.backgroundColor === 'black' ? 'bg-black' : 
        readerSettings.backgroundColor === 'white' ? 'bg-white' : 'bg-gray-100'
      }`}
      onMouseMove={handleMouseMove}
      tabIndex={0}
      style={{ outline: 'none' }}
    >
      {/* Top Controls */}
      <div className={`fixed top-0 left-0 right-0 z-50 bg-black bg-opacity-75 
                     transition-transform duration-300 ${
                       showControls ? 'translate-y-0' : '-translate-y-full'
                     }`}>
        <div className="flex items-center justify-between p-4 text-white">
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
              <h1 className="font-semibold text-lg">
                {path?.split('/').pop() || 'Manga Reader'}
              </h1>
              <p className="text-sm text-gray-300">
                {isVerticalMode 
                  ? `Trang ${currentPage + 1} / ${calculatedTotalPages} - ${images.length} ảnh`
                  : `Ảnh ${currentPage * imagesPerPage + currentImageIndex + 1} / ${images.length}`
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleFavorite}
              icon={Heart}
              className={`${isFavorited ? 'text-red-500' : 'text-white'} hover:bg-white hover:bg-opacity-20`}
              title={isFavorited ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              icon={Settings}
              className="text-white hover:bg-white hover:bg-opacity-20"
              title="Cài đặt"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              icon={isFullscreen ? Minimize : Maximize}
              className="text-white hover:bg-white hover:bg-opacity-20"
              title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
            />
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed top-16 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-80 max-h-[80vh] overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Cài đặt đọc truyện
          </h3>
          
          <div className="space-y-6">
            {/* Reading Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Chế độ đọc
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['vertical', 'horizontal'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => updateReaderSettings({ readingMode: mode })}
                    className={`p-3 rounded-md border text-sm font-medium transition-colors ${
                      readerSettings.readingMode === mode
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="text-lg mb-1">
                      {mode === 'vertical' ? '↕️' : '↔️'}
                    </div>
                    {mode === 'vertical' ? 'Cuộn dọc' : 'Lật ngang'}
                  </button>
                ))}
              </div>
            </div>

            {/* Background Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Màu nền
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'black', label: 'Đen', color: 'bg-black' },
                  { value: 'white', label: 'Trắng', color: 'bg-white border' },
                  { value: 'gray', label: 'Xám', color: 'bg-gray-400' }
                ].map(({ value, label, color }) => (
                  <button
                    key={value}
                    onClick={() => updateReaderSettings({ backgroundColor: value })}
                    className={`h-12 rounded-md border-2 ${color} ${
                      readerSettings.backgroundColor === value
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-gray-300 hover:border-gray-400'
                    } transition-all duration-200 flex items-center justify-center`}
                    title={label}
                  >
                    <span className={`text-xs font-medium ${
                      value === 'white' ? 'text-gray-700' : 'text-white'
                    }`}>
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Zoom Control */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Zoom: {zoom}%
              </label>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={zoomOut} 
                  icon={ZoomOut}
                  disabled={zoom <= (READER.MIN_ZOOM || 50)}
                />
                <input
                  type="range"
                  min={READER.MIN_ZOOM || 50}
                  max={READER.MAX_ZOOM || 300}
                  step="25"
                  value={zoom}
                  onChange={(e) => {
                    const newZoom = Number(e.target.value);
                    setZoom(newZoom);
                    updateReaderSettings({ zoom: newZoom });
                  }}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={zoomIn} 
                  icon={ZoomIn}
                  disabled={zoom >= (READER.MAX_ZOOM || 300)}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>50%</span>
                <span>300%</span>
              </div>
            </div>

            {/* Lazy Loading */}
            <div>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Lazy Loading (tiết kiệm băng thông)
                </span>
                <input
                  type="checkbox"
                  checked={readerSettings.lazyLoad || false}
                  onChange={(e) => updateReaderSettings({ lazyLoad: e.target.checked })}
                  className="sr-only"
                />
                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  readerSettings.lazyLoad ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    readerSettings.lazyLoad ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </div>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Ảnh sẽ được tải khi cần thiết để tiết kiệm dữ liệu
              </p>
            </div>

            {/* Page Jump */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nhảy tới trang
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max={calculatedTotalPages}
                  placeholder="Số trang"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const pageNum = parseInt(e.target.value);
                      if (pageNum >= 1 && pageNum <= calculatedTotalPages) {
                        jumpToPage(pageNum);
                        e.target.value = '';
                      }
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    const input = e.target.closest('div').querySelector('input');
                    const pageNum = parseInt(input.value);
                    if (pageNum >= 1 && pageNum <= calculatedTotalPages) {
                      jumpToPage(pageNum);
                      input.value = '';
                    }
                  }}
                >
                  Go
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Reader Content */}
      <div 
        ref={imagesContainerRef}
        className={`min-h-screen pt-16 pb-16 ${
          readerSettings.backgroundColor === 'white' ? 'bg-white' : 
          readerSettings.backgroundColor === 'gray' ? 'bg-gray-500' : 'bg-black'
        } ${
          isVerticalMode ? 'flex flex-col items-center' : 'flex items-center justify-center'
        }`}
        style={{ minHeight: '100vh' }}
      >
        {isVerticalMode ? (
          // Vertical scrolling mode - all images in a column
          <div className="w-full max-w-none px-2 space-y-1">
            {currentPageImages.map((src, index) => 
              renderImage(src, index, true)
            )}
            
            {/* Load more button for pagination */}
            {currentPage < calculatedTotalPages - 1 && (
              <div className="text-center py-8">
                <Button
                  variant="primary"
                  onClick={nextPage}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Tải trang tiếp theo ({currentPage + 2}/{calculatedTotalPages})
                </Button>
              </div>
            )}
          </div>
        ) : (
          // Horizontal mode - single image display
          <div className="relative w-full h-screen flex items-center justify-center">
            {currentPageImages[currentImageIndex] && 
              renderImage(currentPageImages[currentImageIndex], currentImageIndex, false)
            }
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 bg-black bg-opacity-75 
                     transition-transform duration-300 ${
                       showControls ? 'translate-y-0' : 'translate-y-full'
                     }`}>
        <div className="flex items-center justify-between p-4 text-white">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={isVerticalMode ? previousPage : previousImage}
              disabled={isVerticalMode ? currentPage === 0 : (currentPage === 0 && currentImageIndex === 0)}
              icon={SkipBack}
              className="text-white hover:bg-white hover:bg-opacity-20 disabled:opacity-50"
            >
              Trước
            </Button>
          </div>

          <div className="flex items-center gap-4">
            {/* Progress indicator */}
            <span className="text-sm bg-black bg-opacity-50 px-3 py-1 rounded-full">
              {isVerticalMode 
                ? `${currentPage + 1} / ${calculatedTotalPages}`
                : `${currentPage * imagesPerPage + currentImageIndex + 1} / ${images.length}`
              }
            </span>
            
            {/* Progress bar */}
            <div className="w-32 sm:w-48 h-2 bg-gray-600 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{
                  width: `${isVerticalMode 
                    ? ((currentPage + 1) / calculatedTotalPages) * 100
                    : ((currentPage * imagesPerPage + currentImageIndex + 1) / images.length) * 100
                  }%`
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={isVerticalMode ? nextPage : nextImage}
              disabled={isVerticalMode 
                ? currentPage >= calculatedTotalPages - 1 
                : (currentPage >= calculatedTotalPages - 1 && currentImageIndex >= currentPageImages.length - 1)
              }
              icon={SkipForward}
              className="text-white hover:bg-white hover:bg-opacity-20 disabled:opacity-50"
            >
              Tiếp
            </Button>
          </div>
        </div>
      </div>

      {/* Click Navigation Zones (for touch/mouse navigation) */}
      {!showSettings && (
        <div className="fixed inset-0 z-10 flex">
          {/* Left click area */}
          <div 
            className="w-1/3 h-full cursor-pointer"
            onClick={() => handleClickZone('left')}
            title="Trang trước / Ảnh trước"
          />
          {/* Center area - toggle controls */}
          <div 
            className="w-1/3 h-full cursor-pointer"
            onClick={() => handleClickZone('center')}
            title="Hiện/ẩn điều khiển"
          />
          {/* Right click area */}
          <div 
            className="w-1/3 h-full cursor-pointer"
            onClick={() => handleClickZone('right')}
            title="Trang tiếp / Ảnh tiếp"
          />
        </div>
      )}

      {/* Keyboard shortcuts help */}
      <div className="fixed bottom-20 right-4 z-30">
        <div className="bg-black bg-opacity-70 text-white text-xs p-3 rounded-lg max-w-xs">
          <p className="font-semibold mb-2">⌨️ Phím tắt:</p>
          <div className="space-y-1">
            <p>← → : Di chuyển</p>
            <p>Space : Cuộn xuống / Ảnh tiếp</p>
            <p>F : Toàn màn hình</p>
            <p>S : Cài đặt</p>
            <p>ESC : Thoát toàn màn hình</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MangaReader;
