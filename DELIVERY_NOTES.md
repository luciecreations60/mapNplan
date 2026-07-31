# Delivery notes — V0.1 Part 3

## Functional additions

- Interactive map tab.
- Coordinates on itinerary activities.
- Reservation management.
- Document-reference management.
- Enriched trip overview.

## Main new files

- `src/config/map.config.js`
- `src/utils/map.js`
- `src/utils/url.js`
- `src/components/tripWorkspace/TripMap.jsx`
- `src/components/tripWorkspace/MapPanel.jsx`
- `src/components/tripWorkspace/ReservationsPanel.jsx`
- `src/components/tripWorkspace/DocumentsPanel.jsx`

## Main modified files

- `package.json`
- `project.config.js`
- `public/service-worker.js`
- `src/data/demoTrips.js`
- `src/services/trips/TripService.js`
- `src/pages/TripWorkspacePage.jsx`
- `src/components/tripWorkspace/TripTabs.jsx`
- `src/components/tripWorkspace/ItineraryPanel.jsx`
- `src/components/tripWorkspace/OverviewPanel.jsx`
- `src/components/common/Icon.jsx`
- `src/styles/pages.css`

## Verification performed

- JSON files parsed successfully.
- All relative imports resolved.
- All JavaScript and JSX files parsed with the TypeScript parser.
- No syntax diagnostics found.

A complete npm build could not run in the generation environment because its internal package registry did not contain the Vite React plugin already used by the project. GitHub Actions performs the real installation and production build after upload.
