import { useMemo, useState } from 'react';
import { Button } from '../components/common/Button.jsx';
import { Card } from '../components/common/Card.jsx';
import { Icon } from '../components/common/Icon.jsx';
import { StatCard } from '../components/dashboard/StatCard.jsx';
import { UpcomingTripCard } from '../components/dashboard/UpcomingTripCard.jsx';
import { CreateTripDialog } from '../components/trips/CreateTripDialog.jsx';
import { TripCard } from '../components/trips/TripCard.jsx';
import { APP_CONFIG } from '../config/app.config.js';
import { useI18n } from '../hooks/useI18n.js';
import { useTrips } from '../hooks/useTrips.js';
import { formatCurrency } from '../utils/currency.js';
import { getTripStatus, sortTripsByStartDate } from '../utils/date.js';

export function DashboardPage() {
  const [isCreateOpen, setCreateOpen] = useState(false);
  const { locale, t } = useI18n();
  const { trips, deleteTrip } = useTrips();
  const now = new Date();
  const todayLabel = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(now);
  const greeting = now.getHours() < 12
    ? t('dashboard.goodMorning')
    : now.getHours() < 18
      ? t('dashboard.goodAfternoon')
      : t('dashboard.goodEvening');

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
    if (trip && window.confirm(t('trips.deleteConfirm', { name: trip.name }))) deleteTrip(id);
  }

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <p className="eyebrow">{todayLabel}</p>
          <h1>{greeting}, {APP_CONFIG.demoUserName} <span aria-hidden="true">👋</span></h1>
          <p>{t('dashboard.intro')}</p>
        </div>
        <Button icon="plus" onClick={() => setCreateOpen(true)}>{t('dashboard.planTrip')}</Button>
      </section>

      <UpcomingTripCard trip={nextTrip} />

      <section className="stats-grid" aria-label={t('dashboard.overviewAria')}>
        <StatCard icon="trips" label={t('dashboard.activeTrips')} value={upcomingTrips.length} detail={t('dashboard.totalJourneys', { count: trips.length })} tone="violet" />
        <StatCard icon="wallet" label={t('dashboard.plannedBudget')} value={formatCurrency(totalBudget, 'EUR', locale)} detail={t('dashboard.alreadyAllocated', { amount: formatCurrency(totalSpent, 'EUR', locale) })} tone="aqua" />
        <StatCard icon="check" label={t('dashboard.readyToLeave')} value={`${checklistPercent}%`} detail={t('dashboard.checklistComplete', { count: checklistDone })} tone="green" />
        <StatCard icon="globe" label={t('dashboard.countries')} value={new Set(trips.map((trip) => trip.country).filter(Boolean)).size} detail={t('dashboard.personalMap')} tone="coral" />
      </section>

      <div className="dashboard-grid">
        <section className="content-section">
          <header className="section-heading">
            <div>
              <p className="eyebrow">{t('dashboard.yourJourneys')}</p>
              <h2>{t('dashboard.tripsInProgress')}</h2>
            </div>
            <button className="text-link" type="button">{t('dashboard.viewAll')} <Icon name="arrowRight" size={16} /></button>
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
              <p className="eyebrow">{t('dashboard.shortcuts')}</p>
              <h2>{t('dashboard.quickActions')}</h2>
            </div>
          </header>
          <div className="quick-actions">
            <button type="button"><span><Icon name="calendar" /></span><div><strong>{t('dashboard.buildItinerary')}</strong><small>{t('dashboard.organiseDay')}</small></div><Icon name="chevronRight" size={17} /></button>
            <button type="button"><span><Icon name="wallet" /></span><div><strong>{t('dashboard.updateBudget')}</strong><small>{t('dashboard.trackCosts')}</small></div><Icon name="chevronRight" size={17} /></button>
            <button type="button"><span><Icon name="check" /></span><div><strong>{t('dashboard.travelChecklist')}</strong><small>{t('dashboard.prepareStressFree')}</small></div><Icon name="chevronRight" size={17} /></button>
            <button type="button"><span><Icon name="folder" /></span><div><strong>{t('dashboard.reservations')}</strong><small>{t('dashboard.keepDocuments')}</small></div><Icon name="chevronRight" size={17} /></button>
          </div>
        </Card>
      </div>

      <CreateTripDialog isOpen={isCreateOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
