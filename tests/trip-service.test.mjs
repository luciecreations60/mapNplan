import test from 'node:test';
import assert from 'node:assert/strict';
import { MemoryStorage } from './helpers/MemoryStorage.mjs';

globalThis.localStorage = new MemoryStorage();
const { tripService } = await import('../src/services/trips/TripService.js');

test('current trip records are normalized without losing notes', () => {
  localStorage.setItem('mapnplan:trip-library', JSON.stringify([{ id: 'current', name: ' Current ', travelers: 0, currency: 'eur', itinerary: [{ id: 'd', date: '2026-08-01', items: [{ id: 'i', title: 'Place', latitude: 120, longitude: 220 }] }], notes: 'keep me' }]));
  const [trip] = tripService.getAll();
  assert.equal(trip.schemaVersion, 20);
  assert.equal(trip.name, 'Current');
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


test('destination coordinates fall back to the first mapped itinerary place', () => {
  tripService.replaceAll([{
    id: 'mapped-destination',
    name: 'Mapped trip',
    destination: 'Ireland',
    travelers: 1,
    itinerary: [{ id: 'day-1', date: '2026-09-01', items: [{ id: 'place-1', title: 'Dublin', latitude: 53.3498, longitude: -6.2603 }] }],
  }]);
  const [trip] = tripService.getAll();
  assert.equal(trip.destinationLatitude, 53.3498);
  assert.equal(trip.destinationLongitude, -6.2603);
});

test('clean test storage ignores and removes the former local trip key', () => {
  localStorage.setItem('mapnplan:trips', JSON.stringify([{ id: 'obsolete', name: 'Obsolete' }]));
  localStorage.removeItem('mapnplan:trip-library');
  assert.deepEqual(tripService.getAll(), []);
  assert.equal(localStorage.getItem('mapnplan:trips'), null);
});
