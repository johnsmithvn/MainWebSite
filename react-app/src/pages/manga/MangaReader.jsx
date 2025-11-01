import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, PanelLeft } from 'lucide-react';
import { useMangaStore, useAuthStore } from '../../store';
import useDownloadQueueStore, { DOWNLOAD_STATUS } from '../../store/downloadQueueStore';
import { useRecentManager } from '../../hooks/useRecentManager';
import { getFolderName, extractTitlesFromPath } from '../../utils/pathUtils';
import { apiService } from '../../utils/api';
import { downloadChapter, isChapterDownloaded, getChapter, deleteChapterCompletely } from '../../utils/offlineLibrary';
import { checkStorageForDownload } from '../../utils/storageQuota';
import { isCachesAPISupported, getUnsupportedMessage } from '../../utils/browserSupport';
import { READER } from '../../constants';
import ReaderHeader from '../../components/manga/ReaderHeader';
import { DownloadProgressModal, DownloadConfirmModal, StorageQuotaModal } from '../../components/common';
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
  
  // Download Queue Store
  const { 
    addToQueue, 
    findTaskByChapter, 
    getTask,
    tasks: queueTasks,
    activeDownloads,
    stats
  } = useDownloadQueueStore();
  
  const [currentImages, setCurrentImages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0); // index within current group for horizontal OR global index in vertical
  const [scrollPageIndex, setScrollPageIndex] = useState(0); // page group index for vertical pagination
  const [loading, setLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  // ✅ Loading state cho horizontal image navigation
  const [isImageLoading, setIsImageLoading] = useState(false);
  const imageLoadTimeoutRef = useRef(null);
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
  
  // ✅ Track scroll position and current viewing image for mode switching
  const scrollPositionRef = useRef(0);
  const lastKnownImageIndexRef = useRef(0);
  
  // Download states
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0, status: 'idle' });
  const [isChapterOfflineAvailable, setIsChapterOfflineAvailable] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showDownloadConfirmModal, setShowDownloadConfirmModal] = useState(false);
  const [isCheckingStorage, setIsCheckingStorage] = useState(false);
  
  // Storage quota states
  const [showStorageQuotaModal, setShowStorageQuotaModal] = useState(false);
  const [storageCheckResult, setStorageCheckResult] = useState(null);
  
  // Download Queue states - Modal "Đã cho vào hàng chờ"
  const [showQueuedModal, setShowQueuedModal] = useState(false);
  const [queuedTaskInfo, setQueuedTaskInfo] = useState(null);

  // Zoom states for horizontal mode
  const [zoomLevel, setZoomLevel] = useState(READER.ZOOM_LEVEL_DEFAULT);
  const [zoomOrigin, setZoomOrigin] = useState({ x: READER.ZOOM_ORIGIN_CENTER, y: READER.ZOOM_ORIGIN_CENTER }); // Fixed origin point for zoom
  // ✅ Use ref instead of state for pan position to avoid re-renders during pan
  const panPositionRef = useRef({ x: 0, y: 0 }); // Pan offset
  const [isZoomed, setIsZoomed] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const clickTimeoutRef = useRef(null);
  const lastClickTimeRef = useRef(0);
  const panStartRef = useRef(null); // Store initial touch position for pan delta calculation
  // ✅ Refs for imperative DOM manipulation
  const imgRef = useRef(null); // Reference to the image element
  const frameRef = useRef(null); // RAF frame ID for throttling

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
  const minSwipeDistance = READER.MIN_SWIPE_DISTANCE;

  // Memoize current path to avoid unnecessary effect reruns
  const currentMangaPath = useMemo(() => {
    const path = searchParams.get('path') || folderId;
    console.log('📁 currentMangaPath computed:', path);
    return path;
  }, [searchParams, folderId]);

  const isOfflineMode = searchParams.get('offline') === '1';


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
  
  // ✅ Re-check offline status when download completes
  useEffect(() => {
    const checkOfflineStatus = async () => {
      if (!currentMangaPath) return;
      try {
        const isAvailable = await isChapterDownloaded(currentMangaPath);
        console.log('[Reader] 🔍 Re-checking offline status:', { 
          currentMangaPath, 
          isAvailable,
          totalDownloaded: stats.totalDownloaded 
        });
        setIsChapterOfflineAvailable(isAvailable);
      } catch (err) {
        console.error('Error re-checking offline status after download:', err);
      }
    };
    
    // Re-check when any download completes (stats.totalDownloaded changes)
    checkOfflineStatus();
  }, [stats.totalDownloaded, currentMangaPath]); // ← Trigger khi có download complete

  // Enhanced preload using link preload for better browser cache integration
  // ✅ Track active preload links for cancellation
  const activePreloadLinksRef = useRef(new Set());

  const preloadImage = useCallback((src, cancelledRef) => {
    return new Promise((resolve, reject) => {
      if (!src) return resolve(src);
      if (preloadedImagesRef.current.has(src)) return resolve(src);
      if (loadingImagesRef.current.has(src)) return resolve(src); // already in-flight
      
      // ✅ Check cancellation BEFORE starting
      if (cancelledRef?.current) {
        console.log(`🛑 Preload skipped (cancelled): ${src.split('/').pop()}`);
        return resolve(src);
      }
      
      loadingImagesRef.current.add(src);
      
      // Strategy 1: Use <link rel="preload"> for better cache integration
      const existingLink = document.querySelector(`link[href="${src}"]`);
      if (!existingLink) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        
        // ✅ Track link for cleanup
        activePreloadLinksRef.current.add(link);
        
        link.onload = () => {
          loadingImagesRef.current.delete(src);
          preloadedImagesRef.current.add(src);
          activePreloadLinksRef.current.delete(link);
          console.log(`✅ Preloaded (link): ${src.split('/').pop()}`);
          // Clean up after successful preload
          setTimeout(() => link.remove(), READER.PRELOAD_LINK_CLEANUP_DELAY);
          resolve(src);
        };
        
        link.onerror = () => {
          loadingImagesRef.current.delete(src);
          activePreloadLinksRef.current.delete(link);
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
        const isPrefetchValid = readerPrefetch && readerPrefetch.path === currentMangaPath && Array.isArray(readerPrefetch.images) && readerPrefetch.images.length > 0 && Date.now() - (readerPrefetch.ts || 0) < READER.PREFETCH_CACHE_TTL;
        if (isPrefetchValid) {
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
  }, [readerSettings]);

  // Cleanup timers and RAF on unmount
  useEffect(() => {
    return () => {
      if (viewDebounceRef.current) clearTimeout(viewDebounceRef.current);
      if (imageLoadTimeoutRef.current) clearTimeout(imageLoadTimeoutRef.current);
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
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
  const preloadImagesAroundCurrentPage = useCallback(async (cancelledRef) => {
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
      // ✅ SEQUENTIAL preload với delay để tránh overwhelm backend
      const forwardImages = imagesToPreload.filter(img => img.type === 'forward');
      const backwardImages = imagesToPreload.filter(img => img.type === 'backward');
      
      // Preload forward images SEQUENTIALLY (không song song)
      for (const img of forwardImages) {
        // ✅ Check cancellation before each preload
        if (cancelledRef?.current) {
          console.log('🛑 Preload cancelled by unmount');
          return;
        }
        await preloadImage(img.src, cancelledRef); // ✅ Pass cancelledRef
        // Small delay between images
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Then preload backward images SEQUENTIALLY
      for (const img of backwardImages) {
        // ✅ Check cancellation before each preload
        if (cancelledRef?.current) {
          console.log('🛑 Preload cancelled by unmount');
          return;
        }
        await preloadImage(img.src, cancelledRef); // ✅ Pass cancelledRef
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      console.log(`✅ Preload complete. Total cached: ${preloadedImagesRef.current.size}/${currentImages.length}`);
    } catch (error) {
      console.error('❌ Error preloading images:', error);
    }
  }, [currentImages, currentPage, readerSettings.readingMode, readerSettings.preloadCount, preloadImage]);

  // ✅ Apply transform directly to DOM using refs (no re-render)
  // MUST be defined BEFORE any useEffect or callback that uses it
  const applyTransform = useCallback((zoom, origin, pan) => {
    if (!imgRef.current) return;
    
    const transform = zoom > 1 
      ? `scale(${zoom}) translate(${pan.x}%, ${pan.y}%)` 
      : 'scale(1) translate(0, 0)';
    
    const transformOrigin = `${origin.x}% ${origin.y}%`;
    
    imgRef.current.style.transform = transform;
    imgRef.current.style.transformOrigin = transformOrigin;
  }, []);

  // Effect to preload images when currentPage changes with optimized timing
  useEffect(() => {
    if (currentImages.length === 0 || readerSettings.readingMode !== 'horizontal') {
      return;
    }
    
    // ✅ Cancellation flag using ref (checked in async loop)
    const cancelledRef = { current: false };
    
    const preloadAsync = async () => {
      await preloadImagesAroundCurrentPage(cancelledRef);
    };
    
    preloadAsync();
    
    // ✅ Cleanup: Set flag + remove pending <link> elements
    return () => {
      cancelledRef.current = true;
      
      // Remove all active preload links from DOM
      activePreloadLinksRef.current.forEach(link => {
        try {
          link.remove();
          console.log(`🗑️ Removed preload link: ${link.href.split('/').pop()}`);
        } catch (err) {
          console.warn('Error removing link:', err);
        }
      });
      activePreloadLinksRef.current.clear();
      
      console.log('🧹 Preload cancelled on unmount/page change');
    };
  }, [currentImages.length, currentPage, readerSettings.readingMode, preloadImagesAroundCurrentPage]);

  // ✅ Sync transform when zoom/origin changes (not during pan for performance)
  useEffect(() => {
    if (imgRef.current && readerSettings.readingMode === 'horizontal') {
      applyTransform(zoomLevel, zoomOrigin, panPositionRef.current);
    }
  }, [zoomLevel, zoomOrigin, readerSettings.readingMode, applyTransform]);

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  // Zoom functions for horizontal mode - optimized for image-only zoom
  const handleDoubleClick = useCallback((e) => {
    if (readerSettings.readingMode !== 'horizontal') return;

    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (isZoomed) {
      // Zoom out
      const newZoom = READER.ZOOM_LEVEL_DEFAULT;
      const newOrigin = { x: READER.ZOOM_ORIGIN_CENTER, y: READER.ZOOM_ORIGIN_CENTER };
      const newPan = { x: 0, y: 0 };
      
      setZoomLevel(newZoom);
      setZoomOrigin(newOrigin);
      panPositionRef.current = newPan;
      setIsZoomed(false);
      
      // ✅ Apply transform immediately via DOM
      applyTransform(newZoom, newOrigin, newPan);
    } else {
      // Zoom in to clicked position
      const newZoom = READER.ZOOM_LEVEL_2X;
      const newOrigin = { x, y };
      const newPan = { x: 0, y: 0 };
      
      setZoomLevel(newZoom);
      setZoomOrigin(newOrigin);
      panPositionRef.current = newPan;
      setIsZoomed(true);
      
      // ✅ Apply transform immediately via DOM
      applyTransform(newZoom, newOrigin, newPan);
    }
  }, [readerSettings.readingMode, isZoomed, applyTransform]);

  // ✅ Optimized pan handler using RAF and refs for 60fps smooth performance
  const handleTouchMoveZoom = useCallback((e) => {
    if (!isZoomed || readerSettings.readingMode !== 'horizontal') return;

    if (e.touches.length === 1) {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = e.currentTarget.getBoundingClientRect();

      // Calculate current touch position as percentage
      const touchX = ((touch.clientX - rect.left) / rect.width) * 100;
      const touchY = ((touch.clientY - rect.top) / rect.height) * 100;

      // Initialize pan start position on first touch move
      if (!panStartRef.current) {
        panStartRef.current = {
          x: touchX,
          y: touchY,
          initialPan: { ...panPositionRef.current }
        };
      }

      // Calculate delta from initial touch position (relative movement)
      const deltaX = touchX - panStartRef.current.x;
      const deltaY = touchY - panStartRef.current.y;

      // ✅ Apply damping factor to reduce sensitivity
      const dampingFactor = READER.PAN_DAMPING_FACTOR;
      const dampedDeltaX = deltaX * dampingFactor;
      const dampedDeltaY = deltaY * dampingFactor;

      // Apply damped delta to initial pan position for smooth relative panning
      const newPanX = panStartRef.current.initialPan.x + dampedDeltaX;
      const newPanY = panStartRef.current.initialPan.y + dampedDeltaY;

      // ✅ Calculate proper bounds based on zoom level
      const maxPanPercent = READER.PAN_MAX_PERCENT_FACTOR / zoomLevel;
      
      // Constrain pan within calculated bounds to keep image within reasonable view
      const constrainedX = Math.max(-maxPanPercent, Math.min(maxPanPercent, newPanX));
      const constrainedY = Math.max(-maxPanPercent, Math.min(maxPanPercent, newPanY));

      // ✅ Use RAF to throttle DOM updates to 60fps
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      
      frameRef.current = requestAnimationFrame(() => {
        panPositionRef.current = { x: constrainedX, y: constrainedY };
        applyTransform(zoomLevel, zoomOrigin, panPositionRef.current);
      });
    }
  }, [isZoomed, readerSettings.readingMode, zoomLevel, zoomOrigin, applyTransform]);

  // Modified image click handler - requires 4 clicks to toggle controls, but allows double-click for zoom
  const handleImageClick = useCallback((e) => {
    // ✅ Prevent event bubbling to avoid double execution
    e?.stopPropagation();
    
    if (readerSettings.readingMode !== 'horizontal') {
      toggleControls();
      return;
    }
    
    // ✅ Ignore clicks when zoomed to avoid conflict with pan gestures
    if (isZoomed) {
      return;
    }
    
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTimeRef.current;
    
    // ✅ If double-click detected (within DOUBLE_CLICK_THRESHOLD), reset everything and ignore
    if (timeSinceLastClick > 0 && timeSinceLastClick < READER.DOUBLE_CLICK_THRESHOLD) {
      // This is a double-click, let onDoubleClick handler take care of zoom
      // Reset click count to avoid interference
      setClickCount(0);
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      // ✅ Reset lastClickTimeRef to 0 to ensure next click is a completely fresh start
      lastClickTimeRef.current = 0;
      if (import.meta.env.DEV) {
        console.log('🔍 Double-click detected, resetting all counters and ignoring for UI toggle');
      }
      return;
    }
    
    // ✅ Update lastClickTimeRef for single click tracking
    lastClickTimeRef.current = now;
    
    // Clear existing timeout
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    
    setClickCount(prev => {
      const newCount = prev + 1;
      if (import.meta.env.DEV) {
        console.log(`👆 Click ${newCount}/4 (Controls: ${showControls ? 'visible' : 'hidden'})`);
      }
      if (newCount >= 4) {
        // 4 clicks reached, toggle controls visibility
        if (import.meta.env.DEV) {
          console.log(`✅ 4 clicks reached, toggling UI from ${showControls ? 'visible' : 'hidden'} to ${!showControls ? 'visible' : 'hidden'}`);
        }
        // ✅ Toggle controls using state setter to ensure correct behavior
        setShowControls(prev => !prev);
        return 0;
      } else {
        // Set timeout to reset click count (FOUR_CLICK_WINDOW for more lenient timing)
        clickTimeoutRef.current = setTimeout(() => {
          if (import.meta.env.DEV) {
            console.log('⏱️ Click timeout, resetting count');
          }
          setClickCount(0);
        }, READER.FOUR_CLICK_WINDOW);
        return newCount;
      }
    });
  }, [readerSettings.readingMode, isZoomed, showControls]);

  // Navigation functions for horizontal mode
  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(currentImages.length - 1, prev + 1));
  };

  const toggleReadingMode = () => {
    const newMode = readerSettings.readingMode === 'vertical' ? 'horizontal' : 'vertical';
    
    // ✅ If switching from vertical, force update lastKnownImageIndex NOW
    if (readerSettings.readingMode === 'vertical') {
      const images = document.querySelectorAll('.scroll-img');
      if (images.length > 0) {
        const viewportCenter = window.innerHeight / 2;
        let closestIndex = 0;
        let minDistance = Infinity;
        
        images.forEach((img, idx) => {
          const rect = img.getBoundingClientRect();
          const imageCenter = rect.top + (rect.height / 2);
          const distance = Math.abs(imageCenter - viewportCenter);
          
          if (distance < minDistance) {
            minDistance = distance;
            closestIndex = scrollPageIndex * imagesPerScrollPage + idx;
          }
        });
        
        lastKnownImageIndexRef.current = closestIndex;
        console.log(`🎯 Force-updated lastKnownImageIndex to: ${closestIndex}`);
      }
    }
    
    console.log('🔄 Toggling reading mode:', {
      from: readerSettings.readingMode,
      to: newMode,
      currentPage,
      scrollPageIndex,
      lastKnownImageIndex: lastKnownImageIndexRef.current,
      totalImages: currentImages.length
    });
    
    if (newMode === 'horizontal') {
      // ✅ Vertical → Horizontal: Set currentPage from last known scroll position
      // If lastKnownImageIndexRef is 0 (not yet tracked), use currentPage as fallback
      let targetPage = lastKnownImageIndexRef.current;
      
      // Fallback: if ref is 0 and we're not at the start, calculate from scrollPageIndex
      if (targetPage === 0 && scrollPageIndex > 0) {
        targetPage = scrollPageIndex * imagesPerScrollPage;
        console.log(`⚠️ Using fallback calculation from scrollPageIndex: ${targetPage}`);
      }
      
      targetPage = Math.max(0, Math.min(currentImages.length - 1, targetPage));
      console.log(`📖 Switch to horizontal mode, jumping to page ${targetPage + 1}/${currentImages.length}`);
      setCurrentPage(targetPage);
    } else {
      // ✅ Horizontal → Vertical: Calculate scrollPageIndex from currentPage
      const targetScrollPage = Math.floor(currentPage / imagesPerScrollPage);
      const offsetInPage = currentPage % imagesPerScrollPage;
      
      console.log(`📜 Switch to vertical mode, chunk ${targetScrollPage + 1}/${totalScrollPages}, offset ${offsetInPage}, currentPage=${currentPage}`);
      setScrollPageIndex(targetScrollPage);
      
      // ✅ Wait for DOM render, then scroll to exact image position with retry
      const scrollToTarget = (attempt = 1, maxAttempts = READER.MODE_SWITCH_MAX_RETRIES) => {
        const images = document.querySelectorAll('.scroll-img');
        console.log(`🔍 Attempt ${attempt}: Found ${images.length} images in DOM, looking for offset ${offsetInPage}`);
        
        if (images.length === 0 && attempt < maxAttempts) {
          // DOM not ready, retry after delay with exponential backoff
          const retryDelay = READER.MODE_SWITCH_RETRY_DELAY_BASE * attempt;
          console.log(`⏳ DOM not ready, retrying in ${retryDelay}ms...`);
          setTimeout(() => scrollToTarget(attempt + 1, maxAttempts), retryDelay);
          return;
        }
        
        const targetImage = images[offsetInPage];
        if (targetImage) {
          targetImage.scrollIntoView({ behavior: 'instant', block: 'start' });
          console.log(`✅ Scrolled to image ${offsetInPage + 1} in chunk ${targetScrollPage + 1}`);
        } else {
          console.warn(`⚠️ Target image ${offsetInPage} not found in ${images.length} images, scrolling to top`);
          window.scrollTo({ top: 0, behavior: 'instant' });
        }
      };
      
      // Start scroll attempt after mode switch
      setTimeout(() => scrollToTarget(), READER.MODE_SWITCH_SCROLL_DELAY);
    }
    
    updateReaderSettings({
      ...readerSettings,
      readingMode: newMode,
    });
  };

  const onTouchStart = (e) => {
    // ✅ Only disable swipe navigation when zoomed, but allow pan gestures
    if (e.touches.length > 1) {
      setTouchStart(null);
      setTouchEnd(null);
      return;
    }

    // When zoomed, reset pan start reference for new touch
    if (isZoomed) {
      panStartRef.current = null; // Reset for new pan gesture
      return;
    }

    setTouchEnd(null); // otherwise the swipe is fired even with a single touch
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    // ✅ Handle zoom pan if zoomed, otherwise handle swipe
    if (isZoomed) {
      handleTouchMoveZoom(e);
      return;
    }
    
    // ✅ Ignore multi-touch (zoom gesture)
    // ✅ Fixed: Check null explicitly to avoid false positive at x=0
    if (e.touches.length > 1 || touchStart === null) {
      return;
    }
    
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    // ✅ Don't handle swipe navigation when zoomed
    if (isZoomed) {
      // Clear pan start reference when touch ends
      panStartRef.current = null;
      return;
    }

    // ✅ Fixed: Check null explicitly to avoid false positive at x=0
    if (touchStart === null || touchEnd === null) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNextPage();
    }
    if (isRightSwipe) {
      goToPrevPage();
    }

    // ✅ Clear touch state
    setTouchStart(null);
    setTouchEnd(null);
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
    
    // ✅ BƯỚC 1: Hiện loading NGAY KHI CLICK
    setIsCheckingStorage(true);
    setShowDownloadConfirmModal(true); // Show modal với loading spinner
    
    try {
      // Kiểm tra Caches API có sẵn không
      if (!isCachesAPISupported()) {
        setIsCheckingStorage(false);
        setShowDownloadConfirmModal(false);
        toast.error('❌ ' + getUnsupportedMessage('Offline download'));
        
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
      
      // ✅ BƯỚC 2: Check storage TRƯỚC (với loading)
      const checkPromise = checkStorageForDownload(currentImages);
      let timeoutId;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Storage check timeout after 10s')), 10000);
      });
      
      let checkResult;
      try {
        checkResult = await Promise.race([checkPromise, timeoutPromise]);
      } finally {
        clearTimeout(timeoutId);
      }
      setStorageCheckResult(checkResult);
      setIsCheckingStorage(false); // Tắt loading
      
      // Nếu không đủ storage hoặc có warning
      if (!checkResult.canDownload || checkResult.warning) {
        setShowDownloadConfirmModal(false);
        setShowStorageQuotaModal(true);
        return;
      }
      
      // ✅ BƯỚC 3: Storage OK → Check active downloads
      const activeDownloadCount = activeDownloads.size;
      
      if (activeDownloadCount >= 2) {
        // 2+ active downloads → Add to queue only (không confirm)
        setShowDownloadConfirmModal(false);
        await handleAutoAddToQueue();
        return;
      }
      
      // ✅ BƯỚC 4: < 2 active → Hiện modal confirm (loading đã tắt, sẵn sàng confirm)
      // Modal vẫn đang mở, chờ user click confirm
      
    } catch (err) {
      setIsCheckingStorage(false);
      setShowDownloadConfirmModal(false);
      toast.error('❌ Lỗi: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDownloadConfirm = async () => {
    if (!currentImages.length || !currentMangaPath || isDownloading) return;
    
    try {
      // Đóng confirm modal ngay
      setShowDownloadConfirmModal(false);
      
      // Nếu đã download, xóa chapter cũ trước
      if (isChapterOfflineAvailable) {
        await deleteChapterCompletely(currentMangaPath);
        setIsChapterOfflineAvailable(false);
      }
      
      // 🔥 Add to queue với auto-start (storage đã check rồi)
      await handleAddToQueueWithAutoStart();
      
    } catch (err) {
      console.error('❌ Error in handleDownloadConfirm:', err);
      toast.error('❌ Lỗi: ' + (err.message || 'Unknown error'));
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

  // ============================================================================
  // HELPER: Check Queue Status
  // ============================================================================

  /**
   * Check if current chapter is in download queue
   * @returns {boolean} True if chapter exists in queue (any status)
   */
  const checkIfChapterInQueue = () => {
    if (!currentMangaPath) return false;
    
    const cleanPath = currentMangaPath.replace(/\/__self__$/, '');
    const pathParts = cleanPath.split('/').filter(Boolean);
    const mangaId = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : '';
    const chapterId = pathParts[pathParts.length - 1] || cleanPath;
    
    const task = findTaskByChapter(sourceKey, mangaId, chapterId);
    
    // ✅ CHỈ hiện queue indicator nếu task đang PENDING hoặc DOWNLOADING
    // Nếu COMPLETED → Đã được handle bởi isOfflineAvailable
    if (!task) return false;
    
    return task.status === DOWNLOAD_STATUS.PENDING || task.status === DOWNLOAD_STATUS.DOWNLOADING;
  };

  // ============================================================================
  // DOWNLOAD QUEUE: Add to Queue Handlers
  // ============================================================================
  
  // 🔥 ADD TO QUEUE WITH AUTO-START: When 0-1 downloads are active
  // This function adds to queue and lets worker auto-start immediately
  // Modal CAN be closed, download continues in background
  const handleAddToQueueWithAutoStart = async () => {
    try {
      // ✅ Nếu đã vào được reader page → ĐÃ LÀ CHAPTER RỒI, parse path thôi
      const cleanPath = currentMangaPath.replace(/\/__self__$/, '');
      const pathParts = cleanPath.split('/').filter(Boolean);
      
      // Extract mangaId and chapterId
      const mangaId = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : '';
      const chapterId = pathParts[pathParts.length - 1] || cleanPath;
      
      console.log('📊 Download:', { path: cleanPath, mangaId, chapterId });
      
      // Kiểm tra nếu đã có trong queue
      const existingTask = findTaskByChapter(sourceKey, mangaId, chapterId);
      if (existingTask) {
        console.log('ℹ️ Task already exists in queue:', existingTask.id);
        toast('ℹ️ Chapter đã có trong hàng chờ', { 
          icon: '📋',
          duration: 3000,
          action: {
            label: 'Xem',
            onClick: () => navigate('/downloads')
          }
        });
        return;
      }
      
      // Extract titles từ path
      const { mangaTitle, chapterTitle } = extractTitlesFromPath(currentMangaPath);
      
      // Add to queue (will auto-start immediately since < 2 active)
      const taskId = addToQueue({
        source: sourceKey,
        rootFolder: stableAuthKeys.rootFolder, // ✅ REQUIRED for API
        mangaId,
        mangaTitle: mangaTitle || mangaId,
        chapterId,
        chapterTitle: chapterTitle || chapterId,
        totalPages: currentImages.length
      });
      
      console.log('✅ Added to queue with auto-start:', {
        taskId,
        source: sourceKey,
        mangaId,
        chapterId,
        totalPages: currentImages.length
      });
      
      // Show success toast với action button
      toast.success('✅ Đã bắt đầu tải xuống', {
        duration: 4000,
        action: {
          label: 'Xem tiến trình',
          onClick: () => navigate('/downloads')
        }
      });
      
      // Ghi log view (tương tự như direct download)
      try {
        await fetch('/api/increase-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: sourceKey,
            mangaPath: currentMangaPath
          })
        });
      } catch (err) {
        console.warn('⚠️ Failed to increase view count:', err);
        // Non-critical error, continue
      }
      
    } catch (err) {
      console.error('❌ Error adding to queue:', err);
      toast.error('❌ Lỗi thêm vào hàng chờ: ' + err.message);
    }
  };
  
  // 🔥 AUTO ADD TO QUEUE: When 2+ downloads are active
  const handleAutoAddToQueue = async () => {
    if (!currentImages.length || !currentMangaPath) {
      toast.error('❌ Không có chapter để tải');
      return;
    }
    
    try {
      // Parse path
      const cleanPath = currentMangaPath.replace(/\/__self__$/, '');
      const pathParts = cleanPath.split('/').filter(Boolean);
      const mangaId = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : '';
      const chapterId = pathParts[pathParts.length - 1] || cleanPath;
      
      const existingTask = findTaskByChapter(sourceKey, mangaId, chapterId);
      
      if (existingTask) {
        // Task already exists
        if (existingTask.status === DOWNLOAD_STATUS.COMPLETED) {
          toast('ℹ️ Chapter đã được tải xuống', { icon: '✅' });
        } else if (existingTask.status === DOWNLOAD_STATUS.DOWNLOADING) {
          toast('ℹ️ Chapter đang được tải trong queue', { icon: '⏳' });
        } else if (existingTask.status === DOWNLOAD_STATUS.PENDING) {
          toast('ℹ️ Chapter đã có trong queue', { icon: '📋' });
        } else {
          toast(`ℹ️ Chapter đã có trong queue (${existingTask.status})`, { icon: '📋' });
        }
        
        // Navigate to downloads page
        navigate('/downloads');
        return;
      }
      
      // 2. Check storage quota (simplified check)
      const checkResult = await checkStorageForDownload(currentImages);
      
      if (!checkResult.canDownload) {
        setStorageCheckResult(checkResult);
        setShowStorageQuotaModal(true);
        return;
      }
      
      // 3. Extract titles from path
      const { mangaTitle, chapterTitle } = extractTitlesFromPath(currentMangaPath);
      
      // 4. Add to queue
      const taskId = addToQueue({
        source: sourceKey,
        rootFolder: stableAuthKeys.rootFolder, // ✅ REQUIRED for API
        mangaId,
        mangaTitle: mangaTitle || mangaId,
        chapterId,
        chapterTitle: chapterTitle || chapterId,
        totalPages: currentImages.length
      });
      
      console.log('✅ Auto-added to download queue:', taskId);
      
      // 5. Show "Đã cho vào hàng chờ" modal
      setQueuedTaskInfo({
        taskId,
        mangaTitle: mangaTitle || mangaId,
        chapterTitle: chapterTitle || chapterId,
        totalPages: currentImages.length
      });
      setShowQueuedModal(true);
      
      // 6. Also show toast notification
      toast.success('✅ Đã thêm vào hàng chờ download', {
        duration: 3000,
        position: 'bottom-center'
      });
      
    } catch (error) {
      console.error('❌ Error auto-adding to queue:', error);
      toast.error('❌ Lỗi khi thêm vào queue: ' + error.message);
    }
  };
  
  const handleAddToQueue = async () => {
    if (!currentImages.length || !currentMangaPath) {
      toast.error('❌ Không có chapter để tải');
      return;
    }
    
    // Kiểm tra Caches API có sẵn không
    if (!isCachesAPISupported()) {
      toast.error('❌ ' + getUnsupportedMessage('Offline download'));
      return;
    }
    
    try {
      // Parse path
      const cleanPath = currentMangaPath.replace(/\/__self__$/, '');
      const pathParts = cleanPath.split('/').filter(Boolean);
      const mangaId = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : '';
      const chapterId = pathParts[pathParts.length - 1] || cleanPath;
      
      const existingTask = findTaskByChapter(sourceKey, mangaId, chapterId);
      
      if (existingTask) {
        // Task already exists
        if (existingTask.status === DOWNLOAD_STATUS.COMPLETED) {
          toast('ℹ️ Chapter đã được tải xuống', { icon: '✅' });
        } else if (existingTask.status === DOWNLOAD_STATUS.DOWNLOADING) {
          toast('ℹ️ Chapter đang được tải trong queue', { icon: '⏳' });
        } else if (existingTask.status === DOWNLOAD_STATUS.PENDING) {
          toast('ℹ️ Chapter đã có trong queue', { icon: '📋' });
        } else {
          toast(`ℹ️ Chapter đã có trong queue (${existingTask.status})`, { icon: '📋' });
        }
        
        // Navigate to downloads page
        navigate('/downloads');
        return;
      }
      
      // 2. Check storage quota (simplified check)
      const estimatedSize = currentImages.length * 0.5; // 500KB per image estimate
      const checkResult = await checkStorageForDownload(currentImages);
      
      if (!checkResult.canDownload) {
        setStorageCheckResult(checkResult);
        setShowStorageQuotaModal(true);
        return;
      }
      
      // 3. Extract titles from path
      const { mangaTitle, chapterTitle } = extractTitlesFromPath(currentMangaPath);
      
      // 4. Add to queue
      const taskId = addToQueue({
        source: sourceKey,
        rootFolder: stableAuthKeys.rootFolder, // ✅ REQUIRED for API
        mangaId,
        mangaTitle: mangaTitle || mangaId,
        chapterId,
        chapterTitle: chapterTitle || chapterId,
        totalPages: currentImages.length
      });
      
      console.log('✅ Added to download queue:', taskId);
      
      // 5. Show success toast with link to downloads page
      toast.success(
        (t) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span>✅ Đã thêm vào queue download</span>
            <button
              onClick={() => {
                navigate('/downloads');
                toast.dismiss(t.id);
              }}
              style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              📋 Xem Queue
            </button>
          </div>
        ),
        {
          duration: 5000,
          position: 'bottom-center'
        }
      );
      
    } catch (error) {
      console.error('❌ Error adding to queue:', error);
      toast.error('❌ Lỗi khi thêm vào queue: ' + error.message);
    }
  };

  // ============================================================================
  // DOWNLOAD QUEUE: Subscribe to Queue Updates (REMOVED - Not needed)
  // Smart logic now only checks activeDownloads.size in handleDownloadChapter
  // ============================================================================

  // ===== Derived pagination (vertical mode) - must be before any conditional returns for hook order stability =====
  const imagesPerScrollPage = readerSettings.scrollImagesPerPage || 200;
  const totalScrollPages = Math.ceil(currentImages.length / imagesPerScrollPage);
  const currentScrollImages = readerSettings.readingMode === 'vertical'
    ? currentImages.slice(scrollPageIndex * imagesPerScrollPage, (scrollPageIndex + 1) * imagesPerScrollPage)
    : currentImages;

  // Keep currentPage aligned to start of scroll chunk in vertical mode
  useEffect(() => {
    if (readerSettings.readingMode === 'vertical') {
      // ✅ Only set base page if currentPage is outside current chunk (avoid override during mode switch)
      const basePage = scrollPageIndex * imagesPerScrollPage;
      if (currentPage < basePage || currentPage >= basePage + imagesPerScrollPage) {
        setCurrentPage(basePage);
      }
    }
  }, [scrollPageIndex, readerSettings.readingMode, imagesPerScrollPage]);

  // ✅ Track scroll position in vertical mode for accurate mode switching
  useEffect(() => {
    if (readerSettings.readingMode !== 'vertical') return;
    
    const handleScroll = () => {
      scrollPositionRef.current = window.scrollY;
      
      // Calculate current viewing image index based on scroll position
      const images = document.querySelectorAll('.scroll-img');
      if (images.length === 0) return;
      
      let closestIndex = 0;
      let minDistance = Infinity;
      
      // Find image closest to viewport center (not top)
      const viewportCenter = window.innerHeight / 2;
      
      images.forEach((img, idx) => {
        const rect = img.getBoundingClientRect();
        // Calculate distance from image center to viewport center
        const imageCenter = rect.top + (rect.height / 2);
        const distance = Math.abs(imageCenter - viewportCenter);
        
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = scrollPageIndex * imagesPerScrollPage + idx;
        }
      });
      
      lastKnownImageIndexRef.current = closestIndex;
      
    };
    
    // Throttle scroll event for performance
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', onScroll, { passive: true });
    
    // Initial calculation
    handleScroll();
    
    return () => window.removeEventListener('scroll', onScroll);
  }, [readerSettings.readingMode, scrollPageIndex, imagesPerScrollPage]);

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
          isInQueue={checkIfChapterInQueue()}
          isPreparingDownload={showDownloadConfirmModal && !isCheckingStorage}
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
              <div 
                className="zoom-wrapper"
                onTouchMove={handleTouchMoveZoom}
                onDoubleClick={handleDoubleClick}
              >
                {/* ✅ Loading overlay for horizontal mode */}
                {isImageLoading && (
                  <div 
                    role="status" 
                    aria-live="polite"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      zIndex: 100,
                      backdropFilter: 'blur(4px)'
                    }}
                  >
                    <div style={{
                      width: '50px',
                      height: '50px',
                      border: '4px solid rgba(255, 255, 255, 0.3)',
                      borderTop: '4px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                  </div>
                )}
                <img
                  ref={imgRef}
                  src={currentImages[currentPage]}
                  alt={`Page ${currentPage + 1}`}
                  className="reader-image-fullsize"
                  style={{
                    cursor: isZoomed ? 'grab' : 'pointer',
                    transition: isZoomed ? 'none' : 'transform 0.2s ease-out',
                    willChange: 'transform'
                  }}
                  loading={mangaSettings.lazyLoad ? "lazy" : "eager"}
                  onClick={handleImageClick}
                  onLoad={(e) => {
                    e.target.classList.remove('loading');
                    
                    // ✅ Clear loading state when image loads
                    setIsImageLoading(false);
                    if (imageLoadTimeoutRef.current) {
                      clearTimeout(imageLoadTimeoutRef.current);
                      imageLoadTimeoutRef.current = null;
                    }
                    
                    // ✅ Fixed: Use actual loaded image src with optional chaining to avoid race condition
                    const src = e.currentTarget?.currentSrc || e.currentTarget?.src;
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
                    
                    // ✅ Clear loading state on error
                    setIsImageLoading(false);
                    if (imageLoadTimeoutRef.current) {
                      clearTimeout(imageLoadTimeoutRef.current);
                      imageLoadTimeoutRef.current = null;
                    }
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
      
      {/* Download Confirm Modal */}
      <DownloadConfirmModal
        isOpen={showDownloadConfirmModal}
        onClose={() => {
          setShowDownloadConfirmModal(false);
          setIsCheckingStorage(false);
        }}
        onConfirm={handleDownloadConfirm}
        isLoading={isCheckingStorage}
        isAlreadyDownloaded={isChapterOfflineAvailable}
        chapterTitle={getFolderName(currentPath)}
      />
      
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
      
      {/* Queued Modal - Hiển thị khi chapter được thêm vào queue */}
      {showQueuedModal && queuedTaskInfo && (
        <div 
          className="modal-overlay"
          onClick={() => setShowQueuedModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-secondary, #2a2a2a)',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--border-color, #3a3a3a)'
            }}
          >
            {/* Header */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                flexShrink: 0
              }}>
                ⏳
              </div>
              <div>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: '20px',
                  fontWeight: '600',
                  color: 'var(--text-primary, #fff)'
                }}>
                  Đã cho vào hàng chờ
                </h3>
                <p style={{
                  margin: 0,
                  fontSize: '14px',
                  color: 'var(--text-secondary, #aaa)',
                  marginTop: '4px'
                }}>
                  Chapter sẽ được tải sau
                </p>
              </div>
            </div>
            
            {/* Task Info */}
            <div style={{
              background: 'var(--bg-tertiary, #1f1f1f)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px'
            }}>
              <div style={{ 
                fontSize: '14px',
                color: 'var(--text-primary, #fff)',
                fontWeight: '500',
                marginBottom: '6px',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {queuedTaskInfo.mangaTitle}
              </div>
              <div style={{
                fontSize: '13px',
                color: 'var(--text-secondary, #aaa)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>📖 {queuedTaskInfo.chapterTitle}</span>
                <span>•</span>
                <span>{queuedTaskInfo.totalPages} trang</span>
              </div>
            </div>
            
            {/* Actions */}
            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <button
                onClick={() => setShowQueuedModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'var(--bg-tertiary, #3a3a3a)',
                  color: 'var(--text-primary, #fff)',
                  border: '1px solid var(--border-color, #4a4a4a)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-hover, #4a4a4a)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bg-tertiary, #3a3a3a)';
                }}
              >
                Đóng
              </button>
              
              <button
                onClick={() => {
                  setShowQueuedModal(false);
                  navigate('/downloads');
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <span>📋</span>
                <span>Xem Downloads</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MangaReader;
