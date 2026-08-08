import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateMoneyExpression, normalizeMoneyExpression } from '../src/utils/moneyExpression.js';
import { upsertActivityAcrossDates } from '../src/utils/itinerary.js';
import { getSavedPlaceLists } from '../src/utils/savedPlaces.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFile(path.join(root, relativePath), 'utf8');

test('itinerary location precedes the generated title and per-day addition stays inline', async () => {
  const panel = await read('src/components/tripWorkspace/ItineraryPanel.jsx');
  const locationIndex = panel.indexOf("label={t('itinerary.location')}");
  const titleIndex = panel.indexOf("label={t('itinerary.titleLabel')}");
  assert.ok(locationIndex >= 0 && titleIndex > locationIndex);
  assert.match(panel, /updateLocationText/);
  assert.match(panel, /titleAutofilled/);
  assert.match(panel, /itinerary-day__inline-add/);
  assert.match(panel, /openCreateForm\(day\.date, 'day'\)/);
  assert.match(panel, /if \(placement !== 'day'\) scrollToCreateForm\(\)/);
});

test('accommodation occurrences use check-in only on the first day and check-out only on the last', () => {
  const itinerary = upsertActivityAcrossDates([], '2026-08-28', '2026-08-31', {
    id: 'stay', type: 'hotel', title: 'Camping', location: 'Calvi',
    time: '23:00', checkInTime: '23:00', checkOutTime: '10:00', estimatedCost: 420,
  });
  const items = itinerary.flatMap((day) => day.items);
  assert.deepEqual(items.map((item) => item.stayRole), ['checkin', 'stay', 'stay', 'checkout']);
  assert.deepEqual(items.map((item) => item.time), ['23:00', '', '', '10:00']);
  assert.ok(items.every((item) => item.checkInTime === '23:00'));
  assert.ok(items.every((item) => item.checkOutTime === '10:00'));
  assert.equal(items.reduce((sum, item) => sum + item.estimatedCost, 0), 420);
});

test('map markers keep stable focus, visible numbering and type colours without opening the editor', async () => {
  const [mapPanel, tripMap, styles] = await Promise.all([
    read('src/components/tripWorkspace/MapPanel.jsx'),
    read('src/components/tripWorkspace/TripMap.jsx'),
    read('src/styles/pages.css'),
  ]);
  assert.match(mapPanel, /onPointSelect=\{focusExistingPoint\}/);
  assert.match(mapPanel, /focusedPointId=\{focusedPointId\}/);
  assert.doesNotMatch(mapPanel, /onClick=\{\(\) => selectMapPoint\(point/);
  assert.match(tripMap, /number: index \+ 1/);
  assert.match(tripMap, /anchor: 'bottom'/);
  assert.match(tripMap, /TYPE_COLORS/);
  assert.match(styles, /maplibre-point-marker__number/);
  assert.match(styles, /map-marker-legend__dot--hotel/);
});

test('saved-place editor starts with location, keeps custom lists and uses the large desktop modal', async () => {
  const panel = await read('src/components/tripWorkspace/SavedPlacesPanel.jsx');
  const locationIndex = panel.indexOf("label={t('places.location')}");
  const nameIndex = panel.indexOf("<span>{t('places.name')}</span>");
  assert.ok(locationIndex >= 0 && nameIndex > locationIndex);
  assert.match(panel, /size="large"/);
  assert.match(panel, /nameAutofilled/);
  assert.deepEqual(getSavedPlaceLists([], ['Plages', 'Campings']), ['mustSee', 'restaurants', 'ideas', 'Campings', 'Plages']);
});

test('travel time ticks every second and reservations link to their documents', async () => {
  const [clock, reservations, documents, page] = await Promise.all([
    read('src/components/tripWorkspace/tools/LocalTimeCard.jsx'),
    read('src/components/tripWorkspace/ReservationsPanel.jsx'),
    read('src/components/tripWorkspace/DocumentsPanel.jsx'),
    read('src/pages/TripWorkspacePage.jsx'),
  ]);
  assert.match(clock, /setInterval\([\s\S]*?, 1000\)/);
  assert.match(reservations, /reservations\.openDocuments/);
  assert.match(page, /nextParams\.set\('tab', 'documents'\)/);
  assert.match(documents, /documents\.view/);
  assert.match(documents, /previewAttachment/);
});

test('money fields accept safe inline arithmetic and currency keeps useful decimals', async () => {
  assert.equal(evaluateMoneyExpression('300/2'), 150);
  assert.equal(evaluateMoneyExpression('129,90 + 20'), 149.9);
  assert.equal(evaluateMoneyExpression('(30+20)*2'), 100);
  assert.equal(evaluateMoneyExpression('alert(1)'), null);
  assert.equal(normalizeMoneyExpression('100/3'), '33.33');
  const [expenses, currency] = await Promise.all([
    read('src/components/tripWorkspace/SharedExpensesPanel.jsx'),
    read('src/utils/currency.js'),
  ]);
  assert.match(expenses, /evaluateMoneyExpression/);
  assert.match(expenses, /inputMode="decimal"/);
  assert.match(currency, /maximumFractionDigits:\s*2/);
});

test('overview budget card compares paid amount with this trip budget', async () => {
  const overview = await read('src/components/tripWorkspace/OverviewPanel.jsx');
  assert.match(overview, /overview\.paidLabel/);
  assert.match(overview, /overview\.tripBudget/);
  assert.match(overview, /trip\.budget/);
  assert.doesNotMatch(overview, /plannedTotal/);
});

test('MapLibre build receives its explicit vendor budget while other chunks remain capped', async () => {
  const audit = await read('scripts/audit-build-size.mjs');
  assert.match(audit, /MAX_SINGLE_JS_BYTES = 750 \* 1024/);
  assert.match(audit, /MAX_MAP_VENDOR_JS_BYTES = 1100 \* 1024/);
  assert.match(audit, /map-vendor/);
});

test('workspace place searches are global instead of being forced toward the trip destination', async () => {
  const [itinerary, savedPlaces, mapPanel] = await Promise.all([
    read('src/components/tripWorkspace/ItineraryPanel.jsx'),
    read('src/components/tripWorkspace/SavedPlacesPanel.jsx'),
    read('src/components/tripWorkspace/MapPanel.jsx'),
  ]);
  for (const source of [itinerary, savedPlaces, mapPanel]) {
    assert.doesNotMatch(source, /bias=\{\{\s*latitude:\s*trip\.destinationLatitude/);
  }
});
