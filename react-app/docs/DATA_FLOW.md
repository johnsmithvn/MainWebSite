# Data Flow Documentation - MainWebSite React

This document provides a comprehensive overview of data flow patterns, state management, and data synchronization strategies implemented in the MainWebSite React application.

## 🔄 Data Flow Architecture Overview

### High-Level Data Flow Pattern
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Action   │ →  │  Component      │ →  │  Store Action   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  UI Re-render   │ ←  │  Store Update   │ ←  │   API Call      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                       ┌─────────────────┐    ┌─────────────────┐
                       │  Cache Update   │ ←  │ Backend Response│
                       └─────────────────┘    └─────────────────┘
```

### Core Data Flow Principles
1. **Unidirectional Flow**: Data flows in one direction from actions to UI
2. **Single Source of Truth**: Each piece of state has one authoritative source
3. **Immutable Updates**: State changes through pure functions
4. **Reactive Updates**: UI automatically reflects state changes
5. **Optimistic Updates**: Immediate UI feedback with rollback capability

## 🏪 State Management Architecture

### Store Structure Overview
```javascript
// Global State Architecture
┌─────────────────────────────────────────────────────────────┐
│                    Global State (Zustand)                  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Auth Store  │  │  UI Store   │  │Shared Store │        │
│  │             │  │             │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │Manga Store  │  │Movie Store  │  │Music Store  │        │
│  │             │  │             │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### 1. Authentication Store (useAuthStore)

#### State Structure
```javascript
{
  // Core authentication
  sourceKey: '',           // Current selected source
  rootFolder: '',          // Manga root folder selection
  token: '',              // Authentication token
  isAuthenticated: false, // Authentication status
  
  // Security
  secureKeys: [],         // List of secure source keys
  
  // Last used keys per content type
  lastMangaKey: '',       // Last manga source
  lastMovieKey: '',       // Last movie source  
  lastMusicKey: '',       // Last music source
  lastMangaRootFolder: '' // Last manga root folder
}
```

#### Data Flow Pattern
```javascript
// Authentication Flow
User Login → setSourceKey() → API Validation → Store Update → Route Navigation

// Example Flow
1. User selects source key
2. Check if secure key (requires authentication)
3. Show login modal if needed
4. Validate credentials with backend
5. Store token and authentication state
6. Navigate to appropriate content section
```

#### Key Actions & Data Flow
```javascript
// Login Flow
login: (sourceKey, token) => {
  // 1. Determine content type from key
  const type = getKeyType(sourceKey);
  
  // 2. Update store state
  set({
    sourceKey,
    token,
    isAuthenticated: true,
    [`last${type}Key`]: sourceKey // Dynamic key update
  });
  
  // 3. Persist token
  localStorage.setItem('userToken', token);
}

// Logout Flow  
logout: () => {
  // 1. Clear authentication state
  set({
    sourceKey: '',
    rootFolder: '',
    token: '',
    isAuthenticated: false
  });
  
  // 2. Clear persisted data
  localStorage.removeItem('userToken');
}
```

### 2. UI Store (useUIStore)

#### State Structure
```javascript
{
  // Theme & Appearance
  darkMode: false,
  animationsEnabled: true,
  
  // Navigation & Layout
  sidebarOpen: false,
  searchOpen: false,
  searchModalOpen: false,
  
  // Application State
  loading: false,
  
  // Toast Notifications
  toast: {
    show: false,
    message: '',
    type: 'info',
    duration: 3000
  }
}
```

#### Data Flow Pattern
```javascript
// Theme Toggle Flow
User Click → toggleDarkMode() → Store Update → DOM Class Update → CSS Re-render

// Toast Notification Flow
Action Result → showToast() → Store Update → Toast Component → Auto Hide Timer
```

### 3. Content Stores (Manga/Movie/Music)

#### Common State Pattern
```javascript
{
  // Content Data
  currentPath: '',        // Current folder path
  contentList: [],        // Current folder contents
  favorites: [],          // User favorites
  
  // UI State
  loading: false,         // Loading indicator
  error: null,           // Error state
  searchTerm: '',        // Search query
  
  // Settings
  settings: {},          // Content-specific settings
  
  // Cache Management
  favoritesRefreshTrigger: 0 // Force refresh trigger
}
```

## 📊 Data Flow Patterns by Feature

