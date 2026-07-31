# V0.1 — Part 12 delivery notes

## Release

- Application version: `0.1.11`
- Data schema: `11`
- Delivery date: `2026-07-31`

## Purpose

Part 12 corrects two cross-browser workspace issues and introduces the first
travel-day companion. The workspace now keeps the horizontal tab bar as the
navigation reference when changing sections, while activity actions remain
inside their cards on Chrome, Safari, tablets and phones.

## Cross-browser corrections

- Chrome-safe activity action layout with flexible wrapping.
- No action button can overflow to the right of an itinerary card.
- Tab changes scroll to the horizontal workspace navigation instead of the
  large trip header.
- Editing an activity, reservation or document scrolls directly to its form.
- Sticky tabs preserve their active item in the visible horizontal area.

## Travel-day companion

The new **Today / Aujourd’hui** tab provides:

- a selectable travel date;
- current and next activity;
- completion state for itinerary activities;
- a compact daily timeline;
- quick access to same-day reservations and travel documents;
- local/offline availability information;
- practical alerts for pending or cancelled reservations, unmapped places,
  busy days and departure checklist gaps;
- quick entry of a paid expense, optionally shared between all travellers;
- locally stored emergency contact, insurance and essential medical notes.

## Data migration

Schema 11 is non-destructive. Existing activities receive `completedAt: null`
and existing trips receive a normalized `companion` object. No trip, expense,
reservation, document or note is removed.

## Files added

- `src/components/tripWorkspace/TodayPanel.jsx`
- `src/utils/travelCompanion.js`

## Main files updated

- `src/pages/TripWorkspacePage.jsx`
- `src/components/tripWorkspace/TripTabs.jsx`
- `src/components/tripWorkspace/ItineraryPanel.jsx`
- `src/components/tripWorkspace/ReservationsPanel.jsx`
- `src/components/tripWorkspace/DocumentsPanel.jsx`
- `src/services/trips/TripService.js`
- `src/i18n/translations.js`
- `src/styles/pages.css`
- version, PWA and documentation files
