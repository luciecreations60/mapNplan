# V0.1 — Part 10 delivery notes

## Version

- Application: `0.1.9`
- Trip schema: `9`

## Added

- Dedicated route-planning tab for every trip.
- Local distance and travel-time estimates between mapped activities.
- Walking, cycling, driving and public-transport planning modes.
- Nearest-neighbour day optimization.
- Automatic activity start-time recalculation.
- Start from the first activity or from the trip destination.
- Undo action restoring the order and times saved before optimization.
- Manual up/down ordering controls inside the itinerary.
- Day workload warnings for long duration, walking distance, missing coordinates and excessive activity count.
- Route map preview and segment-by-segment summary.
- Central routing configuration and replaceable routing service boundary.

## Important behaviour

The V0.1 route engine is an offline planning estimate. It uses geographic distance, configurable road factors and average speeds. It does not provide turn-by-turn navigation or live traffic.

Activities without coordinates remain in the itinerary but are excluded from distance calculations. They are placed after mapped activities when a day is optimized.

## Migration

Schema 9 adds a `routePlan` object to every itinerary day. Existing trips are migrated without changing their activities or manual order.

## Quality checks

- JavaScript and JSX syntax checked with the TypeScript parser.
- All relative imports resolved.
- French and English dictionaries synchronized.
- Route analysis, optimization, restoration and manual ordering tested.
- Schema 8 to 9 migration tested.
- JSON, CSS and archive integrity checked.
