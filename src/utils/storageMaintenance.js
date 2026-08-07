/** Estimate the UTF-8 byte size of a serialisable value. */
export function estimateJsonBytes(value) {
  try {
    const serialized = JSON.stringify(value);
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(serialized).byteLength;
    return encodeURIComponent(serialized).replace(/%[0-9A-F]{2}|./gi, 'x').length;
  } catch {
    return 0;
  }
}

/** Build the set of document references that are allowed to own attachments. */
export function buildValidDocumentKeys(trips) {
  return new Set(
    (Array.isArray(trips) ? trips : []).flatMap((trip) => (
      (Array.isArray(trip?.documents) ? trip.documents : [])
        .filter((document) => document?.id)
        .map((document) => `${trip.id}:${document.id}`)
    )),
  );
}

/** Return attachment identifiers whose trip/document parent no longer exists. */
export function findOrphanAttachmentIds(attachments, trips) {
  const validKeys = buildValidDocumentKeys(trips);
  return (Array.isArray(attachments) ? attachments : [])
    .filter((attachment) => !validKeys.has(`${attachment?.tripId}:${attachment?.documentId}`))
    .map((attachment) => String(attachment?.id || ''))
    .filter(Boolean);
}

/** Produce a small domain volume summary without retaining private content. */
export function summarizeTripVolume(trips) {
  const safeTrips = Array.isArray(trips) ? trips : [];
  return safeTrips.reduce((summary, trip) => {
    summary.trips += 1;
    summary.days += Array.isArray(trip?.itinerary) ? trip.itinerary.length : 0;
    summary.activities += (Array.isArray(trip?.itinerary) ? trip.itinerary : [])
      .reduce((count, day) => count + (Array.isArray(day?.items) ? day.items.length : 0), 0);
    summary.reservations += Array.isArray(trip?.reservations) ? trip.reservations.length : 0;
    summary.documents += Array.isArray(trip?.documents) ? trip.documents.length : 0;
    summary.expenses += Array.isArray(trip?.expenses) ? trip.expenses.length : 0;
    return summary;
  }, { trips: 0, days: 0, activities: 0, reservations: 0, documents: 0, expenses: 0 });
}
