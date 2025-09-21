/**
 * Enhanced Service Worker for Manga Reader App
 * Provides intelligent caching, offline functionality, and storage management
 */

// Import default images constants
const DEFAULT_IMAGES = {
  cover: '/default/default-cover.jpg',
  folder: '/default/folder-thumb.png',
  music: '/default/music-thumb.png',
  video: '/default/video-thumb.png',
  favicon: '/default/favicon.png'
};

const CACHE_VERSION = 'v3.0.0';
const STATIC_CACHE = `offline-core-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `reader-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = 'chapter-images'; // Keep existing name for compatibility

// Offline essentials
const OFFLINE_CORE_ASSETS = [
  '/offline.html',
  DEFAULT_IMAGES.favicon,
  DEFAULT_IMAGES.cover,
  DEFAULT_IMAGES.folder,
  DEFAULT_IMAGES.music,
  DEFAULT_IMAGES.video
];

// Network timeout for better UX
const NETWORK_TIMEOUT = 5000;

// Cache instances management
const cacheInstances = new Map();

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('🔧 SW installing v3.0.0...');

  event.waitUntil((async () => {
    try {
      const cache = await caches.open(STATIC_CACHE);
      console.log('📦 Caching offline essentials...');

      for (const asset of OFFLINE_CORE_ASSETS) {
        try {
          await cache.add(asset);
          console.log('✅ Cached offline asset:', asset);
        } catch (error) {
          console.warn('⚠️ Failed to cache offline asset:', asset, error);
        }
      }
    } catch (error) {
      console.error('❌ Failed to prepare offline cache:', error);
    }

    await self.skipWaiting();
  })());
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 SW activating v3.0.0...');

  event.waitUntil(
    Promise.all([
      // Cleanup old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            const managedPrefixes = ['manga-', 'mainws-', 'offline-core-', 'reader-dynamic-'];
            const isManagedCache = managedPrefixes.some(prefix => cacheName.startsWith(prefix));

            if (cacheName !== STATIC_CACHE &&
                cacheName !== DYNAMIC_CACHE &&
                cacheName !== IMAGE_CACHE &&
                isManagedCache) {
              console.log('🗑️ Deleting old cache:', cacheName);
              // Remove from cache instances map too
              cacheInstances.delete(cacheName);
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
          try {
            client.postMessage({
              type: 'SW_ACTIVATED',
              version: CACHE_VERSION
            });
          } catch (error) {
            console.warn('Failed to notify client about SW activation:', error);
          }
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

// Cache instance management with Promise-based protection against race conditions
const cachePromises = new Map(); // Track pending cache.open() promises

/**
 * Get cache instance with race condition protection
 * Centralized function to avoid duplication across cache access points
 */
async function getCacheInstance(cacheName) {
  // Get existing cache instance
  let cache = cacheInstances.get(cacheName);
  if (cache) {
    return cache;
  }

  // Check if there's already a pending cache.open() for this cacheName
  let cachePromise = cachePromises.get(cacheName);
  if (!cachePromise) {
    // Create new cache.open() promise
    cachePromise = caches.open(cacheName);
    cachePromises.set(cacheName, cachePromise);
  }
  
  // Wait for the cache to be opened
  cache = await cachePromise;
  cacheInstances.set(cacheName, cache);
  cachePromises.delete(cacheName); // Clean up the promise
  
  return cache;
}

// Cache-first strategy for static assets with race condition protection
async function cacheFirstStrategy(request, cacheName) {
  try {
    // Use centralized cache instance getter
    const cache = await getCacheInstance(cacheName);
    
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
      // Use centralized cache instance getter
      const cache = await getCacheInstance(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('📦 Network failed, trying cache:', getResourceName(request.url));
    
    // Use centralized cache instance getter
    const cache = await getCacheInstance(cacheName);
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
    // Check our offline chapter cache first using centralized cache getter
    const chapterCache = await getCacheInstance(IMAGE_CACHE);
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

    if (networkResponse && networkResponse.ok) {
      try {
        const cache = await getCacheInstance(DYNAMIC_CACHE);

        await cache.put(request, networkResponse.clone());

        const appShellPaths = ['/', '/index.html'];
        await Promise.all(
          appShellPaths.map(async (path) => {
            try {
              await cache.put(path, networkResponse.clone());
            } catch (cacheError) {
              console.warn('⚠️ Failed to update app shell cache for', path, cacheError);
            }
          })
        );
      } catch (cacheError) {
        console.warn('⚠️ Failed to cache navigation response:', cacheError);
      }
    }

    return networkResponse;
  } catch (error) {
    console.log('📴 Offline navigation fallback:', request.url);

    try {
      const dynamicCache = await getCacheInstance(DYNAMIC_CACHE);

      const cachedResponse = await dynamicCache.match(request);
      if (cachedResponse) {
        console.log('✅ Serving cached navigation response');
        return cachedResponse;
      }

      const appShellPaths = ['/', '/index.html'];
      for (const path of appShellPaths) {
        const appShell = await dynamicCache.match(path);
        if (appShell) {
          console.log('✅ Serving cached app shell fallback');
          return appShell;
        }
      }
    } catch (cacheError) {
      console.warn('⚠️ Failed to read navigation cache:', cacheError);
    }

    try {
      // Get cache instance using centralized getter
      const cache = await getCacheInstance(STATIC_CACHE);

      // Serve dedicated offline page when available
      const offlinePage = await cache.match('/offline.html');
      if (offlinePage) {
        console.log('✅ Serving offline fallback page');
        return offlinePage;
      }
    } catch (fallbackError) {
      console.warn('⚠️ Failed to serve offline fallback page:', fallbackError);
    }

    // Final fallback with inline HTML
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Offline - MainWebSite</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: system-ui; text-align: center; padding: 50px; }
            h1 { color: #333; }
            button { padding: 10px 20px; font-size: 16px; cursor: pointer; }
          </style>
        </head>
        <body>
          <h1>📱 App đang offline</h1>
          <p>Không thể kết nối server. Vui lòng kiểm tra kết nối mạng.</p>
          <button onclick="window.location.reload()">🔄 Thử lại</button>
        </body>
      </html>
    `, {
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Helper functions
function isStaticAsset(request) {
  try {
    const url = new URL(request.url);

    if (url.origin !== self.location.origin) {
      return false;
    }

    return url.pathname === '/offline.html' ||
           url.pathname.startsWith('/default/');
  } catch (error) {
    console.warn('⚠️ Failed to inspect static asset request:', error);
    return false;
  }
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
    // Use centralized cache getter
    const cache = await getCacheInstance(STATIC_CACHE);
    const fallback = await cache.match(DEFAULT_IMAGES.cover);
    
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
      try {
        client.postMessage({
          type: 'BACKGROUND_SYNC',
          tag: 'retry-failed-downloads'
        });
      } catch (error) {
        console.warn('Failed to notify client about background sync:', error);
      }
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
      if (self.registration && self.registration.sync) {
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
      const cacheType = getCacheType(cacheName);
      const cacheInfo = {
        count: keys.length,
        type: cacheType
      };

      if (cacheType === 'offline-core') {
        cacheInfo.urls = keys.map((request) => {
          try {
            return new URL(request.url).pathname;
          } catch (error) {
            return request.url;
          }
        });
      }

      info.caches[cacheName] = cacheInfo;
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
  if (cacheName === STATIC_CACHE) return 'offline-core';
  if (cacheName === DYNAMIC_CACHE) return 'dynamic';
  if (cacheName === IMAGE_CACHE) return 'images';
  if (cacheName.includes('manga-') || cacheName.includes('mainws-')) return 'legacy';
  return 'unknown';
}

// Performance monitoring logic moved to main fetch handler.

console.log('🚀 Enhanced Service Worker v3.0.0 loaded');
