import { localStorageService } from './LocalStorageService.js';

const CACHE_KEY = 'external-response-cache';

/**
 * Persistent response cache for public APIs.
 *
 * The cache reduces unnecessary calls, improves perceived performance and
 * provides a clear place to add stale-while-revalidate behaviour later.
 */
class ResponseCacheService {
  get(key, maxAgeMs) {
    const cache = localStorageService.get(CACHE_KEY, {});
    const entry = cache[key];

    if (!entry || !entry.savedAt) return null;
    if (Date.now() - entry.savedAt > maxAgeMs) return null;

    return entry.value ?? null;
  }

  set(key, value) {
    const cache = localStorageService.get(CACHE_KEY, {});
    cache[key] = {
      savedAt: Date.now(),
      value,
    };
    localStorageService.set(CACHE_KEY, this.#prune(cache));
    return value;
  }

  remove(key) {
    const cache = localStorageService.get(CACHE_KEY, {});
    delete cache[key];
    localStorageService.set(CACHE_KEY, cache);
  }

  clear() {
    localStorageService.remove(CACHE_KEY);
  }

  #prune(cache) {
    const entries = Object.entries(cache)
      .sort((left, right) => right[1].savedAt - left[1].savedAt)
      .slice(0, 60);
    return Object.fromEntries(entries);
  }
}

export const responseCacheService = new ResponseCacheService();
