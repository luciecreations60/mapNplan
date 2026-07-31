/**
 * Returns true when latitude and longitude can safely be rendered on a map.
 */
export function hasValidCoordinates(latitude, longitude) {
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

  const itineraryPoints = (trip.itinerary || []).flatMap((day, dayIndex) => (
    (day.items || [])
      .filter((item) => hasValidCoordinates(item.latitude, item.longitude))
      .map((item, itemIndex) => ({
        id: `itinerary-${item.id}`,
        source: 'itinerary',
        order: dayIndex * 100 + itemIndex,
        title: item.title,
        subtitle: item.location || day.date,
        latitude: Number(item.latitude),
        longitude: Number(item.longitude),
        type: item.type || 'map',
        date: day.date,
        time: item.time,
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
      date: reservation.startDate,
      time: reservation.startTime,
    }));

  return [...destinationPoints, ...itineraryPoints, ...reservationPoints]
    .sort((left, right) => left.order - right.order);
}
