import { useContext } from 'react';
import { TripContext } from '../contexts/TripContext.jsx';

export function useTrips() {
  const context = useContext(TripContext);
  if (!context) throw new Error('useTrips must be used inside TripProvider.');
  return context;
}
