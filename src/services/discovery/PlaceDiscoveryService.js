import { DISCOVERY_CONFIG } from '../../config/discovery.config.js';
import { haversineDistanceKm } from '../../utils/routeOptimization.js';
import {
  attachAroundEstimatedTimes,
  attachAroundRoadTimes,
  attachRouteDetours,
  attachRouteEstimatedDetours,
  buildRouteSearchCenters,
  dedupeDiscoveryPlaces,
  getDiscoveryRadiusMeters,
  getDiscoverySelectors,
  normalizeDiscoveryMinutes,
  normalizeOverpassElement,
} from '../../utils/placeDiscovery.js';

const CACHE = new Map();

class PlaceDiscoveryService {
  async discoverAround({ anchor, category = 'sights', maxMinutes = 10, language = 'fr', signal = null }) {
    const normalizedAnchor = normalizeCoordinatePoint(anchor);
    if (!normalizedAnchor) throw new Error('A valid mapped point is required.');
    const safeMinutes = normalizeDiscoveryMinutes(maxMinutes);
    const cacheKey = `around|${signaturePoint(normalizedAnchor)}|${category}|${safeMinutes}|${language}`;
    const cached = readCache(cacheKey);
    if (cached) return cached;

    const radiusMeters = getDiscoveryRadiusMeters(safeMinutes, category, 'around');
    const candidates = await this.#fetchCandidates({
      centers: [normalizedAnchor],
      radiusMeters,
      category,
      language,
      signal,
    });
    const routedCandidates = [...candidates]
      .sort((left, right) => haversineDistanceKm(normalizedAnchor, left) - haversineDistanceKm(normalizedAnchor, right))
      .slice(0, DISCOVERY_CONFIG.maxRoutedCandidates);
    let results;
    let timingSource = 'road';

    try {
      const matrix = await this.#fetchRoadMatrix([normalizedAnchor, ...routedCandidates], signal);
      results = attachAroundRoadTimes(routedCandidates, matrix, safeMinutes);
    } catch {
      timingSource = 'estimate';
      results = attachAroundEstimatedTimes(normalizedAnchor, routedCandidates, safeMinutes);
    }

    const response = {
      mode: 'around',
      timingSource,
      results: results.slice(0, DISCOVERY_CONFIG.maxVisibleResults),
    };
    writeCache(cacheKey, response);
    return response;
  }

  async discoverAlongRoute({ routePoints, category = 'sights', maxMinutes = 10, language = 'fr', signal = null }) {
    const normalizedRoute = (routePoints || []).map(normalizeCoordinatePoint).filter(Boolean);
    if (normalizedRoute.length < 2) throw new Error('At least two mapped route points are required.');
    const safeMinutes = normalizeDiscoveryMinutes(maxMinutes);
    const routeSignature = normalizedRoute.map(signaturePoint).join(';');
    const cacheKey = `route|${routeSignature}|${category}|${safeMinutes}|${language}`;
    const cached = readCache(cacheKey);
    if (cached) return cached;

    const centers = buildRouteSearchCenters(normalizedRoute, DISCOVERY_CONFIG.routeSampleLimit);
    const radiusMeters = getDiscoveryRadiusMeters(safeMinutes, category, 'route');
    const candidates = await this.#fetchCandidates({ centers, radiusMeters, category, language, signal });
    const routedCandidates = [...candidates]
      .sort((left, right) => minimumDistanceToCenters(left, centers) - minimumDistanceToCenters(right, centers))
      .slice(0, DISCOVERY_CONFIG.maxRoutedCandidates);
    let results;
    let timingSource = 'road';

    try {
      const matrix = await this.#fetchRoadMatrix([...normalizedRoute, ...routedCandidates], signal);
      results = attachRouteDetours(routedCandidates, matrix, normalizedRoute.length, safeMinutes);
    } catch {
      timingSource = 'estimate';
      results = attachRouteEstimatedDetours(normalizedRoute, routedCandidates, safeMinutes);
    }

    const response = {
      mode: 'route',
      timingSource,
      results: results.slice(0, DISCOVERY_CONFIG.maxVisibleResults),
    };
    writeCache(cacheKey, response);
    return response;
  }

  async #fetchCandidates({ centers, radiusMeters, category, language, signal }) {
    const query = buildOverpassQuery(centers, radiusMeters, category);
    let lastError = null;
    for (const endpoint of DISCOVERY_CONFIG.overpassEndpoints) {
      try {
        const payload = await fetchOverpass(endpoint, query, signal);
        const places = dedupeDiscoveryPlaces(
          (payload?.elements || [])
            .map((element) => normalizeOverpassElement(element, { language, category }))
            .filter(Boolean),
        );
        return places.slice(0, DISCOVERY_CONFIG.maxRawCandidates);
      } catch (error) {
        if (signal?.aborted) throw error;
        lastError = error;
      }
    }
    throw lastError || new Error('Place discovery is unavailable.');
  }

  async #fetchRoadMatrix(points, signal) {
    if (points.length < 2) return { durations: [], distances: [] };
    const coordinates = points.map((point) => `${Number(point.longitude).toFixed(6)},${Number(point.latitude).toFixed(6)}`).join(';');
    const url = `${DISCOVERY_CONFIG.osrmBaseUrl}/table/v1/${DISCOVERY_CONFIG.profile}/${coordinates}?annotations=duration,distance`;
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal,
    });
    const payload = await response.json();
    if (!response.ok || payload?.code !== 'Ok') throw new Error(payload?.message || 'Routing service unavailable.');
    return payload;
  }
}

