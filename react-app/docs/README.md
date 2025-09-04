# MainWebSite - React

A modern React-based media management application for manga, movies, and music. This is the React version of the MainWebSite project, providing a responsive and interactive interface for managing local media collections.

## 🚀 Features

### 📚 Manga Management
- Browse manga folders and collections
- Built-in manga reader with multiple viewing modes (vertical/horizontal)
- Favorites system with persistent storage
- Recent viewing history tracking
- Advanced reader settings (zoom, auto-next, preloading)
- Database and disk-based loading options

### 🎬 Movie Management
- Browse movie collections and folders
- Integrated video player with quality controls
- Thumbnail generation and management
- Favorites and viewing history
- Responsive grid layout for movie browsing

### 🎵 Music Management
- Browse music collections and playlists
- Full-featured music player with multiple UI variants
- Playlist creation and management
- Shuffle, repeat, and queue functionality
- Audio metadata extraction and display

### 🔐 Security & Authentication
- Multi-source support with secure key authentication
- Token-based authentication system
- Protected routes and content access
- Source key management

### 🎨 Modern UI/UX
- Dark/Light theme support
- Responsive design for all screen sizes
- Smooth animations with Framer Motion
- Toast notifications and loading states
- Accessible modal dialogs and components

## 🛠️ Tech Stack

### Core Technologies
- **React 18** - Modern React with hooks and concurrent features
- **React Router DOM 6** - Client-side routing with nested routes
- **Vite** - Fast build tool and development server
- **TailwindCSS** - Utility-first CSS framework

### State Management
- **Zustand** - Lightweight state management with persistence
- **TanStack React Query** - Server state management and caching

### UI Components & Styling
- **Framer Motion** - Animation library for smooth transitions
- **React Hot Toast** - Toast notifications
- **React Modal** - Accessible modal dialogs
- **Lucide React** - Modern icon library
- **React Icons** - Additional icon sets

### Media & Performance
- **React Player** - Video player component
- **React Lazy Load Image** - Image lazy loading
- **React Intersection Observer** - Viewport intersection detection
- **Embla Carousel** - Touch-friendly carousel component

### Development Tools
- **ESLint** - Code linting and formatting
- **PostCSS** - CSS processing with Autoprefixer
- **Axios** - HTTP client with interceptors

## 📁 Project Structure

```
react-app/
├── public/                 # Static assets
│   ├── favicon.ico
│   └── default/           # Default thumbnails and images
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── auth/         # Authentication components
│   │   ├── common/       # Shared components (Header, Layout, etc.)
│   │   ├── manga/        # Manga-specific components
│   │   ├── movie/        # Movie-specific components
│   │   └── music/        # Music-specific components
│   ├── constants/        # Application constants and configuration
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Page components (routes)
│   │   ├── manga/       # Manga pages
│   │   ├── movie/       # Movie pages
│   │   └── music/       # Music pages
│   ├── store/           # Zustand state management
│   ├── styles/          # CSS and styling files
│   ├── utils/           # Utility functions and API services
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # Application entry point
│   └── index.css        # Global styles
├── docs/                # Documentation files
├── package.json         # Dependencies and scripts
├── tailwind.config.js   # TailwindCSS configuration
├── vite.config.js       # Vite configuration
└── postcss.config.js    # PostCSS configuration
```

## 🚦 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Backend server running on port 3000

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd react-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file for local development:
   ```env
   VITE_DISABLE_STRICT_MODE=false
   VITE_BASE=/
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3001`

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run dev:no-hmr` - Start development server without HMR (no ping requests)
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality

### Troubleshooting HMR Ping Requests

If you're experiencing frequent ping requests from Vite HMR (especially over Tailscale), you can:

1. **Disable HMR temporarily**:
   ```bash
   npm run dev:no-hmr
   ```

2. **Or set environment variable**:
   ```env
   VITE_DISABLE_HMR=true
   ```

3. **Or adjust HMR timeout settings** in `vite.config.js`:
   ```js
   hmr: {
     timeout: 60000,
     pingTimeout: 30000
   }
   ```

Note: Disabling HMR means you'll need to manually refresh the browser for changes.

## 🔧 Configuration

### Vite Configuration
The app uses Vite with React plugin and includes:
- Path aliases (`@` points to `src/`)
- Proxy configuration for backend API calls
- Production build optimization

### TailwindCSS Configuration
Custom theme extensions include:
- Primary and dark color palettes
- Custom animations (fade-in, slide-up, scale-in)
- Aspect ratios for media content
- Responsive breakpoints

### API Proxy Setup
Development server proxies API calls to backend:
- `/api/*` → `http://localhost:3000`
- `/manga/*` → `http://localhost:3000`
- `/video/*` → `http://localhost:3000`
- `/audio/*` → `http://localhost:3000`

## 🎯 Key Features Deep Dive

### State Management Architecture
- **Auth Store**: User authentication, source keys, tokens
- **UI Store**: Theme, sidebar, modals, loading states
- **Manga Store**: Manga data, reader settings, favorites
- **Movie Store**: Movie data, player settings, favorites  
- **Music Store**: Music data, playlists, player state

### Caching Strategy
- Local storage persistence for user preferences
- In-memory caching for API responses
- Deduplication of in-flight requests
- Cache invalidation and cleanup utilities

### Responsive Design
- Mobile-first approach with TailwindCSS
- Adaptive layouts for different screen sizes
- Touch-friendly interactions
- Progressive enhancement

## 🔒 Security Features

- Token-based authentication with automatic refresh
- Secure source key validation
- Protected routes with authentication guards
- XSS protection with proper data sanitization

## 🚀 Performance Optimizations

- Code splitting with React.lazy()
- Image lazy loading with intersection observer
- Virtual scrolling for large lists
- Debounced search and input handling
- Optimized re-renders with proper dependency arrays

## 🧪 Development Guidelines

### Code Style
- Use functional components with hooks
- Follow React best practices and patterns
- Implement proper error boundaries
- Use TypeScript-style JSDoc comments

### Component Structure
- Keep components small and focused
- Use custom hooks for complex logic
- Implement proper prop validation
- Follow consistent naming conventions

## 📚 API Integration

The app integrates with a Node.js backend providing:
- Manga folder scanning and caching
- Movie metadata and thumbnail generation
- Music playlist and metadata management
- User authentication and authorization
- File serving and streaming capabilities

## 🐛 Troubleshooting

### Common Issues

1. **API Connection Issues**
   - Ensure backend server is running on port 3000
   - Check proxy configuration in `vite.config.js`

2. **Authentication Problems**
   - Clear browser localStorage and cookies
   - Verify source keys are properly configured

3. **Performance Issues**
   - Check browser developer tools for memory leaks
   - Verify image lazy loading is working properly

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following the coding guidelines
4. Test thoroughly across different browsers and devices
5. Submit a pull request with detailed description

## 📄 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

- React team for the amazing framework
- TailwindCSS for the utility-first CSS approach
- Vite team for the fast build tool
- All open source contributors whose libraries make this project possible
