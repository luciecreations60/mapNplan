/**
 * Lightweight service worker foundation.
 * Uses a network-first strategy for pages and a cache-first strategy for
 * static assets. Increase CACHE_VERSION after changing the caching strategy.
 */
const CACHE_VERSION = 'tripflow-v0.1.14';
const STATIC_CACHE = `${CACHE_VERSION}-static`;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(CACHE_VERSION))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(request)),
    );
    return;
  }

  event.respondWith(
    caches.open(STATIC_CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;

      try {
        const response = await fetch(request);
        if (response.ok && new URL(request.url).origin === self.location.origin) {
          cache.put(request, response.clone());
        }
        return response;
      } catch (error) {
        return cached || Response.error();
      }
    }),
  );
});
