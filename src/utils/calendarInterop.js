import { createId } from './id.js';
import { parseLocalDate } from './date.js';

export const CALENDAR_REMINDER_OPTIONS = Object.freeze([null, 0, 10, 15, 30, 60, 120, 1440]);

export function getCalendarEventEnd(event) {
  const start = toLocalDateTime(event.date, event.time);
  if (!start) return null;

  const hasExplicitEnd = Boolean(event.endTime)
    || Boolean(event.endDate && event.endDate !== event.date);
  if (hasExplicitEnd) {
    const fallbackEndTime = event.endDate && event.endDate !== event.date ? '00:00' : event.time;
    const explicitEnd = toLocalDateTime(event.endDate || event.date, event.endTime || fallbackEndTime);
    if (explicitEnd) return explicitEnd;
  }

  const fallbackMinutes = Math.max(15, Number(event.durationMinutes) || 60);
  return new Date(start.getTime() + fallbackMinutes * 60_000);
}

export function analyseCalendarEvents(events, trip) {
  const issues = [];
  const conflicts = [];
  const startBoundary = parseLocalDate(trip.startDate);
  const endBoundary = parseLocalDate(trip.endDate);
  const timedEvents = [];

  for (const day of trip.itinerary || []) {
    if (day.date) continue;
    for (const item of day.items || []) {
      issues.push({
        id: `missing-date-activity-${item.id}`,
        type: 'missingDate',
        eventIds: [],
        sourceId: item.id,
        title: item.title,
        date: '',
      });
    }
  }

  for (const reservation of trip.reservations || []) {
    if (reservation.startDate) continue;
    issues.push({
      id: `missing-date-reservation-${reservation.id}`,
      type: 'missingDate',
      eventIds: [],
      sourceId: reservation.id,
      title: reservation.title,
      date: '',
    });
  }

  for (const event of events) {
    const start = toLocalDateTime(event.date, event.time);
    const end = getCalendarEventEnd(event);

    if (!event.time) {
      issues.push({ id: `missing-time-${event.id}`, type: 'missingTime', eventIds: [event.id], date: event.date });
    }

    const eventDay = parseLocalDate(event.date);
    if (eventDay && startBoundary && endBoundary && (eventDay < startBoundary || eventDay > endBoundary)) {
      issues.push({ id: `outside-trip-${event.id}`, type: 'outsideTrip', eventIds: [event.id], date: event.date });
    }

    if (start && end && end <= start) {
      issues.push({ id: `invalid-range-${event.id}`, type: 'invalidRange', eventIds: [event.id], date: event.date });
      continue;
    }

    if (start && end && event.time) timedEvents.push({ event, start, end });
  }

  const grouped = timedEvents.reduce((result, entry) => {
    result[entry.event.date] = [...(result[entry.event.date] || []), entry];
    return result;
  }, {});

  Object.entries(grouped).forEach(([date, entries]) => {
    const sorted = entries.sort((left, right) => left.start - right.start);
    for (let index = 0; index < sorted.length; index += 1) {
      for (let nextIndex = index + 1; nextIndex < sorted.length; nextIndex += 1) {
        const current = sorted[index];
        const next = sorted[nextIndex];
        if (next.start >= current.end) break;
        conflicts.push({
          id: `conflict-${current.event.id}-${next.event.id}`,
          type: 'conflict',
          eventIds: [current.event.id, next.event.id],
          date,
        });
      }
    }
  });

  return { conflicts, issues };
}

