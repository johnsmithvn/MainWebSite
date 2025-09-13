// 📁 src/components/common/RandomSlider.jsx
// 🎯 Random slider component với logic tương tự frontend cũ

import React, { useRef, useEffect, useState, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { FiRefreshCw, FiChevronLeft, FiChevronRight, FiClock } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import UniversalCard from '@/components/common/UniversalCard';
import Button from '@/components/common/Button';
import { useRandomItems } from '@/hooks/useRandomItems';
import { useMangaStore, useMovieStore, useMusicStore } from '@/store';
import { formatDistanceToNow } from 'date-fns';
import '@/styles/components/embla.css';

const RandomSlider = ({ 
  type = 'manga',
  title = 'Ngẫu nhiên',
  showViews = false, // Default false for random slider
  className = '',
  autoplay = true,
  autoplayDelay = 3000,
  showRefresh = true,
  showTimestamp = true,
  ...props 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const containerRef = useRef(null);
  
  // Embla Carousel setup
  const autoplayPlugin = autoplay ? [Autoplay({ delay: autoplayDelay, stopOnInteraction: false })] : [];
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true,
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
  
  // Random items hook
  const { data: items, loading, error, refresh, lastUpdated } = useRandomItems(type, {
    enabled: isVisible,
    count: 30,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Force refresh khi favorites thay đổi - throttle để tránh spam
  useEffect(() => {
    if (favoritesRefreshTrigger > 0 && items && items.length > 0) {
      console.log('🔄 RandomSlider: Favorites changed, updating display');
      
      // Use timeout to debounce multiple rapid changes
      const timeoutId = setTimeout(() => {
        setLocalRefreshTrigger(prev => prev + 1);
      }, 100); // 100ms debounce
      
      return () => clearTimeout(timeoutId);
    }
  }, [favoritesRefreshTrigger]); // Remove items dependency to reduce triggers

  // Local refresh trigger for forcing re-renders
  const [localRefreshTrigger, setLocalRefreshTrigger] = useState(0);

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

  // Intersection Observer để pause autoplay khi không visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        if (emblaApi) {
          if (entry.isIntersecting && autoplay && !hovered) {
            emblaApi.plugins().autoplay?.play();
          } else {
            emblaApi.plugins().autoplay?.stop();
          }
        }
      },
      { threshold: [0.1] }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [emblaApi, autoplay, hovered]);

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

  // Handle favorite toggle với immediate UI update
  const handleToggleFavorite = async (item) => {
    try {
      console.log('❤️ RandomSlider toggleFavorite:', { path: item.path, currentFavorite: item.isFavorite });
      
      // Gọi toggleFavorite từ store (đã có updateFavoriteInAllCaches)
      await toggleFavorite(item);
      
      // Force refresh local component để hiển thị thay đổi ngay lập tức
      setLocalRefreshTrigger(prev => prev + 1);
      
      console.log('✅ RandomSlider favorite toggle completed');
    } catch (error) {
      console.error('❌ Error toggling favorite in RandomSlider:', error);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const now = new Date();
      const diffInMinutes = Math.floor((now - timestamp) / (1000 * 60));
      
      // If less than 1 minute show "just now"
      if (diffInMinutes < 1) {
        return 'just now';
      }
      
      return formatDistanceToNow(timestamp, {
        addSuffix: true
      });
    } catch (error) {
      return '';
    }
  };

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

  return (
    <div ref={containerRef} className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-1 sm:mb-1 overflow-hidden w-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-2 sm:p-3 pb-1 sm:pb-2">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
          <h2 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">
            {title}
          </h2>
          
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
                <div key={index} className="embla__slide w-full h-full flex items-stretch">
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-full h-64" />
                </div>
              ))
            ) : (
              // Actual items - force key update để trigger re-render
              items?.map((item, index) => (
                <div key={`random-${type}-${index}-${item.path?.replace(/[^a-zA-Z0-9]/g, '_') || index}-${localRefreshTrigger}`} className="embla__slide w-full h-full flex items-stretch">
                  <UniversalCard
                    item={item}
                    type={type}
                    isFavorite={Boolean(item.isFavorite)}
                    showViews={showViews}
                    onToggleFavorite={async (toggleItem) => {
                      await handleToggleFavorite(toggleItem);
                    }}
                    variant="compact-slider" // Dùng variant siêu gọn để giảm chiều cao slider
                    className="w-full h-full"
                  />
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

  {/* Đã bỏ padding đáy thừa để giảm tổng chiều cao wrapper */}
    </div>
  );
};

export default RandomSlider;
