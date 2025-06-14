import React, { useEffect, useState } from 'react';

export default function App() {
  const [sources, setSources] = useState({ manga: [], movie: [], music: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/source-keys.js')
      .then(res => res.text())
      .then(js => {
        const fn = new Function(js + '; return {manga: window.mangaKeys, movie: window.movieKeys, music: window.musicKeys};');
        setSources(fn());
      })
      .catch(err => console.error('Failed to load source keys', err));
  }, []);

  const handleClick = async (type, key) => {
    setLoading(true);
    try {
      if (type === 'manga') {
        window.location.href = '/select.html';
      } else if (type === 'movie') {
        const resp = await fetch(`/api/movie/movie-folder-empty?key=${key}`);
        const data = await resp.json();
        if (data.empty) {
          await fetch('/api/movie/scan-movie', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key })
          });
        }
        window.location.href = '/movie/index.html';
      } else if (type === 'music') {
        const resp = await fetch(`/api/music/music-folder?key=${key}`);
        const data = await resp.json();
        if (!data.total || data.total === 0) {
          await fetch('/api/music/scan-music', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key })
          });
        }
        window.location.href = '/music/index.html';
      }
    } catch (err) {
      console.error('error loading data', err);
      alert('Lỗi khi load dữ liệu!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>🎬📚 Chọn nguồn dữ liệu</h1>

      <h2>📚 Manga</h2>
      <div className="source-list">
        {sources.manga.map(key => (
          <div key={key} className="source-btn" onClick={() => handleClick('manga', key)}>
            📁 {key}
          </div>
        ))}
      </div>

      <h2>🎬 Movie</h2>
      <div className="source-list">
        {sources.movie.map(key => (
          <div key={key} className="source-btn" onClick={() => handleClick('movie', key)}>
            📁 {key}
          </div>
        ))}
      </div>

      <h2>🎵 Music</h2>
      <div className="source-list">
        {sources.music.map(key => (
          <div key={key} className="source-btn" onClick={() => handleClick('music', key)}>
            📁 {key}
          </div>
        ))}
      </div>

      {loading && (
        <div id="loading-overlay">
          <div className="loader-text">⏳ Đang tải...</div>
        </div>
      )}
    </div>
  );
}
