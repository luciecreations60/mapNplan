import { useCallback, useMemo, useState } from 'react';
import { useI18n } from '../../hooks/useI18n.js';
import { geocodingService } from '../../services/geocoding/GeocodingService.js';
import { formatLocalizedDate } from '../../utils/date.js';
import { createId } from '../../utils/id.js';
import { buildTripDateRange, getLastUsedItineraryDate, upsertActivityAcrossDates, upsertActivityInItinerary } from '../../utils/itinerary.js';
import { getTripMapPoints } from '../../utils/map.js';
import { createSavedPlace } from '../../utils/savedPlaces.js';
import { ACTIVITY_TYPES } from '../../utils/tripWorkspace.js';
import { Button } from '../common/Button.jsx';
import { Card } from '../common/Card.jsx';
import { Icon } from '../common/Icon.jsx';
import { InlineNotice } from '../feedback/InlineNotice.jsx';
import { LocationAutocomplete } from '../common/LocationAutocomplete.jsx';
import { Modal } from '../common/Modal.jsx';
import { TripMap } from './TripMap.jsx';

function createInitialForm(trip) {
  return {
    date: getLastUsedItineraryDate(trip),
    endDate: getLastUsedItineraryDate(trip),
    time: '09:00',
    type: 'map',
    title: '',
    location: '',
    durationMinutes: 60,
    estimatedCost: 0,
    notes: '',
  };
}

