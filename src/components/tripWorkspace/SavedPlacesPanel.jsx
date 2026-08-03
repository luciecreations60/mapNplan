import { useMemo, useRef, useState } from 'react';
import { useI18n } from '../../hooks/useI18n.js';
import { formatLocalizedDate } from '../../utils/date.js';
import {
  addSavedPlaceToItinerary,
  createSavedPlace,
  DEFAULT_PLACE_LISTS,
  downloadSavedPlaces,
  getSavedPlaceLists,
  readSavedPlacesFile,
  SAVED_PLACE_CATEGORIES,
  SAVED_PLACE_PRIORITIES,
  SAVED_PLACE_STATUSES,
} from '../../utils/savedPlaces.js';
import { Button } from '../common/Button.jsx';
import { Card } from '../common/Card.jsx';
import { ConfirmDialog } from '../common/ConfirmDialog.jsx';
import { Icon } from '../common/Icon.jsx';
import { LocationAutocomplete } from '../common/LocationAutocomplete.jsx';
import { Modal } from '../common/Modal.jsx';
import { InlineNotice } from '../feedback/InlineNotice.jsx';

const EMPTY_FORM = Object.freeze({
  name: '',
  label: '',
  city: '',
  country: '',
  countryCode: '',
  latitude: null,
  longitude: null,
  category: 'sight',
  list: 'mustSee',
  priority: 'medium',
  status: 'idea',
  notes: '',
  tags: '',
  source: 'manual',
});

const CATEGORY_ICONS = {
  sight: 'pin',
  food: 'food',
  nature: 'map',
  shopping: 'trips',
  nightlife: 'sparkles',
  accommodation: 'hotel',
  transport: 'bus',
  other: 'pin',
};

