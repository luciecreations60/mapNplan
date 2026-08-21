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
    source: String(option?.source || '').trim(),
    sourceActivityId: String(option?.sourceActivityId || '').trim(),
    location: String(option?.location || '').trim(),
    startDate: String(option?.startDate || '').trim(),
    endDate: String(option?.endDate || '').trim(),
    departureLocation: String(option?.departureLocation || '').trim(),
    arrivalLocation: String(option?.arrivalLocation || '').trim(),
    travelers: Math.max(1, Number(option?.travelers) || 1),
    // Accommodation comparison fields. Defaults keep every previously stored
    // option valid: an option saved before this feature simply compares with
    // no rating, no amenities and a flat price.
    pricePerNight: Math.max(0, Number(option?.pricePerNight) || 0),
    extraCosts: Math.max(0, Number(option?.extraCosts) || 0),
    rating: Math.min(10, Math.max(0, Number(option?.rating) || 0)),
    lodgingType: String(option?.lodgingType || '').trim(),
    amenities: Array.isArray(option?.amenities)
      ? [...new Set(option.amenities.map((amenity) => String(amenity).trim()).filter(Boolean))]
      : [],
    latitude: Number.isFinite(Number(option?.latitude)) ? Number(option.latitude) : null,
    longitude: Number.isFinite(Number(option?.longitude)) ? Number(option.longitude) : null,
    searchContextKey: String(option?.searchContextKey || '').trim(),
    createdAt: option?.createdAt || new Date().toISOString(),
    updatedAt: option?.updatedAt || option?.createdAt || new Date().toISOString(),
    bookedAt: option?.status === 'booked'
      ? (option?.bookedAt || new Date().toISOString())
      : null,
  };
}


export function rememberProviderSearch(options = [], { provider, url, context } = {}, fallbackCurrency = 'EUR') {
  if (!provider || !url || !context) return options;
  const sourceKey = [
    context.sourceActivityId || context.source || 'trip',
    provider.id,
    provider.category,
    context.location || context.arrivalLocation || '',
    context.startDate || '',
    context.endDate || '',
  ].join('|');

  const existing = options.find((option) => option.searchContextKey === sourceKey && option.status !== 'booked');
  const normalized = normalizeBookingOption({
    ...(existing || {}),
    category: provider.category,
    providerId: provider.id,
    providerName: provider.name,
    title: context.title || `${provider.name} · ${context.location || context.destination || ''}`.replace(/ · $/, ''),
    currency: context.currency || fallbackCurrency,
    url,
    status: existing?.status || 'saved',
    source: context.source,
    sourceActivityId: context.sourceActivityId,
    location: context.location,
    startDate: context.startDate,
    endDate: context.endDate,
    departureLocation: context.departureLocation,
    arrivalLocation: context.arrivalLocation,
    travelers: context.travelers,
    searchContextKey: sourceKey,
    createdAt: existing?.createdAt,
    updatedAt: new Date().toISOString(),
  }, fallbackCurrency);

  return existing
    ? options.map((option) => (option.id === existing.id ? normalized : option))
    : [...options, normalized];
}

export function summarizeBookingOptions(options = []) {
  return options.reduce((summary, option) => {
    summary.total += 1;
    summary[option.status] = (summary[option.status] || 0) + 1;
    if (option.status === 'booked') summary.bookedValue += Number(option.price) || 0;
    return summary;
  }, { total: 0, saved: 0, shortlisted: 0, booked: 0, rejected: 0, bookedValue: 0 });
}