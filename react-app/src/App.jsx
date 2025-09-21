// 📁 src/App.jsx
// 🎯 Main App component

import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useUIStore, useMusicStore } from '@/store';
import Layout from '@/components/common/Layout';

// Pages
import Home from '@/pages/Home';
import MangaSelect from '@/pages/manga/MangaSelect';
import MangaHome from '@/pages/manga/MangaHome';
import MangaReader from '@/pages/manga/MangaReader';
import MangaFavorites from '@/pages/manga/MangaFavorites';
import MovieHome from '@/pages/movie/MovieHome';
import MoviePlayer from '@/pages/movie/MoviePlayer';
import MovieFavorites from '@/pages/movie/MovieFavorites';
import MusicHome from '@/pages/music/MusicHome';
import MusicPlayer from '@/pages/music/MusicPlayer';
import MusicPlayerV2 from '@/pages/music/MusicPlayerV2';
import MusicPlaylists from '@/pages/music/MusicPlaylists';
import Settings from '@/pages/Settings';
import NotFound from '@/pages/NotFound';
import OfflineHome from '@/pages/offline/OfflineHome';
import OfflineMangaLibrary from '@/pages/offline/OfflineMangaLibrary';
import OfflineMovieLibrary from '@/pages/offline/OfflineMovieLibrary';
import OfflineMusicLibrary from '@/pages/offline/OfflineMusicLibrary';

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
    <Routes>
      {/* Full-screen routes outside of the main Layout */}
      <Route path="/manga/reader/:folderId" element={<MangaReader />} />
      <Route path="/manga/reader" element={<MangaReader />} />
      <Route path="/movie/player" element={<MoviePlayer />} />
      <Route path="/music/player" element={<MusicPlayerRouter />} />

      <Route path="/" element={<Layout />}> 
        <Route index element={<Home />} />
        
        {/* Manga routes */}
        <Route path="manga">
          <Route path="select" element={<MangaSelect />} />
          <Route index element={<MangaHome />} />
          <Route path="favorites" element={<MangaFavorites />} />
        </Route>
        
        {/* Movie routes */}
        <Route path="movie">
          <Route index element={<MovieHome />} />
          <Route path="favorites" element={<MovieFavorites />} />
        </Route>
        
  {/* Music routes */}
        <Route path="music">
          <Route index element={<MusicHome />} />
          <Route path="playlists" element={<MusicPlaylists />} />
        </Route>
        
        {/* Settings */}
        <Route path="settings" element={<Settings />} />
        <Route path="offline">
          <Route index element={<OfflineHome />} />
          <Route path="manga" element={<OfflineMangaLibrary />} />
          <Route path="movie" element={<OfflineMovieLibrary />} />
          <Route path="music" element={<OfflineMusicLibrary />} />
        </Route>
        
        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
