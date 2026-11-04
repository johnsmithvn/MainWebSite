# Architecture Overview - MainWebSite React

> **⚠️ Viết 09/2025 — một phần mô tả kiến trúc *dự kiến*, không phải code hiện tại.** Bảng dưới đối chiếu từng mục với code (kiểm tra 2026-11-04). Trạng thái hiện tại: [README.md](README.md) · [docs/SYSTEM-REPORT.md](../../docs/SYSTEM-REPORT.md).
>
> | Mục trong tài liệu | Khớp code? | Thực tế |
> |--------------------|-----------|---------|
> | High-Level / Module Architecture | ⚠️ Thiếu | Đúng cho manga/movie/music; thiếu Media Gallery (`/media`), Downloads (`/downloads`), Offline (`/offline/*`), PDF reader |
> | State Management (Zustand) | ⚠️ Thiếu | Ngoài 5 store còn `useSharedSettingsStore` (`store/index.js`) và `useDownloadQueueStore` (`store/downloadQueueStore.js`) |
> | API Integration — dedup GET | ✅ | `inflightGet` gộp request trùng cho `getFolders`; riêng manga có thêm `recentGetCache` TTL 1,5 s |
> | API — "automatic retry", "response caching with TTL" | ❌ | Không có retry. Interceptor chỉ gắn token và xử lý 401 (xoá token, về `/`) |
> | Token Management | ✅ | Interceptor gắn `Authorization: Bearer` + `x-secure-token`; `fetch()` trực tiếp thì không (ISSUES B6) |
> | Route Protection / `ProtectedRoute`, route guards | ❌ | Không có. Nguồn bảo mật do backend trả 401 |
> | Code Splitting `lazy()` | ❌ | Mọi page import tĩnh trong `App.jsx`; `utils/lazyLoadComponents.js` là dead code |
> | Image Optimization `LazyLoadImage` | ⚠️ | Chỉ `MangaCard` dùng `react-lazy-load-image-component` |
> | Virtual Scrolling `react-window` | ❌ | `react-window` không có trong dependencies; `react-virtualized` có nhưng không dùng |
> | Testing Architecture | ❌ | Repo không có test và thư viện test |
> | Environment Configuration | ⚠️ | Danh sách biến đầy đủ: [readme.md §3.2](../../readme.md#32-react-appenv); không đặt `NODE_ENV` trong `.env` (ISSUES C8) |
> | Offline Storage Architecture | ✅ | Bản cập nhật: [OFFLINE-GUIDE.md](OFFLINE-GUIDE.md) |

This document provides a comprehensive overview of the application architecture, design patterns, and technical decisions implemented in the MainWebSite React application.

## 🏗️ High-Level Architecture

### Application Structure
The application follows a **modular, feature-based architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
├─────────────────────────────────────────────────────────────┤
│  React Components (Pages, Components, Layouts)             │
│  • Functional Components with Hooks                        │
│  • Responsive UI with TailwindCSS                         │
│  • Animations with Framer Motion                          │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    State Management Layer                   │
├─────────────────────────────────────────────────────────────┤
│  Zustand Stores + React Query                             │
│  • Global State Management                                │
│  • Server State Caching                                   │
│  • Persistent Storage                                     │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                           │
├─────────────────────────────────────────────────────────────┤
│  API Services + Utilities                                 │
│  • HTTP Client (Axios)                                    │
│  • Request/Response Interceptors                          │
│  • Cache Management                                       │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Backend Integration                      │
├─────────────────────────────────────────────────────────────┤
│  Node.js Backend APIs                                     │
│  • RESTful API Endpoints                                  │
│  • File Serving & Streaming                               │
│  • Authentication & Authorization                         │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Core Design Patterns

### 1. Component Architecture Pattern
**Pattern**: Atomic Design + Feature-Based Organization

```
components/
├── common/           # Shared/Atomic components
│   ├── Button.jsx    # Base button component
│   ├── Modal.jsx     # Reusable modal wrapper
│   └── Layout.jsx    # Application layout
├── manga/            # Feature-specific components
├── movie/            # Feature-specific components
└── music/            # Feature-specific components
```

**Benefits**:
- High reusability of common components
- Clear feature boundaries
- Easy maintenance and testing

### 2. State Management Pattern
**Pattern**: Flux-like Architecture with Zustand

```javascript
// Store Structure
const useAuthStore = create(persist((set, get) => ({
  // State
  sourceKey: '',
  isAuthenticated: false,
  
  // Actions
  login: (sourceKey, token) => { /* ... */ },
  logout: () => { /* ... */ },
})));
```

**Key Principles**:
- **Single Source of Truth**: Each domain has its own store
- **Immutable Updates**: State updates through actions only
- **Persistence**: Critical state persisted to localStorage
- **Computed Values**: Derived state through selectors

### 3. API Integration Pattern
**Pattern**: Service Layer with Request Deduplication

```javascript
// API Service Structure
export const apiService = {
  manga: {
    getFolders: (params) => { /* Deduplicated requests */ },
    toggleFavorite: (dbkey, path, value) => { /* ... */ },
  },
  movie: { /* ... */ },
  music: { /* ... */ },
};
```

**Features**:
- Request deduplication for GET requests
- Response caching with TTL
- Automatic retry logic
- Error handling and interceptors

## 🔄 Data Flow Architecture

### 1. Unidirectional Data Flow
```
User Action → Component → Store Action → API Call → Store Update → Component Re-render
```

### 2. State Synchronization
```javascript
// Example: Favorite Toggle Flow
1. User clicks favorite button
2. Component calls store action
3. Store makes API call
4. API updates backend
5. Store updates local state
6. Cache invalidation across all related data
7. UI reflects new state
```

### 3. Cache Management Strategy
```javascript
// Multi-level caching
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Component     │    │   Store Cache   │    │  API Response   │
│   Local State   │ ←→ │   (Zustand)     │ ←→ │   Cache         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐
                       │  localStorage   │
                       │  Persistence    │
                       └─────────────────┘
```

## 🏛️ Module Architecture

### 1. Authentication Module
```javascript
// Authentication Flow
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Home      │ →  │ LoginModal  │ →  │ Protected   │
│   Page      │    │             │    │ Routes      │
└─────────────┘    └─────────────┘    └─────────────┘
```

**Components**:
- `LoginModal`: Secure authentication interface
- `useAuthStore`: Authentication state management
- Route guards for protected content

### 2. Media Management Modules

#### Manga Module
```javascript
// Manga Architecture
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ MangaSelect │ →  │ MangaHome   │ →  │ MangaReader │
│             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Source      │    │ Folder      │    │ Image       │
│ Selection   │    │ Browser     │    │ Viewer      │
└─────────────┘    └─────────────┘    └─────────────┘
```

**Key Features**:
- Multi-source support
- Database vs. disk loading modes
- Advanced reader with zoom, pagination
- Favorites and history tracking

#### Movie Module
```javascript
// Movie Architecture
┌─────────────┐    ┌─────────────┐
│ MovieHome   │ →  │ MoviePlayer │
│             │    │             │
└─────────────┘    └─────────────┘
       │                   │
┌─────────────┐    ┌─────────────┐
│ Collection  │    │ Video       │
│ Browser     │    │ Streaming   │
└─────────────┘    └─────────────┘
```

#### Music Module
```javascript
// Music Architecture
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ MusicHome   │ →  │ MusicPlayer │ ←→ │ Playlists   │
│             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Collection  │    │ Audio       │    │ Playlist    │
│ Browser     │    │ Streaming   │    │ Management  │
└─────────────┘    └─────────────┘    └─────────────┘
```

## 🔧 Technical Architecture Decisions

### 1. Build System: Vite
**Why Vite?**
- Fast HMR (Hot Module Replacement)
- Native ES modules support
- Optimized production builds
- Excellent React integration

**Configuration Highlights**:
```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: {
    proxy: { /* API proxying */ }
  }
});
```

### 2. Styling: TailwindCSS
**Why TailwindCSS?**
- Utility-first approach
- Consistent design system
- Excellent responsive design support
- Dark mode built-in

**Custom Configuration**:
```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: { /* Custom color palette */ },
      animations: { /* Custom animations */ }
    }
  }
};
```

### 3. State Management: Zustand
**Why Zustand over Redux?**
- Minimal boilerplate
- TypeScript-friendly
- Built-in persistence
- Excellent performance

**Store Architecture**:
```javascript
// Modular store design
├── useAuthStore      # Authentication state
├── useUIStore        # UI state (theme, modals)
├── useMangaStore     # Manga-specific state
├── useMovieStore     # Movie-specific state
└── useMusicStore     # Music-specific state
```

### 4. HTTP Client: Axios
**Features Implemented**:
- Request/Response interceptors
- Automatic token injection
- Error handling
- Request deduplication
- Response caching

## 🚀 Performance Architecture

### 1. Code Splitting Strategy
```javascript
// Route-based code splitting
const MangaReader = lazy(() => import('./pages/manga/MangaReader'));
const MoviePlayer = lazy(() => import('./pages/movie/MoviePlayer'));
```

### 2. Image Optimization
```javascript
// Lazy loading with intersection observer
import { LazyLoadImage } from 'react-lazy-load-image-component';

// Progressive loading strategy
1. Placeholder → 2. Thumbnail → 3. Full Image
```

### 3. Virtual Scrolling
```javascript
// For large lists (manga pages, movie collections)
import { FixedSizeList as List } from 'react-window';
```

### 4. Request Optimization
```javascript
// Deduplication strategy
const inflightGet = new Map();
const recentGetCache = new Map();

// Prevents duplicate API calls
// Caches recent responses
```

## 🔒 Security Architecture

### 1. Authentication Flow
```javascript
// Multi-layer security
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Source Key  │ →  │ Token Auth  │ →  │ Protected   │
│ Validation  │    │             │    │ Content     │
└─────────────┘    └─────────────┘    └─────────────┘
```

### 2. Token Management
```javascript
// Automatic token injection
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    config.headers['x-secure-token'] = token;
  }
  return config;
});
```

### 3. Route Protection
```javascript
// Protected route pattern
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/" />;
};
```

## 📱 Responsive Architecture

### 1. Mobile-First Design
```javascript
// TailwindCSS breakpoints
sm: '640px',   // Small devices
md: '768px',   // Medium devices  
lg: '1024px',  // Large devices
xl: '1280px'   // Extra large devices
```

### 2. Adaptive Components
```javascript
// Component adaptation based on screen size
const isMobile = window.innerWidth <= 768;
return isMobile ? <MobileComponent /> : <DesktopComponent />;
```

### 3. Touch-Friendly Interactions
- Swipe gestures for carousels
- Touch-optimized button sizes
- Responsive modal dialogs

## 🧪 Testing Architecture

### 1. Component Testing Strategy
```javascript
// Testing pyramid approach
Unit Tests (Components) → Integration Tests (Hooks) → E2E Tests (User Flows)
```

### 2. State Testing
```javascript
// Zustand store testing
import { renderHook, act } from '@testing-library/react-hooks';
import { useAuthStore } from '../store';
```

## 🔄 Deployment Architecture

### 1. Build Process
```javascript
// Production build optimization
npm run build
├── Static asset optimization
├── Code splitting
├── Tree shaking
└── Bundle analysis
```

### 2. Environment Configuration
```javascript
// Environment-specific settings
VITE_BASE=/                    # Base URL
VITE_DISABLE_STRICT_MODE=false # Development flag
```

## 📥 Offline Storage Architecture

### Progressive Web App (PWA) Storage Strategy

The application implements a **hybrid storage model** for offline chapter reading capabilities:

```
┌─────────────────────────────────────────────────────────────┐
│                    Offline Storage Layer                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐              ┌─────────────────┐      │
│  │   IndexedDB     │              │  Cache Storage  │      │
│  │   (Metadata)    │ ←──────────→ │   (Images)      │      │
│  │                 │              │                 │      │
│  │ • Chapter info  │              │ • Page images   │      │
│  │ • Page URLs     │              │ • Binary data   │      │
│  │ • File sizes    │              │ • HTTP responses│      │
│  │ • Timestamps    │              │ • Service Worker│      │
│  │ • User metadata │              │   integration   │      │
│  └─────────────────┘              └─────────────────┘      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Storage Architecture Components

#### 1. IndexedDB (Structured Metadata Storage)
```javascript
// Database Schema
const DB_NAME = 'offline-manga';
const STORE = 'chapters';

// Chapter Metadata Structure
{
  id: string,              // Unique chapter identifier
  mangaTitle: string,      // Extracted manga title
  chapterTitle: string,    // Chapter folder name
  pageUrls: string[],      // Array of image URLs
  bytes: number,           // Total storage size
  totalPages: number,      // Page count
  coverImage: string,      // First page URL for thumbnail
  createdAt: number,       // Download timestamp
  updatedAt: number,       // Last update timestamp
  sourceKey: string,       // Source database key
  rootFolder: string       // Root folder reference
}
```

#### 2. Cache Storage API (Binary Image Storage)
```javascript
// Cache Storage Strategy
const CACHE_NAME = 'chapter-images';

// Storage Process
1. Fetch image with CORS mode
2. Clone response for size calculation
3. Store in Cache Storage with original URL as key
4. Track total bytes for metadata

// Retrieval Process
1. Service Worker intercepts image requests
2. Check Cache Storage for cached response
3. Serve from cache if available
4. Fallback to network if not cached
```

#### 3. Service Worker Integration
```javascript
// Request Interception Pattern
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle manga image requests
  if (url.pathname.includes('/manga/') && isImageRequest(event.request)) {
    event.respondWith(handleImageRequest(event.request));
  }
});

