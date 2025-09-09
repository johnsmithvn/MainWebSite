# 📱 PHÂN TÍCH TOÀN DIỆN FRONTEND V2 - REACT APP

> **Tài liệu phân tích chi tiết Frontend phiên bản React của MainWebSite**  
> **Dự án**: Media Management System cho Manga, Movie, Music  
> **Kiến trúc**: React 18 + Vite + Zustand + TailwindCSS  
> **Ngôn ngữ**: TypeScript/JavaScript (ES6+)  

---

## 🏗️ TỔNG QUAN DỰ ÁN

### 📋 Thông tin Cơ bản
- **Tên dự án**: MainWebSite React (Version 5.0.0)
- **Mô tả**: Ứng dụng quản lý media local cho manga, phim và nhạc
- **Kiến trúc**: Single Page Application (SPA) với React Router
- **Package Manager**: NPM
- **Build Tool**: Vite 4.3.9
- **Development Port**: 3001 (Frontend), 3000 (Backend API)

### 🎯 Chức năng Chính
1. **Quản lý Manga**: Đọc truyện tranh từ thư mục local
2. **Quản lý Movie**: Xem phim từ thư mục local  
3. **Quản lý Music**: Nghe nhạc từ thư mục local
4. **Authentication**: Xác thực cho các source database được bảo vệ
5. **Favorites**: Quản lý danh sách yêu thích
6. **Recent History**: Theo dõi lịch sử xem gần đây
7. **Search**: Tìm kiếm toàn cục
8. **Settings**: Cài đặt ứng dụng

---

## 🏛️ FRONTEND ARCHITECTURE

### 📁 Cấu trúc Thư mục
```
react-app/
├── 📄 index.html              # Entry HTML file
├── 📄 package.json            # Dependencies & scripts
├── 📄 vite.config.js          # Vite configuration với Tailscale support
├── 📄 tailwind.config.js      # TailwindCSS configuration
├── 📄 postcss.config.js       # PostCSS configuration
├── 📄 .env                    # Environment variables (Tailscale)
├── 📄 .env.template           # Template cho environment setup
│
├── 📁 public/                 # Static assets
│   ├── favicon.ico
│   └── default/               # Default thumbnails
│       ├── default-cover.jpg
│       ├── favicon.png
│       ├── folder-thumb.png
│       ├── music-thumb.png
│       └── video-thumb.png
│
├── 📁 src/                    # Source code chính
│   ├── 📄 main.jsx            # React entry point
│   ├── 📄 App.jsx             # Main App component với routing
│   ├── 📄 styles.css          # Global styles & Tailwind imports
│   │
│   ├── 📁 components/         # React Components
│   │   ├── 📁 auth/           # Authentication components
│   │   ├── 📁 common/         # Shared/reusable components
│   │   ├── 📁 manga/          # Manga-specific components
│   │   ├── 📁 movie/          # Movie-specific components
│   │   └── 📁 music/          # Music-specific components
│   │
│   ├── 📁 pages/              # Page components (Routes)
│   │   ├── 📄 Home.jsx        # Trang chủ - chọn source
│   │   ├── 📄 Settings.jsx    # Trang cài đặt
│   │   ├── 📄 NotFound.jsx    # 404 page
│   │   ├── 📁 manga/          # Manga pages
│   │   ├── 📁 movie/          # Movie pages
│   │   └── 📁 music/          # Music pages
│   │
│   ├── 📁 store/              # State management (Zustand)
│   │   └── 📄 index.js        # All stores: Auth, UI, Manga, Movie, Music
│   │
│   ├── 📁 hooks/              # Custom React hooks
│   │   ├── 📄 index.js        # Common hooks (localStorage, debounce, etc.)
│   │   ├── 📄 useMovieData.js # Movie data hooks
│   │   ├── 📄 useMusicData.js # Music data hooks
│   │   ├── 📄 useRandomItems.js # Random items hook
│   │   ├── 📄 useRecentItems.js # Recent items hook
│   │   ├── 📄 useRecentManager.js # Recent management hook
│   │   └── 📄 useTopViewItems.js # Top view items hook
│   │
│   ├── 📁 utils/              # Utility functions
│   │   ├── 📄 api.js          # API service với axios
│   │   ├── 📄 databaseOperations.js # Database operations
│   │   ├── 📄 favoriteCache.js # Favorite cache management
│   │   ├── 📄 formatters.js   # Format utilities
│   │   ├── 📄 mangaCache.js   # Manga cache utilities
│   │   ├── 📄 randomCache.js  # Random cache utilities
│   │   └── 📄 thumbnailUtils.js # Thumbnail URL building
│   │
│   ├── 📁 constants/          # Constants & cache keys
│   │   ├── 📄 index.js        # App constants (pagination, reader settings)
│   │   └── 📄 cacheKeys.js    # Cache key patterns & utilities
│   │
│   └── 📁 styles/             # CSS Styles
│       └── 📁 components/     # Component-specific styles
│           ├── 📄 index.css   # Imports cho component styles
│           ├── 📄 embla.css   # Embla carousel styles
│           ├── 📄 manga-reader.css # Manga reader styles
│           ├── 📄 manga-card.css   # Manga card styles
│           └── 📄 random-slider.css # Random slider styles
│
├── 📁 docs/                   # Documentation
│   ├── 📄 ARCHITECTURE.md     # Architecture overview
│   ├── 📄 DATA_FLOW.md        # Data flow documentation
│   ├── 📄 README.md           # Setup instructions
│   └── 📄 UI_UX_OVERVIEW.md   # UI/UX guidelines
│
└── 📁 scripts/                # Shared build scripts
    └── 📄 build.js             # Build script cho legacy frontend
```