### 1. Content Loading Flow

#### Manga Folder Loading
```javascript
// Data Flow: Manga Folder Loading
User Navigation → fetchMangaFolders() → Cache Check → API Call → Process Data → Update Store

// Detailed Flow
fetchMangaFolders: async (path = '') => {
  // 1. Set loading state
  set({ loading: true, error: null });
  
  // 2. Get authentication context
  const { sourceKey, rootFolder } = useAuthStore.getState();
  
  // 3. Check cache first
  const cachedData = getMangaCache(sourceKey, rootFolder, path);
  if (cachedData) {
    set({ 
      mangaList: cachedData.mangaList,
      currentPath: path,
      loading: false 
    });
    return; // Early return with cached data
  }
  
  // 4. Make API call
  try {
    const response = await apiService.manga.getFolders({
      mode: 'path',
      key: sourceKey,
      root: rootFolder,
      path: path,
      useDb: mangaSettings.useDb ? '1' : '0'
    });
    
    // 5. Process response data
    const processedData = processApiResponse(response.data);
    
    // 6. Update store state
    set({ 
      mangaList: processedData,
      currentPath: path,
      loading: false 
    });
    
    // 7. Update cache
    setMangaCache(sourceKey, rootFolder, path, { mangaList: processedData });
    
  } catch (error) {
    // 8. Handle errors
    set({ error: error.message, loading: false });
  }
}
```

### 2. Favorite Management Flow

#### Toggle Favorite Pattern
```javascript
// Data Flow: Favorite Toggle
User Click → toggleFavorite() → Optimistic Update → API Call → Confirm/Rollback → Cache Update

// Implementation
toggleFavorite: async (item) => {
  const { sourceKey, rootFolder } = useAuthStore.getState();
  const currentFavorites = get().favorites;
  const isFavorited = currentFavorites.some(f => f.path === item.path);
  const newFavoriteState = !isFavorited;
  
  // 1. Optimistic update
  set((state) => {
    const updatedFavorites = isFavorited
      ? state.favorites.filter(f => f.path !== item.path)
      : [...state.favorites, item];
    
    const updatedContentList = state.mangaList.map(manga => 
      manga.path === item.path 
        ? { ...manga, isFavorite: newFavoriteState }
        : manga
    );
    
    return { 
      favorites: updatedFavorites,
      mangaList: updatedContentList,
      favoritesRefreshTrigger: state.favoritesRefreshTrigger + 1
    };
  });
  
  try {
    // 2. API call to persist change
    await apiService.manga.toggleFavorite(sourceKey, item.path, newFavoriteState);
    
    // 3. Update all related caches
    updateFavoriteInAllCaches(sourceKey, item.path, newFavoriteState, rootFolder);
    
  } catch (error) {
    // 4. Rollback on error
    set((state) => {
      const rolledBackFavorites = isFavorited
        ? [...state.favorites, item]
        : state.favorites.filter(f => f.path !== item.path);
      
      return { 
        favorites: rolledBackFavorites,
        error: error.message 
      };
    });
  }
}
```

### 3. Search & Discovery Flow

#### Search Data Flow
```javascript
// Data Flow: Search
User Input → Debounced Search → API Call → Results Processing → UI Update

// Search implementation with debouncing
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearchTerm = useDebounce(searchTerm, 300);

useEffect(() => {
  if (debouncedSearchTerm.length >= 2) {
    performSearch(debouncedSearchTerm);
  }
}, [debouncedSearchTerm]);

const performSearch = async (term) => {
  try {
    const results = await apiService.search({
      query: term,
      type: 'all',
      limit: 50
    });
    
    setSearchResults(results.data);
  } catch (error) {
    console.error('Search error:', error);
  }
};
```

## 🔄 Cache Management Strategy

### Multi-Level Caching Architecture
```javascript
// Cache Hierarchy
┌─────────────────┐
│  Component      │ ← React Query Cache (Server State)
│  Local State    │
└─────────────────┘
         │
┌─────────────────┐
│  Zustand Store  │ ← Application State Cache
│  Persistent     │
└─────────────────┘
         │
┌─────────────────┐
│  localStorage   │ ← Browser Storage Cache
│  Cache          │
└─────────────────┘
         │
┌─────────────────┐
│  API Response   │ ← HTTP Response Cache
│  Cache          │
└─────────────────┘
```

