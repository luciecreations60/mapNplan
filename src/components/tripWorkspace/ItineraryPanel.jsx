import { useMemo, useState } from 'react';
import { useI18n } from '../../hooks/useI18n.js';
import { createId } from '../../utils/id.js';
import { ACTIVITY_TYPES, getCategoryLabel } from '../../utils/tripWorkspace.js';
import { Button } from '../common/Button.jsx';
import { Card } from '../common/Card.jsx';
import { Icon } from '../common/Icon.jsx';

const EMPTY_FORM = Object.freeze({
  date: '', time: '09:00', type: 'map', title: '', location: '', latitude: '', longitude: '',
  durationMinutes: 60, estimatedCost: 0, notes: '',
});

export function ItineraryPanel({ trip, onUpdate }) {
  const { locale, t } = useI18n();
  const [form, setForm] = useState(() => ({ ...EMPTY_FORM, date: trip.startDate || '' }));
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const itinerary = useMemo(
    () => [...trip.itinerary].sort((left, right) => left.date.localeCompare(right.date)),
    [trip.itinerary],
  );

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function openCreateForm() {
    setEditingActivity(null);
    setForm({ ...EMPTY_FORM, date: trip.startDate || '' });
    setFormOpen(true);
  }

  function openEditForm(day, activity) {
    setEditingActivity({ dayId: day.id, activityId: activity.id });
    setForm({
      date: day.date,
      time: activity.time || '',
      type: activity.type || 'map',
      title: activity.title || '',
      location: activity.location || '',
      latitude: activity.latitude ?? '',
      longitude: activity.longitude ?? '',
      durationMinutes: activity.durationMinutes || 0,
      estimatedCost: activity.estimatedCost || 0,
      notes: activity.notes || '',
    });
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeForm() {
    setFormOpen(false);
    setEditingActivity(null);
  }

  function submitActivity(event) {
    event.preventDefault();
    if (!form.date || !form.title.trim()) return;

    const activity = {
      id: editingActivity?.activityId || createId('activity'),
      time: form.time,
      type: form.type,
      title: form.title.trim(),
      location: form.location.trim(),
      latitude: form.latitude === '' ? null : Number(form.latitude),
      longitude: form.longitude === '' ? null : Number(form.longitude),
      durationMinutes: Math.max(0, Number(form.durationMinutes) || 0),
      estimatedCost: Math.max(0, Number(form.estimatedCost) || 0),
      notes: form.notes.trim(),
    };

    let nextItinerary = trip.itinerary.map((day) => ({ ...day, items: [...day.items] }));

    if (editingActivity) {
      nextItinerary = nextItinerary
        .map((day) => day.id === editingActivity.dayId
          ? { ...day, items: day.items.filter((item) => item.id !== editingActivity.activityId) }
          : day)
        .filter((day) => day.items.length > 0);
    }

    const destinationDay = nextItinerary.find((day) => day.date === form.date);
    if (destinationDay) {
      nextItinerary = nextItinerary.map((day) => day.id === destinationDay.id
        ? { ...day, items: [...day.items, activity].sort((left, right) => left.time.localeCompare(right.time)) }
        : day);
    } else {
      nextItinerary = [...nextItinerary, { id: createId('day'), date: form.date, title: '', items: [activity] }];
    }

    onUpdate({ itinerary: nextItinerary });
    closeForm();
  }

  function removeActivity(dayId, activity) {
    if (!window.confirm(t('itinerary.deleteConfirm', { name: activity.title }))) return;
    const nextItinerary = trip.itinerary
      .map((day) => day.id === dayId ? { ...day, items: day.items.filter((item) => item.id !== activity.id) } : day)
      .filter((day) => day.items.length > 0);
    onUpdate({ itinerary: nextItinerary });
  }

  return (
    <div className="workspace-section">
      <section className="workspace-section__heading">
        <div>
          <p className="eyebrow">{t('itinerary.eyebrow')}</p>
          <h2>{t('itinerary.title')}</h2>
          <p>{t('itinerary.intro')}</p>
        </div>
        <Button icon={isFormOpen ? 'close' : 'plus'} onClick={() => (isFormOpen ? closeForm() : openCreateForm())}>
          {isFormOpen ? t('common.close') : t('itinerary.addActivity')}
        </Button>
      </section>

      {isFormOpen && (
        <Card className="workspace-form-card">
          <form className="workspace-form" onSubmit={submitActivity}>
            <div className="workspace-form__title-row">
              <div>
                <p className="eyebrow">{t(editingActivity ? 'itinerary.editEyebrow' : 'itinerary.newEyebrow')}</p>
                <h3>{t(editingActivity ? 'itinerary.editTitle' : 'itinerary.newTitle')}</h3>
              </div>
            </div>
            <div className="workspace-form__grid">
              <Field label={t('itinerary.date')}><input name="date" type="date" min={trip.startDate} max={trip.endDate} value={form.date} onChange={updateField} required /></Field>
              <Field label={t('itinerary.time')}><input name="time" type="time" value={form.time} onChange={updateField} /></Field>
              <Field label={t('itinerary.type')}>
                <select name="type" value={form.type} onChange={updateField}>
                  {ACTIVITY_TYPES.map((type) => <option key={type.id} value={type.id}>{t(type.labelKey)}</option>)}
                </select>
              </Field>
              <Field label={t('itinerary.titleLabel')} className="workspace-form__wide"><input name="title" value={form.title} onChange={updateField} placeholder={t('itinerary.titlePlaceholder')} required /></Field>
              <Field label={t('itinerary.location')} className="workspace-form__wide"><input name="location" value={form.location} onChange={updateField} placeholder={t('itinerary.locationPlaceholder')} /></Field>
              <Field label={t('common.latitude')}><input name="latitude" type="number" min="-90" max="90" step="any" value={form.latitude} onChange={updateField} placeholder="35.6762" title={t('itinerary.latitudeHelp')} /></Field>
              <Field label={t('common.longitude')}><input name="longitude" type="number" min="-180" max="180" step="any" value={form.longitude} onChange={updateField} placeholder="139.6503" title={t('itinerary.longitudeHelp')} /></Field>
              <Field label={t('itinerary.duration')}><input name="durationMinutes" type="number" min="0" step="15" value={form.durationMinutes} onChange={updateField} /></Field>
              <Field label={`${t('itinerary.estimatedCost')} (${trip.currency})`}><input name="estimatedCost" type="number" min="0" step="0.01" value={form.estimatedCost} onChange={updateField} /></Field>
              <Field label={t('itinerary.notes')} className="workspace-form__full"><textarea name="notes" rows="3" value={form.notes} onChange={updateField} placeholder={t('itinerary.notesPlaceholder')} /></Field>
            </div>
            <div className="workspace-form__actions">
              <Button variant="ghost" onClick={closeForm}>{t('common.cancel')}</Button>
              <Button type="submit" icon={editingActivity ? 'save' : 'plus'}>
                {t(editingActivity ? 'itinerary.saveChanges' : 'itinerary.add')}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {itinerary.length > 0 ? (
        <div className="itinerary-days">
          {itinerary.map((day, dayIndex) => (
            <Card key={day.id} className="itinerary-day">
              <header className="itinerary-day__header">
                <span>{t('itinerary.day', { count: dayIndex + 1 })}</span>
                <div>
                  <h3>{formatWorkspaceDate(day.date, locale, t)}</h3>
                  <p>{day.title || t(day.items.length === 1 ? 'itinerary.plannedItem' : 'itinerary.plannedItems', { count: day.items.length })}</p>
                </div>
              </header>
              <div className="itinerary-list">
                {day.items.map((item) => (
                  <article key={item.id} className="itinerary-item">
                    <time>{item.time || '—'}</time>
                    <span className={`itinerary-item__icon itinerary-item__icon--${item.type}`}><Icon name={item.type} size={18} /></span>
                    <div className="itinerary-item__content">
                      <span>{getCategoryLabel(ACTIVITY_TYPES, item.type, t)}</span>
                      <h4>{item.title}</h4>
                      {item.location && <p><Icon name="pin" size={14} /> {item.location}</p>}
                      {item.latitude !== null && item.longitude !== null && (
                        <p className="itinerary-item__coordinates"><Icon name="map" size={14} /> {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}</p>
                      )}
                      {(item.durationMinutes > 0 || item.estimatedCost > 0) && (
                        <small>
                          {item.durationMinutes > 0 && t('itinerary.minutes', { count: item.durationMinutes })}
                          {item.durationMinutes > 0 && item.estimatedCost > 0 && ' · '}
                          {item.estimatedCost > 0 && `${item.estimatedCost.toFixed(2)} ${trip.currency}`}
                        </small>
                      )}
                      {item.notes && <em>{item.notes}</em>}
                    </div>
                    <div className="item-actions">
                      <button className="icon-button icon-button--small" type="button" aria-label={`${t('common.edit')} ${item.title}`} onClick={() => openEditForm(day, item)}>
                        <Icon name="edit" size={16} />
                      </button>
                      <button className="icon-button icon-button--small" type="button" aria-label={`${t('common.delete')} ${item.title}`} onClick={() => removeActivity(day.id, item)}>
                        <Icon name="trash" size={16} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <WorkspaceEmpty icon="calendarDays" title={t('itinerary.emptyTitle')} copy={t('itinerary.emptyCopy')} action={t('itinerary.firstActivity')} onAction={openCreateForm} />
      )}
    </div>
  );
}

function Field({ label, className = '', children }) {
  return <label className={`workspace-field ${className}`.trim()}><span>{label}</span>{children}</label>;
}

function WorkspaceEmpty({ icon, title, copy, action, onAction }) {
  return (
    <section className="workspace-large-empty">
      <span><Icon name={icon} size={28} /></span><h3>{title}</h3><p>{copy}</p><Button icon="plus" onClick={onAction}>{action}</Button>
    </section>
  );
}

function formatWorkspaceDate(date, locale, t) {
  if (!date) return t('itinerary.dateToDefine');
  return new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'long', day: 'numeric' })
    .format(new Date(`${date}T12:00:00`));
}
