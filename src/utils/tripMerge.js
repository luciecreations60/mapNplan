/**
 * Reconciles the local trip library with the copy held on the server.
 *
 * Kept free of any network dependency so the rule can be reasoned about and
 * tested on its own: for each trip id, whichever side was updated most
 * recently wins, and trips present on only one side are carried over intact.
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
