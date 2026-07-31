import { Card } from '../common/Card.jsx';
import { Badge } from '../common/Badge.jsx';
import { Button } from '../common/Button.jsx';
import { Icon } from '../common/Icon.jsx';
import { ProgressBar } from '../common/ProgressBar.jsx';
import { formatCurrency } from '../../utils/currency.js';
import { formatDateRange, getDaysUntil } from '../../utils/date.js';

export function UpcomingTripCard({ trip }) {
  if (!trip) {
    return (
      <Card className="upcoming-card upcoming-card--empty">
        <span className="upcoming-card__empty-icon"><Icon name="plane" size={28} /></span>
        <h2>Your next journey starts here</h2>
        <p>Create a trip to unlock your itinerary, budget and travel checklist.</p>
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
          <Badge tone="glass">Next adventure</Badge>
          <span>{daysUntil === 0 ? 'Ready to go' : `${daysUntil} days to go`}</span>
        </div>
        <p className="upcoming-card__location"><Icon name="pin" size={17} /> {trip.destination}</p>
        <h2>{trip.name}</h2>
        <p className="upcoming-card__dates">{formatDateRange(trip.startDate, trip.endDate)}</p>

        <div className="upcoming-card__metrics">
          <div>
            <span>Budget remaining</span>
            <strong>{formatCurrency(Math.max(0, trip.budget - trip.spent), trip.currency)}</strong>
          </div>
          <div>
            <span>Checklist</span>
            <strong>{Math.round(checklistProgress)}%</strong>
            <ProgressBar value={checklistProgress} label="Checklist completion" tone="light" />
          </div>
        </div>

        <Button variant="light" icon="arrowRight" iconPosition="end">Continue planning</Button>
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
