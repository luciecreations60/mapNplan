import { createId } from '../../utils/id.js';
import { localStorageService } from '../storage/LocalStorageService.js';

const TRIP_TEMPLATE_KEY = 'trip-templates';
const DAY_TEMPLATE_KEY = 'day-templates';
const TEMPLATE_FORMAT = 'tripflow-template-library';
const TEMPLATE_FORMAT_VERSION = 1;

/**
 * Local template repository.
 *
 * Trip and day templates deliberately live outside the TripService. They are
 * reusable assets rather than journeys and can later be synchronized through
 * a dedicated backend without changing the trip domain.
 */
class TemplateService {
  getTripTemplates() {
    const stored = localStorageService.get(TRIP_TEMPLATE_KEY, []);
    return Array.isArray(stored) ? stored.map((template) => this.#normalizeTripTemplate(template)) : [];
  }

  getDayTemplates() {
    const stored = localStorageService.get(DAY_TEMPLATE_KEY, []);
    return Array.isArray(stored) ? stored.map((template) => this.#normalizeDayTemplate(template)) : [];
  }

  saveTripTemplate(template) {
    const templates = this.getTripTemplates();
    const normalized = this.#normalizeTripTemplate({
      ...template,
      id: template.id || createId('trip-template'),
      builtIn: false,
      updatedAt: new Date().toISOString(),
      createdAt: template.createdAt || new Date().toISOString(),
    });
    const nextTemplates = templates.some((item) => item.id === normalized.id)
      ? templates.map((item) => (item.id === normalized.id ? normalized : item))
      : [...templates, normalized];
    localStorageService.set(TRIP_TEMPLATE_KEY, nextTemplates);
    return normalized;
  }

  saveTripAsTemplate(trip, options = {}) {
    const includeItinerary = options.includeItinerary !== false;
    const includeChecklist = options.includeChecklist !== false;
    const includeBudget = Boolean(options.includeBudget);
    const sortedDays = [...(trip.itinerary || [])].sort((left, right) => left.date.localeCompare(right.date));

    return this.saveTripTemplate({
      name: String(options.name || `${trip.name} template`).trim(),
      description: String(options.description || trip.summary || '').trim(),
      category: String(options.category || 'custom'),
      durationDays: Math.max(1, sortedDays.length || this.#dateDifference(trip.startDate, trip.endDate) + 1),
      travelers: trip.travelers,
      budget: includeBudget ? trip.budget : 0,
      currency: trip.currency,
      destinationCurrency: trip.destinationCurrency,
      accent: trip.accent,
      summary: trip.summary,
      itineraryDays: includeItinerary
        ? sortedDays.map((day) => ({
            title: day.title,
            items: (day.items || []).map((item) => this.#stripActivity(item)),
          }))
        : [],
      checklist: includeChecklist
        ? (trip.checklist || []).map((item) => ({
            label: item.label,
            category: item.category,
            completed: false,
          }))
        : [],
      sourceTripId: trip.id,
    });
  }

  saveDayTemplate(template) {
    const templates = this.getDayTemplates();
    const normalized = this.#normalizeDayTemplate({
      ...template,
      id: template.id || createId('day-template'),
      builtIn: false,
      updatedAt: new Date().toISOString(),
      createdAt: template.createdAt || new Date().toISOString(),
    });
    const nextTemplates = templates.some((item) => item.id === normalized.id)
      ? templates.map((item) => (item.id === normalized.id ? normalized : item))
      : [...templates, normalized];
    localStorageService.set(DAY_TEMPLATE_KEY, nextTemplates);
    return normalized;
  }

