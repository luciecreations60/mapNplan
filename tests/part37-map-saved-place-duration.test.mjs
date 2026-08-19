import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/components/tripWorkspace/MapPanel.jsx', import.meta.url), 'utf8');

assert.match(source, /editingPoint\?\.source === 'savedPlace'/);
assert.match(source, /savedPlaces: \(trip\.savedPlaces \|\| \[\]\)\.map/);
assert.match(source, /updatedAt: new Date\(\)\.toISOString\(\)/);
assert.match(source, /onClick=\{persistSelectedPlace\}/);
assert.match(source, /durationHours/);
assert.match(source, /durationRemainderMinutes/);
assert.match(source, /combineDuration\(form\.durationHours, form\.durationRemainderMinutes\)/);
assert.match(source, /splitDuration\(item\?\.durationMinutes \?\? point\.durationMinutes \?\? 0\)/);
assert.doesNotMatch(source, /name="durationMinutes" type="number"/);
console.log('Part 37 saved-place editing and duration controls checks passed.');
