import { useCallback, useMemo, useState } from 'react';
import { useI18n } from '../../hooks/useI18n.js';
import { geocodingService } from '../../services/geocoding/GeocodingService.js';
import { formatLocalizedDate } from '../../utils/date.js';
import { createId } from '../../utils/id.js';
import { buildTripDateRange, combineDuration, getLastUsedItineraryDate, splitDuration, upsertActivityAcrossDates, upsertActivityInItinerary } from '../../utils/itinerary.js';
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
import { PlaceDiscoveryPanel } from './PlaceDiscoveryPanel.jsx';

function createInitialForm(trip) {
  return {
    date: getLastUsedItineraryDate(trip),
    endDate: getLastUsedItineraryDate(trip),
    time: '09:00',
    endTime: '10:00',
    type: 'map',
    title: '',
    location: '',
    durationHours: 1,
    durationRemainderMinutes: 0,
    estimatedCost: 0,
    notes: '',
  };
}

export function MapPanel({ trip, onOpenTab, onUpdate, onOpenBooking = null }) {
  const { language, locale, t } = useI18n();
  const points = useMemo(() => getTripMapPoints(trip), [trip]);
  const dates = useMemo(() => buildTripDateRange(trip.startDate, trip.endDate), [trip.startDate, trip.endDate]);
  const movablePoints = useMemo(() => points.filter((point) => point.source !== 'destination'), [points]);
  const [selection, setSelection] = useState(null);
  const [focusedPointId, setFocusedPointId] = useState(null);
  const [editingPoint, setEditingPoint] = useState(null);
  const [status, setStatus] = useState('idle');
  const [searchValue, setSearchValue] = useState('');
  const [notice, setNotice] = useState(null);
  const [discoveryPreview, setDiscoveryPreview] = useState(null);
  const [form, setForm] = useState(() => createInitialForm(trip));

  const closeEditor = useCallback(() => {
    setSelection(null);
    setEditingPoint(null);
    setStatus('idle');
  }, []);

  const selectMapPoint = useCallback(async ({ latitude, longitude }, knownPlace = null) => {
    const normalizedSelection = { latitude: Number(latitude), longitude: Number(longitude) };
    if (!Number.isFinite(normalizedSelection.latitude) || !Number.isFinite(normalizedSelection.longitude)) return;

    setEditingPoint(null);
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

  function findSourceActivity(point) {
    if (point?.source !== 'itinerary') return null;
    for (const day of trip.itinerary || []) {
      const item = (day.items || []).find((candidate) => (
        point.seriesId ? candidate.seriesId === point.seriesId : candidate.id === point.activityId
      ));
      if (item) return { day, item };
    }
    return null;
  }

  function openPointEditor(point) {
    if (!point) return;
    const sourceActivity = findSourceActivity(point);
    const item = sourceActivity?.item;
    const duration = splitDuration(item?.durationMinutes ?? point.durationMinutes ?? 0);
    setFocusedPointId(point.id);
    setEditingPoint(point);
    setSelection({ latitude: Number(point.latitude), longitude: Number(point.longitude) });
    setStatus('ready');
    setNotice(null);
    setForm({
      ...createInitialForm(trip),
      date: item?.stayStartDate || point.date || getLastUsedItineraryDate(trip),
      endDate: item?.stayEndDate || point.endDate || point.date || getLastUsedItineraryDate(trip),
      time: item?.checkInTime || item?.time || point.time || '09:00',
      endTime: item?.checkOutTime || item?.endTime || point.endTime || '10:00',
      type: item?.type || point.type || 'map',
      title: item?.title || point.title || '',
      location: item?.location || point.subtitle || '',
      durationHours: duration.hours,
      durationRemainderMinutes: duration.minutes,
      estimatedCost: Math.max(0, Number(item?.estimatedCost ?? point.estimatedCost) || 0),
      notes: item?.notes || point.notes || '',
    });
  }

  function persistSelectedPlace(event = null) {
    event?.preventDefault?.();
    if (!selection || !form.date || !form.title.trim()) return;

    const sourceActivity = findSourceActivity(editingPoint);
    const previousItem = sourceActivity?.item || null;
    const activity = {
      ...(previousItem || {}),
      id: previousItem?.id || createId('activity'),
      time: form.time,
      endTime: form.type === 'hotel' ? '' : (previousItem?.endTime || ''),
      checkInTime: form.type === 'hotel' ? form.time : '',
      checkOutTime: form.type === 'hotel' ? form.endTime : '',
      type: form.type,
      title: form.title.trim(),
      location: form.location.trim(),
      latitude: selection.latitude,
      longitude: selection.longitude,
      departureLocation: previousItem?.departureLocation || '',
      departureLatitude: previousItem?.departureLatitude ?? null,
      departureLongitude: previousItem?.departureLongitude ?? null,
      transportMode: previousItem?.transportMode || '',
      durationMinutes: form.type === 'hotel' ? 0 : combineDuration(form.durationHours, form.durationRemainderMinutes),
      estimatedCost: Math.max(0, Number(form.estimatedCost) || 0),
      notes: form.notes.trim(),
      reminderMinutes: previousItem?.reminderMinutes ?? null,
      externalCalendarUid: previousItem?.externalCalendarUid || '',
      completedAt: previousItem?.completedAt || null,
      comments: previousItem?.comments || [],
      linkedReservationId: previousItem?.linkedReservationId || null,
      seriesId: previousItem?.seriesId || null,
    };

    const previous = sourceActivity ? { dayId: sourceActivity.day.id, activityId: sourceActivity.item.id } : null;
    const endDate = form.type === 'hotel' && form.endDate && form.endDate >= form.date ? form.endDate : form.date;
    let baseItinerary = trip.itinerary;
    let effectivePrevious = previous;

    if (previousItem?.seriesId && form.type !== 'hotel') {
      baseItinerary = trip.itinerary.map((day) => ({
        ...day,
        items: (day.items || []).filter((item) => item.seriesId !== previousItem.seriesId),
        routePlan: null,
      }));
      effectivePrevious = null;
      activity.seriesId = null;
    }

    const nextItinerary = form.type === 'hotel'
      ? upsertActivityAcrossDates(baseItinerary, form.date, endDate, activity, effectivePrevious)
      : upsertActivityInItinerary(baseItinerary, form.date, activity, effectivePrevious);

    onUpdate({ itinerary: nextItinerary });
    setNotice({ tone: 'success', title: t('map.activityAddedTitle'), text: t('map.activityAddedText', { name: activity.title }) });
    setSearchValue('');
    closeEditor();
  }

  const focusExistingPoint = useCallback((point) => {
    if (!point?.id) return;
    setFocusedPointId(point.id);
    setNotice(null);
  }, []);

  function saveSelectionToPlaces() {
    if (!selection || !form.title.trim()) return;

    if (editingPoint?.source === 'savedPlace') {
      const existingPlace = (trip.savedPlaces || []).find((place) => place.id === editingPoint.savedPlaceId);
      if (!existingPlace) return;

      const updatedPlace = {
        ...existingPlace,
        name: form.title.trim(),
        label: form.location.trim(),
        latitude: selection.latitude,
        longitude: selection.longitude,
        category: activityTypeToSavedPlaceCategory(form.type, existingPlace.category),
        notes: form.notes.trim(),
        updatedAt: new Date().toISOString(),
      };

      onUpdate({
        savedPlaces: (trip.savedPlaces || []).map((place) => (
          place.id === existingPlace.id ? updatedPlace : place
        )),
      });
      setNotice({ tone: 'success', title: t('map.placeSavedTitle'), text: t('map.placeSavedText', { name: updatedPlace.name }) });
      closeEditor();
      return;
    }

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
      category: activityTypeToSavedPlaceCategory(form.type, 'other'),
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

  function deleteMappedPoint(point) {
    if (!point || point.source === 'destination') return;

    if (point.source === 'itinerary') {
      const confirmationKey = point.seriesId ? 'itinerary.deleteStaySeriesConfirm' : 'itinerary.deleteConfirm';
      if (!window.confirm(t(confirmationKey, { name: point.title }))) return;
      const itinerary = (trip.itinerary || []).map((day) => ({
        ...day,
        items: (day.items || []).filter((item) => (
          point.seriesId ? item.seriesId !== point.seriesId : item.id !== point.activityId
        )),
        routePlan: null,
      }));
      onUpdate({ itinerary, mapPointOrder: removePointFromOrder(trip.mapPointOrder, point.id) });
    } else if (point.source === 'savedPlace') {
      if (!window.confirm(t('places.deleteText', { name: point.title }))) return;
      onUpdate({
        savedPlaces: (trip.savedPlaces || []).filter((place) => place.id !== point.savedPlaceId),
        mapPointOrder: removePointFromOrder(trip.mapPointOrder, point.id),
      });
    }

    if (focusedPointId === point.id) setFocusedPointId(null);
  }

  function moveMappedPoint(point, direction) {
    if (!point || point.source === 'destination') return;
    const ids = movablePoints.map((item) => item.id);
    const configured = (Array.isArray(trip.mapPointOrder) ? trip.mapPointOrder : []).filter((id) => ids.includes(id));
    ids.forEach((id) => { if (!configured.includes(id)) configured.push(id); });
    const index = configured.indexOf(point.id);
    const target = direction === 'up' ? index - 1 : index + 1;
    if (index < 0 || target < 0 || target >= configured.length) return;
    [configured[index], configured[target]] = [configured[target], configured[index]];
    onUpdate({ mapPointOrder: configured });
  }

  function openComparison() {
    if (!form.location.trim() || !onOpenBooking) return;
    onOpenBooking({
      source: 'map',
      activityType: form.type,
      title: form.title.trim(),
      location: form.location.trim(),
      arrivalLocation: form.location.trim(),
      startDate: form.date,
      endDate: form.type === 'hotel' ? (form.endDate || form.date) : form.date,
      travelers: trip.travelers,
      currency: trip.currency,
    });
  }

  function saveDiscoveredPlace(place) {
    if (!place) return;
    const duplicate = (trip.savedPlaces || []).some((savedPlace) => (
      Math.abs(Number(savedPlace.latitude) - Number(place.latitude)) < 0.0008
      && Math.abs(Number(savedPlace.longitude) - Number(place.longitude)) < 0.0008
    ));
    if (duplicate) {
      setNotice({ tone: 'warning', title: t('map.placeAlreadySavedTitle'), text: t('map.placeAlreadySavedText') });
      return;
    }
    const savedPlace = createSavedPlace({
      name: place.name,
      label: place.label,
      latitude: place.latitude,
      longitude: place.longitude,
      category: place.savedCategory || 'other',
      list: 'ideas',
      priority: 'medium',
      status: 'idea',
      notes: '',
      tags: [],
      source: 'discovery',
    });
    onUpdate({ savedPlaces: [...(trip.savedPlaces || []), savedPlace] });
    setNotice({ tone: 'success', title: t('map.placeSavedTitle'), text: t('map.placeSavedText', { name: savedPlace.name }) });
    setFocusedPointId(`saved-place-${savedPlace.id}`);
    setDiscoveryPreview(null);
  }

  function planDiscoveredPlace(place) {
    if (!place) return;
    setDiscoveryPreview(null);
    selectMapPoint(
      { latitude: place.latitude, longitude: place.longitude },
      { name: place.name, label: place.label },
    );
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
          onValueChange={setSearchValue}
          onPlaceSelect={(place) => {
            if (!place) {
              setNotice({ tone: 'warning', title: t('map.searchNoResultTitle'), text: t('map.searchNoResultText') });
              return;
            }
            const latitude = Number(place.latitude);
            const longitude = Number(place.longitude);
            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
              setNotice({ tone: 'warning', title: t('map.searchInvalidResultTitle'), text: t('map.searchInvalidResultText') });
              return;
            }
            setNotice(null);
            setSearchValue(place.label || '');
            selectMapPoint({ latitude, longitude }, place);
          }}
        />
        <p className="map-language-note"><Icon name="globe" size={15} /> {t('map.languageNote')}</p>
      </div>

      {notice && <InlineNotice tone={notice.tone} title={notice.title}>{notice.text}</InlineNotice>}

      <PlaceDiscoveryPanel
        trip={trip}
        points={points}
        focusedPointId={focusedPointId}
        onPreview={setDiscoveryPreview}
        onSave={saveDiscoveredPlace}
        onPlan={planDiscoveredPlace}
      />

      <div className="map-marker-legend" aria-label={t('map.legend')}>
        <span><i className="map-marker-legend__dot map-marker-legend__dot--place" />{t('map.legendPlace')}</span>
        <span><i className="map-marker-legend__dot map-marker-legend__dot--hotel" />{t('map.legendAccommodation')}</span>
        <span><i className="map-marker-legend__dot map-marker-legend__dot--transport" />{t('map.legendTransport')}</span>
        <span><i className="map-marker-legend__dot map-marker-legend__dot--activity" />{t('map.legendActivity')}</span>
        <span><i className="map-marker-legend__dot map-marker-legend__dot--destination" />{t('map.legendDestination')}</span>
      </div>

      <div className="map-workspace-grid map-workspace-grid--planner">
        <Card className="map-card map-card--interactive">
          <TripMap points={points} onMapClick={selectMapPoint} onPointSelect={focusExistingPoint} selection={selection} preview={discoveryPreview} focusedPointId={focusedPointId} />
          <div className="map-card__instruction"><Icon name="pin" size={16} /> {t('map.clickToAddText')}</div>
        </Card>

        <Card className="map-place-list">
          <header className="workspace-panel__header">
            <div><p className="eyebrow">{t('map.mappedPlaces')}</p><h2>{t(points.length === 1 ? 'map.location' : 'map.locations', { count: points.length })}</h2></div>
          </header>
          {points.length > 0 ? (
            <div className="map-place-list__items">
              {points.map((point, index) => {
                const movableIndex = movablePoints.findIndex((item) => item.id === point.id);
                const canMove = point.source !== 'destination';
                return (
                  <article key={point.id} className={`map-place-row${focusedPointId === point.id ? ' map-place-row--active' : ''}`}>
                    <button type="button" className="map-place-row__main" onClick={() => focusExistingPoint(point)}>
                      <span className="map-place-row__number">{index + 1}</span>
                      <div className="map-place-row__copy">
                        <small>{point.source === 'destination' ? t('map.destination') : point.source === 'savedPlace' ? t('map.savedPlace') : t('map.itinerary')}</small>
                        <strong>{point.title}</strong>
                        <p><Icon name="pin" size={13} /> {point.subtitle || t('map.savedCoordinates')}</p>
                      </div>
                    </button>
                    <div className="map-place-row__actions">
                      <button className="icon-button icon-button--small" type="button" aria-label={t('common.edit')} title={t('common.edit')} onClick={() => openPointEditor(point)}><Icon name="edit" size={15} /></button>
                      {canMove && <button className="icon-button icon-button--small" type="button" disabled={movableIndex <= 0} aria-label={t('itinerary.moveUp', { name: point.title })} onClick={() => moveMappedPoint(point, 'up')}><Icon name="chevronUp" size={15} /></button>}
                      {canMove && <button className="icon-button icon-button--small" type="button" disabled={movableIndex < 0 || movableIndex >= movablePoints.length - 1} aria-label={t('itinerary.moveDown', { name: point.title })} onClick={() => moveMappedPoint(point, 'down')}><Icon name="chevronDown" size={15} /></button>}
                      {canMove && <button className="icon-button icon-button--small" type="button" aria-label={t('common.delete')} title={t('common.delete')} onClick={() => deleteMappedPoint(point)}><Icon name="trash" size={15} /></button>}
                    </div>
                  </article>
                );
              })}
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

      <Modal isOpen={Boolean(selection)} title={status === 'loading' ? t('map.searchingPlace') : t('map.configureActivity')} description={t('map.configureActivityDescription')} onClose={closeEditor} size="large">
        <form
          className="workspace-form map-activity-editor"
          onSubmit={(event) => {
            event.preventDefault();
            if (editingPoint?.source === 'savedPlace') saveSelectionToPlaces();
            else persistSelectedPlace(event);
          }}
        >
          <div className="map-selected-place-summary">
            <span><Icon name="pin" size={20} /></span>
            <div className="map-selected-place-summary__copy"><strong>{form.title || t('map.selectedPlaceFallback')}</strong><small>{form.location}</small></div>
          </div>
          <div className="workspace-form__grid map-activity-editor__grid">
            <label className="workspace-field workspace-form__wide"><span>{t('itinerary.titleLabel')}</span><input name="title" value={form.title} onChange={updateField} required /></label>
            <label className="workspace-field workspace-form__wide"><span>{t('common.location')}</span><textarea name="location" rows="2" value={form.location} onChange={updateField} /></label>
            <label className="workspace-field"><span>{t(form.type === 'hotel' ? 'itinerary.startDate' : 'itinerary.date')}</span><select name="date" value={form.date} onChange={updateField} required>{dates.map((date, index) => <option key={date} value={date}>{t('itinerary.day', { count: index + 1 })} · {formatLocalizedDate(date, locale, 'compact')}</option>)}</select></label>
            {form.type === 'hotel' && <label className="workspace-field"><span>{t('itinerary.endDate')}</span><select name="endDate" value={form.endDate || form.date} onChange={updateField} required>{dates.filter((date) => date >= form.date).map((date) => <option key={date} value={date}>{formatLocalizedDate(date, locale, 'compact')}</option>)}</select></label>}
            <label className="workspace-field"><span>{t(form.type === 'hotel' ? 'itinerary.checkInTime' : 'itinerary.time')}</span><input name="time" type="time" value={form.time} onChange={updateField} /></label>
            {form.type === 'hotel' && <label className="workspace-field"><span>{t('itinerary.checkOutTime')}</span><input name="endTime" type="time" value={form.endTime} onChange={updateField} /></label>}
            <label className="workspace-field"><span>{t('itinerary.type')}</span><select name="type" value={form.type} onChange={updateField}>{ACTIVITY_TYPES.map((type) => <option key={type.id} value={type.id}>{t(type.labelKey)}</option>)}</select></label>
            {form.type !== 'hotel' && (
              <fieldset className="workspace-field duration-field workspace-form__wide">
                <legend>{t('itinerary.duration')}</legend>
                <div className="duration-field__controls">
                  <label>
                    <span>{t('itinerary.hours')}</span>
                    <input name="durationHours" type="number" min="0" max="72" step="1" value={form.durationHours} onChange={updateField} />
                  </label>
                  <label>
                    <span>{t('itinerary.minutePart')}</span>
                    <input name="durationRemainderMinutes" type="number" min="0" max="59" step="1" value={form.durationRemainderMinutes} onChange={updateField} />
                  </label>
                </div>
              </fieldset>
            )}
            <label className="workspace-field"><span>{t('itinerary.estimatedCost')} ({trip.currency})</span><input name="estimatedCost" type="number" min="0" step="0.01" value={form.estimatedCost} onChange={updateField} /></label>
            <label className="workspace-field workspace-form__wide"><span>{t('itinerary.notes')}</span><textarea name="notes" rows="3" value={form.notes} onChange={updateField} /></label>
          </div>
          {selection && <small className="map-add-form__coordinates">{selection.latitude.toFixed(5)}, {selection.longitude.toFixed(5)}</small>}
          <div className="workspace-form__actions map-add-form__actions">
            <Button variant="ghost" onClick={closeEditor}>{t('common.cancel')}</Button>
            {!editingPoint && <Button type="button" variant="secondary" icon="pin" disabled={status === 'loading'} onClick={saveSelectionToPlaces}>{t('map.saveToPlaces')}</Button>}
            {form.location.trim() && onOpenBooking && <Button type="button" variant="secondary" icon="search" disabled={status === 'loading'} onClick={openComparison}>{t('affiliate.compareAll')}</Button>}
            {editingPoint?.source === 'savedPlace' ? (
              <>
                <Button type="button" variant="secondary" icon="plus" disabled={status === 'loading'} onClick={persistSelectedPlace}>{t('map.addToItinerary')}</Button>
                <Button type="submit" icon="save" disabled={status === 'loading'}>{t('itinerary.saveChanges')}</Button>
              </>
            ) : (
              <Button type="submit" icon={editingPoint?.source === 'itinerary' ? 'save' : 'plus'} disabled={status === 'loading'}>{t(editingPoint?.source === 'itinerary' ? 'itinerary.saveChanges' : 'map.addToItinerary')}</Button>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
}

function removePointFromOrder(order, pointId) {
  return (Array.isArray(order) ? order : []).filter((id) => id !== pointId);
}

function activityTypeToSavedPlaceCategory(type, fallback = 'other') {
  if (type === 'food') return 'food';
  if (type === 'hotel') return 'accommodation';
  if (type === 'car' || type === 'plane') return 'transport';
  if (type === 'ticket') return 'sight';
  return fallback || 'other';
}
