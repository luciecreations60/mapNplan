# TripFlow — V0.1.15

> Every journey starts here.

TripFlow is a responsive, bilingual travel-planning application built with
React and Vite. It currently runs without a paid backend and stores user data
locally in the browser.

## Saved places and inspiration

Part 16 introduces a planning layer between discovering a place and assigning
it to a specific day:

- save real places from the Photon/OpenStreetMap search;
- organise ideas into reusable custom lists;
- classify places by category, priority and planning status;
- add a saved place to the itinerary with its coordinates;
- display saved places on the trip map;
- search them from the global search palette;
- import and export a trip's saved-place library as JSON;
- browse every trip's saved places from the Explore page.

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
