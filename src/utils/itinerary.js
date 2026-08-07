import { createId } from './id.js';

export const TRANSPORT_MODES = Object.freeze([
  { id: 'walking', icon: 'walk', labelKey: 'itinerary.transportModes.walking' },
  { id: 'cycling', icon: 'bike', labelKey: 'itinerary.transportModes.cycling' },
  { id: 'driving', icon: 'car', labelKey: 'itinerary.transportModes.driving' },
  { id: 'transit', icon: 'bus', labelKey: 'itinerary.transportModes.transit' },
  { id: 'train', icon: 'train', labelKey: 'itinerary.transportModes.train' },
  { id: 'plane', icon: 'plane', labelKey: 'itinerary.transportModes.plane' },
  { id: 'ferry', icon: 'ship', labelKey: 'itinerary.transportModes.ferry' },
]);

export function buildTripDateRange(startDate, endDate) {
  if (!isIsoDate(startDate) || !isIsoDate(endDate) || startDate > endDate) return [];
  const dates = [];
  const cursor = new Date(`${startDate}T12:00:00`);
  const last = new Date(`${endDate}T12:00:00`);
  while (cursor <= last && dates.length < 370) {
    dates.push(toIsoDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

export function buildVisibleItineraryDays(trip) {
  const storedByDate = new Map((trip?.itinerary || []).map((day) => [day.date, day]));
  const range = buildTripDateRange(trip?.startDate, trip?.endDate);
  const dates = range.length > 0
    ? [...new Set([...range, ...storedByDate.keys()])].sort()
    : [...storedByDate.keys()].sort();
  return dates.map((date) => storedByDate.get(date) || {
    id: `virtual-day-${date}`,
    date,
    title: '',
    items: [],
    routePlan: null,
    isVirtual: true,
  });
}

export function getLastUsedItineraryDate(trip) {
  const dates = (trip?.itinerary || [])
    .filter((day) => Array.isArray(day.items) && day.items.length > 0 && isIsoDate(day.date))
    .map((day) => day.date)
    .sort();
  return dates.at(-1) || trip?.startDate || '';
}

export function upsertItineraryDayTitle(itinerary, date, title) {
  const normalizedTitle = String(title || '').trim();
  const next = (itinerary || []).map((day) => ({ ...day, items: [...(day.items || [])] }));
  const existingDay = next.find((day) => day.date === date);
  if (existingDay) {
    return next.map((day) => day.id === existingDay.id ? { ...day, title: normalizedTitle } : day);
  }
  return [...next, {
    id: createId('day'),
    date,
    title: normalizedTitle,
    items: [],
    routePlan: null,
  }].sort((left, right) => left.date.localeCompare(right.date));
}

export function upsertActivityInItinerary(itinerary, date, activity, previous = null) {
  let next = cloneItinerary(itinerary);
  if (previous?.activityId) {
    next = next.map((day) => day.id === previous.dayId
      ? { ...day, items: day.items.filter((item) => item.id !== previous.activityId), routePlan: null }
      : day);
  }
  return appendActivityToDate(next, date, activity);
}

/**
 * Adds an accommodation (or any future multi-day item) to every date in a
 * requested range. Every occurrence has its own id while `seriesId` keeps the
 * stay together for editing, reservations, map de-duplication and expenses.
 * The estimated cost is stored only on the first day so totals are not counted
 * once per night.
 */
export function upsertActivityAcrossDates(itinerary, startDate, endDate, activity, previous = null) {
  const dates = buildTripDateRange(startDate, endDate);
  if (dates.length === 0) return itinerary || [];

  let next = cloneItinerary(itinerary);
  const previousItem = previous?.activityId
    ? next.flatMap((day) => day.items).find((item) => item.id === previous.activityId)
    : null;
  const previousSeriesId = previousItem?.seriesId || null;
  const previousOccurrencesByDate = new Map();

  if (previousSeriesId) {
    for (const day of next) {
      const occurrence = day.items.find((item) => item.seriesId === previousSeriesId);
      if (occurrence) previousOccurrencesByDate.set(day.date, occurrence);
    }
  }

  if (previous?.activityId) {
    next = next.map((day) => ({
      ...day,
      items: day.items.filter((item) => previousSeriesId ? item.seriesId !== previousSeriesId : item.id !== previous.activityId),
      routePlan: null,
    }));
  }

  const seriesId = previousSeriesId || activity.seriesId || createId('activity-series');
  const totalCost = Math.max(0, Number(activity.estimatedCost) || 0);
  dates.forEach((date, index) => {
    const previousOccurrence = previousOccurrencesByDate.get(date);
    const occurrence = {
      ...activity,
      id: previousOccurrence?.id || createId('activity'),
      comments: previousOccurrence?.comments || activity.comments || [],
      seriesId,
      seriesIndex: index,
      stayStartDate: startDate,
      stayEndDate: endDate,
      estimatedCost: index === 0 ? totalCost : 0,
    };
    next = appendActivityToDate(next, date, occurrence);
  });

  return next;
}

export function removeActivityFromItinerary(itinerary, dayId, activityId) {
  return (itinerary || []).map((day) => day.id === dayId
    ? { ...day, items: (day.items || []).filter((item) => item.id !== activityId), routePlan: null }
    : day);
}

export function removeActivitySeriesFromItinerary(itinerary, activity) {
  if (!activity?.seriesId) return removeActivityFromItinerary(itinerary, activity?.dayId, activity?.id);
  return (itinerary || []).map((day) => ({
    ...day,
    items: (day.items || []).filter((item) => item.seriesId !== activity.seriesId),
    routePlan: null,
  }));
}

export function getSeriesRootActivity(itinerary, activity) {
  if (!activity?.seriesId) return activity;
  return (itinerary || [])
    .flatMap((day) => day.items || [])
    .filter((item) => item.seriesId === activity.seriesId)
    .sort((left, right) => Number(left.seriesIndex || 0) - Number(right.seriesIndex || 0))[0] || activity;
}

export function splitDuration(totalMinutes) {
  const safe = Math.max(0, Math.round(Number(totalMinutes) || 0));
  return { hours: Math.floor(safe / 60), minutes: safe % 60 };
}

export function combineDuration(hours, minutes) {
  return Math.max(0, Math.round(Number(hours) || 0) * 60 + Math.round(Number(minutes) || 0));
}

export function formatDuration(totalMinutes, t) {
  const { hours, minutes } = splitDuration(totalMinutes);
  if (hours > 0 && minutes > 0) return t('itinerary.durationHoursMinutes', { hours, minutes });
  if (hours > 0) return t(hours === 1 ? 'itinerary.durationHour' : 'itinerary.durationHours', { count: hours });
  return t('itinerary.minutes', { count: minutes });
}

export function reservationTypeForActivity(activityType) {
  if (activityType === 'hotel') return 'accommodation';
  if (activityType === 'plane') return 'flight';
  if (activityType === 'car') return 'transport';
  if (activityType === 'ticket') return 'activity';
  return null;
}

function appendActivityToDate(itinerary, date, activity) {
  const existingDay = itinerary.find((day) => day.date === date);
  if (existingDay) {
    return itinerary.map((day) => day.id === existingDay.id
      ? { ...day, items: [...day.items, activity].sort(compareActivities), routePlan: null }
      : day);
  }
  return [...itinerary, { id: createId('day'), date, title: '', items: [activity], routePlan: null }]
    .sort((left, right) => left.date.localeCompare(right.date));
}

function cloneItinerary(itinerary) {
  return (itinerary || []).map((day) => ({ ...day, items: [...(day.items || [])] }));
}

function compareActivities(left, right) {
  return `${left.time || '99:99'}-${left.title || ''}`.localeCompare(`${right.time || '99:99'}-${right.title || ''}`);
}
function isIsoDate(value) { return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')); }
function toIsoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
