import { getTripMapPoints, hasValidCoordinates } from './map.js';

/**
 * Selects the explicit trip destination first, then the first meaningful
 * itinerary/reservation point for weather and local-time tools.
 */
export function getPrimaryTripLocation(trip) {
  if (hasValidCoordinates(trip.destinationLatitude, trip.destinationLongitude)) {
    return {
      label: trip.destination || trip.country || trip.name,
      latitude: Number(trip.destinationLatitude),
      longitude: Number(trip.destinationLongitude),
    };
  }

  const points = getTripMapPoints(trip);
  const preferredPoint = points.find((point) => point.source === 'itinerary') || points[0];

  if (!preferredPoint) return null;

  return {
    label: preferredPoint.subtitle || preferredPoint.title || trip.destination,
    latitude: preferredPoint.latitude,
    longitude: preferredPoint.longitude,
  };
}
