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
  FiSettings
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
  // Only show search on specific sections, excluding /manga/select
  const pathname = location.pathname;
  const showSearch = (/^\/(manga|movie|music)(?:\/|$)/.test(pathname)) && !/^\/manga\/select(?:\/|$)/.test(pathname);
  const homePath = '/';
  const isHomePage = pathname === '/';
  const isSelectPage = pathname === '/manga/select';
  
  const { 
    darkMode, 
    toggleDarkMode, 
    toggleSidebar 
  } = useUIStore();
  const {
    lastMangaKey,
    lastMovieKey,
    lastMusicKey,
    lastMangaRootFolder,
  setSourceKey,
  clearLastKeys // Add this for debugging
  } = useAuthStore();

  // Debug: Add temporary button to clear all last keys
  const handleDebugClear = () => {
    clearLastKeys();
    console.log('🧹 Cleared all last keys');
    alert('Đã xóa tất cả last keys');
  };

  const handleSectionClick = (section) => {
    // Check if source key exists, if not show toast and prevent navigation
    if (section === 'manga') {
      console.log('🔍 Manga check - lastMangaKey:', lastMangaKey);
      if (!lastMangaKey || lastMangaKey === '') {
        alert('Vui lòng chọn source manga từ trang chủ');
        return false;
      }
      setSourceKey(lastMangaKey);
    } else if (section === 'movie') {
      console.log('🔍 Movie check - lastMovieKey:', lastMovieKey);
      if (!lastMovieKey || lastMovieKey === '') {
        alert('Vui lòng chọn source movie từ trang chủ');
        return false;
      }
      setSourceKey(lastMovieKey);
    } else if (section === 'music') {
      console.log('🔍 Music check - lastMusicKey:', lastMusicKey);
      if (!lastMusicKey || lastMusicKey === '') {
        alert('Vui lòng chọn source music từ trang chủ');
        return false;
      }
      setSourceKey(lastMusicKey);
    }
    return true;
  };

  // Navigation items removed

  // Removed source key CTA and logout logic

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-dark-800/80 backdrop-blur-md border-b border-gray-200 dark:border-dark-700">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left section */}
            <div className="flex items-center space-x-4">
              {!isHomePage && !isSelectPage && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSidebar}
                  className=""
                >
                  <FiMenu className="h-5 w-5" />
                </Button>
              )}

              <Link 
                to={homePath} 
                className="flex items-center space-x-2 text-xl font-bold text-primary-600 dark:text-primary-400"
              >
                <span>📚</span>
                <span>MainWebSite</span>
              </Link>
            </div>

            {/* Center navigation removed */}

            {/* Right section */}
            <div className="flex items-center space-x-2">
              {/* Search button */}
              {showSearch && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchModalOpen(true)}
                  className="hidden sm:flex"
                >
                  <FiSearch className="h-4 w-4" />
                  <span className="hidden lg:inline ml-2">Tìm kiếm</span>
                </Button>
              )}

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
                onClick={() => {
                  if (isHomePage || isSelectPage) {
                    navigate('/settings');
                  } else {
                    setSettingsModalOpen(true);
                  }
                }}
              >
                <FiSettings className="h-4 w-4" />
              </Button>

              {/* Source key CTA removed */}
            </div>
          </div>
        </div>

  {/* Mobile navigation removed */}
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
