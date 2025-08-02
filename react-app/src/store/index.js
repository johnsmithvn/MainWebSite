// 📁 src/store/index.js
// 🏪 Global state management with Zustand

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/constants';
import { apiService } from '@/utils/api';

// Auth store
export const useAuthStore = create(
  persist(
    (set, get) => ({
      sourceKey: 'ROOT_FANTASY', // Default for testing
      rootFolder: 'Naruto', // Default for testing  
      token: '',
      isAuthenticated: false,
      secureKeys: [],
      
      setSourceKey: (sourceKey) => set({ sourceKey }),
      setRootFolder: (rootFolder) => set({ rootFolder }),
      setToken: (token) => set({ token, isAuthenticated: !!token }),
      setSecureKeys: (secureKeys) => set({ secureKeys }),
      
      login: (sourceKey, token) => set({ 
        sourceKey, 
        token, 
        isAuthenticated: true 
      }),
      
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
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        sourceKey: state.sourceKey,
        rootFolder: state.rootFolder,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// UI store
export const useUIStore = create((set) => ({
  darkMode: false,
  sidebarOpen: false,
  searchOpen: false,
  loading: false,
  
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleSearch: () => set((state) => ({ searchOpen: !state.searchOpen })),
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
      recentViewed: [],
      loading: false,
      error: null,
      searchTerm: '',
      shouldNavigateToReader: null, // Flag for reader navigation
      readerSettings: {
        readingMode: 'vertical',
        darkMode: false,
        zoomLevel: 100,
        autoNext: false,
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
        try {
          const { sourceKey, rootFolder } = useAuthStore.getState();
          const params = {
            mode: 'path',
            key: sourceKey,
            root: rootFolder,
            path: path,
            useDb: '1'
          };
          const response = await apiService.manga.getFolders(params);
          const data = response.data;
          
          console.log('🔍 API Response:', data); // Debug API response
          
          // Helper function để xử lý URL encoding - đơn giản hóa
          const cleanImageUrl = (url) => {
            if (!url || typeof url !== 'string') return url;
            
            // Nếu URL đã có protocol thì return luôn
            if (url.startsWith('http') || url.startsWith('/default/')) return url;
            
            // Trả về URL gốc để let server xử lý decoding
            return url;
          };
          
          // Process the response similar to original folder.js
          let folders = [];
          if (data.type === 'folder') {
            // ONLY create selfReader when current folder has images (like frontend line 81-92)
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
            
            // Add subfolders - just concat data.folders (like frontend line 94)
            // DON'T create additional selfReader entries for subfolders
            if (data.folders && data.folders.length > 0) {
              for (const folder of data.folders) {
                // Skip invalid folder data
                if (!folder.path || folder.path === '()' || folder.path === '' || 
                    !folder.name || folder.name === '()') {
                  console.warn('⚠️ Skipping invalid folder:', {
                    name: folder.name,
                    path: folder.path,
                    fullObject: folder
                  });
                  continue;
                }
                
                // Just add the folder as-is, no additional processing
                folders.push({
                  ...folder,
                  thumbnail: cleanImageUrl(folder.thumbnail),
                  // These folders are NOT selfReaders, they're normal folders
                  isSelfReader: false,
                  hasImages: false // Don't assume they have images
                });
              }
            }
          } else if (data.type === 'reader') {
            // Handle reader type - theo frontend line 122-126: redirect to reader.html
            console.log('🔄 API returned reader type, navigating to reader...');
            // Trong React, sử dụng navigate() thay vì window.location.href
            // Note: không thể dùng navigate() trực tiếp trong store, cần return flag
            set({ 
              mangaList: [], // Clear list để trigger navigation
              currentPath: path,
              loading: false,
              shouldNavigateToReader: path // Flag để component detect và navigate
            });
            return; // Early return để không process folders
          }
          
          console.log('📁 Processed folders:', folders); // Debug processed folders
          
          // Debug empty folders
          if (folders.length === 0) {
            console.warn('⚠️ No folders found for path:', path);
            console.log('API data type:', data.type);
            console.log('Has images:', data.images?.length || 0);
            console.log('Has folders:', data.folders?.length || 0);
          }
          
          set({ 
            mangaList: folders,
            currentPath: path,
            loading: false 
          });
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
      
      addToRecentViewed: (item) => set((state) => {
        const recent = state.recentViewed.filter(r => r.path !== item.path);
        return { recentViewed: [item, ...recent].slice(0, 20) };
      }),
      
      updateReaderSettings: (settings) => set((state) => ({
        readerSettings: { ...state.readerSettings, ...settings }
      })),
      
      toggleFavorite: async (item) => {
        try {
          const { sourceKey } = useAuthStore.getState();
          const isFavorited = get().favorites.some(f => f.path === item.path);
          
          // Call API to toggle favorite
          await apiService.manga.toggleFavorite(sourceKey, item.path, !isFavorited);
          
          // Update local state
          set((state) => {
            const favorites = isFavorited
              ? state.favorites.filter(f => f.path !== item.path)
              : [...state.favorites, item];
            return { favorites };
          });
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
      recentViewed: [],
      playerSettings: {
        volume: 1,
        autoplay: false,
        loop: false,
        quality: 'auto',
      },
      
      setCurrentPath: (path) => set({ currentPath: path }),
      setAllMovies: (movies) => set({ allMovies: movies }),
      setFavorites: (favorites) => set({ favorites }),
      
      addToRecentViewed: (item) => set((state) => {
        const recent = state.recentViewed.filter(r => r.path !== item.path);
        return { recentViewed: [item, ...recent].slice(0, 20) };
      }),
      
      updatePlayerSettings: (settings) => set((state) => ({
        playerSettings: { ...state.playerSettings, ...settings }
      })),
      
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
          
          // Call API to toggle favorite
          await apiService.movie.toggleFavorite(item.path, sourceKey);
          
          // Update local state
          set((state) => {
            const favorites = isFavorited
              ? state.favorites.filter(f => f.path !== item.path)
              : [...state.favorites, item];
            return { favorites };
          });
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
          
          // Try to call API if it exists
          try {
            await apiService.music.toggleFavorite?.(item.path, sourceKey);
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
