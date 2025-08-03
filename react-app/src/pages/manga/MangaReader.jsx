import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, PanelLeft } from 'lucide-react';
import { useMangaStore, useAuthStore } from '../../store';
import { apiService } from '../../utils/api';
import ReaderHeader from '../../components/manga/ReaderHeader';
import toast from 'react-hot-toast';
import '../../styles/components/manga-reader.css';
import '../../styles/components/reader-header.css';

const MangaReader = () => {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { readerSettings, updateReaderSettings, mangaSettings } = useMangaStore();
  const { sourceKey, rootFolder } = useAuthStore();
  
  const [currentImages, setCurrentImages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [preloadedImages, setPreloadedImages] = useState(new Set());
  const [imageCache, setImageCache] = useState(new Map()); // Cache for blob URLs
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const readerRef = useRef(null);

  // the required distance between touchStart and touchEnd to be detected as a swipe
  const minSwipeDistance = 50;

  useEffect(() => {
    const path = searchParams.get('path');
    console.log('🔍 DEBUG MangaReader - folderId from useParams:', folderId);
    console.log('🔍 DEBUG MangaReader - path from searchParams:', path);
    
    if (path) {
      loadFolderData(path);
    } else if (folderId) {
      loadFolderData(folderId);
    }
  }, [folderId, searchParams, sourceKey, rootFolder]);

  // Debug reader settings changes
  useEffect(() => {
    console.log('🔧 Reader settings updated:', readerSettings);
  }, [readerSettings]);

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      imageCache.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  // Preload images function
  const preloadImage = (src) => {
    return new Promise((resolve, reject) => {
      if (preloadedImages.has(src)) {
        resolve(src);
        return;
      }
      
      console.log(`📥 Preloading: ${src.substring(src.lastIndexOf('/') + 1)}`);
      
      // Try fetch first for better caching
      fetch(src)
        .then(response => response.blob())
        .then(blob => {
          const img = new Image();
          const objectUrl = URL.createObjectURL(blob);
          
          img.onload = () => {
            setPreloadedImages(prev => {
              const newSet = new Set(prev);
              newSet.add(src);
              return newSet;
            });
            
            setImageCache(prev => {
              const newMap = new Map(prev);
              newMap.set(src, objectUrl);
              return newMap;
            });
            
            console.log(`✅ Cached: ${src.substring(src.lastIndexOf('/') + 1)}`);
            resolve(src);
          };
          
          img.onerror = reject;
          img.src = objectUrl;
        })
        .catch(error => {
          console.error(`❌ Failed to preload: ${src}`, error);
          reject(error);
        });
    });
  };

  // Optimized preload function - only preload what's needed
  const preloadImagesAroundCurrentPage = async () => {
    if (!currentImages.length) return;
    
    const { preloadCount } = readerSettings;
    const start = Math.max(0, currentPage - Math.floor(preloadCount / 2));
    const end = Math.min(currentImages.length - 1, currentPage + Math.ceil(preloadCount / 2));
    
    const imagesToPreload = [];
    for (let i = start; i <= end; i++) {
      if (currentImages[i] && !preloadedImages.has(currentImages[i])) {
        imagesToPreload.push(currentImages[i]);
      }
    }
    
    if (imagesToPreload.length === 0) return;
    
    console.log(`🖼️ Preloading ${imagesToPreload.length} images around page ${currentPage} (range: ${start}-${end})`);
    
    try {
      await Promise.allSettled(imagesToPreload.map(src => preloadImage(src)));
      console.log(`✅ Preload complete. Total cached: ${preloadedImages.size}/${currentImages.length}`);
    } catch (error) {
      console.error('❌ Error preloading images:', error);
    }
  };

  // Effect to preload images when currentPage or currentImages change with throttling
  useEffect(() => {
    if (currentImages.length > 0) {
      // Debounce preload to avoid too frequent calls
      const timeoutId = setTimeout(() => {
        preloadImagesAroundCurrentPage();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [currentPage, currentImages, readerSettings.preloadCount]);

  const loadFolderData = async (path) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!sourceKey || !rootFolder) {
        setError('Missing authentication data');
        return;
      }

      // Store current path for favorite and navigation
      setCurrentPath(path);

      // Call API to get images
      const response = await apiService.manga.getFolders({
        mode: 'path',
        path: path,
        key: sourceKey,
        root: rootFolder,
        useDb: mangaSettings.useDb ? '1' : '0' // Use setting từ store
      });

      console.log('🎯 API Response:', response.data);

      if (response.data && response.data.type === 'reader' && Array.isArray(response.data.images)) {
        setCurrentImages(response.data.images);
        console.log('✅ Loaded images:', response.data.images.length);
        
        // Preload the first image immediately
        if (response.data.images.length > 0) {
          preloadImage(response.data.images[0]);
        }

        // Check favorite state
        await checkFavoriteState(path);
      } else {
        setError('No images found in this folder');
      }
    } catch (error) {
      console.error('Error loading folder:', error);
      setError('Failed to load manga images');
    } finally {
      setLoading(false);
    }
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < currentImages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleImageClick = () => {
    toggleControls();
  };

  const toggleReadingMode = () => {
    updateReaderSettings({
      ...readerSettings,
      readingMode: readerSettings.readingMode === 'vertical' ? 'horizontal' : 'vertical',
    });
  };

  const onTouchStart = (e) => {
    setTouchEnd(null); // otherwise the swipe is fired even with a single touch
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      goToNextPage();
    }
    if (isRightSwipe) {
      goToPrevPage();
    }
  };

  // Check favorite state
  const checkFavoriteState = async (path) => {
    if (!sourceKey || !rootFolder) return;
    
    try {
      const response = await apiService.manga.getFavorites({
        key: sourceKey,
        root: rootFolder
      });
      
      if (response.data && Array.isArray(response.data)) {
        const cleanPath = path.replace(/\/__self__$/, '');
        const isInFavorites = response.data.some(f => f.path === cleanPath);
        setIsFavorite(isInFavorites);
      }
    } catch (error) {
      console.warn('❌ Failed to check favorite:', error);
    }
  };

  // Toggle favorite
  const handleToggleFavorite = async () => {
    if (!sourceKey || !currentPath) return;
    
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    
    try {
      await apiService.manga.toggleFavorite({
        dbkey: sourceKey,
        path: currentPath.replace(/\/__self__$/, ''),
        value: newFavoriteState
      });
      
      toast.success(newFavoriteState ? '✅ Đã thêm vào yêu thích' : '✅ Đã bỏ khỏi yêu thích');
    } catch (error) {
      console.error('❌ Error toggling favorite:', error);
      setIsFavorite(!newFavoriteState); // Revert on error
      toast.error('❌ Lỗi khi toggle yêu thích');
    }
  };

  // Set thumbnail
  const handleSetThumbnail = async () => {
    if (!currentImages[currentPage] || !sourceKey || !rootFolder) return;
    
    try {
      const currentImage = currentImages[currentPage];
      const thumbnailPath = currentImage.replace(`/manga/${encodeURIComponent(rootFolder)}/`, '');
      
      await apiService.manga.setRootThumbnail({
        key: sourceKey,
        root: rootFolder,
        thumbnail: thumbnailPath
      });
      
      toast.success('✅ Đã đặt làm thumbnail');
    } catch (error) {
      console.error('❌ Error setting thumbnail:', error);
      toast.error('❌ Lỗi khi đặt thumbnail');
    }
  };

  if (loading) {
    return (
      <div className="manga-reader">
        <div className="reader">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            color: 'white',
            fontSize: '18px'
          }}>
            Đang tải...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="manga-reader">
        <div className="reader">
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            color: 'white',
            fontSize: '18px',
            textAlign: 'center',
            padding: '20px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
            <div style={{ marginBottom: '10px' }}>Lỗi tải manga</div>
            <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '20px' }}>{error}</div>
            <button 
              onClick={() => navigate(-1)}
              style={{
                background: '#333',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ← Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentImages.length) {
    return (
      <div className="manga-reader">
        <div className="reader">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            color: 'white',
            fontSize: '18px'
          }}>
            Không có ảnh nào được tìm thấy
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`manga-reader ${readerSettings.readingMode === 'vertical' ? 'scroll-mode-active' : ''}`}>
      {/* Reader Header */}
      {showControls && (
        <ReaderHeader
          currentPath={currentPath}
          isFavorite={isFavorite}
          onToggleFavorite={handleToggleFavorite}
          onSetThumbnail={handleSetThumbnail}
        />
      )}

      <div 
        ref={readerRef}
        className={`reader ${readerSettings.readingMode === 'vertical' ? 'scroll-mode' : ''}`}
      >
        {readerSettings.readingMode === 'vertical' ? (
          // Vertical scroll mode - render all images with zoom wrapper
          <div className="scroll-container">
            <div className="zoom-wrapper">
              {currentImages.map((imageSrc, index) => (
                <img
                  key={index}
                  src={imageSrc}
                  alt={`Page ${index + 1}`}
                  className="scroll-img"
                  onClick={handleImageClick}
                  onLoad={(e) => e.target.classList.remove('loading')}
                  onError={(e) => {
                    e.target.style.background = '#333';
                    e.target.alt = 'Lỗi tải ảnh';
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          // Horizontal mode - single image with max-height
          <div 
            className="horizontal-reader-container"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div className="nav-zone left" onClick={goToPrevPage} />
            
            {/* Current Image with zoom wrapper */}
            <div className="image-container">
              <div className="zoom-wrapper">
                <img
                  src={imageCache.get(currentImages[currentPage]) || currentImages[currentPage]}
                  alt={`Page ${currentPage + 1}`}
                  className="reader-image-fullsize"
                  onClick={handleImageClick}
                  onLoad={(e) => {
                    e.target.classList.remove('loading');
                    const isPreloaded = preloadedImages.has(currentImages[currentPage]);
                    const usingCache = imageCache.has(currentImages[currentPage]);
                    const srcType = e.target.src.startsWith('blob:') ? 'BLOB_CACHE' : 'DIRECT_LOAD';
                    console.log(`🖼️ Page ${currentPage + 1}: ${isPreloaded ? '✅ Preloaded' : '❌ Not preloaded'} | ${usingCache ? '🗄️ Using cache' : '🌐 Direct load'} | Source: ${srcType}`);
                  }}
                  onError={(e) => {
                    e.target.style.background = '#333';
                    e.target.alt = 'Lỗi tải ảnh';
                  }}
                />
              </div>
            </div>
            
            <div className="nav-zone right" onClick={goToNextPage} />
          </div>
        )}
      </div>

      {/* Reading Mode Toggle - Floating above footer */}
      {showControls && (
        <div className="reading-mode-toggle">
          <button onClick={toggleReadingMode} className="mode-toggle-btn">
            {readerSettings.readingMode === 'vertical' ? <PanelLeft size={20} /> : <BookOpen size={20} />}
          </button>
        </div>
      )}

      {/* Simple Footer */}
      {showControls && (
        <div className="simple-footer">
          <button 
            onClick={goToPrevPage}
            disabled={currentPage === 0}
            className="nav-btn"
          >
            ← Prev
          </button>
          
          <div className="page-counter">
            Trang {currentPage + 1} / {currentImages.length}
          </div>
          
          <button 
            onClick={goToNextPage}
            disabled={currentPage === currentImages.length - 1}
            className="nav-btn"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default MangaReader;
