import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFile(path.join(root, relativePath), 'utf8');

test('overview tab uses the URL as its single source of truth', async () => {
  const source = await read('src/pages/TripWorkspacePage.jsx');
  assert.match(source, /const activeTab = TRIP_TABS\.some/);
  assert.match(source, /if \(tab === 'overview'\) nextParams\.delete\('tab'\)/);
  assert.doesNotMatch(source, /setActiveTab/);
});

test('overview cards navigate directly and itinerary dates cannot use a fixed clipped width', async () => {
  const [overview, styles] = await Promise.all([
    read('src/components/tripWorkspace/OverviewPanel.jsx'),
    read('src/styles/pages.css'),
  ]);
  for (const tab of ['itinerary', 'reservations', 'map', 'budget', 'checklist', 'documents', 'booking']) {
    assert.match(overview, new RegExp(`onOpenTab\\('${tab}'\\)`));
  }
  assert.match(overview, /formatLocalizedDate\(item\.date, locale, 'numeric'\)/);
  assert.match(styles, /\.overview-timeline__time\s*\{[^}]*width:\s*auto;[^}]*white-space:\s*nowrap;/s);
});

test('map search, vector language switching and marker zoom are connected', async () => {
  const [panel, map, language, packageJson] = await Promise.all([
    read('src/components/tripWorkspace/MapPanel.jsx'),
    read('src/components/tripWorkspace/TripMap.jsx'),
    read('src/utils/mapLanguage.js'),
    read('package.json'),
  ]);
  assert.match(panel, /LocationAutocomplete/);
  assert.match(panel, /addSelectedPlace/);
  assert.match(panel, /saveSelectionToPlaces/);
  assert.match(map, /map\.flyTo/);
  assert.match(map, /applyMapLanguage/);
  assert.match(language, /name:latin/);
  assert.doesNotMatch(language, /\['get', 'name'\]/);
  assert.equal(JSON.parse(packageJson).dependencies['maplibre-gl'], '5.24.0');
});

test('expenses are unified and allow custom unequal allocations', async () => {
  const [hub, panel, utility] = await Promise.all([
    read('src/components/tripWorkspace/BudgetHubPanel.jsx'),
    read('src/components/tripWorkspace/SharedExpensesPanel.jsx'),
    read('src/utils/sharedExpenses.js'),
  ]);
  assert.match(hub, /SharedExpensesPanel/);
  assert.doesNotMatch(hub, /BudgetPanel/);
  assert.match(panel, /value="custom"/);
  assert.match(panel, /splitShares/);
  assert.match(panel, /participants\.length > 1/);
  assert.match(utility, /getConfiguredExpenseShares/);
});

test('trip duplication, cover images and destination coordinates are preserved', async () => {
  const [form, card, hero, service, tripsPage] = await Promise.all([
    read('src/components/trips/TripFormDialog.jsx'),
    read('src/components/trips/TripCard.jsx'),
    read('src/components/tripWorkspace/TripHero.jsx'),
    read('src/services/trips/TripService.js'),
    read('src/pages/TripsPage.jsx'),
  ]);
  assert.match(form, /createTripCoverDataUrl/);
  assert.match(form, /geocodingService\.search/);
  assert.match(card, /trip-card__visual--cover/);
  assert.match(hero, /trip-workspace-hero--cover/);
  assert.match(service, /#findDestinationCoordinates/);
  assert.match(tripsPage, /duplicateTrip/);
});

test('checklists expose explicit list creation and the content editor is not public', async () => {
  const [checklist, app] = await Promise.all([
    read('src/components/tripWorkspace/ChecklistPanel.jsx'),
    read('src/App.jsx'),
  ]);
  assert.match(checklist, /checklistLists/);
  assert.match(checklist, /addList/);
  assert.doesNotMatch(app, /content-studio|ContentStudio/i);
});

test('browser identity uses a cache-busted mapNplan icon and one title separator', async () => {
  const html = await read('index.html');
  assert.match(html, /mapnplan-favicon-rc5\.svg/);
  assert.match(html, /<title>mapNplan - Planifiez\. Explorez\. Profitez\.<\/title>/);
  assert.doesNotMatch(html, /mapNplan\s+--/);
});

test('local-data cleanup starts from an empty trip library', async () => {
  const [settings, context, service] = await Promise.all([
    read('src/pages/SettingsPage.jsx'),
    read('src/contexts/TripContext.jsx'),
    read('src/services/trips/TripService.js'),
  ]);
  assert.match(settings, /clearLocalTripData/);
  assert.match(context, /clearLocalTripData/);
  assert.match(service, /clearLocalTripData\(\)/);
  assert.doesNotMatch(`${settings}\n${context}\n${service}`, /resetDemoData/);
});
