export function parseLocalDate(value) {
  if (!value) return null;
  const [year, month, day] = String(value).split('-').map(Number);
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

const DATE_STYLE_OPTIONS = Object.freeze({
  numeric: Object.freeze({ day: '2-digit', month: '2-digit', year: 'numeric' }),
  short: Object.freeze({ day: 'numeric', month: 'short', year: 'numeric' }),
  compact: Object.freeze({ weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
  long: Object.freeze({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
  dayMonth: Object.freeze({ day: 'numeric', month: 'short' }),
  monthYear: Object.freeze({ month: 'long', year: 'numeric' }),
});

/**
 * Central visible date formatter.
 *
 * Keeping every user-facing date here prevents raw ISO values and mixed
 * month/day ordering from appearing across the application.
 */
export function formatLocalizedDate(value, locale = 'en-GB', style = 'short', fallback = '—') {
  const date = value instanceof Date ? value : parseLocalDate(value);
  if (!date || Number.isNaN(date.getTime())) return fallback;
  const options = DATE_STYLE_OPTIONS[style] || DATE_STYLE_OPTIONS.short;
  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function formatLocalizedDateTime(value, locale = 'en-GB', fallback = '—') {
  if (!value) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(date);
}

export function formatLocalizedTime(value, fallback = '—') {
  const normalized = String(value || '').trim();
  return /^\d{2}:\d{2}$/.test(normalized) ? normalized : fallback;
}

export function formatDateRange(startDate, endDate, locale = 'en-GB', fallback = 'Dates to be confirmed') {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  if (!start || !end) return fallback;
  return `${formatLocalizedDate(start, locale, 'short')} – ${formatLocalizedDate(end, locale, 'short')}`;
}

export function sortTripsByStartDate(trips) {
  return [...trips].sort((left, right) => {
    const leftDate = parseLocalDate(left.startDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const rightDate = parseLocalDate(right.startDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return leftDate - rightDate;
  });
}
