import { Link } from 'react-router-dom';
import { Badge } from '../common/Badge.jsx';
import { Icon } from '../common/Icon.jsx';
import { ProgressBar } from '../common/ProgressBar.jsx';
import { formatCurrency } from '../../utils/currency.js';
import { formatDateRange, getTripStatus } from '../../utils/date.js';

const STATUS_LABELS = {
  upcoming: 'Upcoming',
  ongoing: 'In progress',
  past: 'Completed',
  draft: 'Draft',
};

const STATUS_TONES = {
  upcoming: 'primary',
  ongoing: 'success',
  past: 'neutral',
  draft: 'warning',
};

export function TripCard({ trip, onDelete }) {
  const status = getTripStatus(trip);
  const budgetProgress = trip.budget > 0 ? (trip.spent / trip.budget) * 100 : 0;

  return (
    <article className={`trip-card trip-card--${trip.accent}`}>
      <div className="trip-card__visual">
        <div className="trip-card__visual-grid" />
        <span className="trip-card__country">{trip.countryCode || '✦'}</span>
        <Badge tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>
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
            aria-label={`Delete ${trip.name}`}
            onClick={() => onDelete(trip.id)}
          >
            <Icon name="trash" size={17} />
          </button>
        </div>

        <p className="trip-card__dates"><Icon name="calendar" size={16} /> {formatDateRange(trip.startDate, trip.endDate)}</p>
        <p className="trip-card__summary">{trip.summary}</p>

        <div className="trip-card__budget">
          <div className="trip-card__budget-label">
            <span>{formatCurrency(trip.spent, trip.currency)} spent</span>
            <strong>{formatCurrency(trip.budget, trip.currency)}</strong>
          </div>
          <ProgressBar value={budgetProgress} label={`Budget used for ${trip.name}`} />
        </div>

        <footer className="trip-card__footer">
          <span><Icon name="users" size={16} /> {trip.travelers} traveller{trip.travelers > 1 ? 's' : ''}</span>
          <Link className="text-link" to={`/trips/${trip.id}`}>
            Open planner <Icon name="arrowRight" size={16} />
          </Link>
        </footer>
      </div>
    </article>
  );
}
