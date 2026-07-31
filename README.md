# TripFlow — V0.1 Planning Foundation

> Every journey starts here.

TripFlow is the temporary code name for a modern travel-planning application. Version `0.1.1` turns the initial visual foundation into a usable planner while preserving the service boundaries required for future maps, accounts, collaboration and affiliation.

## Included

### Application foundation

- React 19 and Vite 8
- GitHub Pages deployment workflow
- Responsive application shell
- Light, dark and system themes
- Centralised project and branding configuration
- PWA manifest and lightweight service worker

### Trip management

- Dashboard and trip library
- Trip creation and deletion
- Browser persistence hidden behind a repository service
- Stable trip data schema with legacy-data migration
- Dedicated route for each travel workspace

### Planning workspace

- Overview dashboard
- Day-by-day itinerary
- Activity creation and deletion
- Paid and planned expense tracking
- Spending totals by category
- Preparation checklist grouped by category
- Persistent travel notes

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
├── ROADMAP.md
├── index.html
├── package.json
├── project.config.js
└── vite.config.js
```

## Updating the GitHub repository

1. Download and unzip the latest delivery.
2. Open the `travel-planner` repository on GitHub.
3. Select **Add file → Upload files**.
4. Drag every item inside the unzipped folder into the upload area.
5. Let GitHub replace files with identical paths.
6. Use the commit message: `feat: add v0.1 trip workspace`.
7. Commit directly to `main`.
8. Open **Actions** and wait for the Pages deployment to complete.

Browser data from Part 1 is migrated automatically. The original sample trips receive the richer demonstration data only when those new collections have never been edited.

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

## Changing the temporary name

Edit only `project.config.js`. Application branding and the browser title derive from this central file.

## Data storage

React components never access LocalStorage directly. They use `TripService`, which depends on `LocalStorageService`. Detailed itinerary, budget, checklist and note data are normalised inside the service. A later migration to Supabase or another backend therefore does not require rewriting the workspace components.
