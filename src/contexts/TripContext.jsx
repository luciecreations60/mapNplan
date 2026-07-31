import { createContext, useCallback, useMemo, useState } from 'react';
import { dataPortabilityService } from '../services/data/DataPortabilityService.js';
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

  const duplicateTrip = useCallback((id, name) => {
    const duplicatedTrip = tripService.duplicate(id, name);
    if (duplicatedTrip) setTrips(tripService.getAll());
    return duplicatedTrip;
  }, []);

  const toggleTripFavorite = useCallback((id) => {
    const updatedTrip = tripService.toggleFavorite(id);
    if (updatedTrip) setTrips(tripService.getAll());
    return updatedTrip;
  }, []);

  const toggleTripPinned = useCallback((id) => {
    const updatedTrip = tripService.togglePinned(id);
    if (updatedTrip) setTrips(tripService.getAll());
    return updatedTrip;
  }, []);

  const archiveTrip = useCallback((id) => {
    const archivedTrip = tripService.archive(id);
    if (archivedTrip) setTrips(tripService.getAll());
    return archivedTrip;
  }, []);

  const restoreTrip = useCallback((id) => {
    const restoredTrip = tripService.restore(id);
    if (restoredTrip) setTrips(tripService.getAll());
    return restoredTrip;
  }, []);

  const deleteTrip = useCallback((id) => {
    const deleted = tripService.remove(id);
    if (deleted) setTrips(tripService.getAll());
    return deleted;
  }, []);

  const exportBackup = useCallback(() => {
    dataPortabilityService.downloadBackup(tripService.getAll());
  }, []);

  const importBackup = useCallback(async (file) => {
    const importedTrips = await dataPortabilityService.readBackup(file);
    const normalizedTrips = tripService.replaceAll(importedTrips);
    setTrips(normalizedTrips);
    return normalizedTrips;
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
      duplicateTrip,
      toggleTripFavorite,
      toggleTripPinned,
      archiveTrip,
      restoreTrip,
      deleteTrip,
      resetDemoData,
      exportBackup,
      importBackup,
      refreshTrips,
    }),
    [
      trips,
      getTripById,
      createTrip,
      updateTrip,
      duplicateTrip,
      toggleTripFavorite,
      toggleTripPinned,
      archiveTrip,
      restoreTrip,
      deleteTrip,
      resetDemoData,
      exportBackup,
      importBackup,
      refreshTrips,
    ],
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}
