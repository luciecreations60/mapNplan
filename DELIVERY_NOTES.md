# V0.1 — Part 15 delivery notes

## Version

- Application: `0.1.14`
- Trip schema: `14`
- Calendar interchange format: `ICS / iCalendar`

## Added

- Full-trip calendar export in `.ics` format.
- Selected-day export for lighter calendar sharing.
- Individual event export for Apple Calendar and other ICS applications.
- Direct event links for Google Calendar and Outlook Calendar.
- Per-event reminders stored on activities and reservations.
- ICS import preview with selective event import.
- Duplicate prevention through external calendar identifiers.
- Calendar conflict detection for overlapping timed events.
- Warnings for missing dates, missing times, invalid ranges and events outside trip dates.
- Responsive calendar connection controls for Chrome, Safari, tablet and mobile.

## Data migration

Existing trips are normalized to schema 14. Activities and reservations receive:

```js
{
  reminderMinutes: null,
  externalCalendarUid: ""
}
```

No existing itinerary, reservation or document data is deleted.

## Technical boundary

Calendar generation and parsing are isolated in:

- `src/utils/calendarInterop.js`
- `src/services/calendar/CalendarInteropService.js`

The UI does not depend directly on a specific calendar provider. Google Calendar,
Outlook and downloadable ICS files are adapters around the same travel-event
model.
