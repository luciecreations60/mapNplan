# Architecture — V0.1.3

## Goals

The architecture separates interface composition, domain behaviour, persistence and external providers. The current implementation remains static and free to host while preparing for authentication, cloud synchronisation, secure files, affiliations and artificial intelligence.

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
- `config/`: branding, feature flags, navigation and provider settings.
- `contexts/`: React state backed by domain services.
- `hooks/`: stable component-facing APIs.
- `pages/`: route-level composition only.
- `services/`: persistence, data portability and provider adapters.
- `styles/`: tokens, global rules, layouts and feature styling.
- `utils/`: deterministic validation, formatting and aggregation helpers.

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

The current schema version is `4`.

- Schema 1: trip summary fields.
- Schema 2: itinerary, expenses, checklist and notes.
- Schema 3: reservations, documents and coordinates.
- Schema 4: destination currency and travel-tool defaults.

Existing trips are normalised non-destructively. Demonstration properties are added only when the property did not previously exist.

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

`HttpService` centralises timeout and JSON error handling. Provider services translate raw responses into application-owned models. `ResponseCacheService` stores short-lived results under the application LocalStorage namespace.

Provider URLs and limits live in `external-services.config.js`. Replacing Open-Meteo or Frankfurter does not require changes to workspace components.

## Location selection

`getPrimaryTripLocation()` currently selects the first itinerary map point, then falls back to a mapped reservation. This rule is isolated so a future dedicated destination entity or place-search provider can replace it without changing travel-tool components.

## Data portability

`DataPortabilityService` creates a versioned JSON envelope:

```text
Backup
├── format
├── version
├── exportedAt
└── trips[]
```

Imported trips are validated, then passed through `TripService.replaceAll()` so current normalisation and schema rules are always applied.

## Map integration

`TripMap` is the only component coupled to Leaflet. It receives provider-neutral map points from `getTripMapPoints()` and knows nothing about persistence or editing.

## Security boundaries

- External document and reservation links accept only HTTP and HTTPS.
- Imported backups are size-limited, parsed as JSON and normalised before storage.
- No API secret is committed to the browser bundle.
- Binary document uploads remain deferred until authentication and secure object storage exist.

## Routing

`HashRouter` remains in use for GitHub Pages because the host does not provide project-level SPA rewrite rules. A custom host can later replace it at the application boundary.
