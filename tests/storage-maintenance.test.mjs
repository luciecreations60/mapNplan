import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildValidDocumentKeys,
  estimateJsonBytes,
  findOrphanAttachmentIds,
  summarizeTripVolume,
} from '../src/utils/storageMaintenance.js';

test('storage maintenance finds only attachments without a valid document parent', () => {
  const trips = [{ id: 'trip-1', documents: [{ id: 'doc-1' }] }];
  const attachments = [
    { id: 'file-1', tripId: 'trip-1', documentId: 'doc-1' },
    { id: 'file-2', tripId: 'trip-1', documentId: 'doc-missing' },
    { id: 'file-3', tripId: 'trip-missing', documentId: 'doc-1' },
  ];
  assert.deepEqual([...buildValidDocumentKeys(trips)], ['trip-1:doc-1']);
  assert.deepEqual(findOrphanAttachmentIds(attachments, trips), ['file-2', 'file-3']);
});

test('storage volume summary remains content-neutral', () => {
  const summary = summarizeTripVolume([{
    id: 'trip-1',
    itinerary: [{ items: [{}, {}] }, { items: [{}] }],
    reservations: [{}, {}], documents: [{}], expenses: [{}, {}, {}],
  }]);
  assert.deepEqual(summary, {
    trips: 1, days: 2, activities: 3, reservations: 2, documents: 1, expenses: 3,
  });
  assert.ok(estimateJsonBytes({ label: 'é' }) > 0);
});
