import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { getTripCalendarEvents } from '../src/utils/tripCalendar.js';
import { evaluateMoneyExpression } from '../src/utils/moneyExpression.js';

test('money expressions keep x and percentages working', () => {
  assert.equal(evaluateMoneyExpression('(693-(693x10%))+7+(196x3)'), 1218.7);
});

test('calendar emits one event for one multi-day accommodation series', () => {
  const trip = {
    itinerary: [
      { id: 'd1', date: '2026-08-29', items: [{ id: 'a1', seriesId: 's1', stayRole: 'checkin', type: 'hotel', title: 'Camping Kaliste', location: 'Saint-Florent', stayStartDate: '2026-08-29', stayEndDate: '2026-09-05', checkInTime: '23:00', checkOutTime: '10:00' }] },
      { id: 'd2', date: '2026-08-30', items: [{ id: 'a2', seriesId: 's1', stayRole: 'stay', type: 'hotel', title: 'Camping Kaliste', location: 'Saint-Florent', stayStartDate: '2026-08-29', stayEndDate: '2026-09-05' }] },
      { id: 'd3', date: '2026-09-05', items: [{ id: 'a3', seriesId: 's1', stayRole: 'checkout', type: 'hotel', title: 'Camping Kaliste', location: 'Saint-Florent', stayStartDate: '2026-08-29', stayEndDate: '2026-09-05', checkOutTime: '10:00' }] },
    ],
    reservations: [],
  };
  const events = getTripCalendarEvents(trip);
  assert.equal(events.length, 1);
  assert.equal(events[0].title, 'Camping Kaliste');
  assert.equal(events[0].date, '2026-08-29');
  assert.equal(events[0].endDate, '2026-09-05');
});

test('linked reservation does not duplicate its itinerary activity in calendar', () => {
  const trip = {
    itinerary: [{ id: 'd1', date: '2026-08-29', items: [{ id: 'a1', seriesId: 's1', stayRole: 'checkin', type: 'hotel', title: 'Camping Kaliste', stayStartDate: '2026-08-29', stayEndDate: '2026-09-05', checkInTime: '23:00' }] }],
    reservations: [{ id: 'r1', type: 'accommodation', title: 'Camping Kaliste', startDate: '2026-08-29', endDate: '2026-09-05', startTime: '23:00', sourceActivityId: 'a1', sourceActivitySeriesId: 's1' }],
  };
  assert.equal(getTripCalendarEvents(trip).length, 1);
});

test('trip form no longer exposes country code and uses short date placeholder', () => {
  const source = fs.readFileSync(new URL('../src/components/trips/TripFormDialog.jsx', import.meta.url), 'utf8');
  assert.equal(source.includes('id="trip-country-code"'), false);
  assert.equal(source.includes("dateRangePlaceholder"), true);
});

test('map language no longer listens to styledata', () => {
  const source = fs.readFileSync(new URL('../src/components/tripWorkspace/TripMap.jsx', import.meta.url), 'utf8');
  assert.equal(source.includes("map.on('styledata'"), false);
});
