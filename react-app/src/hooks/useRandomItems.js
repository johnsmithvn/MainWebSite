// 📁 src/hooks/useRandomItems.js
// 🎣 Custom hook for managing random items with cache and refresh

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';
import { useAuthStore, useMangaStore, useMovieStore, useMusicStore } from '@/store';
import { processThumbnails } from '@/utils/thumbnailUtils';
import { getRandomViewCacheKey } from '@/constants/cacheKeys';
import toast from 'react-hot-toast';

/**
 * Hook để quản lý random items với cache và refresh logic
 * @param {string} type - Type of content: 'manga', 'movie', 'music'
 * @param {Object} options - Configuration options
 * @returns {Object} - { data, loading, error, refresh, lastUpdated }
 */
export const useRandomItems = (type, options = {}) => {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
    count = 20,
    force = false
  } = options;

  const { sourceKey, rootFolder } = useAuthStore();
  const { favoritesRefreshTrigger } = useMangaStore();
  const mangaStore = useMangaStore();
  const movieStore = useMovieStore();
  const musicStore = useMusicStore();
  const queryClient = useQueryClient();
  const [lastUpdated, setLastUpdated] = useState(null);

  // For manga, require a selected rootFolder; movie/music don't need it
  useEffect(() => {
    if (type === 'manga' && sourceKey && !rootFolder) {
      console.log('ℹ️ Manga random requires a selected rootFolder; waiting for selection...');
    }
  }, [type, sourceKey, rootFolder]);

  // Clear cache and invalidate query when sourceKey changes
  useEffect(() => {
    const prevSourceKey = queryClient.getQueryData(['prevSourceKey']);
    if (prevSourceKey && prevSourceKey !== sourceKey) {
      console.log('🔄 SourceKey changed from', prevSourceKey, 'to', sourceKey, '- Clearing random cache');
      
      // Clear localStorage caches for the old sourceKey
      const oldCachePattern = `randomView::${prevSourceKey}::`;
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(oldCachePattern)) {
          localStorage.removeItem(key);
          console.log('🗑️ Removed old cache:', key);
        }
      });
      
      // Invalidate React Query cache
      queryClient.removeQueries(['randomItems']);
      setLastUpdated(null);
    }
    
    // Store current sourceKey for next comparison
    if (sourceKey) {
      queryClient.setQueryData(['prevSourceKey'], sourceKey);
    }
  }, [sourceKey, queryClient]);

  // Generate cache key based on type, sourceKey, and rootFolder (only for manga)
  const cacheKey = getRandomViewCacheKey(type, sourceKey, type === 'manga' ? rootFolder : null);
  const queryKey = ['randomItems', type, sourceKey, type === 'manga' ? rootFolder : null];

  // Invalidate cache when favorites change - listen to all store triggers
  useEffect(() => {
    // Get triggers from appropriate store
    const triggers = {
      manga: favoritesRefreshTrigger,
      movie: movieStore.favoritesRefreshTrigger || 0,
      music: 0 // Music doesn't have favorites
    };
    
    const currentTrigger = triggers[type] || 0;
    
    if (currentTrigger > 0) {
      console.log(`🔄 RandomItems: Favorites changed (trigger: ${currentTrigger}), invalidating random ${type} cache`);
      // Invalidate query to force refetch and merge favorite state
      queryClient.invalidateQueries({ queryKey, exact: true });
    }
  }, [favoritesRefreshTrigger, movieStore.favoritesRefreshTrigger, type, queryClient, queryKey]);

  // Check for existing cache timestamp on mount only - run once per unique cache key
  useEffect(() => {
    // Only check for cache if we have required keys
    const hasRequiredKeys = sourceKey && (type !== 'manga' || rootFolder);
    
    if (hasRequiredKeys) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { timestamp } = JSON.parse(cached);
          if (timestamp && !lastUpdated) {
            setLastUpdated(new Date(timestamp));
            console.log('⏰ Restored timestamp from cache on mount:', new Date(timestamp));
          }
        }
      } catch (error) {
        console.warn('Error checking cache timestamp:', error);
      }
    }
  }, [cacheKey]); // Only depend on cacheKey to prevent multiple runs

  // Get data from localStorage cache
  const getCachedData = useCallback(() => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        const isExpired = (Date.now() - timestamp) > staleTime;
        
        console.log('🗂️ Cache check:', { cacheKey, hasData: !!data, isExpired, timestamp: new Date(timestamp) });
        
        if (!isExpired && data) {
          // Process thumbnails first
          let processedData = processThumbnails(data, type);
          
          // Merge with current favorite state from stores
          if (type === 'music') {
            // Music doesn't have favorites
            const mergedData = processedData.map(item => ({ ...item, isFavorite: false }));
            console.log('🔄 RandomItems: Set music items as non-favorite from cache');
            return mergedData;
          } else {
            const favoriteStore = type === 'manga' ? mangaStore : 
                                 type === 'movie' ? movieStore : null;
            
            if (favoriteStore && favoriteStore.favorites && Array.isArray(processedData)) {
              const mergedData = processedData.map(item => {
                const isFavorited = favoriteStore.favorites.some(f => f.path === item.path);
                return { ...item, isFavorite: isFavorited };
              });
              console.log('🔄 RandomItems: Merged favorite state from cache');
              return mergedData;
            }
          }
          
          return processedData;
        }
      }
    } catch (error) {
      console.warn('Error reading cache:', error);
    }
    return null;
  }, [cacheKey, staleTime, type, mangaStore, movieStore, musicStore]);

  // Save data to localStorage cache
  const setCachedData = useCallback((data) => {
    try {
      const timestamp = Date.now();
      const cacheData = { timestamp, data };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      setLastUpdated(new Date(timestamp));
      console.log('💾 Cache saved:', { cacheKey, itemCount: data.length, timestamp: new Date(timestamp) });
    } catch (error) {
      console.warn('Error saving cache:', error);
    }
  }, [cacheKey]);

  // Fetch function
  const fetchRandomItems = async () => {
    if (!sourceKey) {
      throw new Error('Missing source key');
    }

    // Chỉ manga mới cần rootFolder
    if (type === 'manga' && !rootFolder) {
      throw new Error('Missing root folder for manga');
    }

    console.log('🔍 fetchRandomItems:', { sourceKey, rootFolder, type, cacheKey });

    // Check cache first unless force refresh
    if (!force) {
      const cached = getCachedData();
      if (cached) {
        console.log('📦 Using cached random data:', cached.length, 'items');
        return cached;
      }
      // If no cache found, log that we're fetching fresh data
      console.log('🆕 No cache found, fetching fresh data from API');
    } else {
      console.log('🔄 Force refresh - skipping cache check');
    }

    const endpoint = getEndpoint(type, sourceKey, rootFolder, count);
    console.log('🌐 Fetching from endpoint:', endpoint);
    const response = await api.get(endpoint);
    
    // Handle different response formats
    let items = null;
    
    // Check for standard success format first
    if (response.data?.success && response.data?.data) {
      items = response.data.data;
    }
    // Check for direct array response (manga API format)
    else if (Array.isArray(response.data)) {
      items = response.data;
    }
    // Check for folders property (alternative format)
    else if (response.data?.folders && Array.isArray(response.data.folders)) {
      items = response.data.folders;
    }
    
    if (items && Array.isArray(items)) {
      console.log('✅ Random items fetched:', items.length, 'items');
      console.log('📊 Sample item:', items[0]);
      
      // Process thumbnails first based on content type
      items = processThumbnails(items, type);
      
      // Merge with current favorite state from stores
      // Music doesn't have favorites system
      if (type === 'music') {
        items = items.map(item => ({ ...item, isFavorite: false }));
        console.log('🔄 RandomItems: Set music items as non-favorite');
      } else {
        const favoriteStore = type === 'manga' ? mangaStore : 
                             type === 'movie' ? movieStore : null;
        
        if (favoriteStore && favoriteStore.favorites) {
          items = items.map(item => {
            const isFavorited = favoriteStore.favorites.some(f => f.path === item.path);
            return { ...item, isFavorite: isFavorited };
          });
          console.log('🔄 RandomItems: Merged favorite state from store');
        }
      }
      
      setCachedData(items);
      return items;
    }

    throw new Error(response.data?.message || `Failed to fetch ${type} items`);
  };

  // React Query configuration
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: fetchRandomItems,
    enabled: enabled && !!sourceKey && (type !== 'manga' || !!rootFolder),
    staleTime,
    cacheTime,
    retry: 1,
    refetchOnMount: true, // Always check on mount
    refetchOnWindowFocus: false, // Don't refetch on window focus
    onError: (error) => {
      console.error(`Error fetching random ${type}:`, error);
      toast.error(`Không thể tải ${type} ngẫu nhiên`);
    },
    onSuccess: (data) => {
      // Ensure lastUpdated is set when data is successfully fetched
      if (data && data.length > 0) {
        // If we don't have a timestamp yet, set it now
        if (!lastUpdated) {
          setLastUpdated(new Date());
          console.log('⏰ Set timestamp on data success:', new Date());
        }
      }
    }
  });

  // Force refresh function
  const refresh = useCallback(async () => {
    try {
      // Clear cache
      localStorage.removeItem(cacheKey);
      queryClient.removeQueries(queryKey);
      
      // Update timestamp immediately
      const now = new Date();
      setLastUpdated(now);
      
      // Refetch with force flag
      await refetch();
      toast.success(`Đã làm mới ${type} ngẫu nhiên`);
    } catch (error) {
      console.error('Error refreshing:', error);
      toast.error(`Không thể làm mới ${type}`);
    }
  }, [cacheKey, queryKey, queryClient, refetch, type]);

  // Load cached data on mount only - run once per unique cache key
  useEffect(() => {
    // Only run once when component mounts and we have the required keys
    // For manga: need both sourceKey and rootFolder
    // For movie/music: only need sourceKey
    const hasRequiredKeys = sourceKey && (type !== 'manga' || rootFolder);
    
    if (hasRequiredKeys) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { timestamp, data } = JSON.parse(cached);
          const isExpired = (Date.now() - timestamp) > staleTime;
          
          if (!isExpired && data && data.length > 0) {
            console.log('🔄 Loading cached data on mount:', data.length, 'items');
            // Process thumbnails before setting in query cache
            const processedData = processThumbnails(data, type);
            queryClient.setQueryData(queryKey, processedData);
            // Only set timestamp if we don't have one yet
            if (!lastUpdated) {
              setLastUpdated(new Date(timestamp));
            }
          } else {
            console.log('⚠️ Cache expired or empty, will fetch fresh data');
            // Clear expired cache
            if (isExpired) {
              localStorage.removeItem(cacheKey);
            }
          }
        } else {
          console.log('📭 No cache found, will fetch fresh data');
        }
      } catch (error) {
        console.warn('Error loading cached data on mount:', error);
      }
    }
  }, [cacheKey]); // Only depend on cacheKey to prevent multiple executions

  return {
    data: mergeWithFavoriteState(data || [], type, mangaStore, movieStore, musicStore),
    loading: isLoading,
    error,
    refresh,
    lastUpdated
  };
};

