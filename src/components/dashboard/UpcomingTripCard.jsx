import { Link } from 'react-router-dom';
import { useI18n } from '../../hooks/useI18n.js';
import { formatCurrency } from '../../utils/currency.js';
import { formatDateRange, getDaysUntil } from '../../utils/date.js';
import { Badge } from '../common/Badge.jsx';
import { Card } from '../common/Card.jsx';
import { Icon } from '../common/Icon.jsx';
import { ProgressBar } from '../common/ProgressBar.jsx';

export function UpcomingTripCard({ trip }) {
  const { locale, t } = useI18n();

  if (!trip) {
    return (
      <Card className="upcoming-card upcoming-card--empty">
        <span className="upcoming-card__empty-icon"><Icon name="plane" size={28} /></span>
        <h2>{t('upcoming.emptyTitle')}</h2>
        <p>{t('upcoming.emptyText')}</p>
      </Card>
    );
  }

  const daysUntil = getDaysUntil(trip.startDate);
  const checklistProgress = trip.checklistTotal
    ? (trip.checklistCompleted / trip.checklistTotal) * 100
    : 0;

  return (
    <Card className={`upcoming-card upcoming-card--${trip.accent}`}>
      <div className="upcoming-card__content">
        <div className="upcoming-card__topline">
          <Badge tone="glass">{t('upcoming.nextAdventure')}</Badge>
          <span>{daysUntil === 0 ? t('upcoming.ready') : t('upcoming.daysToGo', { count: daysUntil })}</span>
        </div>
        <p className="upcoming-card__location"><Icon name="pin" size={17} /> {trip.destination}</p>
        <h2>{trip.name}</h2>
        <p className="upcoming-card__dates">
          {formatDateRange(trip.startDate, trip.endDate, locale, t('trips.datesTbc'))}
        </p>

        <div className="upcoming-card__metrics">
          <div>
            <span>{t('upcoming.budgetRemaining')}</span>
            <strong>{formatCurrency(Math.max(0, trip.budget - trip.spent), trip.currency, locale)}</strong>
          </div>
          <div>
            <span>{t('upcoming.checklist')}</span>
            <strong>{Math.round(checklistProgress)}%</strong>
            <ProgressBar value={checklistProgress} label={t('upcoming.checklistAria')} tone="light" />
          </div>
        </div>

        <Link className="button button--light button--medium" to={`/trips/${trip.id}`}>
          <span>{t('upcoming.continue')}</span>
          <Icon name="arrowRight" size={18} />
        </Link>
      </div>

      <div className="upcoming-card__art" aria-hidden="true">
        <span className="orbit orbit--one" />
        <span className="orbit orbit--two" />
        <span className="planet"><Icon name="globe" size={48} strokeWidth={1.4} /></span>
        <span className="plane-path"><Icon name="plane" size={34} /></span>
      </div>
    </Card>
  );
}
