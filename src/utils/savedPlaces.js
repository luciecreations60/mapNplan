import { createId } from './id.js';

export const SAVED_PLACE_CATEGORIES = Object.freeze([
  'sight',
  'food',
  'nature',
  'shopping',
  'nightlife',
  'accommodation',
  'transport',
  'other',
]);

export const SAVED_PLACE_PRIORITIES = Object.freeze(['high', 'medium', 'low']);
export const SAVED_PLACE_STATUSES = Object.freeze(['idea', 'planned', 'visited']);

export const DEFAULT_PLACE_LISTS = Object.freeze([
  'mustSee',
  'restaurants',
  'ideas',
]);

/**
 * Normalizes a tag list entered as an array or comma-separated string.
 */
export function normalizePlaceTags(value) {
  const values = Array.isArray(value) ? value : String(value || '').split(',');
  return [...new Set(values
    .map((tag) => String(tag || '').trim().toLocaleLowerCase())
    .filter(Boolean))]
    .slice(0, 12);
}

/**
 * Creates the stable saved-place domain shape used by the UI and persistence.
 */
export function createSavedPlace(payload = {}) {
  const now = new Date().toISOString();
  const status = SAVED_PLACE_STATUSES.includes(payload.status) ? payload.status : 'idea';

  return {
    id: payload.id || createId('place'),
    name: String(payload.name || payload.primaryLabel || payload.label || 'Saved place').trim(),
    label: String(payload.label || payload.name || '').trim(),
    city: String(payload.city || '').trim(),
    country: String(payload.country || '').trim(),
    countryCode: String(payload.countryCode || '').trim().toUpperCase(),
    latitude: normalizeCoordinate(payload.latitude, -90, 90),
    longitude: normalizeCoordinate(payload.longitude, -180, 180),
    category: SAVED_PLACE_CATEGORIES.includes(payload.category) ? payload.category : 'other',
    list: String(payload.list || 'ideas').trim() || 'ideas',
    priority: SAVED_PLACE_PRIORITIES.includes(payload.priority) ? payload.priority : 'medium',
    status,
    notes: String(payload.notes || '').trim(),
    tags: normalizePlaceTags(payload.tags),
    source: String(payload.source || 'manual').trim(),
    createdAt: payload.createdAt || now,
    updatedAt: payload.updatedAt || now,
    visitedAt: status === 'visited' ? (payload.visitedAt || now) : null,
  };
}

/**
 * Returns every distinct saved-place list for a trip in display order.
 */
export function getSavedPlaceLists(places = []) {
  const custom = places
    .map((place) => String(place.list || '').trim())
    .filter((list) => list && !DEFAULT_PLACE_LISTS.includes(list));
  return [...DEFAULT_PLACE_LISTS, ...[...new Set(custom)].sort((a, b) => a.localeCompare(b))];
}

/**
 * Adds a saved place to an itinerary while preserving the existing day data.
 */
export function addSavedPlaceToItinerary(trip, place, {
  date,
  time = '10:00',
  durationMinutes = 90,
} = {}) {
  const selectedDate = date || trip.startDate || '';
  const itinerary = structuredClone(trip.itinerary || []);
  let day = itinerary.find((item) => item.date === selectedDate);

  if (!day) {
    day = {
      id: createId('day'),
      date: selectedDate,
      title: '',
      routePlan: null,
      items: [],
    };
    itinerary.push(day);
  }

  const activity = {
    id: createId('activity'),
    time,
    type: categoryToActivityType(place.category),
    title: place.name,
    location: place.label || [place.city, place.country].filter(Boolean).join(', '),
    latitude: place.latitude,
    longitude: place.longitude,
    durationMinutes: Math.max(0, Number(durationMinutes) || 0),
    estimatedCost: 0,
    notes: place.notes,
    reminderMinutes: null,
    externalCalendarUid: '',
    completedAt: null,
    comments: [],
  };

  day.items.push(activity);
  day.items.sort((left, right) => String(left.time || '99:99').localeCompare(String(right.time || '99:99')));
  itinerary.sort((left, right) => String(left.date || '').localeCompare(String(right.date || '')));

  return { itinerary, activity };
}

export function downloadSavedPlaces(trip) {
  const payload = {
    format: 'mapnplan-saved-places',
    version: 1,
    exportedAt: new Date().toISOString(),
    trip: { id: trip.id, name: trip.name, destination: trip.destination },
    places: trip.savedPlaces || [],
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${slugify(trip.name || 'trip')}-saved-places.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return payload.places.length;
}

export async function readSavedPlacesFile(file) {
  const text = await file.text();
  const payload = JSON.parse(text);
  if (payload?.format !== 'mapnplan-saved-places' || payload?.version !== 1 || !Array.isArray(payload.places)) {
    throw new Error('Unsupported saved places file.');
  }
  return payload.places.map((place) => createSavedPlace({ ...place, id: createId('place') }));
}

function categoryToActivityType(category) {
  const mapping = {
    food: 'food',
    accommodation: 'hotel',
    transport: 'bus',
    sight: 'map',
    nature: 'map',
    shopping: 'map',
    nightlife: 'activity',
    other: 'map',
  };
  return mapping[category] || 'map';
}

function normalizeCoordinate(value, minimum, maximum) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= minimum && number <= maximum ? number : null;
}

function slugify(value) {
  return String(value || 'trip')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'trip';
}
