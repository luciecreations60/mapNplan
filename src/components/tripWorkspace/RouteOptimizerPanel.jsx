import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../hooks/useI18n.js';
import { routePlanningService } from '../../services/routing/RoutePlanningService.js';
import { hasValidCoordinates } from '../../utils/map.js';
import { formatDurationMinutes, TRAVEL_MODES } from '../../utils/routeOptimization.js';
import { Button } from '../common/Button.jsx';
import { Card } from '../common/Card.jsx';
import { Icon } from '../common/Icon.jsx';
import { InlineNotice } from '../feedback/InlineNotice.jsx';
import { TripMap } from './TripMap.jsx';

export function RouteOptimizerPanel({ trip, onUpdate, onOpenTab }) {
  const { locale, t } = useI18n();
  const days = useMemo(
    () => [...(trip.itinerary || [])].sort((left, right) => left.date.localeCompare(right.date)),
    [trip.itinerary],
  );
  const [selectedDayId, setSelectedDayId] = useState(days[0]?.id || '');
  const selectedDay = days.find((day) => day.id === selectedDayId) || days[0] || null;
  const [mode, setMode] = useState(selectedDay?.routePlan?.mode || 'walking');
  const [startStrategy, setStartStrategy] = useState(
    selectedDay?.routePlan?.startStrategy || 'firstActivity',
  );
  const [startTime, setStartTime] = useState(
    selectedDay?.routePlan?.startTime || selectedDay?.items?.[0]?.time || '09:00',
  );
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (!selectedDay && days[0]) setSelectedDayId(days[0].id);
  }, [days, selectedDay]);

  useEffect(() => {
    if (!selectedDay) return;
    setMode(selectedDay.routePlan?.mode || 'walking');
    setStartStrategy(selectedDay.routePlan?.startStrategy || 'firstActivity');
    setStartTime(selectedDay.routePlan?.startTime || selectedDay.items?.[0]?.time || '09:00');
    setNotice(null);
  }, [selectedDay?.id]);

  const analysis = useMemo(
    () => selectedDay ? routePlanningService.analyse(selectedDay, mode) : null,
    [selectedDay, mode],
  );
  const mapPoints = useMemo(
    () => selectedDay ? routePlanningService.getMapPoints(selectedDay) : [],
    [selectedDay],
  );

  function replaceDay(nextDay) {
    onUpdate({
      itinerary: trip.itinerary.map((day) => day.id === nextDay.id ? nextDay : day),
    });
  }

  function optimizeRoute() {
    if (!selectedDay) return;
    const result = routePlanningService.optimize(selectedDay, {
      mode,
      startStrategy,
      startTime,
      destination: {
        id: `destination-${trip.id}`,
        latitude: trip.destinationLatitude,
        longitude: trip.destinationLongitude,
      },
    });

    if (!result.changed) {
      setNotice({ tone: 'warning', title: t('routeOptimizer.notEnoughTitle'), text: t('routeOptimizer.notEnoughText') });
      return;
    }

    replaceDay(result.day);
    setNotice({ tone: 'success', title: t('routeOptimizer.optimizedTitle'), text: t('routeOptimizer.optimizedText') });
  }

  function restoreRoute() {
    if (!selectedDay) return;
    const result = routePlanningService.restore(selectedDay);
    if (!result.changed) return;
    replaceDay(result.day);
    setNotice({ tone: 'success', title: t('routeOptimizer.restoredTitle'), text: t('routeOptimizer.restoredText') });
  }

  if (days.length === 0) {
    return (
      <div className="workspace-section">
        <section className="workspace-section__heading">
          <div>
            <p className="eyebrow">{t('routeOptimizer.eyebrow')}</p>
            <h2>{t('routeOptimizer.title')}</h2>
            <p>{t('routeOptimizer.intro')}</p>
          </div>
        </section>
        <section className="workspace-large-empty">
          <span><Icon name="route" size={28} /></span>
          <h3>{t('routeOptimizer.emptyTitle')}</h3>
          <p>{t('routeOptimizer.emptyText')}</p>
          <Button icon="plus" onClick={() => onOpenTab('itinerary')}>{t('routeOptimizer.openItinerary')}</Button>
        </section>
      </div>
    );
  }

  return (
    <div className="workspace-section route-optimizer">
      <section className="workspace-section__heading">
        <div>
          <p className="eyebrow">{t('routeOptimizer.eyebrow')}</p>
          <h2>{t('routeOptimizer.title')}</h2>
          <p>{t('routeOptimizer.intro')}</p>
        </div>
      </section>

      {notice && (
        <InlineNotice tone={notice.tone} title={notice.title} className="route-optimizer__notice">
          {notice.text}
        </InlineNotice>
      )}

      <Card className="route-controls">
        <div className="route-controls__field route-controls__field--day">
          <label htmlFor="route-day">{t('routeOptimizer.day')}</label>
          <select id="route-day" value={selectedDay?.id || ''} onChange={(event) => setSelectedDayId(event.target.value)}>
            {days.map((day, index) => (
              <option key={day.id} value={day.id}>
                {t('itinerary.day', { count: index + 1 })} · {formatDate(day.date, locale)}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="route-controls__modes">
          <legend>{t('routeOptimizer.travelMode')}</legend>
          <div>
            {TRAVEL_MODES.map((travelMode) => (
              <button
                key={travelMode.id}
                type="button"
                className={mode === travelMode.id ? 'route-mode route-mode--active' : 'route-mode'}
                aria-pressed={mode === travelMode.id}
                onClick={() => setMode(travelMode.id)}
              >
                <Icon name={travelMode.icon} size={18} />
                <span>{t(`routeOptimizer.modes.${travelMode.id}`)}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="route-controls__field">
          <label htmlFor="route-start">{t('routeOptimizer.startFrom')}</label>
          <select id="route-start" value={startStrategy} onChange={(event) => setStartStrategy(event.target.value)}>
            <option value="firstActivity">{t('routeOptimizer.firstActivity')}</option>
            <option value="destination" disabled={!hasValidCoordinates(trip.destinationLatitude, trip.destinationLongitude)}>{t('routeOptimizer.destination')}</option>
          </select>
        </div>

        <div className="route-controls__field">
          <label htmlFor="route-time">{t('routeOptimizer.startTime')}</label>
          <input id="route-time" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
        </div>

        <div className="route-controls__actions">
          {selectedDay?.routePlan?.previousOrder?.length > 0 && (
            <Button variant="ghost" icon="undo" onClick={restoreRoute}>{t('routeOptimizer.undo')}</Button>
          )}
          <Button icon="route" onClick={optimizeRoute} disabled={(analysis?.mappedItems.length || 0) < 2}>
            {t('routeOptimizer.optimize')}
          </Button>
        </div>
      </Card>

      <div className="route-summary-grid">
        <SummaryCard icon="pin" value={analysis?.mappedItems.length || 0} label={t('routeOptimizer.mappedStops')} />
        <SummaryCard icon="route" value={formatDistance(analysis?.totalDistanceKm || 0, locale)} label={t('routeOptimizer.estimatedDistance')} />
        <SummaryCard icon="clock" value={formatDuration(analysis?.totalTravelMinutes || 0, t)} label={t('routeOptimizer.travelTime')} />
        <SummaryCard icon="calendarDays" value={formatDuration(analysis?.totalDayMinutes || 0, t)} label={t('routeOptimizer.totalDay')} />
      </div>

      {(analysis?.warningCodes.length || 0) > 0 && (
        <div className="route-warnings">
          {analysis.warningCodes.map((code) => (
            <InlineNotice key={code} tone="warning" title={t(`routeOptimizer.warnings.${code}Title`)}>
              {t(`routeOptimizer.warnings.${code}Text`)}
            </InlineNotice>
          ))}
        </div>
      )}

      <div className="route-workspace-grid">
        <Card className="route-map-card">
          <header className="workspace-panel__header">
            <div>
              <p className="eyebrow">{t('routeOptimizer.preview')}</p>
              <h2>{selectedDay ? formatDate(selectedDay.date, locale) : ''}</h2>
            </div>
          </header>
          {mapPoints.length > 0 ? (
            <TripMap points={mapPoints} />
          ) : (
            <section className="workspace-large-empty workspace-large-empty--compact">
              <span><Icon name="map" size={28} /></span>
              <h3>{t('routeOptimizer.noMapTitle')}</h3>
              <p>{t('routeOptimizer.noMapText')}</p>
            </section>
          )}
        </Card>

        <Card className="route-segments-card">
          <header className="workspace-panel__header">
            <div>
              <p className="eyebrow">{t('routeOptimizer.routeDetails')}</p>
              <h2>{t('routeOptimizer.segments', { count: analysis?.segments.length || 0 })}</h2>
            </div>
          </header>

          {(analysis?.segments.length || 0) > 0 ? (
            <div className="route-segments">
              {analysis.segments.map((segment, index) => (
                <article key={segment.id} className="route-segment">
                  <span className="route-segment__number">{index + 1}</span>
                  <div className="route-segment__places">
                    <strong>{segment.from.title}</strong>
                    <span><Icon name="arrowRight" size={14} /> {segment.to.title}</span>
                  </div>
                  <div className="route-segment__metrics">
                    <strong>{formatDistance(segment.distanceKm, locale)}</strong>
                    <span>{formatDuration(segment.durationMinutes, t)}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="route-segments-card__empty">{t('routeOptimizer.noSegments')}</p>
          )}

          <footer className="route-estimate-note">
            <Icon name="info" size={16} />
            <p>{t('routeOptimizer.estimateDisclaimer')}</p>
          </footer>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({ icon, value, label }) {
  return (
    <Card className="route-summary-card">
      <span><Icon name={icon} size={19} /></span>
      <div><strong>{value}</strong><small>{label}</small></div>
    </Card>
  );
}

function formatDate(date, locale) {
  if (!date) return '—';
  return new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' })
    .format(new Date(`${date}T12:00:00`));
}

function formatDistance(value, locale) {
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)} km`;
}

function formatDuration(value, t) {
  const duration = formatDurationMinutes(value);
  if (duration.hours === 0) return t('routeOptimizer.minutesShort', { count: duration.minutes });
  if (duration.minutes === 0) return t('routeOptimizer.hoursShort', { count: duration.hours });
  return t('routeOptimizer.hoursMinutesShort', { hours: duration.hours, minutes: duration.minutes });
}

