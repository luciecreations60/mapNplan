import test from 'node:test';
import assert from 'node:assert/strict';
import { MemoryStorage } from './helpers/MemoryStorage.mjs';

globalThis.localStorage = new MemoryStorage();

const { tripService } = await import('../src/services/trips/TripService.js');
const { dataPortabilityService } = await import('../src/services/data/DataPortabilityService.js');
const { tripShareService } = await import('../src/services/share/TripShareService.js');
const { affiliateService } = await import('../src/services/affiliate/AffiliateService.js');
const { DEMO_TRIPS } = await import('../src/data/demoTrips.js');

test('release candidate supports the complete local trip lifecycle', () => {
  localStorage.clear();
  tripService.replaceAll([]);

  const created = tripService.create({
    name: 'Release journey',
    destination: 'Lyon',
    country: 'France',
    countryCode: 'FR',
    startDate: '2026-09-10',
    endDate: '2026-09-12',
    travelers: 2,
    currency: 'EUR',
    budget: 900,
  });

  assert.equal(created.schemaVersion, 18);
  assert.equal(created.travelParty.length, 2);

  const ownerId = created.travelParty.find((participant) => participant.isCurrentUser)?.id;
  const participantIds = created.travelParty.map((participant) => participant.id);
  const updated = tripService.update(created.id, {
    notes: 'Private release-candidate note',
    itinerary: [{
      id: 'day-release',
      date: '2026-09-10',
      title: 'Arrival',
      items: [{
        id: 'activity-release',
        time: '10:00',
        title: 'Old town walk',
        location: 'Vieux Lyon',
        durationMinutes: 120,
        estimatedCost: 20,
        notes: 'Private activity note',
        comments: [{ id: 'comment-release', authorName: 'Lucie', message: 'Private comment' }],
      }],
    }],
    expenses: [{
      id: 'expense-release',
      label: 'Hotel',
      amount: 300,
      paidAmount: 150,
      paidById: ownerId,
      splitBetweenIds: participantIds,
      category: 'accommodation',
    }],
    checklist: [{ id: 'check-release', label: 'Download tickets', completed: true }],
    reservations: [{
      id: 'reservation-release',
      type: 'accommodation',
      title: 'Hotel',
      confirmationNumber: 'PRIVATE-123',
      startDate: '2026-09-10',
      endDate: '2026-09-12',
      status: 'confirmed',
      notes: 'Private reservation note',
      comments: [{ id: 'comment-reservation', authorName: 'Lucie', message: 'Private comment' }],
    }],
    documents: [{
      id: 'document-release',
      type: 'booking',
      title: 'Hotel voucher',
      reference: 'PRIVATE-DOCUMENT',
      linkedReservationId: 'reservation-release',
      attachments: [{ id: 'attachment-release', name: 'voucher.pdf', type: 'application/pdf', size: 42 }],
    }],
  });

  assert.equal(updated.spent, 150);
  assert.equal(updated.checklistCompleted, 1);
  assert.equal(updated.documents[0].linkedReservationId, 'reservation-release');

  assert.equal(tripService.toggleFavorite(created.id).isFavorite, true);
  assert.ok(tripService.togglePinned(created.id).pinnedAt);
  assert.ok(tripService.archive(created.id).archivedAt);
  assert.equal(tripService.restore(created.id).archivedAt, null);

  const backup = dataPortabilityService.createBackup(tripService.getAll());
  const validated = dataPortabilityService.validatePayload(backup);
  tripService.replaceAll([]);
  const restored = tripService.replaceAll(validated.trips);
  assert.equal(restored.length, 1);
  assert.equal(restored[0].notes, 'Private release-candidate note');
  assert.equal(restored[0].documents[0].attachments[0].name, 'voucher.pdf');

  const publicSnapshot = tripShareService.createSnapshot(restored[0], {
    includeBudget: false,
    includeNotes: false,
    includeChecklist: true,
  });
  const serializedSnapshot = JSON.stringify(publicSnapshot);
  assert.equal(serializedSnapshot.includes('PRIVATE-123'), false);
  assert.equal(serializedSnapshot.includes('PRIVATE-DOCUMENT'), false);
  assert.equal(serializedSnapshot.includes('Private comment'), false);
  assert.equal(publicSnapshot.trip.budget, null);
  assert.equal(publicSnapshot.trip.notes, '');

  const duplicate = tripService.duplicate(restored[0].id, 'Release journey copy');
  assert.ok(duplicate);
  assert.deepEqual(duplicate.documents[0].attachments, []);
  assert.equal(duplicate.reservations[0].externalCalendarUid, '');
  assert.deepEqual(duplicate.reservations[0].comments, []);

  assert.equal(tripService.remove(restored[0].id), true);
  assert.equal(tripService.remove(duplicate.id), true);
  assert.deepEqual(tripService.getAll(), []);
});

test('demonstration trips normalize into coherent release-candidate data', () => {
  localStorage.clear();
  const normalized = tripService.replaceAll(structuredClone(DEMO_TRIPS));
  assert.ok(normalized.length > 0);

  for (const trip of normalized) {
    assert.equal(trip.schemaVersion, 18);
    assert.ok(trip.id);
    assert.ok(trip.name);
    assert.ok(trip.startDate <= trip.endDate);

    const reservationIds = new Set(trip.reservations.map((reservation) => reservation.id));
    const participantIds = new Set(trip.travelParty.map((participant) => participant.id));
    const ids = new Set();
    const register = (id) => {
      assert.ok(id, `Missing nested id in ${trip.id}`);
      assert.equal(ids.has(id), false, `Duplicate nested id ${id} in ${trip.id}`);
      ids.add(id);
    };

    trip.itinerary.forEach((day) => {
      register(day.id);
      assert.ok(day.date >= trip.startDate && day.date <= trip.endDate, `${day.date} is outside ${trip.id}`);
      day.items.forEach((item) => register(item.id));
    });
    trip.reservations.forEach((reservation) => register(reservation.id));
    trip.documents.forEach((document) => {
      register(document.id);
      if (document.linkedReservationId) assert.ok(reservationIds.has(document.linkedReservationId));
    });
    trip.checklist.forEach((item) => register(item.id));
    trip.savedPlaces.forEach((place) => register(place.id));
    trip.bookingOptions.forEach((option) => register(option.id));
    trip.expenses.forEach((expense) => {
      register(expense.id);
      if (expense.paidById) assert.ok(participantIds.has(expense.paidById));
      expense.splitBetweenIds.forEach((participantId) => assert.ok(participantIds.has(participantId)));
    });
  }
});

test('commercial providers remain disabled by default during the release candidate', () => {
  localStorage.clear();
  const settings = affiliateService.resetSettings();
  assert.ok(settings.providers.length > 0);
  assert.equal(settings.providers.some((provider) => provider.enabled), false);
});
