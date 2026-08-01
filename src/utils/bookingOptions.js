import { createId } from './id.js';
import { normalizeExternalUrl } from './url.js';

export const BOOKING_OPTION_CATEGORIES = Object.freeze([
  'hotels', 'flights', 'activities', 'cars', 'esim', 'insurance',
]);

export const BOOKING_OPTION_STATUSES = Object.freeze([
  'saved', 'shortlisted', 'booked', 'rejected',
]);

export function normalizeBookingOption(option, fallbackCurrency = 'EUR') {
  const amount = Math.max(0, Number(option?.price) || 0);
  const requestedCurrency = String(option?.currency || fallbackCurrency || 'EUR').trim().toUpperCase();
  const currency = /^[A-Z]{3}$/.test(requestedCurrency)
    ? requestedCurrency
    : String(fallbackCurrency || 'EUR').trim().toUpperCase();
  return {
    id: option?.id || createId('booking-option'),
    category: BOOKING_OPTION_CATEGORIES.includes(option?.category) ? option.category : 'hotels',
    providerId: String(option?.providerId || 'other').trim(),
    providerName: String(option?.providerName || 'Other').trim(),
    title: String(option?.title || 'Booking option').trim(),
    price: amount,
    currency,
    url: normalizeExternalUrl(option?.url || '') || '',
    status: BOOKING_OPTION_STATUSES.includes(option?.status) ? option.status : 'saved',
    notes: String(option?.notes || '').trim(),
    createdAt: option?.createdAt || new Date().toISOString(),
    updatedAt: option?.updatedAt || option?.createdAt || new Date().toISOString(),
    bookedAt: option?.status === 'booked'
      ? (option?.bookedAt || new Date().toISOString())
      : null,
  };
}

export function summarizeBookingOptions(options = []) {
  return options.reduce((summary, option) => {
    summary.total += 1;
    summary[option.status] = (summary[option.status] || 0) + 1;
    if (option.status === 'booked') summary.bookedValue += Number(option.price) || 0;
    return summary;
  }, { total: 0, saved: 0, shortlisted: 0, booked: 0, rejected: 0, bookedValue: 0 });
}
