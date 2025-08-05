// 📁 src/components/common/Sidebar.jsx
// 🗂️ Sidebar navigation component

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiHome, 
  FiBook, 
  FiFilm, 
  FiMusic, 
  FiStar, 
  FiSettings,
  FiRefreshCw,
  FiTrash2,
  FiHeart
} from 'react-icons/fi';
import { useAuthStore, useMangaStore, useMovieStore, useMusicStore } from '../../store';
import { apiService } from '../../utils/api';
import toast from 'react-hot-toast';
import Button from './Button';

const Sidebar = () => {
  const location = useLocation();
  const { sourceKey, rootFolder } = useAuthStore();

  const menuItems = [
    {
      title: 'Điều hướng',
      items: [
        { path: '/', icon: FiHome, label: 'Trang chủ' },
        { path: '/manga', icon: FiBook, label: 'Manga' },
        { path: '/movie', icon: FiFilm, label: 'Movie' },
        { path: '/music', icon: FiMusic, label: 'Music' },
      ]
    },
    {
      title: 'Yêu thích',
      items: [
        { path: '/manga/favorites', icon: FiHeart, label: 'Manga yêu thích' },
        { path: '/movie/favorites', icon: FiHeart, label: 'Movie yêu thích' },
        { path: '/music/favorites', icon: FiHeart, label: 'Music yêu thích' },
      ]
    }
  ];

  const handleResetCache = async (type) => {
    if (!sourceKey) {
      toast.error('Chưa chọn source key');
      return;
    }

    const confirmed = window.confirm(`Bạn có chắc muốn xóa cache ${type}?`);
    if (!confirmed) return;

    try {
      switch (type) {
        case 'manga':
          await apiService.manga.resetCache({ 
            key: sourceKey, 
            root: rootFolder, 
            mode: 'delete' 
          });
          break;
        case 'movie':
          await apiService.movie.resetDb({ key: sourceKey });
          break;
        case 'music':
          await apiService.music.resetDb({ key: sourceKey });
          break;
        default:
          throw new Error('Invalid type');
      }
      
      toast.success(`Đã xóa cache ${type} thành công`);
    } catch (error) {
      console.error(`Reset ${type} cache error:`, error);
      toast.error(`Lỗi xóa cache ${type}`);
    }
  };

  const handleScan = async (type) => {
    if (!sourceKey) {
      toast.error('Chưa chọn source key');
      return;
    }

    try {
      switch (type) {
        case 'manga':
          await apiService.manga.scan({ key: sourceKey, root: rootFolder });
          break;
        case 'movie':
          await apiService.movie.scan({ key: sourceKey });
          break;
        case 'music':
          await apiService.music.scan({ key: sourceKey });
          break;
        default:
          throw new Error('Invalid type');
      }
      
      toast.success(`Đã quét ${type} thành công`);
    } catch (error) {
      console.error(`Scan ${type} error:`, error);
      toast.error(`Lỗi quét ${type}`);
    }
  };

  const SidebarItem = ({ item, isActive }) => {
    const Icon = item.icon;
    
    return (
      <Link
        to={item.path}
        className={`relative flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
          isActive
            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1 truncate">{item.label}</span>
        
        {item.count !== undefined && item.count > 0 && (
          <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full text-xs">
            {item.count}
          </span>
        )}

        {isActive && (
          <motion.div
            layoutId="sidebarActive"
            className="absolute inset-0 bg-primary-100 dark:bg-primary-900/30 rounded-lg -z-10"
            initial={false}
            transition={{ type: 'spring', duration: 0.5 }}
          />
        )}
      </Link>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-dark-800 border-r border-gray-200 dark:border-dark-700">
      <div className="flex-1 p-4 space-y-6">
        {/* Menu sections */}
        {menuItems.map((section) => (
          <div key={section.title}>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              {section.title}
            </h3>
            <nav className="space-y-1">
              {section.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <SidebarItem key={item.path} item={item} isActive={isActive} />
                );
              })}
            </nav>
          </div>
        ))}

        {/* Admin tools */}
        {sourceKey && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Công cụ
            </h3>
            
            <div className="space-y-2">
              {/* Scan buttons */}
              <div className="grid grid-cols-1 gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleScan('manga')}
                  className="justify-start"
                >
                  <FiRefreshCw className="h-3 w-3 mr-2" />
                  Quét Manga
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleScan('movie')}
                  className="justify-start"
                >
                  <FiRefreshCw className="h-3 w-3 mr-2" />
                  Quét Movie
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleScan('music')}
                  className="justify-start"
                >
                  <FiRefreshCw className="h-3 w-3 mr-2" />
                  Quét Music
                </Button>
              </div>

              {/* Reset cache buttons */}
              <div className="grid grid-cols-1 gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleResetCache('manga')}
                  className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <FiTrash2 className="h-3 w-3 mr-2" />
                  Xóa cache Manga
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleResetCache('movie')}
                  className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <FiTrash2 className="h-3 w-3 mr-2" />
                  Xóa cache Movie
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleResetCache('music')}
                  className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <FiTrash2 className="h-3 w-3 mr-2" />
                  Xóa cache Music
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-dark-700">
        <Link
          to="/settings"
          className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <FiSettings className="h-4 w-4" />
          <span>Cài đặt</span>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
