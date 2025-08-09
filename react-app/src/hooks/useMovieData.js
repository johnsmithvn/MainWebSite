// 📁 src/hooks/useMovieData.js
// 🎬 Custom hooks for movie data (random, recent, top view)

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store';
import { apiService } from '@/utils/api';

/**
 * Hook to get random movies
 */
export const useRandomMovies = (options = {}) => {
  const { sourceKey } = useAuthStore();
  
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    count = 20,
    ...restOptions
  } = options;

  return useQuery({
    queryKey: ['randomMovies', sourceKey],
    queryFn: async () => {
      const params = {
        key: sourceKey,
        mode: 'random',
        limit: count
      };
      const response = await apiService.movie.getVideoCache(params);
      return response.data.folders || [];
    },
    enabled: enabled && !!sourceKey,
    staleTime,
    refetchOnWindowFocus: false,
    ...restOptions
  });
};

/**
 * Hook to get top viewed movies
 */
export const useTopViewMovies = (options = {}) => {
  const { sourceKey } = useAuthStore();
  
  const {
    enabled = true,
    staleTime = 10 * 60 * 1000, // 10 minutes
    count = 20,
    ...restOptions
  } = options;

  return useQuery({
    queryKey: ['topViewMovies', sourceKey],
    queryFn: async () => {
      const params = {
        key: sourceKey,
        mode: 'top',
        limit: count
      };
      const response = await apiService.movie.getVideoCache(params);
      return response.data.folders || [];
    },
    enabled: enabled && !!sourceKey,
    staleTime,
    refetchOnWindowFocus: false,
    ...restOptions
  });
};

/**
 * Hook to get recent viewed movies from localStorage
 */
export const useRecentMovies = (options = {}) => {
  const { sourceKey } = useAuthStore();
  
  const {
    enabled = true,
    maxItems = 20,
    ...restOptions
  } = options;

  return useQuery({
    queryKey: ['recentMovies', sourceKey],
    queryFn: () => {
      if (!sourceKey) return [];
      
      try {
        const cacheKey = `recentViewedVideo::${sourceKey}`;
        const cached = localStorage.getItem(cacheKey);
        if (!cached) return [];
        
        const recentList = JSON.parse(cached);
        return recentList
          .filter(item => item.type === 'video' || item.type === 'file')
          .slice(0, maxItems)
          .map(item => ({
            ...item,
            thumbnail: item.thumbnail || '/default/video-thumb.png'
          }));
      } catch (error) {
        console.warn('Error loading recent movies:', error);
        return [];
      }
    },
    enabled: enabled && !!sourceKey,
    staleTime: 30 * 1000, // 30 seconds (short since it's localStorage)
    refetchOnWindowFocus: true,
    ...restOptions
  });
};

/**
 * Hook to manage adding items to recent cache
 */
export const useRecentMoviesManager = () => {
  const { sourceKey } = useAuthStore();
  const queryClient = useQueryClient();
  
  const addRecentMovie = (item, maxItems = 20) => {
    if (!sourceKey || !item) return;
    
    try {
      const cacheKey = `recentViewedVideo::${sourceKey}`;
      const existing = localStorage.getItem(cacheKey);
      let recentList = existing ? JSON.parse(existing) : [];
      
      // Remove if already exists to avoid duplicates
      recentList = recentList.filter(r => r.path !== item.path);
      
      // Add to beginning
      recentList.unshift({
        ...item,
        timestamp: Date.now(),
        type: item.type || 'video'
      });
      
      // Limit size
      recentList = recentList.slice(0, maxItems);
      
      // Save to localStorage
      localStorage.setItem(cacheKey, JSON.stringify(recentList));
      
      // Invalidate query to refresh UI
      queryClient.invalidateQueries(['recentMovies', sourceKey]);
      
      console.log('✅ Added to recent movies:', item.name);
    } catch (error) {
      console.warn('Error adding to recent movies:', error);
    }
  };

  return { addRecentMovie };
};

export default {
  useRandomMovies,
  useTopViewMovies,
  useRecentMovies,
  useRecentMoviesManager
};
