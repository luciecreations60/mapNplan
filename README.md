# TripFlow — V0.1.16

> Every journey starts here.

TripFlow is a responsive, bilingual travel-planning application built with
React and Vite. It currently runs without a paid backend and stores user data
locally in the browser.

## Booking comparison and affiliate preparation

Part 17 adds a safe commercial-preparation layer without pretending that a
partner agreement already exists:

- compare hotels, flights, activities, rental cars, eSIMs and insurance;
- save prices, links, notes and booking status inside each trip;
- prepare provider cards for Booking.com, Skyscanner, Google Flights,
  GetYourGuide, DiscoverCars, Airalo and Heymondo;
- keep every provider disabled until it has been reviewed in Settings;
- build provider URLs from central templates and trip variables;
- add an affiliate tracking parameter only when both its name and value exist;
- record local clicks and user-declared bookings for future analytics;
- search saved booking options from the global search palette.

No provider activation creates a commercial agreement, enrols the project in
an affiliate programme or guarantees a commission.

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
