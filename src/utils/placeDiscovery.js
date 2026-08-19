import { estimateRouteSegment, haversineDistanceKm } from './routeOptimization.js';

export const DISCOVERY_CATEGORIES = Object.freeze([
  Object.freeze({ id: 'sights', icon: 'explore', savedCategory: 'sight' }),
  Object.freeze({ id: 'activities', icon: 'activity', savedCategory: 'sight' }),
  Object.freeze({ id: 'food', icon: 'food', savedCategory: 'food' }),
  Object.freeze({ id: 'nature', icon: 'pin', savedCategory: 'nature' }),
  Object.freeze({ id: 'shopping', icon: 'shopping', savedCategory: 'shopping' }),
  Object.freeze({ id: 'practical', icon: 'info', savedCategory: 'other' }),
]);

export const DISCOVERY_MINUTES = Object.freeze([5, 10, 20]);

const CATEGORY_SELECTORS = Object.freeze({
  sights: Object.freeze([
    '["tourism"~"^(attraction|museum|gallery|viewpoint|artwork)$"]',
    '["historic"]',
  ]),
  activities: Object.freeze([
    '["tourism"~"^(zoo|aquarium|theme_park)$"]',
    '["leisure"~"^(water_park|sports_centre|golf_course|fitness_centre)$"]',
    '["amenity"~"^(cinema|theatre)$"]',
  ]),
  food: Object.freeze([
    '["amenity"~"^(restaurant|cafe|fast_food|bar|pub|ice_cream)$"]',
  ]),
  nature: Object.freeze([
    '["natural"~"^(beach|peak|waterfall|hot_spring|spring)$"]',
    '["leisure"~"^(park|nature_reserve|garden)$"]',
    '["tourism"="viewpoint"]',
  ]),
  shopping: Object.freeze([
    '["shop"~"^(supermarket|bakery|convenience|mall|department_store|greengrocer)$"]',
    '["amenity"="marketplace"]',
  ]),
  practical: Object.freeze([
    '["amenity"~"^(fuel|pharmacy|parking|toilets|charging_station)$"]',
  ]),
});

export function getDiscoverySelectors(category) {
  return CATEGORY_SELECTORS[category] || CATEGORY_SELECTORS.sights;
}

export function getDiscoveryCategory(category) {
  return DISCOVERY_CATEGORIES.find((item) => item.id === category) || DISCOVERY_CATEGORIES[0];
}

export function getDiscoveryRadiusMeters(minutes, category, mode = 'around') {
  const safeMinutes = DISCOVERY_MINUTES.includes(Number(minutes)) ? Number(minutes) : 10;
  const general = safeMinutes === 5 ? 3500 : safeMinutes === 10 ? 7000 : 12000;
  const dense = safeMinutes === 5 ? 2200 : safeMinutes === 10 ? 3800 : 6000;
  const route = safeMinutes === 5 ? 2200 : safeMinutes === 10 ? 4200 : 7000;
  if (mode === 'route') return route;
  if (['food', 'shopping', 'practical'].includes(category)) return dense;
  return general;
}