### Cache Key Strategy
```javascript
// Cache Key Generation
const getCacheKey = (type, sourceKey, additionalParams = {}) => {
  const baseKey = `${CACHE_PREFIXES[type]}::${sourceKey}`;
  
  if (Object.keys(additionalParams).length > 0) {
    const paramString = Object.entries(additionalParams)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('::');
    return `${baseKey}::${paramString}`;
  }
  
  return baseKey;
};

// Example usage
const mangaCacheKey = getCacheKey('MANGA_FOLDER', sourceKey, { 
  root: rootFolder, 
  path: currentPath 
});
```

### Cache Invalidation Strategy
```javascript
// Cache Invalidation Patterns
const invalidateRelatedCaches = (sourceKey, itemPath, action) => {
  switch (action) {
    case 'FAVORITE_TOGGLE':
      // Invalidate all caches that might contain this item
      invalidateFavoritesCaches(sourceKey);
      invalidateRandomCaches(sourceKey);
      invalidateRecentCaches(sourceKey);
      break;
      
    case 'CONTENT_UPDATE':
      // Invalidate folder caches
      invalidateFolderCaches(sourceKey, itemPath);
      break;
      
    case 'SETTINGS_CHANGE':
      // Clear all caches for source
      clearAllCachesForSource(sourceKey);
      break;
  }
};
```

## 🔗 API Integration Data Flow

### Request Deduplication Pattern
```javascript
// In-flight request management
const inflightGet = new Map();
const recentGetCache = new Map();

const apiGet = async (url, params) => {
  const cacheKey = buildCacheKey(url, params);
  
  // 1. Check recent cache
  const cached = recentGetCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return Promise.resolve({ data: cached.data });
  }
  
  // 2. Check in-flight requests
  if (inflightGet.has(cacheKey)) {
    return inflightGet.get(cacheKey);
  }
  
  // 3. Make new request
  const request = axios.get(url, { params })
    .then(response => {
      // Cache successful response
      recentGetCache.set(cacheKey, {
        ts: Date.now(),
        data: response.data
      });
      return response;
    })
    .finally(() => {
      // Clean up in-flight tracking
      inflightGet.delete(cacheKey);
    });
  
  inflightGet.set(cacheKey, request);
  return request;
};
```

### Error Handling Data Flow
```javascript
// Error Handling Pattern
const handleApiError = (error, context) => {
  // 1. Log error for debugging
  console.error(`API Error in ${context}:`, error);
  
  // 2. Extract user-friendly message
  const message = error.response?.data?.message || error.message || 'Unknown error';
  
  // 3. Update store with error state
  set({ 
    error: message, 
    loading: false 
  });
  
  // 4. Show user notification
  const { showToast } = useUIStore.getState();
  showToast(message, 'error');
  
  // 5. Handle specific error types
  if (error.response?.status === 401) {
    // Unauthorized - clear auth and redirect
    const { logout } = useAuthStore.getState();
    logout();
    window.location.href = '/';
  }
};
```

## 🎵 Media Player Data Flow

### Music Player State Management
```javascript
// Music Player Data Flow
User Action → Player Store → Audio Element → State Sync → UI Update

// Player state structure
{
  // Playback State
  currentTrack: null,
  currentPlaylist: [],
  currentIndex: 0,
  isPlaying: false,
  
  // Audio Settings
  volume: 1,
  shuffle: false,
  repeat: 'none', // 'none', 'one', 'all'
  
  // Queue Management
  queue: [],
  history: []
}

// Play track flow
playTrack: (track, playlist = [], index = 0) => {
  // 1. Update player state
  set({
    currentTrack: track,
    currentPlaylist: playlist,
    currentIndex: index,
    isPlaying: true
  });
  
  // 2. Add to recent played
  addToRecentPlayed(track);
  
  // 3. Update view count
  apiService.system.increaseView({ 
    type: 'music', 
    path: track.path 
  });
}
```

