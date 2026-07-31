import { parseLocalDate } from './date.js';

export function toDateKey(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTripCalendarEvents(trip) {
  const events = [];

  for (const day of trip.itinerary || []) {
    for (const item of day.items || []) {
      if (!day.date) continue;
      events.push({
        id: `activity-${item.id}`,
        sourceId: item.id,
        source: 'activity',
        date: day.date,
        time: item.time || '',
        title: item.title,
        subtitle: item.location || day.title || '',
        type: item.type || 'map',
        tab: 'itinerary',
      });
    }
  }

  for (const reservation of trip.reservations || []) {
    if (!reservation.startDate) continue;
    events.push({
      id: `reservation-${reservation.id}`,
      sourceId: reservation.id,
      source: 'reservation',
      date: reservation.startDate,
      time: reservation.startTime || '',
      title: reservation.title,
      subtitle: reservation.provider || reservation.location || '',
      type: reservation.type || 'activity',
      status: reservation.status,
      tab: 'reservations',
    });
  }

  return events.sort((left, right) => (
    `${left.date}T${left.time || '00:00'}`.localeCompare(`${right.date}T${right.time || '00:00'}`)
  ));
}

export function getInitialCalendarMonth(trip, today = new Date()) {
  const start = parseLocalDate(trip.startDate);
  const end = parseLocalDate(trip.endDate);
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  if (!start) return currentMonth;

  const currentDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  if (end && currentDay >= start && currentDay <= end) return currentMonth;
  return new Date(start.getFullYear(), start.getMonth(), 1);
}

export function shiftCalendarMonth(month, amount) {
  return new Date(month.getFullYear(), month.getMonth() + amount, 1);
}

export function buildCalendarGrid(month, weekStartsOnMonday = true) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  const nativeWeekday = firstDay.getDay();
  const leadingDays = weekStartsOnMonday ? (nativeWeekday + 6) % 7 : nativeWeekday;
  const gridStart = new Date(year, monthIndex, 1 - leadingDays);
  const totalCells = Math.ceil((leadingDays + lastDay.getDate()) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return {
      date,
      key: toDateKey(date),
      isCurrentMonth: date.getMonth() === monthIndex,
    };
  });
}
