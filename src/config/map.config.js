/**
 * Central map configuration.
 *
 * The application currently uses the public OpenStreetMap tile layer for the
 * demonstration version. Replace the provider here before large-scale traffic
 * or commercial launch without changing map components.
 */
export const MAP_CONFIG = Object.freeze({
  defaultCenter: Object.freeze([20, 0]),
  defaultZoom: 2,
  focusedZoom: 13,
  maxZoom: 19,
  tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; OpenStreetMap contributors',
  tileOptions: Object.freeze({
    maxZoom: 19,
  }),
});
