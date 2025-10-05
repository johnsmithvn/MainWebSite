// 📁 src/store/movieStore.js
// 🎬 Movie content management store

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiService } from '@/utils/api';
import { updateFavoriteInAllCaches } from '@/utils/favoriteCache';
import { getRecentViewedCacheKey } from '@/constants/cacheKeys';
import { processThumbnails } from '@/utils/thumbnailProcessor';
import { useAuthStore } from './authStore';

// Dedup map for in-flight fetches
const movieFetchInFlight = new Map();

/**
 * Movie Store
 * Manages movie folders, player state, favorites, and settings
 */
export const useMovieStore = create(
  persist(
    (set, get) => ({
      currentPath: '',
      movieList: [], // Current folder's movies/folders
      allMovies: [], // For backward compatibility
      favorites: [],
      loading: false,
      error: null,
      searchTerm: '',
      currentMovie: null, // For player
      favoritesRefreshTrigger: 0, // Add trigger for forcing slider refresh
      playerSettings: {
        volume: 1,
        autoplay: false,
        loop: false,
        quality: 'auto',
      },
      
      setCurrentPath: (path) => set({ currentPath: path }),
      setMovieList: (movieList) => set({ movieList, allMovies: movieList }), // Keep both for compatibility
      setAllMovies: (movies) => set({ allMovies: movies, movieList: movies }),
      setFavorites: (favorites) => set({ favorites }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setSearchTerm: (searchTerm) => set({ searchTerm }),
      setCurrentMovie: (movie) => set({ currentMovie: movie }),
      
      updatePlayerSettings: (settings) => set((state) => ({
        playerSettings: { ...state.playerSettings, ...settings }
      })),
      
      clearMovieCache: () => set({ 
        allMovies: [], 
        movieList: [],
        currentPath: '',
        error: null 
      }),
      
      // Fetch movie folders from API (similar to old loadMovieFolder)
      fetchMovieFolders: async (path = '') => {
        const { sourceKey } = useAuthStore.getState();
        const fetchKey = `${sourceKey || ''}|${path || ''}`;

        // If a fetch for this key is already in-flight, reuse it
        if (movieFetchInFlight.has(fetchKey)) {
          return movieFetchInFlight.get(fetchKey);
        }

        set({ loading: true, error: null });
        
        console.log('🎬 fetchMovieFolders called with:', { path, sourceKey });
        
        if (!sourceKey) {
          console.error('❌ No sourceKey found');
          set({ error: 'No source key selected', loading: false });
          return;
        }
        
        const doFetch = (async () => {
          try {
            const params = { key: sourceKey };
            if (path) params.path = path;
            
            console.log('🎬 API request params:', params);
            
            const response = await apiService.movie.getFolders(params);
            const data = response.data;
            
            
            const folders = data.folders || [];
            
            // Process folders to match expected format with thumbnail processing
            // Using unified thumbnailProcessor utility to handle path encoding and URL building
            const processedFolders = processThumbnails(folders, 'movie').map(folder => ({
              ...folder,
              isFavorite: !!folder.isFavorite
            }));
            
            set({ 
              movieList: processedFolders,
              allMovies: processedFolders, // Keep for compatibility
              currentPath: path,
              loading: false 
            });
            
          } catch (error) {
            console.error('Fetch movie folders error:', error);
            set({ error: error.response?.data?.message || error.message, loading: false });
          }
        })().finally(() => {
          movieFetchInFlight.delete(fetchKey);
        });

        movieFetchInFlight.set(fetchKey, doFetch);
        return doFetch;
      },
      
      // Fetch favorites from API
      fetchFavorites: async () => {
        try {
          const { sourceKey } = useAuthStore.getState();
          const params = { key: sourceKey };
          const response = await apiService.movie.getFavorites(params);
          
          // Process favorites with unified thumbnail processor
          const allFavorites = response.data || [];
          const favorites = processThumbnails(allFavorites, 'movie').map(item => ({
            ...item,
            favoriteDate: item.favoriteDate || (item.favoriteAt ? item.favoriteAt * 1000 : undefined)
          }));
          
          set({ favorites });
        } catch (error) {
          console.error('Fetch movie favorites error:', error);
          set({ error: error.response?.data?.message || error.message });
        }
      },
      
      toggleFavorite: async (item) => {
        try {
          const { sourceKey } = useAuthStore.getState();
          const isFavorited = get().favorites.some(f => f.path === item.path);
          const newFavoriteState = !isFavorited;
          
          console.log('🎬 MovieStore toggleFavorite:', { sourceKey, path: item.path, newFavoriteState });
          
          // Call API to toggle favorite (note: API expects dbkey not key)
          const resp = await apiService.movie.toggleFavorite(sourceKey, item.path, newFavoriteState);
          
          // Update local state
          set((state) => {
            const favorites = isFavorited
              ? state.favorites.filter(f => f.path !== item.path)
              : [...state.favorites, { ...item, isFavorite: true, favoriteDate: Date.now() }];
            
            // Also update the item in movieList if it exists
            const updatedMovieList = state.movieList.map(movie => 
              movie.path === item.path 
                ? { ...movie, isFavorite: newFavoriteState, favoriteDate: newFavoriteState ? Date.now() : movie.favoriteDate }
                : movie
            );
            
            return { 
              favorites,
              movieList: updatedMovieList,
              allMovies: updatedMovieList, // Keep in sync
              favoritesRefreshTrigger: state.favoritesRefreshTrigger + 1 // Trigger refresh
            };
          });

          // Update all cache entries - ensure caches reflect new favorite state
          const { rootFolder } = useAuthStore.getState();
          updateFavoriteInAllCaches(sourceKey, item.path, newFavoriteState, rootFolder);

          console.log('✅ MovieStore toggleFavorite completed');
          
        } catch (error) {
          console.error('Toggle movie favorite error:', error);
          set({ error: error.response?.data?.message || error.message });
        }
      },
      
      // Remove favorite
      removeFavorite: async (item) => {
        try {
          const { sourceKey } = useAuthStore.getState();
          
          // Call API to remove favorite
          await apiService.movie.toggleFavorite(sourceKey, item.path, false);
          
          // Update local state
          set((state) => ({
            favorites: state.favorites.filter(f => f.path !== item.path)
          }));
          
        } catch (error) {
          console.error('Remove movie favorite error:', error);
          set({ error: error.response?.data?.message || error.message });
        }
      },
      
      // Clear recent history for movies
      clearRecentHistory: () => {
        const { sourceKey } = useAuthStore.getState();
        try {
          const cacheKey = getRecentViewedCacheKey('movie', sourceKey);
          localStorage.removeItem(cacheKey);
          console.log('🎬 Movie recent history cleared');
        } catch (error) {
          console.error('Error clearing movie recent history:', error);
        }
      },
    }),
    {
      name: 'movie-storage',
      partialize: (state) => ({
        favorites: state.favorites,
        playerSettings: state.playerSettings,
        currentPath: state.currentPath,
      }),
    }
  )
);
