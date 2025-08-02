// 📁 src/components/common/Header.jsx
// 🎯 Header component

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiMenu, 
  FiSearch, 
  FiMoon, 
  FiSun, 
  FiHome,
  FiBook,
  FiFilm,
  FiMusic,
  FiSettings,
  FiLogOut
} from 'react-icons/fi';
import { useUIStore, useAuthStore } from '../../store';
import SearchModal from './SearchModal';
import SettingsModal from './SettingsModal';
import Button from './Button';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  
  const { 
    darkMode, 
    sidebarOpen, 
    toggleDarkMode, 
    toggleSidebar 
  } = useUIStore();
  
  const { sourceKey, logout } = useAuthStore();

  const navItems = [
    { path: '/', icon: FiHome, label: 'Trang chủ' },
    { path: '/manga', icon: FiBook, label: 'Manga' },
    { path: '/movie', icon: FiFilm, label: 'Movie' },
    { path: '/music', icon: FiMusic, label: 'Music' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-dark-800/80 backdrop-blur-md border-b border-gray-200 dark:border-dark-700">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left section */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className=""
              >
                <FiMenu className="h-5 w-5" />
              </Button>

              <Link 
                to="/" 
                className="flex items-center space-x-2 text-xl font-bold text-primary-600 dark:text-primary-400"
              >
                <span>📚</span>
                <span>MainWebSite</span>
              </Link>
            </div>

            {/* Center navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || 
                  (item.path !== '/' && location.pathname.startsWith(item.path));
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-primary-100 dark:bg-primary-900/30 rounded-lg -z-10"
                        initial={false}
                        transition={{ type: 'spring', duration: 0.5 }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right section */}
            <div className="flex items-center space-x-2">
              {/* Search button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchModalOpen(true)}
                className="hidden sm:flex"
              >
                <FiSearch className="h-4 w-4" />
                <span className="hidden lg:inline ml-2">Tìm kiếm</span>
              </Button>

              {/* Dark mode toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleDarkMode}
              >
                {darkMode ? (
                  <FiSun className="h-4 w-4" />
                ) : (
                  <FiMoon className="h-4 w-4" />
                )}
              </Button>

              {/* Settings */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSettingsModalOpen(true)}
              >
                <FiSettings className="h-4 w-4" />
              </Button>

              {/* Source key indicator */}
              {sourceKey && (
                <div className="hidden lg:flex items-center space-x-2 px-3 py-1 bg-primary-100 dark:bg-primary-900/30 rounded-full text-sm">
                  <span className="text-primary-600 dark:text-primary-400 font-medium">
                    {sourceKey}
                  </span>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={handleLogout}
                    className="text-red-500 hover:text-red-600"
                  >
                    <FiLogOut className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile navigation */}
        <div className="md:hidden border-t border-gray-200 dark:border-dark-700">
          <div className="flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                (item.path !== '/' && location.pathname.startsWith(item.path));
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex-1 flex flex-col items-center justify-center py-2 text-xs ${
                    isActive
                      ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mb-1" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Search Modal */}
      <SearchModal 
        isOpen={searchModalOpen} 
        onClose={() => setSearchModalOpen(false)} 
      />

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={settingsModalOpen} 
        onClose={() => setSettingsModalOpen(false)} 
      />
    </>
  );
};

export default Header;
