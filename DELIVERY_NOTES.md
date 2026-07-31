# Delivery notes — V0.1 Part 6

## Release

- Application version: `0.1.5`
- Trip schema: `5`
- Service-worker cache: `tripflow-v0.1.5`

## Delivered features

### Trip management

- Edit the trip name, destination, country, country code, dates, travellers, budget, currencies, card colour and summary.
- Open the editor from **My trips** or from the trip workspace hero.
- Duplicate a complete trip.
- Regenerate trip, day, activity, expense, checklist, reservation and document identifiers during duplication.
- Archive a trip without deleting its data.
- Restore archived trips from the **Archived** filter.
- Permanently delete a trip only after explicit confirmation.

### Detailed editing

- Edit an existing itinerary activity.
- Move an edited activity to another date.
- Edit reservations while retaining their original creation date.
- Edit documents while retaining their original creation date.
- Confirm deletion of activities, reservations and documents.

### Interface

- French and English labels for all new controls and messages.
- Responsive management controls on trip cards.
- Responsive edit controls in itinerary, reservation and document cards.
- Success notices after trip-level actions.

## Data migration

Schema 5 adds:

```json
{
  "archivedAt": null
}
```

Existing trips are migrated automatically. No collection is reset or removed.

## Verification performed

- JavaScript and JSX parsed with TypeScript `--noCheck`.
- Relative imports resolved.
- 524 translation keys compared between French and English.
- Static translation references checked.
- TripService create, update, duplicate, archive and restore flows executed with a mocked browser store.
- JSON files parsed.
- ZIP archive integrity checked.

## Environment limitation

The complete Vite build could not run in the generation environment because its internal npm mirror does not expose `@vitejs/plugin-react`. GitHub Actions will install packages from its configured npm registry and perform the production build.
