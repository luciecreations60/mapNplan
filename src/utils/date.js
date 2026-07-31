export function parseLocalDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (![year, month, day].every(Number.isFinite)) return null;
  return new Date(year, month - 1, day, 12, 0, 0);
}

export function getTripStatus(trip, today = new Date()) {
  const start = parseLocalDate(trip.startDate);
  const end = parseLocalDate(trip.endDate);
  if (!start || !end) return 'draft';

  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0);
  if (current < start) return 'upcoming';
  if (current > end) return 'past';
  return 'ongoing';
}

export function getDaysUntil(value, today = new Date()) {
  const target = parseLocalDate(value);
  if (!target) return 0;
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0);
  return Math.max(0, Math.ceil((target - current) / 86400000));
}

export function formatDateRange(startDate, endDate, locale = 'en-GB', fallback = 'Dates to be confirmed') {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  if (!start || !end) return fallback;

  const formatter = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

export function sortTripsByStartDate(trips) {
  return [...trips].sort((left, right) => {
    const leftDate = parseLocalDate(left.startDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const rightDate = parseLocalDate(right.startDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return leftDate - rightDate;
  });
}
