# Travel Planner — V0.1.3

> Temporary product code name: **TripFlow** — Every journey starts here.

This repository contains a zero-budget, static-first travel-planning application built with React and Vite. V0.1.3 adds live travel utilities and local data portability while preserving the service boundaries needed for a future backend, user accounts and affiliate providers.

## Included

### Application foundation

- React 19 and Vite 8
- GitHub Pages deployment workflow
- Responsive desktop, tablet and mobile shell
- Light, dark and system themes
- Centralised project and feature configuration
- PWA manifest and lightweight service worker

### Travel workspace

- Dashboard and trip library
- Trip creation and deletion
- Overview, itinerary, map, reservations, budget, checklist, documents and notes
- Leaflet and OpenStreetMap integration
- Versioned LocalStorage schema with automatic migrations

### V0.1.3 travel companion

- Seven-day destination weather forecast
- Destination local time
- Reference currency converter
- Response caching for external services
- JSON backup export and import
- Clearly labelled **Reset demo data** action
- Visible success and error feedback

## Repository structure

```text
travel-planner/
├── .github/workflows/deploy.yml
├── public/
├── src/
│   ├── components/
│   ├── config/
│   ├── contexts/
│   ├── data/
│   ├── hooks/
│   ├── layouts/
│   ├── pages/
│   ├── services/
│   │   ├── currency/
│   │   ├── data/
│   │   ├── http/
│   │   ├── pwa/
│   │   ├── storage/
│   │   ├── trips/
│   │   └── weather/
│   ├── styles/
│   └── utils/
├── ARCHITECTURE.md
├── CHANGELOG.md
├── ROADMAP.md
├── index.html
├── package.json
├── project.config.js
└── vite.config.js
```

## Using the travel tools

Open a trip containing at least one itinerary activity or reservation with valid latitude and longitude. Select **Travel tools** in the trip workspace.

The first mapped itinerary location is used for weather and local time. The exchange converter defaults to the trip budget currency and destination currency.

## Resetting the demonstration data

Open **Settings**, scroll to the final card named **Reset demo data**, then select the red **Reset demo data** button.

## Updating GitHub

See `UPLOAD_TO_GITHUB.md` for the exact steps. The recommended commit message is:

```text
feat: add v0.1.3 travel tools and backups
```

## Local development

```bash
npm install
npm run dev
```

Production verification:

```bash
npm run build
npm run preview
```

## Temporary branding

Edit `project.config.js` when the final commercial name is selected. Application branding and the browser title derive from this central file.

## External services

Provider URLs, timeouts and cache durations are centralised in `src/config/external-services.config.js`.

- Weather: Open-Meteo
- Exchange rates: Frankfurter

The public APIs are suitable for development without embedding credentials. Provider terms and commercial usage requirements must be reviewed again before monetised production launch.
