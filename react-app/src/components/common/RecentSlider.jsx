// 📁 src/components/common/RecentSlider.jsx
// 🕒 Recent slider component để hiển thị items vừa xem

import React, { useRef, useEffect, useState, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { FiChevronLeft, FiChevronRight, FiClock, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import UniversalCard from '@/components/common/UniversalCard';
import Button from '@/components/common/Button';
import { useModal } from '@/components/common/Modal';
import { useRecentItems } from '@/hooks/useRecentItems';
import { useMangaStore, useMovieStore, useMusicStore } from '@/store';
import { formatDistanceToNow } from 'date-fns';
import { TIME } from '@/constants';
import '@/styles/components/embla.css';

const RecentSlider = ({ 
  type = 'manga',
  title = '🕒 Vừa xem',
  className = '',
  autoplay = false,
  autoplayDelay = 4000,
  showRefresh = true,
  showClearHistory = true,
  showTimestamp = true,
  maxItems = 20,
  ...props 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const containerRef = useRef(null);
  
  // Embla Carousel setup - minimal autoplay for recent slider
  const autoplayPlugin = autoplay ? [Autoplay({ delay: autoplayDelay, stopOnInteraction: false })] : [];
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: false, // Don't loop for recent items
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

  // Get functions and triggers based on type (giống RandomSlider)
  const { toggleFavorite, clearRecentHistory, favoritesRefreshTrigger = 0 } =
    type === 'movie' ? movieStore : type === 'music' ? musicStore : mangaStore;
  const { mangaSettings } = mangaStore;

  // Modal hook for confirmations
  const { confirmModal, Modal: ModalComponent } = useModal();

  // Local refresh trigger for forcing re-renders
  const [localRefreshTrigger, setLocalRefreshTrigger] = useState(0);

  // Tắt Recent tracking (chỉ áp dụng cho manga). Không return sớm ở đây:
  // mọi hook phía dưới phải luôn được gọi (Rules of Hooks) → return null ở cuối component
  const trackingDisabled = type === 'manga' && !mangaSettings?.enableRecentTracking;

  // Recent items hook
  const { data: items, loading, error, refresh, lastUpdated } = useRecentItems(type, {
    enabled: isVisible && !trackingDisabled,
    maxItems
  });

  // Force refresh khi favorites thay đổi - throttle để tránh spam
  useEffect(() => {
    if (favoritesRefreshTrigger > 0 && items && items.length > 0) {
      console.log('🔄 RecentSlider: Favorites changed, refreshing');
      
      // Use timeout to debounce multiple rapid changes
      const timeoutId = setTimeout(() => {
        refresh();
        setLocalRefreshTrigger(prev => prev + 1);
      }, 100); // 100ms debounce
      
      return () => clearTimeout(timeoutId);
    }
  }, [favoritesRefreshTrigger]); // Remove items dependency to reduce triggers

  // Clear recent history function with modal confirmation
  const handleClearHistory = useCallback(() => {
    confirmModal({
      title: '🗑️ Xóa lịch sử xem',
      message: 'Bạn có chắc chắn muốn xóa toàn bộ lịch sử xem? Hành động này không thể hoàn tác.',
      confirmText: 'Xóa lịch sử',
      cancelText: 'Hủy',
      onConfirm: () => {
        clearRecentHistory(type);
        refresh(); // Refresh the data after clearing
      }
    });
  }, [confirmModal, clearRecentHistory, type, refresh]);

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
      console.log('❤️ RecentSlider toggleFavorite:', { path: item.path, currentFavorite: item.isFavorite });
      
      // Debug cache trước khi toggle
      console.log('🔍 Before toggle - Cache state:');
      
      // Gọi toggleFavorite từ store (đã có updateFavoriteInAllCaches)
      await toggleFavorite(item);
      
      // Debug cache sau khi toggle
      
      // Force refresh data from cache để có favorite state mới nhất
      await refresh();
      
      // Force refresh local component để hiển thị thay đổi ngay lập tức
      setLocalRefreshTrigger(prev => prev + 1);
      
      console.log('✅ RecentSlider favorite toggle completed');
    } catch (error) {
      console.error('❌ Error toggling favorite in RecentSlider:', error);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      return formatDistanceToNow(timestamp, {
        addSuffix: true
      });
    } catch (error) {
      return '';
    }
  };

  // Format last viewed time
  const formatLastViewed = (lastViewed) => {
    if (!lastViewed) return '';
    
    try {
      const now = new Date();
      const viewedDate = new Date(lastViewed);
      const diffInMinutes = Math.floor((now - viewedDate) / 60000);
      const isMobile = window.innerWidth < 640;
      
      // Luôn hiển thị "just now" cho thời gian dưới 1 phút
      if (diffInMinutes < 1) return 'just now';
      
      // Rút gọn hơn cho mobile
      if (isMobile) {
        if (diffInMinutes < TIME.MINUTES_PER_HOUR) return `${diffInMinutes}m ago`;
        if (diffInMinutes < TIME.MINUTES_PER_DAY) return `${Math.floor(diffInMinutes / TIME.MINUTES_PER_HOUR)}h ago`;
        if (diffInMinutes < TIME.MINUTES_PER_WEEK) return `${Math.floor(diffInMinutes / TIME.MINUTES_PER_DAY)}d ago`;
        return `${Math.floor(diffInMinutes / TIME.MINUTES_PER_WEEK)}w ago`;
      } 
      
      // Phiên bản đầy đủ cho desktop
      if (diffInMinutes < TIME.MINUTES_PER_HOUR) return `${diffInMinutes} minutes ago`;
      if (diffInMinutes < TIME.MINUTES_PER_DAY) return `${Math.floor(diffInMinutes / TIME.MINUTES_PER_HOUR)} hours ago`;
      
      // Ghi đè kết quả từ formatDistanceToNow nếu là "less than a minute ago"
      const formattedTime = formatDistanceToNow(viewedDate, {
        addSuffix: true
      });
      
      return formattedTime === 'less than a minute ago' ? 'just now' : formattedTime;
    } catch (error) {
      return '';
    }
  };

  if (trackingDisabled) {
    return null;
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-4 sm:mb-6">
        <div className="text-center">
          <p className="text-red-500 mb-4">Lỗi tải dữ liệu: {error.message}</p>
          <Button onClick={refresh} variant="outline">
            <FiRefreshCw className="w-4 h-4 mr-2" />
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  // Don't render if no items
  if (!loading && (!items || items.length === 0)) {
    return null;
  }

  return (
  <div ref={containerRef} className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-4 sm:mb-6 overflow-hidden w-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-2 sm:p-3 pb-1 sm:pb-2">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
          <h2 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">
            {title}
          </h2>
          
          {/* Item count badge */}
          {items && items.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium flex-shrink-0"
            >
              <FiClock className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
              <span>{items.length}</span>
            </motion.div>
          )}

          {/* Timestamp */}
          {showTimestamp && lastUpdated && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex-shrink-0"
            >
              <FiClock className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
              <span className="whitespace-nowrap">{formatTimestamp(lastUpdated)}</span>
            </motion.div>
          )}
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
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

          {/* Refresh button */}
          {showRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={refresh}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          )}
          
          {/* Clear history button */}
          {showClearHistory && items.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearHistory}
              disabled={loading}
              className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300"
              title="Xóa lịch sử xem"
            >
              <FiTrash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Slider Container */}
      <div 
        className="embla"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="embla__viewport" ref={emblaRef}>
          <div className="embla__container">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="embla__slide">
                  {/* Khung skeleton full width để card hiển thị 50% màn hình trên mobile */}
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-full h-64" />
                </div>
              ))
            ) : (
              // Actual items - force key update để trigger re-render
              items?.map((item, index) => (
                <div key={`recent-${type}-${index}-${item.path?.replace(/[^a-zA-Z0-9]/g, '_') || index}-${localRefreshTrigger}`} className="embla__slide w-full h-full flex items-stretch">
                  <div className="relative w-full h-full">
                    {/* Last viewed badge */}
                    {item.lastViewed && (
                      <div className="absolute top-1 left-1 sm:top-2 sm:left-2 z-10">
                        <div className="bg-blue-500/90 text-white text-[9px] sm:text-xs px-1 py-0.5 sm:px-2 sm:py-1 rounded-full shadow-sm">
                          {formatLastViewed(item.lastViewed)}
                        </div>
                      </div>
                    )}
                    <UniversalCard
                      item={item}
                      type={type}
                      isFavorite={Boolean(item.isFavorite)}
                      variant="compact-slider" // thu gọn chiều cao
                      showViews={false}
                      onToggleFavorite={async (toggleItem) => {
                        await handleToggleFavorite(toggleItem);
                      }}
                      className="w-full h-full"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Pagination Dots - Limited to max 6 dots */}
      {visibleDots.length > 1 && (
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

  {/* Bỏ padding đáy để slider thấp hơn */}
      
      {/* Modal Component */}
      <ModalComponent />
    </div>
  );
};

export default RecentSlider;
