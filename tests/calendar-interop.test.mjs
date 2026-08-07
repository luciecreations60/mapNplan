import test from 'node:test';
import assert from 'node:assert/strict';
import { buildIcsCalendar, parseIcsCalendar } from '../src/utils/calendarInterop.js';

test('ICS round trip retains the event', () => {
  const trip = { id: 'trip', name: 'Paris', destination: 'Paris' };
  const event = { id: 'event', title: 'Museum', date: '2026-08-02', startTime: '10:00', endTime: '11:30', location: 'Paris', notes: 'Tickets' };
  const parsed = parseIcsCalendar(buildIcsCalendar({ trip, events: [event] }));
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].title, 'Museum');
  assert.equal(parsed[0].date, '2026-08-02');
});
