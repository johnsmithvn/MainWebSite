# Architecture Overview - MainWebSite React

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
