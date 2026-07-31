import { APP_CONFIG } from '../../config/app.config.js';

export function Brand({ compact = false }) {
  return (
    <div className="brand" aria-label={APP_CONFIG.brandName}>
      <span className="brand__mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      {!compact && (
        <span className="brand__copy">
          <strong>{APP_CONFIG.brandName}</strong>
          <small>{APP_CONFIG.tagline}</small>
        </span>
      )}
    </div>
  );
}
