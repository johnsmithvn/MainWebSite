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

// Offline essentials - cache only minimal assets (no thumbnails or full index)
const OFFLINE_CORE_ASSETS = [
  DEFAULT_IMAGES.favicon
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

            // Simplified logic - only check if managed cache and not current
            if (cacheName !== IMAGE_CACHE && isManagedCache) {
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
    
    // For online reading, try network without timeout or fallback
    // Let browser handle naturally - no interference for slow APIs
    console.log('🌐 Online manga image (no timeout):', getResourceName(request.url));
    const networkResponse = await fetch(request);
    
    // Only return if network succeeds, otherwise let request fail naturally
    return networkResponse;
  } catch (error) {
    // For offline mode: only fallback if we have cached offline content
    // For online mode: let the image fail naturally (no default image interference)
    console.log('❌ Manga image network failed - letting request fail naturally');
    throw error; // Don't serve fallback for online requests
  }
}

// Navigation strategy for SPA
async function navigationStrategy(request) {
  try {
    console.log('🧭 Navigation:', request.url);
    return await fetch(request);
  } catch (error) {
    console.log('📴 Offline navigation fallback:', request.url);
    return generateOfflineLibraryResponse();
  }
}

// Helper functions
function isStaticAsset(request) {
  try {
    const url = new URL(request.url);

    if (url.origin !== self.location.origin) {
      return false;
    }

    // Only check for default images, no offline.html
    return url.pathname.startsWith('/default/');
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

function generateOfflineLibraryResponse() {
  const html = `
      <!DOCTYPE html>
      <html lang="vi">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Thư viện Offline</title>
          <style>
            :root {
              color-scheme: light dark;
            }
            body {
              margin: 0;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              background: #0f172a;
              color: #e2e8f0;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 24px;
            }
            main {
              width: min(860px, 100%);
              background: rgba(15, 23, 42, 0.85);
              border: 1px solid rgba(148, 163, 184, 0.2);
              border-radius: 24px;
              box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.65);
              padding: 32px clamp(24px, 5vw, 48px);
              backdrop-filter: blur(18px);
            }
            header {
              display: flex;
              flex-direction: column;
              gap: 16px;
              margin-bottom: 32px;
            }
            header h1 {
              font-size: clamp(28px, 5vw, 40px);
              font-weight: 700;
              margin: 0;
            }
            header p {
              margin: 0;
              color: #cbd5f5;
              line-height: 1.6;
            }
            .card {
              background: rgba(15, 23, 42, 0.55);
              border-radius: 20px;
              border: 1px solid rgba(148, 163, 184, 0.15);
              padding: clamp(20px, 4vw, 28px);
              margin-bottom: 24px;
            }
            .card h2 {
              margin: 0 0 16px 0;
              font-size: 20px;
            }
            .status {
              font-size: 15px;
              margin: 0;
              color: #e2e8f0;
              transition: color 0.2s ease;
            }
            .status strong {
              color: #38bdf8;
            }
            .status.error {
              color: #fca5a5;
            }
            .status.error strong {
              color: #f87171;
            }
            .chapter-list {
              list-style: none;
              padding: 0;
              margin: 0;
              display: grid;
              gap: 16px;
            }
            .chapter-item {
              padding: clamp(16px, 3vw, 20px);
              border-radius: 16px;
              background: rgba(30, 41, 59, 0.75);
              border: 1px solid rgba(148, 163, 184, 0.15);
              transition: transform 0.2s ease, border-color 0.2s ease;
            }
            .chapter-item:hover {
              transform: translateY(-4px);
              border-color: rgba(96, 165, 250, 0.45);
            }
            .chapter-item h3 {
              margin: 0 0 8px 0;
              font-size: 18px;
              font-weight: 600;
              color: #f8fafc;
            }
            .meta {
              margin: 0;
              font-size: 14px;
              color: #cbd5f5;
            }
            .meta span {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              margin-right: 12px;
            }
            .meta span::before {
              font-size: 14px;
            }
            .meta span.pages::before { content: '📄'; }
            .meta span.size::before { content: '💾'; }
            .meta span.updated::before { content: '🕒'; }
            .empty {
              padding: 20px;
              border-radius: 16px;
              background: rgba(30, 41, 59, 0.65);
              border: 1px dashed rgba(148, 163, 184, 0.4);
              text-align: center;
              color: #cbd5f5;
            }
            .tag {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              background: rgba(56, 189, 248, 0.15);
              border: 1px solid rgba(56, 189, 248, 0.35);
              color: #bae6fd;
              padding: 6px 12px;
              border-radius: 999px;
              font-size: 13px;
            }
            .footer {
              margin-top: 24px;
              font-size: 13px;
              color: #94a3b8;
              text-align: center;
              line-height: 1.6;
            }
            .footer strong {
              color: #38bdf8;
            }
            @media (max-width: 640px) {
              body {
                padding: 16px;
              }
              main {
                padding: 24px 18px;
              }
              .chapter-item h3 {
                font-size: 16px;
              }
              .meta {
                font-size: 13px;
                display: grid;
                gap: 6px;
              }
            }
          </style>
        </head>
        <body>
          <main>
            <header>
              <span class="tag">Chế độ ngoại tuyến</span>
              <h1>Thư viện Offline</h1>
              <p>Danh sách chapter đã tải xuống trên thiết bị của bạn. Nội dung bên dưới được đọc trực tiếp từ bộ nhớ offline (IndexedDB).</p>
            </header>
            <section class="card">
              <h2>Trạng thái lưu trữ</h2>
              <p id="offline-status" class="status"><strong>Đang kiểm tra</strong> dữ liệu offline...</p>
              <div id="storage-summary" class="meta" style="margin-top:12px;"></div>
            </section>
            <section class="card">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px;">
                <h2 style="margin:0;">Danh sách chapter đã tải</h2>
                <span class="tag" id="chapter-count">0 chapters</span>
              </div>
              <ul id="chapter-list" class="chapter-list"></ul>
            </section>
            <p class="footer">
              Bạn có thể tiếp tục đọc khi trực tuyến trở lại bằng cách mở ứng dụng chính. Service Worker phiên bản <strong>${CACHE_VERSION}</strong> chỉ lưu lại danh sách offline để tiết kiệm dung lượng bộ nhớ cache.
            </p>
          </main>
          <script>
            (() => {
              const statusEl = document.getElementById('offline-status');
              const summaryEl = document.getElementById('storage-summary');
              const listEl = document.getElementById('chapter-list');
              const countEl = document.getElementById('chapter-count');

              const setStatus = (message, options = {}) => {
                if (!statusEl) return;
                const { isError = false } = options;
                statusEl.innerHTML = message;
                if (isError) {
                  statusEl.classList.add('error');
                } else {
                  statusEl.classList.remove('error');
                }
              };

              const toNumber = (value, fallback = 0) => {
                const parsed = Number(value);
                return Number.isFinite(parsed) ? parsed : fallback;
              };

              const formatNumber = (value) => {
                const num = Number(value);
                if (!Number.isFinite(num)) return '0';
                return new Intl.NumberFormat('vi-VN').format(num);
              };

              const formatSize = (bytes) => {
                if (!bytes) return '0 B';
                const units = ['B', 'KB', 'MB', 'GB'];
                let size = bytes;
                let unit = 0;
                while (size >= 1024 && unit < units.length - 1) {
                  size /= 1024;
                  unit++;
                }
                const precision = unit === 0 ? 0 : size < 10 ? 1 : 0;
                return size.toFixed(precision) + ' ' + units[unit];
              };

              const formatDateTime = (value) => {
                if (!value) return 'Không rõ thời gian';
                try {
                  return new Date(value).toLocaleString('vi-VN', {
                    hour12: false,
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                } catch (error) {
                  return 'Không rõ thời gian';
                }
              };

              const renderEmpty = (preserveStatus = false) => {
                listEl.innerHTML = '<li class="empty">Chưa có chapter nào được tải về. Hãy quay lại khi có kết nối để tải chapter mới.</li>';
                countEl.textContent = formatNumber(0) + ' chapters';
                summaryEl.textContent = '';
                if (!preserveStatus) {
                  setStatus('<strong>Chế độ offline hoạt động</strong>, nhưng chưa có dữ liệu được lưu.');
                }
              };

              const handleFatalError = (error) => {
                console.error('Offline library error:', error);
                setStatus('Đã xảy ra lỗi khi đọc dữ liệu offline.', { isError: true });
                renderEmpty(true);
              };

              const renderChapters = (chapters) => {
                if (!Array.isArray(chapters) || chapters.length === 0) {
                  renderEmpty();
                  return;
                }

                listEl.innerHTML = '';
                const sorted = [...chapters].sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));

                let totalBytes = 0;
                let totalPages = 0;

                sorted.forEach((chapter) => {
                  const item = document.createElement('li');
                  item.className = 'chapter-item';

                  const title = document.createElement('h3');
                  const mangaTitle = chapter.mangaTitle || 'Manga';
                  const chapterTitle = chapter.chapterTitle || chapter.id || 'Chapter';
                  title.textContent = mangaTitle + ' · ' + chapterTitle;

                  const meta = document.createElement('p');
                  meta.className = 'meta';

                  const fallbackPages = Array.isArray(chapter.pageUrls) ? chapter.pageUrls.length : 0;
                  const pages = toNumber(chapter.totalPages, fallbackPages);
                  const bytes = toNumber(chapter.bytes);
                  const updated = chapter.updatedAt || chapter.createdAt || null;

                  totalBytes += bytes;
                  totalPages += pages;

                  meta.innerHTML = '
                    <span class="pages">' + formatNumber(pages) + ' trang</span>
                    <span class="size">' + formatSize(bytes) + '</span>
                    <span class="updated">' + formatDateTime(updated) + '</span>
                  ';

                  item.appendChild(title);
                  item.appendChild(meta);
                  listEl.appendChild(item);
                });

                countEl.textContent = formatNumber(sorted.length) + (sorted.length > 1 ? ' chapters' : ' chapter');
                summaryEl.innerHTML = '
                  <span class="pages">' + formatNumber(totalPages) + ' trang</span>
                  <span class="size">' + formatSize(totalBytes) + '</span>
                ';

                setStatus('<strong>Hiển thị dữ liệu offline</strong> từ bộ nhớ thiết bị.');
              };

              const loadOfflineData = () => {
                if (!('indexedDB' in window)) {
                  setStatus('Trình duyệt không hỗ trợ IndexedDB, không thể đọc dữ liệu offline.', { isError: true });
                  renderEmpty(true);
                  return;
                }

                setStatus('<strong>Đang kiểm tra</strong> dữ liệu offline...');

                let request;
                try {
                  request = indexedDB.open('offline-manga');
                } catch (error) {
                  handleFatalError(error);
                  return;
                }

                request.onerror = () => {
                  const error = request.error;
                  console.error('IndexedDB open error:', error);
                  const isVersionError = error && error.name === 'VersionError';
                  const message = isVersionError
                    ? 'Phiên bản dữ liệu offline mới hơn phiên bản ứng dụng hiện tại. Hãy kết nối mạng để đồng bộ lại.'
                    : 'Không thể mở cơ sở dữ liệu offline.';
                  setStatus(message, { isError: true });
                  renderEmpty(true);
                };

                request.onupgradeneeded = () => {
                  const db = request.result;
                  if (!db.objectStoreNames.contains('chapters')) {
                    db.createObjectStore('chapters', { keyPath: 'id' });
                  }
                };

                request.onsuccess = () => {
                  const db = request.result;
                  try {
                    const tx = db.transaction('chapters', 'readonly');
                    const store = tx.objectStore('chapters');
                    const getAll = store.getAll();

                    tx.onerror = (event) => {
                      handleFatalError(event?.target?.error || event);
                    };

                    getAll.onerror = () => {
                      setStatus('Không thể tải danh sách chapter offline.', { isError: true });
                      renderEmpty(true);
                    };

                    getAll.onsuccess = () => {
                      try {
                        const chapters = Array.isArray(getAll.result) ? getAll.result : [];
                        renderChapters(chapters);
                      } catch (err) {
                        handleFatalError(err);
                      }
                    };

                    tx.oncomplete = () => {
                      db.close();
                    };
                  } catch (err) {
                    handleFatalError(err);
                  }
                };
              };

              try {
                loadOfflineData();
              } catch (error) {
                handleFatalError(error);
              }
            })();
          <\/script>
        </body>
      </html>
    `;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html' }
  });
}

function handleFetchError(request, error) {
  console.error('❌ Fetch error:', getResourceName(request.url), error.message);

  if (isNavigation(request)) {
    return generateOfflineLibraryResponse();
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
