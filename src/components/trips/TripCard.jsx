import { Link } from 'react-router-dom';
import { useI18n } from '../../hooks/useI18n.js';
import { formatCurrency } from '../../utils/currency.js';
import { formatDateRange, getTripStatus } from '../../utils/date.js';
import { Badge } from '../common/Badge.jsx';
import { Icon } from '../common/Icon.jsx';
import { ProgressBar } from '../common/ProgressBar.jsx';

const STATUS_KEYS = {
  upcoming: 'trips.statusUpcoming',
  ongoing: 'trips.statusOngoing',
  past: 'trips.statusPast',
  draft: 'trips.statusDraft',
};

const STATUS_TONES = {
  upcoming: 'primary',
  ongoing: 'success',
  past: 'neutral',
  draft: 'warning',
};

export function TripCard({ trip, onDelete }) {
  const { locale, t } = useI18n();
  const status = getTripStatus(trip);
  const budgetProgress = trip.budget > 0 ? (trip.spent / trip.budget) * 100 : 0;

  return (
    <article className={`trip-card trip-card--${trip.accent}`}>
      <div className="trip-card__visual">
        <div className="trip-card__visual-grid" />
        <span className="trip-card__country">{trip.countryCode || '✦'}</span>
        <Badge tone={STATUS_TONES[status]}>{t(STATUS_KEYS[status])}</Badge>
      </div>

      <div className="trip-card__body">
        <div className="trip-card__heading">
          <div>
            <p className="trip-card__destination"><Icon name="pin" size={15} /> {trip.destination}</p>
            <h3>{trip.name}</h3>
          </div>
          <button
            className="icon-button icon-button--small"
            type="button"
            aria-label={`${t('common.delete')} ${trip.name}`}
            onClick={() => onDelete(trip.id)}
          >
            <Icon name="trash" size={17} />
          </button>
        </div>

        <p className="trip-card__dates">
          <Icon name="calendar" size={16} />
          {formatDateRange(trip.startDate, trip.endDate, locale, t('trips.datesTbc'))}
        </p>
        <p className="trip-card__summary">{trip.summary}</p>

        <div className="trip-card__budget">
          <div className="trip-card__budget-label">
            <span>{t('trips.spent', { amount: formatCurrency(trip.spent, trip.currency, locale) })}</span>
            <strong>{formatCurrency(trip.budget, trip.currency, locale)}</strong>
          </div>
          <ProgressBar value={budgetProgress} label={t('trips.budgetAria', { name: trip.name })} />
        </div>

        <footer className="trip-card__footer">
          <span>
            <Icon name="users" size={16} />
            {t(trip.travelers === 1 ? 'trips.traveller' : 'trips.travellers', { count: trip.travelers })}
          </span>
          <Link className="text-link" to={`/trips/${trip.id}`}>
            {t('trips.openPlanner')} <Icon name="arrowRight" size={16} />
          </Link>
        </footer>
      </div>
    </article>
  );
}
