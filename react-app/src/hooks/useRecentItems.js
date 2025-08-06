// 📁 src/hooks/useRecentItems.js
// 🕒 Custom hook for managing recent viewed items with cache

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore, useMangaStore } from '@/store';

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
  const { mangaSettings, favoritesRefreshTrigger } = useMangaStore(); // Add favoritesRefreshTrigger
  const queryClient = useQueryClient();
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Use maxItems from store settings, fallback to options, then default
  const effectiveMaxItems = mangaSettings.recentHistoryCount || maxItems || 20;

  // Stable query key - use useMemo to prevent re-creation
  const queryKey = useMemo(() => ['recentItems', type, sourceKey, rootFolder], [type, sourceKey, rootFolder]);

  // Generate cache key based on type, sourceKey, and rootFolder
  const getCacheKey = useCallback(() => {
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
        const sortedData = cachedData
          .sort((a, b) => (b.lastViewed || 0) - (a.lastViewed || 0))
          .slice(0, effectiveMaxItems);

        return sortedData;
      }
    } catch (error) {
      console.warn('Error reading recent cache in fetchRecentItems:', error);
    }
    
    return [];
  }, [type, sourceKey, rootFolder, getCacheKey, effectiveMaxItems]);

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
    staleTime: 30 * 1000, // 30 seconds - recent data changes frequently
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true
  });

  // Invalidate cache when favorites change - ONLY run when trigger actually changes  
  useEffect(() => {
    if (favoritesRefreshTrigger > 0) {
      console.log(`🔄 RecentItems: Favorites changed (trigger: ${favoritesRefreshTrigger}), invalidating recent ${type} cache`);
      // Invalidate query to force refetch from localStorage (which should have updated data)
      queryClient.invalidateQueries(queryKey);
    }
  }, [favoritesRefreshTrigger]); // REMOVE queryClient, queryKey, type để tránh loop

  // Load cached data on mount - only run when key values change, not callback functions
  useEffect(() => {
    if (sourceKey && (type !== 'manga' || rootFolder)) {
      try {
        // Generate cache key inline to avoid callback dependency
        let cacheKey;
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
        
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const data = JSON.parse(cached);
          if (data.length > 0) {
            console.log('🔄 Loading cached recent data on mount:', data.length, 'items');
            queryClient.setQueryData(queryKey, data);
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
      // Generate cache key inline
      let cacheKey;
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
