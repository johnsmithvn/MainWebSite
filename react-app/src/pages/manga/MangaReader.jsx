import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, PanelLeft } from 'lucide-react';
import { useMangaStore, useAuthStore } from '../../store';
import { useRecentManager } from '../../hooks/useRecentManager';
import { getFolderName, extractTitlesFromPath } from '../../utils/pathUtils';
import { apiService } from '../../utils/api';
import { downloadChapter, isChapterDownloaded, getChapter } from '../../utils/offlineLibrary';
import { checkStorageForDownload } from '../../utils/storageQuota';
import { isCachesAPISupported, getUnsupportedMessage } from '../../utils/browserSupport';
import ReaderHeader from '../../components/manga/ReaderHeader';
import { DownloadProgressModal, StorageQuotaModal } from '../../components/common';
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
  const [currentPage, setCurrentPage] = useState(0); // index within current group for horizontal OR global index in vertical
  const [scrollPageIndex, setScrollPageIndex] = useState(0); // page group index for vertical pagination
  const [loading, setLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  // Use ref (not state) for preloaded images so StrictMode double-mount doesn't flush the cache
  // and we avoid unnecessary re-renders when the Set changes.
  const preloadedImagesRef = useRef(new Set());
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
  // Track images currently loading to avoid duplicate network fetches
  const loadingImagesRef = useRef(new Set());
  // Diagnostics: track onLoad counts per image to verify duplicate actual loads vs cached
  const loadCountRef = useRef(new Map());
  // Jump modal state (supports both vertical chunk jump & horizontal single-page jump)
  const [showJumpModal, setShowJumpModal] = useState(false);
  const [jumpInput, setJumpInput] = useState('');
  const [jumpContext, setJumpContext] = useState('vertical'); // 'vertical' | 'horizontal'
  
  // Download states
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0, status: 'idle' });
  const [isChapterOfflineAvailable, setIsChapterOfflineAvailable] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  
  // Storage quota states
  const [showStorageQuotaModal, setShowStorageQuotaModal] = useState(false);
  const [storageCheckResult, setStorageCheckResult] = useState(null);

  // Debug cache status function
  const getCacheStatus = useCallback(() => {
    const total = currentImages.length;
    const preloaded = preloadedImagesRef.current.size;
    const currentSrc = currentImages[currentPage];
    const currentPreloaded = currentSrc ? preloadedImagesRef.current.has(currentSrc) : false;
    
    return {
      total,
      preloaded,
      percentage: total > 0 ? Math.round((preloaded / total) * 100) : 0,
      currentPreloaded,
      currentSrc: currentSrc?.split('/').pop()
    };
  }, [currentImages, currentPage]);

  // Make cache status available globally for debugging
  useEffect(() => {
    window.__MANGA_CACHE_STATUS__ = getCacheStatus;
  }, [getCacheStatus]);

  // the required distance between touchStart and touchEnd to be detected as a swipe
  const minSwipeDistance = 50;

  // Memoize current path to avoid unnecessary effect reruns
  const currentMangaPath = useMemo(() => {
    const path = searchParams.get('path') || folderId;
    console.log('📁 currentMangaPath computed:', path);
    return path;
  }, [searchParams, folderId]);

  const isOfflineMode = searchParams.get('offline') === '1';

  // 🐛 DEBUG: Log component initialization
  console.log('🎯 MangaReader Component Init:', {
    folderId,
    isOfflineMode,
    searchParams: Object.fromEntries(searchParams),
    sourceKey,
    rootFolder
  });

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

  // Check if chapter is already downloaded
  useEffect(() => {
    const checkOfflineStatus = async () => {
      if (!currentMangaPath) return;
      try {
        const isAvailable = await isChapterDownloaded(currentMangaPath);
        setIsChapterOfflineAvailable(isAvailable);
      } catch (err) {
        console.error('Error checking offline status:', err);
        setIsChapterOfflineAvailable(false);
      }
    };
    
    checkOfflineStatus();
  }, [currentMangaPath]);

  // Enhanced preload using link preload for better browser cache integration
  const preloadImage = useCallback((src) => {
    return new Promise((resolve, reject) => {
      if (!src) return resolve(src);
      if (preloadedImagesRef.current.has(src)) return resolve(src);
      if (loadingImagesRef.current.has(src)) return resolve(src); // already in-flight
      
      loadingImagesRef.current.add(src);
      
      // Strategy 1: Use <link rel="preload"> for better cache integration
      const existingLink = document.querySelector(`link[href="${src}"]`);
      if (!existingLink) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        
        link.onload = () => {
          loadingImagesRef.current.delete(src);
          preloadedImagesRef.current.add(src);
          console.log(`✅ Preloaded (link): ${src.split('/').pop()}`);
          // Clean up after successful preload
          setTimeout(() => link.remove(), 1000);
          resolve(src);
        };
        
        link.onerror = () => {
          loadingImagesRef.current.delete(src);
          console.warn(`❌ Link preload failed: ${src.split('/').pop()}`);
          link.remove();
          
          // Fallback to Image object
          const img = new Image();
          img.onload = () => {
            preloadedImagesRef.current.add(src);
            console.log(`✅ Preloaded (img fallback): ${src.split('/').pop()}`);
            resolve(src);
          };
          img.onerror = reject;
          img.src = src;
        };
        
        document.head.appendChild(link);
      } else {
        // Link already exists
        loadingImagesRef.current.delete(src);
        preloadedImagesRef.current.add(src);
        resolve(src);
      }
    });
  }, []);

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

  // Do NOT preload first image (both modes) to avoid duplicate network (DOM <img> + Image())
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
  }, [stableAuthKeys.sourceKey, stableAuthKeys.rootFolder, mangaSettings.useDb, preloadImage, addRecentItem, readerSettings.readingMode]);

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
          // Skip preloading first image intentionally
        } else {
          console.log('🔍 Loading folder data for path:', currentMangaPath);
          if (isOfflineMode) {
            (async () => {
              console.log('📱 Offline mode detected, loading from IndexedDB...');
              try {
                const ch = await getChapter(currentMangaPath);
                console.log('📦 Chapter data from IndexedDB:', ch);
                
                if (ch) {
                  console.log(`✅ Found ${ch.pageUrls?.length || 0} pages in offline chapter`);
                  setCurrentImages(ch.pageUrls);
                  setCurrentPath(currentMangaPath);
                  setLoading(false);
                } else {
                  console.error('❌ No offline chapter found for path:', currentMangaPath);
                  setError('Offline data not found');
                  setLoading(false);
                }
              } catch (error) {
                console.error('❌ Error loading offline chapter:', error);
                setError('Error loading offline data: ' + error.message);
                setLoading(false);
              }
            })();
          } else {
            loadFolderData(currentMangaPath);
          }
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
    if (!isOfflineMode && currentMangaPath && stableAuthKeys.sourceKey && stableAuthKeys.rootFolder) {
      increaseViewCount(currentMangaPath, stableAuthKeys.sourceKey, stableAuthKeys.rootFolder);
    }
  }, [isOfflineMode, currentMangaPath, stableAuthKeys.sourceKey, stableAuthKeys.rootFolder, increaseViewCount]);

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

  // Optimized preload function - intelligent cache-aware preloading
  const preloadImagesAroundCurrentPage = useCallback(async () => {
    // Skip entirely in vertical mode – the images are already in DOM (with lazy loading)
    if (readerSettings.readingMode === 'vertical') return;
    if (!currentImages.length) return;
    
    // Use actual user setting for preload count (1-20)
    const preloadCount = Math.max(1, Math.min(20, Number(readerSettings.preloadCount) || 10));
    
    console.log(`🔧 Preload settings: count=${preloadCount}, mode=${readerSettings.readingMode}, currentPage=${currentPage + 1}`);
    
    // Smart preload strategy: 
    // 1. Skip current image (already loading in DOM)
    // 2. Preload next N images (forward-looking)
    // 3. Preload 1 previous image for quick back navigation
    const imagesToPreload = [];
    
    // Forward preload (next N images)
    const forwardStart = currentPage + 1;
    const forwardEnd = Math.min(currentImages.length - 1, currentPage + preloadCount);
    for (let i = forwardStart; i <= forwardEnd; i++) {
      const src = currentImages[i];
      if (src && !preloadedImagesRef.current.has(src) && !loadingImagesRef.current.has(src)) {
        imagesToPreload.push({ src, type: 'forward', index: i });
      }
    }
    
    // Backward preload (preloadCount previous images for quick navigation)
    const backwardStart = Math.max(0, currentPage - preloadCount);
    const backwardEnd = currentPage - 1;
    for (let i = backwardEnd; i >= backwardStart; i--) {
      const src = currentImages[i];
      if (src && !preloadedImagesRef.current.has(src) && !loadingImagesRef.current.has(src)) {
        imagesToPreload.push({ src, type: 'backward', index: i });
      }
    }

    if (!imagesToPreload.length) {
      console.log(`🖼️ All nearby images already cached (current: ${currentPage + 1})`);
      return;
    }

    console.log(`🖼️ Preloading ${imagesToPreload.length} images around page ${currentPage + 1}:`, 
      imagesToPreload.map(img => `${img.type}:${img.index + 1}`).join(', '));
    
    try {
      // Preload with priority: forward images first, then backward
      const forwardImages = imagesToPreload.filter(img => img.type === 'forward');
      const backwardImages = imagesToPreload.filter(img => img.type === 'backward');
      
      // Preload forward images first (more likely to be needed)
      if (forwardImages.length > 0) {
        await Promise.allSettled(forwardImages.map(img => preloadImage(img.src)));
      }
      
      // Then preload backward images
      if (backwardImages.length > 0) {
        await Promise.allSettled(backwardImages.map(img => preloadImage(img.src)));
      }
      
      console.log(`✅ Preload complete. Total cached: ${preloadedImagesRef.current.size}/${currentImages.length}`);
    } catch (error) {
      console.error('❌ Error preloading images:', error);
    }
  }, [currentImages, currentPage, readerSettings.readingMode, readerSettings.preloadCount, preloadImage]);

  // Effect to preload images when currentPage changes with optimized timing
  useEffect(() => {
    if (currentImages.length > 0 && readerSettings.readingMode === 'horizontal') {
      // Immediate preload for better UX (no delay)
      preloadImagesAroundCurrentPage();
    }
  }, [currentImages.length, currentPage, readerSettings.readingMode, preloadImagesAroundCurrentPage]);

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

  const handleDownloadChapter = async () => {
    if (!currentImages.length || !currentMangaPath || isDownloading) return;
    
    // Kiểm tra Caches API có sẵn không
    if (!isCachesAPISupported()) {
      toast.error('❌ ' + getUnsupportedMessage('Offline download'));
      
      // Hiển thị modal với thông tin browser support
      setStorageCheckResult({
        canDownload: false,
        warning: false, 
        error: true,
        errorMessage: getUnsupportedMessage('Offline download'),
        message: 'Browser không hỗ trợ offline download',
        quota: null,
        required: currentImages ? currentImages.length * 0.5 : 0,
      });
      setShowStorageQuotaModal(true);
      return;
    }
    
    try {
      // 1. Kiểm tra storage quota trước
      console.log('🔍 Checking storage quota before download...');
      const checkResult = await checkStorageForDownload(currentImages);
      setStorageCheckResult(checkResult);
      
      if (!checkResult.canDownload) {
        // Hiển thị modal thông báo lỗi storage
        setShowStorageQuotaModal(true);
        return;
      }
      
      // 2. Nếu có warning, hiển thị modal xác nhận
      if (checkResult.warning) {
        setShowStorageQuotaModal(true);
        return; // Chờ user xác nhận trong modal
      }
      
      // 3. Tiếp tục download nếu quota OK
      await proceedWithDownload();
      
    } catch (err) {
      console.error('❌ Error checking storage quota:', err);
      toast.error('❌ Lỗi kiểm tra dung lượng: ' + err.message);
      
      // Set error state for modal display
      setStorageCheckResult({
        canDownload: false,
        warning: false,
        error: true,
        errorMessage: err.message || 'Unknown error',
        quota: null,
        required: currentImages ? currentImages.length * 0.5 : 0,
      });
      setShowStorageQuotaModal(true);
    }
  };

  const proceedWithDownload = async () => {
    if (!currentImages.length || !currentMangaPath || isDownloading) return;
    
    try {
      setIsDownloading(true);
      setShowDownloadModal(true);
      setDownloadProgress({ current: 0, total: currentImages.length, status: 'starting' });
      
      // Progress callback
      const onProgress = (progress) => {
        setDownloadProgress(progress);
        
        if (progress.status === 'downloading') {
          // Show progress in console for debugging
          const percentage = Math.round((progress.current / progress.total) * 100);
          console.log(`⬇️ Downloading: ${percentage}% (${progress.current}/${progress.total})`);
        }
      };
      
      // Enhanced metadata with better title extraction
      const { mangaTitle, chapterTitle } = extractTitlesFromPath(currentMangaPath);
      
      await downloadChapter({
        id: currentMangaPath,
        mangaTitle,
        chapterTitle,
        pageUrls: currentImages,
        sourceKey: stableAuthKeys.sourceKey,
        rootFolder: stableAuthKeys.rootFolder,
      }, onProgress);
      
      // Update offline status
      setIsChapterOfflineAvailable(true);
      
      // Auto close modal after 3 seconds if completed
      // setTimeout(() => {
      //   setShowDownloadModal(false);
      // }, 3000);
      
    } catch (err) {
      console.error('Download failed', err);
      toast.error('❌ Download failed: ' + err.message);
      setDownloadProgress(prev => ({ ...prev, status: 'error', error: err.message }));
    } finally {
      setIsDownloading(false);
    }
  };

  // ===== Derived pagination (vertical mode) - must be before any conditional returns for hook order stability =====
  const imagesPerScrollPage = readerSettings.scrollImagesPerPage || 200;
  const totalScrollPages = Math.ceil(currentImages.length / imagesPerScrollPage);
  const currentScrollImages = readerSettings.readingMode === 'vertical'
    ? currentImages.slice(scrollPageIndex * imagesPerScrollPage, (scrollPageIndex + 1) * imagesPerScrollPage)
    : currentImages;

  // Keep currentPage aligned to start of scroll chunk in vertical mode
  useEffect(() => {
    if (readerSettings.readingMode === 'vertical') {
      setCurrentPage(scrollPageIndex * imagesPerScrollPage);
    }
  }, [scrollPageIndex, readerSettings.readingMode, imagesPerScrollPage]);

  const goToPrevScrollPage = () => {
    setScrollPageIndex((p) => Math.max(0, p - 1));
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const goToNextScrollPage = () => {
    setScrollPageIndex((p) => Math.min(totalScrollPages - 1, p + 1));
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const openJumpModal = (mode) => {
    setJumpContext(mode);
    setJumpInput('');
    setShowJumpModal(true);
  };

  const closeJumpModal = () => setShowJumpModal(false);
  const handleJumpSelect = (page) => {
    if (jumpContext === 'vertical') {
      setScrollPageIndex(page);
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else {
      setCurrentPage(page);
    }
    closeJumpModal();
  };
  const handleJumpSubmit = (e) => {
    e.preventDefault();
  const num = parseInt(jumpInput, 10);
  const total = jumpContext === 'vertical' ? totalScrollPages : currentImages.length;
  if (!isNaN(num) && num >= 1 && num <= total) handleJumpSelect(num - 1);
  };

  // ESC close & focus restoration
  useEffect(() => {
    if (!showJumpModal) return;
    const onKey = (e) => {
      if (e.key === 'Escape') closeJumpModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showJumpModal]);

  // Use shared utility instead of duplicate logic
  const folderName = getFolderName(currentPath);

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
          onDownload={!isOfflineMode ? handleDownloadChapter : undefined}
          isDownloading={isDownloading}
          downloadProgress={downloadProgress}
          isOfflineAvailable={isChapterOfflineAvailable}
        />
      )}

      <div 
        ref={readerRef}
        className={`reader ${readerSettings.readingMode === 'vertical' ? 'scroll-mode' : ''}`}
      >
        {readerSettings.readingMode === 'vertical' ? (
          // Vertical scroll mode with pagination
          <div className="scroll-container">
            <div className="zoom-wrapper">
              {currentScrollImages.map((imageSrc, index) => {
                const globalIndex = scrollPageIndex * imagesPerScrollPage + index;
                return (
                  <img
                    key={globalIndex}
                    src={imageSrc}
                    alt={`Page ${globalIndex + 1}`}
                    className="scroll-img"
                    loading={mangaSettings.lazyLoad ? "lazy" : "eager"}
                    onClick={handleImageClick}
                    onLoad={(e) => {
                      e.target.classList.remove('loading');
                      const c = (loadCountRef.current.get(imageSrc) || 0) + 1;
                      loadCountRef.current.set(imageSrc, c);
                      const perfCount = performance.getEntriesByName(imageSrc).length;
                      if (!window.__IMG_LOAD_STATS__) window.__IMG_LOAD_STATS__ = {};
                      window.__IMG_LOAD_STATS__[imageSrc] = { count: c, perf: perfCount };
                      console.log(`🧪 Vertical load #${c} for ${globalIndex + 1} (${imageSrc.split('/').pop()}) perfEntries=${perfCount}`);
                    }}
                    onError={(e) => {
                      e.target.style.background = '#333';
                      e.target.alt = 'Lỗi tải ảnh';
                    }}
                  />
                );
              })}
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
                  loading={mangaSettings.lazyLoad ? "lazy" : "eager"}
                  onClick={handleImageClick}
                  onLoad={(e) => {
                    e.target.classList.remove('loading');
                    const src = currentImages[currentPage];
                    const wasPreloaded = preloadedImagesRef.current.has(src);
                    const loadCount = (loadCountRef.current.get(src) || 0) + 1;
                    loadCountRef.current.set(src, loadCount);
                    
                    // Enhanced cache detection
                    const perfEntries = performance.getEntriesByName(src);
                    let isFromCache = false;
                    let cacheInfo = 'unknown';
                    
                    if (perfEntries.length > 0) {
                      const entry = perfEntries[perfEntries.length - 1];
                      // Browser cache indicators
                      const hasTransferSize = entry.transferSize > 0;
                      const fastResponse = (entry.responseEnd - entry.requestStart) < 50;
                      const zeroDuration = (entry.duration < 5);
                      
                      if (entry.transferSize === 0) {
                        isFromCache = true;
                        cacheInfo = 'memory-cache';
                      } else if (fastResponse && hasTransferSize) {
                        isFromCache = true;
                        cacheInfo = 'disk-cache';
                      } else if (zeroDuration) {
                        isFromCache = true;
                        cacheInfo = 'browser-cache';
                      } else {
                        cacheInfo = 'network';
                      }
                    }
                    
                    console.log(`🖼️ Page ${currentPage + 1} loaded:`, {
                      wasPreloaded,
                      isFromCache,
                      cacheInfo,
                      loadCount,
                      filename: src.split('/').pop(),
                      perfData: perfEntries.length > 0 ? {
                        transferSize: perfEntries[perfEntries.length - 1].transferSize,
                        duration: Math.round(perfEntries[perfEntries.length - 1].duration * 100) / 100,
                        responseTime: Math.round((perfEntries[perfEntries.length - 1].responseEnd - perfEntries[perfEntries.length - 1].requestStart) * 100) / 100
                      } : null
                    });
                    
                    // Store debug info globally
                    if (!window.__IMG_LOAD_STATS__) window.__IMG_LOAD_STATS__ = {};
                    window.__IMG_LOAD_STATS__[src] = { 
                      wasPreloaded, 
                      isFromCache,
                      cacheInfo,
                      loadCount,
                      perfEntries: perfEntries.length
                    };
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
    {showControls && readerSettings.readingMode === 'horizontal' && (
        <div className="simple-footer">
          <button onClick={goToPrevPage} disabled={currentPage === 0} className="nav-btn">← Prev</button>
      <div className="page-counter" style={{ cursor: 'pointer' }} onClick={() => openJumpModal('horizontal')}>
            Trang {currentPage + 1} / {currentImages.length}
          </div>
          <button onClick={goToNextPage} disabled={currentPage === currentImages.length - 1} className="nav-btn">Next →</button>
        </div>
      )}

      {showControls && readerSettings.readingMode === 'vertical' && (
        <div className="simple-footer">
          <button onClick={goToPrevScrollPage} disabled={scrollPageIndex === 0} className="nav-btn">← Trang</button>
      <div className="page-counter" onClick={() => openJumpModal('vertical')} style={{ cursor: 'pointer' }}>
            Trang {scrollPageIndex + 1} / {totalScrollPages} ({currentScrollImages.length} ảnh)
          </div>
          <button onClick={goToNextScrollPage} disabled={scrollPageIndex === totalScrollPages - 1} className="nav-btn">Trang →</button>
        </div>
      )}

      {/* Jump Modal */}
      {showJumpModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onMouseDown={(e) => { if (e.target === e.currentTarget) closeJumpModal(); }}
        >
          <div className="relative w-full max-w-md bg-gray-900 text-gray-100 rounded-xl shadow-2xl ring-1 ring-white/10 overflow-hidden animate-in fade-in zoom-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h2 className="text-sm font-semibold tracking-wide text-gray-200">
                {jumpContext === 'vertical' ? 'Chuyển nhóm trang nhanh' : 'Chuyển trang nhanh'}
              </h2>
              <button
                onClick={closeJumpModal}
                className="text-gray-400 hover:text-white transition-colors rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleJumpSubmit} className="px-5 pt-4 pb-3 border-b border-white/5">
              <label className="block text-xs uppercase tracking-wider font-medium mb-1 text-gray-400">Nhập số trang</label>
              <div className="flex gap-2">
                <input
                  autoFocus
                  type="number"
                  min={1}
                  max={jumpContext === 'vertical' ? totalScrollPages : currentImages.length}
                  value={jumpInput}
                  onChange={(e) => setJumpInput(e.target.value)}
                  placeholder={`1-${jumpContext === 'vertical' ? totalScrollPages : currentImages.length}`}
                  className="w-full rounded-md bg-gray-800 border border-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!jumpInput}
                >
                  Đi
                </button>
              </div>
              <p className="mt-2 text-[11px] text-gray-500">
                Trang hiện tại: <span className="text-gray-300 font-medium">{jumpContext === 'vertical' ? (scrollPageIndex + 1) : (currentPage + 1)}</span>
                {' '} / {jumpContext === 'vertical' ? totalScrollPages : currentImages.length}
              </p>
            </form>
            {(() => {
              // Show grid ONLY in vertical mode; remove for horizontal per request
              if (jumpContext !== 'vertical') return null;
              const total = totalScrollPages;
              if (total <= 300) {
                const activeIndex = scrollPageIndex;
                return (
                  <div className="p-4 max-h-[45vh] overflow-y-auto custom-scrollbar grid grid-cols-5 gap-2 md:grid-cols-6 lg:grid-cols-7">
                    {Array.from({ length: total }, (_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleJumpSelect(i)}
                        className={
                          `group relative h-10 rounded-md text-sm font-medium flex items-center justify-center transition-all border ` +
                          (i === activeIndex
                            ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/30'
                            : 'bg-gray-800/70 border-gray-700 text-gray-300 hover:bg-gray-700/70 hover:text-white hover:border-gray-600')
                        }
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                );
              }
              // Large total vertical pages -> compact helper buttons
              return (
                <div className="px-5 py-6 text-xs text-gray-400 space-y-3">
                  <p>Quá nhiều nhóm ({total}). Dùng ô nhập số hoặc nút trước / kế tiếp.</p>
                  <div className="flex flex-wrap gap-2">
                    {['1','5','10','25','50','100'].map(v => {
                      const jump = parseInt(v,10)-1;
                      if (jump >= total) return null;
                      return (
                        <button
                          key={v}
                          type="button"
                          onClick={() => handleJumpSelect(jump)}
                          className="px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium border border-gray-700"
                        >
                          {v}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
            <div className="flex items-center justify-between px-5 py-3 bg-gray-800/60 border-t border-white/5 text-[11px]">
              <button
                onClick={() => {
                  if (jumpContext === 'vertical') handleJumpSelect(Math.max(scrollPageIndex - 1, 0));
                  else handleJumpSelect(Math.max(currentPage - 1, 0));
                }}
                disabled={jumpContext === 'vertical' ? scrollPageIndex === 0 : currentPage === 0}
                className="px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-xs font-medium text-gray-200"
              >
                ← Trang trước
              </button>
              <button
                onClick={() => {
                  if (jumpContext === 'vertical') handleJumpSelect(Math.min(scrollPageIndex + 1, totalScrollPages - 1));
                  else handleJumpSelect(Math.min(currentPage + 1, currentImages.length - 1));
                }}
                disabled={jumpContext === 'vertical' ? (scrollPageIndex === totalScrollPages - 1) : (currentPage === currentImages.length - 1)}
                className="px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-xs font-medium text-gray-200"
              >
                Trang kế tiếp →
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Download Progress Modal */}
      <DownloadProgressModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        progress={downloadProgress}
        isDownloading={isDownloading}
        chapterTitle={getFolderName(currentPath)}
      />
      
      {/* Storage Quota Modal */}
      <StorageQuotaModal
        isOpen={showStorageQuotaModal}
        onClose={() => setShowStorageQuotaModal(false)}
        storageInfo={storageCheckResult?.storageInfo || {}}
        estimatedSize={storageCheckResult?.estimatedSize || 0}
        canDownload={storageCheckResult?.canDownload || false}
        message={storageCheckResult?.message || ''}
        warning={storageCheckResult?.warning || ''}
        chapterTitle={getFolderName(currentPath)}
        onConfirm={async () => {
          setShowStorageQuotaModal(false);
          await proceedWithDownload();
        }}
        onCancel={() => setShowStorageQuotaModal(false)}
      />
    </div>
  );
};

export default MangaReader;
