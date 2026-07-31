# Architecture — V0.1.2

## Goals

The architecture separates interface composition, domain behaviour, persistence and external providers. The current implementation remains static and free to host while preparing for authentication, cloud synchronisation, secure file storage, affiliations and artificial intelligence.

## Dependency direction

```text
Pages and components
        ↓
Contexts and hooks
        ↓
Domain services
        ↓
Storage / future API adapters
```

Components must not access LocalStorage or external APIs directly.

## Main boundaries

- `components/`: reusable interface and feature components.
- `config/`: branding, feature flags, navigation and provider settings.
- `contexts/`: React state backed by domain services.
- `hooks/`: stable component-facing APIs.
- `pages/`: route-level composition only.
- `services/`: persistence and future provider integrations.
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
└── notes
```

Every nested record owns a stable identifier. `TripService` normalises the complete aggregate, calculates derived totals and stores a `schemaVersion`.

## Schema migration

The current schema version is `3`.

- Schema 1: trip summary fields.
- Schema 2: itinerary, expenses, checklist and notes.
- Schema 3: reservations, documents and coordinates.

Existing trips are normalised non-destructively. Demonstration collections are added only when the property did not previously exist.

## Map integration

`TripMap` is the only component coupled to Leaflet. It receives provider-neutral map points from `getTripMapPoints()` and knows nothing about LocalStorage or trip editing.

`map.config.js` centralises:

- default centre and zoom;
- tile URL;
- attribution;
- provider limits.

A future move to MapLibre or a commercial tile service is therefore isolated to the adapter and configuration layer.

## Reservation and document security

External links are passed through `normalizeExternalUrl()`. Only HTTP and HTTPS protocols are exposed in clickable links.

The current document module stores metadata and links, not binary files. Secure uploads require authentication, access policies and cloud object storage and are intentionally deferred.

## Routing

`HashRouter` remains in use for GitHub Pages because the host does not provide project-level SPA rewrite rules. A custom host can later replace it at the application boundary.

## Future adapters

- `PlaceSearchService` → geocoding and place discovery.
- `RouteService` → travel-time and route calculations.
- `WeatherService` → forecast provider.
- `AffiliateService` → Booking, Skyscanner and activity partners.
- `AuthService` → authentication.
- `TripRepository` → cloud data.
- `DocumentStorageService` → secure binary files.
- `AIService` → itinerary assistance.