### 🔧 Công nghệ Sử dụng

#### Core Framework
- **React 18.2.0**: UI framework với Concurrent Features
- **React Router DOM 6.8.1**: Client-side routing với future flags
- **Vite 4.3.9**: Build tool nhanh với HMR
- **ESM**: ES Modules throughout

#### State Management
- **Zustand 4.3.8**: State management thay cho Redux
- **@tanstack/react-query 4.29.0**: Server state management, caching

#### UI & Styling
- **TailwindCSS 3.3.2**: Utility-first CSS framework
- **Framer Motion 10.12.12**: Animation library
- **Lucide React 0.535.0**: Icon library
- **React Icons 4.8.0**: Additional icon sets

#### Data & API
- **Axios 1.9.0**: HTTP client cho API calls
- **React Hot Toast 2.4.1**: Toast notifications

#### Media & Interaction
- **React Player 2.12.0**: Video player component
- **Embla Carousel 8.6.0**: Touch-friendly carousel
- **React Lazy Load Image 1.6.3**: Lazy loading images
- **React Intersection Observer 9.4.3**: Intersection observer

#### Utilities
- **date-fns 4.1.0**: Date manipulation
- **clsx 1.2.1**: Conditional classnames
- **use-debounce 9.0.4**: Debouncing hooks
- **string-natural-compare 3.0.1**: Natural string sorting

---

## 🚀 WORKFLOW CHÍNH

### 1. 🏠 Authentication Flow
```
Home Page → Source Selection → Authentication (nếu cần) → Content Pages
```

**Chi tiết quá trình:**
1. **Tải Source Keys**: Gọi API `/api/system/source-keys.js` để lấy danh sách sources
2. **Phân loại Sources**: Tự động phân loại theo prefix (ROOT_=manga, V_=movie, M_=music)
3. **Xác thực**: Nếu source yêu cầu mật khẩu, hiển thị LoginModal
4. **Lưu trạng thái**: Lưu sourceKey, token vào Auth Store và localStorage

### 2. 📚 Manga Workflow
```
Manga Select → Root Folder Selection → Manga Home → Reader/Favorites
```

**Chi tiết:**
- **Source Selection**: Chọn database manga (ROOT_*)
- **Root Folder**: Chọn thư mục gốc từ danh sách roots
- **Navigation**: Duyệt qua các thư mục con
- **Reader**: Đọc manga với 2 chế độ (vertical scroll/horizontal slide)

### 3. 🎬 Movie Workflow
```
Movie Home → Folder Navigation → Player/Favorites
```

### 4. 🎵 Music Workflow
```
Music Home → Folder Navigation → Player/Playlist
```

---

## 📊 FILE ORGANIZATION

### 🎯 Core System Files

#### 📄 main.jsx - Entry Point
**Chức năng**: Điểm khởi đầu của React app
**Nhiệm vụ chính**:
- Setup QueryClient với cấu hình cache (5 phút stale time)
- Setup BrowserRouter với future flags
- Setup Modal accessibility
- Conditional StrictMode (có thể tắt qua ENV)

**Quan trọng**: File này khởi tạo toàn bộ app context

#### 📄 App.jsx - Main Router
**Chức năng**: Component chính quản lý routing
**Nhiệm vụ chính**:
- Setup dark mode theo UI store
- Định nghĩa routes cho tất cả pages
- Phân biệt full-screen routes (Reader, Player) vs Layout routes
- Music player routing logic (V1/V2 based on settings)

**Routes cấu trúc**:
```javascript
// Full-screen routes (không có Layout)
/manga/reader/:folderId  → MangaReader
/movie/player           → MoviePlayer  
/music/player           → MusicPlayer/V2

// Layout routes (có Header/Sidebar)
/                       → Home
/manga/select           → MangaSelect
/manga                  → MangaHome
/manga/favorites        → MangaFavorites
/movie                  → MovieHome
/movie/favorites        → MovieFavorites
/music                  → MusicHome
/music/playlists        → MusicPlaylists
/settings               → Settings
```

