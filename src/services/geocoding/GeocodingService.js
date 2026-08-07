import { EXTERNAL_SERVICES_CONFIG } from '../../config/external-services.config.js';
import { httpService } from '../http/HttpService.js';
import { responseCacheService } from '../storage/ResponseCacheService.js';

const CONFIG = EXTERNAL_SERVICES_CONFIG.geocoding;

/**
 * Geocoding provider adapter.
 *
 * The UI consumes a stable place model and never reads Photon-specific GeoJSON.
 * A future commercial provider or self-hosted Photon instance can therefore be
 * introduced by replacing this service only.
 */
class GeocodingService {
  async search(query, {
    language = 'en',
    limit = CONFIG.resultLimit,
    countryCode = '',
    bias = null,
    signal = null,
  } = {}) {
    const normalizedQuery = String(query || '').trim().replace(/\s+/g, ' ');
    if (normalizedQuery.length < CONFIG.minimumQueryLength) return [];

    const params = new URLSearchParams({
      q: normalizedQuery,
      limit: String(Math.min(Math.max(Number(limit) || CONFIG.resultLimit, 1), 10)),
      lang: String(language || 'en').slice(0, 2).toLowerCase(),
      dedupe: '1',
    });

    const normalizedCountryCode = String(countryCode || '').trim().toUpperCase();
    if (/^[A-Z]{2}$/.test(normalizedCountryCode)) {
      params.set('countrycode', normalizedCountryCode);
    }

    if (hasBiasCoordinates(bias)) {
      params.set('lat', String(Number(bias.latitude)));
      params.set('lon', String(Number(bias.longitude)));
      params.set('zoom', '10');
      params.set('location_bias_scale', '0.25');
    }

    const cacheKey = this.#buildCacheKey(normalizedQuery, params);
    const cached = responseCacheService.get(cacheKey, CONFIG.cacheTtlMs);
    if (cached) return cached;

    const payload = await httpService.getJson(`${CONFIG.baseUrl}?${params.toString()}`, {
      timeoutMs: CONFIG.timeoutMs,
      signal,
    });

    const places = Array.isArray(payload?.features)
      ? payload.features.map(normalizeFeature).filter(Boolean)
      : [];

    return responseCacheService.set(cacheKey, places);
  }

  async reverse(latitude, longitude, { language = 'en', signal = null } = {}) {
    const lat = Number(latitude);
    const lon = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    const params = new URLSearchParams({ lat: lat.toFixed(6), lon: lon.toFixed(6), lang: String(language || 'en').slice(0, 2).toLowerCase() });
    const cacheKey = `geocoding:reverse:${lat.toFixed(5)}:${lon.toFixed(5)}:${params.get('lang')}`;
    const cached = responseCacheService.get(cacheKey, CONFIG.cacheTtlMs);
    if (cached) return cached;
    const payload = await httpService.getJson(`${CONFIG.reverseUrl}?${params.toString()}`, { timeoutMs: CONFIG.timeoutMs, signal });
    const place = Array.isArray(payload?.features) ? payload.features.map(normalizeFeature).find(Boolean) || null : null;
    return responseCacheService.set(cacheKey, place);
  }

  #buildCacheKey(query, params) {
    return `geocoding:${query.toLowerCase()}:${params.toString()}`;
  }
}

function normalizeFeature(feature) {
  const properties = feature?.properties || {};
  const coordinates = feature?.geometry?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;

  const longitude = Number(coordinates[0]);
  const latitude = Number(coordinates[1]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const name = firstValue(
    properties.name,
    properties.street,
    properties.city,
    properties.district,
    properties.state,
    properties.country,
  );
  if (!name) return null;

  const addressLine = buildAddressLine(properties, name);
  const secondaryLine = buildSecondaryLine(properties, name, addressLine);

  return {
    id: buildPlaceId(properties, latitude, longitude),
    name,
    label: [addressLine, secondaryLine].filter(Boolean).join(', '),
    primaryLabel: addressLine,
    secondaryLabel: secondaryLine,
    latitude,
    longitude,
    country: String(properties.country || '').trim(),
    countryCode: String(properties.countrycode || '').trim().toUpperCase(),
    city: firstValue(properties.city, properties.locality, properties.district),
    postcode: String(properties.postcode || '').trim(),
    state: String(properties.state || '').trim(),
    type: firstValue(properties.osm_value, properties.type, properties.osm_key, 'place'),
    source: 'photon',
  };
}

function buildAddressLine(properties, fallbackName) {
  const street = String(properties.street || '').trim();
  const houseNumber = String(properties.housenumber || '').trim();
  const name = String(properties.name || fallbackName || '').trim();

  if (street && name === street) return [houseNumber, street].filter(Boolean).join(' ');
  if (street && houseNumber && name && name !== street) return `${name} · ${houseNumber} ${street}`;
  return name || [houseNumber, street].filter(Boolean).join(' ');
}

function buildSecondaryLine(properties, name, addressLine) {
  const candidates = [
    properties.postcode,
    properties.city,
    properties.locality,
    properties.district,
    properties.county,
    properties.state,
    properties.country,
  ];

  const seen = new Set([String(name).toLowerCase(), String(addressLine).toLowerCase()]);
  return candidates
    .map((value) => String(value || '').trim())
    .filter((value) => {
      if (!value) return false;
      const normalized = value.toLowerCase();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    })
    .join(', ');
}

function buildPlaceId(properties, latitude, longitude) {
  if (properties.osm_type && properties.osm_id) {
    return `${properties.osm_type}-${properties.osm_id}`;
  }
  return `place-${latitude.toFixed(6)}-${longitude.toFixed(6)}`;
}

function firstValue(...values) {
  return values.find((value) => String(value || '').trim())?.toString().trim() || '';
}

function hasBiasCoordinates(bias) {
  return Number.isFinite(Number(bias?.latitude)) && Number.isFinite(Number(bias?.longitude));
}

export const geocodingService = new GeocodingService();
