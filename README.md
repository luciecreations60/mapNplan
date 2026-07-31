# TripFlow — V0.1 Local Travel Workspace

> Every journey starts here.

TripFlow is the temporary code name for a modern travel-planning application. Version `0.1.7` provides a complete local workspace with itinerary, map, reservations, budget, checklist, documents, notes and practical travel tools. The interface is responsive and available in French and English.

## Included

### Application foundation

- React 19 and Vite 8
- GitHub Pages deployment workflow
- Responsive desktop, tablet and mobile shell
- Light, dark and system themes
- French and English interface
- Browser-language detection on first visit
- Persisted manual language preference
- Centralised project and branding configuration
- PWA manifest and lightweight service worker

### Trip management

- Dashboard and searchable trip library
- Global search across trips, activities, reservations, documents and notes
- Favorites, pinned trips, advanced filters and sorting
- Trip creation, edition, duplication, archiving, restoration and deletion
- Browser persistence hidden behind repository services
- Stable, versioned trip data schema with migrations
- Dedicated workspace for each trip
- JSON backup export and import

### Planning workspace

- Trip overview and countdown
- Combined monthly calendar for activities and reservations
- Planning, budget and readiness statistics
- Printable full-trip report with browser PDF export
- Day-by-day itinerary with activity edition
- Interactive Leaflet/OpenStreetMap map
- Editable flight, accommodation, transport and activity reservations
- Paid and planned expense tracking
- Preparation checklist
- Editable document references and safe external links
- Persistent travel notes
- Destination weather, local time and currency converter

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
│   ├── i18n/
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

## Language behaviour

On the first visit, the interface follows `navigator.languages`:

- French browser language → French interface.
- Any unsupported browser language → English interface.

A manual selection in **Settings → Language** is stored locally and takes priority on later visits. User-created trip content is never translated automatically.

## Updating the GitHub repository

1. Download and extract the latest archive.
2. Open the `travel-planner` repository on GitHub.
3. Select **Add file → Upload files**.
4. Drag every item inside the extracted folder into the upload area.
5. Let GitHub replace files with identical paths.
6. Commit directly to `main`.
7. Open **Actions** and wait for the Pages deployment to complete.

Existing browser data is migrated automatically from earlier schemas to schema 7. No saved trip is reset; the migration adds collaboration, comments and sharing metadata without deleting existing content.

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

Edit `project.config.js`. Application branding and the browser title derive from this central file.

## Data storage

React components never access LocalStorage directly. They use services and contexts. A later migration to Supabase or another backend therefore does not require rewriting the workspace interface.


## V0.1.7 highlights

- Read-only sharing links with privacy controls
- Participants and local roles
- Comments on activities and reservations
- Collaboration history and local notifications