export function buildIcsCalendar({ trip, events, productId = '-//TripFlow//Travel planner//EN' }) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${productId}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(trip.name || 'Trip')}`,
  ];

  events.forEach((event) => {
    lines.push(...buildIcsEvent(event, trip));
  });

  lines.push('END:VCALENDAR');
  return lines.map(foldIcsLine).join('\r\n');
}

export function buildIcsEvent(event, trip) {
  const uid = event.externalCalendarUid || `${event.id}@tripflow.local`;
  const now = formatUtcDateTime(new Date());
  const startLine = formatIcsDateProperty('DTSTART', event.date, event.time);
  const endDate = event.endDate || event.date;
  const endTime = event.endTime || calculateEndTime(event);
  const endLine = formatIcsDateProperty('DTEND', endDate, endTime, !event.time);
  const description = [event.notes, trip.summary].filter(Boolean).join('\n\n');
  const lines = [
    'BEGIN:VEVENT',
    `UID:${escapeIcsText(uid)}`,
    `DTSTAMP:${now}`,
    startLine,
    endLine,
    `SUMMARY:${escapeIcsText(event.title || trip.name || 'Travel event')}`,
  ];

  if (event.location) lines.push(`LOCATION:${escapeIcsText(event.location)}`);
  if (description) lines.push(`DESCRIPTION:${escapeIcsText(description)}`);

  if (Number.isFinite(Number(event.reminderMinutes))) {
    const reminder = Math.max(0, Number(event.reminderMinutes));
    lines.push('BEGIN:VALARM');
    lines.push(`TRIGGER:-PT${reminder}M`);
    lines.push('ACTION:DISPLAY');
    lines.push(`DESCRIPTION:${escapeIcsText(event.title || 'Travel reminder')}`);
    lines.push('END:VALARM');
  }

  lines.push('END:VEVENT');
  return lines;
}

export function parseIcsCalendar(content) {
  const unfolded = String(content || '').replace(/\r?\n[ \t]/g, '');
  const lines = unfolded.split(/\r?\n/);
  const events = [];
  let current = null;
  let alarmTrigger = null;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      current = {};
      alarmTrigger = null;
      continue;
    }
    if (line === 'END:VEVENT') {
      if (current) {
        const normalized = normalizeImportedEvent(current, alarmTrigger);
        if (normalized) events.push(normalized);
      }
      current = null;
      continue;
    }
    if (!current) continue;

    const separatorIndex = line.indexOf(':');
    if (separatorIndex < 0) continue;
    const rawKey = line.slice(0, separatorIndex);
    const rawValue = line.slice(separatorIndex + 1);
    const [key, ...params] = rawKey.split(';');
    const upperKey = key.toUpperCase();

    if (upperKey === 'TRIGGER') {
      alarmTrigger = rawValue;
      continue;
    }

    if (['UID', 'SUMMARY', 'LOCATION', 'DESCRIPTION', 'DTSTART', 'DTEND'].includes(upperKey)) {
      current[upperKey] = { value: rawValue, params };
    }
  }

  return events;
}

export function importedEventsToItinerary(trip, importedEvents) {
  const nextItinerary = structuredClone(trip.itinerary || []);

  importedEvents.forEach((event) => {
    let day = nextItinerary.find((item) => item.date === event.date);
    if (!day) {
      day = {
        id: createId('day'),
        date: event.date,
        title: '',
        routePlan: null,
        items: [],
      };
      nextItinerary.push(day);
    }

    const duplicate = day.items.some((item) => (
      event.externalCalendarUid
      && item.externalCalendarUid === event.externalCalendarUid
    ));
    if (duplicate) return;

    day.items.push({
      id: createId('activity'),
      time: event.time,
      type: 'ticket',
      title: event.title,
      location: event.location,
      latitude: null,
      longitude: null,
      durationMinutes: event.durationMinutes,
      estimatedCost: 0,
      notes: event.notes,
      reminderMinutes: event.reminderMinutes,
      externalCalendarUid: event.externalCalendarUid,
      completedAt: null,
      comments: [],
    });
    day.items.sort((left, right) => (left.time || '99:99').localeCompare(right.time || '99:99'));
  });

  return nextItinerary.sort((left, right) => left.date.localeCompare(right.date));
}

export function createGoogleCalendarUrl(event, trip) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title || trip.name || 'Travel event',
    dates: buildExternalCalendarDates(event),
    details: [event.notes, trip.summary].filter(Boolean).join('\n\n'),
    location: event.location || '',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function createOutlookCalendarUrl(event, trip) {
  const start = toLocalDateTime(event.date, event.time || '00:00');
  const end = getCalendarEventEnd(event) || new Date(start.getTime() + 60 * 60_000);
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title || trip.name || 'Travel event',
    startdt: start.toISOString(),
    enddt: end.toISOString(),
    body: [event.notes, trip.summary].filter(Boolean).join('\n\n'),
    location: event.location || '',
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export function toLocalDateTime(dateValue, timeValue = '00:00') {
  if (!dateValue) return null;
  const [year, month, day] = String(dateValue).split('-').map(Number);
  const [hours, minutes] = String(timeValue || '00:00').split(':').map(Number);
  if (![year, month, day, hours, minutes].every(Number.isFinite)) return null;
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeImportedEvent(raw, alarmTrigger) {
  const start = parseIcsDateValue(raw.DTSTART);
  if (!start?.date) return null;
  const end = parseIcsDateValue(raw.DTEND);
  const startDate = toLocalDateTime(start.date, start.time || '00:00');
  const endDate = end?.date ? toLocalDateTime(end.date, end.time || '00:00') : null;
  const durationMinutes = startDate && endDate
    ? Math.max(15, Math.round((endDate - startDate) / 60_000))
    : 60;

  return {
    id: createId('calendar-import'),
    externalCalendarUid: unescapeIcsText(raw.UID?.value || ''),
    title: unescapeIcsText(raw.SUMMARY?.value || 'Imported event'),
    location: unescapeIcsText(raw.LOCATION?.value || ''),
    notes: unescapeIcsText(raw.DESCRIPTION?.value || ''),
    date: start.date,
    time: start.time || '',
    endDate: end?.date || start.date,
    endTime: end?.time || '',
    durationMinutes,
    reminderMinutes: parseAlarmTrigger(alarmTrigger),
  };
}

function parseIcsDateValue(entry) {
  if (!entry?.value) return null;
  const value = entry.value.trim();
  if (/^\d{8}$/.test(value)) {
    return { date: `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`, time: '' };
  }

  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?Z?$/);
  if (!match) return null;

  return {
    date: `${match[1]}-${match[2]}-${match[3]}`,
    time: `${match[4]}:${match[5]}`,
  };
}

function parseAlarmTrigger(value) {
  const match = String(value || '').match(/^-PT(\d+)M$/i);
  return match ? Number(match[1]) : null;
}

function formatIcsDateProperty(name, dateValue, timeValue, forceDateOnly = false) {
  const date = String(dateValue || '').replaceAll('-', '');
  if (!timeValue || forceDateOnly) {
    if (name === 'DTEND') {
      const nextDate = parseLocalDate(dateValue);
      nextDate?.setDate(nextDate.getDate() + 1);
      return `${name};VALUE=DATE:${nextDate ? dateToBasic(nextDate) : date}`;
    }
    return `${name};VALUE=DATE:${date}`;
  }
  const time = String(timeValue).replace(':', '').padEnd(4, '0');
  return `${name}:${date}T${time}00`;
}

function calculateEndTime(event) {
  if (!event.time) return '';
  const start = toLocalDateTime(event.date, event.time);
  const end = getCalendarEventEnd(event);
  if (!start || !end) return '';
  return `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
}

function buildExternalCalendarDates(event) {
  const startDate = String(event.date || '').replaceAll('-', '');
  if (!event.time) {
    const next = parseLocalDate(event.endDate || event.date);
    next?.setDate(next.getDate() + 1);
    return `${startDate}/${next ? dateToBasic(next) : startDate}`;
  }

  const end = getCalendarEventEnd(event);
  const startTime = String(event.time).replace(':', '').padEnd(4, '0');
  const endDate = end ? dateToBasic(end) : startDate;
  const endTime = end ? `${String(end.getHours()).padStart(2, '0')}${String(end.getMinutes()).padStart(2, '0')}` : startTime;
  return `${startDate}T${startTime}00/${endDate}T${endTime}00`;
}

function formatUtcDateTime(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function dateToBasic(date) {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
}

function escapeIcsText(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function unescapeIcsText(value) {
  return String(value || '')
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

function foldIcsLine(line) {
  if (line.length <= 73) return line;
  const chunks = [];
  let remaining = line;
  while (remaining.length > 73) {
    chunks.push(remaining.slice(0, 73));
    remaining = remaining.slice(73);
  }
  chunks.push(remaining);
  return chunks.join('\r\n ');
}
