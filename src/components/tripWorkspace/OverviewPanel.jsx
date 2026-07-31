import { Card } from '../common/Card.jsx';
import { Icon } from '../common/Icon.jsx';
import { ProgressBar } from '../common/ProgressBar.jsx';
import { formatCurrency } from '../../utils/currency.js';
import { getTripMapPoints } from '../../utils/map.js';
import {
  getConfirmedReservationCount,
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
  const confirmedReservations = getConfirmedReservationCount(trip.reservations);
  const mapPointCount = getTripMapPoints(trip).length;
  const upcomingItems = trip.itinerary
    .flatMap((day) => day.items.map((item) => ({ ...item, date: day.date })))
    .slice(0, 4);
  const upcomingReservations = [...trip.reservations]
    .filter((reservation) => reservation.status !== 'cancelled')
    .sort((left, right) => `${left.startDate}${left.startTime}`.localeCompare(`${right.startDate}${right.startTime}`))
    .slice(0, 3);

  return (
    <div className="trip-overview">
      <section className="workspace-stat-grid">
        <OverviewStat icon="calendarDays" label="Planned activities" value={itineraryCount} />
        <OverviewStat icon="ticket" tone="aqua" label="Confirmed bookings" value={confirmedReservations} />
        <OverviewStat icon="map" tone="green" label="Mapped locations" value={mapPointCount} />
        <OverviewStat icon="wallet" tone="aqua" label="Paid so far" value={formatCurrency(paidTotal, trip.currency)} />
        <OverviewStat icon="checklist" tone="coral" label="Checklist completed" value={`${Math.round(checklistProgress)}%`} />
        <OverviewStat icon="folder" tone="green" label="Travel documents" value={trip.documents.length} />
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
                <span>Planned</span>
                <strong>{formatCurrency(plannedTotal, trip.currency)}</strong>
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

      <div className="trip-overview__lower-grid">
        <Card className="workspace-panel">
          <header className="workspace-panel__header">
            <div>
              <p className="eyebrow">Booked</p>
              <h2>Upcoming reservations</h2>
            </div>
            <button className="text-link" type="button" onClick={() => onOpenTab('reservations')}>
              Manage <Icon name="arrowRight" size={16} />
            </button>
          </header>
          {upcomingReservations.length > 0 ? (
            <div className="overview-reservations">
              {upcomingReservations.map((reservation) => (
                <article key={reservation.id}>
                  <span><Icon name={getReservationIcon(reservation.type)} size={17} /></span>
                  <div>
                    <strong>{reservation.title}</strong>
                    <small>{reservation.startDate || 'Date to confirm'}{reservation.provider ? ` · ${reservation.provider}` : ''}</small>
                  </div>
                  <em>{reservation.status}</em>
                </article>
              ))}
            </div>
          ) : (
            <WorkspaceEmptyState
              icon="ticket"
              title="No reservation saved"
              copy="Add flights, stays and booked activities to keep confirmations together."
              action="Add reservation"
              onAction={() => onOpenTab('reservations')}
            />
          )}
        </Card>

        <Card className="workspace-panel overview-map-callout">
          <span><Icon name="map" size={25} /></span>
          <div>
            <p className="eyebrow">On the map</p>
            <h2>{mapPointCount > 0 ? `${mapPointCount} places ready` : 'Map your journey'}</h2>
            <p>Add coordinates once and see the route take shape automatically.</p>
          </div>
          <button className="button button--secondary button--medium" type="button" onClick={() => onOpenTab('map')}>
            Open map
          </button>
        </Card>
      </div>
    </div>
  );
}

function OverviewStat({ icon, tone = '', label, value }) {
  return (
    <Card className="workspace-stat">
      <span className={`workspace-stat__icon${tone ? ` workspace-stat__icon--${tone}` : ''}`}>
        <Icon name={icon} />
      </span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </Card>
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

function getReservationIcon(type) {
  return {
    flight: 'plane',
    accommodation: 'hotel',
    transport: 'car',
    activity: 'ticket',
  }[type] || 'ticket';
}
