import { Link } from 'react-router-dom';
import { APP_CONFIG } from '../../config/app.config.js';
import { useI18n } from '../../hooks/useI18n.js';
import { MapNPlanMark } from './MapNPlanMark.jsx';

export function Brand({ compact = false }) {
  const { t } = useI18n();

  return (
    <Link className={`brand${compact ? ' brand--compact' : ''}`} to="/dashboard" aria-label={APP_CONFIG.brandName} title={APP_CONFIG.brandName}>
      <span className="brand__mark" aria-hidden="true">
        <MapNPlanMark size={compact ? 38 : 44} />
      </span>
      {!compact && (
        <span className="brand__copy">
          <strong className="brand__wordmark"><span>map</span><b>N</b><span>plan</span></strong>
          <small>{t('brand.tagline')}</small>
        </span>
      )}
    </Link>
  );
}
