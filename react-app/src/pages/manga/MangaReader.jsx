import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, PanelLeft } from 'lucide-react';
import { useMangaStore, useAuthStore } from '../../store';
import { useRecentManager } from '../../hooks/useRecentManager';
import { apiService } from '../../utils/api';
import ReaderHeader from '../../components/manga/ReaderHeader';
import toast from 'react-hot-toast';
import '../../styles/components/manga-reader.css';
import '../../styles/components/reader-header.css';

const MangaReader = () => {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { readerSettings, updateReaderSettings, mangaSettings, favorites, toggleFavorite, readerPrefetch, setReaderPrefetch } = useMangaStore();
  const { sourceKey, rootFolder } = useAuthStore();
  const { addRecentItem } = useRecentManager('manga');
  
  const [currentImages, setCurrentImages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [preloadedImages, setPreloadedImages] = useState(new Set());
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const readerRef = useRef(null);
  // Simplified view count tracking: last key + debounce
  const lastViewKeyRef = useRef('');
  const viewDebounceRef = useRef(null);
  // Abort controller for folder loading and request guard
  const folderAbortRef = useRef(null);
  const requestIdRef = useRef(0);
  // Guard to avoid duplicate initial loads (e.g., StrictMode double-effect)
  const lastLoadKeyRef = useRef('');

  // the required distance between touchStart and touchEnd to be detected as a swipe
  const minSwipeDistance = 50;

  // Memoize current path to avoid unnecessary effect reruns
  const currentMangaPath = useMemo(() => {
    return searchParams.get('path') || folderId;
  }, [searchParams, folderId]);

  // Memoize stable auth keys to prevent effect reruns
  const stableAuthKeys = useMemo(() => ({
    sourceKey,
    rootFolder
  }), [sourceKey, rootFolder]);

  // Immediate increase view using last key (avoid StrictMode timer clears)
  const increaseViewCount = useCallback(async (path, sKey, rFolder) => {
    const cleanPath = path.replace(/\/__self__$/, '');
    const nextKey = `${sKey}::${rFolder}::${cleanPath}`;
    if (lastViewKeyRef.current === nextKey) return;
    lastViewKeyRef.current = nextKey;
    try {
      await apiService.system.increaseViewManga({
        path: cleanPath,
        dbkey: sKey,
        rootKey: rFolder,
      });
      console.log('📈 View count increased:', cleanPath);
    } catch (err) {
      console.warn('❌ increaseView failed:', err);
    }
  }, []);

  // Derive favorite from store favorites
  useEffect(() => {
    if (!currentPath) return;
    const cleanPath = currentPath.replace(/\/__self__$/, '');
    const isFav = (favorites || []).some((f) => f.path === cleanPath);
    setIsFavorite(isFav);
  }, [favorites, currentPath]);

  // Lightweight preload using browser cache (no blob/objectURL)
  const preloadImage = useCallback((src) => {
    return new Promise((resolve, reject) => {
      if (!src || preloadedImages.has(src)) return resolve(src);
      const img = new Image();
      img.onload = () => {
        setPreloadedImages((prev) => new Set(prev).add(src));
        resolve(src);
      };
      img.onerror = reject;
      img.src = src;
    });
  }, [preloadedImages]);

  const loadFolderData = useCallback(async (path) => {
    // Abort previous in-flight request
    if (folderAbortRef.current) {
      try { folderAbortRef.current.abort(); } catch {}
    }
    const controller = new AbortController();
    folderAbortRef.current = controller;
    const myRequestId = ++requestIdRef.current;

    console.log('🎯 Loading folder data for:', { path, sourceKey: stableAuthKeys.sourceKey, rootFolder: stableAuthKeys.rootFolder });
    try {
      setLoading(true);
      setError(null);
      if (!stableAuthKeys.sourceKey || !stableAuthKeys.rootFolder) {
        setError('Missing authentication data');
        return;
      }

      // Store current path for favorite and navigation
      setCurrentPath(path);

      // Call API to get images (pass signal if supported)
      const response = await apiService.manga.getFolders(
        {
          mode: 'path',
          path,
          key: stableAuthKeys.sourceKey,
          root: stableAuthKeys.rootFolder,
          useDb: mangaSettings.useDb ? '1' : '0',
        },
        { signal: controller.signal }
      );

      // Ignore stale responses
      if (myRequestId !== requestIdRef.current) return;

      if (response.data && response.data.type === 'reader' && Array.isArray(response.data.images)) {
        setCurrentImages(response.data.images);
        console.log('✅ Loaded images:', response.data.images.length);

        // Add to recent
        try {
          const parts = path.split('/');
          const folderName = parts[parts.length - 1] === '__self__'
            ? parts[parts.length - 2] || 'Xem ảnh'
            : parts[parts.length - 1] || 'Xem ảnh';
          addRecentItem({ name: folderName, path, thumbnail: response.data.images[0] || null, isFavorite: false });
        } catch (err) {
          console.warn('Error adding to recent:', err);
        }

        // Preload the first image lightly
        if (response.data.images.length > 0) preloadImage(response.data.images[0]);
      } else {
        setError('No images found in this folder');
      }
    } catch (error) {
      // Treat AbortController and Axios cancel as non-errors
      if (
        error?.name === 'AbortError' ||
        error?.name === 'CanceledError' ||
        error?.code === 'ERR_CANCELED'
      ) {
        console.log('⛔ Request canceled/aborted for path:', path);
        // Allow next effect run (e.g., StrictMode) to load again
        lastLoadKeyRef.current = '';
        return;
      }
      console.error('Error loading folder:', error);
      setError('Failed to load manga images');
    } finally {
      if (myRequestId === requestIdRef.current) setLoading(false);
    }
  }, [stableAuthKeys.sourceKey, stableAuthKeys.rootFolder, mangaSettings.useDb, preloadImage, addRecentItem]);

  useEffect(() => {
    if (currentMangaPath && stableAuthKeys.sourceKey && stableAuthKeys.rootFolder) {
      const loadKey = `${stableAuthKeys.sourceKey}|${stableAuthKeys.rootFolder}|${currentMangaPath}`;
      if (lastLoadKeyRef.current === loadKey) {
        console.log('⏭️ Skip duplicate reader load for key:', loadKey);
      } else {
        lastLoadKeyRef.current = loadKey;

        // First, try pass-through cache from Home
        const isPrefetchValid = readerPrefetch && readerPrefetch.path === currentMangaPath && Array.isArray(readerPrefetch.images) && readerPrefetch.images.length > 0 && Date.now() - (readerPrefetch.ts || 0) < 5000;
        if (isPrefetchValid) {
          console.log('⚡ Using readerPrefetch, skipping network');
          setCurrentPath(currentMangaPath);
          setCurrentImages(readerPrefetch.images);
          setLoading(false);
          // Clear once consumed to avoid stale reuse later
          try { setReaderPrefetch(null); } catch {}
          // Preload first image
          preloadImage(readerPrefetch.images[0]);
        } else {
          console.log('🔍 Loading folder data for path:', currentMangaPath);
          loadFolderData(currentMangaPath);
        }
      }
    }
    return () => {
      // abort in-flight when path changes/unmounts
      if (folderAbortRef.current) {
        try { folderAbortRef.current.abort(); } catch {}
      }
      // Clear last key so remount (StrictMode) can refetch
      lastLoadKeyRef.current = '';
    };
  }, [currentMangaPath, stableAuthKeys.sourceKey, stableAuthKeys.rootFolder, loadFolderData, readerPrefetch, setReaderPrefetch, preloadImage]);

  // Increase view when path changes (debounced inside function)
  useEffect(() => {
    if (currentMangaPath && stableAuthKeys.sourceKey && stableAuthKeys.rootFolder) {
      increaseViewCount(currentMangaPath, stableAuthKeys.sourceKey, stableAuthKeys.rootFolder);
    }
  }, [currentMangaPath, stableAuthKeys.sourceKey, stableAuthKeys.rootFolder, increaseViewCount]);

  // Debug reader settings changes
  useEffect(() => {
    console.log('🔧 Reader settings updated:', readerSettings);
  }, [readerSettings]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (viewDebounceRef.current) clearTimeout(viewDebounceRef.current);
      if (folderAbortRef.current) {
        try { folderAbortRef.current.abort(); } catch {}
      }
    };
  }, []);

  // Handle browser back button
  useEffect(() => {
    const handlePopState = (event) => {
      const returnUrl = searchParams.get('returnUrl');
      if (returnUrl) {
        console.log('🔙 Browser back detected, returning to:', returnUrl);
        navigate(returnUrl, { replace: true });
        return;
      }
      // Default back behavior
      navigate('/manga', { replace: true });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate, searchParams]);

  // Optimized preload function - only preload what's needed
  const preloadImagesAroundCurrentPage = useCallback(async () => {
    if (!currentImages.length) return;
    // clamp preload to 2–4
    const preloadCount = Math.max(2, Math.min(4, Number(readerSettings.preloadCount) || 2));
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
  }, [currentImages, currentPage, readerSettings.preloadCount, preloadedImages, preloadImage]);

  // Effect to preload images when currentPage or currentImages change with throttling
  useEffect(() => {
    if (currentImages.length > 0) {
      // Debounce preload to avoid too frequent calls
      const timeoutId = setTimeout(() => {
        preloadImagesAroundCurrentPage();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [currentImages.length, currentPage, readerSettings.preloadCount, preloadImagesAroundCurrentPage]);

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

  // Keyboard navigation for horizontal mode (ArrowLeft/ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore when typing in inputs/textareas or contenteditable
      const target = e.target;
      const tag = target?.tagName;
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable;
      if (isTyping) return;

      // Only handle in horizontal mode
      if (readerSettings.readingMode === 'vertical') return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        // Prev page
        setCurrentPage((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        // Next page
        setCurrentPage((prev) => Math.min(currentImages.length - 1, prev + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readerSettings.readingMode, currentImages.length]);

  // Toggle favorite
  const handleToggleFavorite = async () => {
    if (!sourceKey || !currentPath) return;
    const cleanPath = currentPath.replace(/\/__self__$/, '');
    try {
      await toggleFavorite({ path: cleanPath });
      // Store will refresh favorites; local state derives from favorites effect
      const nowFav = !(favorites || []).some((f) => f.path === cleanPath);
      toast.success(nowFav ? '✅ Đã thêm vào yêu thích' : '✅ Đã bỏ khỏi yêu thích');
    } catch (error) {
      console.error('❌ Error toggling favorite:', error);
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
                  src={currentImages[currentPage]}
                  alt={`Page ${currentPage + 1}`}
                  className="reader-image-fullsize"
                  onClick={handleImageClick}
                  onLoad={(e) => {
                    e.target.classList.remove('loading');
                    const isPreloaded = preloadedImages.has(currentImages[currentPage]);
                    console.log(`🖼️ Page ${currentPage + 1}: ${isPreloaded ? '✅ Preloaded' : '❌ Not preloaded'}`);
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
