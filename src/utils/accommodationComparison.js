import { parseLocalDate } from './date.js';

/**
 * Accommodation comparison.
 *
 * Candidates are compared inside a "stay": one destination and one date range.
 * Comparing across stays would be meaningless, so options are grouped first.
 *
 * The core value of this module is the real cost of a stay. A campsite at
 * 45/night without breakfast and a hotel at 78/night with breakfast included
 * are not comparable until nights and extras are folded in, so every candidate
 * is reduced to a single total for the whole stay.
 */

export const LODGING_TYPES = Object.freeze([
  { id: 'hotel', labelKey: 'stays.lodgingHotel', icon: 'hotel' },
  { id: 'camping', labelKey: 'stays.lodgingCamping', icon: 'pin' },
  { id: 'rental', labelKey: 'stays.lodgingRental', icon: 'building' },
  { id: 'guesthouse', labelKey: 'stays.lodgingGuesthouse', icon: 'trips' },
  { id: 'other', labelKey: 'stays.lodgingOther', icon: 'map' },
]);

export const AMENITIES = Object.freeze([
  { id: 'breakfast', labelKey: 'stays.amenityBreakfast', icon: 'food' },
  { id: 'parking', labelKey: 'stays.amenityParking', icon: 'car' },
  { id: 'wifi', labelKey: 'stays.amenityWifi', icon: 'wifi' },
  { id: 'kitchen', labelKey: 'stays.amenityKitchen', icon: 'food' },
  { id: 'pool', labelKey: 'stays.amenityPool', icon: 'droplets' },
  { id: 'airConditioning', labelKey: 'stays.amenityAirConditioning', icon: 'snowflake' },
]);

const EARTH_RADIUS_KM = 6371;

export function countNights(startDate, endDate) {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  if (!start || !end) return 0;
  const diff = Math.round((end - start) / 86_400_000);
  return diff > 0 ? diff : 0;
}

export function distanceInKm(from, to) {
  const lat1 = Number(from?.latitude);
  const lon1 = Number(from?.longitude);
  const lat2 = Number(to?.latitude);
  const lon2 = Number(to?.longitude);
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return null;

  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Total cost of the whole stay.
 *
 * A candidate may be priced per night or as an all-in total, because providers
 * quote both ways. Whichever the traveller entered, the other is derived so the
 * comparison table always has both figures for every candidate.
 */
export function computeStayCost(option, nights) {
  const effectiveNights = Math.max(1, Number(nights) || 0);
  const extras = Math.max(0, Number(option?.extraCosts) || 0);
  const perNight = Math.max(0, Number(option?.pricePerNight) || 0);
  const flatTotal = Math.max(0, Number(option?.price) || 0);

  if (perNight > 0) {
    const total = perNight * effectiveNights + extras;
    return { pricePerNight: perNight, total, extras, nights: effectiveNights, basis: 'perNight' };
  }

  if (flatTotal > 0) {
    return {
      pricePerNight: (flatTotal - extras) / effectiveNights,
      total: flatTotal,
      extras,
      nights: effectiveNights,
      basis: 'total',
    };
  }

  return { pricePerNight: 0, total: extras, extras, nights: effectiveNights, basis: 'unknown' };
}

export function stayKeyFor(option) {
  return [
    String(option?.location || '').trim().toLocaleLowerCase(),
    String(option?.startDate || '').trim(),
    String(option?.endDate || '').trim(),
  ].join('|');
}

/**
 * Groups accommodation candidates into comparable stays and enriches each
 * candidate with its computed cost and distance from the stay's reference
 * point. The cheapest candidate of each group is flagged so the table can
 * highlight it without recomputing.
 */
export function buildStayGroups(options = [], referencePoint = null) {
  const accommodations = options.filter((option) => option?.category === 'hotels');
  const groups = new Map();

  for (const option of accommodations) {
    const key = stayKeyFor(option);
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        location: option.location || '',
        startDate: option.startDate || '',
        endDate: option.endDate || '',
        travelers: Math.max(1, Number(option.travelers) || 1),
        nights: countNights(option.startDate, option.endDate),
        candidates: [],
      });
    }

    const group = groups.get(key);
    const cost = computeStayCost(option, group.nights);
    group.candidates.push({
      ...option,
      cost,
      distanceKm: distanceInKm(referencePoint, option),
    });
  }

  return [...groups.values()]
    .map((group) => {
      const priced = group.candidates.filter((candidate) => candidate.cost.total > 0);
      const cheapestTotal = priced.length > 0
        ? Math.min(...priced.map((candidate) => candidate.cost.total))
        : null;
      const bestRating = Math.max(0, ...group.candidates.map((candidate) => Number(candidate.rating) || 0));

      return {
        ...group,
        cheapestTotal,
        candidates: group.candidates
          .map((candidate) => ({
            ...candidate,
            isCheapest: cheapestTotal !== null && candidate.cost.total === cheapestTotal,
            isBestRated: bestRating > 0 && Number(candidate.rating) === bestRating,
          }))
          .sort((left, right) => {
            if (left.status === 'booked' && right.status !== 'booked') return -1;
            if (right.status === 'booked' && left.status !== 'booked') return 1;
            return (left.cost.total || Infinity) - (right.cost.total || Infinity);
          }),
      };
    })
    .sort((left, right) => String(left.startDate).localeCompare(String(right.startDate)));
}
