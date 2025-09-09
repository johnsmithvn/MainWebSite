// 📁 src/components/common/SearchModal.jsx
// 🔍 Global search modal

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiX, FiChevronDown } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import { useDebounceValue } from '../../hooks';
import { apiService } from '../../utils/api';
import { useAuthStore } from '../../store';
import Button from './Button';
import { buildThumbnailUrl } from '../../utils/thumbnailUtils';

// Supported search type options: all, folder, file/audio/video (normalized per section)
const TYPE_OPTIONS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'folder', label: 'Folder' },
  { key: 'file', label: 'File' },
];

const SearchModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [results, setResults] = useState([]); // compact suggestions list
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const LIMIT = 30; // page size for incremental load
  const abortRef = useRef(null); // abort for main search (not for load-more)
  const listRef = useRef(null); // suggestions scroll area
  
  const debouncedQuery = useDebounceValue(query, 300);
  const { sourceKey, rootFolder, lastMusicKey, lastMovieKey } = useAuthStore();
  const section = (/^\/(manga|movie|music)/.exec(location.pathname)?.[1]) || 'manga';

  // Normalize type per section for backend params
  const resolveBackendType = useCallback((section) => {
    if (typeFilter === 'all') return 'all';
    if (typeFilter === 'folder') return 'folder';
    // file mapping per section
    if (section === 'movie') return 'video';
    if (section === 'music') return 'audio';
    // manga search ignores type; handled on server by folders table
    return 'all';
  }, [typeFilter]);

  // Perform search for current section (suggestions only)
  const fetchSection = useCallback(async (section, searchQuery, pageOffset = 0, isLoadMore = false) => {
    if (!searchQuery || searchQuery.length < 2) return { items: [], hasMore: false };
    // Only abort previous when it's a fresh search, not when loading more
    let controller;
    if (!isLoadMore) {
      if (abortRef.current) abortRef.current.abort();
      controller = new AbortController();
      abortRef.current = controller;
    }

    try {
      if (isLoadMore) setLoadingMore(true); else setLoading(true);
      let resp;
      if (section === 'manga') {
        if (!sourceKey || !rootFolder) return { items: [], hasMore: false };
        resp = await apiService.manga.getFolders({
          mode: 'search', key: sourceKey, root: rootFolder, q: searchQuery, limit: LIMIT, offset: pageOffset
        }, isLoadMore ? {} : { signal: controller.signal });
        const items = resp.data || [];
        return { items, hasMore: items.length === LIMIT };
      }
      if (section === 'movie') {
        if (!sourceKey) return { items: [], hasMore: false };
        resp = await apiService.movie.getVideoCache({
          mode: 'search', key: sourceKey, q: searchQuery, type: resolveBackendType('movie'), limit: LIMIT, offset: pageOffset
        }, isLoadMore ? {} : { signal: controller.signal });
        const items = resp.data?.folders || [];
        return { items, hasMore: items.length === LIMIT };
      }
      if (section === 'music') {
        if (!sourceKey) return { items: [], hasMore: false };
        resp = await apiService.music.getAudioCache({
          mode: 'search', key: sourceKey, q: searchQuery, type: resolveBackendType('music'), limit: LIMIT, offset: pageOffset
        }, isLoadMore ? {} : { signal: controller.signal });
        const items = resp.data?.folders || [];
        return { items, hasMore: items.length === LIMIT };
      }
      return { items: [], hasMore: false };
    } catch (error) {
      if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
        console.error(`Search error for ${section}:`, error);
      }
      return { items: [], hasMore: false };
    } finally {
      if (isLoadMore) setLoadingMore(false); else setLoading(false);
    }
  }, [LIMIT, resolveBackendType, rootFolder, sourceKey]);

  // Search when query changes
  // Initial search or when filters change
  useEffect(() => {
    if (!isOpen) return;
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
  setOffset(0);
  setHasMore(false);
      return;
    }
    const load = async () => {
  const { items, hasMore } = await fetchSection(section, debouncedQuery, 0, false);
  setResults(items);
  setOffset(items.length);
  setHasMore(hasMore);
    };
    load();
  }, [debouncedQuery, isOpen, typeFilter, sourceKey, rootFolder, fetchSection, section]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
  setResults([]);
      setTypeFilter('all');
  setOffset(0);
  setHasMore(false);
    }
  }, [isOpen]);

  const handleResultClick = (item) => {
    onClose();
    
    switch (section) {
      case 'manga':
        // Check if we have valid manga source
        if (!sourceKey || !sourceKey.startsWith('ROOT_')) {
          alert('Vui lòng chọn source manga từ trang chủ');
          navigate('/');
          return;
        }
        navigate(`/manga?path=${encodeURIComponent(item.path)}`);
        break;
      case 'movie':
        // Check if we have valid movie source
        if (!sourceKey || !sourceKey.startsWith('V_')) {
          alert('Vui lòng chọn source movie từ trang chủ');
          navigate('/');
          return;
        }
        if (item.type === 'video' || item.type === 'file') {
          navigate('/movie/player', { state: { file: item.path, key: sourceKey } });
        } else {
          navigate(`/movie?path=${encodeURIComponent(item.path)}`);
        }
        break;
      case 'music':
        // Check if we have valid music source
        if (!sourceKey || !sourceKey.startsWith('M_')) {
          alert('Vui lòng chọn source music từ trang chủ');
          navigate('/');
          return;
        }
        const isPlaylist = item.isPlaylist;
        const isAudio = item.type === 'audio' || item.type === 'file';
        if (isPlaylist) {
          navigate('/music/player', { state: { kind: 'playlist', playlist: item.path, key: sourceKey } });
        } else if (isAudio) {
          const folderPath = item.path?.split('/').slice(0, -1).join('/') || '';
          navigate('/music/player', { state: { kind: 'audio', file: item.path, playlist: folderPath, key: sourceKey } });
        } else {
          // For folders, open as playlist in player like sliders
          navigate('/music/player', { state: { kind: 'folder', playlist: item.path, key: sourceKey } });
        }
        break;
    }
  };

  const goSeeAll = () => {
    onClose();
    const params = new URLSearchParams();
    params.set('q', query);
    if (typeFilter && typeFilter !== 'all') params.set('type', typeFilter);
    if (section === 'manga' && rootFolder) params.set('root', rootFolder);
    navigate(`/${section}?${params.toString()}`);
  };

  // Handle infinite scroll inside suggestions
  const handleScroll = useCallback(async () => {
    const el = listRef.current;
    if (!el || loading || loadingMore || !hasMore) return;
    const threshold = 80; // px
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - threshold) {
      const { items, hasMore: more } = await fetchSection(section, debouncedQuery, offset, true);
      if (items.length > 0) {
        setResults((prev) => [...prev, ...items]);
        setOffset(offset + items.length);
        setHasMore(more);
      } else {
        setHasMore(false);
      }
    }
  }, [debouncedQuery, fetchSection, hasMore, loading, loadingMore, offset, section]);

  const ResultItem = ({ item, type }) => {
    const getIcon = () => {
      switch (type) {
        case 'manga': return '📚';
        case 'movie': return item.type === 'video' ? '🎬' : '📁';
        case 'music': return '🎵';
        default: return '📄';
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 cursor-pointer transition-colors"
        onClick={() => handleResultClick(item, type)}
      >
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.name}
            className="w-12 h-16 object-cover rounded bg-gray-200 dark:bg-dark-600"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-12 h-16 bg-gray-200 dark:bg-dark-600 rounded flex items-center justify-center text-xl">
            {getIcon()}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-white truncate">
            {item.name}
          </h3>
          {item.viewCount !== undefined && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              👁️ {item.viewCount} lượt xem
            </p>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="outline-none"
      overlayClassName="fixed inset-0 bg-black/50 z-50"
    >
      {/* Top search bar */}
      <div className="w-full flex items-start justify-center mt-6">
        <div className="relative w-full max-w-2xl px-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm (mặc định cả Folder + File)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                autoFocus
              />
              {/* Suggestions dropdown */}
              <AnimatePresence>
                {isOpen && query && query.length >= 2 && (results.length > 0 || !loading) && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute left-0 right-0 mt-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl shadow-xl overflow-hidden"
                  >
                    <div
                      className="max-h-80 overflow-y-auto"
                      ref={listRef}
                      onScroll={handleScroll}
                    >
                      {loading && (
                        <div className="p-3 text-sm text-gray-500 dark:text-gray-400">Đang tìm kiếm…</div>
                      )}
                      {!loading && results.map((item, index) => (
                        <SuggestionItem key={`search-${index}-${item.path?.replace(/[^a-zA-Z0-9]/g, '_') || index}`} item={item} onClick={() => handleResultClick(item)} />
                      ))}
                      {loadingMore && (
                        <div className="p-3 text-center text-xs text-gray-500 dark:text-gray-400">Đang tải thêm…</div>
                      )}
                      {!loading && results.length === 0 && (
                        <div className="p-3 text-sm text-gray-500 dark:text-gray-400">Không tìm thấy kết quả</div>
                      )}
                    </div>
                    {/* See all */}
                    {query && (
                      <button onClick={goSeeAll} className="w-full text-left px-3 py-2 text-sm bg-gray-50 dark:bg-dark-700/60 hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-200">
                        Tìm tất cả kết quả cho từ khóa “{query}”
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* Mode dropdown */}
            <div className="relative">
              <Button variant="secondary" onClick={() => setDropdownOpen((v) => !v)}>
                {TYPE_OPTIONS.find((t) => t.key === typeFilter)?.label || 'Tất cả'}
                <FiChevronDown className="ml-2" />
              </Button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg shadow-lg z-10">
                  {TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => { setTypeFilter(opt.key); setDropdownOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-dark-700 ${typeFilter === opt.key ? 'text-primary-600' : 'text-gray-700 dark:text-gray-200'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <FiX className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

const SuggestionItem = ({ item, onClick }) => {
  // Best-effort infer section from path prefix; fall back to generic
  const mediaType = item?.type === 'audio' ? 'music' : (item?.type === 'video' ? 'movie' : 'manga');
  const src = buildThumbnailUrl(item, mediaType);
  const fallback = mediaType === 'music' ? '/default/music-thumb.png' : (mediaType === 'movie' ? '/default/video-thumb.png' : '/default/folder-thumb.png');
  return (
    <div
      className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-dark-700 cursor-pointer"
      onClick={onClick}
    >
      <img
        src={src}
        alt={item.name}
        className="w-10 h-10 rounded object-cover bg-gray-200 dark:bg-dark-600"
        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = fallback; }}
      />
      <div className="min-w-0">
        <div className="text-sm text-gray-900 dark:text-white truncate">{item.name}</div>
        {typeof item.viewCount === 'number' && (
          <div className="text-xs text-gray-500 dark:text-gray-400">👁️ {item.viewCount}</div>
        )}
      </div>
    </div>
  );
};

export default SearchModal;
