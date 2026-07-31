# Architecture — V0.1.4

## Goals

The architecture separates interface composition, domain behaviour, persistence, localisation and external providers. The current implementation remains static and free to host while preparing for authentication, cloud synchronisation, secure files, affiliations and artificial intelligence.

## Dependency direction

```text
Pages and components
        ↓
Contexts and hooks
        ↓
Domain / provider services
        ↓
Storage and remote HTTP adapters
```

Components do not access LocalStorage or provider endpoints directly.

## Main boundaries

- `components/`: reusable interface and feature components.
- `config/`: branding, features, navigation, languages and provider settings.
- `contexts/`: React state backed by application services.
- `hooks/`: stable component-facing APIs.
- `i18n/`: central interface translations.
- `pages/`: route-level composition only.
- `services/`: persistence, data portability and provider adapters.
- `styles/`: tokens, global rules, layouts and feature styling.
- `utils/`: deterministic validation, formatting and aggregation helpers.

## Responsive application shell

Desktop layout:

```text
.app-shell (CSS grid)
├── Sidebar (sticky grid item)
└── Main column
    ├── Top bar (sticky)
    └── Fluid page container
```

The desktop sidebar participates in the grid and is no longer `position: fixed`. This prevents Chromium from placing the main content in the sidebar column. At `960px` and below, the shell becomes a single-column layout and the sidebar becomes an off-canvas drawer with an overlay.

All grid and flex children use `min-width: 0` where required, preventing long content from forcing horizontal overflow. Page padding and card grids use fluid breakpoints for desktop, tablet and mobile widths.

## Localisation boundary

```text
LocalizationProvider
├── browser-language resolver
├── persisted language preference
├── translation dictionary
└── locale-aware formatters
```

- `localization.config.js` owns supported language metadata.
- `translations.js` owns application copy only.
- `LocalizationContext.jsx` exposes `language`, `locale`, `setLanguage()` and `t()`.
- `useI18n()` is the component-facing API.
- The first visit follows `navigator.languages`.
- A manual setting is persisted through `LocalStorageService`.
- Unsupported browser languages fall back to English.
- User-created content remains unchanged.

Adding a language requires one configuration entry and a complete translation branch; pages and components do not require structural changes.

## Trip aggregate

```text
Trip
├── itinerary[]
│   └── day.items[]
│       ├── latitude
│       └── longitude
├── expenses[]
├── checklist[]
├── reservations[]
├── documents[]
├── currency
├── destinationCurrency
└── notes
```

Every nested record owns a stable identifier. `TripService` normalises the complete aggregate, calculates derived totals and stores a `schemaVersion`.

## Schema migration

The current trip schema version remains `4`.

- Schema 1: trip summary fields.
- Schema 2: itinerary, expenses, checklist and notes.
- Schema 3: reservations, documents and coordinates.
- Schema 4: destination currency and travel-tool defaults.

V0.1.4 changes interface preferences and layout only; trip records are not rewritten.

## External provider boundary

```text
TravelToolsPanel
├── WeatherService
│   ├── HttpService
│   └── ResponseCacheService
└── CurrencyService
    ├── HttpService
    └── ResponseCacheService
```

Provider URLs and limits live in `external-services.config.js`. Replacing Open-Meteo or Frankfurter does not require changes to workspace components.

## Data portability

`DataPortabilityService` creates and validates a versioned JSON envelope before replacing locally stored trips through `TripService`.

## Map integration

`TripMap` is the only component coupled to Leaflet. It receives provider-neutral points from `getTripMapPoints()` and knows nothing about persistence or editing.

## Security boundaries

- External document and reservation links accept only HTTP and HTTPS.
- Imported backups are size-limited, parsed as JSON and normalised before storage.
- No API secret is committed to the browser bundle.
- Binary document uploads remain deferred until authentication and secure object storage exist.

## Routing

`HashRouter` remains in use for GitHub Pages because the host does not provide project-level SPA rewrite rules. A custom host can later replace it at the application boundary.