// Cache-First Strategy for Images
async function handleImageRequest(request) {
  // 1. Check cache first
  const cache = await caches.open('chapter-images');
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse; // Serve from cache
  }
  
  // 2. Fallback to network
  const networkResponse = await fetch(request);
  
  // 3. Cache for future use
  if (networkResponse.ok) {
    await cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}
```

### Cache Management Architecture

#### 1. Download Process Architecture
```javascript
// Download Flow
User Action → Progress Tracking → Dual Storage → Completion Verification

// Implementation Strategy
1. User clicks download button
2. Initialize progress tracking system
3. Fetch images with CORS mode for size calculation
4. Store images in Cache Storage
5. Calculate and track storage usage
6. Save comprehensive metadata to IndexedDB
7. Provide real-time progress feedback
8. Handle errors gracefully with retry logic
```

#### 2. Cache Cleanup Architecture
```javascript
// Cleanup Strategy Pattern
Single Delete: Metadata Check → Image Deletion → IndexedDB Cleanup
Bulk Delete: Batch Processing → Nuclear Cache Clear → Statistics

// Complete Deletion Implementation
deleteChapterCompletely: async (id) => {
  // 1. Retrieve metadata for cleanup planning
  const chapter = await getChapter(id);
  
  // 2. Delete images from Cache Storage
  const cache = await caches.open('chapter-images');
  for (const url of chapter.pageUrls) {
    await cache.delete(url);
  }
  
  // 3. Remove metadata from IndexedDB
  await deleteChapter(id);
  
  // 4. Return detailed statistics
  return { success, stats: { deletedImages, bytesFreed } };
}
```

#### 3. Storage Analysis Architecture
```javascript
// Storage Monitoring Pattern
Real-time Analysis → Quota Management → User Feedback

