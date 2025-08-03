// 📁 src/hooks/useRandomItems.js
// 🎣 Custom hook for managing random items with cache and refresh

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';
import { useAuthStore } from '@/store';
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
  const queryClient = useQueryClient();
  const [lastUpdated, setLastUpdated] = useState(null);

  // Generate cache key based on type, sourceKey, and rootFolder
  const cacheKey = `randomView::${sourceKey}::${rootFolder}::${type}`;
  const queryKey = ['randomItems', type, sourceKey, rootFolder];

  // Get data from localStorage cache
  const getCachedData = useCallback(() => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        const isExpired = (Date.now() - timestamp) > staleTime;
        
        if (!isExpired) {
          setLastUpdated(new Date(timestamp));
          return data;
        }
      }
    } catch (error) {
      console.warn('Error reading cache:', error);
    }
    return null;
  }, [cacheKey, staleTime]);

  // Save data to localStorage cache
  const setCachedData = useCallback((data) => {
    try {
      const timestamp = Date.now();
      const cacheData = { timestamp, data };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      setLastUpdated(new Date(timestamp));
    } catch (error) {
      console.warn('Error saving cache:', error);
    }
  }, [cacheKey]);

  // Fetch function
  const fetchRandomItems = async () => {
    if (!sourceKey || (!rootFolder && type === 'manga')) {
      throw new Error(`Missing required parameters for ${type}`);
    }

    // Check cache first unless force refresh
    if (!force) {
      const cached = getCachedData();
      if (cached) {
        return cached;
      }
    }

    const endpoint = getEndpoint(type, sourceKey, rootFolder, count);
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
    onError: (error) => {
      console.error(`Error fetching random ${type}:`, error);
      toast.error(`Không thể tải ${type} ngẫu nhiên`);
    }
  });

  // Force refresh function
  const refresh = useCallback(async () => {
    try {
      // Clear cache
      localStorage.removeItem(cacheKey);
      queryClient.removeQueries(queryKey);
      
      // Refetch with force flag
      await refetch();
      toast.success(`Đã làm mới ${type} ngẫu nhiên`);
    } catch (error) {
      console.error('Error refreshing:', error);
      toast.error(`Không thể làm mới ${type}`);
    }
  }, [cacheKey, queryKey, queryClient, refetch, type]);

  // Load cached data on mount
  useEffect(() => {
    if (!data) {
      const cached = getCachedData();
      if (cached) {
        queryClient.setQueryData(queryKey, cached);
      }
    }
  }, [data, getCachedData, queryClient, queryKey]);

  return {
    data: data || [],
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
      return `/api/movie/video-cache?mode=random&key=${encodeURIComponent(sourceKey)}&${baseParams}`;
    
    case 'music':
      return `/api/music/audio-cache?mode=random&key=${encodeURIComponent(sourceKey)}&${baseParams}`;
    
    default:
      throw new Error(`Unknown content type: ${type}`);
  }
};

export default useRandomItems;