  saveDayFromTrip(day, options = {}) {
    return this.saveDayTemplate({
      name: String(options.name || day.title || 'Day template').trim(),
      description: String(options.description || '').trim(),
      category: String(options.category || 'custom'),
      items: (day.items || []).map((item) => this.#stripActivity(item)),
      sourceDayId: day.id,
    });
  }

  removeTripTemplate(id) {
    const templates = this.getTripTemplates();
    const nextTemplates = templates.filter((template) => template.id !== id);
    localStorageService.set(TRIP_TEMPLATE_KEY, nextTemplates);
    return nextTemplates.length !== templates.length;
  }

  removeDayTemplate(id) {
    const templates = this.getDayTemplates();
    const nextTemplates = templates.filter((template) => template.id !== id);
    localStorageService.set(DAY_TEMPLATE_KEY, nextTemplates);
    return nextTemplates.length !== templates.length;
  }

  materializeTrip(template, payload) {
    const startDate = payload.startDate || '';
    const durationDays = Math.max(1, Number(template.durationDays) || template.itineraryDays?.length || 1);
    const endDate = payload.endDate || this.#addDays(startDate, durationDays - 1);
    const now = new Date().toISOString();

    return {
      payload: {
        name: String(payload.name || template.name || 'New trip').trim(),
        destination: String(payload.destination || '').trim(),
        destinationLatitude: payload.destinationLatitude ?? null,
        destinationLongitude: payload.destinationLongitude ?? null,
        country: String(payload.country || '').trim(),
        countryCode: String(payload.countryCode || '').trim().toUpperCase(),
        startDate,
        endDate,
        travelers: Math.max(1, Number(payload.travelers || template.travelers) || 1),
        budget: Math.max(0, Number(payload.budget ?? template.budget) || 0),
        currency: payload.currency || template.currency || 'EUR',
        destinationCurrency: payload.destinationCurrency || template.destinationCurrency || payload.currency || 'EUR',
        accent: payload.accent || template.accent || 'violet',
        summary: String(payload.summary || template.summary || '').trim(),
        sourceTemplateId: template.id || null,
        sourceTemplateName: template.name || '',
      },
      details: {
        itinerary: (template.itineraryDays || []).map((day, index) => ({
          id: createId('day'),
          date: this.#addDays(startDate, index),
          title: String(day.title || '').trim(),
          routePlan: null,
          items: (day.items || []).map((item) => ({
            ...this.#stripActivity(item),
            id: createId('activity'),
            completedAt: null,
            comments: [],
          })),
        })),
        checklist: (template.checklist || []).map((item) => ({
          id: createId('check'),
          label: String(item.label || '').trim(),
          category: String(item.category || 'other').trim(),
          completed: false,
        })),
      },
    };
  }

  applyDayTemplate(trip, template, date) {
    const items = (template.items || []).map((item) => ({
      ...this.#stripActivity(item),
      id: createId('activity'),
      completedAt: null,
      comments: [],
    }));
    const existingDay = (trip.itinerary || []).find((day) => day.date === date);
    const itinerary = existingDay
      ? trip.itinerary.map((day) => (
          day.id === existingDay.id
            ? { ...day, items: [...day.items, ...items] }
            : day
        ))
      : [...(trip.itinerary || []), {
          id: createId('day'),
          date,
          title: template.name || '',
          routePlan: null,
          items,
        }];

    return itinerary.sort((left, right) => left.date.localeCompare(right.date));
  }

  downloadLibrary() {
    const payload = {
      format: TEMPLATE_FORMAT,
      version: TEMPLATE_FORMAT_VERSION,
      exportedAt: new Date().toISOString(),
      tripTemplates: this.getTripTemplates(),
      dayTemplates: this.getDayTemplates(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `tripflow-template-library-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    return payload;
  }

  async importLibrary(file) {
    const text = await file.text();
    const payload = JSON.parse(text);
    if (payload?.format !== TEMPLATE_FORMAT || payload?.version !== TEMPLATE_FORMAT_VERSION) {
      throw new Error('Unsupported template library.');
    }

    const importedTripTemplates = Array.isArray(payload.tripTemplates)
      ? payload.tripTemplates.map((template) => this.#normalizeTripTemplate({
          ...template,
          id: createId('trip-template'),
          builtIn: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }))
      : [];
    const importedDayTemplates = Array.isArray(payload.dayTemplates)
      ? payload.dayTemplates.map((template) => this.#normalizeDayTemplate({
          ...template,
          id: createId('day-template'),
          builtIn: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }))
      : [];

    localStorageService.set(TRIP_TEMPLATE_KEY, [...this.getTripTemplates(), ...importedTripTemplates]);
    localStorageService.set(DAY_TEMPLATE_KEY, [...this.getDayTemplates(), ...importedDayTemplates]);
    return {
      tripTemplateCount: importedTripTemplates.length,
      dayTemplateCount: importedDayTemplates.length,
    };
  }

  #normalizeTripTemplate(template) {
    return {
      id: String(template.id || createId('trip-template')),
      builtIn: Boolean(template.builtIn),
      name: String(template.name || 'Trip template').trim(),
      description: String(template.description || '').trim(),
      category: String(template.category || 'custom').trim(),
      durationDays: Math.max(1, Number(template.durationDays) || template.itineraryDays?.length || 1),
      travelers: Math.max(1, Number(template.travelers) || 1),
      budget: Math.max(0, Number(template.budget) || 0),
      currency: String(template.currency || 'EUR').trim().toUpperCase(),
      destinationCurrency: String(template.destinationCurrency || template.currency || 'EUR').trim().toUpperCase(),
      accent: ['violet', 'aqua', 'coral'].includes(template.accent) ? template.accent : 'violet',
      summary: String(template.summary || '').trim(),
      itineraryDays: Array.isArray(template.itineraryDays)
        ? template.itineraryDays.map((day) => ({
            title: String(day.title || '').trim(),
            items: Array.isArray(day.items) ? day.items.map((item) => this.#stripActivity(item)) : [],
          }))
        : [],
      checklist: Array.isArray(template.checklist)
        ? template.checklist.map((item) => ({
            label: String(item.label || '').trim(),
            category: String(item.category || 'other').trim(),
            completed: false,
          })).filter((item) => item.label)
        : [],
      sourceTripId: template.sourceTripId || null,
      createdAt: template.createdAt || new Date().toISOString(),
      updatedAt: template.updatedAt || template.createdAt || new Date().toISOString(),
    };
  }

  #normalizeDayTemplate(template) {
    return {
      id: String(template.id || createId('day-template')),
      builtIn: Boolean(template.builtIn),
      name: String(template.name || 'Day template').trim(),
      description: String(template.description || '').trim(),
      category: String(template.category || 'custom').trim(),
      items: Array.isArray(template.items) ? template.items.map((item) => this.#stripActivity(item)) : [],
      sourceDayId: template.sourceDayId || null,
      createdAt: template.createdAt || new Date().toISOString(),
      updatedAt: template.updatedAt || template.createdAt || new Date().toISOString(),
    };
  }

  #stripActivity(item) {
    return {
      time: String(item.time || ''),
      type: String(item.type || 'map'),
      title: String(item.title || 'Activity').trim(),
      location: String(item.location || '').trim(),
      latitude: item.latitude ?? null,
      longitude: item.longitude ?? null,
      durationMinutes: Math.max(0, Number(item.durationMinutes) || 0),
      estimatedCost: Math.max(0, Number(item.estimatedCost) || 0),
      notes: String(item.notes || '').trim(),
    };
  }

  #addDays(value, numberOfDays) {
    if (!value) return '';
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    date.setUTCDate(date.getUTCDate() + numberOfDays);
    return date.toISOString().slice(0, 10);
  }

  #dateDifference(startDate, endDate) {
    if (!startDate || !endDate) return 0;
    const start = new Date(`${startDate}T00:00:00Z`);
    const end = new Date(`${endDate}T00:00:00Z`);
    return Math.max(0, Math.round((end - start) / 86400000));
  }
}

export const templateService = new TemplateService();
