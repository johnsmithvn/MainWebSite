// 📁 src/components/manga/ReaderHeader.jsx
// 📚 Header component for manga reader

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Menu, Search, Settings, Heart, Image as ImageIcon, Home } from 'lucide-react';
import SearchModal from '../common/SearchModal';
import SettingsModal from '../common/SettingsModal';
import { useAuthStore, useMangaStore, useUIStore } from '../../store';
import { apiService } from '../../utils/api';

const ReaderHeader = ({ 
  currentPath = '',
  onToggleFavorite,
  isFavorite = false,
  onSetThumbnail,
  className = '' 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  
  const { sourceKey, rootFolder } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const { mangaSettings } = useMangaStore();

  // Extract folder name from path
  const getFolderName = () => {
    if (!currentPath) return 'Manga Reader';
    
    // Remove /__self__ suffix if exists
    const cleanPath = currentPath.replace(/\/__self__$/, '');
    const pathParts = cleanPath.split('/').filter(Boolean);
    return pathParts[pathParts.length - 1] || 'Manga Reader';
  };

  // Get parent folder path (folder containing the current reading folder)
  const getParentFolderPath = () => {
    if (!currentPath) return '/manga';
    
    console.log('🔍 DEBUG ReaderHeader currentPath:', currentPath);
    
    // Logic tương tự frontend cũ
    const parts = currentPath.split('/').filter(Boolean);
    console.log('🔍 DEBUG parts before pop:', parts);
    
    parts.pop(); // bỏ folder hiện tại
    console.log('🔍 DEBUG parts after pop:', parts);
    
    const parentPath = parts.join('/');
    console.log('🔍 DEBUG parentPath:', parentPath);

    if (!parentPath) {
      console.log('🔍 DEBUG returning /manga (no parent path)');
      return '/manga';
    } else {
      const result = `/manga?path=${encodeURIComponent(parentPath)}`;
      console.log('🔍 DEBUG returning:', result);
      return result;
    }
  };

  // Navigate to manga home (root folder)
  const handleHomeClick = () => {
    navigate('/manga');
  };

  // Navigate to parent folder
  const handleFolderNameClick = () => {
    if (!currentPath) {
      navigate('/manga');
      return;
    }
    
    console.log('🔍 DEBUG ReaderHeader currentPath:', currentPath);
    
    // Logic tương tự frontend cũ
    const parts = currentPath.split('/').filter(Boolean);
    console.log('🔍 DEBUG parts before pop:', parts);
    
    parts.pop(); // bỏ folder hiện tại
    console.log('🔍 DEBUG parts after pop:', parts);
    
    const parentPath = parts.join('/');
    console.log('🔍 DEBUG parentPath:', parentPath);

    if (!parentPath) {
      console.log('🔍 DEBUG navigating to /manga (no parent path)');
      navigate('/manga');
    } else {
      console.log('🔍 DEBUG navigating to /manga with path:', parentPath);
      navigate(`/manga?path=${parentPath}`);
    }
  };

  // Handle favorite toggle
  const handleFavoriteClick = async () => {
    if (onToggleFavorite) {
      await onToggleFavorite();
    }
  };

  // Handle set thumbnail
  const handleSetThumbnail = async () => {
    if (onSetThumbnail) {
      await onSetThumbnail();
    }
  };

  const folderName = getFolderName();

  return (
    <>
      <header className={`reader-header ${className}`}>
        <div className="reader-header-content">
          {/* Left section */}
          <div className="reader-header-left">
            <button 
              className="reader-header-btn menu-btn"
              onClick={toggleSidebar}
              title="Menu"
            >
              <Menu size={20} />
            </button>
            
            <button 
              className="reader-header-btn home-btn"
              onClick={handleHomeClick}
              title={`Về trang ${rootFolder || 'manga'}`}
            >
              📚
            </button>
          </div>

          {/* Center section - Folder name */}
          <div className="reader-header-center">
            <button
              className="folder-name-btn"
              onClick={handleFolderNameClick}
              title={`Về thư mục cha: ${folderName}`}
            >
              <span className="folder-name-text">
                {folderName}
              </span>
            </button>
          </div>

          {/* Right section */}
          <div className="reader-header-right">
            <button 
              className="reader-header-btn thumbnail-btn"
              onClick={handleSetThumbnail}
              title="Đặt làm thumbnail"
            >
              <ImageIcon size={18} />
            </button>
            
            <button 
              className={`reader-header-btn favorite-btn ${isFavorite ? 'active' : ''}`}
              onClick={handleFavoriteClick}
              title={isFavorite ? 'Bỏ yêu thích' : 'Thêm yêu thích'}
            >
              <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
            
            <button 
              className="reader-header-btn search-btn"
              onClick={() => setSearchModalOpen(true)}
              title="Tìm kiếm"
            >
              <Search size={18} />
            </button>
            
            <button 
              className="reader-header-btn settings-btn"
              onClick={() => setSettingsModalOpen(true)}
              title="Cài đặt"
            >
              <Settings size={18} />
            </button>
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

export default ReaderHeader;
