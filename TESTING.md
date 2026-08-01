# Testing — V0.1.21

## Automated commands

```bash
npm run quality
npm run test
npm run build
npm run performance:audit
```

## New tests

- orphaned attachment detection;
- content-neutral data-volume summaries;
- LocalStorage namespace sizing;
- recovery-snapshot pruning;
- route-level lazy loading contract;
- bounded same-origin service-worker cache;
- production bundle-budget configuration.

## Manual storage test

1. Open **Settings**.
2. Find **Data health and maintenance** / **Santé et entretien des données**.
3. Run the storage check.
4. Confirm that the status is healthy or lists orphan files.
5. Run safe cleanup.
6. Confirm that trips and valid documents remain available.
7. Export a JSON backup before testing a browser-storage reset.

## Manual offline test

1. Open the deployed application once while online.
2. Open browser developer tools and enable Offline mode.
3. Reload the application.
4. Confirm that the application shell and locally stored trip data remain readable.
