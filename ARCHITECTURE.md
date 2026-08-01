# Architecture — V0.1.15

## Saved-place domain

Saved places are stored inside their owning trip. This keeps ideas close to the
itinerary, map, export and future collaboration boundary while avoiding a
second source of truth.

```js
{
  id,
  name,
  label,
  city,
  country,
  countryCode,
  latitude,
  longitude,
  category,      // sight | food | nature | shopping | nightlife | ...
  list,          // built-in or user-defined string
  priority,      // high | medium | low
  status,        // idea | planned | visited
  notes,
  tags,
  source,
  createdAt,
  updatedAt,
  visitedAt
}
```

## Boundaries

- `savedPlaces.js` owns normalization, JSON portability and itinerary insertion.
- `TripService.js` owns persistence, migration and duplication rules.
- `SavedPlacesPanel.jsx` owns the per-trip library interface.
- `ExplorePage.jsx` provides the cross-trip inspiration view.
- `tripSearch.js` exposes saved places to the global search palette.
- `map.js` exposes geolocated saved places to the existing Leaflet adapter.

The geocoding provider remains isolated behind `GeocodingService`, so a
commercial or self-hosted provider can replace Photon without changing saved
place components.

## Trip schema 15

Trip schema 15 adds:

```js
{
  savedPlaces: SavedPlace[]
}
```

Legacy trips receive an empty list automatically. Demonstration data receives a
small example library. Duplicating a trip creates new saved-place identifiers
and resets places already marked as visited back to ideas.

## Privacy and portability

- Saved places remain local with the trip.
- They are included in the normal trip backup.
- A smaller `tripflow-saved-places` JSON file can be exported independently.
- No reservation confirmation, document attachment or collaboration email is
  included in that smaller file.
