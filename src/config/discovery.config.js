/**
 * Lightweight discovery configuration for the pre-production mapNplan build.
 *
 * OpenStreetMap/Overpass provides candidate places and the public OSRM demo
 * server is used only after an explicit user action to estimate driving time.
 * These public endpoints are suitable for development and low-volume testing;
 * production can swap them behind PlaceDiscoveryService without touching UI.
 */
export const DISCOVERY_CONFIG = Object.freeze({
  overpassEndpoints: Object.freeze([
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ]),
  osrmBaseUrl: 'https://router.project-osrm.org',
  profile: 'driving',
  requestTimeoutMs: 18000,
  maxRawCandidates: 90,
  maxRoutedCandidates: 28,
  maxVisibleResults: 18,
  routeSampleLimit: 10,
  cacheTtlMs: 10 * 60 * 1000,
});