function buildOverpassQuery(centers, radiusMeters, category) {
  const selectors = getDiscoverySelectors(category);
  const statements = [];
  for (const center of centers) {
    for (const selector of selectors) {
      statements.push(`nwr(around:${Math.round(radiusMeters)},${Number(center.latitude).toFixed(6)},${Number(center.longitude).toFixed(6)})${selector};`);
    }
  }
  return `[out:json][timeout:18];(${statements.join('')});out center tags ${DISCOVERY_CONFIG.maxRawCandidates};`;
}

async function fetchOverpass(endpoint, query, signal) {
  const response = await fetchWithTimeout(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: new URLSearchParams({ data: query }),
    signal,
  });
  if (!response.ok) throw new Error(`Overpass returned HTTP ${response.status}.`);
  return response.json();
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const callerSignal = options.signal;
  const abortFromCaller = () => controller.abort();
  const timer = globalThis.setTimeout(() => controller.abort(), DISCOVERY_CONFIG.requestTimeoutMs);
  if (callerSignal?.aborted) controller.abort();
  else callerSignal?.addEventListener('abort', abortFromCaller, { once: true });

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    globalThis.clearTimeout(timer);
    callerSignal?.removeEventListener('abort', abortFromCaller);
  }
}

function minimumDistanceToCenters(place, centers) {
  return centers.reduce((minimum, center) => Math.min(minimum, haversineDistanceKm(place, center)), Number.POSITIVE_INFINITY);
}

function normalizeCoordinatePoint(point) {
  const latitude = Number(point?.latitude);
  const longitude = Number(point?.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { ...point, latitude, longitude };
}

function signaturePoint(point) {
  return `${Number(point.latitude).toFixed(4)},${Number(point.longitude).toFixed(4)}`;
}

function readCache(key) {
  const entry = CACHE.get(key);
  if (!entry || Date.now() - entry.createdAt > DISCOVERY_CONFIG.cacheTtlMs) {
    CACHE.delete(key);
    return null;
  }
  return entry.value;
}

function writeCache(key, value) {
  CACHE.set(key, { createdAt: Date.now(), value });
  if (CACHE.size > 24) CACHE.delete(CACHE.keys().next().value);
}

export const placeDiscoveryService = new PlaceDiscoveryService();
