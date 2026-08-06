# Changelog

## [0.1.26] — 2026-08-06 — RC5 / partie 27

### Added
- Recherche de lieux dans la carte avec géocodage localisé.
- URL d’image de couverture des voyages.
- Bouton explicite d’ajout de liste dans la checklist.

### Changed
- Namespace et formats internes renommés mapNplan avec migration des anciennes données TripFlow.
- Budget et dépenses de groupe affichés sur une page unique.
- Studio de contenu désactivé dans l’interface publique.
- Interface cartographique et formulaire d’ajout renforcés sur mobile.

# Changelog

## V0.1.25 RC4 — mapNplan identity

- Replaced the provisional visible brand with **mapNplan**.
- Added vector mark, horizontal logo, favicon and PWA application icon.
- Applied the approved teal, green and navy palette.
- Added Poppins with a system font fallback.
- Restyled the dashboard, navigation, buttons, cards, forms, trip heroes and dark theme.
- Preserved the legacy local-storage and IndexedDB identifiers so existing data remains available.
- Kept public indexing disabled until the definitive domain is chosen.
- Added automated brand, PWA and backward-compatibility contracts.

## 0.1.23 rc.2 — Correctifs d’usage réels

- jours du séjour générés dans l’itinéraire ;
- ajout par journée et ajout inférieur avec dernière date utilisée ;
- transports départ/arrivée/mode et durée heures/minutes ;
- estimation longue distance corrigée ;
- activité ajoutable depuis la carte ;
- météo étendue à seize jours ;
- fichiers ajoutables depuis une réservation ;
- réservation créable depuis une activité compatible ;
- décimales et tris des dépenses ;
- dates dans l’aperçu ;
- corrections globales de lisibilité et d’alignement.


## 0.1.22 rc.1 — Release Candidate

- Froze the product scope and changed the release stage to `release-candidate`.
- Added complete local trip lifecycle regression coverage.
- Added demo-data integrity, privacy and commercial-default tests.
- Added source and built-artifact release auditing.
- Added a mandatory release audit before GitHub Pages deployment.
- Added acceptance, readiness, known-limitations and rollback documentation.
- Kept trip schema 16 and public indexing disabled.

## 0.1.21 — Data resilience and performance

- Added browser-storage diagnostics and safe maintenance.
- Added orphan attachment and stale cache cleanup.
- Added optional persistent-storage requests.
- Added route-level lazy loading and vendor chunk separation.
- Hardened the offline service worker with bounded caches.
- Added production bundle budgets and performance tests.
- Kept the trip schema unchanged and public indexing disabled.

## 0.1.19 — Reliability and test gates

- Locked public indexing until branding and domain are finalized.
- Added automated tests and a mandatory GitHub Actions quality gate.
- Added strict validation for backups and shared-trip imports.
- Added local corruption quarantine and session-only diagnostics.
- Added generated-page noindex validation.

## [0.1.17] - 2026-08-01

### Added

- Local SEO content studio for destination guides.
- Live on-page SEO scoring and editorial checks.
- French and English destination-page editing.
- Local public preview route for destination guides.
- Standalone static HTML export with canonical, Open Graph and JSON-LD data.
- Sitemap and robots-file export for the future production domain.
- Versioned editorial-library JSON import and export.
- Optional commercial blocks limited to enabled partner providers.

### Changed

- Main navigation now includes the Content studio workspace.
- Application version upgraded to 0.1.17.
- Service-worker cache updated to `tripflow-v0.1.17`.

## [0.1.16] - 2026-08-01

### Added

- Per-trip booking option comparison.
- Six booking and travel-service categories.
- Central partner settings with every provider disabled by default.
- URL templates using destination, dates, travellers, currency and locale.
- Optional affiliate tracking parameter injection.
- Local click and declared-booking analytics.
- Global search results for booking options.

### Changed

- Trip schema upgraded from 15 to 16.
- Demonstration Japan trip now includes sample comparison options.
- Service-worker cache updated to `tripflow-v0.1.16`.

## [0.1.15] - 2026-08-01

### Added

- Per-trip saved-place and inspiration library.
- Custom lists, categories, priorities, tags and visit statuses.
- Direct saved-place insertion into itinerary days.
- Saved-place markers on the trip map.
- Cross-trip inspiration library in Explore.
- Global search results for saved places.
- Versioned saved-place JSON import and export.

### Changed

- Trip schema upgraded from 14 to 15.
- Demonstration Japan trip now includes example saved places.
- Service-worker cache updated to `tripflow-v0.1.15`.

## [0.1.14] - 2026-08-01

### Added

- Full-trip and selected-day ICS calendar export.
- Individual event links for Google Calendar and Outlook.
- Apple Calendar and generic ICS event downloads.
- Selective ICS import with duplicate prevention.
- Per-event reminders for activities and reservations.
- Conflict, missing-date, missing-time and out-of-range calendar checks.

### Changed

- Trip schema upgraded from 13 to 14 with calendar metadata.
- Calendar workspace now includes import, export and provider actions.
- Service-worker cache updated to `tripflow-v0.1.14`.

## [0.1.13] - 2026-07-31

### Added

- Dedicated reusable-template workspace.
- Four translated built-in trip templates.
- Personal trip-template creation with selective content.
- Reusable itinerary-day library and day insertion.
- Checklist presets for four travel styles.
- Versioned template-library JSON import and export.