export function MapPanel({ trip, onOpenTab, onUpdate }) {
  const { language, locale, t } = useI18n();
  const points = useMemo(() => getTripMapPoints(trip), [trip]);
  const dates = useMemo(() => buildTripDateRange(trip.startDate, trip.endDate), [trip.startDate, trip.endDate]);
  const [selection, setSelection] = useState(null);
  const [status, setStatus] = useState('idle');
  const [searchValue, setSearchValue] = useState('');
  const [notice, setNotice] = useState(null);
  const [form, setForm] = useState(() => createInitialForm(trip));

  const closeEditor = useCallback(() => {
    setSelection(null);
    setStatus('idle');
  }, []);

  const selectMapPoint = useCallback(async ({ latitude, longitude }, knownPlace = null) => {
    const normalizedSelection = { latitude: Number(latitude), longitude: Number(longitude) };
    if (!Number.isFinite(normalizedSelection.latitude) || !Number.isFinite(normalizedSelection.longitude)) return;

    setSelection(normalizedSelection);
    setNotice(null);
    setForm((current) => ({
      ...createInitialForm(trip),
      date: current.date || getLastUsedItineraryDate(trip),
      title: knownPlace?.title || knownPlace?.name || '',
      location: knownPlace?.subtitle || knownPlace?.label || `${normalizedSelection.latitude.toFixed(5)}, ${normalizedSelection.longitude.toFixed(5)}`,
    }));

    if (knownPlace?.title || knownPlace?.name) {
      setStatus('ready');
      return;
    }

    setStatus('loading');
    try {
      const place = await geocodingService.reverse(normalizedSelection.latitude, normalizedSelection.longitude, { language });
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
    setForm((current) => {
      const patch = { [name]: value };
      if (name === 'date' && current.type === 'hotel' && (!current.endDate || current.endDate < value)) patch.endDate = value;
      if (name === 'type' && value === 'hotel' && (!current.endDate || current.endDate < current.date)) patch.endDate = current.date;
      return { ...current, ...patch };
    });
  }

  function addSelectedPlace(event) {
    event.preventDefault();
    if (!selection || !form.date || !form.title.trim()) return;
    const activity = {
      id: createId('activity'),
      time: form.time,
      type: form.type,
      title: form.title.trim(),
      location: form.location.trim(),
      latitude: selection.latitude,
      longitude: selection.longitude,
      departureLocation: '',
      departureLatitude: null,
      departureLongitude: null,
      transportMode: '',
      durationMinutes: Math.max(0, Number(form.durationMinutes) || 0),
      estimatedCost: Math.max(0, Number(form.estimatedCost) || 0),
      notes: form.notes.trim(),
      reminderMinutes: null,
      externalCalendarUid: '',
      completedAt: null,
      comments: [],
      linkedReservationId: null,
    };
    const nextItinerary = form.type === 'hotel'
      ? upsertActivityAcrossDates(trip.itinerary, form.date, form.endDate && form.endDate >= form.date ? form.endDate : form.date, activity)
      : upsertActivityInItinerary(trip.itinerary, form.date, activity);
    onUpdate({ itinerary: nextItinerary });
    setNotice({ tone: 'success', title: t('map.activityAddedTitle'), text: t('map.activityAddedText', { name: activity.title }) });
    setSearchValue('');
    closeEditor();
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
      notes: form.notes.trim(),
      tags: [],
      source: 'map',
    });
    onUpdate({ savedPlaces: [...(trip.savedPlaces || []), place] });
    setNotice({ tone: 'success', title: t('map.placeSavedTitle'), text: t('map.placeSavedText', { name: place.name }) });
    closeEditor();
  }

  return (
    <div className="workspace-section map-planner">
      <section className="workspace-section__heading map-planner__heading">
        <div><p className="eyebrow">{t('map.eyebrow')}</p><h2>{t('map.title')}</h2><p>{t('map.intro')}</p></div>
      </section>

      <div className="map-search-card">
        <LocationAutocomplete
          id="map-place-search"
          label={t('map.searchLabel')}
          value={searchValue}
          placeholder={t('map.searchPlaceholder')}
          hint={t('map.searchHint')}
          variant="workspace"
          bias={{ latitude: trip.destinationLatitude, longitude: trip.destinationLongitude }}
          onValueChange={setSearchValue}
          onPlaceSelect={(place) => {
            if (!place) return;
            setSearchValue(place.label);
            selectMapPoint({ latitude: place.latitude, longitude: place.longitude }, place);
          }}
        />
        <p className="map-language-note"><Icon name="globe" size={15} /> {t('map.languageNote')}</p>
      </div>

      {notice && <InlineNotice tone={notice.tone} title={notice.title}>{notice.text}</InlineNotice>}

      <div className="map-workspace-grid map-workspace-grid--planner">
        <Card className="map-card map-card--interactive">
          <TripMap
            points={points}
            onMapClick={selectMapPoint}
            onPointSelect={(point) => selectMapPoint({ latitude: point.latitude, longitude: point.longitude }, point)}
            selection={selection}
          />
          <div className="map-card__instruction"><Icon name="pin" size={16} /> {t('map.clickToAddText')}</div>
        </Card>

        <Card className="map-place-list">
          <header className="workspace-panel__header">
            <div><p className="eyebrow">{t('map.mappedPlaces')}</p><h2>{t(points.length === 1 ? 'map.location' : 'map.locations', { count: points.length })}</h2></div>
          </header>
          {points.length > 0 ? (
            <div className="map-place-list__items">
              {points.map((point, index) => (
                <button
                  key={point.id}
                  type="button"
                  className="map-place-row map-place-row--button"
                  onClick={() => selectMapPoint({ latitude: point.latitude, longitude: point.longitude }, point)}
                >
                  <span className="map-place-row__number">{index + 1}</span>
                  <div>
                    <small>{point.source === 'reservation' ? t('map.reservation') : point.source === 'destination' ? t('map.destination') : point.source === 'savedPlace' ? t('map.savedPlace') : t('map.itinerary')}</small>
                    <strong>{point.title}</strong>
                    <p><Icon name="pin" size={13} /> {point.subtitle || t('map.savedCoordinates')}</p>
                  </div>
                  <Icon name="search" size={16} />
                </button>
              ))}
            </div>
          ) : (
            <section className="workspace-large-empty workspace-large-empty--compact">
              <span><Icon name="map" size={28} /></span>
              <h3>{t('map.emptyTitle')}</h3>
              <p>{t('map.emptyText')}</p>
              <Button icon="plus" onClick={() => onOpenTab('itinerary')}>{t('map.addCoordinates')}</Button>
            </section>
          )}
        </Card>
      </div>

      <Modal
        isOpen={Boolean(selection)}
        title={status === 'loading' ? t('map.searchingPlace') : t('map.configureActivity')}
        description={t('map.configureActivityDescription')}
        onClose={closeEditor}
      >
        <form className="workspace-form map-activity-editor" onSubmit={addSelectedPlace}>
          <div className="map-selected-place-summary">
            <span><Icon name="pin" size={20} /></span>
            <div><strong>{form.title || t('map.selectedPlaceFallback')}</strong><small>{form.location}</small></div>
          </div>
          <div className="workspace-form__grid">
            <label className="workspace-field workspace-form__wide"><span>{t('itinerary.titleLabel')}</span><input name="title" value={form.title} onChange={updateField} required /></label>
            <label className="workspace-field workspace-form__wide"><span>{t('common.location')}</span><textarea name="location" rows="2" value={form.location} onChange={updateField} /></label>
            <label className="workspace-field"><span>{t(form.type === 'hotel' ? 'itinerary.startDate' : 'itinerary.date')}</span><select name="date" value={form.date} onChange={updateField} required>{dates.map((date, index) => <option key={date} value={date}>{t('itinerary.day', { count: index + 1 })} · {formatLocalizedDate(date, locale, 'compact')}</option>)}</select></label>
            {form.type === 'hotel' && <label className="workspace-field"><span>{t('itinerary.endDate')}</span><select name="endDate" value={form.endDate || form.date} onChange={updateField} required>{dates.filter((date) => date >= form.date).map((date, index) => <option key={date} value={date}>{formatLocalizedDate(date, locale, 'compact')}</option>)}</select></label>}
            <label className="workspace-field"><span>{t('itinerary.time')}</span><input name="time" type="time" value={form.time} onChange={updateField} /></label>
            <label className="workspace-field"><span>{t('itinerary.type')}</span><select name="type" value={form.type} onChange={updateField}>{ACTIVITY_TYPES.map((type) => <option key={type.id} value={type.id}>{t(type.labelKey)}</option>)}</select></label>
            <label className="workspace-field"><span>{t('itinerary.duration')}</span><input name="durationMinutes" type="number" min="0" step="15" value={form.durationMinutes} onChange={updateField} /></label>
            <label className="workspace-field"><span>{t('itinerary.estimatedCost')} ({trip.currency})</span><input name="estimatedCost" type="number" min="0" step="0.01" value={form.estimatedCost} onChange={updateField} /></label>
            <label className="workspace-field workspace-form__wide"><span>{t('itinerary.notes')}</span><textarea name="notes" rows="3" value={form.notes} onChange={updateField} /></label>
          </div>
          {selection && <small className="map-add-form__coordinates">{selection.latitude.toFixed(5)}, {selection.longitude.toFixed(5)}</small>}
          <div className="workspace-form__actions map-add-form__actions">
            <Button variant="ghost" onClick={closeEditor}>{t('common.cancel')}</Button>
            <Button type="button" variant="secondary" icon="pin" disabled={status === 'loading'} onClick={saveSelectionToPlaces}>{t('map.saveToPlaces')}</Button>
            <Button type="submit" icon="plus" disabled={status === 'loading'}>{t('map.addToItinerary')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
