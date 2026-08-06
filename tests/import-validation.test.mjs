import test from 'node:test';
import assert from 'node:assert/strict';
import { validateBackupPayload, validateSharedTripPayload } from '../src/services/validation/ImportValidationService.js';

test('accepts a compatible backup', () => {
  assert.deepEqual(validateBackupPayload({ format: 'travel-planner-backup', version: 2, trips: [], attachments: [] }), { trips: [], attachments: [], version: 2 });
});

test('rejects unsupported backup versions and remote attachment URLs', () => {
  assert.throws(() => validateBackupPayload({ format: 'travel-planner-backup', version: 99, trips: [] }), /not supported/);
  assert.throws(() => validateBackupPayload({ format: 'travel-planner-backup', version: 2, trips: [], attachments: [{ id: 'a', tripId: 't', documentId: 'd', dataUrl: 'https://example.com' }] }), /invalid binary data/);
});

test('shared snapshots require array collections', () => {
  const snapshot = { format: 'mapnplan-share', version: 1, trip: { name: 'Test', itinerary: [], reservations: [] } };
  assert.equal(validateSharedTripPayload(snapshot), snapshot);
  assert.throws(() => validateSharedTripPayload({ ...snapshot, trip: { name: 'Test', itinerary: {}, reservations: [] } }), /must be an array/);
});
