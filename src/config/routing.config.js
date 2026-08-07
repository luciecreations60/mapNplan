/**
 * Route planning configuration.
 *
 * The V0.1 engine uses local geographic estimates so the application stays
 * free and does not depend on a third-party routing quota. A future provider
 * can be enabled here without changing the workspace components.
 */
export const ROUTING_CONFIG = Object.freeze({
  provider: 'local-estimate',
  defaultMode: 'walking',
  defaultStartStrategy: 'firstActivity',
  defaultStartTime: '09:00',
  warningThresholds: Object.freeze({
    longDayMinutes: 480,
    veryLongDayMinutes: 600,
    longWalkingDistanceKm: 15,
    manyActivities: 8,
  }),
});
