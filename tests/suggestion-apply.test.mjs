import assert from 'node:assert/strict';
import test from 'node:test';
import { applySuggestion, isApplicable } from '../src/utils/suggestionApply.js';

function buildTrip() {
  return {
    startDate: '2026-04-12',
    endDate: '2026-04-15',
    itinerary: [
      { id: 'day-1', date: '2026-04-12', items: [{ id: 'act-1', title: 'Calanques', time: '09:00', amount: 0 }] },
      { id: 'day-2', date: '2026-04-13', items: [] },
    ],
  };
}

test('a suggested place becomes an activity on the requested day', () => {
  const patch = applySuggestion(buildTrip(), {
    kind: 'place',
    title: 'Plage de Piantarella',
    body: '',
    payload: { title: 'Plage de Piantarella', location: 'Bonifacio', date: '2026-04-13' },
  });

  const day = patch.itinerary.find((entry) => entry.date === '2026-04-13');
  assert.equal(day.items.length, 1);
  assert.equal(day.items[0].title, 'Plage de Piantarella');
});

test('a suggested place without a date lands on the first day of the trip', () => {
  const patch = applySuggestion(buildTrip(), {
    kind: 'place',
    title: 'Citadelle',
    payload: { title: 'Citadelle' },
  });

  const day = patch.itinerary.find((entry) => entry.date === '2026-04-12');
  assert.ok(day.items.some((item) => item.title === 'Citadelle'));
});

test('a suggested time change edits only the targeted activity', () => {
  const patch = applySuggestion(buildTrip(), {
    kind: 'change',
    target_entity_id: 'act-1',
    payload: { field: 'time', value: '11:30' },
  });

  assert.equal(patch.itinerary[0].items[0].time, '11:30');
  assert.equal(patch.itinerary[0].items[0].title, 'Calanques');
});

test('a suggested price is stored as a number', () => {
  const patch = applySuggestion(buildTrip(), {
    kind: 'change',
    target_entity_id: 'act-1',
    payload: { field: 'amount', value: '42.50' },
  });

  assert.equal(patch.itinerary[0].items[0].amount, 42.5);
});

test('moving an activity to another day leaves the original day empty', () => {
  const patch = applySuggestion(buildTrip(), {
    kind: 'change',
    target_entity_id: 'act-1',
    payload: { field: 'date', value: '2026-04-13' },
  });

  assert.equal(patch.itinerary.find((day) => day.date === '2026-04-12').items.length, 0);
  assert.equal(patch.itinerary.find((day) => day.date === '2026-04-13').items[0].title, 'Calanques');
});

test('a comment is never applied to the trip', () => {
  assert.equal(isApplicable({ kind: 'comment', body: 'Joli spot' }), false);
  assert.equal(applySuggestion(buildTrip(), { kind: 'comment', body: 'Joli spot' }), null);
});

test('a suggestion cannot edit a field outside the allowed list', () => {
  const patch = applySuggestion(buildTrip(), {
    kind: 'change',
    target_entity_id: 'act-1',
    payload: { field: 'id', value: 'tampered' },
  });

  assert.equal(patch, null);
});

test('a suggestion targeting a missing activity changes nothing', () => {
  const patch = applySuggestion(buildTrip(), {
    kind: 'change',
    target_entity_id: 'does-not-exist',
    payload: { field: 'time', value: '10:00' },
  });

  assert.equal(patch, null);
});
