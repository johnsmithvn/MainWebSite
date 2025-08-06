// 📁 src/components/manga/MangaCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiHeart } from 'react-icons/fi';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import { useMangaStore } from '@/store';
import { useRecentManager } from '@/hooks/useRecentManager';
import { formatViewCount } from '@/utils/formatters';

const MangaCard = ({ 
  manga, 
  isFavorite, 
  onToggleFavorite, 
  showViews = false,
  onClick,
  className = '',
  variant = 'default' // 'default', 'slider', 'grid'
}) => {
  const navigate = useNavigate();
  const { addRecentItem } = useRecentManager('manga');

  // Normalize isFavorite - handle both boolean and 0/1 values
  const isCurrentlyFavorite = Boolean(isFavorite || manga?.isFavorite);

  const handleCardClick = (e) => {
    e.stopPropagation();
    
    if (onClick) {
      onClick(manga);
      return;
    }
    
    // Enhanced reader detection logic with debugging
    const hasIsSelfReader = manga.isSelfReader;
    const hasImages = manga.hasImages && manga.images?.length > 0;
    const hasImagesArray = manga.images && Array.isArray(manga.images) && manga.images.length > 0;
    const endsWithSelf = manga.path?.endsWith('/__self__');
    
    const isReaderItem = hasIsSelfReader || hasImages || hasImagesArray || endsWithSelf;
    
    console.log('📁 MangaCard navigation decision:', { 
      isReaderItem,
      hasIsSelfReader,
      hasImages,
      hasImagesArray,
      endsWithSelf,
      mangaPath: manga.path,
      mangaName: manga.name,
      imagesCount: manga.images?.length
    });
    
    if (isReaderItem) {
      console.log('📖 Navigating directly to reader:', manga.path);
      navigate(`/manga/reader?path=${encodeURIComponent(manga.path)}`);
      
      // Only add to recent when going to reader
      setTimeout(() => {
        try {
          addRecentItem(manga);
        } catch (error) {
          console.warn('Error adding to recent:', error);
        }
      }, 0);
    } else {
      console.log('📁 Navigating to folder:', manga.path);
      navigate(`/manga?path=${encodeURIComponent(manga.path)}`);
    }
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite();
    }
  };

  const displayName = manga.name === '__self__' ? 'Đọc ngay' : manga.name;

  const cardClasses = `manga-card ${variant} ${className}`;

  return (
    <div className={cardClasses} onClick={handleCardClick}>
      <div className="manga-card-thumbnail">
        <LazyLoadImage
          alt={displayName}
          src={manga.thumbnail || '/default/default-cover.jpg'}
          effect="blur"
          className="manga-card-image"
          wrapperClassName="manga-card-image-wrapper"
          placeholderSrc="/default/default-cover.jpg"
        />
        
        {/* View count badge - always visible when showViews is true */}
        {showViews && (manga.count > 0 || manga.viewCount > 0) && (
          <div className="view-count-badge">
            <FiEye />
            <span>{formatViewCount(manga.count || manga.viewCount || 0)}</span>
          </div>
        )}
        
        {/* Favorite button - always visible when active, or on hover */}
        <button
          className={`manga-card-favorite ${isCurrentlyFavorite ? 'active' : ''}`}
          onClick={handleFavoriteClick}
          title={isCurrentlyFavorite ? 'Bỏ yêu thích' : 'Thêm yêu thích'}
        >
          <FiHeart />
        </button>
        
        {/* Overlay for general hover effects */}
        <div className="manga-card-overlay">
          {/* Overlay can be used for other hover effects if needed */}
        </div>
      </div>
      <div className="manga-card-title" title={displayName}>
        {displayName}
      </div>
    </div>
  );
};

export default MangaCard;
