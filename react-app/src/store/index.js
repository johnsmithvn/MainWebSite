// 📁 src/store/index.js
// 🏪 Global state management with Zustand

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/constants';

// Auth store
export const useAuthStore = create(
  persist(
    (set, get) => ({
      sourceKey: '',
      rootFolder: '',
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
      readerSettings: {
        mode: 'vertical',
        darkMode: false,
        zoom: 1,
        autoNext: false,
      },
      
      setCurrentPath: (path) => set({ currentPath: path }),
      setAllFolders: (folders) => set({ allFolders: folders }),
      setMangaList: (mangaList) => set({ mangaList }),
      setFavorites: (favorites) => set({ favorites }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setSearchTerm: (searchTerm) => set({ searchTerm }),
      
      // Fetch manga folders from API
      fetchMangaFolders: async (path = '') => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/manga/scan?path=${encodeURIComponent(path)}`);
          if (!response.ok) throw new Error('Failed to fetch manga folders');
          const data = await response.json();
          set({ 
            mangaList: data.folders || [],
            currentPath: path,
            loading: false 
          });
        } catch (error) {
          set({ error: error.message, loading: false });
        }
      },
      
      // Fetch favorites from API
      fetchFavorites: async () => {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/manga/favorite`);
          if (!response.ok) throw new Error('Failed to fetch favorites');
          const data = await response.json();
          set({ favorites: data.favorites || [] });
        } catch (error) {
          set({ error: error.message });
        }
      },
      
      addToRecentViewed: (item) => set((state) => {
        const recent = state.recentViewed.filter(r => r.path !== item.path);
        return { recentViewed: [item, ...recent].slice(0, 20) };
      }),
      
      updateReaderSettings: (settings) => set((state) => ({
        readerSettings: { ...state.readerSettings, ...settings }
      })),
      
      toggleFavorite: (item) => set((state) => {
        const isFavorited = state.favorites.some(f => f.path === item.path);
        const favorites = isFavorited
          ? state.favorites.filter(f => f.path !== item.path)
          : [...state.favorites, item];
        return { favorites };
      }),
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
      
      toggleFavorite: (item) => set((state) => {
        const isFavorited = state.favorites.some(f => f.path === item.path);
        const favorites = isFavorited
          ? state.favorites.filter(f => f.path !== item.path)
          : [...state.favorites, item];
        return { favorites };
      }),
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
      
      toggleFavorite: (item) => set((state) => {
        const isFavorited = state.favorites.some(f => f.path === item.path);
        const favorites = isFavorited
          ? state.favorites.filter(f => f.path !== item.path)
          : [...state.favorites, item];
        return { favorites };
      }),
      
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
