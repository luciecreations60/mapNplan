import { ROUTING_CONFIG } from '../../config/routing.config.js';
import {
  analyseDayRoute,
  buildDayMapPoints,
  moveActivityInDay,
  optimizeDayRoute,
  restorePreviousDayRoute,
} from '../../utils/routeOptimization.js';

/**
 * Routing façade used by React components.
 *
 * V0.1 delegates to a deterministic local estimate. Later versions can swap
 * this implementation for OSRM, GraphHopper, Mapbox or another provider while
 * preserving the same public contract.
 */
class RoutePlanningService {
  analyse(day, mode = ROUTING_CONFIG.defaultMode) {
    return analyseDayRoute(day, mode);
  }

  optimize(day, options = {}) {
    return optimizeDayRoute(day, {
      mode: options.mode || ROUTING_CONFIG.defaultMode,
      startStrategy: options.startStrategy || ROUTING_CONFIG.defaultStartStrategy,
      startTime: options.startTime || ROUTING_CONFIG.defaultStartTime,
      destination: options.destination,
    });
  }

  restore(day) {
    return restorePreviousDayRoute(day);
  }

  move(day, activityId, direction) {
    return moveActivityInDay(day, activityId, direction);
  }

  getMapPoints(day) {
    return buildDayMapPoints(day);
  }
}

export const routePlanningService = new RoutePlanningService();
