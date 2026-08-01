# V0.1 — Part 16 delivery notes

## Versions

- Application: `0.1.15`
- Trip schema: `15`
- Service-worker cache: `tripflow-v0.1.15`

## Main additions

- Per-trip saved-place library.
- Photon/OpenStreetMap place selection with coordinates.
- Custom lists, categories, priorities, tags and statuses.
- Direct insertion into an itinerary date and time.
- Saved-place markers on the existing trip map.
- Cross-trip inspiration library on Explore.
- Global search results for saved places.
- Versioned JSON import and export.

## Migration

Existing trips are preserved. Migration adds an empty `savedPlaces` collection
when none exists. No current itinerary, reservation, expense, document or file
is modified.

## Suggested checks

1. Open Japan Discovery and select **Saved places**.
2. Add a place through autocomplete.
3. Add it to an itinerary date.
4. Confirm it appears in Itinerary and Map.
5. Search its name with Ctrl/Cmd + K.
6. Open Explore and check the cross-trip library.
7. Export and re-import the places JSON file.
