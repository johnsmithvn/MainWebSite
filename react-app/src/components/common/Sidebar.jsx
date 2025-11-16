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
  FiHeart,
  FiList,
  FiDownload,
  FiImage
} from 'react-icons/fi';
import { useAuthStore } from '../../store';
import useDownloadQueueStore from '../../store/downloadQueueStore';
import { getContentTypeFromSourceKey } from '../../utils/databaseOperations';
import DatabaseActions from './DatabaseActions';

const Sidebar = ({ isOpen = false, onClose, type }) => {
  const location = useLocation();
  const { sourceKey, rootFolder } = useAuthStore();
  
  // Subscribe to download queue for badge count
  const activeDownloadsCount = useDownloadQueueStore(state => state.activeDownloads.size);
  
  // Auto-detect content type from current sourceKey
  const currentContentType = getContentTypeFromSourceKey(sourceKey);
  
  // Debug logging
  console.log('🔍 Sidebar render:', { 
    isOpen, 
    sourceKey, 
    rootFolder, 
    currentContentType,
    location: location.pathname 
  });

  const menuItems = [
    {
      title: 'Điều hướng',
      items: [
        { path: '/', icon: FiHome, label: 'Trang chủ' },
        { path: '/manga', icon: FiBook, label: 'Manga' },
        { path: '/movie', icon: FiFilm, label: 'Movie' },
        { path: '/music', icon: FiMusic, label: 'Music' },
        { path: '/media', icon: FiImage, label: 'Media Gallery' },
        { path: '/downloads', icon: FiDownload, label: 'Downloads', count: activeDownloadsCount },
      ]
    },
    {
      title: 'Bộ sưu tập',
      items: [
        { path: '/manga/favorites', icon: FiHeart, label: 'Manga yêu thích' },
        { path: '/movie/favorites', icon: FiHeart, label: 'Movie yêu thích' },
        { path: '/music/playlists', icon: FiList, label: 'Music playlists' },
      ]
    }
  ];

  const SidebarItem = ({ item, isActive }) => {
    const Icon = item.icon;
    
    return (
      <Link
        to={item.path}
        className={`relative flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors pointer-events-auto ${
          isActive
            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700 hover:text-gray-900 dark:hover:text-white'
        }`}
        onClick={() => {
          console.log('🔗 Sidebar link clicked:', item.path);
          onClose?.(); // Close sidebar when link is clicked
        }}
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
    <div 
      className="h-full w-full bg-white dark:bg-dark-800 border-r border-gray-200 dark:border-dark-700 flex flex-col pointer-events-auto"
      style={{ pointerEvents: 'auto !important' }}
    >
      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
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

        {/* Admin tools - Only show for valid content type */}
        {sourceKey && currentContentType && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Công cụ {currentContentType === 'manga' ? '📚 Manga' : currentContentType === 'movie' ? '🎬 Movie' : '🎵 Music'}
            </h3>
            
            <DatabaseActions
              contentType={currentContentType}
              sourceKey={sourceKey}
              rootFolder={rootFolder}
              layout="vertical"
              size="sm"
              variant="outline"
              showLabels={true}
              className="space-y-1"
            />
          </div>
        )}

        {/* Media Gallery tools */}
        {location.pathname.startsWith('/media') && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Công cụ 📸 Media
            </h3>
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('media:scan'));
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              <span>🚀 Scan Media</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-dark-700">
        <Link
          to="/settings"
          className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700 hover:text-gray-900 dark:hover:text-white transition-colors pointer-events-auto"
          style={{ pointerEvents: 'auto !important' }}
          onClick={() => {
            console.log('⚙️ Settings link clicked');
            onClose?.();
          }}
        >
          <FiSettings className="h-4 w-4" />
          <span>Cài đặt</span>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
