import { ROUTING_CONFIG } from '../config/routing.config.js';
import { hasValidCoordinates } from './map.js';

/**
 * Local route-estimation settings.
 *
 * These values deliberately provide planning estimates rather than turn-by-turn
 * navigation. A future routing provider can replace this calculation behind a
 * service adapter without changing the UI.
 */
export const TRAVEL_MODES = Object.freeze([
  Object.freeze({ id: 'walking', icon: 'walk', speedKmh: 4.5, distanceFactor: 1.12, fixedMinutes: 1 }),
  Object.freeze({ id: 'cycling', icon: 'bike', speedKmh: 14, distanceFactor: 1.18, fixedMinutes: 2 }),
  Object.freeze({ id: 'driving', icon: 'car', speedKmh: 32, distanceFactor: 1.28, fixedMinutes: 4 }),
  Object.freeze({ id: 'transit', icon: 'bus', speedKmh: 22, distanceFactor: 1.24, fixedMinutes: 9 }),
]);

const DEFAULT_MODE = 'walking';
const DEFAULT_START_TIME = '09:00';

export function getTravelMode(modeId) {
  return TRAVEL_MODES.find((mode) => mode.id === modeId) || TRAVEL_MODES[0];
}

export function isGeocodedActivity(activity) {
  return hasValidCoordinates(activity?.latitude, activity?.longitude);
}

