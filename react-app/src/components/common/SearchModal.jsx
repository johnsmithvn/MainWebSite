// 📁 src/components/common/SearchModal.jsx
// 🔍 Global search modal

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiX, FiBook, FiFilm, FiMusic } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import { useDebounceValue } from '../../hooks';
import { apiService } from '../../utils/api';
import { useAuthStore } from '../../store';
import Button from './Button';

const SearchModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('manga');
  const [results, setResults] = useState({
    manga: [],
    movie: [],
    music: []
  });
  const [loading, setLoading] = useState(false);
  
  const debouncedQuery = useDebounceValue(query, 300);
  const { sourceKey, rootFolder } = useAuthStore();

  const tabs = [
    { key: 'manga', label: 'Manga', icon: FiBook },
    { key: 'movie', label: 'Movie', icon: FiFilm },
    { key: 'music', label: 'Music', icon: FiMusic },
  ];

  // Search function
  const performSearch = async (searchQuery, type) => {
    if (!searchQuery || searchQuery.length < 2) return [];

    try {
      setLoading(true);
      let response;

      switch (type) {
        case 'manga':
          response = await apiService.manga.getFolders({
            mode: 'search',
            key: sourceKey,
            root: rootFolder,
            q: searchQuery,
            limit: 20
          });
          break;
        case 'movie':
          response = await apiService.movie.getVideoCache({
            key: sourceKey,
            q: searchQuery,
            limit: 20
          });
          break;
        case 'music':
          response = await apiService.music.getAudioCache({
            key: sourceKey,
            q: searchQuery,
            limit: 20
          });
          break;
        default:
          return [];
      }

      return response.data.folders || response.data || [];
    } catch (error) {
      console.error(`Search error for ${type}:`, error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Search when query changes
  useEffect(() => {
    if (debouncedQuery && isOpen) {
      const searchAll = async () => {
        const [mangaResults, movieResults, musicResults] = await Promise.all([
          performSearch(debouncedQuery, 'manga'),
          performSearch(debouncedQuery, 'movie'),
          performSearch(debouncedQuery, 'music')
        ]);

        setResults({
          manga: mangaResults,
          movie: movieResults,
          music: musicResults
        });
      };

      searchAll();
    } else {
      setResults({ manga: [], movie: [], music: [] });
    }
  }, [debouncedQuery, isOpen, sourceKey, rootFolder]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults({ manga: [], movie: [], music: [] });
    }
  }, [isOpen]);

  const handleResultClick = (item, type) => {
    onClose();
    
    switch (type) {
      case 'manga':
        navigate(`/manga?path=${encodeURIComponent(item.path)}`);
        break;
      case 'movie':
        if (item.type === 'video') {
          navigate(`/movie/player?path=${encodeURIComponent(item.path)}`);
        } else {
          navigate(`/movie?path=${encodeURIComponent(item.path)}`);
        }
        break;
      case 'music':
        navigate(`/music?path=${encodeURIComponent(item.path)}`);
        break;
    }
  };

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
      className="max-w-4xl mx-auto mt-20 bg-white dark:bg-dark-800 rounded-2xl shadow-2xl outline-none"
      overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4"
    >
      <div className="w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Tìm kiếm
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <FiX className="h-5 w-5" />
          </Button>
        </div>

        {/* Search Input */}
        <div className="p-6 border-b border-gray-200 dark:border-dark-700">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm manga, movie, music..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-dark-700 border border-gray-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white"
              autoFocus
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-dark-700">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const count = results[tab.key].length;
            
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {count > 0 && (
                  <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full text-xs">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Đang tìm kiếm...</span>
            </div>
          ) : results[activeTab].length > 0 ? (
            <div className="space-y-2">
              <AnimatePresence>
                {results[activeTab].map((item, index) => (
                  <ResultItem key={`${item.path}-${index}`} item={item} type={activeTab} />
                ))}
              </AnimatePresence>
            </div>
          ) : query.length >= 2 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-500 dark:text-gray-400">
                Không tìm thấy kết quả cho "{query}"
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💡</div>
              <p className="text-gray-500 dark:text-gray-400">
                Nhập ít nhất 2 ký tự để bắt đầu tìm kiếm
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SearchModal;
