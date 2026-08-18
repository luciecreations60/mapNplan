import assert from 'node:assert/strict';
import fs from 'node:fs';

const tripMap = fs.readFileSync(new URL('../src/components/tripWorkspace/TripMap.jsx', import.meta.url), 'utf8');
const mapPanel = fs.readFileSync(new URL('../src/components/tripWorkspace/MapPanel.jsx', import.meta.url), 'utf8');
const mapUtils = fs.readFileSync(new URL('../src/utils/map.js', import.meta.url), 'utf8');
const styles = fs.readFileSync(new URL('../src/styles/pages.css', import.meta.url), 'utf8');

assert.match(tripMap, /type: 'geojson'/);
assert.match(tripMap, /mapnplan-point-circles/);
assert.match(tripMap, /source\.setData/);
assert.doesNotMatch(tripMap, /new maplibregl\.Marker/);
assert.doesNotMatch(mapUtils, /reservationPoints/);
assert.match(mapUtils, /Reservations are intentionally excluded/);
assert.match(mapPanel, /size="large"/);
assert.doesNotMatch(mapPanel, /BookingContextCard/);
assert.match(mapPanel, /affiliate\.compareAll/);
assert.match(styles, /grid-template-columns: 32px minmax\(0, 1fr\) 30px/);
assert.match(styles, /map-selected-place-summary__copy/);
console.log('Part 35 map/layout checks passed.');
