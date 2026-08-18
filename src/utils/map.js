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
 * Builds the points that belong to the planning map.
 *
 * Reservations are intentionally excluded: when a reservation is linked to
 * an itinerary activity (for example an accommodation), showing both creates
 * duplicate pins and duplicate rows. The planning map represents the places
 * and itinerary; reservation management stays in the Reservations view.
 *
 * `mapPointOrder` is presentation-only. Reordering a pin in the map sidebar
 * never changes the chronological order of the itinerary itself.
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
        activityId: item.id,
        dayId: day.id,
        title: item.title,
        subtitle: item.location || day.date,
        latitude: Number(item.latitude),
        longitude: Number(item.longitude),
        type: item.type || 'map',
        transportMode: item.transportMode || '',
        date: item.stayStartDate || day.date,
        endDate: item.stayEndDate || day.date,
        time: item.checkInTime || item.time || '',
        endTime: item.checkOutTime || item.endTime || '',
        durationMinutes: Math.max(0, Number(item.durationMinutes) || 0),
        estimatedCost: Math.max(0, Number(item.estimatedCost) || 0),
        notes: item.notes || '',
        seriesId: item.seriesId || null,
      }))
  ));

  const savedPlacePoints = (trip.savedPlaces || [])
    .filter((place) => hasValidCoordinates(place.latitude, place.longitude))
    .map((place, index) => ({
      id: `saved-place-${place.id}`,
      savedPlaceId: place.id,
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
      notes: place.notes || '',
    }));

  const points = [...destinationPoints, ...itineraryPoints, ...savedPlacePoints];
  const customOrder = new Map(
    (Array.isArray(trip.mapPointOrder) ? trip.mapPointOrder : [])
      .map((id, index) => [String(id), index]),
  );

  return points.sort((left, right) => {
    if (left.source === 'destination') return right.source === 'destination' ? 0 : -1;
    if (right.source === 'destination') return 1;
    const leftCustom = customOrder.get(left.id);
    const rightCustom = customOrder.get(right.id);
    if (leftCustom !== undefined && rightCustom !== undefined) return leftCustom - rightCustom;
    if (leftCustom !== undefined) return -1;
    if (rightCustom !== undefined) return 1;
    return left.order - right.order;
  });
}
