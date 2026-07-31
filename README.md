# TripFlow — V0.1.9

> Every journey starts here.

TripFlow is a responsive travel-planning web application built with React and Vite. The current version runs entirely in the browser, stores trips locally and deploys for free through GitHub Pages.

## Current capabilities

- Dashboard and trip library
- Trip creation, editing, duplication, archive and favorites
- Day-by-day itinerary with mapped locations
- Local route optimization with transport-mode estimates
- Calendar, map, reservations, budget, checklist, notes and documents
- Weather, local time and currency conversion
- Global search and printable/PDF travel report
- Read-only sharing snapshots and local collaboration metadata
- French and English interface with browser-language detection
- JSON backup and restore
- PWA foundation and automated GitHub Pages deployment

## Development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Repository structure

```text
src/
├── components/       Reusable UI and feature components
├── config/           Central application and provider configuration
├── contexts/         React application state boundaries
├── data/             Demonstration data
├── hooks/            Component-facing APIs
├── i18n/             French and English interface copy
├── layouts/          Application shell
├── pages/            Route-level composition
├── services/         Persistence and provider adapters
├── styles/           Design tokens, layouts and feature styles
└── utils/            Pure domain and formatting helpers
```

## Data and privacy

V0.1 stores data in the browser through LocalStorage. No account or backend is required. Clearing browser storage removes local trips unless a JSON backup has been exported.

## Deployment

The workflow in `.github/workflows/deploy.yml` builds and publishes the application to GitHub Pages after every push to `main`.

## Project status

This is a product-development foundation. The temporary brand name can be replaced centrally through `project.config.js` when the final commercial name is selected.
