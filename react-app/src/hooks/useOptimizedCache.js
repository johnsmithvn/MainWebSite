// 📁 src/hooks/useOptimizedCache.js
// 🚀 Hook for optimized cache management

import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { shouldSkipCache, smartCacheManagement } from '@/utils/cacheOptimizer';

/**
 * 🚀 Hook to manage cache optimization based on current page
 */
export const useOptimizedCache = () => {
  const location = useLocation();
  
  // Check if current page should skip cache
  const checkCacheSkip = useCallback((endpoint) => {
    return shouldSkipCache(location.pathname, endpoint);
  }, [location.pathname]);
  
  // Run smart cache management when location changes
  useEffect(() => {
    smartCacheManagement();
  }, [location.pathname]);
  
  return {
    shouldSkipCache: checkCacheSkip,
    currentPath: location.pathname
  };
};

/**
 * 🚫 Hook for pages that should never cache
 */
export const useNoCache = () => {
  const { shouldSkipCache } = useOptimizedCache();
  
  // Always return true for no-cache pages
  const isNoCachePage = useCallback((endpoint) => {
    const result = shouldSkipCache(endpoint);
    return result.skip;
  }, [shouldSkipCache]);
  
  return {
    isNoCachePage,
    skipCache: true
  };
};

export default useOptimizedCache;