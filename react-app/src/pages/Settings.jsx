// 📁 src/pages/Settings.jsx
// ⚙️ Trang cài đặt ứng dụng

import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, Moon, Sun, Monitor, Globe, 
  Palette, Volume2, Eye, Database, Download, Upload,
  Shield, User, Bell, Trash2, RotateCcw, Save
} from 'lucide-react';
import { useUIStore, useAuthStore, useMangaStore, useMovieStore, useMusicStore, useSharedSettingsStore } from '@/store';
import { clearSourceCache, clearAllCache as clearAllCacheKeys, clearTypeCache, clearRecentViewCache, CACHE_PREFIXES } from '@/constants/cacheKeys';
import { isCachesAPISupported } from '@/utils/browserSupport';
import { getContentTypeFromSourceKey } from '@/utils/databaseOperations';
import Button from '@/components/common/Button';
import DatabaseActions from '@/components/common/DatabaseActions';
import { useModal } from '@/components/common/Modal';

const Settings = () => {
  const { 
    darkMode, 
    toggleDarkMode, 
    language, 
    setLanguage,
    animationsEnabled,
    toggleAnimations
  } = useUIStore();
  
  const { isAuthenticated, currentUser, logout, sourceKey, rootFolder } = useAuthStore();
  const { 
    clearMangaCache, 
    readerSettings, 
    mangaSettings, 
    updateReaderSettings, 
    updateMangaSettings
  } = useMangaStore();
  const { clearMovieCache } = useMovieStore();
  const { clearMusicCache } = useMusicStore();
  const { clearAllCache: sharedClearAllCache, clearRecentHistory: sharedClearRecentHistory } = useSharedSettingsStore();

  // Auto-detect current content type
  const currentContentType = getContentTypeFromSourceKey(sourceKey);

  // Get current auth state for cache operations
  const getCurrentAuthState = () => {
    const { sourceKey, rootFolder } = useAuthStore.getState();
    return { sourceKey, rootFolder };
  };

  // Manga Cache Clear Functions
  const handleClearMangaCurrentRoot = () => {
    const { sourceKey, rootFolder } = getCurrentAuthState();
    confirmModal({
      title: '🗑️ Clear Manga Cache - Current Root',
      message: (
        <div className="text-left space-y-3">
          <p className="font-medium">Clear cache for current manga root only?</p>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
            <p className="font-semibold text-orange-800 dark:text-orange-200 mb-2">📋 What will be cleared:</p>
            <ul className="text-sm space-y-1 text-orange-700 dark:text-orange-300">
              <li>• React folder cache: <strong>{CACHE_PREFIXES.REACT_FOLDER_CACHE}::{sourceKey || 'current'}::{rootFolder || 'current'}::*</strong></li>
              <li>• Random cache: <strong>{CACHE_PREFIXES.RANDOM_VIEW}::{sourceKey || 'current'}::{rootFolder || 'current'}::manga</strong></li>
              <li>• Source: <strong>{sourceKey || 'current'}</strong>, Root: <strong>{rootFolder || 'current'}</strong></li>
            </ul>
          </div>
        </div>
      ),
      confirmText: 'Clear Current Root',
      cancelText: 'Cancel',
      onConfirm: () => {
        // Use centralized cache clearing for current root
        const cleared = clearSourceCache(sourceKey, 'manga');
        
        successModal({
          title: '✅ Cleared!',
          message: `Current root manga cache cleared successfully. (${cleared} keys removed)`
        });
      }
    });
  };

  const handleClearMangaCurrentSource = () => {
    const { sourceKey } = getCurrentAuthState();
    confirmModal({
      title: '🗑️ Clear Manga Cache - Current Source',
      message: (
        <div className="text-left space-y-3">
          <p className="font-medium">Clear cache for current manga source?</p>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
            <p className="font-semibold text-orange-800 dark:text-orange-200 mb-2">📋 What will be cleared:</p>
            <ul className="text-sm space-y-1 text-orange-700 dark:text-orange-300">
              <li>• ALL React folder cache: <strong>react-folderCache::{sourceKey || 'current'}::*</strong></li>
              <li>• ALL random cache: <strong>randomView::{sourceKey || 'current'}::*::manga</strong></li>
              <li>• All roots within source: <strong>{sourceKey || 'current'}</strong></li>
            </ul>
          </div>
        </div>
      ),
      confirmText: 'Clear Current Source',
      cancelText: 'Cancel',
      onConfirm: () => {
        // Clear cache for current manga source using centralized utility
        clearSourceCache(sourceKey, 'manga');
        
        successModal({
          title: '✅ Cleared!',
          message: 'Current source manga cache cleared successfully.'
        });
      }
    });
  };

  const handleClearMangaSourceAndStorage = () => {
    const { sourceKey } = getCurrentAuthState();
    confirmModal({
      title: '🗑️ Clear Manga Cache + Storage - Current Source',
      message: (
        <div className="text-left space-y-3">
          <p className="font-medium">Clear cache AND storage for current manga source?</p>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
            <p className="font-semibold text-orange-800 dark:text-orange-200 mb-2">📋 What will be cleared:</p>
            <ul className="text-sm space-y-1 text-orange-700 dark:text-orange-300">
              <li>• ALL React folder cache: <strong>react-folderCache::{sourceKey || 'current'}::*</strong></li>
              <li>• ALL random cache: <strong>randomView::{sourceKey || 'current'}::*::manga</strong></li>
              <li>• Manga app storage (settings, favorites, recent history)</li>
              <li>• Reading progress data</li>
            </ul>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border-l-4 border-yellow-400">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ <strong>Warning:</strong> This will also clear your manga settings and reading progress!
            </p>
          </div>
        </div>
      ),
      confirmText: 'Clear Source + Storage',
      cancelText: 'Cancel',
      onConfirm: () => {
        // Clear cache for current source using centralized utility
        clearSourceCache(sourceKey, 'manga');
        
        // Clear manga storage
        clearMangaCache();
        
        successModal({
          title: '✅ Cleared!',
          message: 'Current source manga cache and storage cleared successfully.'
        });
      }
    });
  };

  const handleClearMangaAllSourcesAndStorage = () => {
    confirmModal({
      title: '💥 Clear ALL Manga Cache + Storage',
      message: (
        <div className="text-left space-y-3">
          <div className="font-medium">Clear ALL manga cache and storage?</div>
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <div className="font-semibold text-red-800 dark:text-red-200 mb-2">💀 What will be cleared:</div>
            <ul className="text-sm space-y-1 text-red-700 dark:text-red-300">
              <li>• ALL React folder cache: <strong>react-folderCache::*</strong></li>
              <li>• ALL old frontend cache: <strong>folderCache::*, mangaCache::*</strong></li>
              <li>• ALL random cache: <strong>randomView::*::*::manga</strong></li>
              <li>• ALL manga app storage: <strong>manga-storage</strong></li>
              <li>• ALL reading progress and recent history</li>
              <li>• ALL manga settings and favorites: <strong>manga.perPage</strong></li>
              <li>• ALL session storage manga data</li>
            </ul>
          </div>
          <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg border border-red-300 dark:border-red-700">
            <div className="font-bold text-red-800 dark:text-red-200">
              ❌ This action cannot be undone!
            </div>
          </div>
        </div>
      ),
      confirmText: '💥 Clear Everything',
      cancelText: 'Cancel',
      onConfirm: () => {
        // Clear all manga-related cache using centralized utility
        clearTypeCache('manga');
        
        // Clear manga storage from Zustand store
        clearMangaCache();
        
        // Clear any remaining manga-related session storage
        try {
          Object.keys(sessionStorage).forEach(key => {
            if (key.includes('manga') || key.includes('folderCache') || key.includes('randomView::') || key.includes('recentViewed')) {
              sessionStorage.removeItem(key);
              console.log('🗑️ Removed from sessionStorage:', key);
            }
          });
        } catch (error) {
          console.warn('Error clearing sessionStorage:', error);
        }
        
        // Also clear browser cache-related manga data if possible
        try {
          if (isCachesAPISupported()) {
            caches.keys().then(cacheNames => {
              cacheNames.forEach(cacheName => {
                if (cacheName.includes('manga') || cacheName.includes('folder')) {
                  caches.delete(cacheName);
                  console.log('🗑️ Removed cache:', cacheName);
                }
              });
            });
          } else {
            console.warn('⚠️ Caches API not available - skipping cache cleanup');
          }
        } catch (error) {
          console.warn('Error clearing browser caches:', error);
        }
        
        successModal({
          title: '💥 Completed!',
          message: 'ALL manga cache and storage cleared successfully. Please refresh the page.'
        });
      }
    });
  };

  // Manga Database Operations
  const handleMangaScan = () => {
    const { sourceKey, rootFolder } = getCurrentAuthState();
    confirmModal({
      title: '🔍 Scan Manga Database',
      message: (
        <div className="text-left space-y-3">
          <p className="font-medium">Scan manga folders and update database?</p>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="font-semibold text-blue-800 dark:text-blue-200 mb-2">📋 What will happen:</p>
            <ul className="text-sm space-y-1 text-blue-700 dark:text-blue-300">
              <li>• Scan all folders in: <strong>{rootFolder || 'current root'}</strong></li>
              <li>• Update database with new folders/files</li>
              <li>• This will NOT delete existing data</li>
            </ul>
          </div>
        </div>
      ),
      confirmText: '🔍 Start Scan',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const response = await fetch('/api/manga/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ root: rootFolder, key: sourceKey })
          });
          const result = await response.json();
          
          if (result.success) {
            successModal({
              title: '✅ Scan Completed!',
              message: `Manga scan completed successfully. Found ${result.stats?.total || 0} items.`
            });
          } else {
            errorModal({
              title: '❌ Scan Failed',
              message: result.error || 'Unknown error occurred'
            });
          }
        } catch (error) {
          errorModal({
            title: '❌ Network Error',
            message: 'Failed to connect to server: ' + error.message
          });
        }
      }
    });
  };

  const handleMangaDelete = () => {
    const { sourceKey, rootFolder } = getCurrentAuthState();
    confirmModal({
      title: '🗑️ Delete Manga Database',
      message: (
        <div className="text-left space-y-3">
          <p className="font-medium">Delete ALL manga database entries?</p>
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <p className="font-semibold text-red-800 dark:text-red-200 mb-2">💀 What will be deleted:</p>
            <ul className="text-sm space-y-1 text-red-700 dark:text-red-300">
              <li>• ALL folders in database for: <strong>{rootFolder || 'current root'}</strong></li>
              <li>• ALL view counts and statistics</li>
              <li>• This will NOT affect your actual files</li>
            </ul>
          </div>
          <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg border border-red-300 dark:border-red-700">
            <p className="font-bold text-red-800 dark:text-red-200">
              ❌ This action cannot be undone!
            </p>
          </div>
        </div>
      ),
      confirmText: '🗑️ Delete Database',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/manga/reset-cache?key=${sourceKey}&root=${rootFolder}&mode=delete`, {
            method: 'DELETE'
          });
          const result = await response.json();
          
          if (result.success) {
            successModal({
              title: '✅ Database Deleted!',
              message: 'Manga database entries deleted successfully.'
            });
          } else {
            errorModal({
              title: '❌ Delete Failed',
              message: result.error || 'Unknown error occurred'
            });
          }
        } catch (error) {
          errorModal({
            title: '❌ Network Error',
            message: 'Failed to connect to server: ' + error.message
          });
        }
      }
    });
  };

  const handleMangaScanAndDelete = () => {
    const { sourceKey, rootFolder } = getCurrentAuthState();
    confirmModal({
      title: '🔄 Reset Manga Database',
      message: (
        <div className="text-left space-y-3">
          <p className="font-medium">Delete existing data and scan fresh?</p>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
            <p className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">🔄 What will happen:</p>
            <ul className="text-sm space-y-1 text-yellow-700 dark:text-yellow-300">
              <li>• Delete ALL existing database entries</li>
              <li>• Scan all folders in: <strong>{rootFolder || 'current root'}</strong></li>
              <li>• Rebuild database from scratch</li>
              <li>• View counts will be reset to 0</li>
            </ul>
          </div>
          <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg border border-yellow-300 dark:border-yellow-700">
            <p className="font-bold text-yellow-800 dark:text-yellow-200">
              ⚠️ This will reset all view counts and statistics!
            </p>
          </div>
        </div>
      ),
      confirmText: '🔄 Reset & Scan',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/manga/reset-cache?key=${sourceKey}&root=${rootFolder}&mode=reset`, {
            method: 'DELETE'
          });
          const result = await response.json();
          
          if (result.success) {
            successModal({
              title: '✅ Reset Completed!',
              message: `Database reset and scan completed. Found ${result.stats?.total || 0} items.`
            });
          } else {
            errorModal({
              title: '❌ Reset Failed',
              message: result.error || 'Unknown error occurred'
            });
          }
        } catch (error) {
          errorModal({
            title: '❌ Network Error',
            message: 'Failed to connect to server: ' + error.message
          });
        }
      }
    });
  };

  // Movie Cache Clear Functions (no rootFolder)
  const handleClearMovieCurrentSource = () => {
    const { sourceKey } = getCurrentAuthState();
    confirmModal({
      title: '🗑️ Clear Movie Cache - Current Source',
      message: (
        <div className="text-left space-y-3">
          <p className="font-medium">Clear cache for current movie source?</p>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="font-semibold text-blue-800 dark:text-blue-200 mb-2">📋 What will be cleared:</p>
            <ul className="text-sm space-y-1 text-blue-700 dark:text-blue-300">
              <li>• Folder cache: <strong>movie-folder-cache-{sourceKey || 'current'}</strong></li>
              <li>• Random cache: <strong>randomView::{sourceKey || 'current'}::undefined::movie</strong></li>
              <li>• Recent videos: <strong>recentViewedVideo::{sourceKey || 'current'}</strong></li>
            </ul>
          </div>
        </div>
      ),
      confirmText: 'Clear Current Source',
      cancelText: 'Cancel',
      onConfirm: () => {
        // Clear movie cache for current source using centralized utility
        clearSourceCache(sourceKey, 'movie');
        
        successModal({
          title: '✅ Cleared!',
          message: 'Current source movie cache cleared successfully.'
        });
      }
    });
  };

  const handleClearMovieSourceAndStorage = () => {
    const { sourceKey } = getCurrentAuthState();
    confirmModal({
      title: '🗑️ Clear Movie Cache + Storage - Current Source',
      message: (
        <div className="text-left space-y-3">
          <p className="font-medium">Clear cache AND storage for current movie source?</p>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="font-semibold text-blue-800 dark:text-blue-200 mb-2">📋 What will be cleared:</p>
            <ul className="text-sm space-y-1 text-blue-700 dark:text-blue-300">
              <li>• Folder cache: <strong>movie-folder-cache-{sourceKey || 'current'}</strong></li>
              <li>• Random cache: <strong>randomView::{sourceKey || 'current'}::undefined::movie</strong></li>
              <li>• Recent videos: <strong>recentViewedVideo::{sourceKey || 'current'}</strong></li>
              <li>• Movie app storage (settings, favorites)</li>
            </ul>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border-l-4 border-yellow-400">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ <strong>Warning:</strong> This will also clear your movie settings and favorites!
            </p>
          </div>
        </div>
      ),
      confirmText: 'Clear Source + Storage',
      cancelText: 'Cancel',
      onConfirm: () => {
        // Clear cache for current source using centralized utility
        clearSourceCache(sourceKey, 'movie');
        
        // Clear movie storage
        clearMovieCache();
        
        successModal({
          title: '✅ Cleared!',
          message: 'Current source movie cache and storage cleared successfully.'
        });
      }
    });
  };

  const handleClearMovieAllSourcesAndStorage = () => {
    confirmModal({
      title: '💥 Clear ALL Movie Cache + Storage',
      message: (
        <div className="text-left space-y-3">
          <div className="font-medium">Clear ALL movie cache and storage?</div>
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <div className="font-semibold text-red-800 dark:text-red-200 mb-2">💀 What will be cleared:</div>
            <ul className="text-sm space-y-1 text-red-700 dark:text-red-300">
              <li>• ALL folder cache: <strong>movie-folder-cache-*</strong></li>
              <li>• ALL random cache: <strong>randomView::*::undefined::movie</strong></li>
              <li>• ALL recent videos: <strong>recentViewedVideo::*</strong></li>
              <li>• ALL movie app storage</li>
              <li>• ALL movie settings and favorites</li>
            </ul>
          </div>
          <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg border border-red-300 dark:border-red-700">
            <div className="font-bold text-red-800 dark:text-red-200">
              ❌ This action cannot be undone!
            </div>
          </div>
        </div>
      ),
      confirmText: '💥 Clear Everything',
      cancelText: 'Cancel',
      onConfirm: () => {
        // Clear all movie-related cache using centralized utility
        clearTypeCache('movie');
        
        // Clear movie storage
        clearMovieCache();
        
        successModal({
          title: '💥 Completed!',
          message: 'ALL movie cache and storage cleared successfully.'
        });
      }
    });
  };

  // Movie Database Operations
  const handleMovieScan = () => {
    const { sourceKey } = getCurrentAuthState();
    confirmModal({
      title: '🔍 Scan Movie Database',
      message: (
        <div className="text-left space-y-3">
          <p className="font-medium">Scan movie folders and update database?</p>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="font-semibold text-blue-800 dark:text-blue-200 mb-2">📋 What will happen:</p>
            <ul className="text-sm space-y-1 text-blue-700 dark:text-blue-300">
              <li>• Scan all video files in: <strong>{sourceKey || 'current source'}</strong></li>
              <li>• Update database with new movies/folders</li>
              <li>• This will NOT delete existing data</li>
            </ul>
          </div>
        </div>
      ),
      confirmText: '🔍 Start Scan',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const response = await fetch('/api/movie/scan-movie', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: sourceKey })
          });
          const result = await response.json();
          
          if (result.success) {
            successModal({
              title: '✅ Scan Completed!',
              message: `Movie scan completed successfully. ${result.message || ''}`
            });
          } else {
            errorModal({
              title: '❌ Scan Failed',
              message: result.error || 'Unknown error occurred'
            });
          }
        } catch (error) {
          errorModal({
            title: '❌ Network Error',
            message: 'Failed to connect to server: ' + error.message
          });
        }
      }
    });
  };

  const handleMovieDelete = () => {
    const { sourceKey } = getCurrentAuthState();
    confirmModal({
      title: '🗑️ Delete Movie Database',
      message: (
        <div className="text-left space-y-3">
          <p className="font-medium">Delete ALL movie database entries?</p>
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <p className="font-semibold text-red-800 dark:text-red-200 mb-2">💀 What will be deleted:</p>
            <ul className="text-sm space-y-1 text-red-700 dark:text-red-300">
              <li>• ALL movie database entries for: <strong>{sourceKey || 'current source'}</strong></li>
              <li>• ALL view counts and statistics</li>
              <li>• This will NOT affect your actual video files</li>
            </ul>
          </div>
          <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg border border-red-300 dark:border-red-700">
            <p className="font-bold text-red-800 dark:text-red-200">
              ❌ This action cannot be undone!
            </p>
          </div>
        </div>
      ),
      confirmText: '🗑️ Delete Database',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/movie/reset-cache-movie?key=${sourceKey}&mode=delete`, {
            method: 'DELETE'
          });
          const result = await response.json();
          
          if (result.success) {
            successModal({
              title: '✅ Database Deleted!',
              message: 'Movie database entries deleted successfully.'
            });
          } else {
            errorModal({
              title: '❌ Delete Failed',
              message: result.error || 'Unknown error occurred'
            });
          }
        } catch (error) {
          errorModal({
            title: '❌ Network Error',
            message: 'Failed to connect to server: ' + error.message
          });
        }
      }
    });
  };

  const handleMovieScanAndDelete = () => {
    const { sourceKey } = getCurrentAuthState();
    confirmModal({
      title: '🔄 Reset Movie Database',
      message: (
        <div className="text-left space-y-3">
          <p className="font-medium">Delete existing data and scan fresh?</p>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
            <p className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">🔄 What will happen:</p>
            <ul className="text-sm space-y-1 text-yellow-700 dark:text-yellow-300">
              <li>• Delete ALL existing movie database entries</li>
              <li>• Scan all video files in: <strong>{sourceKey || 'current source'}</strong></li>
              <li>• Rebuild database from scratch</li>
              <li>• View counts will be reset to 0</li>
            </ul>
          </div>
          <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg border border-yellow-300 dark:border-yellow-700">
            <p className="font-bold text-yellow-800 dark:text-yellow-200">
              ⚠️ This will reset all view counts and statistics!
            </p>
          </div>
        </div>
      ),
      confirmText: '🔄 Reset & Scan',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/movie/reset-cache-movie?key=${sourceKey}&mode=reset`, {
            method: 'DELETE'
          });
          const result = await response.json();
          
          if (result.success) {
            successModal({
              title: '✅ Reset Completed!',
              message: 'Movie database reset and scan completed successfully.'
            });
          } else {
            errorModal({
              title: '❌ Reset Failed',
              message: result.error || 'Unknown error occurred'
            });
          }
        } catch (error) {
          errorModal({
            title: '❌ Network Error',
            message: 'Failed to connect to server: ' + error.message
          });
        }
      }
    });
  };

  // Music Cache Clear Functions (no rootFolder)
  const handleClearMusicCurrentSource = () => {
    const { sourceKey } = getCurrentAuthState();
    confirmModal({
      title: '🗑️ Clear Music Cache - Current Source',
      message: (
        <div className="text-left space-y-3">
          <p className="font-medium">Clear cache for current music source?</p>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
            <p className="font-semibold text-purple-800 dark:text-purple-200 mb-2">📋 What will be cleared:</p>
            <ul className="text-sm space-y-1 text-purple-700 dark:text-purple-300">
              <li>• Folder cache: <strong>music-folder-cache-{sourceKey || 'current'}</strong></li>
              <li>• Random cache: <strong>randomView::{sourceKey || 'current'}::undefined::music</strong></li>
              <li>• Recent music: <strong>recentViewedMusic::{sourceKey || 'current'}</strong></li>
            </ul>
          </div>
        </div>
      ),
      confirmText: 'Clear Current Source',
      cancelText: 'Cancel',
      onConfirm: () => {
        // Clear music cache for current source using centralized utility
        clearSourceCache(sourceKey, 'music');
        
        successModal({
          title: '✅ Cleared!',
          message: 'Current source music cache cleared successfully.'
        });
      }
    });
  };

  const handleClearMusicSourceAndStorage = () => {
    const { sourceKey } = getCurrentAuthState();
    confirmModal({
      title: '🗑️ Clear Music Cache + Storage - Current Source',
      message: (
        <div className="text-left space-y-3">
          <p className="font-medium">Clear cache AND storage for current music source?</p>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
            <p className="font-semibold text-purple-800 dark:text-purple-200 mb-2">📋 What will be cleared:</p>
            <ul className="text-sm space-y-1 text-purple-700 dark:text-purple-300">
              <li>• Folder cache: <strong>music-folder-cache-{sourceKey || 'current'}</strong></li>
              <li>• Random cache: <strong>randomView::{sourceKey || 'current'}::undefined::music</strong></li>
              <li>• Recent music: <strong>recentViewedMusic::{sourceKey || 'current'}</strong></li>
              <li>• Music app storage (settings, playlists)</li>
            </ul>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border-l-4 border-yellow-400">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ <strong>Warning:</strong> This will also clear your music settings and playlists!
            </p>
          </div>
        </div>
      ),
      confirmText: 'Clear Source + Storage',
      cancelText: 'Cancel',
      onConfirm: () => {
        // Clear cache for current source using centralized utility
        clearSourceCache(sourceKey, 'music');
        
        // Clear music storage
        clearMusicCache();
        
        successModal({
          title: '✅ Cleared!',
          message: 'Current source music cache and storage cleared successfully.'
        });
      }
    });
  };

  const handleClearMusicAllSourcesAndStorage = () => {
    confirmModal({
      title: '💥 Clear ALL Music Cache + Storage',
      message: (
        <div className="text-left space-y-3">
          <div className="font-medium">Clear ALL music cache and storage?</div>
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <div className="font-semibold text-red-800 dark:text-red-200 mb-2">💀 What will be cleared:</div>
            <ul className="text-sm space-y-1 text-red-700 dark:text-red-300">
              <li>• ALL folder cache: <strong>music-folder-cache-*</strong></li>
              <li>• ALL random cache: <strong>randomView::*::undefined::music</strong></li>
              <li>• ALL recent music: <strong>recentViewedMusic::*</strong></li>
              <li>• ALL music app storage</li>
              <li>• ALL music settings and playlists</li>
            </ul>
          </div>
          <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg border border-red-300 dark:border-red-700">
            <div className="font-bold text-red-800 dark:text-red-200">
              ❌ This action cannot be undone!
            </div>
          </div>
        </div>
      ),
      confirmText: '💥 Clear Everything',
      cancelText: 'Cancel',
      onConfirm: () => {
        // Clear all music-related cache using centralized utility
        clearTypeCache('music');
        
        // Clear music storage
        clearMusicCache();
        
        successModal({
          title: '💥 Completed!',
          message: 'ALL music cache and storage cleared successfully.'
        });
      }
    });
  };

  // Music Database Operations
  const handleMusicScan = () => {
    const { sourceKey } = getCurrentAuthState();
    confirmModal({
      title: '🔍 Scan Music Database',
      message: (
        <div className="text-left space-y-3">
          <p className="font-medium">Scan music folders and update database?</p>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="font-semibold text-blue-800 dark:text-blue-200 mb-2">📋 What will happen:</p>
            <ul className="text-sm space-y-1 text-blue-700 dark:text-blue-300">
              <li>• Scan all audio files in: <strong>{sourceKey || 'current source'}</strong></li>
              <li>• Update database with new songs/albums</li>
              <li>• This will NOT delete existing data</li>
            </ul>
          </div>
        </div>
      ),
      confirmText: '🔍 Start Scan',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const response = await fetch('/api/music/scan-music', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: sourceKey })
          });
          const result = await response.json();
          
          if (result.success) {
            successModal({
              title: '✅ Scan Completed!',
              message: `Music scan completed successfully. ${result.message || ''}`
            });
          } else {
            errorModal({
              title: '❌ Scan Failed',
              message: result.error || 'Unknown error occurred'
            });
          }
        } catch (error) {
          errorModal({
            title: '❌ Network Error',
            message: 'Failed to connect to server: ' + error.message
          });
        }
      }
    });
  };

  const handleMusicDelete = () => {
    const { sourceKey } = getCurrentAuthState();
    confirmModal({
      title: '🗑️ Delete Music Database',
      message: (
        <div className="text-left space-y-3">
          <p className="font-medium">Delete ALL music database entries?</p>
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <p className="font-semibold text-red-800 dark:text-red-200 mb-2">💀 What will be deleted:</p>
            <ul className="text-sm space-y-1 text-red-700 dark:text-red-300">
              <li>• ALL music database entries for: <strong>{sourceKey || 'current source'}</strong></li>
              <li>• ALL view counts and statistics</li>
              <li>• ALL playlists and playlist items</li>
              <li>• This will NOT affect your actual audio files</li>
            </ul>
          </div>
          <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg border border-red-300 dark:border-red-700">
            <p className="font-bold text-red-800 dark:text-red-200">
              ❌ This action cannot be undone!
            </p>
          </div>
        </div>
      ),
      confirmText: '🗑️ Delete Database',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/music/reset-cache-music?key=${sourceKey}&mode=delete`, {
            method: 'DELETE'
          });
          const result = await response.json();
          
          if (result.success) {
            successModal({
              title: '✅ Database Deleted!',
              message: 'Music database entries deleted successfully.'
            });
          } else {
            errorModal({
              title: '❌ Delete Failed',
              message: result.error || 'Unknown error occurred'
            });
          }
        } catch (error) {
          errorModal({
            title: '❌ Network Error',
            message: 'Failed to connect to server: ' + error.message
          });
        }
      }
    });
  };

  const handleMusicScanAndDelete = () => {
    const { sourceKey } = getCurrentAuthState();
    confirmModal({
      title: '🔄 Reset Music Database',
      message: (
        <div className="text-left space-y-3">
          <p className="font-medium">Delete existing data and scan fresh?</p>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
            <p className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">🔄 What will happen:</p>
            <ul className="text-sm space-y-1 text-yellow-700 dark:text-yellow-300">
              <li>• Delete ALL existing music database entries</li>
              <li>• Delete ALL playlists and playlist items</li>
              <li>• Scan all audio files in: <strong>{sourceKey || 'current source'}</strong></li>
              <li>• Rebuild database from scratch</li>
              <li>• View counts will be reset to 0</li>
            </ul>
          </div>
          <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg border border-yellow-300 dark:border-yellow-700">
            <p className="font-bold text-yellow-800 dark:text-yellow-200">
              ⚠️ This will reset all view counts, statistics, and playlists!
            </p>
          </div>
        </div>
      ),
      confirmText: '🔄 Reset & Scan',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/music/reset-cache-music?key=${sourceKey}&mode=reset`, {
            method: 'DELETE'
          });
          const result = await response.json();
          
          if (result.success) {
            successModal({
              title: '✅ Reset Completed!',
              message: 'Music database reset and scan completed successfully.'
            });
          } else {
            errorModal({
              title: '❌ Reset Failed',
              message: result.error || 'Unknown error occurred'
            });
          }
        } catch (error) {
          errorModal({
            title: '❌ Network Error',
            message: 'Failed to connect to server: ' + error.message
          });
        }
      }
    });
  };

  const [activeTab, setActiveTab] = useState('appearance');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // Modal hook
  const { 
    modalState, 
    closeModal, 
    confirmModal, 
    alertModal, 
    successModal, 
    errorModal,
    Modal: ModalComponent
  } = useModal();

  const settingsTabs = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'cache', label: 'Cache & Storage', icon: Database },
    { id: 'media', label: 'Media', icon: Volume2 },
    { id: 'account', label: 'Account', icon: User },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'about', label: 'About', icon: Globe }
  ];

  const handleExportSettings = () => {
    const settings = {
      appearance: { darkMode, animationsEnabled },
      language,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(settings, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mainwebsite-settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportSettings = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target.result);
        // Apply imported settings
        if (settings.appearance) {
          if (settings.appearance.darkMode !== darkMode) {
            toggleDarkMode();
          }
          if (settings.appearance.animationsEnabled !== animationsEnabled) {
            toggleAnimations();
          }
        }
        if (settings.language) {
          setLanguage(settings.language);
        }
        successModal({
          title: 'Thành công!',
          message: 'Cài đặt đã được import thành công!'
        });
      } catch (error) {
        errorModal({
          title: 'Lỗi import',
          message: 'Không thể import cài đặt. File không đúng định dạng.'
        });
      }
    };
    reader.readAsText(file);
  };

  // Clear recent history with modal confirmation - Clear all recent view cache from all roots
  const handleClearRecentHistory = () => {
    confirmModal({
      title: '🗑️ Xóa toàn bộ cache lịch sử xem',
      message: (
        <div className="text-left space-y-3">
          <p className="font-medium">Bạn có chắc chắn muốn xóa toàn bộ cache lịch sử xem?</p>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <p className="font-semibold text-gray-800 dark:text-gray-200 mb-2">📋 Những gì sẽ bị xóa:</p>
            <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
              <li>• Recent Manga: <strong>recentViewed::*::*</strong></li>
              <li>• Recent Movies: <strong>recentViewedVideo::*</strong></li>
              <li>• Recent Music: <strong>recentViewedMusic::*</strong></li>
              <li>• View history từ TẤT CẢ nguồn</li>
            </ul>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border-l-4 border-yellow-400">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ <strong>Lưu ý:</strong> Hành động này không thể hoàn tác và sẽ xóa lịch sử từ <strong>TẤT CẢ</strong> nguồn nội dung.
            </p>
          </div>
        </div>
      ),
      confirmText: 'Xóa tất cả lịch sử',
      cancelText: 'Hủy',
      onConfirm: () => {
        // Clear recent history cache patterns using centralized utility
        clearRecentViewCache();
        
        // Clear shared recent history 
        sharedClearRecentHistory('manga');
        sharedClearRecentHistory('movie'); 
        sharedClearRecentHistory('music');
        
        successModal({
          title: '✅ Đã xóa hoàn tất!',
          message: 'Toàn bộ cache lịch sử xem từ tất cả nguồn đã được xóa thành công.'
        });
      }
    });
  };

  // Clear ALL browser cache with modal confirmation - Nuclear option
  const handleClearAllCache = () => {
    confirmModal({
      title: '💥 XÓA TẤT CẢ CACHE BROWSER',
      message: (
        <div className="text-left space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border-l-4 border-red-500">
            <p className="font-bold text-red-700 dark:text-red-300">⚠️ CẢNH BÁO: Đây là tùy chọn XÓA TOÀN BỘ!</p>
          </div>
          
          <div className="space-y-3">
            <p className="font-semibold text-gray-800 dark:text-gray-200">🧹 Những gì sẽ bị xóa HOÀN TOÀN:</p>
            
            {/* Manga Cache */}
            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
              <p className="font-medium text-orange-800 dark:text-orange-200 mb-1">📖 Manga Cache:</p>
              <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-0.5">
                <li>• <strong>react-folderCache::*</strong></li>
                <li>• <strong>randomView::*::*::manga</strong></li>
                <li>• <strong>recentViewed::*::*</strong></li>
                <li>• Manga app storage và favorites</li>
              </ul>
            </div>

            {/* Movie Cache */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">🎬 Movie Cache:</p>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-0.5">
                <li>• <strong>movie-folder-cache-*</strong></li>
                <li>• <strong>randomView::*::undefined::movie</strong></li>
                <li>• <strong>recentViewedVideo::*</strong></li>
                <li>• Movie app storage và favorites</li>
              </ul>
            </div>

            {/* Music Cache */}
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
              <p className="font-medium text-purple-800 dark:text-purple-200 mb-1">� Music Cache:</p>
              <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-0.5">
                <li>• <strong>music-folder-cache-*</strong></li>
                <li>• <strong>randomView::*::undefined::music</strong></li>
                <li>• <strong>recentViewedMusic::*</strong></li>
                <li>• Music app storage và playlists</li>
              </ul>
            </div>

            {/* Browser Storage */}
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <p className="font-medium text-green-800 dark:text-green-200 mb-1">🌐 Browser Storage:</p>
              <ul className="text-sm text-green-700 dark:text-green-300 space-y-0.5">
                <li>• Toàn bộ localStorage</li>
                <li>• Toàn bộ sessionStorage</li>
                <li>• Application settings</li>
              </ul>
            </div>
          </div>

          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg border">
            <p className="font-bold text-gray-800 dark:text-gray-200">💀 KẾT QUẢ:</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              App sẽ về trạng thái hoàn toàn mới như lần đầu sử dụng!
            </p>
          </div>

          <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg border border-red-300 dark:border-red-700">
            <p className="font-bold text-red-800 dark:text-red-200">
              ❌ Hành động này KHÔNG THỂ HOÀN TÁC!
            </p>
          </div>
        </div>
      ),
      confirmText: '💥 XÓA TẤT CẢ',
      cancelText: 'Hủy bỏ',
      onConfirm: () => {
        // Clear all application caches using centralized utility
        clearAllCacheKeys();
        
        // Clear sessionStorage
        sessionStorage.clear();
        
        successModal({
          title: '💥 Đã xóa toàn bộ!',
          message: 'Toàn bộ cache và storage đã được xóa. App sẽ tải lại để áp dụng thay đổi.',
          onClose: () => {
            // Reload page to reset app state
            window.location.reload();
          }
        });
      }
    });
  };

  const handleResetApp = () => {
    if (showResetConfirm) {
      // Clear all data
      clearMangaCache();
      clearMovieCache();
      clearMusicCache();
      localStorage.clear();
      sessionStorage.clear();
      
      // Reset to defaults
      window.location.reload();
    } else {
      setShowResetConfirm(true);
      setTimeout(() => setShowResetConfirm(false), 5000);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'appearance':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Appearance Settings
            </h3>
            
            {/* Theme */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Theme</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => !darkMode && toggleDarkMode()}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    !darkMode 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <Sun className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                  <p className="font-medium text-gray-900 dark:text-white">Light</p>
                </button>
                
                <button
                  onClick={() => darkMode && toggleDarkMode()}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    darkMode 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <Moon className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <p className="font-medium text-gray-900 dark:text-white">Dark</p>
                </button>
                
                <button className="p-4 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 opacity-50 cursor-not-allowed">
                  <Monitor className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                  <p className="font-medium text-gray-900 dark:text-white">Auto</p>
                  <p className="text-xs text-gray-500">Coming Soon</p>
                </button>
              </div>
            </div>

            {/* Animations */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">Animations</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Enable smooth transitions and animations
                  </p>
                </div>
                <Button
                  variant={animationsEnabled ? 'primary' : 'outline'}
                  onClick={toggleAnimations}
                >
                  {animationsEnabled ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            </div>
          </div>
        );

      case 'general':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              General Settings
            </h3>
            
            {/* Language */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Language</h4>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="en">English</option>
                <option value="vi">Tiếng Việt</option>
                <option value="ja">日本語</option>
              </select>
            </div>

            {/* Auto-refresh */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">Auto-refresh</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Automatically refresh content every 30 minutes
                  </p>
                </div>
                <Button variant="outline">
                  Disabled
                </Button>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">Notifications</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Show browser notifications for updates
                  </p>
                </div>
                <Button variant="outline" icon={Bell}>
                  Configure
                </Button>
              </div>
            </div>
          </div>
        );

      case 'cache':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Cache & Storage Management
            </h3>
            
            {/* Cache Management */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Cache Management</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Quản lý bộ nhớ đệm để tối ưu hiệu năng và giải phóng không gian lưu trữ.
              </p>
              
              <div className="space-y-6">
                {/* Cache Type Display - Auto-detect current content type */}
                <div>
                  <h5 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">
                    Xóa cache - {currentContentType ? 
                      (currentContentType === 'manga' ? '📚 Manga' : 
                       currentContentType === 'movie' ? '🎬 Movie' : '🎵 Music') : 
                      'Chưa chọn nguồn'}
                  </h5>
                  
                  {/* Show content type specific cache actions */}
                  {currentContentType && sourceKey ? (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="space-y-4">
                        {currentContentType === 'manga' && (
                          <>
                            <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-l-4 border-orange-400">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">Clear Current Root Cache</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Clear cache for current root folder only</p>
                                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">📁 Scope: Current source + current root folder</p>
                              </div>
                              <Button variant="outline" onClick={handleClearMangaCurrentRoot} className="text-orange-600 hover:text-orange-700">
                                Clear Root
                              </Button>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg border-l-4 border-orange-500">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">Clear Current Source Cache</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Clear all cache for current source (all roots)</p>
                                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">🌐 Scope: Current source + all root folders</p>
                              </div>
                              <Button variant="outline" onClick={handleClearMangaCurrentSource} className="text-orange-600 hover:text-orange-700">
                                Clear Source
                              </Button>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-500">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">Clear Source + Storage</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Clear source cache + manga app storage</p>
                                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">⚠️ Scope: Current source + app settings/favorites</p>
                              </div>
                              <Button variant="outline" onClick={handleClearMangaSourceAndStorage} className="text-yellow-600 hover:text-yellow-700">
                                Clear Source + Storage
                              </Button>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border-l-4 border-red-500">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">Clear ALL Manga Data</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Nuclear option: ALL sources + ALL storage</p>
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">💥 Scope: Everything manga-related</p>
                              </div>
                              <Button variant="outline" onClick={handleClearMangaAllSourcesAndStorage} className="text-red-600 hover:text-red-700">
                                💥 Clear Everything
                              </Button>
                            </div>
                          </>
                        )}

                        {currentContentType === 'movie' && (
                          <>
                            <div className="flex items-center justify-between p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg border-l-4 border-blue-500">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">Clear Current Source Cache</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Clear all cache for current movie source</p>
                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">🌐 Scope: Current source + metadata cache</p>
                              </div>
                              <Button variant="outline" onClick={handleClearMovieCurrentSource} className="text-blue-600 hover:text-blue-700">
                                Clear Source
                              </Button>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-500">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">Clear Source + Storage</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Clear source cache + movie app storage</p>
                                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">⚠️ Scope: Current source + app settings/favorites</p>
                              </div>
                              <Button variant="outline" onClick={handleClearMovieSourceAndStorage} className="text-yellow-600 hover:text-yellow-700">
                                Clear Source + Storage
                              </Button>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border-l-4 border-red-500">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">Clear ALL Movie Data</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Nuclear option: ALL sources + ALL storage</p>
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">💥 Scope: Everything movie-related</p>
                              </div>
                              <Button variant="outline" onClick={handleClearMovieAllSourcesAndStorage} className="text-red-600 hover:text-red-700">
                                💥 Clear Everything
                              </Button>
                            </div>
                          </>
                        )}

                        {currentContentType === 'music' && (
                          <>
                            <div className="flex items-center justify-between p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg border-l-4 border-purple-500">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">Clear Current Source Cache</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Clear all cache for current music source</p>
                                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">🌐 Scope: Current source + metadata cache</p>
                              </div>
                              <Button variant="outline" onClick={handleClearMusicCurrentSource} className="text-purple-600 hover:text-purple-700">
                                Clear Source
                              </Button>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-500">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">Clear Source + Storage</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Clear source cache + music app storage</p>
                                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">⚠️ Scope: Current source + app settings/playlists</p>
                              </div>
                              <Button variant="outline" onClick={handleClearMusicSourceAndStorage} className="text-yellow-600 hover:text-yellow-700">
                                Clear Source + Storage
                              </Button>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border-l-4 border-red-500">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">Clear ALL Music Data</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Nuclear option: ALL sources + ALL storage</p>
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">💥 Scope: Everything music-related</p>
                              </div>
                              <Button variant="outline" onClick={handleClearMusicAllSourcesAndStorage} className="text-red-600 hover:text-red-700">
                                💥 Clear Everything
                              </Button>
                            </div>
                          </>
                        )}

                        {/* Database Operations Section for current content type */}
                        <div className="border-t pt-4 mt-6">
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                            <Database className="w-5 h-5 mr-2" />
                            Database Operations
                          </h4>
                          
                          <DatabaseActions
                            contentType={currentContentType}
                            sourceKey={sourceKey}
                            rootFolder={rootFolder}
                            layout="vertical"
                            size="md"
                            variant="outline"
                            showLabels={true}
                            className="space-y-3"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-center">
                      <p className="text-gray-600 dark:text-gray-400">
                        {!sourceKey ? 'Vui lòng chọn source key để hiển thị các tùy chọn cache' : 'Không thể xác định loại nội dung từ source key'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Advanced Cache Management */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Advanced Cache Management</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Các tùy chọn xóa cache nâng cao - sử dụng cẩn thận.
              </p>
              
              <div className="space-y-4">
                {/* History Management */}
                <div>
                  <h5 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">Lịch sử xem</h5>
                  <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Recent History - All Sources</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Clear ALL recent view cache from ALL roots (Manga/Movie/Music)</p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">🔄 Xóa lịch sử từ TẤT CẢ nguồn nội dung</p>
                    </div>
                    <Button variant="outline" onClick={handleClearRecentHistory} className="text-yellow-600 hover:text-yellow-700">
                      Clear All History
                    </Button>
                  </div>
                </div>

                {/* Nuclear Option */}
                <div>
                  <h5 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">Xóa tất cả</h5>
                  <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Complete Browser Cache Wipe</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Clear ALL browser storage (localStorage, cookies, cache, etc.)</p>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">💥 NUCLEAR OPTION - Xóa hoàn toàn mọi thứ như lần đầu sử dụng</p>
                    </div>
                    <Button variant="outline" onClick={handleClearAllCache} className="text-red-600 hover:text-red-700 font-medium">
                      💥 Clear Everything
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'media':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Media Settings
            </h3>
            
            {/* Manga Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">📚 Manga Settings</h4>
              <div className="space-y-4">
                {/* Recent History Count */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Số trang preload: {readerSettings.preloadCount}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={readerSettings.preloadCount}
                    onChange={(e) => updateReaderSettings({ preloadCount: parseInt(e.target.value) })}
                    className="w-full max-w-xs"
                  />
                  <p className="text-xs text-gray-500 mt-1">Số ảnh được tải trước để đọc mượt hơn</p>
                </div>

                {/* Scroll Images Per Page */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ảnh mỗi trang (Scroll): {readerSettings.scrollImagesPerPage}
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="400"
                    step="20"
                    value={readerSettings.scrollImagesPerPage || 200}
                    onChange={(e) => updateReaderSettings({ scrollImagesPerPage: parseInt(e.target.value) })}
                    className="w-full max-w-xs"
                  />
                  <p className="text-xs text-gray-500 mt-1">Điều chỉnh số ảnh trong mỗi trang của chế độ cuộn. Số thấp giúp chuyển trang nhanh hơn.</p>
                </div>

                {/* Recent History Count */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Số lượng lịch sử lưu: {mangaSettings.recentHistoryCount}
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={mangaSettings.recentHistoryCount}
                    onChange={(e) => updateMangaSettings({ recentHistoryCount: parseInt(e.target.value) })}
                    className="w-full max-w-xs"
                  />
                  <p className="text-xs text-gray-500 mt-1">Số manga được lưu trong lịch sử xem</p>
                </div>

                {/* Enable Recent Tracking */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Theo dõi lịch sử xem</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Tự động lưu manga vừa xem</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mangaSettings.enableRecentTracking}
                      onChange={(e) => updateMangaSettings({ enableRecentTracking: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Use Database */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Sử dụng Database</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Load folder từ DB thay vì disk</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mangaSettings.useDb}
                      onChange={(e) => updateMangaSettings({ useDb: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Lazy Load */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Lazy Loading</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Tải ảnh khi cần thiết</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mangaSettings.lazyLoad}
                      onChange={(e) => updateMangaSettings({ lazyLoad: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Quality Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quality Settings</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Default Video Quality
                  </label>
                  <select className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="auto">Auto</option>
                    <option value="1080p">1080p</option>
                    <option value="720p">720p</option>
                    <option value="480p">480p</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Audio Quality
                  </label>
                  <select className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="high">High (320kbps)</option>
                    <option value="medium">Medium (192kbps)</option>
                    <option value="low">Low (128kbps)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case 'account':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Account Settings
            </h3>
            
            {isAuthenticated ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      Logged in as: {currentUser?.username}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Access level: {currentUser?.role || 'User'}
                    </p>
                  </div>
                  <Button variant="outline" onClick={logout}>
                    Sign Out
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Not signed in
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Sign in to access secure sources and sync your preferences
                </p>
                <Button variant="primary">
                  Sign In
                </Button>
              </div>
            )}
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Privacy Settings
            </h3>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">Analytics</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Help improve the app by sharing usage data
                    </p>
                  </div>
                  <Button variant="outline">
                    Disabled
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">Error Reporting</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Automatically report errors to help fix issues
                    </p>
                  </div>
                  <Button variant="outline">
                    Disabled
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'about':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              About MainWebSite
            </h3>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white">MainWebSite React</h4>
                <p className="text-gray-600 dark:text-gray-400">Version 1.0.0</p>
              </div>
              
              <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                <p>
                  A modern React-based media management application for organizing and viewing
                  manga, movies, and music collections.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">Built with:</h5>
                    <ul className="space-y-1">
                      <li>• React 18</li>
                      <li>• Vite</li>
                      <li>• Tailwind CSS</li>
                      <li>• Zustand</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">Features:</h5>
                    <ul className="space-y-1">
                      <li>• Manga Reader</li>
                      <li>• Movie Player</li>
                      <li>• Music Player</li>
                      <li>• Dark Mode</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <SettingsIcon className="w-8 h-8 mr-3" />
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Customize your MainWebSite experience
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Sidebar - Mobile: Horizontal scroll with icons only, Desktop: Full labels */}
          <div className="w-full lg:w-64 flex-shrink-0">
            {/* Mobile: Horizontal Scrollable Icons */}
            <div className="lg:hidden bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
              <nav className="flex p-2 gap-1">
                {settingsTabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-shrink-0 flex flex-col items-center justify-center p-3 rounded-md transition-colors min-w-[64px] ${
                        activeTab === tab.id
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      title={tab.label}
                    >
                      <IconComponent className="w-5 h-5" />
                      <span className="text-[10px] mt-1 font-medium truncate max-w-[60px]">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Desktop: Vertical List with Icons and Labels */}
            <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <nav className="p-4 space-y-2">
                {settingsTabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 rounded-md text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <IconComponent className="w-5 h-5 mr-3 flex-shrink-0" />
                      <span className="truncate">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Quick Actions - Desktop only */}
            <div className="hidden lg:block mt-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Actions</h4>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleExportSettings}
                  icon={Download}
                >
                  Export Settings
                </Button>
                <label className="block">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportSettings}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    icon={Upload}
                    as="span"
                  >
                    Import Settings
                  </Button>
                </label>
                <Button
                  variant={showResetConfirm ? 'danger' : 'outline'}
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleResetApp}
                  icon={showResetConfirm ? Trash2 : RotateCcw}
                >
                  {showResetConfirm ? 'Confirm Reset' : 'Reset App'}
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderTabContent()}
          </div>
        </div>
      </div>
      
      {/* Modal Component */}
      <ModalComponent />
    </div>
  );
};

export default Settings;
