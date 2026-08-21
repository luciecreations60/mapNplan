/**
 * Turn-by-turn navigation links.
 *
 * Uses the Google Maps universal directions URL, which opens the native maps
 * application on Android and iOS when installed, and falls back to the browser
 * everywhere else. Coordinates are preferred over the free-text address
 * because they are unambiguous; the address is only used when no coordinates
 * were recorded for the stop.
 */

export function buildDirectionsUrl({ latitude, longitude, location } = {}) {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }

  const query = String(location || '').trim();
  if (!query) return '';

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}

export function canNavigateTo(target) {
  return Boolean(buildDirectionsUrl(target));
}
