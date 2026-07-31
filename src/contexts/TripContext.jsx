import { createContext, useCallback, useMemo, useState } from 'react';
import { tripService } from '../services/trips/TripService.js';

export const TripContext = createContext(null);

export function TripProvider({ children }) {
  const [trips, setTrips] = useState(() => tripService.getAll());

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
    () => ({ trips, createTrip, updateTrip, deleteTrip, resetDemoData }),
    [trips, createTrip, updateTrip, deleteTrip, resetDemoData],
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}
