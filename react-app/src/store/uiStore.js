// 📁 src/store/uiStore.js
// 🎨 UI state management store (theme, sidebar, modals, toasts)

import { create } from 'zustand';

/**
 * UI Store
 * Manages global UI state: dark mode, sidebar, search, loading, animations, toasts
 */
export const useUIStore = create((set) => ({
  darkMode: false,
  sidebarOpen: false, // Default to closed
  searchOpen: false,
  searchModalOpen: false,
  loading: false,
  animationsEnabled: true,
  toast: {
    show: false,
    message: '',
    type: 'info', // 'success', 'error', 'warning', 'info'
    duration: 3000,
  },
  
  // Toggle methods
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleSearch: () => set((state) => ({ searchOpen: !state.searchOpen })),
  toggleSearchModal: () => set((state) => ({ searchModalOpen: !state.searchModalOpen })),
  toggleAnimations: () => set((state) => ({ animationsEnabled: !state.animationsEnabled })),
  
  // Setter methods
  setLoading: (loading) => set({ loading }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  
  // Toast methods
  showToast: (message, type = 'info', duration = 3000) => set({
    toast: { show: true, message, type, duration }
  }),
  hideToast: () => set((state) => ({
    toast: { ...state.toast, show: false }
  })),
}));
