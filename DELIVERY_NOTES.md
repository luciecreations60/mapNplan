# V0.1 — Part 9 delivery notes

## Version

- Application: `0.1.8`
- Trip schema: `8`

## Added

- Reusable search-as-you-type location combobox.
- Destination search in the trip creation and edition dialog.
- Location search in activity and reservation forms.
- Automatic latitude and longitude capture.
- Automatic country and country-code capture for trip destinations.
- Keyboard navigation with Arrow Up, Arrow Down, Enter and Escape.
- Debounced requests, cancellation of obsolete requests and a 24-hour cache.
- Photon/OpenStreetMap attribution in the suggestion panel.
- Destination marker on the map and direct reuse by weather/local-time tools.

## Behaviour

Typing at least three characters starts a search after 500 ms. Selecting a
result stores its formatted label and coordinates. The input remains editable,
and users can ignore suggestions or enter a location manually when the provider
is unavailable.

## Architecture

The provider is isolated behind `GeocodingService`. The public Photon endpoint
is appropriate for prototype traffic only. A private Photon instance or another
provider can later be configured without changing React forms.

## Migration

Schema 8 adds `destinationLatitude` and `destinationLongitude`. Older trips are
migrated non-destructively; when possible, the first existing mapped activity or
reservation supplies the initial destination coordinates.
