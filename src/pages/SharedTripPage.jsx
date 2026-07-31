
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Brand } from '../components/common/Brand.jsx';
import { Card } from '../components/common/Card.jsx';
import { Icon } from '../components/common/Icon.jsx';
import { useI18n } from '../hooks/useI18n.js';
import { tripShareService } from '../services/share/TripShareService.js';
import { formatCurrency } from '../utils/currency.js';
import { formatDateRange } from '../utils/date.js';

export function SharedTripPage() {
  const [searchParams] = useSearchParams();
  const { locale, t } = useI18n();
  const [importedSnapshot, setImportedSnapshot] = useState(null);
  const [fileError, setFileError] = useState('');
  const result = useMemo(() => {
    try {
      return { snapshot: tripShareService.decode(searchParams.get('data')), error: null };
    } catch (error) {
      return { snapshot: null, error };
    }
  }, [searchParams]);

  const snapshot = importedSnapshot || result.snapshot;

  async function openShareFile(event) {
    const [file] = event.target.files || [];
    if (!file) return;
    try {
      setImportedSnapshot(await tripShareService.readSnapshotFile(file));
      setFileError('');
    } catch (error) {
      console.error(error);
      setFileError(t('shared.fileError'));
    } finally {
      event.target.value = '';
    }
  }

  if (!snapshot) {
    return (
      <main className="shared-trip-shell shared-trip-shell--empty">
        <Brand />
        <section className="shared-trip-error">
          <span><Icon name="alertCircle" size={30} /></span>
          <h1>{t('shared.invalidTitle')}</h1>
          <p>{t('shared.invalidText')}</p>
          {fileError && <p className="shared-trip-file-error" role="alert">{fileError}</p>}
          <div className="shared-trip-error__actions">
            <label className="button button--secondary button--medium">
              <Icon name="upload" size={18} />
              <span>{t('shared.openFile')}</span>
              <input className="sr-only" type="file" accept="application/json,.json" onChange={openShareFile} />
            </label>
            <Link className="button button--primary button--medium" to="/dashboard">{t('shared.openApp')}</Link>
          </div>
        </section>
      </main>
    );
  }

  const { trip, createdAt } = snapshot;
  const paidTotal = trip.expenses.filter((expense) => expense.paid).reduce((sum, expense) => sum + expense.amount, 0);
  const checklistCompleted = trip.checklist.filter((item) => item.completed).length;

  return (
    <main className="shared-trip-shell">
      <header className="shared-trip-topbar">
        <Brand />
        <div><Icon name="eye" size={17} /><span>{t('shared.readOnly')}</span></div>
        <Link className="button button--secondary button--small" to="/dashboard">{t('shared.openApp')}</Link>
      </header>

      <section className={`shared-trip-hero shared-trip-hero--${trip.accent || 'violet'}`}>
        <p className="eyebrow">{t('shared.sharedPlan')}</p>
        <h1>{trip.name}</h1>
        <p className="shared-trip-hero__destination"><Icon name="pin" size={17} /> {trip.destination}{trip.country ? `, ${trip.country}` : ''}</p>
        <p><Icon name="calendar" size={17} /> {formatDateRange(trip.startDate, trip.endDate, locale, t('trips.datesTbc'))} · <Icon name="users" size={17} /> {trip.travelers}</p>
        {trip.summary && <em>{trip.summary}</em>}
      </section>

      <div className="shared-trip-content">
        <section className="shared-trip-summary-grid">
          <Card><span><Icon name="calendarDays" /></span><div><small>{t('shared.activities')}</small><strong>{trip.itinerary.reduce((count, day) => count + day.items.length, 0)}</strong></div></Card>
          <Card><span><Icon name="ticket" /></span><div><small>{t('shared.reservations')}</small><strong>{trip.reservations.length}</strong></div></Card>
          {trip.shareOptions.includeChecklist && <Card><span><Icon name="checklist" /></span><div><small>{t('shared.checklist')}</small><strong>{checklistCompleted}/{trip.checklist.length}</strong></div></Card>}
          {trip.shareOptions.includeBudget && <Card><span><Icon name="wallet" /></span><div><small>{t('shared.paid')}</small><strong>{formatCurrency(paidTotal, trip.currency, locale)}</strong></div></Card>}
        </section>

        <Card className="shared-trip-section">
          <header><div><p className="eyebrow">{t('shared.planEyebrow')}</p><h2>{t('shared.itinerary')}</h2></div></header>
          {trip.itinerary.length > 0 ? (
            <div className="shared-itinerary">
              {trip.itinerary.map((day, index) => (
                <section key={day.id}>
                  <header><span>{index + 1}</span><div><h3>{formatSharedDate(day.date, locale, t)}</h3>{day.title && <p>{day.title}</p>}</div></header>
                  <div>
                    {day.items.map((item) => (
                      <article key={item.id}><time>{item.time || '—'}</time><span><Icon name={item.type} size={16} /></span><div><strong>{item.title}</strong>{item.location && <small>{item.location}</small>}{item.notes && <p>{item.notes}</p>}</div></article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : <p className="shared-trip-empty">{t('shared.noItinerary')}</p>}
        </Card>

        {trip.reservations.length > 0 && (
          <Card className="shared-trip-section">
            <header><div><p className="eyebrow">{t('shared.bookingsEyebrow')}</p><h2>{t('shared.reservations')}</h2></div></header>
            <div className="shared-reservations">
              {trip.reservations.map((reservation) => (
                <article key={reservation.id}><span><Icon name={getReservationIcon(reservation.type)} /></span><div><strong>{reservation.title}</strong><small>{[reservation.startDate, reservation.startTime, reservation.location, reservation.provider].filter(Boolean).join(' · ')}</small>{reservation.notes && <p>{reservation.notes}</p>}</div></article>
              ))}
            </div>
          </Card>
        )}

        {trip.shareOptions.includeChecklist && trip.checklist.length > 0 && (
          <Card className="shared-trip-section">
            <header><div><p className="eyebrow">{t('shared.preparationEyebrow')}</p><h2>{t('shared.checklist')}</h2></div></header>
            <div className="shared-checklist">{trip.checklist.map((item) => <div key={item.id}><Icon name={item.completed ? 'checkCircle' : 'circle'} size={17} /><span>{item.label}</span></div>)}</div>
          </Card>
        )}

        {trip.shareOptions.includeNotes && trip.notes && (
          <Card className="shared-trip-section"><header><div><p className="eyebrow">{t('shared.notesEyebrow')}</p><h2>{t('workspace.notes')}</h2></div></header><p className="shared-notes">{trip.notes}</p></Card>
        )}

        <footer className="shared-trip-footer"><Brand compact /><p>{t('shared.generated', { date: new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeStyle: 'short' }).format(new Date(createdAt)) })}</p></footer>
      </div>
    </main>
  );
}

function formatSharedDate(value, locale, t) {
  if (!value) return t('shared.dateToConfirm');
  return new Intl.DateTimeFormat(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(`${value}T12:00:00`));
}

function getReservationIcon(type) {
  return { flight: 'plane', accommodation: 'hotel', transport: 'car', activity: 'ticket' }[type] || 'ticket';
}
