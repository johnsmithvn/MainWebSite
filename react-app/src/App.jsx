// 📁 src/App.jsx
// 🎯 Main App component

import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useUIStore } from '@/store';
import Layout from '@/components/common/Layout';

// Pages
import Home from '@/pages/Home';
import MangaSelect from '@/pages/manga/MangaSelect';
import MangaHome from '@/pages/manga/MangaHome';
import MangaReader from '@/pages/manga/MangaReader';
import MangaFavorites from '@/pages/manga/MangaFavorites';
import MovieSelect from '@/pages/movie/MovieSelect';
import MovieHome from '@/pages/movie/MovieHome';
import MoviePlayer from '@/pages/movie/MoviePlayer';
import MovieFavorites from '@/pages/movie/MovieFavorites';
import MusicHome from '@/pages/music/MusicHome';
import MusicPlayer from '@/pages/music/MusicPlayer';
import MusicFavorites from '@/pages/music/MusicFavorites';
import Settings from '@/pages/Settings';
import NotFound from '@/pages/NotFound';

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
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        
        {/* Manga routes */}
        <Route path="manga">
          <Route path="select" element={<MangaSelect />} />
          <Route index element={<MangaHome />} />
          <Route path="reader" element={<MangaReader />} />
          <Route path="favorites" element={<MangaFavorites />} />
        </Route>
        
        {/* Movie routes */}
        <Route path="movie">
          <Route path="select" element={<MovieSelect />} />
          <Route index element={<MovieHome />} />
          <Route path="player" element={<MoviePlayer />} />
          <Route path="favorites" element={<MovieFavorites />} />
        </Route>
        
        {/* Music routes */}
        <Route path="music">
          <Route index element={<MusicHome />} />
          <Route path="player" element={<MusicPlayer />} />
          <Route path="favorites" element={<MusicFavorites />} />
        </Route>
        
        {/* Settings */}
        <Route path="settings" element={<Settings />} />
        
        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