### Changed

- Trip schema upgraded from 12 to 13 with template provenance fields.
- Main navigation now includes the Templates workspace.
- Service-worker cache updated to `tripflow-v0.1.13`.

## [0.1.12] - 2026-07-31

### Added

- IndexedDB-backed local document vault.
- PDF and image preview, download, rename and deletion.
- Optional document-to-reservation association.
- Attachment storage usage in Settings.
- Backup format 2 with binary attachment export and import.
- Attachment file-name support in global search.

### Changed

- Trip schema upgraded from 11 to 12.
- Document deletion and trip deletion now clean up local binary files.
- Service-worker cache updated to `tripflow-v0.1.12`.

## [0.1.11] - 2026-07-31

### Added

- Travel-day companion with daily agenda and current/next activity.
- Activity completion states.
- Quick access to reservations and documents.
- Quick paid-expense entry.
- Practical daily alerts and locally stored emergency information.

### Fixed

- Itinerary action buttons overflowing to the right in Chrome.
- Workspace tab changes returning to the large trip header.
- Edit actions scrolling to the page top instead of their form.


## [0.1.10] — 2026-07-31

### Added

- Group expense workspace with traveller-specific balances.
- Partial provider payments and expense payment progress.
- Expense payer and multi-person split selection.
- Simplified reimbursement suggestions and settlement history.
- Traveller management for financial participation.
- Search and filters for the detailed expense ledger.
- UTF-8 CSV expense export.
- Schema 10 migration for finance participants and settlements.

### Changed

- Paid totals now use `paidAmount` instead of only the legacy boolean flag.
- Budget quick-add creates finance-compatible expenses.
- Trip duplication remaps all participant references.
- Service-worker cache updated to `tripflow-v0.1.10`.

## [0.1.9] — 2026-07-31

### Added

- Dedicated route-planning workspace tab.
- Walking, cycling, driving and public-transport estimates.
- Local distance and travel-time calculations.
- Automatic nearest-neighbour activity ordering.
- Recalculated activity start times.
- Reversible optimization with saved previous order and times.
- Manual up/down itinerary ordering.
- Route map, segment list and workload alerts.
- Central routing configuration and provider-neutral service boundary.
- Schema 9 route-plan migration.

### Changed

- Itinerary normalization now preserves explicit manual order.
- Activity changes invalidate stale route calculations.
- Coordinate validation no longer treats null values as coordinates at 0,0.
- Service-worker cache updated to `tripflow-v0.1.9`.

## 0.1.7 — Sharing and local collaboration

### Added

- Read-only share links and share file export.
- Shared trip page.
- Participants and roles.
- Activity/reservation discussions.
- Collaboration audit log.
- Local notification centre.

### Changed

- Trip schema upgraded from 6 to 7.
- Service worker cache upgraded to `tripflow-v0.1.7`.

All notable changes to this project are documented here.

## [0.1.6] — 2026-07-31

### Added

- Global search across trips, activities, reservations, documents and notes.
- `Ctrl/Cmd + K` keyboard shortcut and direct navigation to matching workspace tabs.
- Trip-library search, favorite-only filter and five sort modes.
- Favorite and pinned-trip controls with persisted metadata.
- Combined monthly calendar for itinerary activities and reservations.
- Trip statistics for duration, planning density, mapped places, budget and readiness.
- Dedicated printable trip report and browser PDF export.
- Schema 6 migration for `isFavorite` and `pinnedAt`.

### Changed

- Workspace tabs now support URL query parameters for deep navigation.
- Smart trip ordering prioritizes pinned trips, then favorites, then departure date.
- Service-worker cache version updated to `tripflow-v0.1.6`.

### Fixed

- Mobile access to global search now uses a compact top-bar search button.
- Print layouts avoid application navigation and interactive controls.

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

## [0.1.18] — 2026-08-01

### Added

- build-time generation of public crawlable destination guides;
- `content/seo-pages.json` publication contract;
- guide collection page;
- automatic sitemap, robots and SEO status report;
- browser publication export workflow;
- publication audit in the SEO studio;
- Google Search Console verification configuration;
- `SEO_GUIDE.md` with testing and monitoring instructions;
- Article and BreadcrumbList structured data.

### Changed

- centralised the current GitHub Pages URL in `project.config.js`;
- updated the service-worker cache to `0.1.18`;
- removed the unused `meta keywords` tag from exported pages;
- `npm run build` now executes SEO generation and auditing first.

## 0.1.24 — RC3

- Correction des raccourcis du tableau de bord et du lien « Tout afficher ».
- Logo cliquable vers l’accueil et retour en haut lors des changements de page.
- Uniformisation des dates visibles.
- Amélioration de l’itinéraire, de l’optimisation et de la lisibilité des cartes.
- Correction et édition modale des lieux enregistrés, avec infobulles.
- Ajout d’un lieu enregistré depuis la carte.
- Recherche et édition contextuelle des réservations.
- Recherche dans les documents.
- Regroupement Budget/Dépenses de groupe.
- Statistiques déplacées en dernier.
- Listes de checklist personnalisées et modèles enrichis.
- Carte globale des voyages passés et actifs.
- Schéma de voyage 18 et 46 tests automatisés.
