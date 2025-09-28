// 📁 src/utils/randomCache.js
// 🔄 Utilities to ensure random cache exists before rendering sections

import api from './api';
import { getRandomViewCacheKey } from '@/constants/cacheKeys';

// Build the same cache key used by useRandomItems
export const getRandomCacheKey = (type, sourceKey, rootFolder) => {
  return getRandomViewCacheKey(type, sourceKey, type === 'manga' ? rootFolder : null);
};

// Build endpoint consistent with useRandomItems
const getEndpoint = (type, sourceKey, rootFolder, count = 20) => {
  const baseParams = `limit=${count}&random=1`;
  switch (type) {
    case 'manga':
      return `/api/manga/folder-cache?mode=random&key=${encodeURIComponent(sourceKey)}&root=${encodeURIComponent(rootFolder)}&${baseParams}`;
    case 'movie':
      return `/api/movie/video-cache?mode=random&type=file&key=${encodeURIComponent(sourceKey)}&${baseParams}`;
    case 'music':
      return `/api/music/audio-cache?mode=random&type=file&key=${encodeURIComponent(sourceKey)}&${baseParams}`;
    default:
      throw new Error(`Unknown content type: ${type}`);
  }
};

// 🚫 OPTIMIZED: Skip random cache for unnecessary pages
export const ensureRandomCache = async (type, sourceKey, rootFolder, count = 20, staleTime = 5 * 60 * 1000) => {
  // 🚫 Skip random cache for favorite pages and offline library
  const currentPath = window.location.pathname;
  const skipCachePaths = [
    '/manga/favorites',
    '/movie/favorites', 
    '/music/favorites',
    '/offline/manga-library',
    '/offline/movie-library',
    '/offline/music-library'
  ];
  
  if (skipCachePaths.some(path => currentPath.includes(path))) {
    console.log('🚫 Skipping random cache for unnecessary page:', currentPath);
    return false;
  }

  if (!sourceKey) return false;
  if (type === 'manga' && !rootFolder) return false;

  const cacheKey = getRandomCacheKey(type, sourceKey, rootFolder);

  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const hasData = Array.isArray(data) && data.length > 0;
      const isExpired = !timestamp || (Date.now() - timestamp) > staleTime;

      // If cache exists and not expired -> skip API call
      if (hasData && !isExpired) {
        return true;
      }

      // If expired, fall through to refresh via API below
    }
  } catch (e) {
    // Ignore cache parse errors
  }

  // No cache or expired -> fetch fresh data and seed
  try {
    const endpoint = getEndpoint(type, sourceKey, rootFolder, count);
    const response = await api.get(endpoint);

    let items = null;
    if (response.data?.success && response.data?.data) {
      items = response.data.data;
    } else if (Array.isArray(response.data)) {
      items = response.data;
    } else if (response.data?.folders && Array.isArray(response.data.folders)) {
      items = response.data.folders;
    }

    if (Array.isArray(items) && items.length > 0) {
      const payload = { timestamp: Date.now(), data: items };
      localStorage.setItem(cacheKey, JSON.stringify(payload));
      return true;
    }
  } catch (err) {
    console.warn(`ensureRandomCache: failed to fetch ${type} random items`, err);
  }

  return false;
};
