import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, PanelLeft } from 'lucide-react';
import { useMangaStore, useAuthStore } from '../../store';
import { apiService } from '../../utils/api';
import '../../styles/components/manga-reader.css';

const MangaReader = () => {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { readerSettings, updateReaderSettings } = useMangaStore();
  const { sourceKey, rootFolder } = useAuthStore();
  
  const [currentImages, setCurrentImages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState('');
  const readerRef = useRef(null);

  // the required distance between touchStart and touchEnd to be detected as a swipe
  const minSwipeDistance = 50;

  useEffect(() => {
    const path = searchParams.get('path');
    if (path) {
      loadFolderData(path);
    } else if (folderId) {
      loadFolderData(folderId);
    }
  }, [folderId, searchParams, sourceKey, rootFolder]);

  const loadFolderData = async (path) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!sourceKey || !rootFolder) {
        setError('Missing authentication data');
        return;
      }

      // Call API to get images
      const response = await apiService.manga.getFolders({
        mode: 'path',
        path: path,
        key: sourceKey,
        root: rootFolder,
        useDb: '1'
      });

      console.log('🎯 API Response:', response.data);

      if (response.data && response.data.type === 'reader' && Array.isArray(response.data.images)) {
        setCurrentImages(response.data.images);
        console.log('✅ Loaded images:', response.data.images.length);
      } else {
        setError('No images found in this folder');
      }
    } catch (error) {
      console.error('Error loading folder:', error);
      setError('Failed to load manga images');
    } finally {
      setLoading(false);
    }
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  const goToPrevPage = () => {
    if (currentPage > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setSlideDirection('slide-right');
      setTimeout(() => {
        setCurrentPage(currentPage - 1);
        setSlideDirection('');
        setIsTransitioning(false);
      }, 300);
    }
  };

  const goToNextPage = () => {
    if (currentPage < currentImages.length - 1 && !isTransitioning) {
      setIsTransitioning(true);
      setSlideDirection('slide-left');
      setTimeout(() => {
        setCurrentPage(currentPage + 1);
        setSlideDirection('');
        setIsTransitioning(false);
      }, 300);
    }
  };

  const handleImageClick = () => {
    toggleControls();
  };

  const toggleReadingMode = () => {
    updateReaderSettings({
      ...readerSettings,
      readingMode: readerSettings.readingMode === 'vertical' ? 'horizontal' : 'vertical',
    });
  };

  const onTouchStart = (e) => {
    setTouchEnd(null); // otherwise the swipe is fired even with a single touch
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      goToNextPage();
    }
    if (isRightSwipe) {
      goToPrevPage();
    }
  };

  if (loading) {
    return (
      <div className="manga-reader">
        <div className="reader">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            color: 'white',
            fontSize: '18px'
          }}>
            Đang tải...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="manga-reader">
        <div className="reader">
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            color: 'white',
            fontSize: '18px',
            textAlign: 'center',
            padding: '20px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
            <div style={{ marginBottom: '10px' }}>Lỗi tải manga</div>
            <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '20px' }}>{error}</div>
            <button 
              onClick={() => navigate(-1)}
              style={{
                background: '#333',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ← Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentImages.length) {
    return (
      <div className="manga-reader">
        <div className="reader">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            color: 'white',
            fontSize: '18px'
          }}>
            Không có ảnh nào được tìm thấy
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="manga-reader">
      {/* Simple Header */}
      {showControls && (
        <div className="simple-header">
          <div className="manga-title">
            {searchParams.get('path')?.split('/').pop() || 'Manga Reader'}
          </div>
        </div>
      )}

      <div 
        ref={readerRef}
        className={`reader ${readerSettings.readingMode === 'vertical' ? 'scroll-mode' : ''}`}
      >
        {readerSettings.readingMode === 'vertical' ? (
          // Vertical scroll mode - render all images
          <div className="scroll-container">
            {currentImages.map((imageSrc, index) => (
              <img
                key={index}
                src={imageSrc}
                alt={`Page ${index + 1}`}
                className="scroll-img"
                onClick={handleImageClick}
                onLoad={(e) => e.target.classList.remove('loading')}
                onError={(e) => {
                  e.target.style.background = '#333';
                  e.target.alt = 'Lỗi tải ảnh';
                }}
              />
            ))}
          </div>
        ) : (
          // Horizontal mode - single image with max-height
          <div 
            className="horizontal-reader-container"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div className="nav-zone left" onClick={goToPrevPage} />
            
            {/* Current Image */}
            <div className={`image-container ${slideDirection}`}>
              <img
                src={currentImages[currentPage]}
                alt={`Page ${currentPage + 1}`}
                className="reader-image-fullsize"
                onClick={handleImageClick}
                onLoad={(e) => e.target.classList.remove('loading')}
                onError={(e) => {
                  e.target.style.background = '#333';
                  e.target.alt = 'Lỗi tải ảnh';
                }}
              />
            </div>

            {/* Next Image Preview (for slide-left animation) */}
            {slideDirection === 'slide-left' && currentPage < currentImages.length - 1 && (
              <div className="image-container next-image">
                <img
                  src={currentImages[currentPage + 1]}
                  alt={`Page ${currentPage + 2}`}
                  className="reader-image-fullsize"
                />
              </div>
            )}

            {/* Previous Image Preview (for slide-right animation) */}
            {slideDirection === 'slide-right' && currentPage > 0 && (
              <div className="image-container prev-image">
                <img
                  src={currentImages[currentPage - 1]}
                  alt={`Page ${currentPage}`}
                  className="reader-image-fullsize"
                />
              </div>
            )}
            
            <div className="nav-zone right" onClick={goToNextPage} />
          </div>
        )}
      </div>

      {/* Simple Footer */}
      {showControls && (
        <div className="simple-footer">
          <button 
            onClick={goToPrevPage}
            disabled={currentPage === 0}
            className="nav-btn"
          >
            ← Prev
          </button>
          
          <div className="page-counter">
            Trang {currentPage + 1} / {currentImages.length}
          </div>
          
          <button 
            onClick={goToNextPage}
            disabled={currentPage === currentImages.length - 1}
            className="nav-btn"
          >
            Next →
          </button>

          <button onClick={toggleReadingMode} className="nav-btn">
            {readerSettings.readingMode === 'vertical' ? <PanelLeft size={20} /> : <BookOpen size={20} />}
          </button>
        </div>
      )}
    </div>
  );
};

export default MangaReader;
