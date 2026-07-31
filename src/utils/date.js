const DAY_IN_MS = 86_400_000;

export function toLocalDate(dateValue) {
  if (!dateValue) return null;
  return new Date(`${dateValue}T12:00:00`);
}

export function getTripStatus(trip, referenceDate = new Date()) {
  const start = toLocalDate(trip.startDate);
  const end = toLocalDate(trip.endDate);
  const today = new Date(referenceDate);
  today.setHours(12, 0, 0, 0);

  if (!start || !end) return 'draft';
  if (today < start) return 'upcoming';
  if (today > end) return 'past';
  return 'ongoing';
}

export function getDaysUntil(dateValue, referenceDate = new Date()) {
  const target = toLocalDate(dateValue);
  if (!target) return null;

  const today = new Date(referenceDate);
  today.setHours(12, 0, 0, 0);
  return Math.max(0, Math.ceil((target - today) / DAY_IN_MS));
}

export function formatDateRange(startDate, endDate, locale = 'en-GB') {
  const start = toLocalDate(startDate);
  const end = toLocalDate(endDate);
  if (!start || !end) return 'Dates to be confirmed';

  const formatter = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return `${formatter.format(start)} — ${formatter.format(end)}`;
}

export function sortTripsByStartDate(trips) {
  return [...trips].sort(
    (first, second) => toLocalDate(first.startDate) - toLocalDate(second.startDate),
  );
}
