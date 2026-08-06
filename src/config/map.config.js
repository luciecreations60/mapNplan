/**
 * Vector-map configuration.
 *
 * MapLibre + OpenFreeMap is used in the test version because it does not need a
 * Google billing account or a public API key. Vector labels can be switched to
 * the language selected in mapNplan, unlike fixed raster tiles.
 */
export const MAP_CONFIG = Object.freeze({
  defaultCenter: Object.freeze([0, 20]), // [longitude, latitude]
  defaultZoom: 2,
  focusedZoom: 14,
  tripOverviewZoom: 6,
  maxZoom: 19,
  styleUrl: 'https://tiles.openfreemap.org/styles/bright',
  attribution: 'OpenFreeMap · © OpenStreetMap contributors',
});
