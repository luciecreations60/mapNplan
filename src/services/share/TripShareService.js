
import { PROJECT_CONFIG } from '../../../project.config.js';

const SHARE_FORMAT = 'tripflow-share';
const SHARE_VERSION = 1;
const RECOMMENDED_URL_LENGTH = 12000;

/**
 * Creates privacy-aware, read-only snapshots for public sharing.
 * Confirmation numbers, document references, private links and internal
 * discussion comments are deliberately excluded from every snapshot.
 */
class TripShareService {
  createSnapshot(trip, options = {}) {
    const includeBudget = Boolean(options.includeBudget);
    const includeNotes = Boolean(options.includeNotes);
    const includeChecklist = options.includeChecklist !== false;

    return {
      format: SHARE_FORMAT,
      version: SHARE_VERSION,
      createdAt: new Date().toISOString(),
      application: PROJECT_CONFIG.brandName,
      trip: {
        id: trip.id,
        name: trip.name,
        destination: trip.destination,
        destinationLatitude: trip.destinationLatitude,
        destinationLongitude: trip.destinationLongitude,
        country: trip.country,
        countryCode: trip.countryCode,
        startDate: trip.startDate,
        endDate: trip.endDate,
        travelers: trip.travelers,
        currency: trip.currency,
        accent: trip.accent,
        summary: trip.summary,
        itinerary: trip.itinerary.map((day) => ({
          id: day.id,
          date: day.date,
          title: day.title,
          items: day.items.map(({ comments, notes, estimatedCost, ...item }) => ({
            ...item,
            notes: includeNotes ? notes : '',
            estimatedCost: includeBudget ? estimatedCost : 0,
          })),
        })),
        reservations: trip.reservations.map((reservation) => ({
          id: reservation.id,
          type: reservation.type,
          title: reservation.title,
          provider: reservation.provider,
          startDate: reservation.startDate,
          startTime: reservation.startTime,
          endDate: reservation.endDate,
          endTime: reservation.endTime,
          location: reservation.location,
          status: reservation.status,
          amount: includeBudget ? reservation.amount : 0,
          latitude: reservation.latitude,
          longitude: reservation.longitude,
          notes: includeNotes ? reservation.notes : '',
        })),
        checklist: includeChecklist
          ? trip.checklist.map((item) => ({
              id: item.id,
              label: item.label,
              category: item.category,
              completed: item.completed,
            }))
          : [],
        notes: includeNotes ? trip.notes : '',
        budget: includeBudget ? trip.budget : null,
        expenses: includeBudget
          ? trip.expenses.map((expense) => ({
              id: expense.id,
              label: expense.label,
              category: expense.category,
              amount: expense.amount,
              paid: expense.paid,
              paidAmount: Number(expense.paidAmount || 0),
            }))
          : [],
        shareOptions: { includeBudget, includeNotes, includeChecklist },
      },
    };
  }

  createShareUrl(snapshot) {
    const encodedSnapshot = this.encode(snapshot);
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    const url = `${baseUrl}#/shared?data=${encodedSnapshot}`;

    return {
      url,
      characterCount: url.length,
      exceedsRecommendedLength: url.length > RECOMMENDED_URL_LENGTH,
    };
  }

  encode(snapshot) {
    const bytes = new TextEncoder().encode(JSON.stringify(snapshot));
    let binary = '';
    for (let index = 0; index < bytes.length; index += 1) {
      binary += String.fromCharCode(bytes[index]);
    }
    return btoa(binary)
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replaceAll('=', '');
  }

  decode(encodedSnapshot) {
    if (!encodedSnapshot) throw new Error('Missing shared trip data.');

    const normalized = encodedSnapshot
      .replaceAll('-', '+')
      .replaceAll('_', '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const snapshot = JSON.parse(new TextDecoder().decode(bytes));
    return this.validateSnapshot(snapshot);
  }

  async readSnapshotFile(file) {
    if (!(file instanceof File)) throw new Error('A share file is required.');
    const snapshot = JSON.parse(await file.text());
    return this.validateSnapshot(snapshot);
  }

  validateSnapshot(snapshot) {
    if (
      snapshot?.format !== SHARE_FORMAT
      || snapshot?.version !== SHARE_VERSION
      || !snapshot?.trip?.name
      || !Array.isArray(snapshot.trip.itinerary)
      || !Array.isArray(snapshot.trip.reservations)
    ) {
      throw new Error('Unsupported shared trip format.');
    }

    return {
      ...snapshot,
      trip: {
        ...snapshot.trip,
        itinerary: snapshot.trip.itinerary,
        reservations: snapshot.trip.reservations,
        expenses: Array.isArray(snapshot.trip.expenses) ? snapshot.trip.expenses : [],
        checklist: Array.isArray(snapshot.trip.checklist) ? snapshot.trip.checklist : [],
        shareOptions: {
          includeBudget: Boolean(snapshot.trip.shareOptions?.includeBudget),
          includeNotes: Boolean(snapshot.trip.shareOptions?.includeNotes),
          includeChecklist: snapshot.trip.shareOptions?.includeChecklist !== false,
        },
      },
    };
  }

  async copyToClipboard(value) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }

    const input = document.createElement('textarea');
    input.value = value;
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    const copied = document.execCommand('copy');
    input.remove();
    if (!copied) throw new Error('Clipboard access is unavailable.');
  }

  downloadSnapshot(snapshot) {
    const safeName = String(snapshot.trip.name || 'shared-trip')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'shared-trip';
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${safeName}.tripflow-share.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}

export const tripShareService = new TripShareService();
