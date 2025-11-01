// 📁 src/components/common/VirtualList.jsx
// 📜 Virtual Scrolling Component for Large Lists

import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Virtual List Component
 * Renders only visible items for better performance with large lists
 * 
 * @component
 * @param {Object} props
 * @param {Array} props.items - Array of items to render
 * @param {number} props.itemHeight - Fixed height of each item in pixels
 * @param {number} props.containerHeight - Height of the container
 * @param {Function} props.renderItem - Render function for each item
 * @param {number} [props.overscan=3] - Number of items to render outside visible area
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element}
 * 
 * @example
 * <VirtualList
 *   items={tasks}
 *   itemHeight={120}
 *   containerHeight={600}
 *   renderItem={(task) => <TaskCard key={task.id} task={task} />}
 *   overscan={5}
 * />
 */
const VirtualList = ({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 3,
  className = ''
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  // Calculate visible range
  const { startIndex, endIndex, offsetY } = useVisibleRange({
    scrollTop,
    containerHeight,
    itemHeight,
    itemCount: items.length,
    overscan
  });

  // Handle scroll with throttling
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const newScrollTop = containerRef.current.scrollTop;
      setScrollTop(newScrollTop);
    }
  }, []);

  // Throttle scroll handler
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId = null;
    let lastScrollTime = 0;
    const throttleMs = 16; // ~60fps

    const throttledScroll = () => {
      const now = Date.now();
      if (now - lastScrollTime < throttleMs) {
        rafId = requestAnimationFrame(throttledScroll);
        return;
      }

      lastScrollTime = now;
      handleScroll();
      rafId = null;
    };

    const onScroll = () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(throttledScroll);
      }
    };

    container.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', onScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [handleScroll]);

  // Get visible items
  const visibleItems = items.slice(startIndex, endIndex);

  // Total height of all items
  const totalHeight = items.length * itemHeight;

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto ${className}`}
      style={{ height: containerHeight }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: offsetY,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={item.id || startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Calculate visible range for virtual scrolling
 */
function useVisibleRange({
  scrollTop,
  containerHeight,
  itemHeight,
  itemCount,
  overscan
}) {
  // Calculate visible indices
  const startIndex = Math.max(
    0,
    Math.floor(scrollTop / itemHeight) - overscan
  );

  const endIndex = Math.min(
    itemCount,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  // Calculate offset
  const offsetY = startIndex * itemHeight;

  return { startIndex, endIndex, offsetY };
}

/**
 * Hook for auto-scrolling to item
 */
export function useScrollToItem(containerRef, itemHeight) {
  const scrollToItem = useCallback(
    (index) => {
      if (!containerRef.current) return;

      const scrollTop = index * itemHeight;
      containerRef.current.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      });
    },
    [containerRef, itemHeight]
  );

  return scrollToItem;
}

export default VirtualList;
