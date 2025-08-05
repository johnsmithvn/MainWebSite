// 📁 src/store/index.js
// 🏪 Global state management with Zustand

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '../constants';
import { apiService } from '../utils/api';
import { getMangaCache, setMangaCache } from '@/utils/mangaCache';
import { updateFavoriteInAllCaches } from '@/utils/favoriteCache';

// Helper function to get root folder from source key
const getRootFolderFromKey = (sourceKey) => {
  const keyToRootMap = {
    'ROOT_DOW': 'dow',
    'ROOT_FANTASY': 'fantasy', 
    'ROOT_MANGAH': 'mangah',
    'V_ANIME': 'anime',
    'V_ANIMEH': 'animeh',
    'V_JAVA': 'java',
    'V_MOVIE': 'movie',
    'M_MUSIC': 'music'
  };
  
  return keyToRootMap[sourceKey] || sourceKey.toLowerCase().replace(/^(root_|v_|m_)/, '');
};

// Auth store
export const useAuthStore = create(
  persist(
    (set, get) => ({
      sourceKey: 'ROOT_FANTASY', // Default for testing
      rootFolder: '', // Will be auto-calculated from sourceKey
      token: '',
      isAuthenticated: false,
      secureKeys: [],
      
      setSourceKey: (sourceKey) => {
        const rootFolder = getRootFolderFromKey(sourceKey);
        set({ sourceKey, rootFolder });
      },
      
      setRootFolder: (rootFolder) => set({ rootFolder }),
      setToken: (token) => set({ token, isAuthenticated: !!token }),
      setSecureKeys: (secureKeys) => set({ secureKeys }),
      
      login: (sourceKey, token) => {
        const rootFolder = getRootFolderFromKey(sourceKey);
        set({ 
          sourceKey, 
          rootFolder,
          token, 
          isAuthenticated: true 
        });
      },
      
      logout: () => set({ 
        sourceKey: '', 
        rootFolder: '', 
        token: '', 
        isAuthenticated: false 
      }),
      
      isSecureKey: (key) => {
        const { secureKeys } = get();
        return secureKeys.includes(key);
      },
      
      // Initialize rootFolder if not set
      initializeRootFolder: () => {
        const { sourceKey, rootFolder } = get();
        if (sourceKey && !rootFolder) {
          const calculatedRoot = getRootFolderFromKey(sourceKey);
          set({ rootFolder: calculatedRoot });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        sourceKey: state.sourceKey,
        rootFolder: state.rootFolder,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Auto-calculate rootFolder if missing after rehydration
        if (state?.sourceKey && !state?.rootFolder) {
          const rootFolder = getRootFolderFromKey(state.sourceKey);
          state.rootFolder = rootFolder;
        }
        // Set default rootFolder for ROOT_FANTASY if not set
        if (state?.sourceKey === 'ROOT_FANTASY' && !state?.rootFolder) {
          state.rootFolder = 'fantasy';
        }
      },
    }
  )
);

// UI store
export const useUIStore = create((set) => ({
  darkMode: false,
  sidebarOpen: false, // Default to closed
  searchOpen: false,
  loading: false,
  animationsEnabled: true,
  
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleSearch: () => set((state) => ({ searchOpen: !state.searchOpen })),
  toggleAnimations: () => set((state) => ({ animationsEnabled: !state.animationsEnabled })),
  setLoading: (loading) => set({ loading }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
}));

// Manga store
export const useMangaStore = create(
  persist(
    (set, get) => ({
      currentPath: '',
      allFolders: [],
      mangaList: [], // Initialize with empty array
      favorites: [],
      loading: false,
      error: null,
      searchTerm: '',
      shouldNavigateToReader: null, // Flag for reader navigation
      readerSettings: {
        readingMode: 'vertical',
        darkMode: false,
        zoomLevel: 100,
        autoNext: false,
        preloadCount: 10, // Number of images to preload before and after current page
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
          console.log('📦 Using cached data for path:', path);
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
          
          console.log('🔍 API Response:', data);
          
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
            return;
          }
          
          console.log('📁 Processed folders:', folders);
          
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
      
      // Clear recent history from localStorage
      clearRecentHistory: (type = 'manga') => {
        const { sourceKey, rootFolder } = useAuthStore.getState();
        try {
          let cacheKey;
          switch (type) {
            case 'manga':
              cacheKey = `recentViewed::${rootFolder}::${rootFolder}`;
              break;
            case 'movie':
              cacheKey = `recentViewedVideo::${sourceKey}`;
              break;
            case 'music':
              cacheKey = `recentViewedMusic::${sourceKey}`;
              break;
            default:
              cacheKey = `recentViewed::${type}::${sourceKey}`;
          }
          
          localStorage.removeItem(cacheKey);
          console.log('🗑️ Cleared recent history:', { type, cacheKey });
        } catch (error) {
          console.warn('Error clearing recent history:', error);
        }
      },
      
      // Clear all cache (recent, random, topview)
      clearAllCache: () => {
        const { sourceKey, rootFolder } = useAuthStore.getState();
        try {
          // Recent history cache keys
          const recentKeys = [
            `recentViewed::${rootFolder}::${rootFolder}`,
            `recentViewedVideo::${sourceKey}`,
            `recentViewedMusic::${sourceKey}`
          ];
          
          // Random cache keys
          const randomKeys = [
            `randomView::${sourceKey}::${rootFolder}::manga`,
            `randomView::${sourceKey}::${rootFolder}::movie`,
            `randomView::${sourceKey}::${rootFolder}::music`
          ];
          
          // Top view cache keys
          const topViewKeys = [
            `topView::${sourceKey}::${rootFolder}::manga`,
            `topView::${sourceKey}::${rootFolder}::movie`,
            `topView::${sourceKey}::${rootFolder}::music`
          ];
          
          const allKeys = [...recentKeys, ...randomKeys, ...topViewKeys];
          
          allKeys.forEach(key => {
            localStorage.removeItem(key);
          });
          
          console.log('🗑️ Cleared all cache:', allKeys.length, 'keys');
        } catch (error) {
          console.warn('Error clearing all cache:', error);
        }
      },
      
      clearMangaCache: () => set({ 
        mangaList: [], 
        allFolders: [], 
        currentPath: '',
        error: null 
      }),
      
      toggleFavorite: async (item) => {
        try {
          const { sourceKey } = useAuthStore.getState();
          const isFavorited = get().favorites.some(f => f.path === item.path);
          const newFavoriteState = !isFavorited;
          
          // Call API to toggle favorite
          await apiService.manga.toggleFavorite(sourceKey, item.path, newFavoriteState);
          
          // Update local state
          set((state) => {
            const favorites = isFavorited
              ? state.favorites.filter(f => f.path !== item.path)
              : [...state.favorites, item];
            return { favorites };
          });

          // Update all cache entries
          updateFavoriteInAllCaches(sourceKey, item.path, newFavoriteState);
          
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

// Movie store
export const useMovieStore = create(
  persist(
    (set, get) => ({
      currentPath: '',
      allMovies: [],
      favorites: [],
      playerSettings: {
        volume: 1,
        autoplay: false,
        loop: false,
        quality: 'auto',
      },
      
      setCurrentPath: (path) => set({ currentPath: path }),
      setAllMovies: (movies) => set({ allMovies: movies }),
      setFavorites: (favorites) => set({ favorites }),
      
      updatePlayerSettings: (settings) => set((state) => ({
        playerSettings: { ...state.playerSettings, ...settings }
      })),
      
      clearMovieCache: () => set({ 
        allMovies: [], 
        currentPath: '',
        error: null 
      }),
      
      // Fetch favorites from API
      fetchFavorites: async () => {
        try {
          const { sourceKey } = useAuthStore.getState();
          const params = { key: sourceKey };
          const response = await apiService.movie.getFavorites(params);
          set({ favorites: response.data || [] });
        } catch (error) {
          console.error('Fetch movie favorites error:', error);
        }
      },
      
      toggleFavorite: async (item) => {
        try {
          const { sourceKey } = useAuthStore.getState();
          const isFavorited = get().favorites.some(f => f.path === item.path);
          const newFavoriteState = !isFavorited;
          
          // Call API to toggle favorite
          await apiService.movie.toggleFavorite(sourceKey, item.path, newFavoriteState);
          
          // Update local state
          set((state) => {
            const favorites = isFavorited
              ? state.favorites.filter(f => f.path !== item.path)
              : [...state.favorites, item];
            return { favorites };
          });

          // Update all cache entries
          updateFavoriteInAllCaches(sourceKey, item.path, newFavoriteState);
          
        } catch (error) {
          console.error('Toggle movie favorite error:', error);
        }
      },
    }),
    {
      name: 'movie-storage',
      partialize: (state) => ({
        recentViewed: state.recentViewed,
        favorites: state.favorites,
        playerSettings: state.playerSettings,
      }),
    }
  )
);

// Music store
export const useMusicStore = create(
  persist(
    (set, get) => ({
      currentTrack: null,
      currentPlaylist: [],
      currentIndex: 0,
      isPlaying: false,
      volume: 1,
      shuffle: false,
      repeat: 'none', // 'none', 'one', 'all'
      playlists: [],
      favorites: [],
      recentPlayed: [],
      
      // Player controls
      playTrack: (track, playlist = [], index = 0) => set({
        currentTrack: track,
        currentPlaylist: playlist,
        currentIndex: index,
        isPlaying: true,
      }),
      
      pauseTrack: () => set({ isPlaying: false }),
      resumeTrack: () => set({ isPlaying: true }),
      
      nextTrack: () => set((state) => {
        const { currentIndex, currentPlaylist, shuffle, repeat } = state;
        let nextIndex;
        
        if (shuffle) {
          nextIndex = Math.floor(Math.random() * currentPlaylist.length);
        } else {
          nextIndex = currentIndex + 1;
          if (nextIndex >= currentPlaylist.length) {
            nextIndex = repeat === 'all' ? 0 : currentIndex;
          }
        }
        
        return {
          currentIndex: nextIndex,
          currentTrack: currentPlaylist[nextIndex] || state.currentTrack,
        };
      }),
      
      prevTrack: () => set((state) => {
        const { currentIndex, currentPlaylist } = state;
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : currentPlaylist.length - 1;
        
        return {
          currentIndex: prevIndex,
          currentTrack: currentPlaylist[prevIndex] || state.currentTrack,
        };
      }),
      
      setVolume: (volume) => set({ volume }),
      toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),
      setRepeat: (repeat) => set({ repeat }),
      
      // Playlist management
      setPlaylists: (playlists) => set({ playlists }),
      addPlaylist: (playlist) => set((state) => ({
        playlists: [...state.playlists, playlist]
      })),
      
      updatePlaylist: (id, updates) => set((state) => ({
        playlists: state.playlists.map(p => p.id === id ? { ...p, ...updates } : p)
      })),
      
      deletePlaylist: (id) => set((state) => ({
        playlists: state.playlists.filter(p => p.id !== id)
      })),
      
      // Favorites and recent
      setFavorites: (favorites) => set({ favorites }),
      
      clearMusicCache: () => set({ 
        currentTrack: null,
        currentPlaylist: [],
        currentIndex: 0,
        isPlaying: false,
        playlists: [],
        error: null 
      }),
      
      // Fetch favorites from API
      fetchFavorites: async () => {
        try {
          const { sourceKey } = useAuthStore.getState();
          const params = { key: sourceKey };
          // Note: Music favorites API might not exist yet, so handle gracefully
          try {
            const response = await apiService.music.getFavorites?.(params);
            set({ favorites: response.data || [] });
          } catch {
            // Music favorites API not implemented yet, keep local storage
            console.warn('Music favorites API not implemented');
          }
        } catch (error) {
          console.error('Fetch music favorites error:', error);
        }
      },
      
      toggleFavorite: async (item) => {
        try {
          const { sourceKey } = useAuthStore.getState();
          const isFavorited = get().favorites.some(f => f.path === item.path);
          const newFavoriteState = !isFavorited;
          
          // Try to call API if it exists
          try {
            await apiService.music.toggleFavorite(sourceKey, item.path, newFavoriteState);
          } catch {
            // Music favorites API not implemented yet, just log
            console.warn('Music toggle favorite API not implemented');
          }
          
          // Update local state regardless
          set((state) => {
            const favorites = isFavorited
              ? state.favorites.filter(f => f.path !== item.path)
              : [...state.favorites, item];
            return { favorites };
          });

          // Update all cache entries
          updateFavoriteInAllCaches(sourceKey, item.path, newFavoriteState);
          
        } catch (error) {
          console.error('Toggle music favorite error:', error);
        }
      },
      
      addToRecentPlayed: (item) => set((state) => {
        const recent = state.recentPlayed.filter(r => r.path !== item.path);
        return { recentPlayed: [item, ...recent].slice(0, 50) };
      }),
    }),
    {
      name: 'music-storage',
      partialize: (state) => ({
        volume: state.volume,
        shuffle: state.shuffle,
        repeat: state.repeat,
        playlists: state.playlists,
        favorites: state.favorites,
        recentPlayed: state.recentPlayed,
      }),
    }
  )
);
