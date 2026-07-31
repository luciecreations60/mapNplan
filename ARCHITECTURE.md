# Architecture — V0.1

## Goals

The architecture is designed to keep UI, business behaviour, persistence and configuration separate. The immediate implementation is static and free to host, while the boundaries prepare for authentication, cloud synchronisation, affiliations, mapping and artificial intelligence.

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

A component may call a hook. A hook may expose a context. A context may call a service. A component must not access browser storage or a remote provider directly.

## Key folders

- `components/`: reusable interface building blocks and feature components.
- `config/`: runtime behaviour, navigation and feature flags.
- `contexts/`: application state exposed to React.
- `hooks/`: stable access points for contexts and future reusable behaviour.
- `pages/`: route-level composition only.
- `services/`: persistence, APIs and provider integrations.
- `styles/`: tokens, global rules, layouts, components and pages.
- `utils/`: deterministic stateless helpers.

## Persistence strategy

`TripService` owns trip normalisation and CRUD rules. It delegates storage to `LocalStorageService`. A later backend adapter can implement the same responsibilities while retaining the context and page APIs.

## Routing strategy

The application uses `HashRouter` during the GitHub Pages phase. It prevents broken refreshes because GitHub Pages cannot provide SPA rewrite rules for project repositories. A migration to a custom host can replace it with browser routing at the application boundary.

## Branding strategy

The temporary brand, slogan, repository name and version are defined in `project.config.js`, which is shared by Vite and the browser application.

## Styling strategy

Design tokens are CSS custom properties. Component styles consume semantic variables such as `--color-surface` instead of hard-coded light and dark values. Theme switching therefore updates the whole interface without duplicating component CSS.

## Future adapters

Planned boundaries:

- `MapService` → OpenStreetMap / MapLibre / commercial provider.
- `WeatherService` → weather provider adapter.
- `AffiliateService` → Booking, Skyscanner and other partner links.
- `AuthService` → user authentication.
- `TripRepository` → Supabase or another backend.
- `AIService` → itinerary generation provider.