### Video Player Data Flow
```javascript
// Video Player Integration
Component Mount → Load Video Data → Initialize Player → Sync State

// Player initialization
useEffect(() => {
  const initializePlayer = async () => {
    try {
      // 1. Get video metadata
      const videoData = await apiService.movie.getVideoCache({
        key: sourceKey,
        path: videoPath
      });
      
      // 2. Set up player configuration
      setPlayerConfig({
        url: videoData.streamUrl,
        controls: true,
        volume: playerSettings.volume,
        autoplay: playerSettings.autoplay
      });
      
      // 3. Update view count
      await apiService.system.increaseViewMovie({
        key: sourceKey,
        path: videoPath
      });
      
    } catch (error) {
      handlePlayerError(error);
    }
  };
  
  initializePlayer();
}, [sourceKey, videoPath]);
```

## 🔄 Real-time Data Synchronization

### Optimistic Updates Pattern
```javascript
// Optimistic Update Implementation
const optimisticUpdate = async (action, optimisticState, apiCall, rollbackState) => {
  // 1. Apply optimistic update immediately
  set(optimisticState);
  
  try {
    // 2. Make API call
    const result = await apiCall();
    
    // 3. Confirm update with server response
    set(state => ({
      ...state,
      ...result.data
    }));
    
  } catch (error) {
    // 4. Rollback on failure
    set(rollbackState);
    
    // 5. Show error to user
    showToast('Action failed, changes reverted', 'error');
  }
};
```

### State Synchronization Across Components
```javascript
// Cross-component state sync using Zustand
const useContentSync = (contentType) => {
  const store = contentType === 'manga' ? useMangaStore : 
                contentType === 'movie' ? useMovieStore : 
                useMusicStore;
  
  // Subscribe to relevant state changes
  const favorites = store(state => state.favorites);
  const refreshTrigger = store(state => state.favoritesRefreshTrigger);
  
  // Re-fetch data when trigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      // Refresh related components
      store.getState().fetchFavorites();
    }
  }, [refreshTrigger]);
  
  return { favorites };
};
```

## 📱 Responsive Data Loading

### Progressive Data Loading
```javascript
// Progressive loading strategy
const useProgressiveLoading = (contentType, path) => {
  const [loadingState, setLoadingState] = useState({
    initial: true,
    thumbnails: false,
    metadata: false,
    complete: false
  });
  
  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Load basic structure first
        const basicData = await loadBasicContent(contentType, path);
        setContent(basicData);
        setLoadingState(prev => ({ ...prev, initial: false }));
        
        // 2. Load thumbnails in background
        const thumbnailData = await loadThumbnails(basicData);
        setContent(prev => ({ ...prev, ...thumbnailData }));
        setLoadingState(prev => ({ ...prev, thumbnails: true }));
        
        // 3. Load additional metadata
        const metaData = await loadMetadata(basicData);
        setContent(prev => ({ ...prev, ...metaData }));
        setLoadingState(prev => ({ ...prev, metadata: true, complete: true }));
        
      } catch (error) {
        handleLoadingError(error);
      }
    };
    
    loadData();
  }, [contentType, path]);
  
  return { content, loadingState };
};
```

## 🎯 Performance Optimization Data Flow

### Virtual Scrolling Data Management
```javascript
// Virtual scrolling with data windowing
const useVirtualizedData = (allItems, windowSize = 50) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: windowSize });
  const [visibleItems, setVisibleItems] = useState([]);
  
  useEffect(() => {
    const startIndex = Math.max(0, visibleRange.start - 10); // Buffer
    const endIndex = Math.min(allItems.length, visibleRange.end + 10);
    
    setVisibleItems(allItems.slice(startIndex, endIndex));
  }, [allItems, visibleRange]);
  
  return { visibleItems, setVisibleRange };
};
```

### Lazy Loading Data Strategy
```javascript
// Intersection observer for lazy loading
const useLazyLoading = (items) => {
  const [loadedItems, setLoadedItems] = useState(new Set());
  
  const loadItem = useCallback(async (item) => {
    if (loadedItems.has(item.id)) return;
    
    try {
      const detailedData = await apiService.getItemDetails(item.id);
      setLoadedItems(prev => new Set([...prev, item.id]));
      
      // Update item in store
      updateItemInStore(item.id, detailedData);
      
    } catch (error) {
      console.error('Failed to load item:', error);
    }
  }, [loadedItems]);
  
  return { loadItem, isLoaded: (id) => loadedItems.has(id) };
};
```

This data flow documentation provides a comprehensive understanding of how data moves through the MainWebSite React application, enabling developers to maintain consistency and implement new features effectively while following established patterns.
