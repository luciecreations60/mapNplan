# TripFlow — V0.1.13

> Every journey starts here.

TripFlow is a responsive, bilingual travel-planning application built with
React and Vite. It currently includes trip planning, maps, reservations,
budgets, group expenses, travel-day assistance, sharing, route optimization,
a private local document vault and reusable planning templates.

## Reusable templates

The **Templates** workspace provides:

- four built-in trip structures;
- personal trip templates created from existing journeys;
- reusable itinerary-day templates;
- checklist presets for city, road, beach and business travel;
- JSON import and export for personal template libraries.

Private reservations, confirmation numbers, comments and binary attachments are
never copied into personal templates.

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
