import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inferBookingCategories, normalizeBookingContext } from '../src/utils/bookingContext.js';
import { rememberProviderSearch } from '../src/utils/bookingOptions.js';
import { syncBookedOptionToTrip } from '../src/utils/bookingReservations.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFile(path.join(root, relativePath), 'utf8');

test('workspace exposes four simple product spaces with contextual sub-navigation', async () => {
  const tabs = await read('src/components/tripWorkspace/TripTabs.jsx');
  assert.match(tabs, /id: 'overview'/);
  assert.match(tabs, /id: 'planning'/);
  assert.match(tabs, /id: 'booking'/);
  assert.match(tabs, /id: 'trip'/);
  assert.match(tabs, /planning:[\s\S]*?'itinerary'[\s\S]*?'map'[\s\S]*?'calendar'/);
  assert.match(tabs, /booking:[\s\S]*?'booking'[\s\S]*?'reservations'/);
  assert.match(tabs, /trip:[\s\S]*?'budget'[\s\S]*?'checklist'[\s\S]*?'documents'[\s\S]*?'notes'/);
});

test('booking context reuses known trip information and selects useful providers', () => {
  const trip = { destination: 'Japon', startDate: '2026-04-10', endDate: '2026-04-24', travelers: 2, currency: 'EUR' };
  const context = normalizeBookingContext({ activityType: 'hotel', location: 'Kyoto', startDate: '2026-04-12', endDate: '2026-04-15' }, trip);
  assert.equal(context.location, 'Kyoto');
  assert.equal(context.travelers, 2);
  assert.equal(context.currency, 'EUR');
  assert.deepEqual(inferBookingCategories(context), ['hotels']);
});

test('opening a provider can be remembered without asking for the same trip data again', () => {
  const options = rememberProviderSearch([], {
    provider: { id: 'booking', name: 'Booking.com', category: 'hotels' },
    url: 'https://example.com/search?city=Kyoto',
    context: {
      source: 'itinerary', location: 'Kyoto', startDate: '2026-04-12', endDate: '2026-04-15', travelers: 2, currency: 'EUR',
    },
  }, 'EUR');
  assert.equal(options.length, 1);
  assert.equal(options[0].providerName, 'Booking.com');
  assert.equal(options[0].location, 'Kyoto');
  assert.equal(options[0].startDate, '2026-04-12');
  assert.equal(options[0].travelers, 2);
});

test('a confirmed booking populates reservations and itinerary with the partner return link', () => {
  const trip = {
    destination: 'Japon', startDate: '2026-04-10', endDate: '2026-04-24', travelers: 2, currency: 'EUR',
    itinerary: [], reservations: [],
  };
  const option = {
    id: 'booking-option-1', category: 'hotels', providerId: 'booking', providerName: 'Booking.com',
    title: 'Hôtel Kyoto', price: 430, currency: 'EUR', url: 'https://example.com/manage-booking', status: 'booked',
    location: 'Kyoto', startDate: '2026-04-12', endDate: '2026-04-15', travelers: 2, notes: '',
  };
  const patch = syncBookedOptionToTrip(trip, option);
  assert.equal(patch.reservations.length, 1);
  assert.equal(patch.reservations[0].provider, 'Booking.com');
  assert.equal(patch.reservations[0].url, option.url);
  assert.equal(patch.reservations[0].sourceBookingOptionId, option.id);
  assert.ok(patch.itinerary.some((day) => day.date === '2026-04-12' && day.items.some((item) => item.type === 'hotel')));
  assert.ok(patch.itinerary.flatMap((day) => day.items).some((item) => item.linkedReservationId === patch.reservationId));
});

test('desktop sidebar, hero actions and dashboard empty state keep the responsive mapNplan design', async () => {
  const [layout, pages, brand] = await Promise.all([
    read('src/styles/layout.css'),
    read('src/styles/pages.css'),
    read('src/styles/brand-mapnplan.css'),
  ]);
  assert.match(layout, /\.app-shell--sidebar-open[\s\S]*?grid-template-columns:\s*var\(--sidebar-width\)/);
  assert.match(layout, /\.sidebar--open[\s\S]*?transform:\s*translateX\(0\)/);
  assert.match(pages, /\.trip-workspace-hero__actions[\s\S]*?position:\s*static/);
  assert.match(pages, /grid-template-columns:\s*repeat\(4,\s*minmax\(40px,\s*1fr\)\)/);
  assert.match(brand, /\.upcoming-card--empty[\s\S]*?color:\s*#ffffff[\s\S]*?linear-gradient/);
});
