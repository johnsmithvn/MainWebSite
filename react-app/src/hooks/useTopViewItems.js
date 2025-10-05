// 📁 src/hooks/useTopViewItems.js
// 🎯 Hook để lấy danh sách manga/movie/music có lượt xem cao nhất

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore, useMangaStore, useMovieStore, useMusicStore } from '@/store';
import { apiService } from '@/utils/api';
import { processThumbnails } from '@/utils/thumbnailProcessor';
import { useEffect } from 'react';

export const useTopViewItems = (type = 'manga', options = {}) => {
  const { sourceKey, rootFolder } = useAuthStore();
  const { favoritesRefreshTrigger } = useMangaStore();
  const mangaStore = useMangaStore();
  const movieStore = useMovieStore();
  const musicStore = useMusicStore();
  const queryClient = useQueryClient();
  
  const {
    enabled = true,
    staleTime = 10 * 60 * 1000, // 10 minutes - top view ít thay đổi
    ...restOptions
  } = options;

  // Clear cache when sourceKey changes
  useEffect(() => {
    const prevSourceKey = queryClient.getQueryData(['prevTopViewSourceKey']);
    if (prevSourceKey && prevSourceKey !== sourceKey) {
      console.log('🔄 TopView: SourceKey changed from', prevSourceKey, 'to', sourceKey, '- Clearing cache');
      queryClient.removeQueries(['topViewItems']);
    }
    
    if (sourceKey) {
      queryClient.setQueryData(['prevTopViewSourceKey'], sourceKey);
    }
  }, [sourceKey, queryClient]);

  // Invalidate cache when favorites change - listen to all store triggers
  useEffect(() => {
    // Get triggers from appropriate store
    const triggers = {
      manga: favoritesRefreshTrigger,
      movie: movieStore.favoritesRefreshTrigger || 0,
      music: 0
    };
    
    const currentTrigger = triggers[type] || 0;
    
    if (currentTrigger > 0) {
      console.log(`🔄 TopViewItems: Favorites changed (trigger: ${currentTrigger}), invalidating top ${type} cache`);
      // Invalidate query to force refetch and merge favorite state
      queryClient.invalidateQueries(['topViewItems', type, sourceKey, type === 'manga' ? rootFolder : null]);
    }
  }, [favoritesRefreshTrigger, movieStore.favoritesRefreshTrigger, type, queryClient, sourceKey, rootFolder]);

  return useQuery({
    queryKey: ['topViewItems', type, sourceKey, type === 'manga' ? rootFolder : null],
    queryFn: async () => {
      if (!sourceKey) {
        throw new Error('No source key available');
      }

      // Only manga requires rootFolder
      if (type === 'manga' && !rootFolder) {
        throw new Error('No root folder available for manga');
      }
      
      let response;
      switch (type) {
        case 'manga': {
          response = await apiService.manga.getFolders({
            key: sourceKey,
            mode: 'top',
            root: rootFolder
          });
          break;
        }
        case 'movie': {
          // Movie không cần rootFolder
          response = await apiService.movie.getVideoCache({
            key: sourceKey,
            mode: 'top'
          });
          break;
        }
        case 'music': {
          // Music không cần rootFolder
          response = await apiService.music.getAudioCache({
            key: sourceKey,
            mode: 'top'
          });
          break;
        }
        default:
          throw new Error(`Unsupported type: ${type}`);
      }

      // Handle different response formats
      let data = response.data;
      
      // Backend might return direct array or wrapped in success/data
      let items = [];
      if (Array.isArray(data)) {
        items = data;
      } else if (data && Array.isArray(data.folders)) {
        items = data.folders;
      } else if (data && data.success && Array.isArray(data.data)) {
        items = data.data;
      }
      
      // Process thumbnails first based on content type
      items = processThumbnails(items, type);
      
      // Merge with current favorite state from stores
      const favoriteStore = type === 'manga' ? mangaStore : 
                           type === 'movie' ? movieStore : null;
      
      if (favoriteStore && Array.isArray(items)) {
        items = items.map(item => {
          const isFavorited = favoriteStore.favorites.some(f => f.path === item.path);
          return { ...item, isFavorite: isFavorited };
        });
        console.log('🔄 TopViewItems: Merged favorite state from store');
      }
      
      return items;
    },
    enabled: enabled && !!sourceKey && (type === 'manga' ? !!rootFolder : true),
    staleTime,
    refetchOnWindowFocus: false,
    ...restOptions
  });
};


