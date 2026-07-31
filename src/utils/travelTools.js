import { getTripMapPoints } from './map.js';

/**
 * Selects the first meaningful map point as the location for live travel tools.
 * The selection logic is isolated so a dedicated destination entity can replace
 * it later without changing weather or time components.
 */
export function getPrimaryTripLocation(trip) {
  const points = getTripMapPoints(trip);
  const preferredPoint = points.find((point) => point.source === 'itinerary') || points[0];

  if (!preferredPoint) return null;

  return {
    label: preferredPoint.subtitle || preferredPoint.title || trip.destination,
    latitude: preferredPoint.latitude,
    longitude: preferredPoint.longitude,
  };
}
