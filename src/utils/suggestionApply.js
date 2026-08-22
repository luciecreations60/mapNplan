import { upsertActivityInItinerary } from './itinerary.js';
import { createId } from './id.js';

/**
 * Turning an accepted suggestion into a real change.
 *
 * Kept free of any network dependency so the rules can be tested on their own.
 * Each function returns the trip fields to patch, or null when the suggestion
 * carries nothing applicable — an unusable suggestion must never silently
 * corrupt the trip.
 */

export function isApplicable(suggestion) {
  if (!suggestion) return false;
  if (suggestion.kind === 'comment') return false;
  if (suggestion.kind === 'place') return Boolean(suggestion.payload?.title || suggestion.title);
  if (suggestion.kind === 'change') {
    const field = suggestion.payload?.field;
    const value = suggestion.payload?.value;
    return Boolean(suggestion.target_entity_id && field && value !== undefined && value !== '');
  }
  return false;
}

/**
 * A suggested place becomes a new itinerary activity. The date falls back to
 * the trip start when the suggester did not pick one, so the activity always
 * lands somewhere visible rather than in an orphan day.
 */
export function applyPlaceSuggestion(trip, suggestion) {
  const payload = suggestion.payload || {};
  const title = String(payload.title || suggestion.title || '').trim();
  if (!title) return null;

  const date = payload.date || trip.startDate || '';
  if (!date) return null;

  const activity = {
    id: createId('activity'),
    title,
    type: payload.type || 'activity',
    location: String(payload.location || '').trim(),
    latitude: Number.isFinite(Number(payload.latitude)) ? Number(payload.latitude) : null,
    longitude: Number.isFinite(Number(payload.longitude)) ? Number(payload.longitude) : null,
    time: payload.time || '',
    amount: Math.max(0, Number(payload.amount) || 0),
    notes: String(suggestion.body || '').trim(),
  };

  return { itinerary: upsertActivityInItinerary(trip.itinerary, date, activity) };
}

const EDITABLE_ACTIVITY_FIELDS = Object.freeze(['time', 'date', 'amount', 'title', 'location', 'notes']);

/**
 * A suggested change edits one field of one existing activity. Only a short
 * list of fields can be touched, so a malformed suggestion cannot rewrite
 * arbitrary parts of the trip.
 */
export function applyChangeSuggestion(trip, suggestion) {
  const field = suggestion.payload?.field;
  const value = suggestion.payload?.value;
  const targetId = suggestion.target_entity_id;

  if (!targetId || !EDITABLE_ACTIVITY_FIELDS.includes(field)) return null;

  let found = false;
  const itinerary = (trip.itinerary || []).map((day) => ({
    ...day,
    items: (day.items || []).map((activity) => {
      if (activity.id !== targetId) return activity;
      found = true;
      if (field === 'amount') return { ...activity, amount: Math.max(0, Number(value) || 0) };
      return { ...activity, [field]: value };
    }),
  }));

  if (!found) return null;

  // Moving an activity to another day is a move between days, not a field
  // edit, so it is handled by re-inserting it where it belongs.
  if (field === 'date') {
    const activity = (trip.itinerary || [])
      .flatMap((day) => day.items || [])
      .find((item) => item.id === targetId);
    if (!activity) return null;

    const withoutActivity = (trip.itinerary || []).map((day) => ({
      ...day,
      items: (day.items || []).filter((item) => item.id !== targetId),
    }));
    return { itinerary: upsertActivityInItinerary(withoutActivity, value, activity) };
  }

  return { itinerary };
}

export function applySuggestion(trip, suggestion) {
  if (!isApplicable(suggestion)) return null;
  if (suggestion.kind === 'place') return applyPlaceSuggestion(trip, suggestion);
  if (suggestion.kind === 'change') return applyChangeSuggestion(trip, suggestion);
  return null;
}
