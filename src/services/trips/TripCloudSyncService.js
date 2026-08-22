import { supabase } from '../../config/supabase.config.js';
export { mergeTripsByRecency } from '../../utils/tripMerge.js';

const TABLE = 'trips';
const MEMBERS_TABLE = 'trip_members';

/**
 * Cloud persistence for trips, layered on top of the existing local-first
 * TripService. Every call is best-effort: network or auth failures are
 * logged but never thrown, so the local (localStorage) experience keeps
 * working even if the user is offline or Supabase is unreachable.
 *
 * Row level security decides what a query returns, so reads are never
 * filtered by owner here: a trip shared with the signed-in user comes back
 * from the same query as their own trips.
 */

// Which account owns each trip, so a guest saving a shared trip never
// rewrites its owner. Populated on every pull.
const ownerByTripId = new Map();

export function getTripOwnerId(tripId) {
  return ownerByTripId.get(tripId) || null;
}

export function isSharedWithUser(tripId, userId) {
  const owner = ownerByTripId.get(tripId);
  return Boolean(owner && userId && owner !== userId);
}

export async function pullTrips(userId) {
  if (!userId) return [];
  const { data, error } = await supabase.from(TABLE).select('id, owner_id, data');
  if (error) {
    console.error('Unable to fetch trips from Supabase.', error);
    return [];
  }

  for (const row of data || []) ownerByTripId.set(row.id, row.owner_id);
  return (data || []).map((row) => row.data);
}

function toRow(trip, userId) {
  return {
    id: trip.id,
    owner_id: ownerByTripId.get(trip.id) || userId,
    data: trip,
    updated_at: trip.updatedAt || new Date().toISOString(),
  };
}

export async function pushTrip(trip, userId) {
  if (!userId || !trip) return;
  const { error } = await supabase.from(TABLE).upsert(toRow(trip, userId));
  if (error) console.error('Unable to sync trip to Supabase.', error);
}

export async function pushAllTrips(trips, userId) {
  if (!userId || !Array.isArray(trips) || trips.length === 0) return;
  const { error } = await supabase.from(TABLE).upsert(trips.map((trip) => toRow(trip, userId)));
  if (error) console.error('Unable to bulk sync trips to Supabase.', error);
}

/**
 * Removing a trip means different things depending on who you are. The owner
 * deletes it for everyone; a guest only gives up their own access, otherwise
 * they would destroy work that is not theirs — and, because row level security
 * would refuse the delete, the trip would simply reappear on the next sync.
 */
export async function deleteTripRemote(id, userId) {
  if (!userId || !id) return;

  if (isSharedWithUser(id, userId)) {
    const { data: sessionData } = await supabase.auth.getSession();
    const email = sessionData?.session?.user?.email;
    if (email) {
      try {
        await removeMember(id, email);
      } catch (error) {
        console.error('Unable to leave the shared trip.', error);
      }
    }
    ownerByTripId.delete(id);
    return;
  }

  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) console.error('Unable to delete trip from Supabase.', error);
  ownerByTripId.delete(id);
}

/**
 * Invitations are stored by email because the invited person may not have an
 * account yet. Access is granted the moment they sign in with that address.
 */
export async function inviteMember(tripId, email, role = 'editor') {
  const normalized = String(email || '').trim().toLowerCase();
  if (!tripId || !normalized) throw new Error('An email address is required.');

  const { data: sessionData } = await supabase.auth.getSession();
  const { error } = await supabase.from(MEMBERS_TABLE).upsert({
    trip_id: tripId,
    email: normalized,
    role,
    invited_by: sessionData?.session?.user?.id || null,
  });
  if (error) throw error;
}

export async function removeMember(tripId, email) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!tripId || !normalized) return;
  const { error } = await supabase
    .from(MEMBERS_TABLE)
    .delete()
    .eq('trip_id', tripId)
    .eq('email', normalized);
  if (error) throw error;
}

export async function listMembers(tripId) {
  if (!tripId) return [];
  const { data, error } = await supabase
    .from(MEMBERS_TABLE)
    .select('email, role, created_at')
    .eq('trip_id', tripId);
  if (error) {
    console.error('Unable to list trip members.', error);
    return [];
  }
  return data || [];
}


/**
 * Whether the signed-in user may rewrite this trip. Owners always can;
 * guests only when the owner made them a co-organizer. Defaults to true for a
 * trip that is not shared at all, so solo use is never blocked by a failed
 * lookup.
 */
export async function canEditTrip(tripId, userId) {
  if (!tripId || !userId) return true;
  if (!isSharedWithUser(tripId, userId)) return true;

  const { data: sessionData } = await supabase.auth.getSession();
  const email = String(sessionData?.session?.user?.email || '').toLowerCase();
  if (!email) return false;

  const { data, error } = await supabase
    .from(MEMBERS_TABLE)
    .select('role')
    .eq('trip_id', tripId)
    .eq('email', email)
    .maybeSingle();

  if (error) {
    console.error('Unable to read your role on this trip.', error);
    return false;
  }
  return data?.role === 'coorganizer';
}
