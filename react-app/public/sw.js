const CACHE_NAME = 'mainws-v1';
const APP_SHELL = ['/', '/index.html', '/offline', '/manifest.webmanifest'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

async function cacheFirst(request) {
  const cacheName = request.destination === 'image' ? 'chapter-images' : CACHE_NAME;
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  if (resp.ok) {
    cache.put(request, resp.clone());
  }
  return resp;
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (request.destination === 'image' || request.destination === 'script' || request.destination === 'style') {
    event.respondWith(cacheFirst(request));
    return;
  }
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(request).then(res => res || caches.match('/index.html')))
    );
    return;
  }
});
