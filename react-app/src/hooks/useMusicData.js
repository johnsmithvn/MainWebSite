// 📁 src/hooks/useMusicData.js
// 🎵 Custom hooks for music data (random, recent, top view)

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store';
import { apiService } from '@/utils/api';
import { getRecentViewedCacheKey } from '@/constants/cacheKeys';
import { processThumbnails } from '@/utils/thumbnailUtils';

/**
 * Hook to get random music
 */
export const useRandomMusic = (options = {}) => {
  const { sourceKey } = useAuthStore();
  
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    count = 20,
    ...restOptions
  } = options;

  return useQuery({
    queryKey: ['randomMusic', sourceKey],
    queryFn: async () => {
      const params = {
        key: sourceKey,
        mode: 'random',
        type: 'file', // Get audio files for random music
        limit: count
      };
      const response = await apiService.music.getAudioCache(params);
      const folders = response.data.folders || [];
      
      // Process thumbnails using the utility function
      return processThumbnails(folders, 'music');
    },
    enabled: enabled && !!sourceKey,
    staleTime,
    refetchOnWindowFocus: false,
    ...restOptions
  });
};

/**
 * Hook to get top view music
 */
export const useTopViewMusic = (options = {}) => {
  const { sourceKey } = useAuthStore();
  
  const {
    enabled = true,
    staleTime = 10 * 60 * 1000, // 10 minutes - top view changes less frequently
    count = 20,
    ...restOptions
  } = options;

  return useQuery({
    queryKey: ['topViewMusic', sourceKey],
    queryFn: async () => {
      const params = {
        key: sourceKey,
        mode: 'top',
        limit: count
      };
      const response = await apiService.music.getAudioCache(params);
      const folders = response.data.folders || [];
      
      // Process thumbnails using the utility function
      return processThumbnails(folders, 'music');
    },
    enabled: enabled && !!sourceKey,
    staleTime,
    refetchOnWindowFocus: false,
    ...restOptions
  });
};

/**
 * Hook to get recent music from localStorage
 */
export const useRecentMusic = (options = {}) => {
  const { sourceKey } = useAuthStore();
  
  const {
    enabled = true,
    maxItems = 20,
    ...restOptions
  } = options;

  return useQuery({
    queryKey: ['recentMusic', sourceKey],
    queryFn: () => {
      if (!sourceKey) return [];
      
      try {
        const cacheKey = getRecentViewedCacheKey('music', sourceKey);
        const cached = localStorage.getItem(cacheKey);
        if (!cached) return [];
        
        const recentList = JSON.parse(cached);
        const filtered = recentList
          .filter(item => item.type === 'audio' || item.type === 'file')
          .slice(0, maxItems);
        
        // Process thumbnails using the utility function
        return processThumbnails(filtered, 'music');
      } catch (error) {
        console.warn('Error loading recent music:', error);
        return [];
      }
    },
    enabled: enabled && !!sourceKey,
    staleTime: 30 * 1000, // 30 seconds (short since it's localStorage)
    refetchOnWindowFocus: false,
    ...restOptions
  });
};

/**
 * Hook to manage recent music list (add items)
 */
export const useRecentMusicManager = () => {
  const { sourceKey } = useAuthStore();
  const queryClient = useQueryClient();

  const addRecentMusic = async (item) => {
    if (!sourceKey || !item) return;

    try {
      const cacheKey = getRecentViewedCacheKey('music', sourceKey);
      const cached = localStorage.getItem(cacheKey);
      const existingItems = cached ? JSON.parse(cached) : [];
      
      // Remove existing item if present
      const filtered = existingItems.filter(existing => existing.path !== item.path);
      
      // Add to beginning
      const newItem = {
        ...item,
        timestamp: Date.now(),
        thumbnail: item.thumbnail || '/default/music-thumb.png'
      };
      
      const updatedItems = [newItem, ...filtered].slice(0, 50); // Keep max 50 items
      
      // Save to localStorage
      localStorage.setItem(cacheKey, JSON.stringify(updatedItems));
      
      // Invalidate query to refresh UI
      queryClient.invalidateQueries(['recentMusic', sourceKey]);
      
      console.log('✅ Added to recent music:', item.name);
    } catch (error) {
      console.warn('Error adding to recent music:', error);
    }
  };

  return { addRecentMusic };
};

export default {
  useRandomMusic,
  useTopViewMusic,
  useRecentMusic,
  useRecentMusicManager
};
