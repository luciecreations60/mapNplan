import { Card } from '../common/Card.jsx';
import { Icon } from '../common/Icon.jsx';
import { ProgressBar } from '../common/ProgressBar.jsx';
import { formatCurrency } from '../../utils/currency.js';
import {
  getItineraryItemCount,
  getPaidExpenseTotal,
  getPlannedExpenseTotal,
} from '../../utils/tripWorkspace.js';

export function OverviewPanel({ trip, onOpenTab }) {
  const paidTotal = getPaidExpenseTotal(trip.expenses);
  const plannedTotal = getPlannedExpenseTotal(trip.expenses);
  const budgetProgress = trip.budget > 0 ? (paidTotal / trip.budget) * 100 : 0;
  const checklistProgress = trip.checklistTotal > 0
    ? (trip.checklistCompleted / trip.checklistTotal) * 100
    : 0;
  const itineraryCount = getItineraryItemCount(trip.itinerary);
  const upcomingItems = trip.itinerary
    .flatMap((day) => day.items.map((item) => ({ ...item, date: day.date })))
    .slice(0, 4);

  return (
    <div className="trip-overview">
      <section className="workspace-stat-grid">
        <Card className="workspace-stat">
          <span className="workspace-stat__icon"><Icon name="calendarDays" /></span>
          <div>
            <small>Planned activities</small>
            <strong>{itineraryCount}</strong>
          </div>
        </Card>
        <Card className="workspace-stat">
          <span className="workspace-stat__icon workspace-stat__icon--aqua"><Icon name="wallet" /></span>
          <div>
            <small>Paid so far</small>
            <strong>{formatCurrency(paidTotal, trip.currency)}</strong>
          </div>
        </Card>
        <Card className="workspace-stat">
          <span className="workspace-stat__icon workspace-stat__icon--coral"><Icon name="checklist" /></span>
          <div>
            <small>Checklist completed</small>
            <strong>{Math.round(checklistProgress)}%</strong>
          </div>
        </Card>
        <Card className="workspace-stat">
          <span className="workspace-stat__icon workspace-stat__icon--green"><Icon name="receipt" /></span>
          <div>
            <small>Total planned</small>
            <strong>{formatCurrency(plannedTotal, trip.currency)}</strong>
          </div>
        </Card>
      </section>

      <div className="trip-overview__grid">
        <Card className="workspace-panel">
          <header className="workspace-panel__header">
            <div>
              <p className="eyebrow">Next steps</p>
              <h2>Itinerary preview</h2>
            </div>
            <button className="text-link" type="button" onClick={() => onOpenTab('itinerary')}>
              Open itinerary <Icon name="arrowRight" size={16} />
            </button>
          </header>

          {upcomingItems.length > 0 ? (
            <div className="overview-timeline">
              {upcomingItems.map((item) => (
                <article key={item.id} className="overview-timeline__item">
                  <span className="overview-timeline__time">{item.time || 'Any time'}</span>
                  <span className="overview-timeline__marker"><Icon name={item.type} size={17} /></span>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.location || item.date}</small>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <WorkspaceEmptyState
              icon="calendarDays"
              title="Build your first travel day"
              copy="Add places, bookings and meal stops in a simple timeline."
              action="Start itinerary"
              onAction={() => onOpenTab('itinerary')}
            />
          )}
        </Card>

        <div className="trip-overview__side">
          <Card className="workspace-panel">
            <header className="workspace-panel__header">
              <div>
                <p className="eyebrow">Spending</p>
                <h2>Budget health</h2>
              </div>
              <button className="text-link" type="button" onClick={() => onOpenTab('budget')}>
                Details
              </button>
            </header>
            <div className="budget-health">
              <div>
                <span>Paid</span>
                <strong>{formatCurrency(paidTotal, trip.currency)}</strong>
              </div>
              <div>
                <span>Budget</span>
                <strong>{formatCurrency(trip.budget, trip.currency)}</strong>
              </div>
            </div>
            <ProgressBar value={budgetProgress} label="Budget used" />
            <p className="budget-health__caption">
              {formatCurrency(Math.max(0, trip.budget - paidTotal), trip.currency)} remains available.
            </p>
          </Card>

          <Card className="workspace-panel">
            <header className="workspace-panel__header">
              <div>
                <p className="eyebrow">Preparation</p>
                <h2>Checklist</h2>
              </div>
              <button className="text-link" type="button" onClick={() => onOpenTab('checklist')}>
                Manage
              </button>
            </header>
            <div className="checklist-summary">
              <strong>{trip.checklistCompleted} of {trip.checklistTotal}</strong>
              <span>items completed</span>
            </div>
            <ProgressBar value={checklistProgress} label="Checklist completion" />
          </Card>
        </div>
      </div>
    </div>
  );
}

function WorkspaceEmptyState({ icon, title, copy, action, onAction }) {
  return (
    <div className="workspace-empty">
      <span><Icon name={icon} size={24} /></span>
      <h3>{title}</h3>
      <p>{copy}</p>
      <button className="text-link" type="button" onClick={onAction}>
        {action} <Icon name="arrowRight" size={16} />
      </button>
    </div>
  );
}
