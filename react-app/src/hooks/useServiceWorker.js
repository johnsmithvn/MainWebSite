/**
 * React Hook for Service Worker Management
 * Provides easy interface to interact with Service Worker
 */

import { useState, useEffect, useCallback } from 'react';
import swManager from '../utils/serviceWorkerManager';

export function useServiceWorker() {
  const [swStatus, setSwStatus] = useState({
    supported: false,
    registered: false,
    controller: false,
    online: navigator.onLine,
    updateAvailable: false,
    ready: false
  });

  const [cacheInfo, setCacheInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Update status from SW manager
  const updateStatus = useCallback(() => {
    const status = swManager.getStatus();
    setSwStatus(prev => ({ ...prev, ...status }));
  }, []);

  // Setup event listeners
  useEffect(() => {
    const handleReady = () => {
      setSwStatus(prev => ({ ...prev, ready: true }));
      updateStatus();
    };

    const handleUpdateAvailable = () => {
      setSwStatus(prev => ({ ...prev, updateAvailable: true }));
    };

    const handleOnline = () => {
      setSwStatus(prev => ({ ...prev, online: true }));
    };

    const handleOffline = () => {
      setSwStatus(prev => ({ ...prev, online: false }));
    };

    const handleActivated = (data) => {
      console.log('✅ SW activated:', data);
      updateStatus();
    };

    const handleBackgroundSync = (data) => {
      console.log('🔄 Background sync triggered:', data);
      // Could trigger download retry logic here
    };

    const handleCacheInfo = (data) => {
      setCacheInfo(data);
    };

    // Register listeners
    swManager.on('ready', handleReady);
    swManager.on('updateAvailable', handleUpdateAvailable);
    swManager.on('online', handleOnline);
    swManager.on('offline', handleOffline);
    swManager.on('activated', handleActivated);
    swManager.on('backgroundSync', handleBackgroundSync);
    swManager.on('cacheInfo', handleCacheInfo);

    // Initial status update
    updateStatus();

    // Cleanup
    return () => {
      swManager.off('ready', handleReady);
      swManager.off('updateAvailable', handleUpdateAvailable);
      swManager.off('online', handleOnline);
      swManager.off('offline', handleOffline);
      swManager.off('activated', handleActivated);
      swManager.off('backgroundSync', handleBackgroundSync);
      swManager.off('cacheInfo', handleCacheInfo);
    };
  }, [updateStatus]);

  // Apply SW update
  const applyUpdate = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await swManager.applyUpdate();
      return result;
    } catch (error) {
      console.error('❌ Failed to apply update:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get cache information
  const getCacheInfo = useCallback(async () => {
    setIsLoading(true);
    try {
      const info = await swManager.getCacheInfo();
      setCacheInfo(info);
      return info;
    } catch (error) {
      console.error('❌ Failed to get cache info:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear specific cache
  const clearCache = useCallback(async (cacheName) => {
    setIsLoading(true);
    try {
      const result = await swManager.clearCache(cacheName);
      
      // Refresh cache info after clearing
      if (result) {
        await getCacheInfo();
      }
      
      return result;
    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [getCacheInfo]);

  // Check offline capability
  const checkOfflineCapability = useCallback(async () => {
    setIsLoading(true);
    try {
      const capability = await swManager.checkOfflineCapability();
      return capability;
    } catch (error) {
      console.error('❌ Failed to check offline capability:', error);
      return { capable: false, reason: 'Check failed', error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register background sync
  const registerBackgroundSync = useCallback(async () => {
    try {
      const result = await swManager.registerBackgroundSync();
      return result;
    } catch (error) {
      console.error('❌ Failed to register background sync:', error);
      return false;
    }
  }, []);

  // Check for updates manually
  const checkForUpdate = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await swManager.checkForUpdate();
      return result;
    } catch (error) {
      console.error('❌ Failed to check for update:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Format cache info for display
  const formatCacheInfo = useCallback((info) => {
    if (!info?.caches) return null;

    const formatted = {
      version: info.version,
      totalCaches: Object.keys(info.caches).length,
      details: []
    };

    Object.entries(info.caches).forEach(([name, data]) => {
      formatted.details.push({
        name,
        count: data.count,
        type: data.type,
        displayName: formatCacheName(name)
      });
    });

    return formatted;
  }, []);

  // Helper to format cache names for display
  const formatCacheName = (name) => {
    if (name.includes('static')) return '📦 App Shell';
    if (name.includes('dynamic')) return '🌐 API Cache';
    if (name.includes('chapter-images')) return '🖼️ Offline Images';
    return `💾 ${name}`;
  };

  return {
    // Status
    ...swStatus,
    isLoading,
    cacheInfo: formatCacheInfo(cacheInfo),
    rawCacheInfo: cacheInfo,

    // Actions
    applyUpdate,
    getCacheInfo,
    clearCache,
    checkOfflineCapability,
    registerBackgroundSync,
    checkForUpdate,

    // Helpers
    formatCacheInfo,
    
    // Direct access to manager
    swManager
  };
}

export default useServiceWorker;