#### 📄 vite.config.js - Build Configuration
**Chức năng**: Cấu hình Vite build tool
**Nhiệm vụ chính**:
- **Tailscale Support**: Cấu hình HMR cho Tailscale network
- **Proxy Setup**: Forward API calls tới backend (port 3000)
- **SPA Fallback**: Handle client-side routing
- **Path Alias**: `@` mapping tới `./src`

**Proxy paths**:
```javascript
/api → http://localhost:3000       # API endpoints
/manga → http://localhost:3000     # Manga static files
/video → http://localhost:3000     # Video files  
/audio → http://localhost:3000     # Audio files
/.thumbnail → http://localhost:3000 # Thumbnails
/default → http://localhost:3000   # Default assets
```

---

### 🏪 Store Management (Zustand)

#### 📄 store/index.js - State Management Hub
**Kiến trúc**: 5 stores riêng biệt cho từng domain

#### 🔐 useAuthStore - Authentication Store
**Trạng thái chính**:
```javascript
{
  sourceKey: '',           // Database key hiện tại
  rootFolder: '',          // Root folder (manga only)
  token: '',               // JWT token cho secure sources
  isAuthenticated: false,  // Trạng thái xác thực
  secureKeys: [],          // Danh sách keys cần password
  lastMangaKey: '',        // Key manga cuối dùng
  lastMovieKey: '',        // Key movie cuối dùng  
  lastMusicKey: '',        // Key music cuối dùng
  lastMangaRootFolder: '', // Root folder manga cuối chọn
}
```

**Phương thức quan trọng**:
- `setSourceKey()`: Tự động phân loại và lưu last key theo type
- `login()`: Xác thực và lưu token vào localStorage
- `logout()`: Clear state và localStorage
- `isSecureKey()`: Kiểm tra key có cần password không

#### 🎨 useUIStore - UI State Store
**Trạng thái UI**:
```javascript
{
  darkMode: false,         // Dark mode toggle
  sidebarOpen: false,      // Sidebar visibility
  loading: false,          // Global loading state
  toast: {                 // Toast notification state
    show: false,
    message: '',
    type: 'info',
    duration: 3000
  }
}
```

#### 📚 useMangaStore - Manga State
**Trạng thái chính**:
```javascript
{
  currentPath: '',         // Đường dẫn hiện tại
  mangaList: [],          // Danh sách manga/folders
  favorites: [],          // Manga yêu thích
  loading: false,         // Loading state
  readerPrefetch: null,   // Data prefetch cho Reader
  readerSettings: {       // Cài đặt reader
    readingMode: 'vertical',
    zoomLevel: 100,
    preloadCount: 10,
    scrollImagesPerPage: 200
  },
  mangaSettings: {        // Cài đặt manga
    useDb: true,          // Load từ DB hay disk
    gridLoadFromDb: true,
    recentHistoryCount: 20
  }
}
```

**Phương thức quan trọng**:
- `fetchMangaFolders()`: Tải folders với cache support
- `toggleFavorite()`: Toggle favorite với cache update
- `fetchFavorites()`: Tải danh sách favorites

#### 🎬 useMovieStore - Movie State
**Tương tự MangaStore** nhưng cho movies:
```javascript
{
  movieList: [],          // Danh sách movies/folders
  currentMovie: null,     // Movie đang play
  playerSettings: {       // Cài đặt player
    volume: 1,
    autoplay: false,
    quality: 'auto'
  }
}
```

#### 🎵 useMusicStore - Music State
**Phức tạp nhất** với player controls:
```javascript
{
  musicList: [],          // Browser state
  currentTrack: null,     // Track đang play
  currentPlaylist: [],    // Playlist hiện tại
  isPlaying: false,       // Play state
  volume: 1,              // Volume level
  shuffle: false,         // Shuffle mode
  repeat: 'none',         // Repeat mode ('none'|'one'|'all')
  playlists: [],          // User playlists
  playerSettings: {
    playerUI: 'v1'        // 'v1' (Spotify-like) | 'v2' (Zing-like)
  }
}
```

**Phương thức player**:
- `playTrack()`: Play track với playlist
- `nextTrack()`/`prevTrack()`: Navigation
- `toggleShuffle()`: Shuffle toggle
- `setRepeat()`: Repeat mode

---

### 🎣 Custom Hooks System

#### 📄 hooks/index.js - Common Hooks
**Hooks tiện ích**:
- `useLocalStorage()`: Sync state với localStorage
- `useDebounceValue()`: Debounce values
- `useIntersectionObserver()`: Intersection observer
- `useMediaQuery()`: Responsive breakpoints
- `useClickOutside()`: Outside click detection
- `useKeyPress()`: Keyboard shortcuts
- `useAsync()`: Async operations handling
- `usePagination()`: Pagination logic
- `useVirtualizer()`: Virtual list rendering

