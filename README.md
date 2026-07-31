# TripFlow — V0.1.12

> Every journey starts here.

TripFlow is a responsive, bilingual travel-planning application built with
React and Vite. The current release includes trip planning, maps, reservations,
budgets, group expenses, travel-day assistance, sharing, route optimization and
a private local document vault.

## Local document vault

Travel documents may contain local PDF, image, text, Word or spreadsheet files.
Metadata remains in the trip model while binary content is stored in IndexedDB,
preventing LocalStorage quota problems.

Files can be previewed, downloaded, renamed, deleted and included in portable
JSON backups. They are never added to read-only public share links.

## Run locally

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

GitHub Actions deploys the generated `dist` directory to GitHub Pages.
