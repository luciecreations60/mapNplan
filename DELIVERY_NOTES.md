# Delivery notes — V0.1 Part 5

## Purpose

This release fixes the Chromium layout issue reported after V0.1 Part 4 and introduces the first complete localisation layer.

## Functional additions

- French and English interface.
- Automatic browser-language detection on first visit.
- Manual language selection in **Settings → Language**.
- Locally persisted language preference.
- Locale-aware dates, times, amounts, weather, categories and statuses.

## Responsive corrections

- Desktop sidebar changed from fixed positioning to a sticky CSS-grid item.
- Main content explicitly occupies the flexible grid column.
- Tablet/mobile breakpoint moved to `960px` for a reliable drawer experience.
- Drawer overlay and body-scroll locking added.
- Width constraints, `min-width: 0` protections and fluid page padding added.
- Settings, cards, forms and workspace panels hardened for small screens.

## Main new files

- `src/config/localization.config.js`
- `src/i18n/translations.js`
- `src/contexts/LocalizationContext.jsx`
- `src/hooks/useI18n.js`

## Main modified areas

- Application provider composition in `src/main.jsx`.
- Application shell and navigation components.
- All route pages and trip-workspace panels.
- Locale-sensitive utility functions.
- `src/styles/layout.css`, `global.css` and `pages.css`.
- Project, service-worker and documentation versions.

## Data impact

- No trip-schema migration.
- No automatic reset of existing trips.
- The interface language is stored under the application LocalStorage namespace.
- User-created content is never automatically translated.

## Verification performed

- 69 JavaScript/JSX files parsed by TypeScript with no syntax diagnostics.
- All relative imports resolved.
- All named/default relative imports matched exported symbols.
- 373 statically referenced translation keys found in both French and English dictionaries.
- JSON files parsed successfully.
- CSS block delimiters checked.
- Visible JSX text reviewed for untranslated application copy.
- Archive integrity and checksums regenerated after final changes.

A complete npm build could not run in the generation environment because its internal package registry does not contain the Vite React plugin version used by the project. GitHub Actions performs the actual dependency installation and production build after upload.
