// 📁 src/pages/music/MusicPlaylists.jsx
// 🎵 Danh sách playlist

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiList, FiPlus } from 'react-icons/fi';
import { useAuthStore, useUIStore } from '@/store';

const fetchJSON = async (url, options = {}) => {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

const MusicPlaylists = () => {
  const { sourceKey } = useAuthStore();
  const { showToast } = useUIStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [playlists, setPlaylists] = useState([]);

  useEffect(() => {
    const load = async () => {
      if (!sourceKey) return;
      setLoading(true);
      try {
        const data = await fetchJSON(`/api/music/playlists?key=${encodeURIComponent(sourceKey)}`);
        setPlaylists(data || []);
      } catch (err) {
        console.error(err);
        showToast({ type: 'error', message: 'Không tải được playlist' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sourceKey, showToast]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Playlist</h1>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('openPlaylistModal', { detail: { item: { path: '', name: '' } } }))}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
        >
          <FiPlus /> Tạo playlist
        </button>
      </div>

      {loading ? (
        <div>Đang tải...</div>
      ) : playlists.length === 0 ? (
        <div className="text-gray-500">Chưa có playlist nào</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {playlists.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate(`/music/playlist/${p.id}`)}
              className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition overflow-hidden text-left"
            >
              <div className="aspect-square bg-gray-200 dark:bg-dark-700 flex items-center justify-center">
                {p.thumbnail ? (
                  <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <FiList className="w-10 h-10 text-gray-500" />
                )}
              </div>
              <div className="p-3">
                <div className="font-medium line-clamp-1">{p.name}</div>
                {p.description && (
                  <div className="text-xs text-gray-500 line-clamp-1">{p.description}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MusicPlaylists;
