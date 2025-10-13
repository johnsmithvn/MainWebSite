// 📁 src/utils/performanceOptimization.js
// ⚡ Performance Optimization Utilities for Download Queue

/**
 * Debounce function for limiting execution rate
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for limiting execution frequency
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  let lastResult;
  
  return function(...args) {
    if (!inThrottle) {
      lastResult = func.apply(this, args);
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
    
    return lastResult;
  };
}

/**
 * Progress Update Throttler
 * Batches progress updates to reduce re-renders
 */
export class ProgressUpdateThrottler {
  constructor(updateInterval = 500) {
    this.updateInterval = updateInterval;
    this.pendingUpdates = new Map();
    this.isProcessing = false;
    this.lastUpdate = 0;
  }

  /**
   * Queue a progress update
   * @param {string} taskId - Task ID
   * @param {number} progress - Progress percentage
   * @param {Function} callback - Update callback
   */
  queueUpdate(taskId, progress, callback) {
    this.pendingUpdates.set(taskId, { progress, callback });
    this.processQueue();
  }

  /**
   * Process queued updates
   */
  processQueue() {
    if (this.isProcessing) return;

    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastUpdate;

    if (timeSinceLastUpdate < this.updateInterval) {
      // Schedule next update
      setTimeout(() => {
        this.processQueue();
      }, this.updateInterval - timeSinceLastUpdate);
      return;
    }

    this.isProcessing = true;
    this.lastUpdate = now;

    // Batch all pending updates
    const updates = Array.from(this.pendingUpdates.entries());
    this.pendingUpdates.clear();

    // Execute all callbacks
    requestAnimationFrame(() => {
      updates.forEach(([taskId, { progress, callback }]) => {
        callback(taskId, progress);
      });
      
      this.isProcessing = false;

      // Process remaining updates if any
      if (this.pendingUpdates.size > 0) {
        this.processQueue();
      }
    });
  }

  /**
   * Clear all pending updates
   */
  clear() {
    this.pendingUpdates.clear();
    this.isProcessing = false;
  }
}

/**
 * Image Loading Optimizer
 * Implements lazy loading and intersection observer
 */
export class ImageLoadOptimizer {
  constructor(options = {}) {
    this.options = {
      rootMargin: '50px',
      threshold: 0.01,
      ...options
    };

    this.observer = null;
    this.loadedImages = new Set();
  }

  /**
   * Initialize intersection observer
   */
  init() {
    if (!('IntersectionObserver' in window)) {
      console.warn('IntersectionObserver not supported');
      return;
    }

    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      this.options
    );
  }

  /**
   * Handle intersection
   */
  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        this.loadImage(img);
        this.observer.unobserve(img);
      }
    });
  }

  /**
   * Load image
   */
  loadImage(img) {
    const src = img.dataset.src;
    if (!src || this.loadedImages.has(src)) return;

    img.src = src;
    this.loadedImages.add(src);

    img.onload = () => {
      img.classList.add('loaded');
    };
  }

  /**
   * Observe an image element
   */
  observe(img) {
    if (!this.observer) this.init();
    if (this.observer) {
      this.observer.observe(img);
    } else {
      // Fallback: load immediately
      this.loadImage(img);
    }
  }

  /**
   * Unobserve an image element
   */
  unobserve(img) {
    if (this.observer) {
      this.observer.unobserve(img);
    }
  }

  /**
   * Disconnect observer
   */
  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.loadedImages.clear();
  }
}

/**
 * Memory Usage Monitor
 * Tracks memory usage and triggers cleanup
 */
export class MemoryMonitor {
  constructor(options = {}) {
    this.options = {
      warningThreshold: 0.8, // 80%
      criticalThreshold: 0.9, // 90%
      checkInterval: 30000, // 30s
      ...options
    };

    this.isMonitoring = false;
    this.intervalId = null;
    this.listeners = new Set();
  }

  /**
   * Start monitoring
   */
  start() {
    if (this.isMonitoring) return;
    if (!('performance' in window) || !performance.memory) {
      console.warn('Memory API not available');
      return;
    }

    this.isMonitoring = true;
    this.check();

    this.intervalId = setInterval(() => {
      this.check();
    }, this.options.checkInterval);
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Check memory usage
   */
  check() {
    if (!performance.memory) return;

    const used = performance.memory.usedJSHeapSize;
    const limit = performance.memory.jsHeapSizeLimit;
    const percentUsed = used / limit;

    const status = {
      used,
      limit,
      percentUsed,
      level: this.getLevel(percentUsed)
    };

    // Notify listeners
    this.notify(status);

    return status;
  }

  /**
   * Get memory level
   */
  getLevel(percentUsed) {
    if (percentUsed >= this.options.criticalThreshold) {
      return 'critical';
    } else if (percentUsed >= this.options.warningThreshold) {
      return 'warning';
    }
    return 'normal';
  }

  /**
   * Add listener
   */
  addListener(callback) {
    this.listeners.add(callback);
  }

  /**
   * Remove listener
   */
  removeListener(callback) {
    this.listeners.delete(callback);
  }

  /**
   * Notify listeners
   */
  notify(status) {
    this.listeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Memory monitor listener error:', error);
      }
    });
  }
}

/**
 * Request Animation Frame Throttle
 * Ensures function runs at most once per frame
 */
export function rafThrottle(func) {
  let rafId = null;
  let lastArgs = null;

  return function throttled(...args) {
    lastArgs = args;

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        func.apply(this, lastArgs);
        rafId = null;
        lastArgs = null;
      });
    }
  };
}

/**
 * Idle Callback Wrapper
 * Executes task during browser idle time
 */
export function runWhenIdle(callback, options = {}) {
  const { timeout = 2000 } = options;

  if ('requestIdleCallback' in window) {
    return requestIdleCallback(callback, { timeout });
  }

  // Fallback to setTimeout
  return setTimeout(callback, 1);
}

/**
 * Cancel Idle Callback
 */
export function cancelIdle(id) {
  if ('cancelIdleCallback' in window) {
    cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
}

/**
 * Batch DOM Updates
 * Groups multiple DOM updates into single frame
 */
export class DOMUpdateBatcher {
  constructor() {
    this.pendingUpdates = [];
    this.isScheduled = false;
  }

  /**
   * Queue a DOM update
   */
  queue(update) {
    this.pendingUpdates.push(update);
    this.schedule();
  }

  /**
   * Schedule batch execution
   */
  schedule() {
    if (this.isScheduled) return;

    this.isScheduled = true;
    requestAnimationFrame(() => {
      this.flush();
    });
  }

  /**
   * Execute all pending updates
   */
  flush() {
    const updates = this.pendingUpdates;
    this.pendingUpdates = [];
    this.isScheduled = false;

    updates.forEach(update => {
      try {
        update();
      } catch (error) {
        console.error('DOM update error:', error);
      }
    });
  }

  /**
   * Clear pending updates
   */
  clear() {
    this.pendingUpdates = [];
    this.isScheduled = false;
  }
}

// Export singleton instances
export const progressThrottler = new ProgressUpdateThrottler(500);
export const imageOptimizer = new ImageLoadOptimizer();
export const memoryMonitor = new MemoryMonitor();
export const domBatcher = new DOMUpdateBatcher();
