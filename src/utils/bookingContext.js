export function normalizeBookingContext(context = null, trip = null) {
  if (!context) return null;
  const location = String(context.location || context.arrivalLocation || context.destination || trip?.destination || '').trim();
  const startDate = String(context.startDate || context.date || trip?.startDate || '').trim();
  const endDate = String(context.endDate || context.startDate || context.date || trip?.endDate || startDate).trim();
  return {
    source: String(context.source || 'trip').trim(),
    activityType: String(context.activityType || '').trim(),
    transportMode: String(context.transportMode || '').trim(),
    title: String(context.title || '').trim(),
    location,
    destination: String(context.destination || location || trip?.destination || '').trim(),
    city: String(context.city || location || '').trim(),
    startDate,
    endDate,
    departureLocation: String(context.departureLocation || '').trim(),
    arrivalLocation: String(context.arrivalLocation || location || '').trim(),
    travelers: Math.max(1, Number(context.travelers ?? trip?.travelers) || 1),
    currency: String(context.currency || trip?.currency || 'EUR').trim().toUpperCase(),
    sourceActivityId: String(context.sourceActivityId || '').trim(),
  };
}

export function inferBookingCategories(context = null) {
  if (!context) return [];
  const type = String(context.activityType || '').trim();
  const mode = String(context.transportMode || '').trim();

  if (type === 'hotel') return ['hotels'];
  if (type === 'plane' || (type === 'car' && mode === 'plane')) return ['flights'];
  if (type === 'ticket') return ['activities'];
  if (type === 'car' && mode === 'driving') return ['cars'];
  if (type === 'map') return ['hotels', 'activities', 'cars'];
  return [];
}
