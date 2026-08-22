import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeTripsByRecency } from '../src/utils/tripMerge.js';

test('the most recently updated version of a trip wins', () => {
  const local = [{ id: 'trip-1', title: 'Corse', updatedAt: '2026-04-10T10:00:00.000Z' }];
  const remote = [{ id: 'trip-1', title: 'Corse (modifié)', updatedAt: '2026-04-10T12:00:00.000Z' }];

  const merged = mergeTripsByRecency(local, remote);

  assert.equal(merged.length, 1);
  assert.equal(merged[0].title, 'Corse (modifié)');
});

test('a local edit newer than the server copy is preserved', () => {
  const local = [{ id: 'trip-1', title: 'Corse (local)', updatedAt: '2026-04-10T14:00:00.000Z' }];
  const remote = [{ id: 'trip-1', title: 'Corse', updatedAt: '2026-04-10T12:00:00.000Z' }];

  assert.equal(mergeTripsByRecency(local, remote)[0].title, 'Corse (local)');
});

test('trips existing on only one side are all kept', () => {
  const local = [{ id: 'trip-1', updatedAt: '2026-04-10T10:00:00.000Z' }];
  const remote = [{ id: 'trip-2', updatedAt: '2026-04-10T10:00:00.000Z' }];

  const ids = mergeTripsByRecency(local, remote).map((trip) => trip.id).sort();

  assert.deepEqual(ids, ['trip-1', 'trip-2']);
});

test('a trip shared by someone else is adopted from the server on first sync', () => {
  const shared = { id: 'trip-shared', title: 'Voyage de groupe', updatedAt: '2026-04-10T10:00:00.000Z' };

  const merged = mergeTripsByRecency([], [shared]);

  assert.equal(merged.length, 1);
  assert.equal(merged[0].id, 'trip-shared');
});
