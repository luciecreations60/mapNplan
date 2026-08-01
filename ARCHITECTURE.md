# Architecture — V0.1.21

## Persistence layers

- `TripService` owns synchronous trip-domain persistence in LocalStorage.
- `AttachmentStorageService` owns binary files in IndexedDB.
- `ResponseCacheService` owns bounded public-API response caches.
- `StorageHealthService` analyses and conservatively maintains these layers.

The health service never removes valid trip data. It only removes confirmed orphan attachments, stale response-cache entries and excess recovery snapshots.

## Performance boundaries

Top-level pages are dynamically imported from `App.jsx`. Shared libraries are split into React, map and icon vendor chunks by Vite. GitHub Actions audits the generated bundle before deployment.

## Offline strategy

The service worker uses:

- network-first for navigation;
- the cached application shell as an offline fallback;
- cache-first for same-origin versioned static assets;
- a strict maximum of 80 runtime asset entries;
- no caching of third-party API responses.

## Compatibility

Trip schema remains version 16. No data migration is required for this release.