export function normalizeOverpassElement(element, { language = 'fr', category = 'sights' } = {}) {
  const tags = element?.tags || {};
  const latitude = Number(element?.lat ?? element?.center?.lat);
  const longitude = Number(element?.lon ?? element?.center?.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const name = String(
    tags[`name:${language}`]
    || tags.name
    || tags['name:fr']
    || tags['name:en']
    || '',
  ).trim();
  if (!name) return null;

  const address = [
    [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' '),
    tags['addr:place'],
    tags['addr:city'] || tags['addr:town'] || tags['addr:village'],
  ].filter(Boolean).join(', ');

  return {
    id: `osm-${element.type}-${element.id}`,
    osmType: element.type,
    osmId: element.id,
    name,
    label: address || tags['addr:full'] || tags.description || name,
    latitude,
    longitude,
    category,
    savedCategory: getDiscoveryCategory(category).savedCategory,
    openingHours: String(tags.opening_hours || ''),
    website: String(tags.website || tags['contact:website'] || ''),
    source: 'openstreetmap',
  };
}

export function dedupeDiscoveryPlaces(places = []) {
  const seen = new Set();
  return places.filter((place) => {
    if (!place) return false;
    const key = `${String(place.name || '').trim().toLocaleLowerCase()}|${Number(place.latitude).toFixed(4)}|${Number(place.longitude).toFixed(4)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function buildRouteSearchCenters(routePoints = [], limit = 10) {
  const valid = routePoints
    .map((point) => ({ latitude: Number(point.latitude), longitude: Number(point.longitude) }))
    .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude));
  if (valid.length <= 1) return valid;

  const centers = [valid[0]];
  for (let index = 0; index < valid.length - 1; index += 1) {
    const from = valid[index];
    const to = valid[index + 1];
    const distance = haversineDistanceKm(from, to);
    const subdivisions = Math.max(1, Math.min(5, Math.ceil(distance / 18)));
    for (let step = 1; step <= subdivisions; step += 1) {
      const ratio = step / subdivisions;
      centers.push({
        latitude: from.latitude + (to.latitude - from.latitude) * ratio,
        longitude: from.longitude + (to.longitude - from.longitude) * ratio,
      });
    }
  }

  if (centers.length <= limit) return centers;
  const sampled = [];
  for (let index = 0; index < limit; index += 1) {
    sampled.push(centers[Math.round((index * (centers.length - 1)) / (limit - 1))]);
  }
  return sampled;
}

export function attachAroundRoadTimes(candidates, matrix, maxMinutes) {
  const durations = matrix?.durations?.[0] || [];
  const distances = matrix?.distances?.[0] || [];
  return candidates
    .map((place, index) => {
      const durationSeconds = durations[index + 1];
      if (!Number.isFinite(durationSeconds)) return null;
      const travelMinutes = Math.max(1, Math.round(durationSeconds / 60));
      if (travelMinutes > maxMinutes) return null;
      const distanceMeters = distances[index + 1];
      return {
        ...place,
        travelMinutes,
        roadDistanceKm: Number.isFinite(distanceMeters) ? round(distanceMeters / 1000, 1) : null,
        timingSource: 'road',
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.travelMinutes - right.travelMinutes || left.name.localeCompare(right.name));
}

export function attachRouteDetours(candidates, matrix, routeCount, maxMinutes) {
  if (!matrix?.durations || routeCount < 2) return [];
  return candidates
    .map((place, candidateIndex) => {
      const matrixCandidateIndex = routeCount + candidateIndex;
      let bestExtraSeconds = Number.POSITIVE_INFINITY;
      let bestSegment = -1;

      for (let routeIndex = 0; routeIndex < routeCount - 1; routeIndex += 1) {
        const direct = matrix.durations?.[routeIndex]?.[routeIndex + 1];
        const toCandidate = matrix.durations?.[routeIndex]?.[matrixCandidateIndex];
        const fromCandidate = matrix.durations?.[matrixCandidateIndex]?.[routeIndex + 1];
        if (![direct, toCandidate, fromCandidate].every(Number.isFinite)) continue;
        const extra = Math.max(0, toCandidate + fromCandidate - direct);
        if (extra < bestExtraSeconds) {
          bestExtraSeconds = extra;
          bestSegment = routeIndex;
        }
      }

      if (!Number.isFinite(bestExtraSeconds)) return null;
      const detourMinutes = Math.max(0, Math.round(bestExtraSeconds / 60));
      if (detourMinutes > maxMinutes) return null;
      return { ...place, detourMinutes, insertionSegment: bestSegment, timingSource: 'road' };
    })
    .filter(Boolean)
    .sort((left, right) => left.detourMinutes - right.detourMinutes || left.name.localeCompare(right.name));
}

export function attachAroundEstimatedTimes(anchor, candidates, maxMinutes) {
  return candidates
    .map((place) => {
      const segment = estimateRouteSegment(
        { id: 'anchor', latitude: anchor.latitude, longitude: anchor.longitude },
        { id: place.id, latitude: place.latitude, longitude: place.longitude },
        'driving',
      );
      if (segment.durationMinutes > maxMinutes) return null;
      return {
        ...place,
        travelMinutes: segment.durationMinutes,
        roadDistanceKm: round(segment.distanceKm, 1),
        timingSource: 'estimate',
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.travelMinutes - right.travelMinutes || left.name.localeCompare(right.name));
}

export function attachRouteEstimatedDetours(routePoints, candidates, maxMinutes) {
  if (routePoints.length < 2) return [];
  return candidates
    .map((place) => {
      let bestExtra = Number.POSITIVE_INFINITY;
      let bestSegment = -1;
      for (let index = 0; index < routePoints.length - 1; index += 1) {
        const direct = estimateRouteSegment(routePoints[index], routePoints[index + 1], 'driving').durationMinutes;
        const via = estimateRouteSegment(routePoints[index], place, 'driving').durationMinutes
          + estimateRouteSegment(place, routePoints[index + 1], 'driving').durationMinutes;
        const extra = Math.max(0, via - direct);
        if (extra < bestExtra) {
          bestExtra = extra;
          bestSegment = index;
        }
      }
      const detourMinutes = Math.round(bestExtra);
      if (detourMinutes > maxMinutes) return null;
      return { ...place, detourMinutes, insertionSegment: bestSegment, timingSource: 'estimate' };
    })
    .filter(Boolean)
    .sort((left, right) => left.detourMinutes - right.detourMinutes || left.name.localeCompare(right.name));
}

export function isDiscoveryPlaceKnown(place, trip) {
  const all = [
    ...(trip?.savedPlaces || []).map((item) => ({ name: item.name, latitude: item.latitude, longitude: item.longitude })),
    ...(trip?.itinerary || []).flatMap((day) => (day.items || []).map((item) => ({ name: item.title, latitude: item.latitude, longitude: item.longitude }))),
  ];
  return all.some((item) => {
    if (!Number.isFinite(Number(item.latitude)) || !Number.isFinite(Number(item.longitude))) return false;
    const sameName = String(item.name || '').trim().toLocaleLowerCase() === String(place.name || '').trim().toLocaleLowerCase();
    const distance = haversineDistanceKm(item, place);
    return distance < 0.08 || (sameName && distance < 0.5);
  });
}

function round(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
