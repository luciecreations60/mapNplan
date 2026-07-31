# Changelog

All notable changes to this project are documented here.

## [0.1.3] — 2026-07-31

### Added

- Travel tools tab in every trip workspace.
- Seven-day weather forecast using a dedicated provider adapter.
- Destination local time resolved from the weather time zone.
- Reference currency converter with configurable trip and destination currencies.
- Shared HTTP timeout and error handling service.
- Persistent response cache for public provider calls.
- JSON backup export and validated import.
- Destination currency field for new and existing trips.
- Visible success and error feedback in Settings.

### Changed

- Trip schema updated to version 4 with non-destructive migration.
- Settings data action renamed explicitly to **Reset demo data**.
- Settings now separates appearance, configuration, backups and destructive actions.
- Project and service-worker versions updated to `0.1.3`.

## [0.1.2] — 2026-07-31

### Added

- Leaflet map tab with OpenStreetMap tiles.
- Coordinates on itinerary activities and reservations.
- Reservation management for flights, accommodation, transport and activities.
- Document-reference management with safe external links.
- Schema version 3 and enriched trip overview.

## [0.1.1] — 2026-07-31

### Added

- Complete trip workspace available from every trip card.
- Overview with itinerary, budget and checklist summaries.
- Day-by-day itinerary with activity creation and deletion.
- Budget management with paid and planned expenses.
- Preparation checklist and persistent notes.
- Schema version 2 migration.

## [0.1.0] — 2026-07-31

### Added

- Initial React and Vite application foundation.
- Responsive navigation and themes.
- Local trip persistence through service abstractions.
- Dashboard, trip library, explore and settings pages.
- GitHub Pages workflow and PWA foundation.
