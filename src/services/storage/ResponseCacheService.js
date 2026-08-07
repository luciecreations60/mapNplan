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


  cleanup(maxAgeMs = 7 * 24 * 60 * 60 * 1000) {
    const cache = localStorageService.get(CACHE_KEY, {});
    const cutoff = Date.now() - Math.max(0, Number(maxAgeMs) || 0);
    const freshEntries = Object.entries(cache)
      .filter(([, entry]) => Number(entry?.savedAt) >= cutoff);
    const removedCount = Math.max(0, Object.keys(cache).length - freshEntries.length);
    if (freshEntries.length > 0) localStorageService.set(CACHE_KEY, Object.fromEntries(freshEntries));
    else localStorageService.remove(CACHE_KEY);
    return removedCount;
  }

  getSummary() {
    const cache = localStorageService.get(CACHE_KEY, {});
    const savedAtValues = Object.values(cache)
      .map((entry) => Number(entry?.savedAt) || 0)
      .filter(Boolean);
    return {
      entryCount: Object.keys(cache).length,
      oldestSavedAt: savedAtValues.length ? Math.min(...savedAtValues) : null,
      newestSavedAt: savedAtValues.length ? Math.max(...savedAtValues) : null,
    };
  }

  #prune(cache) {
    const entries = Object.entries(cache)
      .sort((left, right) => right[1].savedAt - left[1].savedAt)
      .slice(0, 60);
    return Object.fromEntries(entries);
  }
}

export const responseCacheService = new ResponseCacheService();
