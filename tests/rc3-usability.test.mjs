import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TRANSLATIONS } from '../src/i18n/translations.js';
import { createChecklistPreset } from '../src/data/builtInTemplates.js';
import { formatLocalizedDate } from '../src/utils/date.js';
import { MemoryStorage } from './helpers/MemoryStorage.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFile(path.join(root, relativePath), 'utf8');

test('dashboard shortcuts and brand use real application routes', async () => {
  const [dashboard, brand] = await Promise.all([
    read('src/pages/DashboardPage.jsx'),
    read('src/components/common/Brand.jsx'),
  ]);
  assert.match(dashboard, /navigate\('\/trips'\)/);
  assert.match(dashboard, /\?tab=\$\{tab\}/);
  assert.match(brand, /to="\/dashboard"/);
});

test('trip workspace keeps one budget tab and statistics last', async () => {
  const tabs = await read('src/components/tripWorkspace/TripTabs.jsx');
  const budgetHub = await read('src/components/tripWorkspace/BudgetHubPanel.jsx');
  assert.doesNotMatch(tabs, /id: 'expenses'/);
  assert.ok(tabs.lastIndexOf("id: 'statistics'") > tabs.lastIndexOf("id: 'collaboration'"));
  assert.doesNotMatch(budgetHub, /BudgetPanel/);
  assert.match(budgetHub, /SharedExpensesPanel/);
});

test('saved places, reservations, documents and map expose the requested daily controls', async () => {
  const [places, reservations, documents, map] = await Promise.all([
    read('src/components/tripWorkspace/SavedPlacesPanel.jsx'),
    read('src/components/tripWorkspace/ReservationsPanel.jsx'),
    read('src/components/tripWorkspace/DocumentsPanel.jsx'),
    read('src/components/tripWorkspace/MapPanel.jsx'),
  ]);
  assert.match(places, /setFormOpen\(true\)/);
  assert.match(places, /markVisitedTooltip/);
  assert.match(reservations, /reservation-search/);
  assert.match(reservations, /reservation-editor--inline/);
  assert.match(documents, /document-search/);
  assert.match(map, /saveSelectionToPlaces/);
});

test('dates use the shared locale formatter', () => {
  assert.equal(formatLocalizedDate('2026-10-12', 'fr-FR', 'numeric'), '12/10/2026');
  assert.equal(formatLocalizedDate('2026-10-12', 'en-GB', 'numeric'), '12/10/2026');
  assert.match(formatLocalizedDate('2026-10-12', 'fr-FR', 'long'), /12 octobre 2026/i);
});

test('officially enriched checklist presets are substantial and translated', () => {
  for (const locale of ['en', 'fr']) {
    const dictionary = TRANSLATIONS[locale];
    const t = (key) => key.split('.').reduce((value, part) => value?.[part], dictionary) ?? key;
    for (const type of ['city', 'road', 'beach', 'business']) {
      const preset = createChecklistPreset(t, type);
      assert.ok(preset.length >= 24, `${locale}/${type} has only ${preset.length} entries`);
      assert.ok(preset.every((item) => item.label && !item.label.startsWith('templates.')));
    }
  }
});

test('custom checklist list titles survive trip normalization', async () => {
  globalThis.localStorage = new MemoryStorage();
  const { tripService } = await import('../src/services/trips/TripService.js');
  tripService.replaceAll([{
    id: 'custom-list-trip', name: 'Test', travelers: 1,
    checklist: [{ id: 'item-1', label: 'Baby carrier', category: 'packing', listTitle: 'Baby essentials', completed: false }],
  }]);
  const [trip] = tripService.getAll();
  assert.equal(trip.schemaVersion, 21);
  assert.equal(trip.checklist[0].listTitle, 'Baby essentials');
  assert.equal(trip.checklistLists[0].title, 'Baby essentials');
});

test('route changes scroll the application to the top and all trips can be mapped', async () => {
  const [layout, tripsPage, tripsMap] = await Promise.all([
    read('src/layouts/AppLayout.jsx'),
    read('src/pages/TripsPage.jsx'),
    read('src/components/trips/TripsMap.jsx'),
  ]);
  assert.match(layout, /window\.scrollTo\(\{ top: 0/);
  assert.match(tripsPage, /<TripsMap trips=\{filteredTrips\}/);
  assert.match(tripsMap, /data-trip-id/);
  assert.match(tripsMap, /navigate\(`\/trips\/\$\{tripId\}`\)/);
});