export function SavedPlacesPanel({ trip, onUpdate, onOpenTab }) {
  const { locale, t } = useI18n();
  const importRef = useRef(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setFormOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [listFilter, setListFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [notice, setNotice] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [planTarget, setPlanTarget] = useState(null);
  const [planDate, setPlanDate] = useState(trip.startDate || '');
  const [planTime, setPlanTime] = useState('10:00');

  const places = trip.savedPlaces || [];
  const listOptions = useMemo(() => getSavedPlaceLists(places), [places]);
  const dateOptions = useMemo(() => {
    const dates = [
      ...getTripDateRange(trip.startDate, trip.endDate),
      ...(trip.itinerary || []).map((day) => day.date),
    ].filter(Boolean);
    return [...new Set(dates)].sort();
  }, [trip.endDate, trip.itinerary, trip.startDate]);

  const filteredPlaces = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return places
      .filter((place) => categoryFilter === 'all' || place.category === categoryFilter)
      .filter((place) => listFilter === 'all' || place.list === listFilter)
      .filter((place) => statusFilter === 'all' || place.status === statusFilter)
      .filter((place) => {
        if (!normalizedQuery) return true;
        return [place.name, place.label, place.city, place.country, place.notes, ...(place.tags || [])]
          .some((value) => String(value || '').toLocaleLowerCase().includes(normalizedQuery));
      })
      .sort((left, right) => {
        const priority = { high: 0, medium: 1, low: 2 };
        return (priority[left.priority] - priority[right.priority])
          || left.name.localeCompare(right.name);
      });
  }, [categoryFilter, listFilter, places, query, statusFilter]);

  const counts = useMemo(() => ({
    total: places.length,
    planned: places.filter((place) => place.status === 'planned').length,
    visited: places.filter((place) => place.status === 'visited').length,
    mapped: places.filter((place) => Number.isFinite(Number(place.latitude)) && Number.isFinite(Number(place.longitude))).length,
  }), [places]);

  function listLabel(list) {
    return DEFAULT_PLACE_LISTS.includes(list) ? t(`places.lists.${list}`) : list;
  }

  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function changeLocationValue(value) {
    setForm((current) => ({
      ...current,
      label: value,
      latitude: value === current.label ? current.latitude : null,
      longitude: value === current.label ? current.longitude : null,
      city: value === current.label ? current.city : '',
      country: value === current.label ? current.country : '',
      countryCode: value === current.label ? current.countryCode : '',
      source: value === current.label ? current.source : 'manual',
    }));
  }

  function selectLocation(place) {
    if (!place) {
      setForm((current) => ({
        ...current,
        latitude: null,
        longitude: null,
        city: '',
        country: '',
        countryCode: '',
        source: 'manual',
      }));
      return;
    }

    setForm((current) => ({
      ...current,
      name: current.name || place.name,
      label: place.label,
      city: place.city,
      country: place.country,
      countryCode: place.countryCode,
      latitude: place.latitude,
      longitude: place.longitude,
      source: place.source,
    }));
  }

  function resetForm() {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setFormOpen(false);
  }

  function openCreateForm() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setFormOpen(true);
  }

  function savePlace(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.label.trim()) return;

    const existing = places.find((place) => place.id === editingId);
    const savedPlace = createSavedPlace({
      ...existing,
      ...form,
      id: editingId || undefined,
      updatedAt: new Date().toISOString(),
      visitedAt: form.status === 'visited' ? (existing?.visitedAt || new Date().toISOString()) : null,
    });
    const nextPlaces = editingId
      ? places.map((place) => place.id === editingId ? savedPlace : place)
      : [...places, savedPlace];

    onUpdate({ savedPlaces: nextPlaces });
    setNotice({
      tone: 'success',
      title: t(editingId ? 'places.updatedTitle' : 'places.savedTitle'),
      message: t(editingId ? 'places.updatedText' : 'places.savedText', { name: savedPlace.name }),
    });
    resetForm();
  }

  function editPlace(place) {
    setEditingId(place.id);
    setForm({ ...place, tags: (place.tags || []).join(', ') });
    setFormOpen(true);
  }

  function changeStatus(place, status) {
    onUpdate({
      savedPlaces: places.map((item) => item.id === place.id
        ? {
            ...item,
            status,
            visitedAt: status === 'visited' ? (item.visitedAt || new Date().toISOString()) : null,
            updatedAt: new Date().toISOString(),
          }
        : item),
    });
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    onUpdate({ savedPlaces: places.filter((place) => place.id !== deleteTarget.id) });
    setDeleteTarget(null);
  }

  function openPlanDialog(place) {
    setPlanTarget(place);
    setPlanDate(dateOptions[0] || trip.startDate || '');
    setPlanTime('10:00');
  }

  function addToItinerary(event) {
    event.preventDefault();
    if (!planTarget || !planDate) return;

    const { itinerary } = addSavedPlaceToItinerary(trip, planTarget, {
      date: planDate,
      time: planTime,
    });
    const savedPlaces = places.map((place) => place.id === planTarget.id
      ? { ...place, status: 'planned', updatedAt: new Date().toISOString() }
      : place);
    onUpdate({ itinerary, savedPlaces });
    setNotice({
      tone: 'success',
      title: t('places.plannedTitle'),
      message: t('places.plannedText', { name: planTarget.name }),
    });
    setPlanTarget(null);
  }

  async function importPlaces(event) {
    const [file] = event.target.files || [];
    event.target.value = '';
    if (!file) return;

    try {
      const imported = await readSavedPlacesFile(file);
      const fingerprints = new Set(places.map((place) => `${place.name.toLocaleLowerCase()}|${place.latitude}|${place.longitude}`));
      const unique = imported.filter((place) => {
        const fingerprint = `${place.name.toLocaleLowerCase()}|${place.latitude}|${place.longitude}`;
        if (fingerprints.has(fingerprint)) return false;
        fingerprints.add(fingerprint);
        return true;
      });
      onUpdate({ savedPlaces: [...places, ...unique] });
      setNotice({ tone: 'success', title: t('places.importedTitle'), message: t('places.importedText', { count: unique.length }) });
    } catch {
      setNotice({ tone: 'danger', title: t('places.importFailedTitle'), message: t('places.importFailedText') });
    }
  }

  return (
    <div className="workspace-section saved-places-panel">
      <section className="workspace-section__heading saved-places-heading">
        <div>
          <p className="eyebrow">{t('places.eyebrow')}</p>
          <h2>{t('places.title')}</h2>
          <p>{t('places.intro')}</p>
        </div>
        <div className="saved-places-heading__actions">
          <Button icon="plus" onClick={openCreateForm}>{t('places.newAction')}</Button>
          <input ref={importRef} className="sr-only" type="file" accept="application/json,.json" onChange={importPlaces} />
          <Button variant="secondary" icon="upload" onClick={() => importRef.current?.click()}>{t('places.import')}</Button>
          <Button variant="secondary" icon="download" disabled={places.length === 0} onClick={() => downloadSavedPlaces(trip)}>{t('places.export')}</Button>
        </div>
      </section>

      {notice && <InlineNotice tone={notice.tone} title={notice.title}>{notice.message}</InlineNotice>}

      <div className="saved-places-summary" aria-label={t('places.summaryAria')}>
        {[
          ['pin', counts.total, t('places.total')],
          ['calendarDays', counts.planned, t('places.planned')],
          ['checkCircle', counts.visited, t('places.visited')],
          ['map', counts.mapped, t('places.mapped')],
        ].map(([icon, value, label]) => (
          <Card key={label} className="saved-places-stat">
            <span><Icon name={icon} size={20} /></span>
            <div><strong>{value}</strong><small>{label}</small></div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={isFormOpen}
        title={t(editingId ? 'places.editTitle' : 'places.newTitle')}
        description={t(editingId ? 'places.editModalText' : 'places.newModalText')}
        onClose={resetForm}
      >
        <form className="workspace-form saved-place-modal-form" onSubmit={savePlace}>
          <div className="workspace-form__grid">
            <label className="workspace-field workspace-form__wide">
              <span>{t('places.name')}</span>
              <input required value={form.name} placeholder={t('places.namePlaceholder')} onChange={(event) => updateForm('name', event.target.value)} />
            </label>
            <LocationAutocomplete
              variant="workspace"
              className="workspace-form__wide"
              label={t('places.location')}
              value={form.label}
              required
              placeholder={t('places.locationPlaceholder')}
              bias={{ latitude: trip.destinationLatitude, longitude: trip.destinationLongitude }}
              countryCode={trip.countryCode}
              onValueChange={changeLocationValue}
              onPlaceSelect={selectLocation}
            />
            <label className="workspace-field">
              <span>{t('places.category')}</span>
              <select value={form.category} onChange={(event) => updateForm('category', event.target.value)}>
                {SAVED_PLACE_CATEGORIES.map((category) => <option key={category} value={category}>{t(`places.categories.${category}`)}</option>)}
              </select>
            </label>
            <label className="workspace-field">
              <span>{t('places.list')}</span>
              <input list="saved-place-lists" value={form.list} onChange={(event) => updateForm('list', event.target.value)} />
              <datalist id="saved-place-lists">
                {listOptions.map((list) => <option key={list} value={list}>{listLabel(list)}</option>)}
              </datalist>
            </label>
            <label className="workspace-field">
              <span>{t('places.priority')}</span>
              <select value={form.priority} onChange={(event) => updateForm('priority', event.target.value)}>
                {SAVED_PLACE_PRIORITIES.map((priority) => <option key={priority} value={priority}>{t(`places.priorities.${priority}`)}</option>)}
              </select>
            </label>
            <label className="workspace-field">
              <span>{t('places.status')}</span>
              <select value={form.status} onChange={(event) => updateForm('status', event.target.value)}>
                {SAVED_PLACE_STATUSES.map((status) => <option key={status} value={status}>{t(`places.statuses.${status}`)}</option>)}
              </select>
            </label>
            <label className="workspace-field workspace-form__wide">
              <span>{t('places.tags')}</span>
              <input value={form.tags} placeholder={t('places.tagsPlaceholder')} onChange={(event) => updateForm('tags', event.target.value)} />
            </label>
            <label className="workspace-field workspace-form__full">
              <span>{t('places.notes')}</span>
              <textarea rows="3" value={form.notes} placeholder={t('places.notesPlaceholder')} onChange={(event) => updateForm('notes', event.target.value)} />
            </label>
          </div>
          <div className="workspace-form__actions">
            <Button variant="ghost" onClick={resetForm}>{t('common.cancel')}</Button>
            <Button type="submit" icon="save">{t(editingId ? 'places.saveChanges' : 'places.savePlace')}</Button>
          </div>
        </form>
      </Modal>

      <Card className="saved-places-filters">
        <label className="saved-places-filter saved-places-filter--search">
          <Icon name="search" size={17} />
          <input value={query} placeholder={t('places.searchPlaceholder')} aria-label={t('places.searchPlaceholder')} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <select aria-label={t('places.filterCategory')} value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
          <option value="all">{t('places.allCategories')}</option>
          {SAVED_PLACE_CATEGORIES.map((category) => <option key={category} value={category}>{t(`places.categories.${category}`)}</option>)}
        </select>
        <select aria-label={t('places.filterList')} value={listFilter} onChange={(event) => setListFilter(event.target.value)}>
          <option value="all">{t('places.allLists')}</option>
          {listOptions.map((list) => <option key={list} value={list}>{listLabel(list)}</option>)}
        </select>
        <select aria-label={t('places.filterStatus')} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">{t('places.allStatuses')}</option>
          {SAVED_PLACE_STATUSES.map((status) => <option key={status} value={status}>{t(`places.statuses.${status}`)}</option>)}
        </select>
      </Card>

      {filteredPlaces.length > 0 ? (
        <div className="saved-places-grid">
          {filteredPlaces.map((place) => (
            <Card key={place.id} className={`saved-place-card saved-place-card--${place.priority}`}>
              <header className="saved-place-card__header">
                <span className="saved-place-card__icon"><Icon name={CATEGORY_ICONS[place.category]} size={21} /></span>
                <div>
                  <div className="saved-place-card__badges">
                    <span>{t(`places.categories.${place.category}`)}</span>
                    <span>{t(`places.statuses.${place.status}`)}</span>
                    <span>{t(`places.priorities.${place.priority}`)}</span>
                  </div>
                  <h3>{place.name}</h3>
                  <p>{place.label || [place.city, place.country].filter(Boolean).join(', ')}</p>
                </div>
              </header>
              <div className="saved-place-card__meta">
                <span><Icon name="folder" size={14} /> {listLabel(place.list)}</span>
                {place.tags.length > 0 && <span><Icon name="sparkles" size={14} /> {place.tags.join(' · ')}</span>}
              </div>
              {place.notes && <p className="saved-place-card__notes">{place.notes}</p>}
              <footer className="saved-place-card__actions">
                <Button size="small" icon="calendarDays" onClick={() => openPlanDialog(place)}>{t('places.addToItinerary')}</Button>
                <button className="icon-button icon-button--small" type="button" aria-label={t('places.editAria', { name: place.name })} title={t('places.editTooltip')} onClick={() => editPlace(place)}><Icon name="edit" size={15} /></button>
                <button className="icon-button icon-button--small" type="button" aria-label={t('places.markVisitedAria', { name: place.name })} title={t(place.status === 'visited' ? 'places.markIdeaTooltip' : 'places.markVisitedTooltip')} onClick={() => changeStatus(place, place.status === 'visited' ? 'idea' : 'visited')}><Icon name={place.status === 'visited' ? 'undo' : 'check'} size={15} /></button>
                <button className="icon-button icon-button--small" type="button" aria-label={t('places.deleteAria', { name: place.name })} title={t('places.deleteTooltip')} onClick={() => setDeleteTarget(place)}><Icon name="trash" size={15} /></button>
              </footer>
            </Card>
          ))}
        </div>
      ) : (
        <section className="workspace-large-empty">
          <span><Icon name="pin" size={28} /></span>
          <h3>{places.length === 0 ? t('places.emptyTitle') : t('places.noMatchTitle')}</h3>
          <p>{places.length === 0 ? t('places.emptyText') : t('places.noMatchText')}</p>
        </section>
      )}

      <Modal isOpen={Boolean(planTarget)} title={t('places.planTitle')} description={planTarget ? t('places.planText', { name: planTarget.name }) : ''} onClose={() => setPlanTarget(null)}>
        <form className="workspace-form" onSubmit={addToItinerary}>
          <div className="workspace-form__grid">
            <label className="workspace-field workspace-form__wide">
              <span>{t('places.planDate')}</span>
              <select required value={planDate} onChange={(event) => setPlanDate(event.target.value)}>
                {dateOptions.map((date) => <option key={date} value={date}>{formatLocalizedDate(date, locale, 'compact')}</option>)}
                {dateOptions.length === 0 && <option value="">{t('places.noDates')}</option>}
              </select>
            </label>
            <label className="workspace-field workspace-form__wide">
              <span>{t('places.planTime')}</span>
              <input type="time" value={planTime} onChange={(event) => setPlanTime(event.target.value)} />
            </label>
          </div>
          <footer className="modal__footer modal__footer--standalone">
            <Button variant="ghost" onClick={() => setPlanTarget(null)}>{t('common.cancel')}</Button>
            <Button type="submit" icon="calendarDays" disabled={!planDate}>{t('places.addToItinerary')}</Button>
          </footer>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title={t('places.deleteTitle')}
        description={deleteTarget ? t('places.deleteText', { name: deleteTarget.name }) : ''}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}


function getTripDateRange(startDate, endDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(startDate || ''))) return [];
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = /^\d{4}-\d{2}-\d{2}$/.test(String(endDate || ''))
    ? new Date(`${endDate}T00:00:00.000Z`)
    : start;
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return [startDate];

  const dates = [];
  const cursor = new Date(start);
  while (cursor <= end && dates.length < 366) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}
