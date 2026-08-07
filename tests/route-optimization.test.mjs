import test from 'node:test';
import assert from 'node:assert/strict';
import { haversineDistanceKm, optimizeDayRoute, restorePreviousDayRoute } from '../src/utils/routeOptimization.js';

test('distance is zero for identical coordinates', () => {
  assert.equal(haversineDistanceKm({ latitude: 48.85, longitude: 2.35 }, { latitude: 48.85, longitude: 2.35 }), 0);
});

test('optimized route can be restored', () => {
  const day = { id: 'day', date: '2026-08-01', routePlan: {}, items: [
    { id: 'a', time: '09:00', latitude: 48.8566, longitude: 2.3522, durationMinutes: 60 },
    { id: 'b', time: '11:00', latitude: 48.8606, longitude: 2.3376, durationMinutes: 60 },
    { id: 'c', time: '13:00', latitude: 48.8530, longitude: 2.3499, durationMinutes: 60 },
  ] };
  const optimized = optimizeDayRoute(day, { mode: 'walking', startStrategy: 'firstActivity', startTime: '09:00' });
  assert.equal(optimized.changed, true);
  const restored = restorePreviousDayRoute(optimized.day);
  assert.equal(restored.changed, true);
  assert.deepEqual(restored.day.items.map((item) => item.id), ['a', 'b', 'c']);
  assert.deepEqual(restored.day.items.map((item) => item.time), ['09:00', '11:00', '13:00']);
});
