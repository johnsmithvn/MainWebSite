// 📁 src/pages/music/PlaylistDetail.jsx
// 🎵 Chi tiết playlist + play

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiList, FiPlay, FiTrash2 } from 'react-icons/fi';
import { useAuthStore, useUIStore } from '@/store';

const fetchJSON = async (url, options = {}) => {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

const PlaylistDetail = () => {
  const { id } = useParams();
  const { sourceKey } = useAuthStore();
  const { showToast } = useUIStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [playlist, setPlaylist] = useState(null);

  const load = async () => {
    if (!sourceKey || !id) return;
    setLoading(true);
    try {
      const data = await fetchJSON(`/api/music/playlist/${id}?key=${encodeURIComponent(sourceKey)}`);
      setPlaylist(data);
    } catch (err) {
      console.error(err);
      showToast({ type: 'error', message: 'Không tải được playlist' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id, sourceKey]);

  const playAll = () => {
    if (!playlist) return;
    navigate('/music/player', { state: { playlist: playlist.id, key: sourceKey } });
  };

  const removeTrack = async (path) => {
    try {
      await fetchJSON('/api/music/playlist/remove', {
        method: 'DELETE',
        body: JSON.stringify({ key: sourceKey, playlistId: Number(id), path })
      });
      showToast({ type: 'success', message: 'Đã xóa khỏi playlist' });
      load();
    } catch (err) {
      console.error(err);
      showToast({ type: 'error', message: 'Xóa thất bại' });
    }
  };

  if (loading && !playlist) return <div>Đang tải...</div>;
  if (!playlist) return <div>Không tìm thấy playlist</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{playlist.name}</h1>
          {playlist.description && (
            <p className="text-gray-500">{playlist.description}</p>
          )}
        </div>
        <button onClick={playAll} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
          <FiPlay /> Phát tất cả
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {playlist.tracks?.map((t) => (
          <div key={t.path} className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg p-3">
            <div className="w-12 h-12 rounded overflow-hidden bg-gray-200 dark:bg-dark-700 flex items-center justify-center">
              {t.thumbnail ? (
                <img src={t.thumbnail} alt={t.name} className="w-full h-full object-cover" />
              ) : (
                <FiList className="w-5 h-5 text-gray-500" />
              )}
            </div>
            <div className="flex-1">
              <div className="font-medium line-clamp-1">{t.name || t.path?.split('/').pop()}</div>
              {t.artist && <div className="text-xs text-gray-500">{t.artist}</div>}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/music/player', { state: { file: t.path, playlist: playlist.id, key: sourceKey } })}
                className="px-2 py-1 text-sm rounded bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600"
              >
                <FiPlay />
              </button>
              <button
                onClick={() => removeTrack(t.path)}
                className="px-2 py-1 text-sm rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <FiTrash2 />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlaylistDetail;
