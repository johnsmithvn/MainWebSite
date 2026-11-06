// 📁 src/App.jsx
// 🎯 Main App component

import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useUIStore, useMusicStore } from '@/store';
import Layout from '@/components/common/Layout';
import PlaylistModal from '@/components/music/PlaylistModal';
import MusicPlayerProvider from '@/components/music/MusicPlayerProvider';
import { useMiniPlayerVisible, MINI_PLAYER_HEIGHT } from '@/components/music/MiniPlayer';
import Toast from '@/components/common/Toast';

// Pages
// ⚡ Trang chủ và 404 tải ngay; các trang khác tách thành chunk riêng, chỉ tải khi mở
// (PERFORMANCE-CACHE-REPORT PF4). Trước đây cả app là một file JS ~1 MB tải ngay lần đầu.
import Home from '@/pages/Home';
import NotFound from '@/pages/NotFound';

const pageLoaders = {
  MangaSelect: () => import('@/pages/manga/MangaSelect'),
  MangaHome: () => import('@/pages/manga/MangaHome'),
  MangaReader: () => import('@/pages/manga/MangaReader'),
  MangaFavorites: () => import('@/pages/manga/MangaFavorites'),
  MovieHome: () => import('@/pages/movie/MovieHome'),
  MoviePlayer: () => import('@/pages/movie/MoviePlayer'),
  MovieFavorites: () => import('@/pages/movie/MovieFavorites'),
  MusicHome: () => import('@/pages/music/MusicHome'),
  MusicPlayer: () => import('@/pages/music/MusicPlayer'),
  MusicPlayerV2: () => import('@/pages/music/MusicPlayerV2'),
  MusicPlaylists: () => import('@/pages/music/MusicPlaylists'),
  MediaHome: () => import('@/pages/media/MediaHome'),
  Settings: () => import('@/pages/Settings'),
  OfflineHome: () => import('@/pages/offline/OfflineHome'),
  OfflineMangaLibrary: () => import('@/pages/offline/OfflineMangaLibrary'),
  OfflineMovieLibrary: () => import('@/pages/offline/OfflineMovieLibrary'),
  OfflineMusicLibrary: () => import('@/pages/offline/OfflineMusicLibrary'),
  DownloadManager: () => import('@/pages/downloads/DownloadManager'),
};

const MangaSelect = lazy(pageLoaders.MangaSelect);
const MangaHome = lazy(pageLoaders.MangaHome);
const MangaReader = lazy(pageLoaders.MangaReader);
const MangaFavorites = lazy(pageLoaders.MangaFavorites);
const MovieHome = lazy(pageLoaders.MovieHome);
const MoviePlayer = lazy(pageLoaders.MoviePlayer);
const MovieFavorites = lazy(pageLoaders.MovieFavorites);
const MusicHome = lazy(pageLoaders.MusicHome);
const MusicPlayer = lazy(pageLoaders.MusicPlayer);
const MusicPlayerV2 = lazy(pageLoaders.MusicPlayerV2);
const MusicPlaylists = lazy(pageLoaders.MusicPlaylists);
const MediaHome = lazy(pageLoaders.MediaHome);
const Settings = lazy(pageLoaders.Settings);
const OfflineHome = lazy(pageLoaders.OfflineHome);
const OfflineMangaLibrary = lazy(pageLoaders.OfflineMangaLibrary);
const OfflineMovieLibrary = lazy(pageLoaders.OfflineMovieLibrary);
const OfflineMusicLibrary = lazy(pageLoaders.OfflineMusicLibrary);
const DownloadManager = lazy(pageLoaders.DownloadManager);

/**
 * Khi trình duyệt rảnh, tải trước mọi trang. Mục đích: (1) mở trang lần đầu không phải chờ,
 * (2) Service Worker lưu sẵn các chunk nên khi mất mạng vẫn mở được mọi trang (offline library,
 * reader…) như lúc app còn là một file duy nhất.
 */
