# Changelog

All notable changes to this project are documented here.

## [0.1.2] — 2026-07-31

### Added

- Interactive Leaflet trip map using configurable OpenStreetMap tiles.
- Numbered itinerary and reservation map points.
- Route line between geolocated itinerary activities.
- Latitude and longitude fields for itinerary activities.
- Structured reservations for flights, accommodation, transport and activities.
- Reservation status, confirmation reference, amount, links and notes.
- Travel document metadata and safe external links.
- URL protocol validation before links are rendered.
- Map, reservation and document summaries on the trip overview.
- Trip schema version 3 with automatic migration.
- Complete demonstration reservations, documents and Tokyo map data.

### Changed

- Trip workspace navigation now contains eight modules.
- Overview statistics now include bookings, mapped places and documents.
- PWA cache version updated to `0.1.2`.
- Project version updated to `0.1.2`.

## [0.1.1] — 2026-07-31

### Added

- Complete trip workspace available from every trip card.
- Overview with itinerary, budget and checklist summaries.
- Day-by-day itinerary with activity creation and deletion.
- Budget management with paid and planned expenses.
- Category-level spending breakdown.
- Preparation checklist grouped by category.
- Persistent free-form travel notes.
- Stable nested identifiers for future backend entities.
- Trip data schema versioning and legacy-data migration.
- Responsive workspace navigation for desktop and mobile.

## [0.1.0] — 2026-07-31

### Added

- Initial React and Vite application foundation.
- Central project configuration and temporary branding.
- Responsive sidebar, top bar and page layout.
- Light, dark and system themes.
- Local trip persistence through service abstractions.
- Dashboard, trip library, explore and settings pages.
- Trip creation form with validation.
- Demonstration travel data.
- PWA manifest and lightweight service worker.
- Automated GitHub Pages deployment workflow.
