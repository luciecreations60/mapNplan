import { Link } from 'react-router-dom';
import { Badge } from '../common/Badge.jsx';
import { Icon } from '../common/Icon.jsx';
import { formatCurrency } from '../../utils/currency.js';
import { formatDateRange, getDaysUntil, getTripStatus } from '../../utils/date.js';

const STATUS_COPY = {
  upcoming: 'Upcoming journey',
  ongoing: 'Journey in progress',
  past: 'Completed journey',
  draft: 'Planning draft',
};

export function TripHero({ trip }) {
  const status = getTripStatus(trip);
  const daysUntil = getDaysUntil(trip.startDate);
  const remainingBudget = Math.max(0, trip.budget - trip.spent);

  return (
    <section className={`trip-workspace-hero trip-workspace-hero--${trip.accent}`}>
      <div className="trip-workspace-hero__grid" aria-hidden="true" />

      <div className="trip-workspace-hero__content">
        <Link className="trip-back-link" to="/trips">
          <Icon name="arrowLeft" size={17} />
          All trips
        </Link>

        <div className="trip-workspace-hero__labels">
          <Badge tone="glass">{STATUS_COPY[status]}</Badge>
          <span>{trip.countryCode || '✦'} {trip.country}</span>
        </div>

        <p className="trip-workspace-hero__destination">
          <Icon name="pin" size={17} />
          {trip.destination}
        </p>
        <h1>{trip.name}</h1>
        <p className="trip-workspace-hero__dates">
          <Icon name="calendar" size={17} />
          {formatDateRange(trip.startDate, trip.endDate)}
          <span>·</span>
          <Icon name="users" size={17} />
          {trip.travelers} traveller{trip.travelers > 1 ? 's' : ''}
        </p>
        <p className="trip-workspace-hero__summary">{trip.summary}</p>
      </div>

      <div className="trip-workspace-hero__metrics">
        <div>
          <span>{status === 'upcoming' ? 'Countdown' : 'Status'}</span>
          <strong>
            {status === 'upcoming'
              ? `${daysUntil} day${daysUntil === 1 ? '' : 's'}`
              : STATUS_COPY[status]}
          </strong>
        </div>
        <div>
          <span>Budget remaining</span>
          <strong>{formatCurrency(remainingBudget, trip.currency)}</strong>
        </div>
        <div>
          <span>Checklist</span>
          <strong>{trip.checklistCompleted}/{trip.checklistTotal}</strong>
        </div>
        <span className="trip-workspace-hero__coming-soon">
          <Icon name="sparkles" size={17} />
          Smart suggestions soon
        </span>
      </div>
    </section>
  );
}
