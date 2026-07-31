# Changelog

All notable changes to this project are documented here.

## [0.1.5] — 2026-07-31

### Added

- Shared trip form for creation and edition.
- Complete trip edition from the library and workspace hero.
- Activity, reservation and document edition workflows.
- Trip duplication with regenerated nested identifiers.
- Reversible archive and restore lifecycle.
- Archived-trip filter and status.
- Reusable confirmation dialog and bilingual action feedback.
- Schema 5 migration with the `archivedAt` field.

### Changed

- Trip cards now expose contextual management actions.
- Demonstration and imported data are normalised to schema 5.
- Dashboard statistics ignore archived trips.
- Dependency versions aligned with published stable npm releases.
- Service-worker cache version updated to `tripflow-v0.1.5`.

### Fixed

- Creation and edition fields can no longer drift because both use the same form component.
- Editing an activity can safely move it between itinerary days without leaving empty days.
- Duplicate trips no longer reuse nested record identifiers.

## [0.1.4] — 2026-07-31

### Added

- French and English interface translation system.
- Automatic browser-language detection on first visit.
- Manual language selector in Settings.
- Persisted language preference per browser.
- Locale-aware dates, times, currencies, weather labels, categories and statuses.
- Localised accessibility labels and system messages.

### Fixed

- Chromium desktop layout displaying content inside the sidebar column.
- Sidebar positioning by replacing the desktop fixed element with a sticky grid item.
- Main-content width and overflow issues on narrow and medium screens.
- Responsive sidebar behaviour on tablet and mobile.
- Card, form, settings and workspace layouts at small breakpoints.

### Changed

- Desktop sidebar now scrolls independently while remaining in document layout.
- Tablet and mobile navigation now use an off-canvas drawer at `960px` and below.
- Service-worker cache version updated to force refreshed application assets.
- Project version updated to `0.1.4`.

## [0.1.3] — 2026-07-31

### Added

- Destination weather and seven-day forecast.
- Destination local time.
- Reference currency converter.
- External-response cache.
- JSON backup export and validated import.
- Explicit demonstration-data reset action.

## [0.1.2] — 2026-07-31

### Added

- Interactive Leaflet/OpenStreetMap trip map.
- Geographical coordinates on activities and reservations.
- Reservation management.
- Document references and safe external links.
- Schema 3 migration.

## [0.1.1] — 2026-07-31

### Added

- Complete trip workspace.
- Overview, itinerary, budget, checklist and notes.
- Stable nested identifiers and schema migration.

## [0.1.0] — 2026-07-31

### Added

- Initial React and Vite application foundation.
- Dashboard, trip library, explore and settings pages.
- Themes, local persistence, PWA foundation and GitHub Pages deployment.
