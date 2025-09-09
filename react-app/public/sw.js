/**
 * Enhanced Service Worker for Manga Reader App
 * Provides intelligent caching, offline functionality, and storage management
 */

const CACHE_VERSION = 'v2.0.0';
const STATIC_CACHE = `manga-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `manga-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = 'chapter-images'; // Keep existing name for compatibility

// Critical app shell resources
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/default/favicon.png',
  '/default/default-cover.jpg',
  '/default/folder-thumb.png',
  '/default/music-thumb.png',
  '/default/video-thumb.png'
];

// Network timeout for better UX
const NETWORK_TIMEOUT = 5000;

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('🔧 SW installing v2.0.0...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Caching app shell...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ App shell cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Failed to cache app shell:', error);
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 SW activating v2.0.0...');
  
  event.waitUntil(
    Promise.all([
      // Cleanup old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== IMAGE_CACHE &&
                (cacheName.includes('manga-') || cacheName.includes('mainws-'))) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all pages
      self.clients.claim()
    ])
    .then(() => {
      console.log('✅ SW activated and controlling pages');
      
      // Notify all clients about SW activation
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            version: CACHE_VERSION
          });
        });
      });
    })
    .catch((error) => {
      console.error('❌ SW activation failed:', error);
    })
  );
});

// Enhanced fetch handler with intelligent strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Route to appropriate strategy
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
  } else if (isAPIRequest(request)) {
    event.respondWith(networkFirstWithTimeout(request, DYNAMIC_CACHE));
  } else if (isMangaImage(request)) {
    event.respondWith(mangaImageStrategy(request));
  } else if (isNavigation(request)) {
    event.respondWith(navigationStrategy(request));
  } else {
    // Default to network-first for other resources
    event.respondWith(networkFirstWithTimeout(request, DYNAMIC_CACHE));
  }
});

// Cache-first strategy for static assets
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('📦 Cache hit:', getResourceName(request.url));
      
      // Update cache in background for next time
      if (navigator.onLine) {
        updateCacheInBackground(request, cache);
      }
      
      return cachedResponse;
    }
    
    console.log('🌐 Cache miss, fetching:', getResourceName(request.url));
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('❌ Cache-first failed:', error);
    return handleFetchError(request, error);
  }
}

// Network-first with timeout for better UX
async function networkFirstWithTimeout(request, cacheName) {
  try {
    console.log('🌐 Network-first:', getResourceName(request.url));
    
    // Race between network and timeout
    const networkPromise = fetch(request);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Network timeout')), NETWORK_TIMEOUT)
    );
    
    const networkResponse = await Promise.race([networkPromise, timeoutPromise]);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('📦 Network failed, trying cache:', getResourceName(request.url));
    
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('📦 Cache fallback success');
      return cachedResponse;
    }
    
    return handleFetchError(request, error);
  }
}

// Special strategy for manga images
async function mangaImageStrategy(request) {
  try {
    // Check our offline chapter cache first
    const chapterCache = await caches.open(IMAGE_CACHE);
    const cachedImage = await chapterCache.match(request);
    
    if (cachedImage) {
      console.log('🖼️ Offline manga image:', getResourceName(request.url));
      return cachedImage;
    }
    
    // For online reading, try network with timeout
    console.log('🌐 Online manga image:', getResourceName(request.url));
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Image timeout')), NETWORK_TIMEOUT)
      )
    ]);
    
    return networkResponse;
  } catch (error) {
    console.log('❌ Manga image failed, serving fallback');
    return getFallbackImage();
  }
}

// Navigation strategy for SPA
async function navigationStrategy(request) {
  try {
    console.log('🧭 Navigation:', request.url);
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('📦 Offline navigation, serving app');
    const cache = await caches.open(STATIC_CACHE);
    const appShell = await cache.match('/index.html');
    
    if (appShell) {
      return appShell;
    }
    
    return new Response('App not available offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Helper functions
function isStaticAsset(request) {
  const url = request.url;
  return url.includes('/static/') || 
         url.includes('/assets/') ||
         url.includes('/manifest.webmanifest') ||
         url.includes('/default/') ||
         url.includes('favicon');
}

function isAPIRequest(request) {
  return request.url.includes('/api/');
}

function isMangaImage(request) {
  const url = request.url;
  return (url.includes('/manga/') && 
          url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) ||
         request.destination === 'image';
}

function isNavigation(request) {
  return request.mode === 'navigate';
}

function getResourceName(url) {
  return url.split('/').pop() || url;
}

async function updateCacheInBackground(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response);
    }
  } catch (error) {
    // Silent fail for background updates
  }
}

