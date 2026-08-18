import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const tripMap = read('src/components/tripWorkspace/TripMap.jsx');
const mapPanel = read('src/components/tripWorkspace/MapPanel.jsx');
const mapUtils = read('src/utils/map.js');
const overview = read('src/components/tripWorkspace/OverviewPanel.jsx');
const tripService = read('src/services/trips/TripService.js');
const styles = read('src/styles/pages.css');

assert.match(tripMap, /createPinImage/);
assert.match(tripMap, /'icon-anchor': 'bottom'/);
assert.match(tripMap, /context\.bezierCurveTo/);
assert.match(mapPanel, /openPointEditor\(point\)/);
assert.match(mapPanel, /deleteMappedPoint\(point\)/);
assert.match(mapPanel, /moveMappedPoint\(point, 'up'\)/);
assert.match(mapPanel, /mapPointOrder/);
assert.match(mapUtils, /mapPointOrder/);
assert.match(tripService, /mapPointOrder/);
assert.match(styles, /minmax\(390px, 460px\)/);
assert.match(styles, /white-space: normal/);
assert.match(overview, /getMeaningfulOverviewItems/);
assert.match(overview, /!\['checkin', 'single'\]\.includes\(item\.stayRole\)/);
assert.match(overview, /slice\(0, 6\)/);
console.log('Part 36 map management and overview checks passed.');
