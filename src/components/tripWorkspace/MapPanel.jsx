import { useCallback, useMemo, useState } from 'react';
import { useI18n } from '../../hooks/useI18n.js';
import { geocodingService } from '../../services/geocoding/GeocodingService.js';
import { formatLocalizedDate } from '../../utils/date.js';
import { createId } from '../../utils/id.js';
import { buildTripDateRange, getLastUsedItineraryDate, upsertActivityInItinerary } from '../../utils/itinerary.js';
import { getTripMapPoints } from '../../utils/map.js';
import { createSavedPlace } from '../../utils/savedPlaces.js';
import { ACTIVITY_TYPES } from '../../utils/tripWorkspace.js';
import { Button } from '../common/Button.jsx';
import { Card } from '../common/Card.jsx';
import { Icon } from '../common/Icon.jsx';
import { InlineNotice } from '../feedback/InlineNotice.jsx';
import { TripMap } from './TripMap.jsx';

export function MapPanel({ trip, onOpenTab, onUpdate }) {
  const { language, locale, t } = useI18n();
  const points = useMemo(() => getTripMapPoints(trip), [trip]);
  const dates = useMemo(() => buildTripDateRange(trip.startDate, trip.endDate), [trip.startDate, trip.endDate]);
  const [selection, setSelection] = useState(null);
  const [status, setStatus] = useState('idle');
  const [notice, setNotice] = useState(null);
  const [form, setForm] = useState({ date: getLastUsedItineraryDate(trip), time: '09:00', type: 'map', title: '', location: '' });

  const selectMapPoint = useCallback(async ({ latitude, longitude }) => {
    setSelection({ latitude, longitude });
    setStatus('loading');
    setNotice(null);
    setForm((current) => ({
      ...current,
      date: current.date || getLastUsedItineraryDate(trip),
      title: '',
      location: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
    }));
    try {
      const place = await geocodingService.reverse(latitude, longitude, { language });
      setForm((current) => ({
        ...current,
        title: place?.name || place?.primaryLabel || t('map.selectedPlaceFallback'),
        location: place?.label || current.location,
      }));
    } catch {
      setForm((current) => ({ ...current, title: t('map.selectedPlaceFallback') }));
      setNotice({ tone: 'warning', title: t('map.reverseUnavailableTitle'), text: t('map.reverseUnavailableText') });
    } finally {
      setStatus('ready');
    }
  }, [language, t, trip]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function addSelectedPlace(event) {
    event.preventDefault();
    if (!selection || !form.date || !form.title.trim()) return;
    const activity = {
      id: createId('activity'), time: form.time, type: form.type, title: form.title.trim(), location: form.location.trim(),
      latitude: selection.latitude, longitude: selection.longitude, departureLocation: '', departureLatitude: null,
      departureLongitude: null, transportMode: '', durationMinutes: 60, estimatedCost: 0, notes: '', reminderMinutes: null,
      externalCalendarUid: '', completedAt: null, comments: [], linkedReservationId: null,
    };
    onUpdate({ itinerary: upsertActivityInItinerary(trip.itinerary, form.date, activity) });
    setNotice({ tone: 'success', title: t('map.activityAddedTitle'), text: t('map.activityAddedText', { name: activity.title }) });
    setSelection(null);
    setStatus('idle');
  }

  function saveSelectionToPlaces() {
    if (!selection || !form.title.trim()) return;
    const existing = (trip.savedPlaces || []).some((place) => (
      Math.abs(Number(place.latitude) - selection.latitude) < 0.00001
      && Math.abs(Number(place.longitude) - selection.longitude) < 0.00001
    ));
    if (existing) {
      setNotice({ tone: 'warning', title: t('map.placeAlreadySavedTitle'), text: t('map.placeAlreadySavedText') });
      return;
    }
    const place = createSavedPlace({
      name: form.title.trim(),
      label: form.location.trim(),
      latitude: selection.latitude,
      longitude: selection.longitude,
      category: 'other',
      list: 'ideas',
      priority: 'medium',
      status: 'idea',
      notes: '',
      tags: [],
      source: 'map',
    });
    onUpdate({ savedPlaces: [...(trip.savedPlaces || []), place] });
    setNotice({ tone: 'success', title: t('map.placeSavedTitle'), text: t('map.placeSavedText', { name: place.name }) });
  }

  return (
    <div className="workspace-section map-planner">
      <section className="workspace-section__heading">
        <div><p className="eyebrow">{t('map.eyebrow')}</p><h2>{t('map.title')}</h2><p>{t('map.intro')}</p></div>
      </section>
      <InlineNotice tone="neutral" title={t('map.clickToAddTitle')}>{t('map.clickToAddText')}</InlineNotice>
      <p className="map-language-note"><Icon name="globe" size={15} /> {t('map.languageNote')}</p>
      {notice && <InlineNotice tone={notice.tone} title={notice.title}>{notice.text}</InlineNotice>}
      <div className="map-workspace-grid">
        <Card className="map-card map-card--interactive"><TripMap points={points} onMapClick={selectMapPoint} selection={selection} /></Card>
        <Card className="map-place-list">
          {selection ? (
            <form className="map-add-form" onSubmit={addSelectedPlace}>
              <header className="workspace-panel__header">
                <div><p className="eyebrow">{t('map.newActivity')}</p><h2>{status === 'loading' ? t('map.searchingPlace') : t('map.configureActivity')}</h2></div>
                <button className="icon-button icon-button--small" type="button" aria-label={t('common.close')} onClick={() => setSelection(null)}><Icon name="close" size={16} /></button>
              </header>
              <label className="workspace-field workspace-form__wide"><span>{t('itinerary.titleLabel')}</span><input name="title" value={form.title} onChange={updateField} required /></label>
              <label className="workspace-field workspace-form__wide"><span>{t('common.location')}</span><textarea name="location" rows="2" value={form.location} onChange={updateField} /></label>
              <div className="map-add-form__grid">
                <label className="workspace-field"><span>{t('itinerary.date')}</span><select name="date" value={form.date} onChange={updateField} required>{dates.map((date, index) => <option key={date} value={date}>{t('itinerary.day', { count: index + 1 })} · {formatLocalizedDate(date, locale, 'compact')}</option>)}</select></label>
                <label className="workspace-field"><span>{t('itinerary.time')}</span><input name="time" type="time" value={form.time} onChange={updateField} /></label>
                <label className="workspace-field workspace-form__wide"><span>{t('itinerary.type')}</span><select name="type" value={form.type} onChange={updateField}>{ACTIVITY_TYPES.map((type) => <option key={type.id} value={type.id}>{t(type.labelKey)}</option>)}</select></label>
              </div>
              <small className="map-add-form__coordinates">{selection.latitude.toFixed(5)}, {selection.longitude.toFixed(5)}</small>
              <div className="workspace-form__actions map-add-form__actions">
                <Button variant="ghost" onClick={() => setSelection(null)}>{t('common.cancel')}</Button>
                <Button type="button" variant="secondary" icon="pin" disabled={status === 'loading'} onClick={saveSelectionToPlaces}>{t('map.saveToPlaces')}</Button>
                <Button type="submit" icon="plus" disabled={status === 'loading'}>{t('map.addToItinerary')}</Button>
              </div>
            </form>
          ) : (
            <>
              <header className="workspace-panel__header"><div><p className="eyebrow">{t('map.mappedPlaces')}</p><h2>{t(points.length === 1 ? 'map.location' : 'map.locations', { count: points.length })}</h2></div></header>
              {points.length > 0 ? (
                <div className="map-place-list__items">{points.map((point, index) => <article key={point.id} className="map-place-row"><span className="map-place-row__number">{index + 1}</span><div><small>{point.source === 'reservation' ? t('map.reservation') : point.source === 'destination' ? t('map.destination') : point.source === 'savedPlace' ? t('map.savedPlace') : t('map.itinerary')}</small><strong>{point.title}</strong><p><Icon name="pin" size={13} /> {point.subtitle || t('map.savedCoordinates')}</p></div></article>)}</div>
              ) : (
                <section className="workspace-large-empty workspace-large-empty--compact"><span><Icon name="map" size={28} /></span><h3>{t('map.emptyTitle')}</h3><p>{t('map.emptyText')}</p><Button icon="plus" onClick={() => onOpenTab('itinerary')}>{t('map.addCoordinates')}</Button></section>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
