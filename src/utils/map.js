/**
 * Returns true when latitude and longitude can safely be rendered on a map.
 */
export function hasValidCoordinates(latitude, longitude) {
  if (latitude === null || latitude === undefined || latitude === ''
    || longitude === null || longitude === undefined || longitude === '') return false;

  const lat = Number(latitude);
  const lng = Number(longitude);

  return Number.isFinite(lat)
    && Number.isFinite(lng)
    && lat >= -90
    && lat <= 90
    && lng >= -180
    && lng <= 180;
}

/**
 * Builds a stable, presentation-neutral list of map points from trip data.
 */
export function getTripMapPoints(trip) {
  const destinationPoints = hasValidCoordinates(
    trip.destinationLatitude,
    trip.destinationLongitude,
  ) ? [{
    id: `destination-${trip.id}`,
    source: 'destination',
    order: -1,
    title: trip.destination || trip.name,
    subtitle: trip.country || '',
    latitude: Number(trip.destinationLatitude),
    longitude: Number(trip.destinationLongitude),
    type: 'pin',
    date: trip.startDate,
    time: '',
  }] : [];

  const seenItinerarySeries = new Set();
  const itineraryPoints = (trip.itinerary || []).flatMap((day, dayIndex) => (
    (day.items || [])
      .filter((item) => {
        if (!hasValidCoordinates(item.latitude, item.longitude)) return false;
        if (!item.seriesId) return true;
        if (seenItinerarySeries.has(item.seriesId)) return false;
        seenItinerarySeries.add(item.seriesId);
        return true;
      })
      .map((item, itemIndex) => ({
        id: `itinerary-${item.seriesId || item.id}`,
        source: 'itinerary',
        order: dayIndex * 100 + itemIndex,
        title: item.title,
        subtitle: item.location || day.date,
        latitude: Number(item.latitude),
        longitude: Number(item.longitude),
        type: item.type || 'map',
        transportMode: item.transportMode || '',
        date: day.date,
        time: item.time,
        seriesId: item.seriesId || null,
      }))
  ));

  const reservationPoints = (trip.reservations || [])
    .filter((reservation) => hasValidCoordinates(reservation.latitude, reservation.longitude))
    .map((reservation, index) => ({
      id: `reservation-${reservation.id}`,
      source: 'reservation',
      order: 10000 + index,
      title: reservation.title,
      subtitle: reservation.location || reservation.provider,
      latitude: Number(reservation.latitude),
      longitude: Number(reservation.longitude),
      type: reservation.type || 'ticket',
      transportMode: reservation.type === 'transport' ? 'transit' : '',
      date: reservation.startDate,
      time: reservation.startTime,
    }));

  const savedPlacePoints = (trip.savedPlaces || [])
    .filter((place) => hasValidCoordinates(place.latitude, place.longitude))
    .map((place, index) => ({
      id: `saved-place-${place.id}`,
      source: 'savedPlace',
      order: 20000 + index,
      title: place.name,
      subtitle: place.label || [place.city, place.country].filter(Boolean).join(', '),
      latitude: Number(place.latitude),
      longitude: Number(place.longitude),
      type: place.category === 'food' ? 'food' : place.category === 'accommodation' ? 'hotel' : place.category === 'transport' ? 'car' : 'map',
      category: place.category || 'other',
      date: '',
      time: '',
    }));

  return [...destinationPoints, ...itineraryPoints, ...reservationPoints, ...savedPlacePoints]
    .sort((left, right) => left.order - right.order);
}
