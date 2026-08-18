import assert from 'node:assert/strict';
import fs from 'node:fs';

const tripMap = fs.readFileSync(new URL('../src/components/tripWorkspace/TripMap.jsx', import.meta.url), 'utf8');
const mapPanel = fs.readFileSync(new URL('../src/components/tripWorkspace/MapPanel.jsx', import.meta.url), 'utf8');
const mapUtils = fs.readFileSync(new URL('../src/utils/map.js', import.meta.url), 'utf8');
const styles = fs.readFileSync(new URL('../src/styles/pages.css', import.meta.url), 'utf8');

assert.match(tripMap, /type: 'geojson'/);
assert.match(tripMap, /mapnplan-point-pins/);
assert.match(tripMap, /'icon-anchor': 'bottom'/);
assert.match(tripMap, /source\.setData/);
assert.doesNotMatch(tripMap, /new maplibregl\.Marker/);
assert.doesNotMatch(mapUtils, /reservationPoints/);
assert.match(mapUtils, /Reservations are intentionally excluded/);
assert.match(mapPanel, /size="large"/);
assert.doesNotMatch(mapPanel, /BookingContextCard/);
assert.match(mapPanel, /affiliate\.compareAll/);
assert.match(styles, /map-place-row__actions/);
assert.match(styles, /map-selected-place-summary__copy/);
console.log('Part 35 map/layout checks passed.');
