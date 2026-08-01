# V0.1 — Part 22 delivery notes

## Purpose

This release improves resilience and performance without changing the trip schema or adding a new business feature.

## Changes

- Added route-level React lazy loading and a small accessible loading fallback.
- Added a browser-storage health service.
- Added safe cleanup for orphaned attachments, stale response cache entries and old recovery snapshots.
- Added optional persistent-storage requests where supported by the browser.
- Added storage volume summaries without exposing private content.
- Added a bounded same-origin service-worker cache and offline application-shell fallback.
- Added Vite vendor chunks and a production bundle-size audit.
- Added tests for storage maintenance and performance contracts.
- Kept public indexing disabled.

## Data compatibility

- Trip schema remains version 16.
- Existing trips and attachments are preserved.
- Cleanup only removes files whose trip/document parent no longer exists, old cache entries and excess recovery snapshots.
