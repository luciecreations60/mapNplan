import { APP_CONFIG } from '../../config/app.config.js';
import { DEMO_TRIPS } from '../../data/demoTrips.js';
import { createId } from '../../utils/id.js';
import { localStorageService } from '../storage/LocalStorageService.js';

const STORAGE_KEY = 'trips';

/**
 * Trip repository façade.
 * All persistence and normalization rules for trips are centralized here.
 */
class TripService {
  getAll() {
    const storedTrips = localStorageService.get(STORAGE_KEY);

    if (Array.isArray(storedTrips)) {
      return storedTrips;
    }

    const initialTrips = APP_CONFIG.features.demoData
      ? DEMO_TRIPS.map((trip) => ({ ...trip }))
      : [];

    localStorageService.set(STORAGE_KEY, initialTrips);
    return initialTrips;
  }

  create(payload) {
    const trips = this.getAll();
    const newTrip = this.#normalize({
      ...payload,
      id: createId('trip'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    localStorageService.set(STORAGE_KEY, [...trips, newTrip]);
    return newTrip;
  }

  update(id, patch) {
    let updatedTrip = null;
    const trips = this.getAll().map((trip) => {
      if (trip.id !== id) return trip;

      updatedTrip = this.#normalize({
        ...trip,
        ...patch,
        id,
        updatedAt: new Date().toISOString(),
      });
      return updatedTrip;
    });

    localStorageService.set(STORAGE_KEY, trips);
    return updatedTrip;
  }

  remove(id) {
    const trips = this.getAll();
    const nextTrips = trips.filter((trip) => trip.id !== id);
    localStorageService.set(STORAGE_KEY, nextTrips);
    return nextTrips.length !== trips.length;
  }

  resetDemoData() {
    localStorageService.remove(STORAGE_KEY);
    return this.getAll();
  }

  #normalize(trip) {
    return {
      id: trip.id,
      name: String(trip.name || 'Untitled trip').trim(),
      destination: String(trip.destination || '').trim(),
      country: String(trip.country || '').trim(),
      countryCode: String(trip.countryCode || '').trim().toUpperCase(),
      startDate: trip.startDate || '',
      endDate: trip.endDate || '',
      travelers: Math.max(1, Number(trip.travelers) || 1),
      currency: trip.currency || APP_CONFIG.defaultCurrency,
      budget: Math.max(0, Number(trip.budget) || 0),
      spent: Math.max(0, Number(trip.spent) || 0),
      checklistCompleted: Math.max(0, Number(trip.checklistCompleted) || 0),
      checklistTotal: Math.max(0, Number(trip.checklistTotal) || 0),
      accent: trip.accent || 'violet',
      summary: String(trip.summary || '').trim(),
      createdAt: trip.createdAt || new Date().toISOString(),
      updatedAt: trip.updatedAt || new Date().toISOString(),
    };
  }
}

export const tripService = new TripService();
