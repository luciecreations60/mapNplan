import { supabase } from '../../config/supabase.config.js';

const TABLE = 'trips';

/**
 * Cloud persistence for trips, layered on top of the existing local-first
 * TripService. Every call is best-effort: network or auth failures are
 * logged but never thrown, so the local (localStorage) experience keeps
 * working even if the user is offline or Supabase is unreachable.
 */

export async function pullTrips(ownerId) {
  if (!ownerId) return [];
  const { data, error } = await supabase.from(TABLE).select('data').eq('owner_id', ownerId);
  if (error) {
    console.error('Unable to fetch trips from Supabase.', error);
    return [];
  }
  return (data || []).map((row) => row.data);
}

export async function pushTrip(trip, ownerId) {
  if (!ownerId || !trip) return;
  const { error } = await supabase.from(TABLE).upsert({
    id: trip.id,
    owner_id: ownerId,
    data: trip,
    updated_at: trip.updatedAt || new Date().toISOString(),
  });
  if (error) console.error('Unable to sync trip to Supabase.', error);
}

export async function pushAllTrips(trips, ownerId) {
  if (!ownerId || !Array.isArray(trips) || trips.length === 0) return;
  const rows = trips.map((trip) => ({
    id: trip.id,
    owner_id: ownerId,
    data: trip,
    updated_at: trip.updatedAt || new Date().toISOString(),
  }));
  const { error } = await supabase.from(TABLE).upsert(rows);
  if (error) console.error('Unable to bulk sync trips to Supabase.', error);
}

export async function deleteTripRemote(id, ownerId) {
  if (!ownerId || !id) return;
  const { error } = await supabase.from(TABLE).delete().eq('id', id).eq('owner_id', ownerId);
  if (error) console.error('Unable to delete trip from Supabase.', error);
}

/**
 * Keeps, for each trip id present locally and/or remotely, whichever version
 * was updated most recently. Trips that only exist on one side are kept as-is.
 */
export function mergeTripsByRecency(localTrips, remoteTrips) {
  const byId = new Map();
  for (const trip of localTrips) byId.set(trip.id, trip);
  for (const trip of remoteTrips) {
    const existing = byId.get(trip.id);
    if (!existing || new Date(trip.updatedAt || 0) > new Date(existing.updatedAt || 0)) {
      byId.set(trip.id, trip);
    }
  }
  return [...byId.values()];
}
