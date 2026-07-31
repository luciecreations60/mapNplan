# V0.1 — Part 14 delivery notes

## Version

- Application: `0.1.13`
- Trip schema: `13`
- Template library format: `1`

## Added

- Dedicated **Templates** page in the main navigation.
- Four translated built-in trip templates:
  - three-day city break;
  - five-day road trip;
  - four-day beach escape;
  - three-day business trip.
- Trip creation from a template with generated itinerary dates.
- Personal trip-template creation from existing journeys.
- Selective inclusion of itinerary, checklist and example budget.
- Reusable day-plan library.
- Save an existing itinerary day as a personal template.
- Insert a day template into any date of an active trip.
- Checklist presets for city, road, beach and business travel.
- Duplicate checklist prevention when applying presets.
- Personal template-library JSON import and export.
- Responsive template cards and dialogs for Chrome, Safari and mobile.

## Privacy rules

Personal templates do not include:

- reservations or confirmation numbers;
- documents or attachment metadata;
- binary files;
- comments or collaboration history;
- group-expense balances and settlements.

## Data migration

Existing trips are normalized to schema 13 with optional
`sourceTemplateId` and `sourceTemplateName` fields. No existing trip data is
removed or rewritten beyond normalization.
