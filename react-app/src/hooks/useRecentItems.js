// 📁 src/hooks/useRecentItems.js
// 🕒 Custom hook for managing recent viewed items with cache

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore, useMangaStore, useMovieStore, useMusicStore } from '@/store';
import { processThumbnails } from '@/utils/thumbnailUtils';
import { getRecentViewedCacheKey } from '@/constants/cacheKeys';
import { AUTO_REFRESH } from '@/constants';

/**
 * Hook để quản lý recent viewed items với localStorage cache
 * @param {string} type - Type of content: 'manga', 'movie', 'music'
 * @param {Object} options - Configuration options
 * @returns {Object} - { data, loading, error, refresh, lastUpdated }
 */
export const useRecentItems = (type, options = {}) => {
  const {
    enabled = true,
    maxItems // Will be overridden by store setting
  } = options;

  const { sourceKey, rootFolder } = useAuthStore();
  const { mangaSettings, favoritesRefreshTrigger } = useMangaStore(); 
  const movieStore = useMovieStore();
  const musicStore = useMusicStore();
  const queryClient = useQueryClient();
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Use maxItems from store settings, fallback to options, then default
  const effectiveMaxItems = mangaSettings.recentHistoryCount || maxItems || 20;

  // Stable query key - use useMemo to prevent re-creation
  const queryKey = useMemo(() => ['recentItems', type, sourceKey, rootFolder], [type, sourceKey, rootFolder]);

  // Clear cache when sourceKey changes
  useEffect(() => {
    const prevSourceKey = queryClient.getQueryData(['prevRecentSourceKey']);
    if (prevSourceKey && prevSourceKey !== sourceKey) {
      console.log('🔄 Recent: SourceKey changed from', prevSourceKey, 'to', sourceKey, '- Clearing cache');
      queryClient.removeQueries(['recentItems']);
      setLastUpdated(null);
    }
    
    if (sourceKey) {
      queryClient.setQueryData(['prevRecentSourceKey'], sourceKey);
    }
  }, [sourceKey, queryClient]);

  // Generate cache key based on type, sourceKey, and rootFolder
  const getCacheKey = useCallback(() => {
    try {
      return getRecentViewedCacheKey(type, sourceKey, type === 'manga' ? rootFolder : null);
    } catch (error) {
      console.warn('Error generating cache key:', error);
      // Fallback to old pattern for compatibility
      switch (type) {
        case 'manga':
          return `recentViewed::${rootFolder}::${rootFolder}`;
        case 'movie':
          return `recentViewedVideo::${sourceKey}`;
        case 'music':
          return `recentViewedMusic::${sourceKey}`;
        default:
          return `recentViewed::${type}::${sourceKey}`;
      }
    }
  }, [type, sourceKey, rootFolder]);

  // Fetch function (just return cached data for recent items)
  const fetchRecentItems = useCallback(async () => {
    console.log('🔍 fetchRecentItems:', { type, sourceKey, rootFolder });

    // Recent items only come from cache
    try {
      const cacheKey = getCacheKey();
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const cachedData = JSON.parse(cached);
        
        // Sort by most recent first and limit items
        let sortedData = cachedData
          .sort((a, b) => (b.lastViewed || 0) - (a.lastViewed || 0))
          .slice(0, effectiveMaxItems);

        // Process thumbnails first
        sortedData = processThumbnails(sortedData, type);

        // Merge with current favorite state from stores
        const favoriteStore = type === 'manga' ? useMangaStore.getState() : 
                             type === 'movie' ? movieStore : 
                             type === 'music' ? musicStore : null;
        
        if (favoriteStore) {
          sortedData = sortedData.map(item => {
            const isFavorited = favoriteStore.favorites.some(f => f.path === item.path);
            return { ...item, isFavorite: isFavorited };
          });
        }

        return sortedData;
      }
    } catch (error) {
      console.warn('Error reading recent cache in fetchRecentItems:', error);
    }
    
    return [];
  }, [type, sourceKey, rootFolder, getCacheKey, effectiveMaxItems, movieStore, musicStore]);

  // React Query configuration
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: fetchRecentItems,
    enabled: enabled && !!sourceKey && (type !== 'manga' || !!rootFolder) && mangaSettings.enableRecentTracking,
    staleTime: AUTO_REFRESH.RECENT_ITEMS,      // ⏱️ 10 phút - Recent data cache
    cacheTime: AUTO_REFRESH.RECENT_ITEMS * 2,  // 💾 20 phút - Memory cache (2x)
    refetchOnWindowFocus: false,
    refetchOnMount: true
  });

  // Invalidate cache when favorites change - listen to all store triggers
  useEffect(() => {
    // Get triggers from appropriate store
    const triggers = {
      manga: favoritesRefreshTrigger,
      movie: movieStore.favoritesRefreshTrigger || 0,
      music: musicStore.favoritesRefreshTrigger || 0
    };
    
    const currentTrigger = triggers[type] || 0;
    
    if (currentTrigger > 0) {
      console.log(`🔄 RecentItems: Favorites changed (trigger: ${currentTrigger}), invalidating recent ${type} cache`);
      // Invalidate query to force refetch from localStorage (which should have updated data)
      queryClient.invalidateQueries(queryKey);
    }
  }, [favoritesRefreshTrigger, movieStore.favoritesRefreshTrigger, musicStore.favoritesRefreshTrigger, type, queryClient, queryKey]); // Add all triggers

  // Load cached data on mount - only run when key values change, not callback functions
  useEffect(() => {
    if (sourceKey && (type !== 'manga' || rootFolder)) {
      try {
        // Use cache key utility with fallback
        let cacheKey;
        try {
          cacheKey = getRecentViewedCacheKey(type, sourceKey, type === 'manga' ? rootFolder : null);
        } catch (error) {
          // Fallback to old pattern for compatibility
          switch (type) {
            case 'manga':
              cacheKey = `recentViewed::${rootFolder}::${rootFolder}`;
              break;
            case 'movie':
              cacheKey = `recentViewedVideo::${sourceKey}`;
              break;
            case 'music':
              cacheKey = `recentViewedMusic::${sourceKey}`;
              break;
            default:
              cacheKey = `recentViewed::${type}::${sourceKey}`;
          }
        }
        
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const data = JSON.parse(cached);
          if (data.length > 0) {
            console.log('🔄 Loading cached recent data on mount:', data.length, 'items');
            // Process thumbnails before setting in query cache
            const processedData = processThumbnails(data, type);
            queryClient.setQueryData(queryKey, processedData);
            setLastUpdated(new Date());
          }
        }
      } catch (error) {
        console.warn('Error loading recent cache on mount:', error);
      }
    }
  }, [sourceKey, rootFolder, type, queryClient, queryKey]);

  // Force refresh function
  const refresh = useCallback(async () => {
    try {
      setLastUpdated(new Date());
      await refetch();
    } catch (error) {
      console.error('Error refreshing recent items:', error);
    }
  }, [refetch]);

  // Add item to recent list
  const addRecentItem = useCallback((item) => {
    try {
      // Use cache key utility with fallback
      let cacheKey;
      try {
        cacheKey = getRecentViewedCacheKey(type, sourceKey, type === 'manga' ? rootFolder : null);
      } catch (error) {
        // Fallback to old pattern for compatibility
        switch (type) {
          case 'manga':
            cacheKey = `recentViewed::${rootFolder}::${rootFolder}`;
            break;
          case 'movie':
            cacheKey = `recentViewedVideo::${sourceKey}`;
            break;
          case 'music':
            cacheKey = `recentViewedMusic::${sourceKey}`;
            break;
          default:
            cacheKey = `recentViewed::${type}::${sourceKey}`;
        }
      }
      
      // Get cached data inline
      const cached = localStorage.getItem(cacheKey);
      const existingData = cached ? JSON.parse(cached) : [];
      const now = Date.now();
      
      // Remove existing item if present
      const filtered = existingData.filter(f => f.path !== item.path);
      
      // Add new item at the beginning with timestamp
      const updated = [
        { ...item, lastViewed: now },
        ...filtered
      ].slice(0, effectiveMaxItems); // Keep only effectiveMaxItems

      // Save to cache inline
      localStorage.setItem(cacheKey, JSON.stringify(updated));
      setLastUpdated(new Date());
      queryClient.setQueryData(queryKey, updated);
      
      console.log('➕ Added to recent:', item.name);
    } catch (error) {
      console.warn('Error adding recent item:', error);
    }
  }, [type, sourceKey, rootFolder, effectiveMaxItems, queryClient, queryKey]);

  return {
    data: data || [],
    loading: isLoading,
    error,
    refresh,
    lastUpdated,
    addRecentItem
  };
};

export default useRecentItems;