/** Calculates the great-circle distance between two coordinate pairs. */
export function haversineDistanceKm(from, to) {
  if (!isGeocodedActivity(from) || !isGeocodedActivity(to)) return 0;

  const earthRadiusKm = 6371;
  const latitudeDelta = degreesToRadians(Number(to.latitude) - Number(from.latitude));
  const longitudeDelta = degreesToRadians(Number(to.longitude) - Number(from.longitude));
  const firstLatitude = degreesToRadians(Number(from.latitude));
  const secondLatitude = degreesToRadians(Number(to.latitude));

  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(firstLatitude)
    * Math.cos(secondLatitude)
    * Math.sin(longitudeDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function estimateRouteSegment(from, to, modeId = DEFAULT_MODE) {
  const mode = getTravelMode(modeId);
  const directDistanceKm = haversineDistanceKm(from, to);
  const distanceKm = directDistanceKm * mode.distanceFactor;
  const durationMinutes = distanceKm > 0
    ? Math.max(1, Math.round((distanceKm / mode.speedKmh) * 60 + mode.fixedMinutes))
    : 0;

  return {
    id: `${from.id}-${to.id}`,
    from,
    to,
    directDistanceKm,
    distanceKm,
    durationMinutes,
    mode: mode.id,
  };
}

export function analyseDayRoute(day, modeId = DEFAULT_MODE) {
  const items = Array.isArray(day?.items) ? day.items : [];
  const mappedItems = items.filter(isGeocodedActivity);
  const segments = mappedItems.slice(1).map((item, index) => (
    estimateRouteSegment(mappedItems[index], item, modeId)
  ));
  const totalDistanceKm = segments.reduce((sum, segment) => sum + segment.distanceKm, 0);
  const totalTravelMinutes = segments.reduce((sum, segment) => sum + segment.durationMinutes, 0);
  const totalActivityMinutes = items.reduce(
    (sum, item) => sum + Math.max(0, Number(item.durationMinutes) || 0),
    0,
  );
  const totalDayMinutes = totalTravelMinutes + totalActivityMinutes;

  return {
    items,
    mappedItems,
    unmappedItems: items.filter((item) => !isGeocodedActivity(item)),
    segments,
    totalDistanceKm,
    totalTravelMinutes,
    totalActivityMinutes,
    totalDayMinutes,
    warningCodes: getRouteWarningCodes({
      modeId,
      itemCount: items.length,
      mappedCount: mappedItems.length,
      totalDistanceKm,
      totalDayMinutes,
    }),
  };
}

/**
 * Applies a deterministic nearest-neighbour heuristic to a single day.
 * Activities without coordinates remain after mapped activities in their
 * original relative order, so no user-created content is lost.
 */
export function optimizeDayRoute(day, options = {}) {
  const mode = getTravelMode(options.mode).id;
  const startStrategy = options.startStrategy === 'destination' ? 'destination' : 'firstActivity';
  const startTime = normalizeTime(options.startTime || day?.items?.[0]?.time || DEFAULT_START_TIME);
  const items = Array.isArray(day?.items) ? day.items : [];
  const mappedItems = items.filter(isGeocodedActivity);

  if (mappedItems.length < 2) return { day, changed: false };

  const orderedMappedItems = buildNearestNeighbourOrder(mappedItems, {
    startStrategy,
    destination: options.destination,
  });
  const unmappedItems = items.filter((item) => !isGeocodedActivity(item));
  const orderedItems = [...orderedMappedItems, ...unmappedItems];
  const previousOrder = items.map((item) => item.id);
  const previousTimes = Object.fromEntries(items.map((item) => [item.id, item.time || '']));
  const scheduledItems = recalculateActivityTimes(orderedItems, mode, startTime);
  const analysis = analyseDayRoute({ ...day, items: scheduledItems }, mode);

  return {
    changed: true,
    day: {
      ...day,
      items: scheduledItems,
      routePlan: {
        mode,
        startStrategy,
        startTime,
        optimizedAt: new Date().toISOString(),
        previousOrder,
        previousTimes,
        manuallyOrderedAt: null,
        estimatedDistanceKm: round(analysis.totalDistanceKm, 2),
        estimatedTravelMinutes: analysis.totalTravelMinutes,
      },
    },
  };
}

export function restorePreviousDayRoute(day) {
  const previousOrder = day?.routePlan?.previousOrder;
  if (!Array.isArray(previousOrder) || previousOrder.length === 0) {
    return { day, changed: false };
  }

  const rank = new Map(previousOrder.map((id, index) => [id, index]));
  const previousTimes = day.routePlan.previousTimes || {};
  const items = [...(day.items || [])]
    .sort((left, right) => (
      (rank.get(left.id) ?? Number.MAX_SAFE_INTEGER)
      - (rank.get(right.id) ?? Number.MAX_SAFE_INTEGER)
    ))
    .map((item) => ({ ...item, time: previousTimes[item.id] ?? item.time }));

  return {
    changed: true,
    day: {
      ...day,
      items,
      routePlan: {
        ...day.routePlan,
        optimizedAt: null,
        previousOrder: [],
        previousTimes: {},
        estimatedDistanceKm: null,
        estimatedTravelMinutes: null,
      },
    },
  };
}

export function invalidateDayRoutePlan(day) {
  return {
    ...day,
    routePlan: {
      ...(day.routePlan || {}),
      optimizedAt: null,
      previousOrder: [],
      previousTimes: {},
      estimatedDistanceKm: null,
      estimatedTravelMinutes: null,
    },
  };
}

export function moveActivityInDay(day, activityId, direction) {
  const items = [...(day.items || [])];
  const currentIndex = items.findIndex((item) => item.id === activityId);
  const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= items.length) return day;

  [items[currentIndex], items[nextIndex]] = [items[nextIndex], items[currentIndex]];

  return {
    ...day,
    items,
    routePlan: {
      ...(day.routePlan || {}),
      optimizedAt: null,
      previousOrder: [],
      previousTimes: {},
      estimatedDistanceKm: null,
      estimatedTravelMinutes: null,
      manuallyOrderedAt: new Date().toISOString(),
    },
  };
}

export function buildDayMapPoints(day) {
  return (day?.items || [])
    .filter(isGeocodedActivity)
    .map((item, index) => ({
      id: `route-${item.id}`,
      source: 'itinerary',
      order: index,
      title: item.title,
      subtitle: item.location || day.date,
      latitude: Number(item.latitude),
      longitude: Number(item.longitude),
      type: item.type || 'map',
      date: day.date,
      time: item.time,
    }));
}

export function formatDurationMinutes(totalMinutes) {
  const safeMinutes = Math.max(0, Math.round(Number(totalMinutes) || 0));
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  return { hours, minutes, totalMinutes: safeMinutes };
}

function buildNearestNeighbourOrder(items, { startStrategy, destination }) {
  const remaining = [...items];
  let current;

  if (startStrategy === 'destination' && isGeocodedActivity(destination)) {
    current = remaining.reduce((closest, item) => (
      !closest || haversineDistanceKm(destination, item) < haversineDistanceKm(destination, closest)
        ? item
        : closest
    ), null);
  } else {
    current = remaining[0];
  }

  const ordered = [current];
  remaining.splice(remaining.findIndex((item) => item.id === current.id), 1);

  while (remaining.length > 0) {
    const next = remaining.reduce((closest, candidate) => (
      !closest || haversineDistanceKm(current, candidate) < haversineDistanceKm(current, closest)
        ? candidate
        : closest
    ), null);
    ordered.push(next);
    remaining.splice(remaining.findIndex((item) => item.id === next.id), 1);
    current = next;
  }

  return ordered;
}

function recalculateActivityTimes(items, modeId, startTime) {
  let cursorMinutes = timeToMinutes(startTime);

  return items.map((item, index) => {
    const scheduledItem = { ...item, time: minutesToTime(cursorMinutes) };
    cursorMinutes += Math.max(0, Number(item.durationMinutes) || 0);

    const nextItem = items[index + 1];
    if (nextItem && isGeocodedActivity(item) && isGeocodedActivity(nextItem)) {
      cursorMinutes += estimateRouteSegment(item, nextItem, modeId).durationMinutes;
    }

    return scheduledItem;
  });
}

function getRouteWarningCodes({ modeId, itemCount, mappedCount, totalDistanceKm, totalDayMinutes }) {
  const warnings = [];
  if (itemCount > 0 && mappedCount < itemCount) warnings.push('missingCoordinates');
  const thresholds = ROUTING_CONFIG.warningThresholds;
  if (totalDayMinutes > thresholds.veryLongDayMinutes) warnings.push('veryLongDay');
  else if (totalDayMinutes > thresholds.longDayMinutes) warnings.push('longDay');
  if (modeId === 'walking' && totalDistanceKm > thresholds.longWalkingDistanceKm) warnings.push('longWalkingDistance');
  if (itemCount >= thresholds.manyActivities) warnings.push('manyActivities');
  return warnings;
}

function timeToMinutes(time) {
  const [hours, minutes] = normalizeTime(time).split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const normalized = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`;
}

function normalizeTime(time) {
  return /^\d{2}:\d{2}$/.test(String(time || '')) ? String(time) : DEFAULT_START_TIME;
}

function degreesToRadians(value) {
  return value * (Math.PI / 180);
}

function round(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
