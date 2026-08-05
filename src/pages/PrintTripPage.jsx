import { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Icon } from '../components/common/Icon.jsx';
import { APP_CONFIG } from '../config/app.config.js';
import { useI18n } from '../hooks/useI18n.js';
import { useTrips } from '../hooks/useTrips.js';
import { formatCurrency } from '../utils/currency.js';
import { formatDateRange, formatLocalizedDate } from '../utils/date.js';
import { buildTripStatistics } from '../utils/tripStatistics.js';
import {
  DOCUMENT_TYPES,
  EXPENSE_CATEGORIES,
  RESERVATION_STATUSES,
  RESERVATION_TYPES,
  getOptionLabel,
} from '../utils/tripWorkspace.js';

export function PrintTripPage() {
  const { tripId } = useParams();
  const { getTripById } = useTrips();
  const { locale, t } = useI18n();
  const trip = getTripById(tripId);
  const statistics = useMemo(() => (trip ? buildTripStatistics(trip) : null), [trip]);

  useEffect(() => {
    if (!trip) return undefined;
    const previousTitle = document.title;
    document.title = `${trip.name} — ${t('print.documentTitle')}`;
    return () => { document.title = previousTitle; };
  }, [trip, t]);

  if (!trip) {
    return (
      <main className="print-page print-page--empty">
        <h1>{t('workspace.notFound')}</h1>
        <Link to="/trips">{t('workspace.backTrips')}</Link>
      </main>
    );
  }

  return (
    <main className="print-page">
      <div className="print-toolbar no-print">
        <Link className="button button--ghost button--medium" to={`/trips/${trip.id}`}>
          <Icon name="arrowLeft" size={17} /> {t('print.back')}
        </Link>
        <button className="button button--primary button--medium" type="button" onClick={() => window.print()}>
          <Icon name="print" size={17} /> {t('print.action')}
        </button>
      </div>

      <article className="print-document">
        <header className={`print-cover print-cover--${trip.accent}`}>
          <div>
            <p className="print-brand">{APP_CONFIG.brandName} · {t('print.travelPlan')}</p>
            <h1>{trip.name}</h1>
            <p className="print-destination">{trip.destination}{trip.country ? ` · ${trip.country}` : ''}</p>
            <p>{formatDateRange(trip.startDate, trip.endDate, locale, t('trips.datesTbc'))}</p>
          </div>
          <div className="print-cover__meta">
            <span>{t('print.travellers')}</span>
            <strong>{trip.travelers}</strong>
            <span>{t('print.budget')}</span>
            <strong>{formatCurrency(trip.budget, trip.currency, locale)}</strong>
          </div>
        </header>

        {trip.summary && <p className="print-summary">{trip.summary}</p>}

        <section className="print-section">
          <h2>{t('print.overview')}</h2>
          <div className="print-metrics">
            <div><span>{t('statistics.tripLength')}</span><strong>{t('statistics.days', { count: statistics.tripDays })}</strong></div>
            <div><span>{t('statistics.activities')}</span><strong>{statistics.activities}</strong></div>
            <div><span>{t('workspace.reservations')}</span><strong>{statistics.reservations}</strong></div>
            <div><span>{t('workspace.documents')}</span><strong>{statistics.documents}</strong></div>
          </div>
        </section>

        <section className="print-section print-section--breakable">
          <h2>{t('workspace.itinerary')}</h2>
          {trip.itinerary?.length ? trip.itinerary.map((day, index) => (
            <article key={day.id} className="print-day">
              <header>
                <span>{t('print.day', { count: index + 1 })}</span>
                <div><h3>{day.title || day.date}</h3><small>{formatLocalizedDate(day.date, locale, 'short', '')}</small></div>
              </header>
              {day.items?.length ? (
                <div className="print-list">
                  {day.items.map((item) => (
                    <div key={item.id} className="print-list__row">
                      <strong>{item.time || '—'}</strong>
                      <div>
                        <b>{item.title}</b>
                        <span>{[item.location, item.durationMinutes ? t('print.minutes', { count: item.durationMinutes }) : ''].filter(Boolean).join(' · ')}</span>
                        {item.notes && <small>{item.notes}</small>}
                      </div>
                      {item.estimatedCost > 0 && <b>{formatCurrency(item.estimatedCost, trip.currency, locale)}</b>}
                    </div>
                  ))}
                </div>
              ) : <p className="print-muted">{t('print.noActivities')}</p>}
            </article>
          )) : <p className="print-muted">{t('print.noItinerary')}</p>}
        </section>

        <section className="print-section print-section--breakable">
          <h2>{t('workspace.reservations')}</h2>
          {trip.reservations?.length ? (
            <div className="print-table-wrap">
              <table className="print-table">
                <thead><tr><th>{t('common.type')}</th><th>{t('common.title')}</th><th>{t('common.provider')}</th><th>{t('common.date')}</th><th>{t('common.status')}</th><th>{t('budget.paid')}</th></tr></thead>
                <tbody>
                  {trip.reservations.map((reservation) => (
                    <tr key={reservation.id}>
                      <td>{getOptionLabel(RESERVATION_TYPES, reservation.type, t)}</td>
                      <td>{reservation.title}<small>{reservation.confirmationNumber}</small></td>
                      <td>{reservation.provider || '—'}</td>
                      <td>{formatLocalizedDate(reservation.startDate, locale, 'short', '')} {reservation.startTime}</td>
                      <td>{getOptionLabel(RESERVATION_STATUSES, reservation.status, t)}</td>
                      <td>{formatCurrency(reservation.amount, trip.currency, locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="print-muted">{t('print.noReservations')}</p>}
        </section>

        <section className="print-section print-grid-section">
          <div>
            <h2>{t('workspace.budget')}</h2>
            <div className="print-budget-summary">
              <span>{t('statistics.expenseBreakdown')}</span>
              <strong>{formatCurrency(statistics.plannedExpense, trip.currency, locale)}</strong>
            </div>
            {statistics.expenseCategories.map((category) => (
              <div key={category.id} className="print-key-value">
                <span>{getOptionLabel(EXPENSE_CATEGORIES, category.id, t)}</span>
                <strong>{formatCurrency(category.amount, trip.currency, locale)}</strong>
              </div>
            ))}
          </div>
          <div>
            <h2>{t('workspace.checklistTab')}</h2>
            {trip.checklist?.length ? trip.checklist.map((item) => (
              <div key={item.id} className="print-checklist-row">
                <span className={item.completed ? 'print-checkbox print-checkbox--checked' : 'print-checkbox'}>{item.completed ? '✓' : ''}</span>
                <span>{item.label}</span>
              </div>
            )) : <p className="print-muted">{t('print.noChecklist')}</p>}
          </div>
        </section>

        <section className="print-section print-section--breakable">
          <h2>{t('workspace.documents')}</h2>
          {trip.documents?.length ? trip.documents.map((document) => (
            <div key={document.id} className="print-document-row">
              <div><strong>{document.title}</strong><span>{getOptionLabel(DOCUMENT_TYPES, document.type, t)}</span></div>
              <div><span>{t('common.reference')}</span><strong>{document.reference || '—'}</strong></div>
              <div><span>{t('documents.expiry')}</span><strong>{formatLocalizedDate(document.expiryDate, locale, 'short', '') || '—'}</strong></div>
            </div>
          )) : <p className="print-muted">{t('print.noDocuments')}</p>}
        </section>

        {trip.notes && (
          <section className="print-section print-section--breakable">
            <h2>{t('workspace.notes')}</h2>
            <p className="print-notes">{trip.notes}</p>
          </section>
        )}

        <footer className="print-footer">
          <span>{APP_CONFIG.brandName} · {t('brand.tagline')}</span>
          <span>{t('print.generated', { date: formatLocalizedDate(new Date(), locale, 'long') })}</span>
        </footer>
      </article>
    </main>
  );
}
