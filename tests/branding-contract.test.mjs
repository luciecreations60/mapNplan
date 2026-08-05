import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROJECT_CONFIG } from '../project.config.js';
import { APP_CONFIG } from '../src/config/app.config.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFile(path.join(root, relativePath), 'utf8');

test('approved mapNplan identity is centralized while legacy storage remains compatible', () => {
  assert.equal(PROJECT_CONFIG.brandName, 'mapNplan');
  assert.equal(PROJECT_CONFIG.tagline, 'Planifiez. Explorez. Profitez.');
  assert.equal(PROJECT_CONFIG.release.brandFinalized, true);
  assert.equal(PROJECT_CONFIG.release.publicIndexingEnabled, false);
  assert.equal(APP_CONFIG.storageNamespace, 'tripflow');
});

test('brand assets expose the approved colours and wordmark', async () => {
  const [mark, logo, brand, tokens] = await Promise.all([
    read('public/mapnplan-mark.svg'),
    read('public/mapnplan-logo.svg'),
    read('src/components/common/Brand.jsx'),
    read('src/styles/tokens.css'),
  ]);
  for (const colour of ['#1F90AD', '#2CBB6B', '#0F172A']) {
    assert.match(mark.toUpperCase(), new RegExp(colour.toUpperCase()));
  }
  assert.match(logo, /map/);
  assert.match(brand, /brand__wordmark/);
  assert.match(tokens.toLowerCase(), /--brand-gradient/);
});

test('public shell uses mapNplan and keeps indexing disabled', async () => {
  const [html, manifest] = await Promise.all([read('index.html'), read('public/site.webmanifest')]);
  assert.match(html, /mapNplan/);
  assert.match(html, /noindex/);
  assert.match(html, /Poppins/);
  assert.equal(JSON.parse(manifest).name, 'mapNplan');
});