async function getFallbackImage() {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const fallback = await cache.match('/default/default-cover.jpg');
    
    if (fallback) {
      return fallback;
    }
    
    // SVG placeholder if default image not available
    const svgResponse = new Response(
      `<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="300" fill="#374151"/>
        <text x="100" y="150" text-anchor="middle" fill="white" font-family="Arial">
          Image not available
        </text>
      </svg>`,
      {
        headers: { 'Content-Type': 'image/svg+xml' }
      }
    );
    
    return svgResponse;
  } catch (error) {
    return new Response('Image not available', { status: 404 });
  }
}

function handleFetchError(request, error) {
  console.error('❌ Fetch error:', getResourceName(request.url), error.message);
  
  if (isNavigation(request)) {
    return new Response('Page not available offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
  
  return new Response('Resource not available', {
    status: 503,
    statusText: 'Service Unavailable'
  });
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag);
  
  if (event.tag === 'retry-failed-downloads') {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  try {
    console.log('🔄 Processing background sync...');
    
    // Notify main app about sync opportunity
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'BACKGROUND_SYNC',
        tag: 'retry-failed-downloads'
      });
    });
    
    console.log('✅ Background sync completed');
  } catch (error) {
    console.error('❌ Background sync failed:', error);
  }
}

// Enhanced message handling
self.addEventListener('message', (event) => {
  const { type, data } = event.data || {};
  
  console.log('💬 SW message:', type);
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_CACHE_INFO':
      getCacheInfo().then(info => {
        event.source.postMessage({
          type: 'CACHE_INFO_RESPONSE',
          data: info
        });
      });
      break;
      
    case 'CLEAR_CACHE':
      clearSpecificCache(data?.cacheName).then(result => {
        event.source.postMessage({
          type: 'CACHE_CLEAR_RESPONSE',
          data: { success: result, cacheName: data?.cacheName }
        });
      });
      break;
      
    case 'REGISTER_BACKGROUND_SYNC':
      // Register background sync when offline
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        self.registration.sync.register('retry-failed-downloads');
      }
      break;
      
    default:
      console.warn('Unknown message type:', type);
  }
});

// Cache management utilities
async function getCacheInfo() {
  try {
    const cacheNames = await caches.keys();
    const info = {
      version: CACHE_VERSION,
      caches: {},
      totalSize: 0
    };
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      info.caches[cacheName] = {
        count: keys.length,
        type: getCacheType(cacheName)
      };
    }
    
    return info;
  } catch (error) {
    console.error('❌ Failed to get cache info:', error);
    return { error: error.message };
  }
}

async function clearSpecificCache(cacheName) {
  try {
    if (!cacheName) return false;
    
    console.log('🗑️ Clearing cache:', cacheName);
    const result = await caches.delete(cacheName);
    
    if (result) {
      console.log('✅ Cache cleared:', cacheName);
    } else {
      console.log('⚠️ Cache not found:', cacheName);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Failed to clear cache:', error);
    return false;
  }
}

function getCacheType(cacheName) {
  if (cacheName.includes('static')) return 'static';
  if (cacheName.includes('dynamic')) return 'dynamic';
  if (cacheName.includes('chapter-images')) return 'images';
  return 'unknown';
}

// Performance monitoring
self.addEventListener('fetch', (event) => {
  // Log cache hit/miss rates for monitoring
  if (event.request.method === 'GET') {
    const start = performance.now();
    
    event.respondWith(
      (async () => {
        // Your existing fetch handling logic here
        // Then add performance logging
        const duration = performance.now() - start;
        
        if (duration > 1000) {
          console.warn('⚠️ Slow request:', getResourceName(event.request.url), `${Math.round(duration)}ms`);
        }
      })()
    );
  }
});

console.log('🚀 Enhanced Service Worker v2.0.0 loaded');
