# Architecture — V0.1.22 rc.1

## Release-candidate boundary

The business scope is frozen. Version `0.1.22` changes release validation and documentation only; the trip schema remains version 16.

`PROJECT_CONFIG.release` centrally locks:

- stage `release-candidate`;
- candidate `rc.1`;
- provisional branding;
- empty production domain;
- disabled public indexing.

## Data layers

- `TripService` owns normalized trip data and migrations in LocalStorage.
- `AttachmentStorageService` owns binary files in IndexedDB.
- `ResponseCacheService` owns bounded third-party response caches.
- `StorageHealthService` performs conservative diagnostics and cleanup.
- `DataPortabilityService` and `ImportValidationService` define the recovery boundary.

No release-candidate change modifies these persistence formats.

## Automated release gate

GitHub Actions must complete, in order:

1. project quality checks;
2. automated domain and contract tests;
3. production Vite build;
4. generated bundle-size audit;
5. release-candidate audit against source and `dist`;
6. Pages artifact upload and deployment.

`scripts/audit-release-candidate.mjs` verifies the release identity, privacy locks, acceptance documentation, demo-data coherence, absence of disabled tests and the built application shell. It emits `release-status.json` into the deployed artifact.

## Test boundaries

The automated suite covers domain services, migrations, imports, privacy, calendar interchange, finance, route restoration, browser-storage recovery, responsive/accessibility contracts, performance contracts and a complete local trip lifecycle.

Real browser rendering and file-download behaviour remain acceptance-test responsibilities because they require the deployed GitHub Pages environment.

## Compatibility

- Trip schema: 16.
- Backup format: 2.
- SEO publication schema: 2, indexing disabled.
- Service-worker cache: `tripflow-v0.1.22`.
- No data migration is required from Part 22.