#### 📄 useRandomItems.js - Random Content Hook
**Chức năng**: Quản lý random content với cache và refresh
**Tham số**:
```javascript
useRandomItems(type, {
  enabled: true,
  staleTime: 5 * 60 * 1000,  // 5 phút
  count: 20,                 // Số items
  force: false               // Force refresh
})
```

**Return**: `{ data, loading, error, refresh, lastUpdated }`

**Cache logic**: Sử dụng localStorage với TTL, merge favorite state

#### 📄 useRecentItems.js - Recent History Hook  
**Chức năng**: Quản lý lịch sử xem gần đây
**Cache pattern**: `recentViewed[Type]::[sourceKey]::[rootFolder]`
**Max items**: Configurable qua manga settings (default 20)

#### 📄 useRecentManager.js - Recent Addition Hook
**Chức năng**: Thêm items vào recent history
**Logic**: 
- Remove duplicates
- Add to front 
- Trim to maxItems
- Respect enableRecentTracking setting

---

### 🌐 API & Utils Layer

#### 📄 utils/api.js - API Service
**Kiến trúc**: Axios instance với interceptors
**Features**:
- **Request deduplication**: Ngăn duplicate GET requests
- **Response cache**: Short-term cache (1.5s) cho immediate calls
- **Auth headers**: Tự động thêm token từ localStorage
- **Error handling**: 401 → auto logout

**API structure**:
```javascript
apiService = {
  manga: {
    getFolders, getFavorites, toggleFavorite,
    resetCache, scan, getRootThumbnail
  },
  movie: {
    getFolders, getVideos, getVideoCache, 
    getFavorites, toggleFavorite, extractThumbnail
  },
  music: {
    getFolders, getAudio, getAudioCache,
    getPlaylists, createPlaylist, getMusicMeta
  },
  system: {
    getSourceKeys, login, listRoots, increaseView
  }
}
```

#### 📄 utils/favoriteCache.js - Cache Synchronization
**Chức năng**: Đồng bộ favorite state across tất cả cache entries
**Scope**: Update tất cả cache patterns khi toggle favorite:
- RandomView cache
- RecentViewed cache  
- Legacy cache patterns
- React folder cache
- Movie/Music cache

**Pattern matching**:
```javascript
// React app patterns
randomView::[type]::[sourceKey]::[rootFolder]
recentViewed[Type]::[sourceKey]::[rootFolder]

// Legacy patterns  
randomItems-[sourceKey]
mangaCache::[sourceKey]::[path]
react-folderCache::[sourceKey]::[path]
```

