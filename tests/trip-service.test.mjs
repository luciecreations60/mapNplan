import test from 'node:test';
import assert from 'node:assert/strict';
import { MemoryStorage } from './helpers/MemoryStorage.mjs';

globalThis.localStorage = new MemoryStorage();
const { tripService } = await import('../src/services/trips/TripService.js');

test('legacy trips are migrated and normalized without losing notes', () => {
  localStorage.setItem('tripflow:trips', JSON.stringify([{ id: 'legacy', name: ' Legacy ', travelers: 0, currency: 'eur', itinerary: [{ id: 'd', date: '2026-08-01', items: [{ id: 'i', title: 'Place', latitude: 120, longitude: 220 }] }], notes: 'keep me' }]));
  const [trip] = tripService.getAll();
  assert.equal(trip.schemaVersion, 16);
  assert.equal(trip.name, 'Legacy');
  assert.equal(trip.travelers, 1);
  assert.equal(trip.currency, 'EUR');
  assert.equal(trip.notes, 'keep me');
  assert.equal(trip.itinerary[0].items[0].latitude, null);
  assert.equal(trip.itinerary[0].items[0].longitude, null);
});

test('duplicate regenerates nested ids and drops private files', () => {
  tripService.replaceAll([{ id: 'source', name: 'Source', travelers: 1, itinerary: [{ id: 'day', date: '2026-08-01', items: [{ id: 'activity', title: 'Museum' }] }], documents: [{ id: 'document', title: 'Ticket', attachments: [{ id: 'attachment', name: 'ticket.pdf' }] }] }]);
  const duplicate = tripService.duplicate('source', 'Copy');
  assert.notEqual(duplicate.id, 'source');
  assert.notEqual(duplicate.itinerary[0].id, 'day');
  assert.notEqual(duplicate.itinerary[0].items[0].id, 'activity');
  assert.deepEqual(duplicate.documents[0].attachments, []);
});
