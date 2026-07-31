# TripFlow — V0.1.10

> Temporary product code name — *Every journey starts here.*

TripFlow is a responsive, bilingual travel-planning web application built with
React and Vite and deployed at zero infrastructure cost through GitHub Pages.

## Available features

- dashboard and trip lifecycle;
- itinerary, calendar and route optimisation;
- OpenStreetMap map and place autocomplete;
- reservations, documents, checklist and notes;
- weather, local time and currency tools;
- budget planning and group expense splitting;
- traveller balances and reimbursements;
- search, statistics, printing and JSON backup;
- read-only sharing and local collaboration;
- French/English interface and PWA foundation.

## Part 11 highlight

Open a trip and select **Group expenses** to record who paid, split costs,
manage partial payments and calculate the smallest set of reimbursements needed
to settle the group.

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

The generated application is written to `dist/` and deployed automatically by
the GitHub Actions workflow.

## Data

All user data is currently stored in browser LocalStorage. Use **Settings →
Backup and restore** to move or protect data before clearing browser storage.
