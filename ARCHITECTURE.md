# Architecture — V0.1.9

## Goals

TripFlow separates interface composition, domain behaviour, persistence, localization and external providers. The current application remains static and free to host while preparing for accounts, cloud synchronization, commercial providers, affiliations and artificial intelligence.

## Dependency direction

```text
Pages and components
        ↓
Contexts and hooks
        ↓
Domain / provider services
        ↓
Storage, HTTP and future backend adapters
```

React components never access LocalStorage or remote provider endpoints directly.

## Main boundaries

- `components/`: reusable interface and feature components.
- `config/`: branding, features, languages and provider parameters.
- `contexts/`: React state backed by application services.
- `hooks/`: stable component-facing APIs.
- `i18n/`: central interface translations.
- `pages/`: route-level composition.
- `services/`: persistence, data portability and provider adapters.
- `styles/`: tokens, global rules, layouts and feature styling.
- `utils/`: deterministic validation, routing, formatting and aggregation helpers.

## Trip aggregate

```text
Trip
├── itinerary[]
│   ├── day.routePlan
│   └── day.items[]
│       ├── latitude / longitude
│       ├── durationMinutes
│       └── comments[]
├── expenses[]
├── checklist[]
├── reservations[]
├── documents[]
├── collaboration
├── destination coordinates
├── currencies
└── lifecycle metadata
```

Every nested record owns a stable identifier. `TripService` normalizes the complete aggregate and stores a `schemaVersion`.

## Route-planning boundary

```text
RouteOptimizerPanel
        ↓
RoutePlanningService
        ↓
Local route-estimation engine
```

`RoutePlanningService` exposes a stable contract:

- `analyse(day, mode)`
- `optimize(day, options)`
- `restore(day)`
- `move(day, activityId, direction)`
- `getMapPoints(day)`

The current engine uses the Haversine distance, configurable distance multipliers and average speeds. This keeps V0.1 free and deterministic. A future routing provider such as OSRM, GraphHopper or Mapbox can replace the service implementation without rewriting the workspace.

Configuration lives in `src/config/routing.config.js`. UI components contain no provider URL, speed or warning threshold.

## Route-plan persistence

Each itinerary day contains:

```text
routePlan
├── mode
├── startStrategy
├── startTime
├── optimizedAt
├── previousOrder[]
├── previousTimes{}
├── manuallyOrderedAt
├── estimatedDistanceKm
└── estimatedTravelMinutes
```

Before optimization, the current activity order and times are saved. Undo restores those values. Editing, deleting or manually moving an activity invalidates stale route estimates.

## Schema migration

Current trip schema: `9`.

1. Summary fields
2. Itinerary, expenses, checklist and notes
3. Reservations, documents and coordinates
4. Destination currency and travel tools
5. Archive lifecycle
6. Favorites and pinned trips
7. Collaboration, comments and privacy-aware sharing
8. Explicit destination coordinates
9. Route planning, reversible optimization and manual ordering

Migration is non-destructive. Existing activity order is preserved.

## Responsive architecture

Desktop uses a grid shell with a sticky sidebar. Tablet and mobile use a single-column layout with an off-canvas navigation drawer. Route controls collapse from five columns to two and then one; map and segment panels stack below 960 px.

## Localization

Interface copy is stored in `src/i18n/translations.js`. French and English share identical keys. User-created content is never translated automatically.
