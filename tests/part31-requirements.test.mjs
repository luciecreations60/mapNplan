import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { evaluateMoneyExpression } from '../src/utils/moneyExpression.js';
import { buildParticipantBalances, buildSettlementSuggestions } from '../src/utils/sharedExpenses.js';
import { getTripCalendarEvents } from '../src/utils/tripCalendar.js';
import { analyseCalendarEvents } from '../src/utils/calendarInterop.js';
import { estimateDrivingCost, getSuggestedConsumption } from '../src/utils/transportCost.js';

const read = (path) => fs.readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('money expressions accept x and percentages and surface the expected result', () => {
  assert.equal(evaluateMoneyExpression('(693-(693x10%))+7+(196x3)'), 1218.7);
  assert.equal(evaluateMoneyExpression('100x10%'), 10);
  assert.equal(evaluateMoneyExpression('not a calculation'), null);
});

test('overpayments are refunded to the traveller who paid too much instead of being rerouted', () => {
  const travelParty = [
    { id: 'one', name: 'Lucie' },
    { id: 'two', name: 'Meggie' },
    { id: 'three', name: 'Richard' },
  ];
  const trip = {
    travelParty,
    expenses: [
      { id: 'camp-1', amount: 1022.7, paidAmount: 1022.7, paidById: 'one', splitBetweenIds: travelParty.map(({ id }) => id) },
      { id: 'camp-2', amount: 655.2, paidAmount: 655.2, paidById: 'one', splitBetweenIds: travelParty.map(({ id }) => id) },
    ],
    settlements: [
      { id: 'repayment', fromParticipantId: 'two', toParticipantId: 'one', amount: 1002.5 },
    ],
  };

  assert.deepEqual(buildParticipantBalances(trip).map(({ id, balance }) => ({ id, balance })), [
    { id: 'one', balance: 116.1 },
    { id: 'two', balance: 443.2 },
    { id: 'three', balance: -559.3 },
  ]);
  assert.deepEqual(buildSettlementSuggestions(trip), [
    { fromParticipantId: 'three', fromName: 'Richard', toParticipantId: 'one', toName: 'Lucie', amount: 559.3 },
    { fromParticipantId: 'one', fromName: 'Lucie', toParticipantId: 'two', toName: 'Meggie', amount: 443.2 },
  ]);
});

test('multi-day accommodation is one non-blocking calendar event without false missing-time warnings', () => {
  const trip = {
    startDate: '2026-08-28',
    endDate: '2026-09-13',
    reservations: [],
    itinerary: [
      { id: 'd1', date: '2026-08-29', items: [{ id: 'h1', seriesId: 'stay-1', type: 'hotel', stayRole: 'checkin', stayStartDate: '2026-08-29', stayEndDate: '2026-09-05', checkInTime: '23:00', checkOutTime: '10:00', title: 'Camping Kalliste', location: 'Corse' }] },
      { id: 'd2', date: '2026-08-30', items: [{ id: 'h2', seriesId: 'stay-1', type: 'hotel', stayRole: 'stay', stayStartDate: '2026-08-29', stayEndDate: '2026-09-05', title: 'Camping Kalliste', location: 'Corse' }] },
      { id: 'd3', date: '2026-09-05', items: [{ id: 'h3', seriesId: 'stay-1', type: 'hotel', stayRole: 'checkout', stayStartDate: '2026-08-29', stayEndDate: '2026-09-05', checkOutTime: '10:00', title: 'Camping Kalliste', location: 'Corse' }] },
    ],
  };
  const events = getTripCalendarEvents(trip);
  assert.equal(events.length, 1);
  assert.equal(events[0].date, '2026-08-29');
  assert.equal(events[0].endDate, '2026-09-05');
  assert.equal(events[0].requiresTime, false);
  assert.equal(events[0].nonBlocking, true);
  assert.deepEqual(analyseCalendarEvents(events, trip), { conflicts: [], issues: [] });
});

test('driving cost estimator combines fuel and toll assumptions', () => {
  assert.equal(getSuggestedConsumption('compact', 'diesel'), 5.9);
  assert.deepEqual(estimateDrivingCost({
    distanceKm: 500,
    consumptionLPer100Km: 6,
    fuelPricePerLiter: 1.8,
    tolls: 30,
  }), {
    distanceKm: 500,
    fuelLiters: 30,
    fuelCost: 54,
    tolls: 30,
    total: 84,
  });
});

test('Part 31 keeps desktop navigation visible and saves an itinerary item before comparing', async () => {
  const [tabs, itinerary, explore, tripForm, styles, map, sharedExpenses] = await Promise.all([
    read('src/components/tripWorkspace/TripTabs.jsx'),
    read('src/components/tripWorkspace/ItineraryPanel.jsx'),
    read('src/pages/ExplorePage.jsx'),
    read('src/components/trips/TripFormDialog.jsx'),
    read('src/styles/pages.css'),
    read('src/components/tripWorkspace/TripMap.jsx'),
    read('src/components/tripWorkspace/SharedExpensesPanel.jsx'),
  ]);

  assert.match(tabs, /trip-subnav__desktop/);
  assert.match(tabs, /trip-subnav__mobile/);
  assert.match(itinerary, /saveAndCompare/);
  assert.match(itinerary, /itinerary\.addAndCompare/);
  assert.doesNotMatch(itinerary, /BookingContextCard/);
  assert.doesNotMatch(itinerary, /lastDayHint/);
  assert.match(explore, /explore\.addIdeaToTrips/);
  assert.match(explore, /<CreateTripDialog/);
  assert.match(tripForm, /DateRangeField/);
  assert.match(tripForm, /TripAccentPicker/);
  assert.match(styles, /\.modal--large/);
  assert.match(styles, /\.itinerary-item--hotel/);
  assert.match(map, /lastViewportSignatureRef/);
  assert.match(sharedExpenses, /invalidCalculation/);
});
