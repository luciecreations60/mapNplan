import { createId } from './id.js';
import { upsertActivityAcrossDates, upsertActivityInItinerary } from './itinerary.js';

const CATEGORY_TO_RESERVATION_TYPE = Object.freeze({
  hotels: 'accommodation',
  flights: 'flight',
  activities: 'activity',
  cars: 'transport',
  esim: 'activity',
  insurance: 'activity',
});

const CATEGORY_TO_ACTIVITY_TYPE = Object.freeze({
  hotels: 'hotel',
  flights: 'plane',
  activities: 'ticket',
  cars: 'car',
});

function comparable(value) {
  return String(value || '')
    .trim()
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function activityMatchesCategory(activity, category) {
  if (category === 'hotels') return activity?.type === 'hotel';
  if (category === 'flights') return activity?.type === 'plane' || (activity?.type === 'car' && activity?.transportMode === 'plane');
  if (category === 'cars') return activity?.type === 'car' && activity?.transportMode === 'driving';
  if (category === 'activities') return activity?.type === 'ticket';
  return false;
}

function findSourceActivity(trip, option) {
  const itinerary = Array.isArray(trip?.itinerary) ? trip.itinerary : [];
  const all = itinerary.flatMap((day) => (day.items || []).map((item) => ({ day, item })));

  if (option?.sourceActivityId) {
    const exact = all.find(({ item }) => item.id === option.sourceActivityId);
    if (exact) return exact;
  }

  const targetLocation = comparable(option?.arrivalLocation || option?.location);
  const targetDate = option?.startDate || '';
  return all.find(({ day, item }) => {
    if (!activityMatchesCategory(item, option?.category)) return false;
    const itemDate = item.stayStartDate || day.date;
    if (targetDate && itemDate !== targetDate) return false;
    if (!targetLocation) return true;
    return [item.location, item.arrivalLocation, item.title]
      .map(comparable)
      .some((value) => value && (value === targetLocation || value.includes(targetLocation) || targetLocation.includes(value)));
  }) || null;
}

function createActivityFromBookingOption(option, trip, linkedReservationId) {
  const type = CATEGORY_TO_ACTIVITY_TYPE[option?.category];
  const date = option?.startDate || trip?.startDate || '';
  if (!type || !date) return { itinerary: trip?.itinerary || [], source: null };

  const activity = {
    id: createId('activity'),
    type,
    title: option.title || option.location || 'Reservation',
    location: option.location || option.arrivalLocation || trip?.destination || '',
    latitude: null,
    longitude: null,
    departureLocation: option.departureLocation || '',
    departureLatitude: null,
    departureLongitude: null,
    transportMode: option.category === 'cars' ? 'driving' : '',
    time: '',
    endTime: '',
    durationMinutes: 0,
    estimatedCost: Math.max(0, Number(option.price) || 0),
    notes: option.notes || '',
    reminderMinutes: null,
    externalCalendarUid: '',
    completedAt: null,
    comments: [],
    linkedReservationId,
  };

  let itinerary;
  if (type === 'hotel') {
    const endDate = option.endDate || date;
    itinerary = upsertActivityAcrossDates(trip?.itinerary || [], date, endDate, {
      ...activity,
      checkInTime: '',
      checkOutTime: '',
      stayStartDate: date,
      stayEndDate: endDate,
    });
  } else {
    itinerary = upsertActivityInItinerary(trip?.itinerary || [], date, activity);
  }

  return {
    itinerary,
    source: findSourceActivity({ ...trip, itinerary }, { ...option, sourceActivityId: activity.id }),
  };
}

/**
 * Turns a booking option explicitly marked as booked into the single source of
 * truth used by Reservations and Itinerary. This is also the adapter that a
 * future Booking/Skyscanner backend callback can call after a verified order.
 */
export function syncBookedOptionToTrip(trip, option) {
  const reservations = Array.isArray(trip?.reservations) ? trip.reservations : [];
  let source = findSourceActivity(trip, option);

  let existing = reservations.find((reservation) => reservation.sourceBookingOptionId === option.id);
  if (!existing && source) {
    existing = reservations.find((reservation) => (
      reservation.sourceActivityId === source.item.id
      || (source.item.seriesId && reservation.sourceActivitySeriesId === source.item.seriesId)
    ));
  }

  const reservationId = existing?.id || createId('reservation');
  let nextItinerary = trip?.itinerary || [];

  // If the booking came from the map or booking hub before an itinerary item
  // existed, create it automatically once the user confirms the booking.
  if (!source) {
    const generated = createActivityFromBookingOption(option, trip, reservationId);
    nextItinerary = generated.itinerary;
    source = generated.source;
  }

  const sourceActivity = source?.item || null;
  const sourceSeriesId = sourceActivity?.seriesId || null;
  const sourceActivityId = sourceActivity?.id || option?.sourceActivityId || null;

  const reservation = {
    ...(existing || {}),
    id: reservationId,
    type: CATEGORY_TO_RESERVATION_TYPE[option.category] || existing?.type || 'activity',
    title: option.title || existing?.title || sourceActivity?.title || 'Reservation',
    provider: option.providerName || existing?.provider || '',
    confirmationNumber: existing?.confirmationNumber || '',
    startDate: option.startDate || sourceActivity?.stayStartDate || source?.day?.date || existing?.startDate || trip?.startDate || '',
    startTime: existing?.startTime || sourceActivity?.checkInTime || sourceActivity?.time || '',
    endDate: option.endDate || sourceActivity?.stayEndDate || existing?.endDate || option.startDate || source?.day?.date || '',
    endTime: existing?.endTime || sourceActivity?.checkOutTime || '',
    location: option.location || option.arrivalLocation || sourceActivity?.location || existing?.location || trip?.destination || '',
    status: existing?.status === 'cancelled' ? 'cancelled' : 'confirmed',
    amount: Math.max(0, Number(option.price) || Number(existing?.amount) || 0),
    url: option.url || existing?.url || '',
    latitude: sourceActivity?.latitude ?? existing?.latitude ?? null,
    longitude: sourceActivity?.longitude ?? existing?.longitude ?? null,
    notes: existing?.notes || option.notes || '',
    reminderMinutes: existing?.reminderMinutes ?? null,
    externalCalendarUid: existing?.externalCalendarUid || '',
    comments: existing?.comments || [],
    sourceActivityId,
    sourceActivitySeriesId: sourceSeriesId || existing?.sourceActivitySeriesId || null,
    sourceBookingOptionId: option.id,
    createdAt: existing?.createdAt || new Date().toISOString(),
  };

  const nextReservations = existing
    ? reservations.map((item) => (item.id === existing.id ? reservation : item))
    : [...reservations, reservation];

  if (sourceActivity) {
    nextItinerary = nextItinerary.map((day) => ({
      ...day,
      items: (day.items || []).map((item) => (
        item.id === sourceActivity.id || (sourceSeriesId && item.seriesId === sourceSeriesId)
          ? { ...item, linkedReservationId: reservationId }
          : item
      )),
    }));
  }

  return {
    reservations: nextReservations,
    itinerary: nextItinerary,
    reservationId,
  };
}