function prefetchAllPages() {
  const run = () => {
    Object.values(pageLoaders).forEach((load) => {
      load().catch(() => { /* offline hoặc lỗi mạng: sẽ tải khi mở trang */ });
    });
  };
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(run, { timeout: 8000 });
  } else {
    setTimeout(run, 3000);
  }
}

// Khung tạm trong lúc tải chunk của trang (thường chỉ vài chục ms)
function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]" role="status" aria-label="Đang tải">
      <div className="h-8 w-8 rounded-full border-2 border-gray-300 border-t-transparent animate-spin dark:border-gray-600 dark:border-t-transparent" />
    </div>
  );
}

const page = (element) => <Suspense fallback={<PageFallback />}>{element}</Suspense>;

function MusicPlayerRouter() {
  const { playerSettings } = useMusicStore();
  const isMobile = (() => {
    if (typeof window === 'undefined') return false;
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const mobileUA = /Mobi|Android|iPhone|iPad|iPod|Mobile/i.test(ua);
    const narrow = window.innerWidth <= 768;
    return mobileUA || narrow;
  })();

  // On mobile, always force v1
  if (isMobile) return <MusicPlayer />;

  return playerSettings?.playerUI === 'v2' ? <MusicPlayerV2 /> : <MusicPlayer />;
}

function App() {
  const { darkMode } = useUIStore();
  const location = useLocation();
  const miniPlayerVisible = useMiniPlayerVisible();
  // Lift hot-toasts above the music player footer (100px) or the mini player bar
  const toasterContainerStyle = location.pathname.startsWith('/music/player')
    ? { bottom: 112 }
    : miniPlayerVisible ? { bottom: MINI_PLAYER_HEIGHT + 16 } : undefined;

  // Tải trước các trang khi rảnh (PF4)
  useEffect(() => {
    prefetchAllPages();
  }, []);

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [darkMode]);

  return (
    <MusicPlayerProvider>
      {/* Global Playlist Modal */}
      <PlaylistModal />

      {/* Global toast for useUIStore().showToast (all routes, incl. full-screen players) */}
      <Toast />

      {/* Global react-hot-toast container (was only inside Layout, so full-screen routes had no toasts) */}
      <Toaster
        position="bottom-center"
        containerStyle={toasterContainerStyle}
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />

      <Routes>
        {/* Full-screen routes outside of the main Layout */}
        <Route path="/manga/reader/:folderId" element={page(<MangaReader />)} />
        <Route path="/manga/reader" element={page(<MangaReader />)} />
        <Route path="/movie/player" element={page(<MoviePlayer />)} />
        <Route path="/music/player" element={page(<MusicPlayerRouter />)} />

      <Route path="/" element={<Layout />}> 
        <Route index element={<Home />} />
        
        {/* Manga routes */}
        <Route path="manga">
          <Route path="select" element={page(<MangaSelect />)} />
          <Route index element={page(<MangaHome />)} />
          <Route path="favorites" element={page(<MangaFavorites />)} />
        </Route>
        
        {/* Movie routes */}
        <Route path="movie">
          <Route index element={page(<MovieHome />)} />
          <Route path="favorites" element={page(<MovieFavorites />)} />
        </Route>
        
  {/* Music routes */}
        <Route path="music">
          <Route index element={page(<MusicHome />)} />
          <Route path="playlists" element={page(<MusicPlaylists />)} />
        </Route>
        
        {/* Media Gallery routes */}
        <Route path="media">
          <Route index element={page(<MediaHome />)} />
        </Route>
        
        {/* Settings */}
        <Route path="settings" element={page(<Settings />)} />
        
        {/* Downloads */}
        <Route path="downloads" element={page(<DownloadManager />)} />
        
        <Route path="offline">
          <Route index element={page(<OfflineHome />)} />
          <Route path="manga" element={page(<OfflineMangaLibrary />)} />
          <Route path="movie" element={page(<OfflineMovieLibrary />)} />
          <Route path="music" element={page(<OfflineMusicLibrary />)} />
        </Route>
        
        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
    </MusicPlayerProvider>
  );
}

export default App;
