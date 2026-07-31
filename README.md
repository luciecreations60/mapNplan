# TripFlow — V0.1.2 Travel Workspace

> Every journey starts here.

TripFlow is the temporary code name for a modern travel-planning application. Version `0.1.2` extends the usable planner with reservations, document references and an interactive trip map while preserving the service boundaries required for future accounts, synchronisation and affiliation.

## Included

### Application foundation

- React and Vite
- Automated GitHub Pages deployment
- Responsive desktop, tablet and mobile shell
- Light, dark and system themes
- Centralised branding and runtime configuration
- PWA manifest and lightweight service worker

### Trip workspace

- Overview dashboard
- Day-by-day itinerary
- Activity creation and deletion
- Optional coordinates for each activity
- Interactive Leaflet map with OpenStreetMap tiles
- Itinerary route line and numbered map points
- Structured flight, accommodation, transport and activity reservations
- Reservation statuses, references, links and map coordinates
- Budget tracking and spending categories
- Preparation checklist
- Travel document references and secure HTTP(S) links
- Persistent notes

### Data architecture

- LocalStorage hidden behind repository services
- Stable identifiers for nested entities
- Trip schema version `3`
- Automatic migration from V0.1 Parts 1 and 2
- Central URL and coordinate validation

## Repository structure

```text
travel-planner/
├── .github/workflows/deploy.yml
├── public/
├── src/
│   ├── components/
│   │   ├── common/
│   │   ├── dashboard/
│   │   ├── navigation/
│   │   ├── trips/
│   │   └── tripWorkspace/
│   ├── config/
│   ├── contexts/
│   ├── data/
│   ├── hooks/
│   ├── layouts/
│   ├── pages/
│   ├── services/
│   ├── styles/
│   └── utils/
├── ARCHITECTURE.md
├── CHANGELOG.md
├── DELIVERY_NOTES.md
├── ROADMAP.md
├── index.html
├── package.json
├── project.config.js
└── vite.config.js
```

## Uploading to GitHub

1. Download and unzip this delivery.
2. Open the `travel-planner` repository on GitHub.
3. Select **Add file → Upload files**.
4. Drag every item inside the unzipped folder into the upload area.
5. Let GitHub replace files with identical paths.
6. Commit directly to `main` with:

```text
feat: add v0.1.2 maps reservations and documents
```

7. Open **Actions** and wait for the Pages deployment to complete.

Existing browser data is migrated automatically. Use **Settings → Reset demo data** only when you want to load the complete new demonstration data.

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

## Changing the temporary brand

Edit `project.config.js`. The name, slogan, repository base path and displayed version are centralised there.

## Current document-storage limitation

The static zero-budget version stores document metadata and safe external links only. It does not persist binary files in LocalStorage. Actual PDF and image storage will be added with authenticated cloud accounts.
