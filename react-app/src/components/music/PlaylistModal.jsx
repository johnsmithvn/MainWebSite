// 📁 src/components/music/PlaylistModal.jsx
// ➕ Modal: Add track to playlist (Spotify-style)

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiPlus, FiX, FiMusic, FiList, FiCheck, FiLoader } from 'react-icons/fi';
import { useAuthStore, useUIStore } from '@/store';

const fetchJSON = async (url, options = {}) => {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

const PlaylistModal = () => {
  const { sourceKey } = useAuthStore();
  const { showToast } = useUIStore();

  const [open, setOpen] = useState(false);
  const [track, setTrack] = useState(null); // { path, name, ... }
  const [loading, setLoading] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const modalRef = useRef(null);

  // Listen for global event to open modal
  useEffect(() => {
    const handler = (e) => {
  const item = e.detail?.item || null;
  setTrack(item || null);
  setOpen(true);
    };
    window.addEventListener('openPlaylistModal', handler);
    return () => window.removeEventListener('openPlaylistModal', handler);
  }, []);

  // Fetch playlists when open; include songPath to get hasTrack and prioritize order
  useEffect(() => {
    const load = async () => {
      if (!open || !sourceKey) return;
      setLoading(true);
      try {
        const qs = new URLSearchParams({ key: sourceKey });
        if (track?.path) qs.set('songPath', track.path);
        const data = await fetchJSON(`/api/music/playlists?${qs.toString()}`);
        setPlaylists(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        showToast({ type: 'error', message: 'Không tải được danh sách playlist' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open, sourceKey, track?.path, showToast]);

  const filtered = useMemo(() => {
    if (!search) return playlists;
    const q = search.toLowerCase();
    return playlists.filter((p) => p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
  }, [playlists, search]);

  const close = () => {
    setOpen(false);
    setTrack(null);
    setSearch('');
    setCreating(false);
    setNewName('');
    setNewDesc('');
  };

  // Close on Esc and outside click
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && close();
    const onClick = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) close();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  // Toggle add/remove without closing modal; keep current order until modal is reopened
  const toggleTrackInPlaylist = async (p) => {
    if (!sourceKey || !track?.path) return;
    try {
      setLoading(true);
      if (p.hasTrack) {
        await fetchJSON(`/api/music/playlist/remove`, {
          method: 'DELETE',
          body: JSON.stringify({ key: sourceKey, playlistId: p.id, path: track.path }),
        });
        showToast({ type: 'success', message: 'Đã xoá khỏi playlist' });
      } else {
        await fetchJSON(`/api/music/playlist/add`, {
          method: 'POST',
          body: JSON.stringify({ key: sourceKey, playlistId: p.id, path: track.path }),
        });
        showToast({ type: 'success', message: 'Đã thêm vào playlist' });
      }
  // Update local state: flip hasTrack but DO NOT reorder
  setPlaylists((prev) => prev.map((x) => (x.id === p.id ? { ...x, hasTrack: !p.hasTrack } : x)));
    } catch (err) {
      console.error(err);
      showToast({ type: 'error', message: p.hasTrack ? 'Xoá khỏi playlist thất bại' : 'Thêm vào playlist thất bại' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!sourceKey || !newName.trim()) return;
    try {
      setCreating(true);
      const data = await fetchJSON(`/api/music/playlist`, {
        method: 'POST',
        body: JSON.stringify({ key: sourceKey, name: newName.trim(), description: newDesc.trim() }),
      });
      // Try auto-add current track to new playlist (if any), but do not reorder list
      let added = false;
      if (data?.id && track?.path) {
        try {
          await fetchJSON(`/api/music/playlist/add`, {
            method: 'POST',
            body: JSON.stringify({ key: sourceKey, playlistId: data.id, path: track.path }),
          });
          added = true;
        } catch (e) {
          console.warn('Auto-add to new playlist failed:', e);
        }
      }
      // Append new playlist locally to preserve current visual order in this session
      if (data?.id) {
        setPlaylists((prev) => ([
          ...prev,
          {
            id: data.id,
            name: newName.trim(),
            description: newDesc.trim(),
            thumbnail: null,
            updatedAt: Date.now(),
            hasTrack: track?.path ? !!added : undefined,
          },
        ]));
        // Reset inputs
        setNewName('');
        setNewDesc('');
      }
    } catch (err) {
      console.error(err);
      showToast({ type: 'error', message: 'Tạo playlist thất bại' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[105] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-dark-800 ring-1 ring-black/5 dark:ring-white/10"
          >
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg"><FiList className="w-5 h-5" /></div>
                <div>
                  <div className="text-sm opacity-90">Thêm vào playlist</div>
                  <div className="text-lg font-semibold line-clamp-1 flex items-center gap-2">
                    <FiMusic /> {track?.name || track?.title || track?.path?.split('/')?.pop() || 'Bài hát'}
                  </div>
                </div>
              </div>
              <button onClick={close} className="p-2 hover:bg-white/10 rounded-lg"><FiX className="w-5 h-5" /></button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Search */}
              <div className="relative">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm playlist..."
                  className="w-full rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
                />
              </div>

              {/* Create new */}
              <div className="rounded-xl border border-dashed border-gray-300 dark:border-dark-600 p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Tạo playlist mới</div>
                  <button
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                    onClick={handleCreate}
                    disabled={!newName.trim() || creating || loading}
                  >
                    {creating ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiPlus className="w-4 h-4" />}
                    Tạo
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3">
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Tên playlist"
                    className="rounded-lg border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                  />
                  <input
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Mô tả (tuỳ chọn)"
                    className="rounded-lg border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                  />
                </div>
              </div>

              {/* List playlists */}
              <div className="max-h-80 overflow-auto rounded-xl border border-gray-200 dark:border-dark-700 divide-y divide-gray-100 dark:divide-dark-700">
                {loading && (
                  <div className="p-6 text-center text-gray-500">Đang tải...</div>
                )}
                {!loading && filtered.length === 0 && (
                  <div className="p-6 text-center text-gray-500">Chưa có playlist nào</div>
                )}
                {!loading && filtered.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => toggleTrackInPlaylist(p)}
                    className={`w-full group flex items-center gap-3 px-4 py-3 transition-colors ${p.hasTrack ? 'bg-emerald-50/60 dark:bg-emerald-900/10' : 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}
                  >
                    <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-200 dark:bg-dark-700 flex items-center justify-center">
                      {p.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <FiList className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900 dark:text-white line-clamp-1">{p.name}</div>
                      {p.description ? (
                        <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{p.description}</div>
                      ) : (
                        <div className="text-sm text-gray-400">Playlist</div>
                      )}
                    </div>
                    <div className={`shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-full border-2 ${p.hasTrack ? 'border-emerald-600 text-emerald-600 bg-white/60' : 'border-emerald-600/40 text-emerald-600/70 group-hover:border-emerald-600 group-hover:text-emerald-600'}`}>
                      {p.hasTrack ? <FiCheck className="w-4 h-4" /> : <FiPlus className="w-4 h-4" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  export default PlaylistModal;
