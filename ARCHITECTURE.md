# Architecture — V0.1.11

## Workspace navigation behaviour

`TripWorkspacePage` owns the active tab and a reference to the horizontal tab
bar. A tab change sets a one-shot focus request. After React renders the target
panel, the tab bar is scrolled to the top of the content viewport and the active
button is centred horizontally when required.

This replaces global `window.scrollTo(0, 0)` calls and keeps the large trip hero
out of the way during normal workspace navigation.

Editing forms use local scroll anchors. Activity, reservation and document
components therefore scroll only to their own form.

## Chrome-safe activity layout

Activity cards use named CSS grid areas:

```text
Desktop
┌────────┬──────┬─────────────────────────┐
│ time   │ icon │ content                 │
├────────┴──────┼─────────────────────────┤
│               │ actions (flex/wrapping) │
└───────────────┴─────────────────────────┘
```

The action group no longer occupies a fixed 34 px column. It is constrained by
the content track and wraps without overflowing.

## Travel-day companion domain

```text
Trip
├── itinerary[].items[].completedAt
└── companion
    ├── localEmergencyNumber
    ├── emergencyContactName
    ├── emergencyContactPhone
    ├── insuranceProvider
    ├── insurancePolicyNumber
    ├── medicalNotes
    └── lastPreparedAt
```

`src/utils/travelCompanion.js` contains pure functions for:

- choosing the initial travel date;
- selecting activities and reservations for one day;
- identifying current and next activities;
- deriving practical alerts;
- normalizing companion information.

`TodayPanel` composes these derived values but persists only source data through
`TripContext` and `TripService`.

## Offline boundary

The companion does not create a second copy of trip data. It reads the same
LocalStorage-backed trip model already available to the PWA. The service worker
caches application assets, while itinerary and personal information remain in
the existing storage adapter. A future IndexedDB or remote repository can
replace that adapter without changing the panel.

## Safety boundary

No emergency number is guessed by the application. The user stores a verified
number for the destination. The interface explicitly states that personal notes
do not replace official travel or medical advice.
