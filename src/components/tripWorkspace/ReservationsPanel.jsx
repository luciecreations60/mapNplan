import { useMemo, useRef, useState } from 'react';
import { useI18n } from '../../hooks/useI18n.js';
import { formatCurrency } from '../../utils/currency.js';
import { createId } from '../../utils/id.js';
import { RESERVATION_STATUSES, RESERVATION_TYPES, getCategoryLabel } from '../../utils/tripWorkspace.js';
import { appendActivityEntry, createActivityEntry, getCurrentActorName } from '../../utils/collaboration.js';
import { DiscussionThread } from '../collaboration/DiscussionThread.jsx';
import { normalizeExternalUrl } from '../../utils/url.js';
import { Badge } from '../common/Badge.jsx';
import { Button } from '../common/Button.jsx';
import { Card } from '../common/Card.jsx';
import { Icon } from '../common/Icon.jsx';
import { LocationAutocomplete } from '../common/LocationAutocomplete.jsx';

const EMPTY_FORM = Object.freeze({
  type: 'flight', title: '', provider: '', confirmationNumber: '', startDate: '', startTime: '',
  endDate: '', endTime: '', location: '', status: 'confirmed', amount: 0, url: '',
  latitude: '', longitude: '', notes: '',
});

export function ReservationsPanel({ trip, onUpdate }) {
  const { locale, t } = useI18n();
  const [form, setForm] = useState(() => ({ ...EMPTY_FORM, startDate: trip.startDate || '' }));
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const formAnchorRef = useRef(null);
  const reservations = useMemo(() => [...trip.reservations].sort(compareReservations), [trip.reservations]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function openCreateForm() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, startDate: trip.startDate || '' });
    setFormOpen(true);
  }

  function openEditForm(reservation) {
    setEditingId(reservation.id);
    setForm({
      type: reservation.type || 'flight',
      title: reservation.title || '',
      provider: reservation.provider || '',
      confirmationNumber: reservation.confirmationNumber || '',
      startDate: reservation.startDate || '',
      startTime: reservation.startTime || '',
      endDate: reservation.endDate || '',
      endTime: reservation.endTime || '',
      location: reservation.location || '',
      status: reservation.status || 'pending',
      amount: reservation.amount || 0,
      url: reservation.url || '',
      latitude: reservation.latitude ?? '',
      longitude: reservation.longitude ?? '',
      notes: reservation.notes || '',
    });
    setFormOpen(true);
    window.requestAnimationFrame(() => formAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  function closeForm() {
    setEditingId(null);
    setFormOpen(false);
  }

  function submitReservation(event) {
    event.preventDefault();
    if (!form.title.trim()) return;

    const previousReservation = trip.reservations.find((reservation) => reservation.id === editingId);
    const reservation = {
      id: editingId || createId('reservation'),
      ...form,
      title: form.title.trim(),
      provider: form.provider.trim(),
      confirmationNumber: form.confirmationNumber.trim(),
      location: form.location.trim(),
      amount: Math.max(0, Number(form.amount) || 0),
      url: normalizeExternalUrl(form.url),
      latitude: form.latitude === '' ? null : Number(form.latitude),
      longitude: form.longitude === '' ? null : Number(form.longitude),
      notes: form.notes.trim(),
      reminderMinutes: previousReservation?.reminderMinutes ?? null,
      externalCalendarUid: previousReservation?.externalCalendarUid || '',
      comments: previousReservation?.comments || [],
      createdAt: previousReservation?.createdAt || new Date().toISOString(),
    };

    const nextReservations = editingId
      ? trip.reservations.map((item) => item.id === editingId ? reservation : item)
      : [...trip.reservations, reservation];

    onUpdate({ reservations: nextReservations });
    closeForm();
  }

  function updateStatus(reservationId, status) {
    onUpdate({ reservations: trip.reservations.map((reservation) => reservation.id === reservationId ? { ...reservation, status } : reservation) });
  }

  function removeReservation(reservation) {
    if (!window.confirm(t('reservations.deleteConfirm', { name: reservation.title }))) return;
    onUpdate({ reservations: trip.reservations.filter((item) => item.id !== reservation.id) });
  }


  function addReservationComment(reservation, message) {
    const actorName = getCurrentActorName(trip);
    const comment = { id: createId('comment'), authorName: actorName, message, createdAt: new Date().toISOString() };
    const nextReservations = trip.reservations.map((item) => item.id === reservation.id
      ? { ...item, comments: [...item.comments, comment] }
      : item);
    const entry = createActivityEntry({ action: 'commentAdded', actorName, entityType: 'reservation', entityId: reservation.id, targetTitle: reservation.title });
    onUpdate({ reservations: nextReservations, collaboration: appendActivityEntry(trip.collaboration, entry) });
  }

  function removeReservationComment(reservationId, commentId) {
    onUpdate({ reservations: trip.reservations.map((reservation) => reservation.id === reservationId
      ? { ...reservation, comments: reservation.comments.filter((comment) => comment.id !== commentId) }
      : reservation) });
  }

  return (
    <div className="workspace-section">
      <section className="workspace-section__heading">
        <div>
          <p className="eyebrow">{t('reservations.eyebrow')}</p>
          <h2>{t('reservations.title')}</h2>
          <p>{t('reservations.intro')}</p>
        </div>
        <Button icon={isFormOpen ? 'close' : 'plus'} onClick={() => (isFormOpen ? closeForm() : openCreateForm())}>
          {isFormOpen ? t('common.close') : t('reservations.add')}
        </Button>
      </section>

      {isFormOpen && (
        <>
          <div ref={formAnchorRef} className="workspace-form-anchor" />
          <Card className="workspace-form-card">
          <form className="workspace-form" onSubmit={submitReservation}>
            <div className="workspace-form__title-row">
              <div>
                <p className="eyebrow">{t(editingId ? 'reservations.editEyebrow' : 'reservations.newEyebrow')}</p>
                <h3>{t(editingId ? 'reservations.editTitle' : 'reservations.newTitle')}</h3>
              </div>
            </div>
            <div className="workspace-form__grid">
              <Field label={t('reservations.type')}>
                <select name="type" value={form.type} onChange={updateField}>
                  {RESERVATION_TYPES.map((type) => <option key={type.id} value={type.id}>{t(type.labelKey)}</option>)}
                </select>
              </Field>
              <Field label={t('common.status')}>
                <select name="status" value={form.status} onChange={updateField}>
                  {RESERVATION_STATUSES.map((status) => <option key={status.id} value={status.id}>{t(status.labelKey)}</option>)}
                </select>
              </Field>
              <Field label={t('reservations.titleLabel')} className="workspace-form__wide"><input name="title" value={form.title} onChange={updateField} placeholder={t('reservations.titlePlaceholder')} required /></Field>
              <Field label={t('common.provider')}><input name="provider" value={form.provider} onChange={updateField} placeholder={t('reservations.providerPlaceholder')} /></Field>
              <Field label={t('reservations.confirmationNumber')}><input name="confirmationNumber" value={form.confirmationNumber} onChange={updateField} placeholder={t('reservations.optionalReference')} /></Field>
              <Field label={t('reservations.startDate')}><input name="startDate" type="date" value={form.startDate} onChange={updateField} /></Field>
              <Field label={t('reservations.startTime')}><input name="startTime" type="time" value={form.startTime} onChange={updateField} /></Field>
              <Field label={t('reservations.endDate')}><input name="endDate" type="date" value={form.endDate} onChange={updateField} /></Field>
              <Field label={t('reservations.endTime')}><input name="endTime" type="time" value={form.endTime} onChange={updateField} /></Field>
              <LocationAutocomplete
                id="reservation-location"
                variant="workspace"
                className="workspace-form__wide"
                label={t('common.location')}
                value={form.location}
                placeholder={t('reservations.locationPlaceholder')}
                bias={{ latitude: trip.destinationLatitude, longitude: trip.destinationLongitude }}
                hint={t('placeSearch.locationHint')}
                onValueChange={(value) => setForm((current) => ({
                  ...current, location: value, latitude: '', longitude: '',
                }))}
                onPlaceSelect={(place) => {
                  if (!place) return;
                  setForm((current) => ({
                    ...current,
                    location: place.label,
                    latitude: place.latitude,
                    longitude: place.longitude,
                  }));
                }}
              />
              <Field label={`${t('tools.amount')} (${trip.currency})`}><input name="amount" type="number" min="0" step="0.01" value={form.amount} onChange={updateField} /></Field>
              <Field label={t('reservations.bookingLink')}><input name="url" type="url" value={form.url} onChange={updateField} placeholder={t('reservations.linkPlaceholder')} /></Field>
              <Field label={t('common.latitude')}><input name="latitude" type="number" min="-90" max="90" step="any" value={form.latitude} onChange={updateField} placeholder="35.6762" /></Field>
              <Field label={t('common.longitude')}><input name="longitude" type="number" min="-180" max="180" step="any" value={form.longitude} onChange={updateField} placeholder="139.6503" /></Field>
              <Field label={t('common.notes')} className="workspace-form__full"><textarea name="notes" rows="3" value={form.notes} onChange={updateField} placeholder={t('reservations.notesPlaceholder')} /></Field>
            </div>
            <div className="workspace-form__actions">
              <Button variant="ghost" onClick={closeForm}>{t('common.cancel')}</Button>
              <Button type="submit" icon={editingId ? 'save' : 'plus'}>
                {t(editingId ? 'reservations.saveChanges' : 'reservations.save')}
              </Button>
            </div>
          </form>
          </Card>
        </>
      )}

      {reservations.length > 0 ? (
        <div className="reservation-list">
          {reservations.map((reservation) => {
            const safeUrl = normalizeExternalUrl(reservation.url);
            return (
              <Card key={reservation.id} className="reservation-card">
                <div className={`reservation-card__icon reservation-card__icon--${reservation.type}`}><Icon name={getReservationIcon(reservation.type)} size={21} /></div>
                <div className="reservation-card__content">
                  <div className="reservation-card__headline">
                    <div><small>{getCategoryLabel(RESERVATION_TYPES, reservation.type, t)}</small><h3>{reservation.title}</h3></div>
                    <Badge tone={getStatusTone(reservation.status)}>{getCategoryLabel(RESERVATION_STATUSES, reservation.status, t)}</Badge>
                  </div>
                  <div className="reservation-card__meta">
                    {(reservation.startDate || reservation.startTime) && <span><Icon name="calendarDays" size={15} /> {formatReservationDate(reservation, locale, t)}</span>}
                    {reservation.location && <span><Icon name="pin" size={15} /> {reservation.location}</span>}
                    {reservation.provider && <span><Icon name="building" size={15} /> {reservation.provider}</span>}
                    {reservation.amount > 0 && <span><Icon name="wallet" size={15} /> {formatCurrency(reservation.amount, trip.currency, locale)}</span>}
                  </div>
                  {reservation.confirmationNumber && <p className="reservation-card__reference">{t('reservations.confirmation')} <strong>{reservation.confirmationNumber}</strong></p>}
                  {reservation.notes && <p className="reservation-card__notes">{reservation.notes}</p>}
                  <DiscussionThread
                    comments={reservation.comments}
                    currentUserName={getCurrentActorName(trip)}
                    onAdd={(message) => addReservationComment(reservation, message)}
                    onRemove={(commentId) => removeReservationComment(reservation.id, commentId)}
                  />
                  <div className="reservation-card__actions">
                    <label>
                      <span className="sr-only">{t('reservations.status')}</span>
                      <select value={reservation.status} onChange={(event) => updateStatus(reservation.id, event.target.value)}>
                        {RESERVATION_STATUSES.map((status) => <option key={status.id} value={status.id}>{t(status.labelKey)}</option>)}
                      </select>
                    </label>
                    {safeUrl && <a className="text-link" href={safeUrl} target="_blank" rel="noreferrer">{t('reservations.openBooking')} <Icon name="externalLink" size={15} /></a>}
                    <button className="icon-button icon-button--small" type="button" aria-label={`${t('common.edit')} ${reservation.title}`} onClick={() => openEditForm(reservation)}><Icon name="edit" size={16} /></button>
                    <button className="icon-button icon-button--small" type="button" aria-label={`${t('common.delete')} ${reservation.title}`} onClick={() => removeReservation(reservation)}><Icon name="trash" size={16} /></button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <section className="workspace-large-empty">
          <span><Icon name="ticket" size={28} /></span>
          <h3>{t('reservations.emptyTitle')}</h3>
          <p>{t('reservations.emptyText')}</p>
          <Button icon="plus" onClick={openCreateForm}>{t('reservations.addFirst')}</Button>
        </section>
      )}
    </div>
  );
}

function Field({ label, className = '', children }) {
  return <label className={`workspace-field ${className}`.trim()}><span>{label}</span>{children}</label>;
}

function compareReservations(left, right) {
  const leftKey = `${left.startDate || '9999-12-31'}T${left.startTime || '23:59'}`;
  const rightKey = `${right.startDate || '9999-12-31'}T${right.startTime || '23:59'}`;
  return leftKey.localeCompare(rightKey);
}

function formatReservationDate(reservation, locale, t) {
  if (!reservation.startDate) return reservation.startTime || t('reservations.timeToConfirm');
  const date = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' })
    .format(new Date(`${reservation.startDate}T12:00:00`));
  return reservation.startTime ? `${date} · ${reservation.startTime}` : date;
}

function getReservationIcon(type) {
  return { flight: 'plane', accommodation: 'hotel', transport: 'car', activity: 'ticket' }[type] || 'ticket';
}

function getStatusTone(status) {
  return { confirmed: 'success', pending: 'warning', cancelled: 'neutral' }[status] || 'neutral';
}
