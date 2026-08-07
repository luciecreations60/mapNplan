import { Icon } from '../common/Icon.jsx';

/**
 * Lightweight fallback displayed while a route bundle is downloaded.
 *
 * Keeping the fallback dependency-free prevents the initial application
 * bundle from growing when new workspace panels are added later.
 */
export function RouteLoading() {
  return (
    <div className="route-loading" role="status" aria-live="polite" aria-busy="true">
      <span className="route-loading__icon" aria-hidden="true"><Icon name="loader" /></span>
      <span>Loading…</span>
    </div>
  );
}
