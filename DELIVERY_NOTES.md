# Delivery notes — V0.1 Part 7

## Version

- Application: `0.1.6`
- Trip schema: `6`
- Service-worker cache: `tripflow-v0.1.6`

## Added

### Global search

- Search button in the desktop and mobile top bar.
- `Ctrl/Cmd + K` shortcut.
- Accent-insensitive matching.
- Results from trips, activities, reservations, documents and notes.
- Direct navigation to the relevant workspace tab.
- Search remains local to the browser.

### Trip library

- Search inside all trip content.
- Smart, departure, recently updated and alphabetical sorting.
- Favorite-only filter.
- Favorite and pin actions on trip cards.
- Smart sorting prioritises pinned trips and favorites.

### Calendar

- Monthly grid using itinerary activities and reservation dates.
- Daily agenda.
- Month navigation.
- Direct links back to itinerary and reservation panels.
- Responsive compact event indicators on mobile.

### Statistics

- Trip length and planned-day count.
- Activity count and daily average.
- Mapped-place count.
- Reservation and document totals.
- Expense breakdown and budget allocation.
- Checklist completion and reservation statuses.
- Total planned activity duration.

### Printing and PDF

- Dedicated full-trip report route.
- Itinerary, reservations, budget, checklist, documents and notes.
- A4 print stylesheet.
- Browser-native “Save as PDF” support.

## Migration

Schema 6 adds:

```text
isFavorite: boolean
pinnedAt: ISO timestamp | null
```

Existing trips are migrated without deleting or replacing user data.

## Important test paths

1. Top bar → search or press `Ctrl/Cmd + K`.
2. My trips → use search, sort, favorites and pin controls.
3. Open a trip → Calendar.
4. Open a trip → Statistics.
5. Open a trip → Print / PDF.
