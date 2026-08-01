# TripFlow — V0.1.14

> Every journey starts here.

TripFlow is a responsive, bilingual travel-planning application built with
React and Vite. It includes trip planning, maps, reservations, budgets, group
expenses, travel-day assistance, sharing, route optimization, a private local
document vault, reusable planning templates and calendar interoperability.

## Calendar interoperability

The **Calendar** workspace can:

- export the complete trip or one selected day as an ICS file;
- add an individual event to Google Calendar or Outlook;
- download an event for Apple Calendar and other ICS-compatible apps;
- import events from an ICS file after a review step;
- store reminders on activities and reservations;
- detect scheduling conflicts and incomplete calendar data.

The feature remains local and requires no paid account or server.

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
