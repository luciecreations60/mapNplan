import { APP_CONFIG } from '../../config/app.config.js';
import { DEMO_TRIPS } from '../../data/demoTrips.js';
import { createId } from '../../utils/id.js';
import { localStorageService } from '../storage/LocalStorageService.js';

const STORAGE_KEY = 'trips';
const CURRENT_TRIP_SCHEMA_VERSION = 2;

/**
 * Trip repository façade.
 *
 * All persistence and normalization rules are centralized here. Pages operate
 * on stable domain objects and remain independent from the storage mechanism.
 */
class TripService {
  getAll() {
    const storedTrips = localStorageService.get(STORAGE_KEY);

    if (Array.isArray(storedTrips)) {
      const normalizedTrips = storedTrips.map((trip) => (
        this.#normalize(this.#migrateLegacyTrip(trip))
      ));
      localStorageService.set(STORAGE_KEY, normalizedTrips);
      return normalizedTrips;
    }

    const initialTrips = APP_CONFIG.features.demoData
      ? DEMO_TRIPS.map((trip) => this.#normalize({ ...trip }))
      : [];

    localStorageService.set(STORAGE_KEY, initialTrips);
    return initialTrips;
  }

  getById(id) {
    return this.getAll().find((trip) => trip.id === id) || null;
  }

  create(payload) {
    const trips = this.getAll();
    const newTrip = this.#normalize({
      ...payload,
      id: createId('trip'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      itinerary: [],
      expenses: [],
      checklist: [],
      notes: '',
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


  /**
   * Enriches the original V0.1 demonstration trips once, without overwriting
   * collections that a user has already edited.
   */
  #migrateLegacyTrip(trip) {
    const demoTrip = DEMO_TRIPS.find((item) => item.id === trip.id);
    if (!demoTrip) return trip;

    return {
      ...trip,
      itinerary: Object.hasOwn(trip, 'itinerary') ? trip.itinerary : demoTrip.itinerary,
      expenses: Object.hasOwn(trip, 'expenses') ? trip.expenses : demoTrip.expenses,
      checklist: Object.hasOwn(trip, 'checklist') ? trip.checklist : demoTrip.checklist,
      notes: Object.hasOwn(trip, 'notes') ? trip.notes : demoTrip.notes,
    };
  }

  #normalize(trip) {
    const expenses = this.#normalizeExpenses(trip.expenses);
    const checklist = this.#normalizeChecklist(trip.checklist);
    const itinerary = this.#normalizeItinerary(trip.itinerary);
    const calculatedSpent = expenses
      .filter((expense) => expense.paid)
      .reduce((sum, expense) => sum + expense.amount, 0);
    const checklistCompleted = checklist.filter((item) => item.completed).length;

    return {
      schemaVersion: CURRENT_TRIP_SCHEMA_VERSION,
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
      spent: expenses.length > 0
        ? calculatedSpent
        : Math.max(0, Number(trip.spent) || 0),
      checklistCompleted: checklist.length > 0
        ? checklistCompleted
        : Math.max(0, Number(trip.checklistCompleted) || 0),
      checklistTotal: checklist.length > 0
        ? checklist.length
        : Math.max(0, Number(trip.checklistTotal) || 0),
      accent: trip.accent || 'violet',
      summary: String(trip.summary || '').trim(),
      notes: String(trip.notes || ''),
      itinerary,
      expenses,
      checklist,
      createdAt: trip.createdAt || new Date().toISOString(),
      updatedAt: trip.updatedAt || new Date().toISOString(),
    };
  }

  #normalizeExpenses(expenses) {
    if (!Array.isArray(expenses)) return [];

    return expenses.map((expense) => ({
      id: expense.id || createId('expense'),
      label: String(expense.label || 'Expense').trim(),
      category: String(expense.category || 'other').trim(),
      amount: Math.max(0, Number(expense.amount) || 0),
      date: expense.date || '',
      paid: Boolean(expense.paid),
    }));
  }

  #normalizeChecklist(checklist) {
    if (!Array.isArray(checklist)) return [];

    return checklist.map((item) => ({
      id: item.id || createId('check'),
      label: String(item.label || 'Checklist item').trim(),
      category: String(item.category || 'other').trim(),
      completed: Boolean(item.completed),
    }));
  }

  #normalizeItinerary(itinerary) {
    if (!Array.isArray(itinerary)) return [];

    return itinerary
      .map((day) => ({
        id: day.id || createId('day'),
        date: day.date || '',
        title: String(day.title || '').trim(),
        items: Array.isArray(day.items)
          ? day.items
              .map((item) => ({
                id: item.id || createId('activity'),
                time: item.time || '',
                type: String(item.type || 'map').trim(),
                title: String(item.title || 'Activity').trim(),
                location: String(item.location || '').trim(),
                durationMinutes: Math.max(0, Number(item.durationMinutes) || 0),
                estimatedCost: Math.max(0, Number(item.estimatedCost) || 0),
                notes: String(item.notes || '').trim(),
              }))
              .sort((left, right) => left.time.localeCompare(right.time))
          : [],
      }))
      .sort((left, right) => left.date.localeCompare(right.date));
  }
}

export const tripService = new TripService();
