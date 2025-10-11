// 📁 src/components/manga/ReaderHeader.jsx
// 📚 Header component for manga reader

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Menu, Search, Settings, Heart, Image as ImageIcon, Home, Download, ChevronDown } from 'lucide-react';
import SearchModal from '../common/SearchModal';
import SettingsModal from '../common/SettingsModal';
import { useAuthStore, useMangaStore, useUIStore } from '../../store';
import { DOWNLOAD_STATUS } from '../../store/downloadQueueStore';
import { apiService } from '../../utils/api';

const ReaderHeader = ({ 
  currentPath = '',
  onToggleFavorite,
  isFavorite = false,
  onSetThumbnail,
  className = '',
  onDownload,
  onAddToQueue,
  isDownloading = false,
  downloadProgress = { current: 0, total: 0, status: 'idle' },
  isOfflineAvailable = false,
  activeQueueTask = null
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const downloadMenuRef = useRef(null);
  
  const { sourceKey, rootFolder } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const { mangaSettings } = useMangaStore();

  // Close download menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target)) {
        setShowDownloadMenu(false);
      }
    };

    if (showDownloadMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDownloadMenu]);

  // Extract folder name from path
  const getFolderName = () => {
    if (!currentPath) return 'Manga Reader';
    
    // Remove /__self__ suffix if exists
    const cleanPath = currentPath.replace(/\/__self__$/, '');
    const pathParts = cleanPath.split('/').filter(Boolean);
    return pathParts[pathParts.length - 1] || 'Manga Reader';
  };

  // Compute parent folder path of the reading folder
  const computeParentFolderPath = (path) => {
    if (!path) return '';
    // If path ends with __self__, remove it first to get the actual folder
    const withoutSelf = path.replace(/\/__self__$/, '');
    const parts = withoutSelf.split('/').filter(Boolean);
    if (parts.length === 0) return '';
    // Remove the reading folder itself to get its parent
    parts.pop();
    return parts.join('/');
  };

  // Get parent folder path (folder containing the current reading folder)
  const getParentFolderPath = () => {
    if (!currentPath) return '/manga';
    const parentPath = computeParentFolderPath(currentPath);
    if (!parentPath) return '/manga';
    return `/manga?path=${encodeURIComponent(parentPath)}`;
  };

  // Navigate to manga home (root folder)
  const handleHomeClick = () => {
    // Check if we have a returnUrl parameter for proper back navigation
    const returnUrl = searchParams.get('returnUrl');
    if (returnUrl) {
      console.log('🔙 Returning to previous URL:', returnUrl);
      navigate(returnUrl);
      return;
    }
    
    // Fallback: Ensure we force folder view to avoid auto-redirect back to reader
    const sizeFromUrl = (new URLSearchParams(location.search)).get('size');
    const params = new URLSearchParams();
    params.set('view', 'folder');
    if (sizeFromUrl) params.set('size', sizeFromUrl);
    navigate(`/manga?${params.toString()}`);
  };

  // Navigate to parent folder
  const handleFolderNameClick = () => {
    // Check if we have a returnUrl parameter for proper back navigation
    const returnUrl = searchParams.get('returnUrl');
    if (returnUrl) {
      console.log('🔙 Returning to previous URL from folder click:', returnUrl);
      navigate(returnUrl);
      return;
    }
    
    if (!currentPath) {
      // No current path, just go home with folder view
      const sizeFromUrl = (new URLSearchParams(location.search)).get('size');
      const params = new URLSearchParams();
      params.set('view', 'folder');
      if (sizeFromUrl) params.set('size', sizeFromUrl);
      return navigate(`/manga?${params.toString()}`);
    }
    const parentPath = computeParentFolderPath(currentPath);
    const sizeFromUrl = (new URLSearchParams(location.search)).get('size');
    if (!parentPath) {
      // At root parent, navigate to home but keep view=folder and pass focus to land on the correct page
      const focusPath = currentPath.replace(/\/__self__$/, '');
      const params = new URLSearchParams();
      params.set('view', 'folder');
      params.set('focus', focusPath);
      if (sizeFromUrl) params.set('size', sizeFromUrl);
      return navigate(`/manga?${params.toString()}`);
    }
    // Build focus (child path without __self__) so grid can jump to correct page
    const focusPath = currentPath.replace(/\/__self__$/, '');
    const params = new URLSearchParams();
    params.set('path', parentPath);
    params.set('view', 'folder');
    params.set('focus', focusPath);
    if (sizeFromUrl) params.set('size', sizeFromUrl);
    navigate(`/manga?${params.toString()}`);
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
          
          {/* Download Button with Dropdown Menu */}
          {(onDownload || onAddToQueue) && (
            <div className="download-menu-wrapper" ref={downloadMenuRef} style={{ position: 'relative' }}>
              <button
                className={`reader-header-btn download-btn ${isOfflineAvailable ? 'offline-available' : ''} ${isDownloading ? 'downloading' : ''} ${activeQueueTask ? 'in-queue' : ''}`}
                onClick={() => {
                  if (onAddToQueue) {
                    setShowDownloadMenu(!showDownloadMenu);
                  } else {
                    // Fallback to direct download if only onDownload available
                    onDownload?.();
                  }
                }}
                disabled={isDownloading}
                title={
                  isDownloading 
                    ? `Đang tải... ${downloadProgress.current}/${downloadProgress.total}`
                    : activeQueueTask
                      ? `In queue: ${activeQueueTask.status}`
                      : isOfflineAvailable 
                        ? "Chapter đã tải offline" 
                        : "Download options"
                }
              >
                {isDownloading ? (
                  <div className="download-progress">
                    <div className="spinner" />
                    <span className="progress-text">
                      {Math.round((downloadProgress.current / downloadProgress.total) * 100)}%
                    </span>
                  </div>
                ) : (
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Download size={18} />
                    {onAddToQueue && <ChevronDown size={14} />}
                    
                    {/* Queue Progress Ring */}
                    {activeQueueTask && activeQueueTask.status === DOWNLOAD_STATUS.DOWNLOADING && (
                      <svg
                        className="queue-progress-ring"
                        width="32"
                        height="32"
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          pointerEvents: 'none'
                        }}
                      >
                        <circle
                          cx="16"
                          cy="16"
                          r="14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          opacity="0.2"
                        />
                        <circle
                          cx="16"
                          cy="16"
                          r="14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray={`${2 * Math.PI * 14}`}
                          strokeDashoffset={`${2 * Math.PI * 14 * (1 - (activeQueueTask.progress / 100))}`}
                          transform="rotate(-90 16 16)"
                          style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                        />
                      </svg>
                    )}
                    
                    {/* Offline Indicator */}
                    {isOfflineAvailable && !activeQueueTask && (
                      <div className="offline-indicator">✓</div>
                    )}
                    
                    {/* Queue Pending Indicator */}
                    {activeQueueTask && activeQueueTask.status === DOWNLOAD_STATUS.PENDING && (
                      <div className="queue-pending-indicator" style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: '#f59e0b',
                        border: '2px solid var(--bg-primary, #1a1a1a)',
                        fontSize: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        ⏳
                      </div>
                    )}
                  </div>
                )}
              </button>
              
              {/* Dropdown Menu */}
              {showDownloadMenu && onAddToQueue && (
                <div 
                  className="download-dropdown"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    background: 'var(--bg-secondary, #2a2a2a)',
                    border: '1px solid var(--border-color, #3a3a3a)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    zIndex: 1000,
                    minWidth: '180px',
                    overflow: 'hidden'
                  }}
                >
                  {onDownload && (
                    <button
                      onClick={() => {
                        onDownload();
                        setShowDownloadMenu(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-primary, #fff)',
                        fontSize: '14px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover, #3a3a3a)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <Download size={16} />
                      <span>📥 Direct Download</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      onAddToQueue();
                      setShowDownloadMenu(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'transparent',
                      border: 'none',
                      borderTop: onDownload ? '1px solid var(--border-color, #3a3a3a)' : 'none',
                      color: 'var(--text-primary, #fff)',
                      fontSize: '14px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover, #3a3a3a)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <span>➕</span>
                    <span>Add to Queue</span>
                  </button>
                  
                  {activeQueueTask && (
                    <div
                      style={{
                        padding: '8px 16px',
                        borderTop: '1px solid var(--border-color, #3a3a3a)',
                        fontSize: '12px',
                        color: 'var(--text-secondary, #aaa)',
                        background: 'var(--bg-tertiary, #1f1f1f)'
                      }}
                    >
                      <div style={{ marginBottom: '4px' }}>
                        Status: <strong>{activeQueueTask.status}</strong>
                      </div>
                      {activeQueueTask.status === DOWNLOAD_STATUS.DOWNLOADING && (
                        <div>
                          Progress: <strong>{activeQueueTask.progress}%</strong>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          navigate('/downloads');
                          setShowDownloadMenu(false);
                        }}
                        style={{
                          marginTop: '8px',
                          padding: '4px 8px',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          width: '100%'
                        }}
                      >
                        📋 View in Queue
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      </header>
      
      {/* Mini Progress Bar (Below Header) */}
      {activeQueueTask && activeQueueTask.status === DOWNLOAD_STATUS.DOWNLOADING && (
        <div
          className="mini-progress-bar"
          onClick={() => navigate('/downloads')}
          style={{
            position: 'fixed',
            top: '60px', // Below header
            left: 0,
            right: 0,
            height: '3px',
            background: 'var(--bg-secondary, #2a2a2a)',
            cursor: 'pointer',
            zIndex: 999,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          <div
            className="progress-fill"
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
              width: `${activeQueueTask.progress}%`,
              transition: 'width 0.3s ease',
              boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
            }}
          />
          <div
            className="progress-tooltip"
            style={{
              position: 'absolute',
              top: '6px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0, 0, 0, 0.9)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              opacity: 0,
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          >
            Downloading... {activeQueueTask.progress}% ({activeQueueTask.currentPage}/{activeQueueTask.totalPages})
          </div>
        </div>
      )}

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
