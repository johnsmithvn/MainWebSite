// 📁 src/store/authStore.js
// 🔐 Authentication and source key management store

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Helper: Infer content type from key prefix
 * @param {string} sourceKey - Database key (ROOT_*, V_*, M_*)
 * @returns {'manga'|'movie'|'music'|null}
 */
const getTypeFromKey = (sourceKey = '') => {
  if (!sourceKey) return null;
  if (sourceKey.startsWith('ROOT_')) return 'manga';
  if (sourceKey.startsWith('V_')) return 'movie';
  if (sourceKey.startsWith('M_')) return 'music';
  return null;
};

/**
 * Auth Store
 * Manages authentication state, source keys, and last-used keys per content type
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      sourceKey: '',
      rootFolder: '',
      token: '',
      isAuthenticated: false,
      secureKeys: [],
      // Last-used keys per content type
      lastMangaKey: '',
      lastMovieKey: '',
      lastMusicKey: '',
      // Manga-specific last selected root folder (empty string when none)
      lastMangaRootFolder: '',
      
      setSourceKey: (sourceKey) => {
        const updates = { sourceKey };
        const type = getTypeFromKey(sourceKey);
        if (type === 'manga') {
          updates.lastMangaKey = sourceKey;
        } else if (type === 'movie') {
          updates.lastMovieKey = sourceKey;
        } else if (type === 'music') {
          updates.lastMusicKey = sourceKey;
        }
        set(updates);
      },
      
      setRootFolder: (rootFolder) => set({ rootFolder }),
      setLastMangaRootFolder: (folder) => set({ lastMangaRootFolder: folder }),
      setToken: (token) => set({ token, isAuthenticated: !!token }),
      
      // Debug watcher utility (optional usage in components)
      _debugAuth: () => {
        const s = get();
        console.log('[AUTH DEBUG]', { token: s.token, isAuthenticated: s.isAuthenticated, sourceKey: s.sourceKey });
      },
      
      setSecureKeys: (secureKeys) => set({ secureKeys }),
      
      login: (sourceKey, token) => {
        // Record last key for its type; do not auto-set rootFolder here
        const type = getTypeFromKey(sourceKey);
        const updates = { sourceKey, token, isAuthenticated: true };
        if (type === 'manga') updates.lastMangaKey = sourceKey;
        if (type === 'movie') updates.lastMovieKey = sourceKey;
        if (type === 'music') updates.lastMusicKey = sourceKey;
        try { localStorage.setItem('userToken', token); } catch {}
        set(updates);
      },
      
      logout: () => {
        try { localStorage.removeItem('userToken'); } catch {}
        set({ 
          sourceKey: '', 
          rootFolder: '', 
          token: '', 
          isAuthenticated: false 
        });
      },

      // Clear all last keys (for debugging/testing)
      clearLastKeys: () => set({
        lastMangaKey: '',
        lastMovieKey: '',
        lastMusicKey: '',
        lastMangaRootFolder: ''
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
        lastMangaKey: state.lastMangaKey,
        lastMovieKey: state.lastMovieKey,
        lastMusicKey: state.lastMusicKey,
        lastMangaRootFolder: state.lastMangaRootFolder,
      }),
      onRehydrateStorage: () => (state) => {
        // No auto-mapping of rootFolder from sourceKey; rely on explicit selection (especially for manga)
        if (state && (state.rootFolder === undefined || state.rootFolder === null)) {
          state.rootFolder = '';
        }
        // Normalize lastMangaRootFolder to empty string for consistency
        if (state && (state.lastMangaRootFolder === null || state.lastMangaRootFolder === undefined)) {
          state.lastMangaRootFolder = '';
        }
        try {
          const token = localStorage.getItem('userToken');
          if (token && !state?.token) {
            // Ensure store reflects existing token
            useAuthStore.setState({ token, isAuthenticated: true });
          }
        } catch {}
      },
    }
  )
);
