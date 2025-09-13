// 📁 src/components/music/PlayerHeader.jsx
// 🎵 Shared Header Component for both MusicPlayer v1 and v2

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiChevronLeft,
  FiChevronRight,
  FiLayout,
  FiHome,
  FiSearch,
} from 'react-icons/fi';
import { useMusicStore, useAuthStore } from '@/store';
import { buildThumbnailUrl } from '@/utils/thumbnailUtils';
import { useDebounceValue } from '@/hooks';
import { DEFAULT_IMAGES } from '@/constants';
import { apiService } from '@/utils/api';

const PlayerHeader = ({ 
  folderTitle, 
  headerCondensed, 
  theme = 'v1' // 'v1' for Spotify-style, 'v2' for Zing-style
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { playerSettings, updatePlayerSettings } = useMusicStore();
  const { sourceKey } = useAuthStore();

  // Search states
  const [filterQuery, setFilterQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchWrapRef = useRef(null);
  const suggestionsListRef = useRef(null);
  const searchAbortRef = useRef(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchLoadingMore, setSearchLoadingMore] = useState(false);
  const [searchOffset, setSearchOffset] = useState(0);
  const [searchHasMore, setSearchHasMore] = useState(false);
  const SEARCH_LIMIT = 30;

  // Theme-specific styles
  const themeConfig = {
    v1: {
      bgColor: headerCondensed ? 'bg-[#121212]/95' : 'bg-[#121212]/70',
      gradient: 'from-[#1f1f1f] via-[#121212] to-[#000]',
      accentColor: 'text-green-400',
      borderColor: 'border-white/10',
      buttonBg: 'bg-white/10 hover:bg-white/20',
      inputBg: 'bg-white/10',
      dropdownBg: 'bg-[#1a1a1a]',
    },
    v2: {
      bgColor: headerCondensed ? 'bg-[#1a0f24]/95' : 'bg-[#1a0f24]/70',
      gradient: 'from-[#2d1b4e] via-[#1a0f24] to-[#0f0518]',
      accentColor: 'text-[#b58dff]',
      borderColor: 'border-white/10',
      buttonBg: 'bg-white/10 hover:bg-white/20',
      inputBg: 'bg-white/10',
      dropdownBg: 'bg-[#1a0f24]',
    }
  };

  const config = themeConfig[theme] || themeConfig.v1;

  // Close search suggestions when clicking outside
  useEffect(() => {
    const onDocClick = (e) => {
      if (!searchWrapRef.current) return;
      if (!searchWrapRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Debounced query for API suggestions
  const debouncedQuery = useDebounceValue(filterQuery, 300);

  // Fetch suggestions from API
  const fetchSuggestions = useCallback(async (q, pageOffset = 0, isLoadMore = false) => {
    if (!q?.trim() || !sourceKey) return { items: [], hasMore: false };
    
    try {
      if (!isLoadMore) setSearchLoading(true);
      else setSearchLoadingMore(true);

      const res = await apiService.music.getAudioCache({
        mode: 'search',
        key: sourceKey,
        q: q.trim(),
        type: 'all',
        limit: SEARCH_LIMIT,
        offset: pageOffset,
      });

      const items = Array.isArray(res.data?.folders) ? res.data.folders : [];
      const hasMore = items.length === SEARCH_LIMIT;

      return { items, hasMore };
    } catch (err) {
      console.error('Search failed:', err);
      return { items: [], hasMore: false };
    } finally {
      setSearchLoading(false);
      setSearchLoadingMore(false);
    }
  }, [SEARCH_LIMIT, sourceKey]);

  // Load suggestions when query changes
  useEffect(() => {
    if (!debouncedQuery?.trim() || !searchOpen) {
      setSearchResults([]);
      setSearchOffset(0);
      setSearchHasMore(false);
      return;
    }

    const load = async () => {
      const { items, hasMore } = await fetchSuggestions(debouncedQuery, 0, false);
      setSearchResults(items);
      setSearchOffset(items.length);
      setSearchHasMore(hasMore);
    };

    load();
  }, [debouncedQuery, searchOpen, fetchSuggestions]);

  // Infinite scroll inside suggestions
  const handleSuggestionsScroll = useCallback(async () => {
    const el = suggestionsListRef.current;
    if (!el || searchLoading || searchLoadingMore || !searchHasMore) return;
    const threshold = 80;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - threshold) {
      const { items, hasMore } = await fetchSuggestions(debouncedQuery, searchOffset, true);
      if (items.length > 0) {
        setSearchResults((prev) => [...prev, ...items]);
        setSearchOffset(searchOffset + items.length);
        setSearchHasMore(hasMore);
      } else {
        setSearchHasMore(false);
      }
    }
  }, [debouncedQuery, fetchSuggestions, searchHasMore, searchLoading, searchLoadingMore, searchOffset]);

  return (
    <div
      className={`sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 ${headerCondensed ? 'py-2' : 'py-4'} gap-3 backdrop-blur border-b ${config.borderColor} transition-[background-color,box-shadow,padding] duration-200 ${
        headerCondensed ? `${config.bgColor} shadow-[0_2px_10px_rgba(0,0,0,0.35)]` : config.bgColor
      }`}
    >
      {/* Left controls: nav + mode + home */}
      <div className="flex items-center gap-2 min-w-[220px]">
        <button onClick={() => navigate(-1)} className={`p-2 rounded-full ${config.buttonBg}`}>
          <FiChevronLeft className="w-5 h-5" />
        </button>
        <button onClick={() => navigate(1)} className={`p-2 rounded-full ${config.buttonBg}`}>
          <FiChevronRight className="w-5 h-5" />
        </button>
        {(() => {
          const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
          const isMobile = /Mobi|Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (typeof window !== 'undefined' && window.innerWidth <= 768);
          return (
            <button
              onClick={() => {
                if (isMobile) return;
                const next = playerSettings?.playerUI === 'v2' ? 'v1' : 'v2';
                updatePlayerSettings({ playerUI: next });
                navigate('/music/player', { replace: true, state: location.state });
              }}
              className={`px-3 py-1.5 rounded-full ${isMobile ? 'bg-white/10 text-white/60 cursor-not-allowed' : config.buttonBg + ' text-white'} text-sm hidden md:flex items-center gap-2`}
              title={isMobile ? 'Không khả dụng trên mobile' : 'Đổi giao diện Music Player'}
              disabled={isMobile}
            >
              <FiLayout className="w-4 h-4" /> {playerSettings?.playerUI === 'v2' ? 'Zing' : 'Spotify'}
            </button>
          );
        })()}
        <button onClick={() => navigate('/music')} className={`px-3 py-1.5 rounded-full ${config.buttonBg} text-sm hidden sm:inline-flex`}>
          <FiHome className="inline w-4 h-4 mr-1" /> Music Home
        </button>
        {headerCondensed && (
          <span className="ml-2 hidden md:inline text-white font-semibold truncate max-w-[40vw]">
            {folderTitle}
          </span>
        )}
      </div>

      {/* Center search */}
      <div className="flex-1 max-w-2xl mx-auto w-full" ref={searchWrapRef}>
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 w-4 h-4" />
          <input
            value={filterQuery}
            onChange={(e) => {
              const v = e.target.value;
              setFilterQuery(v);
              setSearchOpen(v.trim().length >= 2);
            }}
            onFocus={() => setSearchOpen((v) => v || filterQuery.trim().length >= 2)}
            placeholder="Bạn muốn phát gì?"
            className={`w-full pl-9 pr-3 py-2 rounded-full ${config.inputBg} text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-white/30`}
          />
          {/* Suggestions dropdown */}
          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className={`absolute left-0 right-0 mt-2 ${config.dropdownBg} border ${config.borderColor} rounded-xl shadow-xl overflow-hidden z-50`}
              >
                <div className="max-h-80 overflow-y-auto" ref={suggestionsListRef} onScroll={handleSuggestionsScroll}>
                  {searchLoading && (
                    <div className="p-3 text-sm text-white/60">Đang tìm kiếm…</div>
                  )}
                  {!searchLoading && searchResults.map((item, i) => (
                    <div
                      key={(item.path || '') + '-' + i}
                      className="flex items-center gap-3 p-3 hover:bg-white/10 cursor-pointer"
                      onClick={() => {
                        setSearchOpen(false);
                        // Navigate similar to SearchModal behavior
                        const isPlaylist = item.isPlaylist;
                        const isAudio = item.type === 'audio' || item.type === 'file';
                        if (isPlaylist) {
                          navigate('/music/player', { state: { kind: 'playlist', playlist: item.path, key: sourceKey } });
                        } else if (isAudio) {
                          const folderPath = item.path?.split('/').slice(0, -1).join('/') || '';
                          navigate('/music/player', { state: { kind: 'audio', file: item.path, playlist: folderPath, key: sourceKey } });
                        } else {
                          navigate('/music/player', { state: { kind: 'folder', playlist: item.path, key: sourceKey } });
                        }
                      }}
                    >
                      <img
                        src={buildThumbnailUrl(item, 'music')}
                        onError={(e) => (e.currentTarget.src = DEFAULT_IMAGES.music)}
                        alt={item.name}
                        className="w-8 h-8 rounded object-cover flex-none"
                      />
                      <div className="min-w-0">
                        <div className="text-sm text-white truncate" title={item.name}>{item.name}</div>
                        <div className="text-[11px] text-white/60 truncate" title={item.artist || ''}>{item.artist || ''}</div>
                      </div>
                    </div>
                  ))}
                  {searchLoadingMore && (
                    <div className="p-3 text-center text-xs text-white/60">Đang tải thêm…</div>
                  )}
                  {!searchLoading && searchResults.length === 0 && (
                    <div className="p-3 text-sm text-white/60">Không tìm thấy kết quả</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right spacer */}
      <div className="min-w-[120px]" />
    </div>
  );
};

export default PlayerHeader;
