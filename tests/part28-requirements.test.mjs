import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  upsertActivityAcrossDates,
  upsertItineraryDayTitle,
} from '../src/utils/itinerary.js';
import {
  getBudgetedItineraryActivities,
  getUnlinkedBudgetedActivities,
} from '../src/utils/activityExpenses.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFile(path.join(root, relativePath), 'utf8');

test('remote trip covers are forced to cover without tiling', async () => {
  const [hero, card] = await Promise.all([
    read('src/components/tripWorkspace/TripHero.jsx'),
    read('src/components/trips/TripCard.jsx'),
  ]);
  for (const source of [hero, card]) {
    assert.match(source, /backgroundSize:\s*'cover'/);
    assert.match(source, /backgroundRepeat:\s*'no-repeat'/);
    assert.match(source, /backgroundPosition:\s*'center'/);
  }
});

test('itinerary day subtitle is editable and activity editing renders inline', async () => {
  const panel = await read('src/components/tripWorkspace/ItineraryPanel.jsx');
  assert.match(panel, /upsertItineraryDayTitle/);
  assert.match(panel, /itinerary\.editDayTitle/);
  assert.match(panel, /itinerary-day-title-editor/);
  assert.match(panel, /renderActivityForm\('itinerary-form-card--inline'\)/);
  assert.doesNotMatch(panel, /openEditForm[\s\S]{0,160}scrollToCreateForm\(\)/);
});

test('day subtitle can be stored even for a previously virtual day', () => {
  const updated = upsertItineraryDayTitle([], '2026-08-28', 'Arrivée et quartier');
  assert.equal(updated.length, 1);
  assert.equal(updated[0].date, '2026-08-28');
  assert.equal(updated[0].title, 'Arrivée et quartier');
});

test('linked reservation button navigates to the reservations tab and focuses the reservation', async () => {
  const [itinerary, page, reservations] = await Promise.all([
    read('src/components/tripWorkspace/ItineraryPanel.jsx'),
    read('src/pages/TripWorkspacePage.jsx'),
    read('src/components/tripWorkspace/ReservationsPanel.jsx'),
  ]);
  assert.match(itinerary, /onOpenReservation\?\.\(existing\.id\)/);
  assert.match(itinerary, /itinerary\.openLinkedReservation/);
  assert.match(page, /nextParams\.set\('tab', 'reservations'\)/);
  assert.match(page, /nextParams\.set\('reservation', reservationId\)/);
  assert.match(page, /focusedReservationId=\{searchParams\.get\('reservation'\)\}/);
  assert.match(reservations, /reservation-\$\{focusedReservationId\}/);
  assert.match(reservations, /scrollIntoView/);
});

test('map marker tip is anchored to the exact coordinate', async () => {
  const [map, language, styles] = await Promise.all([
    read('src/components/tripWorkspace/TripMap.jsx'),
    read('src/utils/mapLanguage.js'),
    read('src/styles/pages.css'),
  ]);
  assert.match(map, /new maplibregl\.Marker\(\{ element, anchor: 'bottom' \}\)/);
  assert.match(language, /maplibre-point-marker__visual/);
  assert.match(styles, /\.maplibre-point-marker__visual::after/);
});

test('multi-day accommodation appears on every requested day with one shared budget', () => {
  const itinerary = upsertActivityAcrossDates([], '2026-08-28', '2026-08-30', {
    id: 'hotel-source',
    type: 'hotel',
    title: 'Hôtel test',
    time: '15:00',
    estimatedCost: 300,
  });

  assert.deepEqual(itinerary.map((day) => day.date), ['2026-08-28', '2026-08-29', '2026-08-30']);
  const items = itinerary.flatMap((day) => day.items);
  assert.equal(items.length, 3);
  assert.ok(items.every((item) => item.seriesId === items[0].seriesId));
  assert.ok(items.every((item) => item.stayStartDate === '2026-08-28'));
  assert.ok(items.every((item) => item.stayEndDate === '2026-08-30'));
  assert.equal(items.reduce((sum, item) => sum + item.estimatedCost, 0), 300);

  const originalMiddleId = itinerary[1].items[0].id;
  const edited = upsertActivityAcrossDates(itinerary, '2026-08-28', '2026-08-30', {
    ...itinerary[1].items[0],
    title: 'Hôtel modifié',
    estimatedCost: 330,
  }, { dayId: itinerary[1].id, activityId: originalMiddleId });
  assert.equal(edited[1].items[0].id, originalMiddleId);
  assert.equal(edited.flatMap((day) => day.items).reduce((sum, item) => sum + item.estimatedCost, 0), 330);
});

test('itinerary budget activities are proposed once as equal-split expense candidates', async () => {
  const trip = {
    itinerary: [
      { date: '2026-08-28', items: [{ id: 'ferry', type: 'car', title: 'Ferry', estimatedCost: 120 }] },
      { date: '2026-08-29', items: [{ id: 'hotel-1', seriesId: 'stay-1', type: 'hotel', title: 'Hôtel', estimatedCost: 300, stayStartDate: '2026-08-29' }] },
      { date: '2026-08-30', items: [{ id: 'hotel-2', seriesId: 'stay-1', type: 'hotel', title: 'Hôtel', estimatedCost: 0, stayStartDate: '2026-08-29' }] },
    ],
    expenses: [],
  };

  const candidates = getBudgetedItineraryActivities(trip);
  assert.equal(candidates.length, 2);
  assert.equal(candidates.find((item) => item.activityId === 'ferry').category, 'transport');
  assert.equal(candidates.find((item) => item.seriesId === 'stay-1').amount, 300);
  assert.equal(getUnlinkedBudgetedActivities(trip).length, 2);

  trip.expenses.push({ sourceActivityId: 'ferry' });
  const remaining = getUnlinkedBudgetedActivities(trip);
  assert.equal(remaining.length, 1);
  assert.equal(remaining[0].seriesId, 'stay-1');

  const panel = await read('src/components/tripWorkspace/SharedExpensesPanel.jsx');
  assert.match(panel, /name="sourceActivityId"/);
  assert.match(panel, /suggestedActivityExpenses/);
  assert.match(panel, /splitBetweenIds:\s*participants\.map/);
  assert.match(panel, /splitMode:\s*'equal'/);
});

test('map add flow also supports a start and end date for accommodation', async () => {
  const mapPanel = await read('src/components/tripWorkspace/MapPanel.jsx');
  assert.match(mapPanel, /upsertActivityAcrossDates/);
  assert.match(mapPanel, /name="endDate"/);
  assert.match(mapPanel, /form\.type === 'hotel'/);
});
