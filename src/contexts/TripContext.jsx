import { createContext, useCallback, useMemo, useState } from 'react';
import { tripService } from '../services/trips/TripService.js';

export const TripContext = createContext(null);

/**
 * Keeps React synchronized with the persistence service.
 *
 * Components never access LocalStorage directly. This boundary will later let
 * us replace the browser repository with a remote API without rewriting pages.
 */
export function TripProvider({ children }) {
  const [trips, setTrips] = useState(() => tripService.getAll());

  const refreshTrips = useCallback(() => {
    const nextTrips = tripService.getAll();
    setTrips(nextTrips);
    return nextTrips;
  }, []);

  const getTripById = useCallback(
    (id) => trips.find((trip) => trip.id === id) || null,
    [trips],
  );

  const createTrip = useCallback((payload) => {
    const createdTrip = tripService.create(payload);
    setTrips(tripService.getAll());
    return createdTrip;
  }, []);

  const updateTrip = useCallback((id, patch) => {
    const updatedTrip = tripService.update(id, patch);
    setTrips(tripService.getAll());
    return updatedTrip;
  }, []);

  const deleteTrip = useCallback((id) => {
    const deleted = tripService.remove(id);
    if (deleted) setTrips(tripService.getAll());
    return deleted;
  }, []);

  const resetDemoData = useCallback(() => {
    const demoTrips = tripService.resetDemoData();
    setTrips(demoTrips);
  }, []);

  const value = useMemo(
    () => ({
      trips,
      getTripById,
      createTrip,
      updateTrip,
      deleteTrip,
      resetDemoData,
      refreshTrips,
    }),
    [
      trips,
      getTripById,
      createTrip,
      updateTrip,
      deleteTrip,
      resetDemoData,
      refreshTrips,
    ],
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}
