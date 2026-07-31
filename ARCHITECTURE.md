# Architecture — V0.1.13

## Template domain boundary

Reusable planning assets are separated from journeys:

- `TripService` owns real trip instances and schema migrations;
- `TemplateService` owns reusable trip and day templates;
- `TemplateContext` keeps React synchronized with the template repository;
- `builtInTemplates.js` generates translated starter templates.

This separation prevents templates from inheriting private trip data and allows
a future template marketplace or cloud library to replace LocalStorage without
rewriting trip pages.

## Stored template types

### Trip template

```js
{
  id,
  name,
  description,
  category,
  durationDays,
  travelers,
  budget,
  currency,
  destinationCurrency,
  accent,
  summary,
  itineraryDays: [{ title, items }],
  checklist: [{ label, category }]
}
```

Dates, reservation data, documents, discussions, participant balances and
attachments are deliberately excluded.

### Day template

```js
{
  id,
  name,
  description,
  category,
  items: [{ time, type, title, location, durationMinutes, estimatedCost }]
}
```

When inserted, every activity receives a new identifier and is attached to the
selected date. Existing activities on that date are preserved.

## Trip schema 13

Trips now retain optional provenance fields:

```js
{
  sourceTemplateId,
  sourceTemplateName
}
```

They are informational only and do not create a live dependency on the source
template. Editing or deleting a template never changes trips already created
from it.

## Local persistence

- Real trips: `tripflow:trips`
- Personal trip templates: `tripflow:trip-templates`
- Personal day templates: `tripflow:day-templates`
- Binary document files: IndexedDB through `AttachmentStorageService`

Template import/export uses a dedicated versioned JSON format and does not alter
trip backups.
