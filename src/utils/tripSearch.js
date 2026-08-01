/**
 * Converts user content into a comparison-friendly search string.
 * Diacritics are removed so "Québec" also matches "quebec".
 */
export function normalizeSearchValue(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .toLocaleLowerCase()
    .trim();
}

function includesQuery(values, query) {
  return values.some((value) => normalizeSearchValue(value).includes(query));
}

/**
 * Returns true when a trip or one of its nested planning records matches.
 */
export function tripMatchesQuery(trip, rawQuery) {
  const query = normalizeSearchValue(rawQuery);
  if (!query) return true;

  if (includesQuery([
    trip.name,
    trip.destination,
    trip.country,
    trip.countryCode,
    trip.summary,
    trip.notes,
  ], query)) return true;

  const activityMatch = (trip.itinerary || []).some((day) => (
    includesQuery([day.title, day.date], query)
    || (day.items || []).some((item) => includesQuery([
      item.title,
      item.location,
      item.notes,
      item.type,
    ], query))
  ));
  if (activityMatch) return true;

  const reservationMatch = (trip.reservations || []).some((reservation) => includesQuery([
    reservation.title,
    reservation.provider,
    reservation.confirmationNumber,
    reservation.location,
    reservation.notes,
    reservation.type,
    reservation.status,
  ], query));
  if (reservationMatch) return true;

  const bookingOptionMatch = (trip.bookingOptions || []).some((option) => includesQuery([
    option.title,
    option.providerName,
    option.category,
    option.status,
    option.notes,
  ], query));
  if (bookingOptionMatch) return true;

  const savedPlaceMatch = (trip.savedPlaces || []).some((place) => includesQuery([
    place.name,
    place.label,
    place.city,
    place.country,
    place.category,
    place.list,
    place.notes,
    ...(place.tags || []),
  ], query));
  if (savedPlaceMatch) return true;

  return (trip.documents || []).some((document) => includesQuery([
    document.title,
    document.reference,
    document.notes,
    document.type,
    ...(document.attachments || []).map((attachment) => attachment.name),
  ], query));
}

/**
 * Produces navigable search results from every user-owned collection.
 */
export function searchTripContent(trips, rawQuery, limit = 12) {
  const query = normalizeSearchValue(rawQuery);
  if (query.length < 2) return [];

  const results = [];
  const push = (result) => {
    if (results.length < limit) results.push(result);
  };

  for (const trip of trips) {
    if (trip.archivedAt) continue;

    if (includesQuery([trip.name, trip.destination, trip.country, trip.summary], query)) {
      push({
        id: `trip-${trip.id}`,
        type: 'trip',
        tripId: trip.id,
        tab: 'overview',
        title: trip.name,
        subtitle: [trip.destination, trip.country].filter(Boolean).join(' · '),
      });
    }

    for (const day of trip.itinerary || []) {
      for (const item of day.items || []) {
        if (!includesQuery([item.title, item.location, item.notes, day.title], query)) continue;
        push({
          id: `activity-${trip.id}-${item.id}`,
          type: 'activity',
          tripId: trip.id,
          tab: 'itinerary',
          title: item.title,
          subtitle: [trip.name, item.location, day.date].filter(Boolean).join(' · '),
        });
      }
    }

    for (const reservation of trip.reservations || []) {
      if (!includesQuery([
        reservation.title,
        reservation.provider,
        reservation.confirmationNumber,
        reservation.location,
        reservation.notes,
      ], query)) continue;
      push({
        id: `reservation-${trip.id}-${reservation.id}`,
        type: 'reservation',
        tripId: trip.id,
        tab: 'reservations',
        title: reservation.title,
        subtitle: [trip.name, reservation.provider, reservation.startDate].filter(Boolean).join(' · '),
      });
    }

    for (const option of trip.bookingOptions || []) {
      if (!includesQuery([
        option.title,
        option.providerName,
        option.category,
        option.status,
        option.notes,
      ], query)) continue;
      push({
        id: `booking-option-${trip.id}-${option.id}`,
        type: 'bookingOption',
        tripId: trip.id,
        tab: 'booking',
        title: option.title,
        subtitle: [trip.name, option.providerName, option.currency && option.price ? `${option.price} ${option.currency}` : ''].filter(Boolean).join(' · '),
      });
    }

    for (const place of trip.savedPlaces || []) {
      if (!includesQuery([
        place.name,
        place.label,
        place.city,
        place.country,
        place.category,
        place.list,
        place.notes,
        ...(place.tags || []),
      ], query)) continue;
      push({
        id: `saved-place-${trip.id}-${place.id}`,
        type: 'savedPlace',
        tripId: trip.id,
        tab: 'places',
        title: place.name,
        subtitle: [trip.name, place.city || place.country, place.list].filter(Boolean).join(' · '),
      });
    }

    for (const document of trip.documents || []) {
      if (!includesQuery([
        document.title,
        document.reference,
        document.notes,
        ...(document.attachments || []).map((attachment) => attachment.name),
      ], query)) continue;
      push({
        id: `document-${trip.id}-${document.id}`,
        type: 'document',
        tripId: trip.id,
        tab: 'documents',
        title: document.title,
        subtitle: [trip.name, document.reference].filter(Boolean).join(' · '),
      });
    }

    if (includesQuery([trip.notes], query)) {
      push({
        id: `notes-${trip.id}`,
        type: 'notes',
        tripId: trip.id,
        tab: 'notes',
        title: trip.name,
        subtitle: trip.notes.slice(0, 90),
      });
    }

    if (results.length >= limit) break;
  }

  return results;
}
