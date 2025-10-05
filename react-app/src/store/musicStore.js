// 📁 src/store/musicStore.js
// 🎵 Music content management and player store

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiService } from '@/utils/api';
import { getRecentViewedCacheKey } from '@/constants/cacheKeys';
import { processThumbnails } from '@/utils/thumbnailProcessor';
import { useAuthStore } from './authStore';

// Dedup map for in-flight fetches
const musicFetchInFlight = new Map();

/**
 * Music Store
 * Manages music folders, player state, playlists, and settings
 */
export const useMusicStore = create(
  persist(
    (set, get) => ({
      // Music browser state (similar to movie store)
      currentPath: '',
      musicList: [], // Current folder's music/folders
      allMusic: [], // For backward compatibility
      loading: false,
      error: null,
      searchTerm: '',
      
      // Player state
      currentTrack: null,
      currentPlaylist: [],
      currentIndex: 0,
      isPlaying: false,
      volume: 1,
      shuffle: false,
      repeat: 'none', // 'none', 'one', 'all'
      playlists: [],
      recentPlayed: [],
      playerSettings: {
        volume: 1,
        autoplay: false,
        loop: false,
        quality: 'auto',
        // UI variant for music player: 'v1' (Spotify-like) or 'v2' (Zing-like)
        playerUI: 'v1',
      },
      
      // Music browser methods (similar to movie store)
      setCurrentPath: (path) => set({ currentPath: path }),
      setMusicList: (musicList) => set({ musicList, allMusic: musicList }), // Keep both for compatibility
      setAllMusic: (music) => set({ allMusic: music, musicList: music }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setSearchTerm: (searchTerm) => set({ searchTerm }),
      setCurrentMusic: (music) => set({ currentMusic: music }),
      
      updatePlayerSettings: (settings) => set((state) => ({
        playerSettings: { ...state.playerSettings, ...settings }
      })),
      
      clearMusicCache: () => set({ 
        allMusic: [], 
        musicList: [],
        currentPath: '',
        error: null 
      }),
      
      // Fetch music folders from API (similar to old loadMusicFolder)
      fetchMusicFolders: async (path = '') => {
        const { sourceKey } = useAuthStore.getState();
        const fetchKey = `${sourceKey || ''}|${path || ''}`;

        // If a fetch for this key is already in-flight, reuse it
        if (musicFetchInFlight.has(fetchKey)) {
          return musicFetchInFlight.get(fetchKey);
        }

        set({ loading: true, error: null });

        console.log('🎵 fetchMusicFolders called with:', { path, sourceKey });
        if (!sourceKey) {
          console.error('❌ No sourceKey found');
          set({ error: 'No source key selected', loading: false });
          return;
        }

        const doFetch = (async () => {
          try {
            const params = { key: sourceKey };
            if (path) params.path = path;
            console.log('🎵 API request params:', params);

            const response = await apiService.music.getFolders(params);
            const data = response.data;

            const folders = data.folders || [];
            // Process folders with unified thumbnail processor for music
            const processedFolders = processThumbnails(folders, 'music').map(folder => ({
              ...folder,
              isFavorite: !!folder.isFavorite
            }));

            set({ 
              musicList: processedFolders,
              currentPath: path,
              loading: false 
            });
          } catch (error) {
            console.error('Fetch music folders error:', error);
            set({ error: error.response?.data?.message || error.message, loading: false });
          }
        })().finally(() => {
          musicFetchInFlight.delete(fetchKey);
        });

        musicFetchInFlight.set(fetchKey, doFetch);
        return doFetch;
      },
      
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
        let nextIndex = currentIndex + 1;
        // When shuffle is ON, currentPlaylist is pre-shuffled; advance sequentially to match UI order
        if (!shuffle) {
          // non-shuffle: same sequential logic
          if (nextIndex >= currentPlaylist.length) {
            nextIndex = repeat === 'all' ? 0 : currentIndex;
          }
        } else {
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
      setShuffle: (shuffle) => set({ shuffle }),
      
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
      
      // Clear recent history for music
      clearRecentHistory: () => {
        const { sourceKey } = useAuthStore.getState();
        try {
          const cacheKey = getRecentViewedCacheKey('music', sourceKey);
          localStorage.removeItem(cacheKey);
          console.log('🎵 Music recent history cleared');
        } catch (error) {
          console.error('Error clearing music recent history:', error);
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
        recentPlayed: state.recentPlayed,
        playerSettings: state.playerSettings,
        currentPath: state.currentPath,
      }),
    }
  )
);
