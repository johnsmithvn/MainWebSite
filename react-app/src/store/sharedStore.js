// 📁 src/store/sharedStore.js
// 🔗 Shared settings store for common features across all content types

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { clearAllCache as clearAllCacheKeys, getRecentViewedCacheKey, CACHE_PREFIXES } from '@/constants/cacheKeys';

/**
 * Shared Settings Store
 * Manages common features like cache clearing and recent history
 * Used by Manga, Movie, and Music stores
 */
export const useSharedSettingsStore = create(
  persist(
    (set, get) => ({
      // Common cache management
      clearAllCache: () => {
        try {
          // Use centralized cache clearing utility
          const clearedCount = clearAllCacheKeys();
          console.log(`🗑️ Cleared all cache: ${clearedCount} keys`);
        } catch (error) {
          console.warn('Error clearing all cache:', error);
        }
      },
      
      // Clear recent history for any type
      clearRecentHistory: (type, sourceKey, rootFolder) => {
        try {
          let cacheKey;
          try {
            cacheKey = getRecentViewedCacheKey(type, sourceKey, type === 'manga' ? rootFolder : null);
          } catch (error) {
            // Fallback to old pattern for compatibility
            switch (type) {
              case 'manga':
                cacheKey = `${CACHE_PREFIXES.RECENT_VIEWED_MANGA}::${rootFolder}::${rootFolder}`;
                break;
              case 'movie':
                cacheKey = `${CACHE_PREFIXES.RECENT_VIEWED_VIDEO}::${sourceKey}`;
                break;
              case 'music':
                cacheKey = `${CACHE_PREFIXES.RECENT_VIEWED_MUSIC}::${sourceKey}`;
                break;
              default:
                cacheKey = `${CACHE_PREFIXES.RECENT_VIEWED_MANGA}::${type}::${sourceKey}`;
            }
          }
          
          localStorage.removeItem(cacheKey);
          console.log('🗑️ Cleared recent history:', { type, cacheKey });
        } catch (error) {
          console.warn('Error clearing recent history:', error);
        }
      },
    }),
    {
      name: 'shared-settings-storage',
      partialize: (state) => ({}), // Don't persist anything for now
    }
  )
);
