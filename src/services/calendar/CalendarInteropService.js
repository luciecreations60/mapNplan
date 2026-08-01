import {
  buildIcsCalendar,
  buildIcsEvent,
  createGoogleCalendarUrl,
  createOutlookCalendarUrl,
  parseIcsCalendar,
} from '../../utils/calendarInterop.js';

class CalendarInteropService {
  exportTrip(trip, events) {
    const content = buildIcsCalendar({ trip, events });
    this.#download(`${this.#slugify(trip.name)}-calendar.ics`, content);
  }

  exportDay(trip, events, date) {
    const content = buildIcsCalendar({ trip, events });
    this.#download(`${this.#slugify(trip.name)}-${date}.ics`, content);
  }

  exportEvent(trip, event) {
    const content = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TripFlow//Travel planner//EN',
      'CALSCALE:GREGORIAN',
      ...buildIcsEvent(event, trip),
      'END:VCALENDAR',
    ].join('\r\n');
    this.#download(`${this.#slugify(event.title || trip.name)}.ics`, content);
  }

  openGoogleCalendar(trip, event) {
    window.open(createGoogleCalendarUrl(event, trip), '_blank', 'noopener,noreferrer');
  }

  openOutlookCalendar(trip, event) {
    window.open(createOutlookCalendarUrl(event, trip), '_blank', 'noopener,noreferrer');
  }

  async importFile(file) {
    const content = await file.text();
    return parseIcsCalendar(content);
  }

  #download(filename, content) {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  #slugify(value) {
    return String(value || 'tripflow')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'tripflow';
  }
}

export const calendarInteropService = new CalendarInteropService();
