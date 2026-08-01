import { useI18n } from '../../hooks/useI18n.js';
import { formatCurrency } from '../../utils/currency.js';
import { getTripMapPoints } from '../../utils/map.js';
import {
  RESERVATION_STATUSES,
  getCategoryLabel,
  getConfirmedReservationCount,
  getItineraryItemCount,
  getPaidExpenseTotal,
  getPlannedExpenseTotal,
} from '../../utils/tripWorkspace.js';
import { Card } from '../common/Card.jsx';
import { Icon } from '../common/Icon.jsx';
import { ProgressBar } from '../common/ProgressBar.jsx';

export function OverviewPanel({ trip, onOpenTab }) {
  const { locale, t } = useI18n();
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
        <OverviewStat icon="calendarDays" label={t('overview.activities')} value={itineraryCount} />
        <OverviewStat icon="ticket" tone="aqua" label={t('overview.bookings')} value={confirmedReservations} />
        <OverviewStat icon="map" tone="green" label={t('overview.mapped')} value={mapPointCount} />
        <OverviewStat icon="wallet" tone="aqua" label={t('overview.paid')} value={formatCurrency(paidTotal, trip.currency, locale)} />
        <OverviewStat icon="checklist" tone="coral" label={t('overview.checklist')} value={`${Math.round(checklistProgress)}%`} />
        <OverviewStat icon="folder" tone="green" label={t('overview.documents')} value={trip.documents.length} />
        <OverviewStat icon="externalLink" label={t('overview.bookingOptions')} value={trip.bookingOptions.length} />
      </section>

      <div className="trip-overview__grid">
        <Card className="workspace-panel">
          <header className="workspace-panel__header">
            <div>
              <p className="eyebrow">{t('overview.nextSteps')}</p>
              <h2>{t('overview.itineraryPreview')}</h2>
            </div>
            <button className="text-link" type="button" onClick={() => onOpenTab('itinerary')}>
              {t('overview.openItinerary')} <Icon name="arrowRight" size={16} />
            </button>
          </header>

          {upcomingItems.length > 0 ? (
            <div className="overview-timeline">
              {upcomingItems.map((item) => (
                <article key={item.id} className="overview-timeline__item">
                  <span className="overview-timeline__time">{item.time || t('overview.anyTime')}</span>
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
              title={t('overview.buildDay')}
              copy={t('overview.firstDayText')}
              action={t('overview.startItinerary')}
              onAction={() => onOpenTab('itinerary')}
            />
          )}
        </Card>

        <div className="trip-overview__side">
          <Card className="workspace-panel">
            <header className="workspace-panel__header">
              <div><p className="eyebrow">{t('overview.spending')}</p><h2>{t('overview.budgetHealth')}</h2></div>
              <button className="text-link" type="button" onClick={() => onOpenTab('budget')}>{t('overview.details')}</button>
            </header>
            <div className="budget-health">
              <div><span>{t('overview.paidLabel')}</span><strong>{formatCurrency(paidTotal, trip.currency, locale)}</strong></div>
              <div><span>{t('overview.planned')}</span><strong>{formatCurrency(plannedTotal, trip.currency, locale)}</strong></div>
            </div>
            <ProgressBar value={budgetProgress} label={t('overview.budgetUsed')} />
            <p className="budget-health__caption">
              {t('overview.remainsAvailable', { amount: formatCurrency(Math.max(0, trip.budget - paidTotal), trip.currency, locale) })}
            </p>
          </Card>

          <Card className="workspace-panel">
            <header className="workspace-panel__header">
              <div><p className="eyebrow">{t('overview.preparation')}</p><h2>{t('workspace.checklist')}</h2></div>
              <button className="text-link" type="button" onClick={() => onOpenTab('checklist')}>{t('overview.manage')}</button>
            </header>
            <div className="checklist-summary">
              <strong>{trip.checklistCompleted}/{trip.checklistTotal}</strong>
              <span>{t('overview.itemsCompleted', { done: trip.checklistCompleted, total: trip.checklistTotal })}</span>
            </div>
            <ProgressBar value={checklistProgress} label={t('overview.checklistCompletion')} />
          </Card>
        </div>
      </div>

      <div className="trip-overview__lower-grid">
        <Card className="workspace-panel">
          <header className="workspace-panel__header">
            <div><p className="eyebrow">{t('overview.booked')}</p><h2>{t('overview.upcomingReservations')}</h2></div>
            <button className="text-link" type="button" onClick={() => onOpenTab('reservations')}>
              {t('overview.manage')} <Icon name="arrowRight" size={16} />
            </button>
          </header>
          {upcomingReservations.length > 0 ? (
            <div className="overview-reservations">
              {upcomingReservations.map((reservation) => (
                <article key={reservation.id}>
                  <span><Icon name={getReservationIcon(reservation.type)} size={17} /></span>
                  <div>
                    <strong>{reservation.title}</strong>
                    <small>{reservation.startDate || t('overview.dateToConfirm')}{reservation.provider ? ` · ${reservation.provider}` : ''}</small>
                  </div>
                  <em>{getCategoryLabel(RESERVATION_STATUSES, reservation.status, t)}</em>
                </article>
              ))}
            </div>
          ) : (
            <WorkspaceEmptyState
              icon="ticket"
              title={t('overview.noReservation')}
              copy={t('overview.reservationEmptyText')}
              action={t('overview.addReservation')}
              onAction={() => onOpenTab('reservations')}
            />
          )}
        </Card>

        <Card className="workspace-panel overview-map-callout">
          <span><Icon name="map" size={25} /></span>
          <div>
            <p className="eyebrow">{t('overview.onMap')}</p>
            <h2>{mapPointCount > 0 ? t('overview.placesReady', { count: mapPointCount }) : t('overview.mapJourney')}</h2>
            <p>{t('overview.mapText')}</p>
          </div>
          <button className="button button--secondary button--medium" type="button" onClick={() => onOpenTab('map')}>
            {t('overview.openMap')}
          </button>
        </Card>
      </div>
    </div>
  );
}

function OverviewStat({ icon, tone = '', label, value }) {
  return (
    <Card className="workspace-stat">
      <span className={`workspace-stat__icon${tone ? ` workspace-stat__icon--${tone}` : ''}`}><Icon name={icon} /></span>
      <div><small>{label}</small><strong>{value}</strong></div>
    </Card>
  );
}

function WorkspaceEmptyState({ icon, title, copy, action, onAction }) {
  return (
    <div className="workspace-empty">
      <span><Icon name={icon} size={24} /></span>
      <h3>{title}</h3>
      <p>{copy}</p>
      <button className="text-link" type="button" onClick={onAction}>{action} <Icon name="arrowRight" size={16} /></button>
    </div>
  );
}

function getReservationIcon(type) {
  return { flight: 'plane', accommodation: 'hotel', transport: 'car', activity: 'ticket' }[type] || 'ticket';
}
