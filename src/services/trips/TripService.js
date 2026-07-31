import { APP_CONFIG } from '../../config/app.config.js';
import { DEMO_TRIPS } from '../../data/demoTrips.js';
import { createId } from '../../utils/id.js';
import { hasValidCoordinates } from '../../utils/map.js';
import { normalizeExternalUrl } from '../../utils/url.js';
import { localStorageService } from '../storage/LocalStorageService.js';

const STORAGE_KEY = 'trips';
const CURRENT_TRIP_SCHEMA_VERSION = 7;

/**
 * Trip repository façade.
 *
 * All persistence, migrations, cloning and normalization rules are centralized
 * here. React pages operate on stable domain objects and remain independent
 * from the current LocalStorage implementation.
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
    const now = new Date().toISOString();
    const newTrip = this.#normalize({
      ...payload,
      id: createId('trip'),
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
      isFavorite: false,
      pinnedAt: null,
      itinerary: [],
      expenses: [],
      checklist: [],
      reservations: [],
      documents: [],
      notes: '',
      collaboration: null,
      destinationCurrency: payload.destinationCurrency || payload.currency || APP_CONFIG.defaultCurrency,
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

  duplicate(id, name) {
    const sourceTrip = this.getById(id);
    if (!sourceTrip) return null;

    const now = new Date().toISOString();
    const duplicateTrip = this.#normalize({
      ...structuredClone(sourceTrip),
      id: createId('trip'),
      name: String(name || `${sourceTrip.name} copy`).trim(),
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
      isFavorite: false,
      pinnedAt: null,
      itinerary: sourceTrip.itinerary.map((day) => ({
        ...day,
        id: createId('day'),
        items: day.items.map((item) => ({ ...item, id: createId('activity'), comments: [] })),
      })),
      expenses: sourceTrip.expenses.map((expense) => ({ ...expense, id: createId('expense') })),
      checklist: sourceTrip.checklist.map((item) => ({ ...item, id: createId('check') })),
      reservations: sourceTrip.reservations.map((reservation) => ({
        ...reservation,
        id: createId('reservation'),
        createdAt: now,
        comments: [],
      })),
      documents: sourceTrip.documents.map((document) => ({
        ...document,
        id: createId('document'),
        createdAt: now,
      })),
      collaboration: {
        members: [{
          id: createId('member'),
          name: sourceTrip.collaboration?.members?.find((member) => member.role === 'owner')?.name
            || APP_CONFIG.demoUserName,
          email: sourceTrip.collaboration?.members?.find((member) => member.role === 'owner')?.email || '',
          role: 'owner',
          addedAt: now,
        }],
        activityLog: [],
        share: { enabled: false, lastCreatedAt: null },
      },
    });

    localStorageService.set(STORAGE_KEY, [...this.getAll(), duplicateTrip]);
    return duplicateTrip;
  }


  toggleFavorite(id) {
    const trip = this.getById(id);
    if (!trip) return null;
    return this.update(id, { isFavorite: !trip.isFavorite });
  }

  togglePinned(id) {
    const trip = this.getById(id);
    if (!trip) return null;
    return this.update(id, { pinnedAt: trip.pinnedAt ? null : new Date().toISOString() });
  }

  archive(id) {
    return this.update(id, { archivedAt: new Date().toISOString() });
  }

  restore(id) {
    return this.update(id, { archivedAt: null });
  }

  replaceAll(trips) {
    if (!Array.isArray(trips)) {
      throw new Error('A trips array is required.');
    }

    const normalizedTrips = trips.map((trip) => this.#normalize(this.#migrateLegacyTrip(trip)));
    localStorageService.set(STORAGE_KEY, normalizedTrips);
    return normalizedTrips;
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
   * Enriches existing demonstration trips once without overwriting collections
   * already created or edited by the user.
   */
  #migrateLegacyTrip(trip) {
    const demoTrip = DEMO_TRIPS.find((item) => item.id === trip.id);
    const migratedTrip = {
      ...trip,
      archivedAt: Object.hasOwn(trip, 'archivedAt') ? trip.archivedAt : null,
      isFavorite: Object.hasOwn(trip, 'isFavorite') ? Boolean(trip.isFavorite) : false,
      pinnedAt: Object.hasOwn(trip, 'pinnedAt') ? trip.pinnedAt : null,
    };

    if (!demoTrip) return migratedTrip;

    return {
      ...migratedTrip,
      itinerary: Object.hasOwn(trip, 'itinerary') ? trip.itinerary : demoTrip.itinerary,
      expenses: Object.hasOwn(trip, 'expenses') ? trip.expenses : demoTrip.expenses,
      checklist: Object.hasOwn(trip, 'checklist') ? trip.checklist : demoTrip.checklist,
      reservations: Object.hasOwn(trip, 'reservations') ? trip.reservations : demoTrip.reservations,
      documents: Object.hasOwn(trip, 'documents') ? trip.documents : demoTrip.documents,
      notes: Object.hasOwn(trip, 'notes') ? trip.notes : demoTrip.notes,
      destinationCurrency: Object.hasOwn(trip, 'destinationCurrency')
        ? trip.destinationCurrency
        : demoTrip.destinationCurrency,
    };
  }

  #normalize(trip) {
    const expenses = this.#normalizeExpenses(trip.expenses);
    const checklist = this.#normalizeChecklist(trip.checklist);
    const itinerary = this.#normalizeItinerary(trip.itinerary);
    const reservations = this.#normalizeReservations(trip.reservations);
    const documents = this.#normalizeDocuments(trip.documents);
    const collaboration = this.#normalizeCollaboration(trip.collaboration, trip);
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
      currency: String(trip.currency || APP_CONFIG.defaultCurrency).trim().toUpperCase(),
      destinationCurrency: String(
        trip.destinationCurrency || trip.currency || APP_CONFIG.defaultCurrency,
      ).trim().toUpperCase(),
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
      accent: ['violet', 'aqua', 'coral'].includes(trip.accent) ? trip.accent : 'violet',
      summary: String(trip.summary || '').trim(),
      notes: String(trip.notes || ''),
      itinerary,
      expenses,
      checklist,
      reservations,
      documents,
      collaboration,
      archivedAt: trip.archivedAt || null,
      isFavorite: Boolean(trip.isFavorite),
      pinnedAt: trip.pinnedAt || null,
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
                latitude: this.#normalizeLatitude(item.latitude),
                longitude: this.#normalizeLongitude(item.longitude),
                durationMinutes: Math.max(0, Number(item.durationMinutes) || 0),
                estimatedCost: Math.max(0, Number(item.estimatedCost) || 0),
                notes: String(item.notes || '').trim(),
                comments: this.#normalizeComments(item.comments),
              }))
              .sort((left, right) => left.time.localeCompare(right.time))
          : [],
      }))
      .sort((left, right) => left.date.localeCompare(right.date));
  }

  #normalizeReservations(reservations) {
    if (!Array.isArray(reservations)) return [];

    return reservations.map((reservation) => ({
      id: reservation.id || createId('reservation'),
      type: ['flight', 'accommodation', 'transport', 'activity'].includes(reservation.type)
        ? reservation.type
        : 'activity',
      title: String(reservation.title || 'Reservation').trim(),
      provider: String(reservation.provider || '').trim(),
      confirmationNumber: String(reservation.confirmationNumber || '').trim(),
      startDate: reservation.startDate || '',
      startTime: reservation.startTime || '',
      endDate: reservation.endDate || '',
      endTime: reservation.endTime || '',
      location: String(reservation.location || '').trim(),
      status: ['confirmed', 'pending', 'cancelled'].includes(reservation.status)
        ? reservation.status
        : 'pending',
      amount: Math.max(0, Number(reservation.amount) || 0),
      url: normalizeExternalUrl(reservation.url),
      latitude: this.#normalizeLatitude(reservation.latitude),
      longitude: this.#normalizeLongitude(reservation.longitude),
      notes: String(reservation.notes || '').trim(),
      comments: this.#normalizeComments(reservation.comments),
      createdAt: reservation.createdAt || new Date().toISOString(),
    }));
  }

  #normalizeDocuments(documents) {
    if (!Array.isArray(documents)) return [];

    return documents.map((document) => ({
      id: document.id || createId('document'),
      type: ['passport', 'identity', 'ticket', 'booking', 'insurance', 'other'].includes(document.type)
        ? document.type
        : 'other',
      title: String(document.title || 'Document').trim(),
      reference: String(document.reference || '').trim(),
      url: normalizeExternalUrl(document.url),
      expiryDate: document.expiryDate || '',
      notes: String(document.notes || '').trim(),
      createdAt: document.createdAt || new Date().toISOString(),
    }));
  }

  #normalizeComments(comments) {
    if (!Array.isArray(comments)) return [];

    return comments
      .map((comment) => ({
        id: comment.id || createId('comment'),
        authorName: String(comment.authorName || APP_CONFIG.demoUserName).trim(),
        message: String(comment.message || '').trim().slice(0, 500),
        createdAt: comment.createdAt || new Date().toISOString(),
      }))
      .filter((comment) => comment.message);
  }

  #normalizeCollaboration(collaboration, trip) {
    const now = new Date().toISOString();
    const sourceMembers = Array.isArray(collaboration?.members) ? collaboration.members : [];
    let members = sourceMembers.map((member) => ({
      id: member.id || createId('member'),
      name: String(member.name || APP_CONFIG.demoUserName).trim(),
      email: String(member.email || '').trim().toLowerCase(),
      role: ['owner', 'editor', 'viewer'].includes(member.role) ? member.role : 'viewer',
      addedAt: member.addedAt || trip.createdAt || now,
    }));

    if (!members.some((member) => member.role === 'owner')) {
      members = [{
        id: createId('member'),
        name: APP_CONFIG.demoUserName,
        email: '',
        role: 'owner',
        addedAt: trip.createdAt || now,
      }, ...members];
    }

    const activityLog = Array.isArray(collaboration?.activityLog)
      ? collaboration.activityLog.map((entry) => ({
          id: entry.id || createId('activity-log'),
          action: String(entry.action || 'tripUpdated').trim(),
          actorName: String(entry.actorName || APP_CONFIG.demoUserName).trim(),
          entityType: String(entry.entityType || 'trip').trim(),
          entityId: String(entry.entityId || '').trim(),
          targetTitle: String(entry.targetTitle || '').trim(),
          createdAt: entry.createdAt || now,
        })).slice(0, 100)
      : [];

    return {
      members,
      activityLog,
      share: {
        enabled: Boolean(collaboration?.share?.enabled),
        lastCreatedAt: collaboration?.share?.lastCreatedAt || null,
      },
    };
  }

  #normalizeLatitude(value) {
    if (value === null || value === undefined || value === '') return null;
    const number = Number(value);
    return hasValidCoordinates(number, 0) ? number : null;
  }

  #normalizeLongitude(value) {
    if (value === null || value === undefined || value === '') return null;
    const number = Number(value);
    return hasValidCoordinates(0, number) ? number : null;
  }
}

export const tripService = new TripService();