// Storage Analysis Implementation
getStorageAnalysis: async () => {
  // 1. Analyze IndexedDB metadata
  const chapters = await getChapters();
  let totalBytes = 0, totalImages = 0;
  
  // 2. Calculate totals
  chapters.forEach(chapter => {
    totalBytes += chapter.bytes || 0;
    totalImages += chapter.totalPages || 0;
  });
  
  // 3. Get browser storage quota
  const estimate = await navigator.storage.estimate();
  
  // 4. Return comprehensive analysis
  return {
    chapters: { count, totalBytes, totalImages },
    quota: { usage, available, percentage },
    formattedSize: formatBytes(totalBytes)
  };
}
```

### Offline Reading Architecture

#### 1. Offline Mode Detection
```javascript
// URL Parameter Strategy
const isOfflineMode = searchParams.get('offline') === '1';

// Route Pattern
/manga/reader/{chapterId}?offline=1
```

#### 2. Offline Data Loading
```javascript
// Offline Loading Flow
Check Parameter → Load Metadata → Set Images → Service Worker Serves

// Implementation
if (isOfflineMode) {
  const chapter = await getChapter(currentMangaPath);
  if (chapter) {
    setCurrentImages(chapter.pageUrls);
    // Service Worker automatically serves images from cache
  } else {
    setError('Offline data not found');
  }
}
```

### Performance Optimization Architecture

#### 1. Progressive Loading Strategy
```javascript
// Download Optimization
1. Parallel image fetching with concurrency limits
2. Progress tracking with debounced UI updates
3. Error resilience with individual page failure handling
4. Memory management with response cloning
```

#### 2. Storage Efficiency
```javascript
// Storage Optimization
1. Deduplication: Same URL = same cache entry
2. Compression: Native browser compression
3. Cleanup: Complete removal prevents orphan data
4. Monitoring: Real-time storage usage tracking
```

### Error Handling & Resilience

#### 1. Download Error Handling
```javascript
// Resilient Download Strategy
try {
  // Download individual image
} catch (err) {
  // Log error but continue with next image
  // Track failed downloads in metadata
  // Provide detailed error reporting
}
```

#### 2. Cache Corruption Recovery
```javascript
// Recovery Strategy
1. Detect inconsistencies between IndexedDB and Cache Storage
2. Provide repair utilities
3. Nuclear reset options
4. Graceful degradation to network mode
```

### Security Considerations

#### 1. Storage Isolation
- Origin-specific storage boundaries
- No cross-origin cache pollution
- Secure token handling in offline mode

#### 2. Data Integrity
- Checksum verification for critical metadata
- Atomic operations for consistency
- Rollback mechanisms for failed operations

### Future Architecture Enhancements

#### 1. Planned Improvements
- **Background Sync**: Automatic download resumption
- **Smart Prefetching**: Predictive chapter downloads
- **Storage Compression**: Advanced compression strategies
- **Sync Conflicts**: Multi-device synchronization

#### 2. Scalability Considerations
- **Storage Quotas**: Dynamic quota management
- **Performance Metrics**: Detailed analytics
- **User Preferences**: Configurable storage policies
- **Cloud Backup**: Optional cloud synchronization

This offline storage architecture provides a robust foundation for Progressive Web App capabilities while maintaining performance, reliability, and user experience standards.

## 🎯 Future Architecture Considerations

### 1. Potential Improvements
- **Service Workers**: Offline support and caching
- **Web Workers**: Heavy computation offloading
- **PWA Features**: App-like experience
- **Micro-frontends**: Module federation for scalability

### 2. Scalability Patterns
- **Component Library**: Extract reusable components
- **Design System**: Standardized UI patterns
- **API Gateway**: Centralized API management
- **CDN Integration**: Global content delivery

## 📊 Architecture Metrics

### 1. Performance Targets
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.5s
- **Bundle Size**: < 500KB (gzipped)

### 2. Code Quality Metrics
- **Component Reusability**: > 80%
- **Test Coverage**: > 85%
- **ESLint Compliance**: 100%
- **TypeScript Coverage**: Target for future

This architecture provides a solid foundation for a scalable, maintainable, and performant media management application while maintaining flexibility for future enhancements and requirements.
