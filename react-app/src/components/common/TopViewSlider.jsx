// 📁 src/components/common/TopViewSlider.jsx
// 🎯 Slider hiển thị manga/movie/music có lượt xem cao nhất

import React, { useRef, useEffect, useState, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { FiChevronLeft, FiChevronRight, FiEye, FiTrash2 } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import UniversalCard from '@/components/common/UniversalCard';
import CardSkeleton from '@/components/common/CardSkeleton';
import { parentFolderName } from '@/utils/formatters';
import Button from '@/components/common/Button';
import { useModal } from '@/components/common/Modal';
import { useTopViewItems } from '@/hooks/useTopViewItems';
import { useMangaStore, useMovieStore, useMusicStore, useAuthStore, useUIStore } from '@/store';
import { apiService } from '@/utils/api';
import '@/styles/components/embla.css';

const TopViewSlider = ({ 
  type = 'manga',
  title = '🔥 Xem nhiều nhất',
  className = '',
  autoplay = false,
  autoplayDelay = 4000,
  showDots = true,
  // Thay tiêu đề bằng nội dung khác, ví dụ tab "Ngẫu nhiên | Xem nhiều"
  headerLeft = null,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const containerRef = useRef(null);
  
  // Embla Carousel setup - no autoplay for top view slider
  const autoplayPlugin = autoplay ? [Autoplay({ delay: autoplayDelay, stopOnInteraction: false })] : [];
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: false, // Don't loop for top view
      align: 'start',
      skipSnaps: false,
      dragFree: true,
      containScroll: 'trimSnaps'
    },
    autoplayPlugin
  );

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);

  // Use appropriate store based on type
  const mangaStore = useMangaStore();
  const movieStore = useMovieStore();
  const musicStore = useMusicStore();
  
  const { toggleFavorite, favoritesRefreshTrigger = 0 } = 
    type === 'movie' ? movieStore : 
    type === 'music' ? musicStore : 
    mangaStore;
  const { sourceKey, rootFolder } = useAuthStore();
  const { showToast } = useUIStore();
  const queryClient = useQueryClient();
  const { confirmModal, Modal: ModalComponent } = useModal();

  // Local refresh trigger for forcing re-renders
  const [localRefreshTrigger, setLocalRefreshTrigger] = useState(0);

  // Top view items hook
  const { data: items, isLoading: loading, error } = useTopViewItems(type, {
    enabled: isVisible,
    staleTime: 10 * 60 * 1000 // 10 minutes
  });

  // Force refresh khi favorites thay đổi
  useEffect(() => {
    if (favoritesRefreshTrigger > 0 && items && items.length > 0) {
      console.log('🔄 TopViewSlider: Favorites changed, updating display');
      setLocalRefreshTrigger(prev => prev + 1);
    }
  }, [favoritesRefreshTrigger, items]);

  // Navigation functions
  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback((index) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  // Update scroll button states and selected index
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  const onInit = useCallback(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
  }, [emblaApi]);

  // Calculate visible dots (max 6, but scale based on content)
  const getVisibleDots = () => {
    const totalSnaps = scrollSnaps.length;
    if (totalSnaps <= 6) return scrollSnaps;
    
    // For more than 6 snaps, show every nth snap to get around 6 dots
    const step = Math.ceil(totalSnaps / 6);
    return scrollSnaps.filter((_, index) => index % step === 0 || index === totalSnaps - 1);
  };

  const visibleDots = getVisibleDots();

  // Setup embla API event listeners
  useEffect(() => {
    if (!emblaApi) return;
    
    onInit();
    onSelect();
    emblaApi.on('reInit', onInit);
    emblaApi.on('reInit', onSelect);
    emblaApi.on('select', onSelect);
    
    return () => {
      emblaApi.off('reInit', onInit);
      emblaApi.off('reInit', onSelect);
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onInit, onSelect]);

  // Intersection Observer để lazy load
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  // Handle mouse hover
  const handleMouseEnter = () => {
    setHovered(true);
    if (emblaApi && autoplay) {
      emblaApi.plugins().autoplay?.stop();
    }
  };

  const handleMouseLeave = () => {
    setHovered(false);
    if (emblaApi && autoplay && isVisible) {
      emblaApi.plugins().autoplay?.play();
    }
  };

  // Handle favorite toggle
  // Handle favorite toggle với immediate UI update
  const handleToggleFavorite = async (item) => {
    try {
      console.log('❤️ TopViewSlider toggleFavorite:', { path: item.path, currentFavorite: item.isFavorite });
      
      // Gọi toggleFavorite từ store (đã có updateFavoriteInAllCaches)
      await toggleFavorite(item);
      
      // Force refresh local component để hiển thị thay đổi ngay lập tức
      setLocalRefreshTrigger(prev => prev + 1);
      
      console.log('✅ TopViewSlider favorite toggle completed');
    } catch (error) {
      console.error('❌ Error toggling favorite in TopViewSlider:', error);
    }
  };

  // Handle delete single view
  const handleDeleteView = async (item) => {
    const confirmed = await confirmModal(
      'Xác nhận xóa lượt xem',
      `Bạn có chắc muốn xóa lượt xem của "${item.name || item.path?.split('/').pop()}"?`,
      'warning'
    );
    
    if (!confirmed) return;
    
    try {
      console.log('🗑️ TopViewSlider deleteView:', { path: item.path, type });
      
      let response;
      if (type === 'manga') {
        response = await apiService.system.deleteViewManga({
          path: item.path,
          dbkey: sourceKey,
          rootKey: rootFolder
        });
      } else if (type === 'movie') {
        response = await apiService.system.deleteViewMovie({
          key: sourceKey,
          path: item.path
        });
      } else if (type === 'music') {
        response = await apiService.system.deleteViewMusic({
          key: sourceKey,
          path: item.path
        });
      }
      
      if (response?.data?.success) {
        showToast('✅ Đã xóa lượt xem', 'success');
        // Invalidate query để force refetch data mới
        queryClient.invalidateQueries(['topViewItems', type, sourceKey, type === 'manga' ? rootFolder : null]);
        setLocalRefreshTrigger(prev => prev + 1);
      } else {
        showToast('❌ Lỗi xóa lượt xem', 'error');
      }
    } catch (error) {
      console.error('❌ Error deleting view in TopViewSlider:', error);
      showToast('❌ Lỗi xóa lượt xem', 'error');
    }
  };

  // Handle delete all views
  const handleDeleteAllViews = async () => {
    const confirmed = await confirmModal(
      'Xác nhận xóa tất cả',
      `Bạn có chắc muốn xóa tất cả lượt xem ${type}? Hành động này không thể hoàn tác.`,
      'warning'
    );
    
    if (!confirmed) return;
    
    try {
      console.log('🗑️ TopViewSlider deleteAllViews:', { type });
      
      let response;
      if (type === 'manga') {
        response = await apiService.system.deleteAllViewsManga({
          dbkey: sourceKey,
          rootKey: rootFolder
        });
      } else if (type === 'movie') {
        response = await apiService.system.deleteAllViewsMovie({
          key: sourceKey
        });
      } else if (type === 'music') {
        response = await apiService.system.deleteAllViewsMusic({
          key: sourceKey
        });
      }
      
      if (response?.data?.success) {
        showToast(`✅ Đã xóa tất cả lượt xem ${type}`, 'success');
        // Invalidate query để force refetch data mới
        queryClient.invalidateQueries(['topViewItems', type, sourceKey, type === 'manga' ? rootFolder : null]);
        setLocalRefreshTrigger(prev => prev + 1);
      } else {
        showToast('❌ Lỗi xóa tất cả lượt xem', 'error');
      }
    } catch (error) {
      console.error('❌ Error deleting all views in TopViewSlider:', error);
      showToast('❌ Lỗi xóa tất cả lượt xem', 'error');
    }
  };

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-4 sm:mb-6 ${headerLeft ? 'pt-3' : ''}`}>
        {/* Giữ tab để vẫn chuyển được sang mục khác khi mục này lỗi */}
        {headerLeft && <div className="mb-4">{headerLeft}</div>}
        <div className="text-center">
          <p className="text-red-500 mb-4">Lỗi tải dữ liệu: {error.message}</p>
        </div>
      </div>
    );
  }

  // Don't render if no items
  if (!loading && (!items || items.length === 0)) {
    // Có tab thì vẫn hiện khung (kèm tab) để người dùng chuyển lại được
    if (headerLeft) {
      return (
        <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 w-full ${className}`}>
          <div className="p-2 sm:p-3">{headerLeft}</div>
          <p className="px-3 pb-4 text-sm text-gray-500 dark:text-gray-400">Chưa có lượt xem nào.</p>
        </div>
      );
    }
    return null;
  }

  return (
  <div ref={containerRef} className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-1 sm:mb-1 overflow-hidden w-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-2 sm:p-3 pb-1 sm:pb-2">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
          {headerLeft || (
          <h2 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">
            {title}
          </h2>
          )}

          {/* Item count badge */}
          {!headerLeft && items && items.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium flex-shrink-0"
            >
              <FiEye className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
              <span>{items.length}</span>
            </motion.div>
          )}
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          {/* Delete all views button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteAllViews}
            disabled={!items || items.length === 0 || loading}
            className="hidden sm:flex text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            title="Xóa tất cả lượt xem"
          >
            <FiTrash2 className="w-4 h-4" />
          </Button>
          
          {/* Navigation buttons - hidden on mobile */}
          <Button
            variant="ghost"
            size="sm"
            onClick={scrollPrev}
            disabled={!canScrollPrev || loading}
            className="hidden sm:flex text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <FiChevronLeft className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={scrollNext}
            disabled={!canScrollNext || loading}
            className="hidden sm:flex text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <FiChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Slider Container */}
      <div
        className={`embla embla--${type}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="embla__viewport" ref={emblaRef}>
          <div className="embla__container">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="embla__slide">
                  {/* Skeleton đúng hình card (tỉ lệ ảnh theo loại + 2 dòng tên), không còn khối cao cố định 256px */}
                  <CardSkeleton type={type} variant="slider" className="w-full" />
                </div>
              ))
            ) : (
              // Actual items - sorted by view count
              items?.map((item, index) => (
                <div key={`topview-${type}-${index}-${item.path?.replace(/[^a-zA-Z0-9]/g, '_') || index}-${localRefreshTrigger}`} className="embla__slide w-full h-full flex items-stretch">
                  <div className="relative w-full h-full">
                    <UniversalCard
                      // Hạng #1–#3: badge vàng / bạc / đồng ở góc trên trái ảnh
                      badgeTopLeft={index < 3 ? { text: `#${index + 1}`, tone: ['gold', 'silver', 'bronze'][index] } : undefined}
                      item={item}
                      type={type}
                      isFavorite={Boolean(item.isFavorite)}
                      showViews={true}
                      showDeleteView={true}
                      onToggleFavorite={() => handleToggleFavorite(item)}
                      onDeleteView={() => handleDeleteView(item)}
                      subtitle={parentFolderName(item.path) || undefined} // tên thư mục cha
                      variant="compact-slider" // sử dụng phiên bản cực gọn
                      className="w-full h-full"
                      overlayMode={type === 'manga' ? 'views' : 'type'}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Pagination Dots - Limited to max 6 dots */}
      {showDots && visibleDots.length > 1 && (
        <div className="embla__dots">
          {visibleDots.map((_, index) => {
            const actualIndex = scrollSnaps.length <= 6 ? index : index * Math.ceil(scrollSnaps.length / 6);
            const isActive = Math.abs(selectedIndex - actualIndex) < Math.ceil(scrollSnaps.length / 6);
            
            return (
              <button
                key={index}
                className={`embla__dot ${
                  isActive ? 'active' : ''
                } ${
                  autoplay && isActive && isVisible && !hovered ? 'auto-playing' : ''
                }`}
                style={{
                  '--autoplay-delay': `${autoplayDelay}ms`
                }}
                onClick={() => scrollTo(actualIndex)}
                aria-label={`Đi đến slide ${actualIndex + 1}`}
              />
            );
          })}
        </div>
      )}

  {/* Bỏ phần padding đáy không cần thiết */}

      {/* Modal Component */}
      <ModalComponent />
    </div>
  );
};

export default TopViewSlider;
