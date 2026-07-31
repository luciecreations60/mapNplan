# Delivery notes — V0.1 Part 4

## Functional additions

- Travel tools workspace tab.
- Seven-day destination weather.
- Destination local time.
- Currency conversion between budget and destination currencies.
- Cached provider responses.
- JSON backup export and import.
- Explicit Reset demo data action and visible feedback.

## Main new files

- `src/config/external-services.config.js`
- `src/services/http/HttpService.js`
- `src/services/storage/ResponseCacheService.js`
- `src/services/weather/WeatherService.js`
- `src/services/currency/CurrencyService.js`
- `src/services/data/DataPortabilityService.js`
- `src/utils/weather.js`
- `src/utils/travelTools.js`
- `src/components/feedback/InlineNotice.jsx`
- `src/components/tripWorkspace/TravelToolsPanel.jsx`
- `src/components/tripWorkspace/tools/WeatherCard.jsx`
- `src/components/tripWorkspace/tools/LocalTimeCard.jsx`
- `src/components/tripWorkspace/tools/CurrencyConverter.jsx`

## Main modified files

- `package.json`
- `project.config.js`
- `public/service-worker.js`
- `src/config/app.config.js`
- `src/data/demoTrips.js`
- `src/services/trips/TripService.js`
- `src/contexts/TripContext.jsx`
- `src/pages/SettingsPage.jsx`
- `src/pages/TripWorkspacePage.jsx`
- `src/components/common/Icon.jsx`
- `src/components/trips/CreateTripDialog.jsx`
- `src/components/tripWorkspace/TripTabs.jsx`
- `src/styles/components.css`
- `src/styles/pages.css`

## Verification performed

- All JSON files parsed successfully.
- All relative imports resolved.
- All JavaScript and JSX files parsed individually by TypeScript without syntax diagnostics.
- CSS block delimiters checked.
- Archive contents and checksums generated.

A complete npm build could not run in the generation environment because its internal package registry does not contain the Vite React plugin version already used by the deployed project. GitHub Actions performs the actual installation and production build after upload.
