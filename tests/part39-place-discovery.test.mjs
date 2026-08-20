import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  attachAroundRoadTimes,
  attachRouteDetours,
  buildRouteSearchCenters,
  getDiscoveryRadiusMeters,
} from '../src/utils/placeDiscovery.js';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('around discovery filters candidates by actual road travel time', () => {
  const candidates = [
    { id: 'a', name: 'A' },
    { id: 'b', name: 'B' },
    { id: 'c', name: 'C' },
  ];
  const matrix = {
    durations: [[0, 240, 660, 1200]],
    distances: [[0, 3200, 7600, 15000]],
  };
  const results = attachAroundRoadTimes(candidates, matrix, 10);
  assert.deepEqual(results.map((item) => item.id), ['a']);
  assert.equal(results[0].travelMinutes, 4);
  assert.equal(results[0].roadDistanceKm, 3.2);
});

test('route discovery measures the extra road detour instead of a geometric radius', () => {
  const candidates = [{ id: 'near', name: 'Near' }, { id: 'far', name: 'Far' }];
  const matrix = {
    durations: [
      [0, 600, 360, 900],
      [600, 0, 420, 900],
      [360, 420, 0, 800],
      [900, 900, 800, 0],
    ],
  };
  const results = attachRouteDetours(candidates, matrix, 2, 10);
  assert.deepEqual(results.map((item) => item.id), ['near']);
  assert.equal(results[0].detourMinutes, 3);
});

test('route sampling covers long segments while bounding public API requests', () => {
  const centers = buildRouteSearchCenters([
    { latitude: 42.7, longitude: 9.45 },
    { latitude: 41.39, longitude: 9.16 },
    { latitude: 41.92, longitude: 8.74 },
  ], 8);
  assert.ok(centers.length >= 3);
  assert.ok(centers.length <= 8);
  assert.ok(getDiscoveryRadiusMeters(20, 'nature', 'route') > getDiscoveryRadiusMeters(5, 'nature', 'route'));
});

test('map discovery stays opt-in and reuses existing saved-place and itinerary flows', () => {
  const mapPanel = read('src/components/tripWorkspace/MapPanel.jsx');
  const panel = read('src/components/tripWorkspace/PlaceDiscoveryPanel.jsx');
  const map = read('src/components/tripWorkspace/TripMap.jsx');
  const service = read('src/services/discovery/PlaceDiscoveryService.js');

  assert.match(mapPanel, /<PlaceDiscoveryPanel/);
  assert.match(mapPanel, /saveDiscoveredPlace/);
  assert.match(mapPanel, /planDiscoveredPlace/);
  assert.match(panel, /onPlan\?\.\(place\)/);
  assert.match(panel, /onSave\?\.\(place\)/);
  assert.doesNotMatch(panel, /onUpdate/);
  assert.match(map, /pointId: '__preview__'/);
  assert.match(map, /PIN_IMAGE_PREFIX}discovery/);
  assert.match(service, /table\/v1\/\$\{DISCOVERY_CONFIG\.profile\}/);
  assert.match(service, /method: 'POST'/);
});

test('discovery copy explicitly describes road time and user-controlled planning', () => {
  const translations = read('src/i18n/translations.js');
  assert.match(translations, /Le temps choisi est vérifié par la route en voiture/);
  assert.match(translations, /sans modifier votre programme tant que vous n’avez rien validé/);
  assert.match(translations, /5 \/ 10 \/ 20 min are checked by road by car/);
});
