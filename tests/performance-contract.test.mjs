import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const appSource = await fs.readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
const workerSource = await fs.readFile(new URL('../public/service-worker.js', import.meta.url), 'utf8');
const packageJson = JSON.parse(await fs.readFile(new URL('../package.json', import.meta.url), 'utf8'));
const viteConfigSource = await fs.readFile(new URL('../vite.config.js', import.meta.url), 'utf8');

test('top-level pages are split with React lazy loading', () => {
  assert.match(appSource, /lazyNamed/);
  assert.match(appSource, /Suspense/);
  assert.ok((appSource.match(/import\('\.\/pages\//g) || []).length >= 10);
});

test('service worker keeps bounded same-origin caches', () => {
  assert.match(workerSource, /MAX_ASSET_ENTRIES = 80/);
  assert.match(workerSource, /url\.origin !== self\.location\.origin/);
  assert.match(workerSource, /trimCache/);
});

test('release workflow includes a production bundle budget', () => {
  assert.equal(packageJson.scripts['performance:audit'], 'node scripts/audit-build-size.mjs');
});


test('Vite 8 uses Rolldown code splitting instead of the removed manualChunks object form', () => {
  assert.match(viteConfigSource, /rolldownOptions/);
  assert.match(viteConfigSource, /codeSplitting/);
  assert.doesNotMatch(viteConfigSource, /manualChunks\s*:\s*\{/);
});
