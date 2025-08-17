// 📁 src/hooks/useRecentManager.js
// 🕒 Hook to manage adding items to recent cache

import { useCallback } from 'react';
import { useAuthStore, useMangaStore } from '@/store';
import { buildThumbnailUrl } from '@/utils/thumbnailUtils';
import { getRecentViewedCacheKey } from '@/constants/cacheKeys';

/**
 * Hook để quản lý thêm items vào recent cache
 * @param {string} type - Type of content: 'manga', 'movie', 'music'
 */
export const useRecentManager = (type = 'manga') => {
  const { sourceKey, rootFolder } = useAuthStore();
  const { mangaSettings } = useMangaStore();
  
  // Use maxItems from store settings
  const maxItems = mangaSettings.recentHistoryCount || 20;

  // Get cache key based on type
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

  // Add item to recent list
  const addRecentItem = useCallback((item) => {
    try {
      if (!sourceKey || (type === 'manga' && !rootFolder)) {
        console.warn('Missing sourceKey or rootFolder for recent item');
        return;
      }
      
      // Check if recent tracking is enabled
      if (!mangaSettings.enableRecentTracking) {
        console.log('Recent tracking is disabled');
        return;
      }

      const cacheKey = getCacheKey();
      const cached = localStorage.getItem(cacheKey);
      const existingItems = cached ? JSON.parse(cached) : [];
      const now = Date.now();
      
      // Remove existing item if present
      const filtered = existingItems.filter(f => f.path !== item.path);
      
      // Build proper thumbnail URL before saving
      const builtThumbnailUrl = buildThumbnailUrl(item, type, sourceKey);
      
      // Add new item at the beginning with timestamp
      const updated = [
        { 
          ...item, 
          lastViewed: now,
          // Ensure we have necessary fields
          name: item.name || 'Unknown',
          path: item.path,
          thumbnail: builtThumbnailUrl, // Use the properly built thumbnail URL
          isFavorite: item.isFavorite || false
        },
        ...filtered
      ].slice(0, maxItems); // Keep only maxItems from settings

      localStorage.setItem(cacheKey, JSON.stringify(updated));
      
      console.log('➕ Added to recent cache:', {
        type,
        name: item.name,
        cacheKey,
        totalItems: updated.length
      });
    } catch (error) {
      console.warn('Error adding recent item:', error);
    }
  }, [sourceKey, rootFolder, getCacheKey, type, maxItems, mangaSettings.enableRecentTracking]);

  return {
    addRecentItem
  };
};

export default useRecentManager;
