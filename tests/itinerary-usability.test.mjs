import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildTripDateRange,
  buildVisibleItineraryDays,
  combineDuration,
  getLastUsedItineraryDate,
  splitDuration,
  upsertActivityInItinerary,
} from '../src/utils/itinerary.js';
import { estimateRouteSegment } from '../src/utils/routeOptimization.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFile(path.join(root, relativePath), 'utf8');

test('the itinerary exposes every date between departure and return', () => {
  assert.deepEqual(buildTripDateRange('2026-08-01', '2026-08-04'), [
    '2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04',
  ]);
  const days = buildVisibleItineraryDays({ startDate: '2026-08-01', endDate: '2026-08-04', itinerary: [] });
  assert.equal(days.length, 4);
  assert.ok(days.every((day) => day.isVirtual));
});

test('generic activity creation defaults to the last day already used', () => {
  const trip = {
    startDate: '2026-08-01',
    itinerary: [
      { id: 'day-1', date: '2026-08-01', items: [{ id: 'a' }] },
      { id: 'day-3', date: '2026-08-03', items: [{ id: 'b' }] },
    ],
  };
  assert.equal(getLastUsedItineraryDate(trip), '2026-08-03');
});

test('an activity can be inserted into a previously empty trip date', () => {
  const next = upsertActivityInItinerary([], '2026-08-02', { id: 'activity-1', time: '10:00', title: 'Museum' });
  assert.equal(next.length, 1);
  assert.equal(next[0].date, '2026-08-02');
  assert.equal(next[0].items[0].id, 'activity-1');
});

test('hour and minute duration fields preserve the total duration', () => {
  assert.deepEqual(splitDuration(80), { hours: 1, minutes: 20 });
  assert.equal(combineDuration(1, 20), 80);
});

test('Blaincourt to Mâcon receives a plausible long-distance driving estimate', () => {
  const result = estimateRouteSegment(
    { id: 'blaincourt', latitude: 49.445, longitude: 2.354 },
    { id: 'macon', latitude: 46.3069, longitude: 4.8287 },
    'driving',
  );
  assert.ok(result.distanceKm > 300 && result.distanceKm < 550, `distance ${result.distanceKm}`);
  assert.ok(result.durationMinutes > 180 && result.durationMinutes < 480, `duration ${result.durationMinutes}`);
});

test('map selection, reservation files, extended weather and location padding are wired', async () => {
  const [mapPanel, reservations, weatherConfig, pagesCss] = await Promise.all([
    read('src/components/tripWorkspace/MapPanel.jsx'),
    read('src/components/tripWorkspace/ReservationsPanel.jsx'),
    read('src/config/external-services.config.js'),
    read('src/styles/pages.css'),
  ]);
  assert.match(mapPanel, /onMapClick=\{selectMapPoint\}/);
  assert.match(reservations, /attachmentStorageService\.saveFile/);
  assert.match(weatherConfig, /forecastDays:\s*16/);
  assert.match(pagesCss, /padding-inline:\s*44px 42px/);
});
