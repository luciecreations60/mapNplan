import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../hooks/useI18n.js';
import { formatLocalizedDate, formatLocalizedDateTime } from '../../utils/date.js';
import { formatCurrency } from '../../utils/currency.js';
import { createId } from '../../utils/id.js';
import { normalizeExternalUrl } from '../../utils/url.js';
import { buildDirectionsUrl } from '../../utils/navigation.js';
import { weatherService } from '../../services/weather/WeatherService.js';
import { formatTemperature, getWeatherPresentation } from '../../utils/weather.js';
import {
  buildCompanionAlerts,
  formatCountdown,
  getActivityTimelineState,
  getCompanionDay,
  getInitialCompanionDate,
  getMinutesUntilActivity,
} from '../../utils/travelCompanion.js';
import { Badge } from '../common/Badge.jsx';
import { Button } from '../common/Button.jsx';
import { Card } from '../common/Card.jsx';
import { Icon } from '../common/Icon.jsx';
import { InlineNotice } from '../feedback/InlineNotice.jsx';

const EMPTY_EXPENSE = Object.freeze({ label: '', amount: '', category: 'food', splitAll: false });

export function TodayPanel({ trip, onUpdate, onOpenTab }) {
  const { locale, t } = useI18n();
  const [selectedDate, setSelectedDate] = useState(() => getInitialCompanionDate(trip));
  const [expenseForm, setExpenseForm] = useState({ ...EMPTY_EXPENSE });
  const [notice, setNotice] = useState(null);
  const [emergencyForm, setEmergencyForm] = useState(() => ({ ...trip.companion }));

  useEffect(() => {
    setSelectedDate(getInitialCompanionDate(trip));
    setEmergencyForm({ ...trip.companion });
  }, [trip.id]);

  const day = useMemo(() => getCompanionDay(trip, selectedDate), [trip, selectedDate]);

  // A ticking clock so the countdown and the "happening now" state stay
  // accurate while the panel is left open during a travel day.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const timeline = useMemo(
    () => getActivityTimelineState(day.activities, selectedDate, now),
    [day.activities, selectedDate, now],
  );
  const alerts = useMemo(
    () => buildCompanionAlerts(trip, selectedDate, day),
    [day, selectedDate, trip],
  );
  const currentParticipant = trip.travelParty.find((participant) => participant.isCurrentUser)
    || trip.travelParty[0]
    || null;

  // Weather is anchored on the first geolocated stop of the displayed day, so
  // it reflects where the traveller actually is rather than the trip's main
  // destination. Failures stay silent: the forecast is a bonus, never a
  // blocker for the rest of the panel.
  const weatherAnchor = useMemo(() => {
    const located = day.activities.find((activity) => (
      Number.isFinite(Number(activity.latitude)) && Number.isFinite(Number(activity.longitude))
    ));
    if (located) return { latitude: Number(located.latitude), longitude: Number(located.longitude) };
    if (Number.isFinite(Number(trip.destinationLatitude)) && Number.isFinite(Number(trip.destinationLongitude))) {
      return { latitude: Number(trip.destinationLatitude), longitude: Number(trip.destinationLongitude) };
    }
    return null;
  }, [day.activities, trip.destinationLatitude, trip.destinationLongitude]);

  const [dayWeather, setDayWeather] = useState(null);
  useEffect(() => {
    if (!weatherAnchor) {
      setDayWeather(null);
      return undefined;
    }
    let cancelled = false;
    weatherService
      .getForecast({ latitude: weatherAnchor.latitude, longitude: weatherAnchor.longitude })
      .then((forecast) => {
        if (cancelled) return;
        setDayWeather((forecast.days || []).find((entry) => entry.date === selectedDate) || null);
      })
      .catch(() => {
        if (!cancelled) setDayWeather(null);
      });
    return () => { cancelled = true; };
  }, [weatherAnchor?.latitude, weatherAnchor?.longitude, selectedDate]);

  function toggleActivityCompleted(activityId) {
    const now = new Date().toISOString();
    const nextItinerary = trip.itinerary.map((itineraryDay) => (
      itineraryDay.date === selectedDate
        ? {
            ...itineraryDay,
            items: itineraryDay.items.map((activity) => (
              activity.id === activityId
                ? { ...activity, completedAt: activity.completedAt ? null : now }
                : activity
            )),
          }
        : itineraryDay
    ));
    onUpdate({ itinerary: nextItinerary });
  }

  function submitQuickExpense(event) {
    event.preventDefault();
    const amount = Math.max(0, Number(expenseForm.amount) || 0);
    if (!expenseForm.label.trim() || amount <= 0 || !currentParticipant) return;

    const splitBetweenIds = expenseForm.splitAll
      ? trip.travelParty.map((participant) => participant.id)
      : [currentParticipant.id];
    const expense = {
      id: createId('expense'),
      label: expenseForm.label.trim(),
      category: expenseForm.category,
      amount,
      paidAmount: amount,
      date: selectedDate,
      paid: true,
      paidById: currentParticipant.id,
      splitBetweenIds,
      notes: t('companion.quickExpenseNote'),
    };

    onUpdate({ expenses: [...trip.expenses, expense] });
    setExpenseForm({ ...EMPTY_EXPENSE });
    setNotice({
      title: t('companion.expenseSavedTitle'),
      message: t('companion.expenseSavedText', { amount: formatCurrency(amount, trip.currency, locale) }),
    });
  }

  function saveEmergencyInfo(event) {
    event.preventDefault();
    onUpdate({
      companion: {
        ...emergencyForm,
        lastPreparedAt: new Date().toISOString(),
      },
    });
    setNotice({ title: t('companion.infoSavedTitle'), message: t('companion.infoSavedText') });
  }

  const focusActivity = timeline.currentActivity || timeline.nextActivity;
  const focusCountdown = focusActivity && !timeline.currentActivity
    ? formatCountdown(getMinutesUntilActivity(focusActivity, selectedDate, now), t)
    : '';
  const focusDirectionsUrl = focusActivity ? buildDirectionsUrl(focusActivity) : '';
  const weatherPresentation = dayWeather ? getWeatherPresentation(dayWeather.weatherCode) : null;

  return (
    <div className="workspace-section companion-panel">
      <section className="workspace-section__heading companion-panel__heading">
        <div>
          <p className="eyebrow">{t('companion.eyebrow')}</p>
          <h2>{t('companion.title')}</h2>
          <p>{t('companion.intro')}</p>
        </div>
        <label className="companion-date-picker">
          <span>{t('companion.displayedDay')}</span>
          <input
            type="date"
            min={trip.startDate || undefined}
            max={trip.endDate || undefined}
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
        </label>
      </section>

      {notice && (
        <InlineNotice tone="success" title={notice.title} className="page-notice">
          {notice.message}
        </InlineNotice>
      )}

      <section className="companion-focus-grid">
        <Card className="companion-focus-card">
          <div className="companion-focus-card__topline">
            <Badge tone={timeline.currentActivity ? 'success' : 'primary'}>
              {t(timeline.currentActivity ? 'companion.happeningNow' : 'companion.nextUp')}
            </Badge>
            {focusCountdown && <span className="companion-countdown">{focusCountdown}</span>}
            {weatherPresentation && (
              <span className="companion-weather-chip" title={t(weatherPresentation.labelKey)}>
                <Icon name={weatherPresentation.icon} size={16} />
                {formatTemperature(dayWeather.temperatureMax)} / {formatTemperature(dayWeather.temperatureMin)}
              </span>
            )}
            <span>{formatLongDate(selectedDate, locale)}</span>
          </div>
          {focusActivity ? (
            <div className="companion-focus-card__content">
              <span className="companion-focus-card__icon"><Icon name={focusActivity.type || 'map'} size={26} /></span>
              <div>
                <small>{focusActivity.time || t('companion.timeToConfirm')}</small>
                <h3>{focusActivity.title}</h3>
                {focusActivity.location && <p><Icon name="pin" size={15} /> {focusActivity.location}</p>}
                {focusActivity.notes && <em>{focusActivity.notes}</em>}
              </div>
            </div>
          ) : (
            <div className="companion-empty-inline">
              <Icon name="calendarDays" size={28} />
              <div><h3>{t('companion.noFocusTitle')}</h3><p>{t('companion.noFocusText')}</p></div>
            </div>
          )}
          <div className="companion-focus-card__actions">
            {focusDirectionsUrl && (
              <a
                className="button button--primary button--small"
                href={focusDirectionsUrl}
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="route" size={16} />
                <span>{t('companion.navigateThere')}</span>
              </a>
            )}
            <Button variant="secondary" size="small" icon="calendarDays" onClick={() => onOpenTab('itinerary')}>
              {t('companion.openItinerary')}
            </Button>
            {focusActivity && (
              <Button
                variant="secondary"
                size="small"
                icon={focusActivity.completedAt ? 'undo' : 'check'}
                onClick={() => toggleActivityCompleted(focusActivity.id)}
              >
                {t(focusActivity.completedAt ? 'companion.markNotDone' : 'companion.markDone')}
              </Button>
            )}
          </div>
        </Card>

        <Card className="companion-offline-card">
          <span className="companion-offline-card__icon"><Icon name="wifi" size={24} /></span>
          <div>
            <p className="eyebrow">{t('companion.offlineEyebrow')}</p>
            <h3>{t('companion.offlineTitle')}</h3>
            <p>{t('companion.offlineText')}</p>
            <small>{t('companion.lastLocalSave', { date: formatDateTime(trip.updatedAt, locale) })}</small>
          </div>
        </Card>
      </section>

      {alerts.length > 0 && (
        <Card className="companion-alerts-card">
          <header><Icon name="alertTriangle" size={20} /><div><h3>{t('companion.alertsTitle')}</h3><p>{t('companion.alertsText')}</p></div></header>
          <div className="companion-alerts-list">
            {alerts.map((alert) => (
              <button key={alert.id} type="button" className={`companion-alert companion-alert--${alert.tone}`} onClick={() => openAlertTarget(alert.id, onOpenTab)}>
                <Icon name={getAlertIcon(alert.id)} size={17} />
                <span>{t(`companion.alerts.${alert.id}`, { count: alert.count })}</span>
                <Icon name="chevronRight" size={16} />
              </button>
            ))}
          </div>
        </Card>
      )}

      <section className="companion-main-grid">
        <Card className="companion-agenda-card">
          <header className="companion-card-heading">
            <div><p className="eyebrow">{t('companion.agendaEyebrow')}</p><h3>{day.title || t('companion.agendaTitle')}</h3></div>
            <Button variant="ghost" size="small" onClick={() => onOpenTab('itinerary')}>{t('common.manage')}</Button>
          </header>
          {day.activities.length > 0 ? (
            <div className="companion-agenda-list">
              {day.activities.map((activity) => {
                const state = timeline.states.get(activity.id) || 'upcoming';
                const directionsUrl = buildDirectionsUrl(activity);
                return (
                  <article key={activity.id} className={`companion-agenda-item companion-agenda-item--${state}`}>
                    <time>{activity.time || '—'}</time>
                    <span className="companion-agenda-item__icon"><Icon name={activity.type || 'map'} size={17} /></span>
                    <div>
                      <h4>{activity.title}</h4>
                      {activity.location && <p>{activity.location}</p>}
                    </div>
                    <div className="companion-agenda-item__actions">
                      {directionsUrl && (
                        <a
                          className="icon-button icon-button--small"
                          href={directionsUrl}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={t('companion.navigateTo', { name: activity.title })}
                          title={t('companion.navigateThere')}
                        >
                          <Icon name="route" size={17} />
                        </a>
                      )}
                      <button
                        className={`companion-complete-button ${activity.completedAt ? 'companion-complete-button--done' : ''}`}
                        type="button"
                        aria-label={t(activity.completedAt ? 'companion.markNotDoneFor' : 'companion.markDoneFor', { name: activity.title })}
                        onClick={() => toggleActivityCompleted(activity.id)}
                      >
                        <Icon name={activity.completedAt ? 'checkCircle' : 'circle'} size={20} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="companion-empty-inline"><Icon name="calendarDays" size={25} /><div><h3>{t('companion.emptyAgendaTitle')}</h3><p>{t('companion.emptyAgendaText')}</p></div></div>
          )}
        </Card>

        <div className="companion-side-stack">
          <Card className="companion-access-card">
            <header className="companion-card-heading"><div><p className="eyebrow">{t('companion.accessEyebrow')}</p><h3>{t('companion.accessTitle')}</h3></div></header>
            <QuickAccessList
              reservations={day.reservations}
              documents={trip.documents}
              locale={locale}
              t={t}
              onOpenReservations={() => onOpenTab('reservations')}
              onOpenDocuments={() => onOpenTab('documents')}
            />
          </Card>

          <Card className="companion-expense-card">
            <header className="companion-card-heading"><div><p className="eyebrow">{t('companion.expenseEyebrow')}</p><h3>{t('companion.expenseTitle')}</h3></div></header>
            <form className="companion-expense-form" onSubmit={submitQuickExpense}>
              <label><span>{t('companion.expenseLabel')}</span><input value={expenseForm.label} onChange={(event) => setExpenseForm((current) => ({ ...current, label: event.target.value }))} placeholder={t('companion.expensePlaceholder')} required /></label>
              <div className="companion-expense-form__row">
                <label><span>{t('tools.amount')}</span><input type="number" min="0.01" step="0.01" value={expenseForm.amount} onChange={(event) => setExpenseForm((current) => ({ ...current, amount: event.target.value }))} required /></label>
                <label><span>{t('budget.category')}</span><select value={expenseForm.category} onChange={(event) => setExpenseForm((current) => ({ ...current, category: event.target.value }))}><option value="food">{t('options.food')}</option><option value="transport">{t('options.transport')}</option><option value="activities">{t('options.activities')}</option><option value="shopping">{t('options.shopping')}</option><option value="other">{t('options.other')}</option></select></label>
              </div>
              {trip.travelParty.length > 1 && (
                <label className="companion-checkbox"><input type="checkbox" checked={expenseForm.splitAll} onChange={(event) => setExpenseForm((current) => ({ ...current, splitAll: event.target.checked }))} /><span>{t('companion.splitAll', { count: trip.travelParty.length })}</span></label>
              )}
              <Button type="submit" icon="receipt" size="small">{t('companion.saveExpense')}</Button>
            </form>
          </Card>
        </div>
      </section>

      <Card className="companion-emergency-card">
        <header className="companion-card-heading">
          <div><p className="eyebrow">{t('companion.emergencyEyebrow')}</p><h3>{t('companion.emergencyTitle')}</h3><p>{t('companion.emergencyIntro')}</p></div>
          <Icon name="shield" size={26} />
        </header>
        <form className="companion-emergency-form" onSubmit={saveEmergencyInfo}>
          <label><span>{t('companion.localEmergencyNumber')}</span><input inputMode="tel" value={emergencyForm.localEmergencyNumber} onChange={(event) => setEmergencyForm((current) => ({ ...current, localEmergencyNumber: event.target.value }))} placeholder={t('companion.verifyNumber')} /></label>
          <label><span>{t('companion.contactName')}</span><input value={emergencyForm.emergencyContactName} onChange={(event) => setEmergencyForm((current) => ({ ...current, emergencyContactName: event.target.value }))} /></label>
          <label><span>{t('companion.contactPhone')}</span><input inputMode="tel" value={emergencyForm.emergencyContactPhone} onChange={(event) => setEmergencyForm((current) => ({ ...current, emergencyContactPhone: event.target.value }))} /></label>
          <label><span>{t('companion.insuranceProvider')}</span><input value={emergencyForm.insuranceProvider} onChange={(event) => setEmergencyForm((current) => ({ ...current, insuranceProvider: event.target.value }))} /></label>
          <label><span>{t('companion.policyNumber')}</span><input value={emergencyForm.insurancePolicyNumber} onChange={(event) => setEmergencyForm((current) => ({ ...current, insurancePolicyNumber: event.target.value }))} /></label>
          <label className="companion-emergency-form__wide"><span>{t('companion.medicalNotes')}</span><textarea rows="3" value={emergencyForm.medicalNotes} onChange={(event) => setEmergencyForm((current) => ({ ...current, medicalNotes: event.target.value }))} placeholder={t('companion.medicalNotesPlaceholder')} /></label>
          <div className="companion-emergency-form__footer"><p><Icon name="info" size={15} /> {t('companion.emergencyDisclaimer')}</p><Button type="submit" icon="save" size="small">{t('companion.saveEmergency')}</Button></div>
        </form>
      </Card>
    </div>
  );
}

function QuickAccessList({ reservations, documents, locale, t, onOpenReservations, onOpenDocuments }) {
  const visibleDocuments = documents.slice(0, 3);
  if (reservations.length === 0 && visibleDocuments.length === 0) {
    return <div className="companion-empty-inline"><Icon name="ticket" size={24} /><div><h3>{t('companion.noAccessTitle')}</h3><p>{t('companion.noAccessText')}</p></div></div>;
  }

  return (
    <div className="companion-access-list">
      {reservations.slice(0, 4).map((reservation) => {
        const safeUrl = normalizeExternalUrl(reservation.url);
        return (
          <article key={reservation.id} className="companion-access-item">
            <span><Icon name={reservation.type === 'flight' ? 'plane' : reservation.type === 'accommodation' ? 'hotel' : 'ticket'} size={17} /></span>
            <div><h4>{reservation.title}</h4><p>{reservation.startTime || t('companion.timeToConfirm')} · {reservation.provider || reservation.location || t('common.details')}</p>{reservation.confirmationNumber && <small>{t('companion.confirmation')}: {reservation.confirmationNumber}</small>}</div>
            {safeUrl && <a className="icon-button icon-button--small" href={safeUrl} target="_blank" rel="noreferrer" aria-label={t('companion.openReservation', { name: reservation.title })}><Icon name="externalLink" size={16} /></a>}
          </article>
        );
      })}
      {visibleDocuments.map((document) => {
        const safeUrl = normalizeExternalUrl(document.url);
        return (
          <article key={document.id} className="companion-access-item">
            <span><Icon name="file" size={17} /></span>
            <div><h4>{document.title}</h4><p>{document.expiryDate ? t('companion.expires', { date: formatShortDate(document.expiryDate, locale) }) : t('companion.travelDocument')}</p></div>
            {safeUrl && <a className="icon-button icon-button--small" href={safeUrl} target="_blank" rel="noreferrer" aria-label={t('companion.openDocument', { name: document.title })}><Icon name="externalLink" size={16} /></a>}
          </article>
        );
      })}
      <div className="companion-access-list__footer"><button type="button" onClick={onOpenReservations}>{t('workspace.reservations')}</button><button type="button" onClick={onOpenDocuments}>{t('workspace.documents')}</button></div>
    </div>
  );
}

function openAlertTarget(alertId, onOpenTab) {
  if (alertId === 'cancelled' || alertId === 'pending') onOpenTab('reservations');
  else if (alertId === 'unmapped' || alertId === 'busyDay') onOpenTab('itinerary');
  else if (alertId === 'checklist') onOpenTab('checklist');
}

function getAlertIcon(id) {
  return { cancelled: 'alertCircle', pending: 'clock', unmapped: 'map', busyDay: 'activity', checklist: 'checklist' }[id] || 'info';
}

function formatLongDate(date, locale) {
  if (!date) return '';
  return formatLocalizedDate(date, locale, 'long');
}

function formatShortDate(date, locale) {
  if (!date) return '';
  return formatLocalizedDate(date, locale, 'short');
}

function formatDateTime(date, locale) {
  if (!date) return '—';
  return formatLocalizedDateTime(date, locale);
}