#### 📄 utils/thumbnailUtils.js - Thumbnail Processing
**Chức năng**: Build thumbnail URLs với encoding
**Logic**:
1. Detect type (movie/music/manga) 
2. Extract folder prefix
3. Encode special characters (# → %23)
4. Build full URL với prefix (/video/, /audio/, /manga/)
5. Fallback tới default thumbnails

#### 📄 utils/databaseOperations.js - Database Operations
**Chức năng**: Centralized database operations với loading states
**Operations**:
- `performDatabaseScan()`: Scan database
- `performDatabaseDelete()`: Delete entries
- `performDatabaseReset()`: Reset và scan lại

**Content type detection**: Tự động từ sourceKey prefix

---

### 🎨 Components Architecture

#### 📁 components/common/ - Shared Components

##### 📄 Layout.jsx - Main Layout
**Chức năng**: Layout wrapper cho tất cả pages (trừ full-screen)
**Structure**:
```jsx
<Layout>
  <Header />           {/* Top navigation */}
  <Sidebar />          {/* Left sidebar */}  
  <main>
    <Outlet />         {/* Page content */}
  </main>
  <Toast />            {/* Global notifications */}
  <LoadingOverlay />   {/* Global loading */}
</Layout>
```

##### 📄 Header.jsx - Navigation Header
**Features**:
- **Section navigation**: Home/Manga/Movie/Music buttons
- **Search toggle**: Global search modal
- **Settings access**: Settings modal
- **Dark mode toggle**: UI theme switch
- **Last keys memory**: Remember last used keys per type

##### 📄 Sidebar.jsx - Navigation Sidebar
**Content**: Database actions, navigation links
**Auto-detection**: Content type từ sourceKey
**Responsive**: Collapsible trên mobile

##### 📄 SearchModal.jsx - Global Search
**Features**:
- **Type filtering**: All/Folder/File
- **Debounced search**: 500ms delay
- **Section detection**: Auto-detect từ location
- **Infinite scroll**: Load more results
- **Quick suggestions**: Compact results với navigation

##### 📄 UniversalCard.jsx - Media Card Component
**Chức năng**: Universal card cho manga/movie/music
**Props**:
```javascript
{
  item,                    // Media item
  type: 'manga|movie|music', // Content type
  isFavorite: false,       // Favorite state
  showViews: false,        // Show view count
  variant: 'default',      // 'default'|'compact'|'slider'
  overlayMode: 'type'      // 'type'|'views' overlay
}
```

**Features**:
- **Thumbnail processing**: Tự động build URL
- **Favorite toggle**: Với instant UI update
- **Recent tracking**: Auto-add tới recent khi click
- **View formatting**: Duration, file size, view count
- **Responsive**: Adaptive theo screen size

##### 📄 RandomSlider.jsx - Random Content Slider
**Features**:
- **Embla carousel**: Touch-friendly với autoplay
- **Auto-refresh**: Configurable interval
- **Intersection observer**: Chỉ load khi visible
- **Hover pause**: Pause autoplay khi hover
- **Manual refresh**: Refresh button

##### 📄 RecentSlider.jsx - Recent History Slider
**Similar to RandomSlider** nhưng:
- **No autoplay**: Static display
- **Clear history**: Clear all button
- **Timestamp**: Show last viewed time

##### 📄 TopViewSlider.jsx - Top Viewed Slider
**Features**: Top viewed content, no autoplay

##### 📄 Modal.jsx - Universal Modal
**Types**: 'default', 'confirm', 'success', 'warning', 'error'
**Features**:
- **Backdrop click**: Configurable close
- **Keyboard**: ESC to close
- **Size variants**: 'sm', 'md', 'lg', 'xl'
- **Hook**: `useModal()` for easy usage

##### 📄 DatabaseActions.jsx - Database Operations
**Features**:
- **Auto-detection**: Content type từ sourceKey
- **Confirmation modals**: Before destructive operations
- **Loading states**: Global loading indicator
- **Layout options**: Vertical/horizontal/grid

#### 📁 components/manga/ - Manga Components

##### 📄 MangaCard.jsx - Manga-specific Card
**Extends**: UniversalCard với manga-specific logic
**Features**: 
- **Reader navigation**: Direct to reader
- **Folder navigation**: Browse subfolders
- **Self-reader detection**: Auto-detect readable folders

##### 📄 ReaderHeader.jsx - Manga Reader Header
**Features**:
- **Reading mode toggle**: Vertical/horizontal
- **Settings access**: Reader settings modal
- **Navigation**: Back to folder
- **Breadcrumb**: Current location

#### 📁 components/movie/ - Movie Components

##### 📄 MovieCard.jsx - Movie-specific Card
**Features**:
- **Video player**: Direct to player
- **Folder navigation**: Browse movie folders
- **Thumbnail extraction**: FFmpeg thumbnail generation

##### 📄 MovieRandomSection.jsx - Movie Random Display
**Features**: Movie-specific random section với video previews

#### 📁 components/music/ - Music Components

##### 📄 MusicCard.jsx - Music-specific Card
**Features**:
- **Audio player**: Direct to player
- **Playlist add**: Add to playlist
- **Artist/Album info**: Metadata display

##### 📄 PlayerFooter.jsx/PlayerHeader.jsx - Music Player UI
**Features**:
- **Playback controls**: Play/pause/next/prev
- **Progress bar**: Seek functionality
- **Volume control**: Volume slider
- **Playlist**: Current playlist display

---

### 📄 Pages Architecture

#### 📄 Home.jsx - Source Selection
**Flow**:
1. **Clear auth**: Force fresh login
2. **Load sources**: Get available database keys
3. **Security check**: Identify secure vs open sources
4. **Source selection**: Navigate to appropriate section

**Auto-navigation**: After successful secure login

#### 📁 pages/manga/

##### 📄 MangaSelect.jsx - Root Folder Selection
**Chức năng**: Chọn root folder cho manga database
**API**: `/api/system/list-roots`
**Navigation**: Tới MangaHome sau khi chọn

##### 📄 MangaHome.jsx - Manga Browser
**Features**:
- **Folder navigation**: Browse manga directories
- **View modes**: Grid display
- **Search**: Local search trong current folder
- **Random section**: Random manga slider (nếu ở root)
- **Breadcrumb**: Current path navigation

**URL params**:
- `?path=`: Current folder path
- `?view=folder`: Show folders only
- `?focus=`: Auto-focus item

##### 📄 MangaReader.jsx - Manga Reading Interface
**Reading modes**:
1. **Vertical scroll**: Continuous scroll với pagination
2. **Horizontal swipe**: Page-by-page với swipe

**Features**:
- **Preloading**: Configurable preload count
- **Touch controls**: Swipe/tap navigation
- **Zoom support**: Browser zoom friendly
- **Settings**: In-reader settings modal
- **Recent tracking**: Auto-add to recent history

**State management**:
```javascript
{
  currentImages: [],      // Current batch images
  currentPage: 0,         // Page index
  scrollPageIndex: 0,     // Batch index (vertical)
  showControls: true,     // UI controls visibility
  prefetchCache: Set      // Preloaded images cache
}
```

##### 📄 MangaFavorites.jsx - Favorite Manga List
**Features**:
- **Grid/List view**: Toggle display mode
- **Sorting**: Date added, name, views
- **Search**: Filter favorites
- **Pagination**: 24 items per page
- **Navigation**: Direct to reader or folder

#### 📁 pages/movie/

##### 📄 MovieHome.jsx - Movie Browser
**Similar to MangaHome** nhưng cho movies:
- **Folder navigation**: Movie directories
- **Video thumbnails**: FFmpeg-generated
- **Player navigation**: Direct to video player

##### 📄 MoviePlayer.jsx - Video Player
**Features**:
- **ReactPlayer**: Video playback
- **Full-screen**: Dedicated player page
- **Controls**: Custom video controls
- **Recent tracking**: Auto-add to recent

##### 📄 MovieFavorites.jsx - Favorite Movies
**Similar to MangaFavorites** cho movies

#### 📁 pages/music/

##### 📄 MusicHome.jsx - Music Browser
**Features**:
- **Audio folders**: Browse music directories
- **Metadata**: Artist, album, duration info
- **Player integration**: Queue management

##### 📄 MusicPlayer.jsx/MusicPlayerV2.jsx - Audio Players
**V1 (Spotify-like)**:
- **Mini player**: Bottom fixed player
- **Playlist sidebar**: Current queue
- **Simple controls**: Basic playback

**V2 (Zing-like)**: 
- **Full player**: Dedicated page
- **Rich UI**: Album art, lyrics
- **Advanced controls**: EQ, effects

**Selection**: Auto-detect mobile → force V1, desktop → user setting

##### 📄 MusicPlaylists.jsx - Playlist Management
**Features**:
- **Create playlists**: Custom playlists
- **Manage tracks**: Add/remove songs
- **Play playlists**: Queue entire playlist

#### 📄 Settings.jsx - App Settings
**Categories**:
- **UI Settings**: Dark mode, animations
- **Reader Settings**: Reading mode, preload count
- **Cache Management**: Clear specific/all caches
- **Recent History**: Clear history, count settings
- **Database Operations**: Scan/reset/delete per content type

---

## 🎨 STYLES & RESPONSIVE DESIGN

### 📄 styles.css - Global Styles
**Architecture**:
```css
@import './styles/components/index.css';  /* Component styles */
@tailwind base;                           /* Tailwind base */
@tailwind components;                     /* Tailwind components */
@tailwind utilities;                      /* Tailwind utilities */
```

**CSS Custom Properties** cho theming:
```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --border-color: #e5e7eb;
}

[data-theme="dark"] {
  --bg-primary: #1e293b;
  --bg-secondary: #0f172a;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --border-color: #334155;
}
```

### 📄 tailwind.config.js - Design System
**Custom colors**:
```javascript
colors: {
  primary: {           // Blue primary color scale
    50: '#eff6ff',
    500: '#3b82f6',
    900: '#1e3a8a'
  },
  dark: {              // Dark theme colors
    800: '#1e293b',
    900: '#0f172a'
  }
}
```

**Custom animations**:
```javascript
animation: {
  'fade-in': 'fadeIn 0.3s ease-in-out',
  'slide-up': 'slideUp 0.3s ease-out',
  'scale-in': 'scaleIn 0.2s ease-out'
}
```

**Aspect ratios**:
```javascript
aspectRatio: {
  'manga': '3/4',      // Manga cover ratio
  'movie': '16/9',     // Video ratio
  'music': '1/1'       // Square album art
}
```

### 📁 styles/components/ - Component Styles

#### 📄 manga-reader.css - Reader Styling
**Responsive breakpoints**:
```css
/* Desktop */
.manga-reader { width: 100%; height: 100vh; }

/* Tablet */
@media (max-width: 768px) {
  .reader { padding-top: 56px; }
}

/* Mobile */
@media (max-width: 480px) {
  .reader { padding-top: 52px; }
}
```

**Reading modes**:
```css
/* Vertical scroll mode */
.reader.scroll-mode {
  overflow-y: auto;
  overflow-x: hidden;
}

/* Horizontal swipe mode */
.reader:not(.scroll-mode) {
  overflow: hidden;
}
```

**Touch optimizations**:
```css
.manga-reader {
  touch-action: manipulation;  /* Prevent zoom conflicts */
}

.zoom-wrapper {
  touch-action: pinch-zoom;    /* Allow zoom */
}
```

#### 📄 random-slider.css - Carousel Styling
**Embla carousel** custom styling với responsive breakpoints

#### 📄 manga-card.css - Card Styling
**Aspect ratio** maintenance và hover effects

---

## 🔧 CONSTANTS & CONFIGURATION

### 📄 constants/index.js - App Constants
**Categories**:

#### Pagination Settings
```javascript
PAGINATION = {
  FOLDERS_PER_PAGE: 24,
  MANGA_FAVORITES_PER_PAGE: 20,
  MOVIES_PER_PAGE: 16,
  MUSIC_PER_PAGE: 20,
  SEARCH_LIMIT: 100
}
```

#### Reader Settings
```javascript
READER = {
  DEFAULT_MODE: "vertical",
  LAZY_LOAD: false,
  IMAGES_PER_PAGE: 200,
  ZOOM_STEP: 0.1,
  MIN_ZOOM: 0.5,
  MAX_ZOOM: 3.0
}
```

#### Cache Settings
```javascript
CACHE = {
  RANDOM_TTL: 5 * 60 * 1000,      // 5 phút
  FOLDER_TTL: 15 * 60 * 1000,     // 15 phút
  MOVIE_TTL: 30 * 60 * 1000,      // 30 phút
  MUSIC_TTL: 30 * 60 * 1000       // 30 phút
}
```

### 📄 constants/cacheKeys.js - Cache Management
**Cache prefixes**:
```javascript
CACHE_PREFIXES = {
  RANDOM_VIEW: 'randomView',
  RECENT_VIEWED_MANGA: 'recentViewed',
  RECENT_VIEWED_VIDEO: 'recentViewedVideo',
  RECENT_VIEWED_MUSIC: 'recentViewedMusic',
  REACT_FOLDER_CACHE: 'react-folderCache',
  MANGA_CACHE: 'mangaCache',
  MOVIE_CACHE: 'movieCache',
  MUSIC_CACHE: 'musicCache'
}
```

**Key generators** cho từng content type với consistent format

---

## 💾 CACHE SYSTEM & DATA FLOW

### 🗂️ Cache Architecture
**Multi-layer caching** system:

#### Level 1: React Query Cache
- **Server state**: API responses
- **TTL**: 5-30 phút tùy content type
- **Invalidation**: Automatic stale-while-revalidate

#### Level 2: localStorage Cache
- **Random content**: `randomView::[type]::[sourceKey]::[rootFolder]`
- **Recent history**: `recentViewed[Type]::[sourceKey]::[rootFolder]`
- **Folder data**: `react-folderCache::[sourceKey]::[path]`
- **Favorites**: Embedded trong API responses

#### Level 3: Component State
- **UI state**: Loading, errors, selections
- **Transient data**: Current page, scroll position

### 🔄 Cache Synchronization
**Khi toggle favorite**:
1. **Optimistic update**: Instant UI update
2. **API call**: Server update
3. **Cache propagation**: Update tất cả cache entries có item đó
4. **Store sync**: Update Zustand store
5. **Trigger refresh**: Invalidate related React Query cache

**Cache patterns được update**:
- Random sliders cache
- Recent history cache
- Folder grid cache  
- Legacy cache patterns (backward compatibility)

### 📊 Data Flow Patterns

#### Read Flow (Manga example)
```
Component → Store → Cache Check → API Call → Process → Cache Save → Update UI
```

1. **Component request**: `useMangaStore.fetchMangaFolders(path)`
2. **Cache check**: Check `mangaCache::[sourceKey]::[path]`
3. **Cache hit**: Return cached data immediately
4. **Cache miss**: API call to `/api/manga/folder-cache`
5. **Process response**: Clean URLs, add favorites
6. **Cache save**: Save processed data
7. **Update UI**: Set state và re-render

#### Write Flow (Favorite toggle)
```
User Action → Optimistic Update → API Call → Cache Sync → Store Update
```

1. **User click**: Favorite button click
2. **Optimistic**: Instant UI state change
3. **API call**: POST `/api/manga/favorite`
4. **Cache sync**: `updateFavoriteInAllCaches()`
5. **Store update**: Update favorites array
6. **Trigger refresh**: Increment refresh trigger cho sliders

---

## 🚨 ĐẶC ĐIỂM QUAN TRỌNG & LƯU Ý

### 🔒 Security Features
- **Token-based auth**: JWT tokens cho secure sources
- **Auto-logout**: 401 responses trigger logout
- **Source isolation**: Mỗi source có riêng namespace
- **XSS protection**: Safe URL encoding cho special characters

### 📱 Mobile Optimizations
- **Touch-friendly**: Swipe gestures, touch navigation
- **Responsive design**: Mobile-first approach
- **Performance**: Lazy loading, virtual scrolling
- **Offline support**: localStorage caching

### 🎯 Performance Features
- **Code splitting**: Route-based splitting
- **Lazy loading**: Images và components
- **Virtual scrolling**: Large lists
- **Request deduplication**: Prevent duplicate API calls
- **Optimistic updates**: Instant UI feedback

### 🔧 Developer Experience
- **Hot reload**: Vite HMR với Tailscale support
- **TypeScript ready**: JSDoc comments cho autocomplete
- **Error boundaries**: Graceful error handling
- **Debug tools**: Console logging, React DevTools

### 🌐 Network Features
- **Tailscale support**: Remote development access
- **Proxy setup**: Seamless API communication
- **CORS handling**: Proper cross-origin setup
- **Error recovery**: Retry mechanisms

---

## 🎨 UI/UX FEATURES

### 🎭 Theming
- **Dark/Light mode**: CSS custom properties
- **Smooth transitions**: CSS transitions cho mode changes
- **Consistent design**: TailwindCSS design system
- **Accessibility**: Proper contrast ratios

### 🖱️ Interactions
- **Hover effects**: Subtle animations
- **Loading states**: Skeleton screens, spinners
- **Error states**: User-friendly error messages
- **Empty states**: Helpful empty state messages

### 📲 Touch & Gestures
- **Swipe navigation**: Carousel interactions
- **Pinch zoom**: Image zoom support
- **Touch targets**: 44px+ touch targets
- **Gesture feedback**: Visual feedback cho interactions

### 🔔 Notifications
- **Toast messages**: React Hot Toast
- **Modal dialogs**: Confirmation dialogs
- **Loading overlays**: Global loading states
- **Progress indicators**: Operation progress

---

## 🚀 BUILD & DEPLOYMENT

### 📦 Build Process
```bash
npm run dev      # Development server (port 3001)
npm run build    # Production build
npm run preview  # Preview build locally
```

### 🔧 Environment Configuration
**.env variables**:
```bash
VITE_HMR_HOST=desktop-xxx.ts.net    # Tailscale hostname
VITE_HMR_PORT=3001                  # HMR port
VITE_ALLOWED_HOSTS=hostname         # Allowed hosts
VITE_DISABLE_STRICT_MODE=false      # Development option
```

### 📁 Build Output
```
dist/
├── index.html           # Entry HTML
├── assets/             # Bundled JS/CSS
│   ├── index-[hash].js
│   └── index-[hash].css
└── favicon.ico         # Static assets
```

---

## 🔗 TƯƠNG TÁC VỚI BACKEND

### 🌐 API Endpoints Usage
**Base URL**: `http://localhost:3000` (proxied)

#### Manga APIs
```javascript
GET /api/manga/folder-cache?key={sourceKey}&root={rootFolder}&path={path}
GET /api/manga/favorite?key={sourceKey}&root={rootFolder}
POST /api/manga/favorite { dbkey, path, value }
DELETE /api/manga/reset-cache?key={sourceKey}&root={rootFolder}&mode={delete|reset}
POST /api/manga/scan { key, root }
```

#### Movie APIs
```javascript
GET /api/movie/movie-folder?key={sourceKey}&path={path}
GET /api/movie/video-cache?key={sourceKey}&path={path}
GET /api/movie/favorite-movie?key={sourceKey}
POST /api/movie/favorite-movie { dbkey, path, value }
```

#### Music APIs
```javascript
GET /api/music/music-folder?key={sourceKey}&path={path}
GET /api/music/audio-cache?key={sourceKey}&path={path}
GET /api/music/playlists?key={sourceKey}
```

#### System APIs
```javascript
GET /api/system/source-keys.js
GET /api/system/security-keys.js
GET /api/system/list-roots?key={sourceKey}
POST /api/system/login { sourceKey, password }
```

### 📄 Static File Serving
**Manga files**: `/manga/{rootFolder}/{path}`
**Video files**: `/video/{path}`
**Audio files**: `/audio/{path}`
**Thumbnails**: `/.thumbnail/{path}`
**Defaults**: `/default/{file}`

---

## 🎯 KẾT LUẬN

### 🌟 Điểm Mạnh
1. **Modern Stack**: React 18, Vite, Zustand - hiện đại và performant
2. **Comprehensive**: Đầy đủ features cho media management
3. **Responsive**: Mobile-first design với touch support
4. **Performance**: Multi-layer caching, optimization techniques
5. **Developer Experience**: HMR, TypeScript support, good tooling
6. **Accessibility**: Keyboard navigation, screen reader support

### 🎨 Kiến trúc Đáng chú ý
- **Component-based**: Modular, reusable components
- **State management**: Zustand stores cho separation of concerns
- **Cache strategy**: Sophisticated multi-layer caching
- **API integration**: Clean service layer với error handling
- **Responsive design**: Mobile-first với progressive enhancement

### 🔮 Khả năng Mở rộng
- **New content types**: Easy to add new media types
- **Plugin system**: Component architecture allows plugins
- **Theming**: CSS custom properties for easy theming
- **API expansion**: Service layer supports new endpoints
- **Mobile app**: React Native integration possible

---

**📝 Tài liệu này cung cấp overview toàn diện về Frontend V2 React App của MainWebSite project. Mọi component, hook, utility đều được thiết kế với mục tiêu maintainability, performance và user experience tốt nhất.**
