// 📁 src/components/common/TopViewSlider.jsx
// 🎯 Slider hiển thị manga/movie/music có lượt xem cao nhất

import React, { useRef, useEffect, useState, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { FiChevronLeft, FiChevronRight, FiEye } from 'react-icons/fi';
import { motion } from 'framer-motion';
import UniversalCard from '@/components/common/UniversalCard';
import Button from '@/components/common/Button';
import { useTopViewItems } from '@/hooks/useTopViewItems';
import { useMangaStore, useMovieStore, useMusicStore, useAuthStore } from '@/store';
import '@/styles/components/embla.css';

const TopViewSlider = ({ 
  type = 'manga',
  title = '🔥 Xem nhiều nhất',
  className = '',
  autoplay = false,
  autoplayDelay = 4000,
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

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
        <div className="text-center">
          <p className="text-red-500 mb-4">Lỗi tải dữ liệu: {error.message}</p>
        </div>
      </div>
    );
  }

  // Don't render if no items
  if (!loading && (!items || items.length === 0)) {
    return null;
  }

  return (
    <div ref={containerRef} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          
          {/* Item count badge */}
          {items && items.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded-full text-xs font-medium"
            >
              <FiEye className="w-3 h-3 mr-1" />
              <span>{items.length}</span>
            </motion.div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Navigation buttons */}
          <Button
            variant="ghost"
            size="sm"
            onClick={scrollPrev}
            disabled={!canScrollPrev || loading}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <FiChevronLeft className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={scrollNext}
            disabled={!canScrollNext || loading}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <FiChevronRight className="w-5 h-5" />
          </Button>
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
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-48 h-64" />
                </div>
              ))
            ) : (
              // Actual items - sorted by view count
              items?.map((item, index) => (
                <div key={`${item.path || index}-${localRefreshTrigger}`} className="embla__slide">
                  <div className="relative">
                    {/* Ranking badge */}
                    {index < 3 && (
                      <div className="absolute top-2 left-2 z-10">
                        <div className={`
                          w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white
                          ${index === 0 ? 'bg-yellow-500' : ''}
                          ${index === 1 ? 'bg-gray-400' : ''}
                          ${index === 2 ? 'bg-amber-600' : ''}
                        `}>
                          {index + 1}
                        </div>
                      </div>
                    )}
                    
                    <UniversalCard
                      item={item}
                      type={type}
                      isFavorite={Boolean(item.isFavorite)}
                      showViews={true}
                      onToggleFavorite={() => handleToggleFavorite(item)}
                      variant="compact"
                      className="w-48"
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

      {/* Bottom padding */}
      <div className="pb-2" />
    </div>
  );
};

export default TopViewSlider;
