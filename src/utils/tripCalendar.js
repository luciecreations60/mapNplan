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
  const emittedStaySeries = new Set();
  const emittedStaySignatures = new Set();
  const itineraryActivityIds = new Set();
  const itinerarySeriesIds = new Set();

  for (const day of trip.itinerary || []) {
    for (const item of day.items || []) {
      if (!day.date) continue;
      if (item.id) itineraryActivityIds.add(String(item.id));
      if (item.seriesId) itinerarySeriesIds.add(String(item.seriesId));

      const isAccommodation = item.type === 'hotel';
      if (isAccommodation) {
        if (item.stayRole === 'stay' || item.stayRole === 'checkout') continue;
        if (item.seriesId && emittedStaySeries.has(String(item.seriesId))) continue;

        const stayStartDate = item.stayStartDate || day.date;
        const stayEndDate = item.stayEndDate || day.date;
        const signature = [
          String(item.title || '').trim().toLocaleLowerCase(),
          String(item.location || '').trim().toLocaleLowerCase(),
          stayStartDate,
          stayEndDate,
          item.checkInTime || item.time || '',
          item.checkOutTime || '',
        ].join('|');
        if (emittedStaySignatures.has(signature)) continue;
        emittedStaySignatures.add(signature);
        if (item.seriesId) emittedStaySeries.add(String(item.seriesId));
      }

      events.push({
        id: isAccommodation && item.seriesId ? `activity-series-${item.seriesId}` : `activity-${item.id}`,
        sourceId: item.id,
        dayId: day.id,
        source: 'activity',
        date: item.stayStartDate || day.date,
        time: isAccommodation ? (item.checkInTime || item.time || '') : (item.time || ''),
        endDate: isAccommodation ? (item.stayEndDate || day.date) : day.date,
        endTime: isAccommodation ? (item.checkOutTime || '') : (item.endTime || ''),
        title: item.title,
        subtitle: item.location || day.title || '',
        location: item.location || '',
        notes: item.notes || '',
        durationMinutes: isAccommodation ? 0 : Math.max(0, Number(item.durationMinutes) || 0),
        reminderMinutes: item.reminderMinutes ?? null,
        externalCalendarUid: item.externalCalendarUid || '',
        type: item.type || 'map',
        tab: 'itinerary',
        requiresTime: !isAccommodation,
        nonBlocking: isAccommodation,
      });
    }
  }

  for (const reservation of trip.reservations || []) {
    if (!reservation.startDate) continue;

    const isLinkedToItinerary = (
      reservation.sourceActivityId
      && itineraryActivityIds.has(String(reservation.sourceActivityId))
    ) || (
      reservation.sourceActivitySeriesId
      && itinerarySeriesIds.has(String(reservation.sourceActivitySeriesId))
    );
    if (isLinkedToItinerary) continue;

    const isAccommodation = reservation.type === 'accommodation';
    events.push({
      id: `reservation-${reservation.id}`,
      sourceId: reservation.id,
      source: 'reservation',
      date: reservation.startDate,
      time: reservation.startTime || '',
      endDate: reservation.endDate || reservation.startDate,
      endTime: reservation.endTime || '',
      title: reservation.title,
      subtitle: reservation.provider || reservation.location || '',
      location: reservation.location || '',
      notes: reservation.notes || '',
      durationMinutes: 0,
      reminderMinutes: reservation.reminderMinutes ?? null,
      externalCalendarUid: reservation.externalCalendarUid || '',
      type: reservation.type || 'activity',
      status: reservation.status,
      tab: 'reservations',
      requiresTime: !isAccommodation,
      nonBlocking: isAccommodation,
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
