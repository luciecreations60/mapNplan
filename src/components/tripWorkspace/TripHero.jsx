import { Link } from 'react-router-dom';
import { useI18n } from '../../hooks/useI18n.js';
import { formatCurrency } from '../../utils/currency.js';
import { formatDateRange, getDaysUntil, getTripStatus } from '../../utils/date.js';
import { Badge } from '../common/Badge.jsx';
import { Icon } from '../common/Icon.jsx';

const STATUS_KEYS = {
  upcoming: 'workspace.upcomingJourney',
  ongoing: 'workspace.ongoingJourney',
  past: 'workspace.completedJourney',
  draft: 'workspace.planningDraft',
};

export function TripHero({ trip }) {
  const { locale, t } = useI18n();
  const status = getTripStatus(trip);
  const daysUntil = getDaysUntil(trip.startDate);
  const remainingBudget = Math.max(0, trip.budget - trip.spent);
  const statusLabel = t(STATUS_KEYS[status]);

  return (
    <section className={`trip-workspace-hero trip-workspace-hero--${trip.accent}`}>
      <div className="trip-workspace-hero__grid" aria-hidden="true" />

      <div className="trip-workspace-hero__content">
        <Link className="trip-back-link" to="/trips">
          <Icon name="arrowLeft" size={17} />
          {t('workspace.allTrips')}
        </Link>

        <div className="trip-workspace-hero__labels">
          <Badge tone="glass">{statusLabel}</Badge>
          <span>{trip.countryCode || '✦'} {trip.country}</span>
        </div>

        <p className="trip-workspace-hero__destination">
          <Icon name="pin" size={17} />
          {trip.destination}
        </p>
        <h1>{trip.name}</h1>
        <p className="trip-workspace-hero__dates">
          <Icon name="calendar" size={17} />
          {formatDateRange(trip.startDate, trip.endDate, locale, t('trips.datesTbc'))}
          <span>·</span>
          <Icon name="users" size={17} />
          {t(trip.travelers === 1 ? 'trips.traveller' : 'trips.travellers', { count: trip.travelers })}
        </p>
        <p className="trip-workspace-hero__summary">{trip.summary}</p>
      </div>

      <div className="trip-workspace-hero__metrics">
        <div>
          <span>{status === 'upcoming' ? t('workspace.countdown') : t('workspace.status')}</span>
          <strong>
            {status === 'upcoming'
              ? t(daysUntil === 1 ? 'workspace.dayToGo' : 'workspace.daysToGo', { count: daysUntil })
              : statusLabel}
          </strong>
        </div>
        <div>
          <span>{t('workspace.budgetRemaining')}</span>
          <strong>{formatCurrency(remainingBudget, trip.currency, locale)}</strong>
        </div>
        <div>
          <span>{t('workspace.checklist')}</span>
          <strong>{trip.checklistCompleted}/{trip.checklistTotal}</strong>
        </div>
        <span className="trip-workspace-hero__coming-soon">
          <Icon name="sparkles" size={17} />
          {t('workspace.suggestions')}
        </span>
      </div>
    </section>
  );
}
