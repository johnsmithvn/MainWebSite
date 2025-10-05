// 📁 src/store/mangaStore.js
// 📚 Manga content management store

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiService } from '@/utils/api';
import { getMangaCache, setMangaCache } from '@/utils/mangaCache';
import { updateFavoriteInAllCaches } from '@/utils/favoriteCache';
import { useAuthStore } from './authStore';
import { useSharedSettingsStore } from './sharedStore';

/**
 * Manga Store
 * Manages manga folders, reader state, favorites, and settings
 */
export const useMangaStore = create(
  persist(
    (set, get) => ({
      currentPath: '',
      allFolders: [],
      mangaList: [], // Initialize with empty array
      // Transient pass-through for reader data to avoid duplicate request when navigating from Home to Reader
      readerPrefetch: null, // { path, images, ts }
      favorites: [],
      loading: false,
      error: null,
      searchTerm: '',
      shouldNavigateToReader: null, // Flag for reader navigation
      favoritesRefreshTrigger: 0, // Add trigger for forcing slider refresh
      readerSettings: {
        readingMode: 'vertical',
        darkMode: false,
        zoomLevel: 100,
        autoNext: false,
        preloadCount: 10, // Number of images to preload before and after current page
        scrollImagesPerPage: 200, // Pagination size for vertical scroll mode
      },
      mangaSettings: {
        useDb: true, // true: load folder từ DB, false: load từ disk
        gridLoadFromDb: true, // Setting cho folder grid loading  
        lazyLoad: false, // Setting cho lazy loading images
        recentHistoryCount: 20, // Số lượng lịch sử lưu trữ (mặc định 20)
        enableRecentTracking: true // Bật/tắt theo dõi lịch sử xem
      },
      
      setCurrentPath: (path) => set({ currentPath: path }),
      setAllFolders: (folders) => set({ allFolders: folders }),
      setMangaList: (mangaList) => set({ mangaList }),
      setReaderPrefetch: (prefetch) => set({ readerPrefetch: prefetch }),
      setFavorites: (favorites) => set({ favorites }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setSearchTerm: (searchTerm) => set({ searchTerm }),
      clearNavigationFlag: () => set({ shouldNavigateToReader: null }),
      
      // Fetch manga folders from API
      fetchMangaFolders: async (path = '') => {
        set({ loading: true, error: null });
        const { sourceKey, rootFolder } = useAuthStore.getState();
        const { mangaSettings } = get();

        // 1. Try to get data from cache first
        const cachedData = getMangaCache(sourceKey, rootFolder, path);
        if (cachedData) {
          set({ 
            mangaList: cachedData.mangaList,
            currentPath: path,
            loading: false 
          });
          // If cache is fresh, we can skip the API call
          return;
        }

        // 2. If no cache, fetch from API
        try {
          const params = {
            mode: 'path',
            key: sourceKey,
            root: rootFolder,
            path: path,
            useDb: mangaSettings.useDb ? '1' : '0'
          };
          const response = await apiService.manga.getFolders(params);
          const data = response.data;
          
          
          const cleanImageUrl = (url) => {
            if (!url || typeof url !== 'string') return url;
            if (url.startsWith('http') || url.startsWith('/default/')) return url;
            return url;
          };
          
          let folders = [];
          if (data.type === 'folder') {
            if (data.images && data.images.length > 0) {
              const parts = path.split('/');
              const folderName = parts[parts.length - 1] || 'Xem ảnh';
              folders.push({
                name: folderName,
                path: path + '/__self__',
                thumbnail: cleanImageUrl(data.images[0]),
                isSelfReader: true,
                images: data.images.map(cleanImageUrl),
                hasImages: true,
              });
            }
            
            if (data.folders && data.folders.length > 0) {
              for (const folder of data.folders) {
                folders.push({
                  ...folder,
                  thumbnail: cleanImageUrl(folder.thumbnail),
                  isSelfReader: false,
                  hasImages: false
                });
              }
            }
          } else if (data.type === 'reader') {
            set({ 
              mangaList: [],
              currentPath: path,
              loading: false,
              shouldNavigateToReader: path
            });
            // Save pass-through for Reader to consume immediately
            set({ readerPrefetch: { path, images: (data.images || []).map(cleanImageUrl), ts: Date.now() } });
            return;
          }
          
          
          if (folders.length === 0) {
            console.warn('⚠️ No folders found for path:', path);
          }
          
          // 3. Set state and save to cache
          set({ 
            mangaList: folders,
            currentPath: path,
            loading: false 
          });
          setMangaCache(sourceKey, rootFolder, path, { mangaList: folders });

        } catch (error) {
          console.error('Fetch manga folders error:', error);
          set({ error: error.response?.data?.message || error.message, loading: false });
        }
      },
      
      // Fetch favorites from API
      fetchFavorites: async () => {
        try {
          const { sourceKey, rootFolder } = useAuthStore.getState();
          if (!sourceKey || !rootFolder) {
            // Skip when prerequisites are missing (manga needs rootFolder)
            set({ favorites: [] });
            return;
          }
          const params = { key: sourceKey, root: rootFolder };
          const response = await apiService.manga.getFavorites(params);
          set({ favorites: response.data || [] });
        } catch (error) {
          console.error('Fetch favorites error:', error);
          set({ error: error.response?.data?.message || error.message });
        }
      },
      
      updateReaderSettings: (settings) => set((state) => ({
        readerSettings: { ...state.readerSettings, ...settings }
      })),
      
      updateMangaSettings: (settings) => set((state) => ({
        mangaSettings: { ...state.mangaSettings, ...settings }
      })),
      
      // Use shared clearRecentHistory
      clearRecentHistory: (type = 'manga') => {
        const { sourceKey, rootFolder } = useAuthStore.getState();
        const { clearRecentHistory } = useSharedSettingsStore.getState();
        clearRecentHistory(type, sourceKey, rootFolder);
      },
      
      // Use shared clearAllCache
      clearAllCache: () => {
        const { clearAllCache } = useSharedSettingsStore.getState();
        clearAllCache();
      },
      
      clearMangaCache: () => set({ 
        mangaList: [], 
        allFolders: [], 
        currentPath: '',
        error: null 
      }),
      
      toggleFavorite: async (item) => {
        try {
          const { sourceKey, rootFolder } = useAuthStore.getState();
          const isFavorited = get().favorites.some(f => f.path === item.path);
          const newFavoriteState = !isFavorited;
          
          console.log('🔄 MangaStore toggleFavorite:', { sourceKey, rootFolder, path: item.path, newFavoriteState });
          
          // Call API to toggle favorite
          await apiService.manga.toggleFavorite(sourceKey, item.path, newFavoriteState);
          
          // Update local state
          set((state) => {
            const favorites = isFavorited
              ? state.favorites.filter(f => f.path !== item.path)
              : [...state.favorites, item];
            
            // Also update the item in mangaList if it exists
            const updatedMangaList = state.mangaList.map(manga => 
              manga.path === item.path 
                ? { ...manga, isFavorite: newFavoriteState }
                : manga
            );
            
            return { 
              favorites,
              mangaList: updatedMangaList,
              favoritesRefreshTrigger: state.favoritesRefreshTrigger + 1 // Trigger refresh
            };
          });

          // Update all cache entries - đảm bảo cập nhật cache cho RandomSlider
          updateFavoriteInAllCaches(sourceKey, item.path, newFavoriteState, rootFolder);
          
          console.log('✅ MangaStore toggleFavorite completed');
          
        } catch (error) {
          console.error('Toggle favorite error:', error);
          set({ error: error.response?.data?.message || error.message });
        }
      },
    }),
    {
      name: 'manga-storage',
      partialize: (state) => ({
        recentViewed: state.recentViewed,
        favorites: state.favorites,
        readerSettings: state.readerSettings,
        mangaSettings: state.mangaSettings,
      }),
    }
  )
);
