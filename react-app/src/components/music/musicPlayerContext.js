// 📁 src/components/music/musicPlayerContext.js
// 🎧 Contexts + hooks of the global music player (provider lives in MusicPlayerProvider.jsx)

import { createContext, useContext } from 'react';

export const MusicPlayerContext = createContext(null);
// Progress changes ~4x/second: kept in its own context so only progress UIs re-render
export const MusicProgressContext = createContext({ currentTime: 0, duration: 0, buffered: 0 });

export const useMusicPlayer = () => {
  const ctx = useContext(MusicPlayerContext);
  if (!ctx) throw new Error('useMusicPlayer must be used inside <MusicPlayerProvider>');
  return ctx;
};

export const useMusicProgress = () => useContext(MusicProgressContext);

export const formatTime = (time) => {
  if (!time || isNaN(time)) return '0:00';
  const m = Math.floor(time / 60);
  const s = Math.floor(time % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};
