import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFile(path.join(root, file), 'utf8');

test('editing a reservation synchronizes linked itinerary, expenses and documents', async () => {
  const panel = await read('src/components/tripWorkspace/ReservationsPanel.jsx');
  assert.match(panel, /synchronizeReservationLinks/);
  assert.match(panel, /linkedReservationId === previousReservation\.id/);
  assert.match(panel, /mapReservationTypeToExpenseCategory\(reservation\.type\)/);
  assert.match(panel, /upsertActivityAcrossDates\(baseItinerary/);
  assert.match(panel, /onUpdate\(\{ reservations: nextReservations, documents: nextDocuments, itinerary: nextItinerary, expenses: nextExpenses \}\)/);
});

test('new imported expenses retain a direct reservation link for future edits', async () => {
  const panel = await read('src/components/tripWorkspace/ReservationsPanel.jsx');
  assert.match(panel, /linkedReservationId: reservationId,[\s\S]*sourceActivityId,[\s\S]*sourceActivitySeriesId/);
});

test('discovery keeps presets and also accepts a custom minute value', async () => {
  const [panel, utils] = await Promise.all([
    read('src/components/tripWorkspace/PlaceDiscoveryPanel.jsx'),
    read('src/utils/placeDiscovery.js'),
  ]);
  assert.match(panel, /DISCOVERY_MINUTES_MAX/);
  assert.match(panel, /type="number"/);
  assert.match(panel, /normalizeDiscoveryMinutes\(maxMinutes\)/);
  assert.match(utils, /DISCOVERY_MINUTES_MAX = 120/);
  assert.match(utils, /export function normalizeDiscoveryMinutes/);
  assert.doesNotMatch(utils, /DISCOVERY_MINUTES\.includes\(Number\(minutes\)\)/);
});

test('discovery results expose a Google Maps information link without requiring a place API key', async () => {
  const [panel, utils] = await Promise.all([
    read('src/components/tripWorkspace/PlaceDiscoveryPanel.jsx'),
    read('src/utils/placeDiscovery.js'),
  ]);
  assert.match(utils, /googleMapsUrl: buildGoogleMapsSearchUrl/);
  assert.match(utils, /google\.com\/maps\/search\/\?api=1&query=/);
  assert.match(panel, /place\.googleMapsUrl/);
  assert.match(panel, /target="_blank"/);
});