/**
 * Get API endpoint based on content type
 */
const getEndpoint = (type, sourceKey, rootFolder, count) => {
  const baseParams = `limit=${count}&random=1`;
  
  switch (type) {
    case 'manga':
      return `/api/manga/folder-cache?mode=random&key=${encodeURIComponent(sourceKey)}&root=${encodeURIComponent(rootFolder)}&${baseParams}`;
    
    case 'movie':
      // Movie không cần rootFolder, chỉ cần sourceKey
      return `/api/movie/video-cache?mode=random&type=file&key=${encodeURIComponent(sourceKey)}&${baseParams}`;
    
    case 'music':
      // Music cũng không cần rootFolder
      return `/api/music/audio-cache?mode=random&type=file&key=${encodeURIComponent(sourceKey)}&${baseParams}`;
    
    default:
      throw new Error(`Unknown content type: ${type}`);
  }
};

/**
 * Merge favorite state from stores with data
 */
const mergeWithFavoriteState = (data, type, mangaStore, movieStore, musicStore) => {
  if (!Array.isArray(data) || data.length === 0) {
    return data;
  }
  
  // Music doesn't have favorites system
  if (type === 'music') {
    return data.map(item => ({ ...item, isFavorite: false }));
  }
  
  // Get the appropriate store based on type
  const favoriteStore = type === 'manga' ? mangaStore : 
                       type === 'movie' ? movieStore : null;
  
  if (favoriteStore && favoriteStore.favorites) {
    return data.map(item => {
      const isFavorited = favoriteStore.favorites.some(f => f.path === item.path);
      return { ...item, isFavorite: isFavorited };
    });
  }
  
  return data;
};

export default useRandomItems;
