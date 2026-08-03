/**
 * Resilient offline service worker.
 *
 * Navigation uses network-first with the application shell as fallback.
 * Versioned assets use cache-first. External API responses are deliberately
 * excluded because the application already owns a bounded data cache.
 */
const CACHE_VERSION = 'tripflow-v0.1.24';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const ASSET_CACHE = `${CACHE_VERSION}-assets`;
const MAX_ASSET_ENTRIES = 80;

function scopeUrl(path = '') {
  return new URL(path, self.registration.scope).toString();
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.add(scopeUrl('')))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => !key.startsWith(CACHE_VERSION))
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'CLEAR_RUNTIME_CACHES') {
    event.waitUntil(caches.delete(ASSET_CACHE));
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (['script', 'style', 'font', 'image'].includes(request.destination)) {
    event.respondWith(cacheFirstAsset(request));
  }
});

async function networkFirstNavigation(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(scopeUrl(''), response.clone());
    return response;
  } catch {
    return (await cache.match(scopeUrl('')))
      || new Response('The travel planner is temporarily unavailable offline.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
  }
}

async function cacheFirstAsset(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
    await trimCache(cache, MAX_ASSET_ENTRIES);
  }
  return response;
}

async function trimCache(cache, maximumEntries) {
  const keys = await cache.keys();
  if (keys.length <= maximumEntries) return;
  await Promise.all(keys.slice(0, keys.length - maximumEntries).map((key) => cache.delete(key)));
}
