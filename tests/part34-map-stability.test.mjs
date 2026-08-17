import assert from 'node:assert/strict';
import fs from 'node:fs';

const mapSource = fs.readFileSync(new URL('../src/components/tripWorkspace/TripMap.jsx', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../src/styles/pages.css', import.meta.url), 'utf8');

assert.ok(!mapSource.includes('map.loaded()'), 'TripMap must not use map.loaded() to gate post-load updates.');
assert.ok(mapSource.includes('mapReadyRef'), 'TripMap keeps explicit one-time readiness state.');
assert.ok(mapSource.includes('contentRect?.width'), 'ResizeObserver reacts to width only.');
assert.ok(mapSource.includes('trip-map--stable'), 'Stable map class is present.');
assert.ok(css.includes('.map-card--interactive .trip-map--stable'));
assert.ok(css.includes('height: clamp(520px, 62vh, 690px)'));
assert.ok(css.includes('contain: layout paint'));
console.log('Part 34 map stability checks passed.');
