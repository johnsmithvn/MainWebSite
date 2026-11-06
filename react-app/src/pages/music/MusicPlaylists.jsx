// 📁 src/pages/music/MusicPlaylists.jsx
// 🎵 Danh sách playlist

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiList, FiPlus } from 'react-icons/fi';
import { useAuthStore, useUIStore } from '@/store';
import ItemCard from '@/components/common/ItemCard';
import { CARD_GRIDS } from '@/constants';

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
        // Playlist dùng chung ItemCard và lưới của nhạc: ảnh vuông, mép xếp chồng, tên 2 dòng, mô tả ở dòng phụ
        <div className={CARD_GRIDS.music}>
          {playlists.map((p) => (
            <ItemCard
              key={p.id}
              type="music"
              title={p.name}
              thumbnail={p.thumbnail}
              isFolder
              thumbKind="music"
              playable
              subtitle={p.description || (
                <>
                  <FiList className="flex-none" aria-hidden="true" />
                  Playlist
                </>
              )}
              onOpen={() => navigate('/music/player', { state: { playlist: p.id, key: sourceKey } })}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MusicPlaylists;
