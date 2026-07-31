import { useMemo, useState } from 'react';
import { Button } from '../components/common/Button.jsx';
import { Card } from '../components/common/Card.jsx';
import { Icon } from '../components/common/Icon.jsx';
import { StatCard } from '../components/dashboard/StatCard.jsx';
import { UpcomingTripCard } from '../components/dashboard/UpcomingTripCard.jsx';
import { CreateTripDialog } from '../components/trips/CreateTripDialog.jsx';
import { TripCard } from '../components/trips/TripCard.jsx';
import { APP_CONFIG } from '../config/app.config.js';
import { useTrips } from '../hooks/useTrips.js';
import { formatCurrency } from '../utils/currency.js';
import { getTripStatus, sortTripsByStartDate } from '../utils/date.js';

export function DashboardPage() {
  const [isCreateOpen, setCreateOpen] = useState(false);
  const now = new Date();
  const todayLabel = new Intl.DateTimeFormat(APP_CONFIG.defaultLocale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(now);
  const greeting = now.getHours() < 12
    ? 'Good morning'
    : now.getHours() < 18
      ? 'Good afternoon'
      : 'Good evening';
  const { trips, deleteTrip } = useTrips();

  const upcomingTrips = useMemo(
    () => sortTripsByStartDate(trips.filter((trip) => ['upcoming', 'ongoing'].includes(getTripStatus(trip)))),
    [trips],
  );
  const nextTrip = upcomingTrips[0] || null;
  const totalBudget = upcomingTrips.reduce((sum, trip) => sum + trip.budget, 0);
  const totalSpent = upcomingTrips.reduce((sum, trip) => sum + trip.spent, 0);
  const checklistTotal = upcomingTrips.reduce((sum, trip) => sum + trip.checklistTotal, 0);
  const checklistDone = upcomingTrips.reduce((sum, trip) => sum + trip.checklistCompleted, 0);
  const checklistPercent = checklistTotal ? Math.round((checklistDone / checklistTotal) * 100) : 0;

  function handleDelete(id) {
    const trip = trips.find((item) => item.id === id);
    if (trip && window.confirm(`Delete “${trip.name}”?`)) deleteTrip(id);
  }

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <p className="eyebrow">{todayLabel}</p>
          <h1>{greeting}, {APP_CONFIG.demoUserName} <span aria-hidden="true">👋</span></h1>
          <p>Everything you need for your next adventure, in one place.</p>
        </div>
        <Button icon="plus" onClick={() => setCreateOpen(true)}>Plan a new trip</Button>
      </section>

      <UpcomingTripCard trip={nextTrip} />

      <section className="stats-grid" aria-label="Travel overview">
        <StatCard icon="trips" label="Active trips" value={upcomingTrips.length} detail={`${trips.length} total journeys`} tone="violet" />
        <StatCard icon="wallet" label="Planned budget" value={formatCurrency(totalBudget)} detail={`${formatCurrency(totalSpent)} already allocated`} tone="aqua" />
        <StatCard icon="check" label="Ready to leave" value={`${checklistPercent}%`} detail={`${checklistDone} checklist items complete`} tone="green" />
        <StatCard icon="globe" label="Countries" value={new Set(trips.map((trip) => trip.country).filter(Boolean)).size} detail="Your personal travel map" tone="coral" />
      </section>

      <div className="dashboard-grid">
        <section className="content-section">
          <header className="section-heading">
            <div>
              <p className="eyebrow">Your journeys</p>
              <h2>Trips in progress</h2>
            </div>
            <button className="text-link" type="button">View all <Icon name="arrowRight" size={16} /></button>
          </header>

          <div className="trip-grid trip-grid--dashboard">
            {upcomingTrips.slice(0, 2).map((trip) => (
              <TripCard key={trip.id} trip={trip} onDelete={handleDelete} />
            ))}
          </div>
        </section>

        <Card className="quick-actions-card">
          <header className="section-heading section-heading--compact">
            <div>
              <p className="eyebrow">Shortcuts</p>
              <h2>Quick actions</h2>
            </div>
          </header>
          <div className="quick-actions">
            <button type="button"><span><Icon name="calendar" /></span><div><strong>Build itinerary</strong><small>Organise each day</small></div><Icon name="chevronRight" size={17} /></button>
            <button type="button"><span><Icon name="wallet" /></span><div><strong>Update budget</strong><small>Track planned costs</small></div><Icon name="chevronRight" size={17} /></button>
            <button type="button"><span><Icon name="check" /></span><div><strong>Travel checklist</strong><small>Prepare without stress</small></div><Icon name="chevronRight" size={17} /></button>
            <button type="button"><span><Icon name="folder" /></span><div><strong>Reservations</strong><small>Keep documents together</small></div><Icon name="chevronRight" size={17} /></button>
          </div>
        </Card>
      </div>

      <CreateTripDialog isOpen={isCreateOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
