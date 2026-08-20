import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../hooks/useI18n.js';
import { placeDiscoveryService } from '../../services/discovery/PlaceDiscoveryService.js';
import { formatLocalizedDate } from '../../utils/date.js';
import { hasValidCoordinates } from '../../utils/map.js';
import { DISCOVERY_CATEGORIES, DISCOVERY_MINUTES, DISCOVERY_MINUTES_MAX, DISCOVERY_MINUTES_MIN, normalizeDiscoveryMinutes } from '../../utils/placeDiscovery.js';
import { Button } from '../common/Button.jsx';
import { Card } from '../common/Card.jsx';
import { Icon } from '../common/Icon.jsx';
import { InlineNotice } from '../feedback/InlineNotice.jsx';

export function PlaceDiscoveryPanel({
  trip,
  points,
  focusedPointId = null,
  onPreview,
  onSave,
  onPlan,
}) {
  const { language, locale, t } = useI18n();
  const abortRef = useRef(null);
  const routeDays = useMemo(() => getDiscoverableRouteDays(trip), [trip]);
  const defaultAnchorId = points.find((point) => point.source === 'destination')?.id || points[0]?.id || '';
  const [mode, setMode] = useState('around');
  const [anchorId, setAnchorId] = useState(defaultAnchorId);
  const [routeDayId, setRouteDayId] = useState(routeDays[0]?.id || '');
  const [category, setCategory] = useState('sights');
  const [maxMinutes, setMaxMinutes] = useState(10);
  const [status, setStatus] = useState('idle');
  const [results, setResults] = useState([]);
  const [timingSource, setTimingSource] = useState('road');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (focusedPointId && points.some((point) => point.id === focusedPointId)) setAnchorId(focusedPointId);
  }, [focusedPointId, points]);

  useEffect(() => {
    if (!points.some((point) => point.id === anchorId)) setAnchorId(defaultAnchorId);
  }, [anchorId, defaultAnchorId, points]);

  useEffect(() => {
    if (!routeDays.some((day) => day.id === routeDayId)) setRouteDayId(routeDays[0]?.id || '');
  }, [routeDayId, routeDays]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const selectedAnchor = points.find((point) => point.id === anchorId) || null;
  const selectedRouteDay = routeDays.find((day) => day.id === routeDayId) || null;
  const validMinutes = Number.isFinite(Number(maxMinutes)) && Number(maxMinutes) >= DISCOVERY_MINUTES_MIN && Number(maxMinutes) <= DISCOVERY_MINUTES_MAX;
  const canSearch = (mode === 'around' ? Boolean(selectedAnchor) : Boolean(selectedRouteDay)) && validMinutes;

  async function runDiscovery() {
    if (!canSearch || status === 'loading') return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus('loading');
    setError(null);
    setResults([]);
    onPreview?.(null);

    try {
      const response = mode === 'around'
        ? await placeDiscoveryService.discoverAround({
          anchor: selectedAnchor,
          category,
          maxMinutes: normalizeDiscoveryMinutes(maxMinutes),
          language,
          signal: controller.signal,
        })
        : await placeDiscoveryService.discoverAlongRoute({
          routePoints: selectedRouteDay.points,
          category,
          maxMinutes: normalizeDiscoveryMinutes(maxMinutes),
          language,
          signal: controller.signal,
        });
      if (controller.signal.aborted) return;
      setTimingSource(response.timingSource || 'road');
      setResults(response.results || []);
      setStatus('ready');
    } catch (discoveryError) {
      if (controller.signal.aborted) return;
      setError(discoveryError);
      setStatus('error');
    }
  }

  return (
    <Card className="place-discovery">
      <div className="place-discovery__heading">
        <div>
          <p className="eyebrow">{t('discovery.eyebrow')}</p>
          <h3>{t('discovery.title')}</h3>
          <p>{t('discovery.intro')}</p>
        </div>
        <Icon name="sparkles" size={24} />
      </div>

      <div className="place-discovery__mode" role="group" aria-label={t('discovery.modeLabel')}>
        <button type="button" className={mode === 'around' ? 'is-active' : ''} onClick={() => { setMode('around'); setResults([]); onPreview?.(null); }}>
          <Icon name="pin" size={16} /> {t('discovery.aroundPoint')}
        </button>
        <button type="button" className={mode === 'route' ? 'is-active' : ''} onClick={() => { setMode('route'); setResults([]); onPreview?.(null); }}>
          <Icon name="route" size={16} /> {t('discovery.alongRoute')}
        </button>
      </div>

      <div className="place-discovery__controls">
        {mode === 'around' ? (
          <label className="workspace-field place-discovery__anchor">
            <span>{t('discovery.startingPoint')}</span>
            <select value={anchorId} onChange={(event) => setAnchorId(event.target.value)} disabled={points.length === 0}>
              {points.map((point) => <option key={point.id} value={point.id}>{point.title}</option>)}
            </select>
          </label>
        ) : (
          <label className="workspace-field place-discovery__anchor">
            <span>{t('discovery.routeDay')}</span>
            <select value={routeDayId} onChange={(event) => setRouteDayId(event.target.value)} disabled={routeDays.length === 0}>
              {routeDays.map((day, index) => (
                <option key={day.id} value={day.id}>
                  {t('itinerary.day', { count: day.dayNumber })} · {formatLocalizedDate(day.date, locale, 'compact')}{day.title ? ` · ${day.title}` : ''}
                </option>
              ))}
            </select>
          </label>
        )}

        <fieldset className="place-discovery__minutes">
          <legend>{t(mode === 'around' ? 'discovery.maxDriveTime' : 'discovery.maxDetour')}</legend>
          <div className="place-discovery__minute-presets">
            {DISCOVERY_MINUTES.map((minutes) => (
              <button key={minutes} type="button" className={Number(maxMinutes) === minutes ? 'is-active' : ''} onClick={() => setMaxMinutes(minutes)}>
                {mode === 'route' ? '+' : ''}{minutes} min
              </button>
            ))}
            <label className="place-discovery__custom-minutes">
              <span>{t('discovery.customMinutes')}</span>
              <span className="place-discovery__custom-minutes-input">
                {mode === 'route' && <b aria-hidden="true">+</b>}
                <input
                  type="number"
                  inputMode="numeric"
                  min={DISCOVERY_MINUTES_MIN}
                  max={DISCOVERY_MINUTES_MAX}
                  step="1"
                  value={maxMinutes}
                  aria-label={t('discovery.customMinutesAria')}
                  onChange={(event) => setMaxMinutes(event.target.value)}
                  onBlur={() => setMaxMinutes(normalizeDiscoveryMinutes(maxMinutes))}
                />
                <span>min</span>
              </span>
            </label>
          </div>
        </fieldset>
      </div>

      <fieldset className="place-discovery__categories">
        <legend>{t('discovery.category')}</legend>
        <div>
          {DISCOVERY_CATEGORIES.map((item) => (
            <button key={item.id} type="button" className={category === item.id ? 'is-active' : ''} onClick={() => setCategory(item.id)}>
              <Icon name={item.icon} size={15} /> {t(`discovery.categories.${item.id}`)}
            </button>
          ))}
        </div>
      </fieldset>

      {mode === 'route' && routeDays.length === 0 && (
        <InlineNotice tone="info" title={t('discovery.routeUnavailableTitle')}>{t('discovery.routeUnavailableText')}</InlineNotice>
      )}

      <div className="place-discovery__search-row">
        <Button icon="search" disabled={!canSearch || status === 'loading'} onClick={runDiscovery}>
          {status === 'loading' ? t('discovery.searching') : t('discovery.search')}
        </Button>
        <small><Icon name="car" size={14} /> {t('discovery.roadTimeNote')}</small>
      </div>

      {status === 'error' && (
        <InlineNotice tone="warning" title={t('discovery.errorTitle')}>{t('discovery.errorText')}</InlineNotice>
      )}

      {status === 'ready' && results.length === 0 && (
        <div className="place-discovery__empty">
          <Icon name="search" size={22} />
          <strong>{t('discovery.noResultsTitle')}</strong>
          <span>{t('discovery.noResultsText')}</span>
        </div>
      )}

      {results.length > 0 && (
        <div className="place-discovery__results">
          <div className="place-discovery__results-heading">
            <strong>{t('discovery.results', { count: results.length })}</strong>
            {timingSource === 'estimate' && <small>{t('discovery.estimatedTiming')}</small>}
          </div>
          <div className="place-discovery__result-grid">
            {results.map((place) => {
              const alreadySaved = isSavedPlace(place, trip.savedPlaces || []);
              return (
                <article key={place.id} className="place-discovery-result">
                  <button type="button" className="place-discovery-result__main" onClick={() => onPreview?.(place)}>
                    <span className="place-discovery-result__icon"><Icon name="pin" size={17} /></span>
                    <span>
                      <strong>{place.name}</strong>
                      <small>{place.label && place.label !== place.name ? place.label : t(`discovery.categories.${place.category}`)}</small>
                    </span>
                  </button>
                  <div className="place-discovery-result__meta">
                    <span><Icon name="car" size={14} /> {formatTiming(place, mode, timingSource, t)}</span>
                    {place.roadDistanceKm !== null && place.roadDistanceKm !== undefined && <span>{place.roadDistanceKm.toLocaleString(locale, { maximumFractionDigits: 1 })} km</span>}
                  </div>
                  <div className="place-discovery-result__actions">
                    <Button variant="ghost" size="small" icon="eye" onClick={() => onPreview?.(place)}>{t('discovery.view')}</Button>
                    {place.googleMapsUrl && <a className="button button--ghost button--small place-discovery-result__google" href={place.googleMapsUrl} target="_blank" rel="noreferrer"><Icon name="externalLink" size={14} /> {t('discovery.google')}</a>}
                    <Button variant="secondary" size="small" icon={alreadySaved ? 'check' : 'pin'} disabled={alreadySaved} onClick={() => onSave?.(place)}>
                      {alreadySaved ? t('discovery.saved') : t('discovery.save')}
                    </Button>
                    <Button size="small" icon="plus" onClick={() => onPlan?.(place)}>{t('discovery.plan')}</Button>
                  </div>
                </article>
              );
            })}
          </div>
          <small className="place-discovery__provider">{t('discovery.providerNote')}</small>
        </div>
      )}
    </Card>
  );
}

function getDiscoverableRouteDays(trip) {
  return (trip?.itinerary || []).map((day, dayIndex) => ({
    ...day,
    dayNumber: dayIndex + 1,
    points: (day.items || [])
      .filter((item) => hasValidCoordinates(item.latitude, item.longitude))
      .map((item) => ({ id: item.id, title: item.title, latitude: Number(item.latitude), longitude: Number(item.longitude) })),
  })).filter((day) => day.points.length >= 2);
}

function isSavedPlace(candidate, savedPlaces) {
  return savedPlaces.some((place) => {
    const latitudeDelta = Math.abs(Number(place.latitude) - Number(candidate.latitude));
    const longitudeDelta = Math.abs(Number(place.longitude) - Number(candidate.longitude));
    return latitudeDelta < 0.0008 && longitudeDelta < 0.0008;
  });
}

function formatTiming(place, mode, timingSource, t) {
  const prefix = timingSource === 'estimate' ? '≈ ' : '';
  if (mode === 'route') return t('discovery.detourTime', { minutes: `${prefix}${place.detourMinutes}` });
  return t('discovery.driveTime', { minutes: `${prefix}${place.travelMinutes}` });
}
