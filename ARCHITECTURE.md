# Architecture — V0.1.14

## Calendar domain boundary

Calendar interoperability is split into a pure domain utility and a browser
adapter:

- `calendarInterop.js` builds and parses ICS content, computes event end times,
  detects conflicts and converts imported events into itinerary activities;
- `CalendarInteropService.js` handles browser downloads and provider links;
- `tripCalendar.js` maps itinerary activities and reservations to one stable
  calendar-event representation;
- `CalendarPanel.jsx` orchestrates the user interface without containing the
  calendar file-format rules.

This boundary allows a future CalDAV, Microsoft Graph or Google Calendar API
integration without rewriting itinerary and reservation components.

## Calendar event model

```js
{
  id,
  sourceId,
  source,                 // activity | reservation
  date,
  time,
  endDate,
  endTime,
  title,
  location,
  notes,
  durationMinutes,
  reminderMinutes,
  externalCalendarUid
}
```

## Trip schema 14

Activities and reservations now store optional calendar metadata:

```js
{
  reminderMinutes: null | number,
  externalCalendarUid: string
}
```

`externalCalendarUid` prevents duplicate imports when the same ICS event is
selected again. It is cleared when a trip is duplicated so each copied journey
remains independent.

## Conflict analysis

The local conflict engine checks:

- overlapping timed events;
- missing event dates;
- missing event times;
- end times before start times;
- events outside the trip date range.

The analysis is advisory and never changes the itinerary automatically.

## Privacy

- No calendar credentials are stored.
- Exported ICS files are generated in the browser.
- Imported ICS files are parsed locally.
- Google Calendar and Outlook links contain only the selected event details.
