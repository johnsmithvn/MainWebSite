/**
 * Service Worker Manager
 * Handles SW registration, updates, and communication with main app
 */

class ServiceWorkerManager {
  constructor() {
    this.registration = null;
    this.isOnline = navigator.onLine;
    this.listeners = new Map();
    
    // Listen to online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.emit('online');
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.emit('offline');
    });
    
    // Listen to SW messages
    navigator.serviceWorker?.addEventListener('message', this.handleMessage.bind(this));
  }

  /**
   * Register service worker
   */
  async register() {
    if (!('serviceWorker' in navigator)) {
      console.warn('⚠️ Service Worker not supported');
      return false;
    }

    try {
      console.log('🔧 Registering Service Worker...');
      
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('✅ SW registered:', this.registration);

      // Handle SW lifecycle events
      this.registration.addEventListener('updatefound', () => {
        console.log('🔄 SW update found');
        this.handleUpdateFound();
      });

      // Check for existing SW
      if (navigator.serviceWorker.controller) {
        console.log('🎮 SW already controlling');
        this.emit('ready');
      } else {
        // Wait for SW to control the page
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('🎮 SW now controlling');
          this.emit('ready');
        });
      }

      return true;
    } catch (error) {
      console.error('❌ SW registration failed:', error);
      return false;
    }
  }

  /**
   * Handle SW updates
   */
  handleUpdateFound() {
    const newWorker = this.registration.installing;
    
    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed') {
        if (navigator.serviceWorker.controller) {
          // Update available
          console.log('🔄 SW update available');
          this.emit('updateAvailable', newWorker);
        } else {
          // First install
          console.log('✅ SW installed for first time');
          this.emit('ready');
        }
      }
    });
  }

  /**
   * Apply SW update
   */
  async applyUpdate() {
    if (!this.registration?.waiting) {
      console.warn('⚠️ No SW update waiting');
      return false;
    }

    try {
      // Tell SW to skip waiting
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Reload page after SW takes control
      window.location.reload();
      
      return true;
    } catch (error) {
      console.error('❌ Failed to apply SW update:', error);
      return false;
    }
  }

  /**
   * Get cache information
   */
  async getCacheInfo() {
    return this.postMessage({ type: 'GET_CACHE_INFO' });
  }

  /**
   * Clear specific cache
   */
  async clearCache(cacheName) {
    return this.postMessage({ 
      type: 'CLEAR_CACHE', 
      data: { cacheName } 
    });
  }

  /**
   * Register background sync for failed downloads
   */
  async registerBackgroundSync() {
    if (
      !('serviceWorker' in navigator) || 
      !(
        typeof window.ServiceWorkerRegistration !== 'undefined' && 
        'sync' in window.ServiceWorkerRegistration.prototype
      )
    ) {
      console.warn('⚠️ Background sync not supported');
      return false;
    }

    try {
      await this.postMessage({ type: 'REGISTER_BACKGROUND_SYNC' });
      console.log('✅ Background sync registered');
      return true;
    } catch (error) {
      console.error('❌ Failed to register background sync:', error);
      return false;
    }
  }

  /**
   * Check if app can work offline
   */
  async checkOfflineCapability() {
    if (!navigator.serviceWorker?.controller) {
      return {
        capable: false,
        reason: 'No service worker controlling'
      };
    }

    try {
      const cacheInfo = await this.getCacheInfo();
      const hasAppShell = cacheInfo?.caches?.['manga-static-v2.0.0']?.count > 0;
      
      return {
        capable: hasAppShell,
        reason: hasAppShell ? 'App shell cached' : 'App shell not cached',
        cacheInfo
      };
    } catch (error) {
      return {
        capable: false,
        reason: 'Failed to check caches',
        error: error.message
      };
    }
  }

  /**
   * Post message to service worker
   */
  async postMessage(message) {
    if (!navigator.serviceWorker?.controller) {
      throw new Error('No service worker controller');
    }

    return new Promise((resolve, reject) => {
      const channel = new MessageChannel();
      
      channel.port1.onmessage = (event) => {
        const { type, data, error } = event.data;
        
        if (error) {
          reject(new Error(error));
        } else {
          resolve(data);
        }
      };

      navigator.serviceWorker.controller.postMessage(message, [channel.port2]);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error('SW message timeout'));
      }, 10000);
    });
  }

  /**
   * Handle messages from service worker
   */
  handleMessage(event) {
    const { type, data } = event.data || {};
    
    console.log('💬 Message from SW:', type);
    
    switch (type) {
      case 'SW_ACTIVATED':
        this.emit('activated', data);
        break;
        
      case 'BACKGROUND_SYNC':
        this.emit('backgroundSync', data);
        break;
        
      case 'CACHE_INFO_RESPONSE':
        this.emit('cacheInfo', data);
        break;
        
      case 'CACHE_CLEAR_RESPONSE':
        this.emit('cacheCleared', data);
        break;
        
      default:
        console.log('Unknown SW message:', type, data);
    }
  }

  /**
   * Event emitter methods
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('❌ Event listener error:', error);
        }
      });
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      supported: 'serviceWorker' in navigator,
      registered: !!this.registration,
      controller: !!navigator.serviceWorker?.controller,
      online: this.isOnline,
      backgroundSyncSupported: 
        window.ServiceWorkerRegistration && 'sync' in window.ServiceWorkerRegistration.prototype
    };
  }

  /**
   * Force update check
   */
  async checkForUpdate() {
    if (!this.registration) {
      console.warn('⚠️ No SW registration to check for updates');
      return false;
    }

    try {
      console.log('🔍 Checking for SW updates...');
      await this.registration.update();
      return true;
    } catch (error) {
      console.error('❌ Failed to check for updates:', error);
      return false;
    }
  }

  /**
   * Unregister service worker (for development/debugging)
   */
  async unregister() {
    if (!this.registration) {
      console.warn('⚠️ No SW registration to unregister');
      return false;
    }

    try {
      console.log('🗑️ Unregistering SW...');
      const result = await this.registration.unregister();
      
      if (result) {
        console.log('✅ SW unregistered');
        this.registration = null;
      }
      
      return result;
    } catch (error) {
      console.error('❌ Failed to unregister SW:', error);
      return false;
    }
  }
}

// Create singleton instance
const swManager = new ServiceWorkerManager();

// Auto-register on load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    swManager.register().catch(console.error);
  });
}

export default swManager;

// Named exports for convenience
export {
  ServiceWorkerManager,
  swManager
};
