/**
 * Enhanced Service Worker for Manga Reader App
 * Provides intelligent caching, offline functionality, and storage management
 * 
 * ✅ v3.0.1 - PDF streaming optimization (no cache)
 */

// Import default images constants
const DEFAULT_IMAGES = {
  cover: '/default/default-cover.jpg',
  folder: '/default/folder-thumb.png',
  music: '/default/music-thumb.png',
  video: '/default/video-thumb.png',
  favicon: '/default/favicon.png'
};

// Log chi tiết (mỗi request, mỗi lần cache hit…) tắt mặc định — PERFORMANCE-CACHE-REPORT PF18.
// Đặt true khi cần gỡ lỗi SW. console.warn / console.error vẫn luôn hiện.
const SW_DEBUG = false;
const swLog = SW_DEBUG ? console.log.bind(console) : () => {};

const CACHE_VERSION = 'v3.1.0'; // ✅ Added thumbnail caching for Movie/Music/Media
const STATIC_CACHE = `offline-core-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `reader-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = 'chapter-images'; // Keep existing name for compatibility
const THUMBNAIL_CACHE = 'media-thumbnails-v1'; // New cache for movie/music/media thumbnails

// Offline essentials - only default images, no offline.html
const OFFLINE_CORE_ASSETS = [
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

// getCacheInfo performance cache
const cacheInfoCache = { data: null, timestamp: 0 };
const CACHE_INFO_TTL = 5000; // 5 seconds cache for expensive getCacheInfo calls

// Content change tracking for cache invalidation
const contentChangeTracker = {
  lastModified: new Map(), // Track last modified times by URL
  contentHashes: new Map()  // Track content hashes for change detection
};

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  swLog('🔧 SW installing v3.1.0...');

  event.waitUntil((async () => {
    try {
      const cache = await caches.open(STATIC_CACHE);
      swLog('📦 Caching offline essentials...');

      for (const asset of OFFLINE_CORE_ASSETS) {
        try {
          await cache.add(asset);
          swLog('✅ Cached offline asset:', asset);
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
  swLog('🚀 SW activating v3.1.0...');

  event.waitUntil(
    Promise.all([
      // Cleanup old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            const managedPrefixes = ['manga-', 'mainws-', 'offline-core-', 'reader-dynamic-'];
            const isManagedCache = managedPrefixes.some(prefix => cacheName.startsWith(prefix));

            // Keep THUMBNAIL_CACHE and IMAGE_CACHE, clean up old versions
            const isCurrentCache = cacheName === IMAGE_CACHE || 
                                   cacheName === THUMBNAIL_CACHE ||
                                   cacheName === STATIC_CACHE ||
                                   cacheName === DYNAMIC_CACHE;

            // Simplified logic - only check if managed cache and not current
            if (!isCurrentCache && isManagedCache) {
              swLog('🗑️ Deleting old cache:', cacheName);
              // Remove from cache instances map too
              cacheInstances.delete(cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),

      // Xoá bản sao file nhạc/phim do bản SW cũ lưu (PF2), rồi giới hạn số response API (B15)
      purgeStreamEntries()
        .then(() => trimApiEntries())
        .catch((error) => console.warn('⚠️ Failed to trim API cache:', error)),

      // Take control of all pages
      self.clients.claim()
    ])
    .then(() => {
      swLog('✅ SW activated and controlling pages');
      
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
  
  // ✅ Network-only for PDF (no cache, stream directly)
  if (request.url.includes('/api/manga/pdf')) {
    event.respondWith(fetch(request));
    return;
  }

  // ✅ Stream / tải file: không đi qua SW, để trình duyệt tự xử lý (PF2, B15).
  // Phát nhạc/phim luôn nhận 206 nên chưa bao giờ được cache; nhạc tải về được lưu ra máy qua
  // <a download> → bản sao trong reader-dynamic không nơi nào đọc, chỉ tốn dung lượng.
  if (isStreamOrDownload(request, url)) return;

  // Route to appropriate strategy
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
  } else if (isAPIRequest(request)) {
    event.respondWith(networkFirstWithTimeout(request, DYNAMIC_CACHE, event));
  } else if (isThumbnailRequest(request)) {
    // Kiểm tra TRƯỚC isMangaImage, vì isMangaImage bắt mọi request ảnh (B14)
    event.respondWith(thumbnailCacheStrategy(request, event));
  } else if (isMangaImage(request)) {
    event.respondWith(mangaImageStrategy(request));
  } else if (isNavigation(request)) {
    event.respondWith(navigationStrategy(request, event));
  } else {
    // Default to network-first for other resources
    event.respondWith(networkFirstWithTimeout(request, DYNAMIC_CACHE, event));
  }
});

// Endpoint stream / download (so khớp đúng pathname: /api/movie/video-cache vẫn được cache)
const STREAM_API_PATHS = ['/api/music/download', '/api/music/audio', '/api/movie/video'];

function isStreamOrDownload(request, url) {
  if (STREAM_API_PATHS.includes(url.pathname)) return true;
  // Request có Range (thẻ <audio>/<video> với file tĩnh /audio, /video, /media) luôn trả 206,
  // Cache API không lưu được 206 → đi qua SW chỉ thêm độ trễ và timeout 5s
  return request.headers.has('range');
}

/**
 * Dọn một lần các bản sao file nhạc/phim mà bản SW cũ đã lưu vào reader-dynamic (PF2).
 * Chỉ xoá đúng các mục stream/download, giữ nguyên dữ liệu API khác dùng cho offline.
 */
async function purgeStreamEntries() {
  try {
    if (!(await caches.has(DYNAMIC_CACHE))) return;
    const cache = await caches.open(DYNAMIC_CACHE);
    const requests = await cache.keys();
    let removed = 0;
    for (const req of requests) {
      let pathname;
      try {
        pathname = new URL(req.url).pathname;
      } catch {
        continue;
      }
      if (STREAM_API_PATHS.includes(pathname)) {
        await cache.delete(req);
        removed++;
      }
    }
    if (removed > 0) swLog(`🗑️ Removed ${removed} cached stream/download entries from ${DYNAMIC_CACHE}`);
  } catch (error) {
    console.warn('⚠️ Failed to purge stream entries:', error);
  }
}

// Cache instance management with Promise-based protection against race conditions
const cachePromises = new Map(); // Track pending cache.open() promises

/**
 * Get cache instance with race condition protection
 * Centralized function to avoid duplication across cache access points
 * 
 * ✅ FIX: Properly cleanup cachePromises Map to prevent memory leak
 * 
 * @param {string} cacheName - Name of the cache to open
 * @returns {Promise<Cache>} Cache instance
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
    // Create new cache.open() promise with proper cleanup
    cachePromise = caches.open(cacheName).then(openedCache => {
      // ✅ Store cache instance for future use
      cacheInstances.set(cacheName, openedCache);
      // ✅ Clean up promise map to prevent memory leak
      cachePromises.delete(cacheName);
      return openedCache;
    }).catch(error => {
      // ✅ Clean up promise map on error too
      cachePromises.delete(cacheName);
      throw error;
    });
    
    cachePromises.set(cacheName, cachePromise);
  }
  
  // Wait for the cache to be opened (will get from cacheInstances on next call)
  cache = await cachePromise;
  
  return cache;
}

// Cache-first strategy for static assets with race condition protection
async function cacheFirstStrategy(request, cacheName) {
  try {
    // Use centralized cache instance getter
    const cache = await getCacheInstance(cacheName);
    
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      swLog('📦 Cache hit:', getResourceName(request.url));
      
      // Update cache in background for next time
      if (navigator.onLine) {
        updateCacheInBackground(request, cache);
      }
      
      return cachedResponse;
    }
    
    swLog('🌐 Cache miss, fetching:', getResourceName(request.url));
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

/**
 * Chạy việc ghi cache ở nền: response được trả cho trang ngay, còn event.waitUntil giữ SW sống
 * tới khi ghi xong (PERFORMANCE-CACHE-REPORT PF2). Trước đây `await cache.put()` nằm trước
 * `return`, mà cache.put chỉ xong khi đọc hết body → trang phải chờ tải xong toàn bộ response.
 * Lỗi được bắt ở đây (lý do ban đầu của `await` là để try/catch bắt được lỗi cache.put).
 */
function runInBackground(event, task, label) {
  const promise = Promise.resolve()
    .then(task)
    .catch((error) => {
      console.warn(`⚠️ ${label || 'Background cache task'} failed:`, error && error.message);
    });
  if (event && typeof event.waitUntil === 'function') {
    try {
      event.waitUntil(promise);
    } catch (error) {
      // event đã kết thúc → việc ghi cache vẫn tiếp tục nhưng không được giữ SW sống
    }
  }
  return promise;
}

// Giới hạn số response /api/* giữ trong reader-dynamic (B15). Trước đây không giới hạn: mỗi lần tìm
// kiếm, mỗi trang, mỗi thư mục đã mở đều thêm một mục, không bao giờ dọn. Giữ lại các mục mới nhất
// (dùng làm dữ liệu offline), xoá mục cũ nhất khi vượt ngưỡng. Asset và trang không bị tính.
const MAX_API_ENTRIES = 400;
const TRIM_EVERY_PUTS = 50;
let apiPutsSinceTrim = 0;

function isApiUrl(url) {
  try {
    return new URL(url).pathname.startsWith('/api/');
  } catch {
    return false;
  }
}

async function trimApiEntries(cacheName = DYNAMIC_CACHE) {
  const cache = await getCacheInstance(cacheName);
  const requests = await cache.keys(); // thứ tự thêm vào: cũ → mới
  const apiRequests = requests.filter((r) => isApiUrl(r.url));
  const excess = apiRequests.length - MAX_API_ENTRIES;
  for (let i = 0; i < excess; i++) {
    await cache.delete(apiRequests[i]);
  }
  if (excess > 0) {
    swLog(`🗑️ Trimmed ${excess} old API responses from ${cacheName}`);
    invalidateCacheInfo();
  }
}

/** Lưu response 200 vào cache ở nền (clone ngay, trước khi trang đọc body) */
function saveResponseInBackground(event, request, response, cacheName) {
  // Only cache full responses (200), not partial content (206) or other status codes
  // Cache API doesn't support 206 Partial Content responses
  if (!response || !response.ok || response.status !== 200) return;
  const copy = response.clone();
  runInBackground(event, async () => {
    // Use centralized cache instance getter
    const cache = await getCacheInstance(cacheName);

    // Check if content changed before caching
    const shouldCache = await checkContentChange(request, copy.clone());
    if (shouldCache) {
      await cache.put(request, copy);
      // ✅ Invalidate cache info when new content is cached
      invalidateCacheInfo();
      if (isApiUrl(request.url) && ++apiPutsSinceTrim >= TRIM_EVERY_PUTS) {
        apiPutsSinceTrim = 0;
        await trimApiEntries(cacheName);
      }
    }
  }, 'Failed to cache response');
}

// Network-first with timeout for better UX
// Sau NETWORK_TIMEOUT mà mạng chưa trả lời (B15):
// - có bản cache → trả bản cache ngay, response mạng về sau vẫn được lưu để lần sau dùng
// - chưa có bản cache → tiếp tục CHỜ mạng (trước đây trả 503 dù server vẫn đang xử lý, vd. thư mục
//   lớn đọc từ ổ đĩa). Mạng lỗi thật (offline) thì fetch tự báo lỗi ngay, không phải chờ.
const TIMED_OUT = Symbol('timeout');

async function networkFirstWithTimeout(request, cacheName, event) {
  const networkPromise = fetch(request);
  networkPromise.catch(() => {}); // tránh "unhandled rejection" nếu đã trả bản cache trước khi mạng lỗi
  let timeoutId;
  const timeoutPromise = new Promise((resolve) => {
    timeoutId = setTimeout(() => resolve(TIMED_OUT), NETWORK_TIMEOUT);
  });

  try {
    const first = await Promise.race([networkPromise, timeoutPromise]);
    if (first !== TIMED_OUT) {
      clearTimeout(timeoutId);
      saveResponseInBackground(event, request, first, cacheName);
      return first;
    }

    // Mạng chậm: có cache thì trả cache, mạng về sau vẫn cập nhật cache
    const cache = await getCacheInstance(cacheName);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      runInBackground(event, async () => {
        const late = await networkPromise;
        saveResponseInBackground(event, request, late, cacheName);
      }, 'Late network update');
      return cachedResponse;
    }

    const networkResponse = await networkPromise;
    saveResponseInBackground(event, request, networkResponse, cacheName);
    return networkResponse;
  } catch (error) {
    clearTimeout(timeoutId);
    // Use centralized cache instance getter
    const cache = await getCacheInstance(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
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
      return cachedImage;
    }
    
    // For online reading, try network without timeout or fallback
    // Let browser handle naturally - no interference for slow APIs
    const networkResponse = await fetch(request);
    
    // Only return if network succeeds, otherwise let request fail naturally
    return networkResponse;
  } catch (error) {
    // For offline mode: only fallback if we have cached offline content
    // For online mode: let the image fail naturally (no default image interference)
    swLog('❌ Manga image network failed - letting request fail naturally');
    throw error; // Don't serve fallback for online requests
  }
}

// Thumbnail caching strategy for Movie/Music/Media
// Uses stale-while-revalidate pattern: serve cached, update in background.
// Chỉ áp cho thumbnail trong thư mục .thumbnail (xem isThumbnailRequest) — ISSUES B14.
const MAX_THUMBNAILS = 1000; // ~30MB
let thumbnailPutsSinceTrim = 0;

async function putThumbnail(thumbnailCache, request, response) {
  await thumbnailCache.put(request, response);
  // Dọn theo lô thay vì liệt kê toàn bộ cache sau mỗi lần ghi
  if (++thumbnailPutsSinceTrim >= TRIM_EVERY_PUTS) {
    thumbnailPutsSinceTrim = 0;
    const keys = await thumbnailCache.keys(); // cũ → mới
    const excess = keys.length - MAX_THUMBNAILS;
    for (let i = 0; i < excess; i++) {
      await thumbnailCache.delete(keys[i]);
    }
    if (excess > 0) swLog(`🗑️ Cleaned ${excess} old thumbnails`);
  }
}

async function thumbnailCacheStrategy(request, event) {
  const thumbnailCache = await getCacheInstance(THUMBNAIL_CACHE);
  const cachedThumbnail = await thumbnailCache.match(request);

  // Serve cached thumbnail immediately if available
  if (cachedThumbnail) {
    // Update cache in background (stale-while-revalidate). fetch() đi qua HTTP cache của trình
    // duyệt (max-age 1 giờ) nên phần lớn không tốn request mạng.
    if (navigator.onLine) {
      runInBackground(event, async () => {
        const networkResponse = await fetch(request);
        if (!networkResponse.ok) return;
        // Check if content changed before updating
        const shouldUpdate = await checkContentChange(request, networkResponse.clone());
        if (shouldUpdate) await putThumbnail(thumbnailCache, request, networkResponse);
      }, 'Thumbnail background update');
    }
    return cachedThumbnail;
  }

  // No cache: fetch from network and cache. Lỗi mạng thì để ảnh lỗi tự nhiên (như trước) để
  // frontend tự hiện ảnh dự phòng qua onError.
  const networkResponse = await fetch(request);
  if (networkResponse.ok) {
    // Ghi cache ở nền, trả ảnh cho trang ngay (PF2)
    const copy = networkResponse.clone();
    runInBackground(event, () => putThumbnail(thumbnailCache, request, copy), 'Failed to cache thumbnail');
  }
  return networkResponse;
}

// Navigation strategy for SPA
async function navigationStrategy(request, event) {
  try {
    swLog('🧭 Navigation:', request.url);
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.ok) {
      // Clone ngay rồi ghi cache ở nền, trả trang ngay (PF2)
      const appShellPaths = ['/', '/index.html'];
      const routeCopy = networkResponse.clone();
      const shellCopies = appShellPaths.map(() => networkResponse.clone());
      runInBackground(event, async () => {
        const cache = await getCacheInstance(DYNAMIC_CACHE);

        await cache.put(request, routeCopy);

        await Promise.all(
          appShellPaths.map(async (path, i) => {
            try {
              await cache.put(path, shellCopies[i]);
            } catch (cacheError) {
              console.warn('⚠️ Failed to update app shell cache for', path, cacheError);
            }
          })
        );
      }, 'Failed to cache navigation response');
    }

    return networkResponse;
  } catch (error) {
    swLog('📴 Offline navigation fallback:', request.url);

    try {
      const dynamicCache = await getCacheInstance(DYNAMIC_CACHE);

      // First: Try exact cached response for the route
      const cachedResponse = await dynamicCache.match(request);
      if (cachedResponse) {
        swLog('✅ Serving cached navigation response');
        return cachedResponse;
      }

      // Second: Try app shell - prefer React app over static offline.html
      const appShellPaths = ['/', '/index.html'];
      for (const path of appShellPaths) {
        const appShell = await dynamicCache.match(path);
        if (appShell) {
          swLog('✅ Serving cached app shell fallback (React app)');
          return appShell;
        }
      }

      // Try static cache for app shell as well
      const staticCache = await getCacheInstance(STATIC_CACHE);
      for (const path of appShellPaths) {
        const appShell = await staticCache.match(path);
        if (appShell) {
          swLog('✅ Serving static cached app shell');
          return appShell;
        }
      }

    } catch (cacheError) {
      console.warn('⚠️ Failed to read navigation cache:', cacheError);
    }

    // Final fallback with inline HTML - no static offline.html needed
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

    // Only check for default images, no offline.html
    return url.pathname.startsWith('/default/');
  } catch (error) {
    console.warn('⚠️ Failed to inspect static asset request:', error);
    return false;
  }
}

function isAPIRequest(request) {
  const url = request.url;
  // ❌ Exclude PDF endpoint from caching (too large, stream directly)
  if (url.includes('/api/manga/pdf')) {
    return false;
  }
  return url.includes('/api/');
}

function isMangaImage(request) {
  const url = request.url;
  return (url.includes('/manga/') && 
          url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) ||
         request.destination === 'image';
}

function isThumbnailRequest(request) {
  // ISSUES B14: trước đây so '/movie/', '/music/' trong khi URL thật là '/video/', '/audio/', và
  // isMangaImage (bắt mọi request ảnh) được kiểm tra trước nên nhánh này không bao giờ chạy.
  // Chỉ nhận thumbnail trong thư mục .thumbnail của nguồn video/audio/media — KHÔNG nhận ảnh gốc
  // của /media (có thể vài MB mỗi ảnh, không nên đưa vào cache 1000 mục).
  try {
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return false;
    const p = url.pathname;
    return /^\/(video|audio|media)\//.test(p) &&
      p.includes('/.thumbnail/') &&
      /\.(jpe?g|png|webp|avif|gif)$/i.test(p);
  } catch (error) {
    return false;
  }
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
      // Check if content has changed before updating cache
      const shouldUpdate = await checkContentChange(request, response.clone());
      if (shouldUpdate) {
        cache.put(request, response);
        swLog('🔄 Cache updated due to content change:', getResourceName(request.url));
      }
    }
  } catch (error) {
    // Silent fail for background updates
  }
}

/**
 * Check if content has changed and should invalidate cache
 * Uses ETag, Last-Modified headers, or content hashing
 */
async function checkContentChange(request, response) {
  try {
    const url = request.url;
    const lastModified = response.headers.get('last-modified');
    const etag = response.headers.get('etag');
    
    // Use ETag for precise change detection
    if (etag) {
      const lastETag = contentChangeTracker.contentHashes.get(url);
      if (lastETag && lastETag === etag) {
        return false; // No change
      }
      contentChangeTracker.contentHashes.set(url, etag);
      return true;
    }
    
    // Use Last-Modified as fallback
    if (lastModified) {
      const lastModifiedTime = new Date(lastModified).getTime();
      const cachedTime = contentChangeTracker.lastModified.get(url);
      if (cachedTime && cachedTime >= lastModifiedTime) {
        return false; // No change
      }
      contentChangeTracker.lastModified.set(url, lastModifiedTime);
      return true;
    }
    
    // For dynamic content without headers, check content hash
    if (response.headers.get('content-type')?.includes('application/json')) {
      const text = await response.text();
      const hash = await simpleHash(text);
      const lastHash = contentChangeTracker.contentHashes.get(url);
      if (lastHash && lastHash === hash) {
        return false; // No change
      }
      contentChangeTracker.contentHashes.set(url, hash);
      return true;
    }
    
    // Default: assume content changed for unknown types
    return true;
  } catch (error) {
    console.warn('⚠️ Failed to check content change:', error);
    return true; // Assume changed on error
  }
}

/**
 * Simple hash function for content change detection
 */
async function simpleHash(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

async function getFallbackImage(imageUrl = null) {
  try {
    // Use centralized cache getter
    const cache = await getCacheInstance(STATIC_CACHE);
    
    // Use provided imageUrl or default to cover
    const fallbackUrl = imageUrl || DEFAULT_IMAGES.cover;
    const fallback = await cache.match(fallbackUrl);
    
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
  swLog('🔄 Background sync:', event.tag);
  
  if (event.tag === 'retry-failed-downloads') {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  try {
    swLog('🔄 Processing background sync...');
    
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
    
    swLog('✅ Background sync completed');
  } catch (error) {
    console.error('❌ Background sync failed:', error);
  }
}

// Enhanced message handling
self.addEventListener('message', (event) => {
  const { type, data } = event.data || {};
  
  swLog('💬 SW message:', type);
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_CACHE_INFO':
      getCacheInfo()
        .then(info => {
          try {
            event.source.postMessage({
              type: 'CACHE_INFO_RESPONSE',
              data: info
            });
          } catch (postError) {
            console.error('❌ Failed to post cache info response:', postError);
          }
        })
        .catch(error => {
          console.error('❌ Failed to get cache info:', error);
          try {
            event.source.postMessage({
              type: 'CACHE_INFO_RESPONSE',
              data: { error: error.message }
            });
          } catch (postError) {
            console.error('❌ Failed to post error response:', postError);
          }
        });
      break;
      
    case 'INVALIDATE_CACHE_INFO':
      // Manual cache info invalidation
      invalidateCacheInfo();
      try {
        event.source.postMessage({
          type: 'CACHE_INFO_INVALIDATED',
          data: { success: true }
        });
      } catch (postError) {
        console.error('❌ Failed to post invalidation response:', postError);
      }
      break;
      
    case 'CLEAR_CACHE':
      clearSpecificCache(data?.cacheName)
        .then(result => {
          try {
            event.source.postMessage({
              type: 'CACHE_CLEAR_RESPONSE',
              data: { success: result, cacheName: data?.cacheName }
            });
          } catch (postError) {
            console.error('❌ Failed to post cache clear response:', postError);
          }
        })
        .catch(error => {
          console.error('❌ Failed to clear cache:', error);
          try {
            event.source.postMessage({
              type: 'CACHE_CLEAR_RESPONSE',
              data: { success: false, cacheName: data?.cacheName, error: error.message }
            });
          } catch (postError) {
            console.error('❌ Failed to post error response:', postError);
          }
        });
      break;
      
    case 'REGISTER_BACKGROUND_SYNC':
      // Register background sync when offline
      if (self.registration && self.registration.sync) {
        self.registration.sync.register('retry-failed-downloads')
          .then(() => {
            swLog('✅ Background sync registered');
          })
          .catch(error => {
            console.error('❌ Failed to register background sync:', error);
          });
      }
      break;
      
    default:
      console.warn('⚠️ Unknown message type:', type);
  }
});

// Cache management utilities
/**
 * Get cache information with performance optimization
 * 
 * ✅ FIX: Cache expensive cache inspection for 5 seconds
 * - First call: 50-200ms (enumerate all cache keys)
 * - Subsequent calls within 5s: ~1ms (return cached data)
 * 
 * @returns {Promise<Object>} Cache information
 */
async function getCacheInfo() {
  try {
    const now = Date.now();
    
    // ✅ Return cached info if fresh (within TTL)
    if (cacheInfoCache.data && (now - cacheInfoCache.timestamp) < CACHE_INFO_TTL) {
      swLog('⚡ Returning cached cache info (fast path)');
      return cacheInfoCache.data;
    }
    
    swLog('🔍 Computing fresh cache info (expensive)...');
    
    const cacheNames = await caches.keys();
    const info = {
      version: CACHE_VERSION,
      caches: {},
      totalSize: 0,
      computedAt: new Date().toISOString()
    };
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      const cacheType = getCacheType(cacheName);
      const cacheInfo = {
        count: keys.length,
        type: cacheType
      };

      // Only enumerate URLs for small caches (offline-core)
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
    
    // ✅ Store in cache for future calls
    cacheInfoCache.data = info;
    cacheInfoCache.timestamp = now;
    
    swLog('✅ Cache info computed and cached');
    return info;
  } catch (error) {
    console.error('❌ Failed to get cache info:', error);
    return { error: error.message, timestamp: new Date().toISOString() };
  }
}

/**
 * Invalidate cached cache info when content changes
 */
function invalidateCacheInfo() {
  if (cacheInfoCache.data) {
    swLog('🔄 Cache info invalidated due to content change');
    cacheInfoCache.data = null;
    cacheInfoCache.timestamp = 0;
  }
}

async function clearSpecificCache(cacheName) {
  try {
    if (!cacheName) return false;
    
    swLog('🗑️ Clearing cache:', cacheName);
    const result = await caches.delete(cacheName);
    
    if (result) {
      swLog('✅ Cache cleared:', cacheName);
      // ✅ Invalidate cache info cache after clearing
      cacheInfoCache.data = null;
      cacheInfoCache.timestamp = 0;
      // ✅ Remove from cache instances map
      cacheInstances.delete(cacheName);
    } else {
      swLog('⚠️ Cache not found:', cacheName);
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
  if (cacheName === THUMBNAIL_CACHE) return 'thumbnails';
  if (cacheName.includes('manga-') || cacheName.includes('mainws-')) return 'legacy';
  return 'unknown';
}

// Performance monitoring logic moved to main fetch handler.

swLog('🚀 Enhanced Service Worker v3.0.0 loaded');
