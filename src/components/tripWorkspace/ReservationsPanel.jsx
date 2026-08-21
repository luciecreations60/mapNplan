import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../hooks/useI18n.js';
import { useMailProvider } from '../../hooks/useMailProvider.js';
import { buildMailLink } from '../../utils/mailLink.js';
import { attachmentStorageService } from '../../services/storage/AttachmentStorageService.js';
import { formatCurrency } from '../../utils/currency.js';
import { formatLocalizedDate, formatLocalizedTime } from '../../utils/date.js';
import { upsertActivityAcrossDates, upsertActivityInItinerary } from '../../utils/itinerary.js';
import { mapReservationTypeToActivityType, mapReservationTypeToExpenseCategory } from '../../utils/reservationImport.js';
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
import { InlineNotice } from '../feedback/InlineNotice.jsx';
import { ReservationImportDialog } from './ReservationImportDialog.jsx';

const EMPTY_FORM = Object.freeze({
  type: 'flight', title: '', provider: '', confirmationNumber: '', startDate: '', startTime: '',
  endDate: '', endTime: '', location: '', status: 'confirmed', amount: '0.00', url: '', emailUrl: '',
  latitude: '', longitude: '', notes: '', sourceActivityId: null, sourceActivitySeriesId: null,
});

export function ReservationsPanel({ trip, onUpdate, onOpenDocument = null, focusedReservationId = null }) {
  const { locale, t } = useI18n();
  const { mailProvider } = useMailProvider();
  const [form, setForm] = useState(() => ({ ...EMPTY_FORM, startDate: trip.startDate || '' }));
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isImportOpen, setImportOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [isSaving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const fileInputRef = useRef(null);

  const reservations = useMemo(() => [...trip.reservations].sort(compareReservations), [trip.reservations]);

  useEffect(() => {
    if (!focusedReservationId) return undefined;
    setQuery('');
    const timeoutId = window.setTimeout(() => {
      const card = document.getElementById(`reservation-${focusedReservationId}`);
      if (!card) return;
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.focus({ preventScroll: true });
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [focusedReservationId, reservations]);
  const filteredReservations = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase(locale);
    if (!normalized) return reservations;
    return reservations.filter((reservation) => [
      reservation.title,
      reservation.provider,
      reservation.confirmationNumber,
      reservation.location,
      reservation.startDate,
      reservation.endDate,
      getCategoryLabel(RESERVATION_TYPES, reservation.type, t),
    ].some((value) => String(value || '').toLocaleLowerCase(locale).includes(normalized)));
  }, [locale, query, reservations, t]);

  const documentsByReservation = useMemo(() => {
    const grouped = new Map();
    for (const document of trip.documents || []) {
      if (!document.linkedReservationId) continue;
      grouped.set(document.linkedReservationId, [...(grouped.get(document.linkedReservationId) || []), document]);
    }
    return grouped;
  }, [trip.documents]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function resetEditor() {
    setEditingId(null);
    setCreateOpen(false);
    setSelectedFiles([]);
    setForm({ ...EMPTY_FORM, startDate: trip.startDate || '' });
  }

  function openCreateForm() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, startDate: trip.startDate || '' });
    setSelectedFiles([]);
    setFeedback(null);
    setCreateOpen(true);
  }

  function openEditForm(reservation) {
    setCreateOpen(false);
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
      amount: Number(reservation.amount || 0).toFixed(2),
      url: reservation.url || '',
      emailUrl: reservation.emailUrl || '',
      latitude: reservation.latitude ?? '',
      longitude: reservation.longitude ?? '',
      notes: reservation.notes || '',
      sourceActivityId: reservation.sourceActivityId || null,
      sourceActivitySeriesId: reservation.sourceActivitySeriesId || null,
    });
    setSelectedFiles([]);
    setFeedback(null);
  }

  function chooseFiles(event) {
    const files = [...(event.target.files || [])].slice(0, 5);
    event.target.value = '';
    try {
      files.forEach((file) => attachmentStorageService.validateFile(file));
      setSelectedFiles(files);
      setFeedback(null);
    } catch (error) {
      setSelectedFiles([]);
      setFeedback({ tone: 'danger', title: t('reservations.documentErrorTitle'), message: error.message });
    }
  }

  async function submitReservation(event) {
    event.preventDefault();
    if (!form.title.trim() || isSaving) return;

    setSaving(true);
    setFeedback(null);
    const previousReservation = trip.reservations.find((reservation) => reservation.id === editingId);
    const linkedSource = previousReservation ? findLinkedItinerarySource(trip.itinerary, previousReservation) : null;
    const nextActivityType = mapReservationTypeToActivityType(form.type);
    let sourceActivityId = previousReservation?.sourceActivityId || form.sourceActivityId || null;
    let sourceActivitySeriesId = previousReservation?.sourceActivitySeriesId || form.sourceActivitySeriesId || null;

    if (linkedSource) {
      if (nextActivityType === 'hotel') {
        sourceActivitySeriesId = linkedSource.item.seriesId || sourceActivitySeriesId || createId('activity-series');
        sourceActivityId = null;
      } else {
        sourceActivityId = linkedSource.item.id || sourceActivityId || createId('activity');
        sourceActivitySeriesId = null;
      }
    }

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
      sourceActivityId,
      sourceActivitySeriesId,
      sourceBookingOptionId: previousReservation?.sourceBookingOptionId || null,
      createdAt: previousReservation?.createdAt || new Date().toISOString(),
    };

    const nextReservations = editingId
      ? trip.reservations.map((item) => item.id === editingId ? reservation : item)
      : [...trip.reservations, reservation];

    let nextDocuments = [...(trip.documents || [])];
    let nextItinerary = [...(trip.itinerary || [])];
    let nextExpenses = [...(trip.expenses || [])];
    let linkedUpdateCount = 0;

    if (editingId && previousReservation) {
      const synced = synchronizeReservationLinks({
        trip,
        previousReservation,
        reservation,
        oldGeneratedDocumentTitle: t('reservations.generatedDocumentTitle', { name: previousReservation.title }),
        newGeneratedDocumentTitle: t('reservations.generatedDocumentTitle', { name: reservation.title }),
      });
      nextDocuments = synced.documents;
      nextItinerary = synced.itinerary;
      nextExpenses = synced.expenses;
      linkedUpdateCount = synced.updatedCount;
    }

    const savedAttachments = [];

    try {
      if (selectedFiles.length > 0) {
        const existingDocument = nextDocuments.find((document) => document.linkedReservationId === reservation.id);
        const document = existingDocument || {
          id: createId('document'),
          type: 'booking',
          title: t('reservations.generatedDocumentTitle', { name: reservation.title }),
          reference: reservation.confirmationNumber,
          url: reservation.url,
          expiryDate: reservation.endDate || '',
          notes: reservation.notes,
          linkedReservationId: reservation.id,
          attachments: [],
          createdAt: new Date().toISOString(),
        };

        for (const file of selectedFiles) {
          const metadata = await attachmentStorageService.saveFile({
            file,
            tripId: trip.id,
            documentId: document.id,
            reservationId: reservation.id,
          });
          savedAttachments.push(metadata);
        }

        const updatedDocument = {
          ...document,
          title: existingDocument?.title || t('reservations.generatedDocumentTitle', { name: reservation.title }),
          reference: existingDocument?.reference || reservation.confirmationNumber,
          url: existingDocument?.url || reservation.url,
          linkedReservationId: reservation.id,
          attachments: [...(document.attachments || []), ...savedAttachments],
        };
        nextDocuments = existingDocument
          ? nextDocuments.map((item) => item.id === existingDocument.id ? updatedDocument : item)
          : [...nextDocuments, updatedDocument];
      }

      onUpdate({ reservations: nextReservations, documents: nextDocuments, itinerary: nextItinerary, expenses: nextExpenses });
      setFeedback({
        tone: 'success',
        title: t('reservations.savedTitle'),
        message: selectedFiles.length > 0
          ? t('reservations.savedWithFiles', { count: selectedFiles.length })
          : linkedUpdateCount > 0
            ? t('reservations.savedSyncedText', { count: linkedUpdateCount })
            : t('reservations.savedText'),
      });
      resetEditor();
    } catch (error) {
      await Promise.allSettled(savedAttachments.map((attachment) => attachmentStorageService.delete(attachment.id)));
      setFeedback({ tone: 'danger', title: t('reservations.documentErrorTitle'), message: error.message });
    } finally {
      setSaving(false);
    }
  }

  async function confirmImportedReservation({ file, draft, targets }) {
    const reservationId = createId('reservation');
    const amount = Math.max(0, Number(draft.amount) || 0);
    const activityType = mapReservationTypeToActivityType(draft.type);
    let sourceActivityId = null;
    let sourceActivitySeriesId = null;
    let nextItinerary = [...(trip.itinerary || [])];

    if (targets.itinerary && draft.startDate) {
      const activity = {
        id: createId('activity'),
        time: draft.startTime || '',
        endTime: activityType === 'hotel' ? '' : (draft.endTime || ''),
        checkInTime: activityType === 'hotel' ? (draft.startTime || '') : '',
        checkOutTime: activityType === 'hotel' ? (draft.endTime || '') : '',
        type: activityType,
        title: draft.title,
        location: draft.location,
        latitude: draft.latitude,
        longitude: draft.longitude,
        departureLocation: '',
        departureLatitude: null,
        departureLongitude: null,
        transportMode: '',
        durationMinutes: activityType === 'hotel' ? 0 : 60,
        estimatedCost: amount,
        notes: draft.notes,
        reminderMinutes: null,
        externalCalendarUid: '',
        completedAt: null,
        comments: [],
        linkedReservationId: reservationId,
        seriesId: null,
      };

      if (activityType === 'hotel') {
        sourceActivitySeriesId = createId('activity-series');
        activity.seriesId = sourceActivitySeriesId;
        const endDate = draft.endDate && draft.endDate >= draft.startDate ? draft.endDate : draft.startDate;
        nextItinerary = upsertActivityAcrossDates(nextItinerary, draft.startDate, endDate, activity);
      } else {
        sourceActivityId = activity.id;
        nextItinerary = upsertActivityInItinerary(nextItinerary, draft.startDate, activity);
      }
    }

    const reservation = {
      id: reservationId,
      type: draft.type,
      title: draft.title,
      provider: draft.provider,
      confirmationNumber: draft.confirmationNumber,
      startDate: draft.startDate,
      startTime: draft.startTime,
      endDate: draft.endDate,
      endTime: draft.endTime,
      location: draft.location,
      status: draft.status,
      amount,
      url: normalizeExternalUrl(draft.url),
      latitude: draft.latitude,
      longitude: draft.longitude,
      notes: draft.notes,
      reminderMinutes: null,
      externalCalendarUid: '',
      comments: [],
      sourceActivityId,
      sourceActivitySeriesId,
      sourceBookingOptionId: null,
      createdAt: new Date().toISOString(),
    };

    let nextDocuments = [...(trip.documents || [])];
    let savedAttachment = null;
    if (targets.document) {
      const documentId = createId('document');
      savedAttachment = await attachmentStorageService.saveFile({
        file,
        tripId: trip.id,
        documentId,
        reservationId,
      });
      nextDocuments.push({
        id: documentId,
        type: 'booking',
        title: t('reservations.generatedDocumentTitle', { name: draft.title }),
        reference: draft.confirmationNumber,
        url: normalizeExternalUrl(draft.url),
        expiryDate: draft.endDate || draft.startDate || '',
        notes: draft.notes,
        linkedReservationId: reservationId,
        attachments: [savedAttachment],
        createdAt: new Date().toISOString(),
      });
    }

    let nextExpenses = [...(trip.expenses || [])];
    if (targets.expense && amount > 0) {
      const participants = trip.travelParty || [];
      const payer = participants.find((participant) => participant.isCurrentUser) || participants[0] || null;
      nextExpenses.push({
        id: createId('expense'),
        label: draft.title,
        category: mapReservationTypeToExpenseCategory(draft.type),
        amount,
        paidAmount: 0,
        paid: false,
        date: draft.startDate || '',
        paidById: payer?.id || null,
        splitBetweenIds: participants.map((participant) => participant.id),
        splitShares: [],
        notes: draft.notes,
        linkedReservationId: reservationId,
        sourceActivityId,
        sourceActivitySeriesId,
      });
    }

    try {
      onUpdate({
        reservations: [...trip.reservations, reservation],
        documents: nextDocuments,
        itinerary: nextItinerary,
        expenses: nextExpenses,
      });
      setFeedback({
        tone: 'success',
        title: t('reservations.importSuccessTitle'),
        message: t('reservations.importSuccessText', { name: reservation.title }),
      });
    } catch (error) {
      if (savedAttachment) await attachmentStorageService.delete(savedAttachment.id).catch(() => {});
      throw error;
    }
  }

  function updateStatus(reservationId, status) {
    onUpdate({ reservations: trip.reservations.map((reservation) => reservation.id === reservationId ? { ...reservation, status } : reservation) });
  }

  function getLinkedActivityAmount(reservation) {
    const activities = (trip.itinerary || []).flatMap((day) => day.items || []);
    const linked = reservation.sourceActivityId ? activities.find((activity) => activity.id === reservation.sourceActivityId) : reservation.sourceActivitySeriesId ? activities.find((activity) => activity.seriesId === reservation.sourceActivitySeriesId && Number(activity.seriesIndex || 0) === 0) : null;
    if (!linked) return null;
    const amount = Math.max(0, Number(linked.estimatedCost) || 0);
    return amount > 0 ? amount : null;
  }
  function syncReservationAmount(reservation, amount) { onUpdate({ reservations: trip.reservations.map((item) => item.id === reservation.id ? { ...item, amount } : item) }); }

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

  function renderEditor(className = '') {
    return (
      <Card className={`workspace-form-card reservation-editor ${className}`.trim()}>
        <form className="workspace-form" onSubmit={submitReservation}>
          <div className="workspace-form__title-row">
            <div>
              <p className="eyebrow">{t(editingId ? 'reservations.editEyebrow' : 'reservations.newEyebrow')}</p>
              <h3>{t(editingId ? 'reservations.editTitle' : 'reservations.newTitle')}</h3>
            </div>
          </div>
          <div className="workspace-form__grid reservation-form-grid">
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
            <Field label={t('reservations.bookingLink')} className="workspace-form__wide"><input name="url" type="url" value={form.url} onChange={updateField} placeholder={t('reservations.linkPlaceholder')} /></Field>
            <Field label={t('mailLink.directLinkLabel')} hint={t('mailLink.directLinkHint')} className="workspace-form__wide"><input name="emailUrl" type="url" value={form.emailUrl} onChange={updateField} placeholder={t('mailLink.directLinkPlaceholder')} /></Field>
            <LocationAutocomplete
              id={editingId ? `reservation-location-${editingId}` : 'reservation-location-new'}
              variant="workspace"
              className="workspace-form__wide"
              label={t('common.location')}
              value={form.location}
              placeholder={t('reservations.locationPlaceholder')}
              bias={{ latitude: trip.destinationLatitude, longitude: trip.destinationLongitude }}
              hint={t('placeSearch.locationHint')}
              onValueChange={(value) => setForm((current) => ({ ...current, location: value, latitude: '', longitude: '' }))}
              onPlaceSelect={(place) => place && setForm((current) => ({
                ...current,
                location: place.label,
                title: current.title.trim() ? current.title : (place.name || place.primaryLabel || place.label),
                latitude: place.latitude,
                longitude: place.longitude,
              }))}
            />
            <fieldset className="reservation-date-group workspace-form__full">
              <legend>{t('reservations.schedule')}</legend>
              <div>
                <Field label={t('reservations.startDate')}><input name="startDate" type="date" value={form.startDate} onChange={updateField} /></Field>
                <Field label={t('reservations.startTime')}><input name="startTime" type="time" value={form.startTime} onChange={updateField} /></Field>
                <Field label={t('reservations.endDate')}><input name="endDate" type="date" value={form.endDate} onChange={updateField} /></Field>
                <Field label={t('reservations.endTime')}><input name="endTime" type="time" value={form.endTime} onChange={updateField} /></Field>
              </div>
            </fieldset>
            <Field label={`${t('tools.amount')} (${trip.currency})`}><input name="amount" type="number" min="0" step="0.01" value={form.amount} onChange={updateField} onBlur={() => setForm((current) => ({ ...current, amount: normalizeMoney(current.amount) }))} /></Field>
            <Field label={t('common.latitude')}><input name="latitude" type="number" min="-90" max="90" step="any" value={form.latitude} onChange={updateField} placeholder="35.6762" /></Field>
            <Field label={t('common.longitude')}><input name="longitude" type="number" min="-180" max="180" step="any" value={form.longitude} onChange={updateField} placeholder="139.6503" /></Field>
            <Field label={t('common.notes')} className="workspace-form__full"><textarea name="notes" rows="3" value={form.notes} onChange={updateField} placeholder={t('reservations.notesPlaceholder')} /></Field>
            <Field label={t('reservations.documents')} className="workspace-form__full reservation-documents-field">
              <input ref={fileInputRef} type="file" multiple accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx,.txt" onChange={chooseFiles} />
              <small>{selectedFiles.length > 0 ? t('reservations.filesSelected', { count: selectedFiles.length }) : t('reservations.documentsHint')}</small>
            </Field>
          </div>
          <div className="workspace-form__actions">
            <Button variant="ghost" onClick={resetEditor}>{t('common.cancel')}</Button>
            <Button type="submit" icon={editingId ? 'save' : 'plus'} disabled={isSaving}>
              {isSaving ? t('common.loading') : t(editingId ? 'reservations.saveChanges' : 'reservations.save')}
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  return (
    <div className="workspace-section reservations-workspace">
      <section className="workspace-section__heading">
        <div>
          <p className="eyebrow">{t('reservations.eyebrow')}</p>
          <h2>{t('reservations.title')}</h2>
          <p>{t('reservations.intro')}</p>
        </div>
        <div className="workspace-section__actions reservations-heading-actions">
          <Button variant="secondary" icon="upload" onClick={() => setImportOpen(true)}>{t('reservations.importAction')}</Button>
          <Button icon={isCreateOpen ? 'close' : 'plus'} onClick={() => (isCreateOpen ? resetEditor() : openCreateForm())}>
            {isCreateOpen ? t('common.close') : t('reservations.add')}
          </Button>
        </div>
      </section>

      {feedback && <InlineNotice tone={feedback.tone} title={feedback.title}>{feedback.message}</InlineNotice>}

      <Card className="reservation-search-card">
        <label className="reservation-search">
          <Icon name="search" size={17} />
          <input type="search" value={query} placeholder={t('reservations.searchPlaceholder')} aria-label={t('reservations.searchPlaceholder')} onChange={(event) => setQuery(event.target.value)} />
          {query && <button type="button" aria-label={t('search.clear')} onClick={() => setQuery('')}><Icon name="close" size={15} /></button>}
        </label>
      </Card>

      {isCreateOpen && renderEditor('reservation-editor--create')}

      {filteredReservations.length > 0 ? (
        <div className="reservation-list">
          {filteredReservations.map((reservation) => {
            const safeUrl = normalizeExternalUrl(reservation.url);
            const linkedDocuments = documentsByReservation.get(reservation.id) || [];
            const attachmentCount = linkedDocuments.reduce((sum, document) => sum + (document.attachments?.length || 0), 0);
            return (
              <Fragment key={reservation.id}>
                <Card id={`reservation-${reservation.id}`} tabIndex="-1" className={`${editingId === reservation.id ? 'reservation-card reservation-card--editing' : 'reservation-card'}${focusedReservationId === reservation.id ? ' reservation-card--focused' : ''}`}>
                  <div className={`reservation-card__icon reservation-card__icon--${reservation.type}`}><Icon name={getReservationIcon(reservation.type)} size={21} /></div>
                  <div className="reservation-card__content">
                    <div className="reservation-card__headline">
                      <div><small>{getCategoryLabel(RESERVATION_TYPES, reservation.type, t)}</small><h3>{reservation.title}</h3></div>
                      <div className="reservation-card__headline-actions"><Badge tone={getStatusTone(reservation.status)}>{getCategoryLabel(RESERVATION_STATUSES, reservation.status, t)}</Badge><button className="icon-button icon-button--small" type="button" aria-label={`${t('common.edit')} ${reservation.title}`} onClick={() => openEditForm(reservation)}><Icon name="edit" size={16} /></button><button className="icon-button icon-button--small" type="button" aria-label={`${t('common.delete')} ${reservation.title}`} onClick={() => removeReservation(reservation)}><Icon name="trash" size={16} /></button></div>
                    </div>
                    <div className="reservation-card__meta">
                      {(reservation.startDate || reservation.startTime) && <span><Icon name="calendarDays" size={15} /> {formatReservationDate(reservation, locale, t)}</span>}
                      {reservation.location && <span><Icon name="pin" size={15} /> {reservation.location}</span>}
                      {reservation.provider && <span><Icon name="building" size={15} /> {reservation.provider}</span>}
                      {reservation.amount > 0 && <span><Icon name="wallet" size={15} /> {formatCurrency(reservation.amount, trip.currency, locale)}</span>}
                      {attachmentCount > 0 && <span><Icon name="paperclip" size={15} /> {t('reservations.documentCount', { count: attachmentCount })}</span>}
                    </div>
                    {reservation.confirmationNumber && <p className="reservation-card__reference">{t('reservations.confirmation')} <strong>{reservation.confirmationNumber}</strong></p>}
                    {reservation.notes && <p className="reservation-card__notes">{reservation.notes}</p>}
                    <div className="reservation-card__actions">
                      <label><span className="sr-only">{t('reservations.status')}</span><select value={reservation.status} onChange={(event) => updateStatus(reservation.id, event.target.value)}>{RESERVATION_STATUSES.map((status) => <option key={status.id} value={status.id}>{t(status.labelKey)}</option>)}</select></label>
                      {safeUrl && <a className="text-link" href={safeUrl} target="_blank" rel="noreferrer">{t('reservations.openBooking')} <Icon name="externalLink" size={15} /></a>}
                      {(() => { const mailLink = buildMailLink(reservation, mailProvider); return mailLink ? <a className="text-link" href={mailLink} target="_blank" rel="noreferrer" title={t(reservation.emailUrl ? 'mailLink.openDirectHint' : 'mailLink.openSearchHint')}><Icon name="mail" size={15} /> {t('mailLink.openEmail')}</a> : null; })()}
                      {linkedDocuments.length > 0 && <button className="text-link" type="button" onClick={() => onOpenDocument?.(linkedDocuments[0].id)}><Icon name="folder" size={15} /> {t('reservations.openDocuments', { count: linkedDocuments.length })}</button>}
                      {(() => { const linkedAmount = getLinkedActivityAmount(reservation); return linkedAmount !== null && Math.abs(linkedAmount - Number(reservation.amount || 0)) > 0.009 ? <button className="text-link reservation-card__amount-sync" type="button" onClick={() => syncReservationAmount(reservation, linkedAmount)}><Icon name="refresh" size={15} /> {t('reservations.updateAmountFromItinerary', { amount: formatCurrency(linkedAmount, trip.currency, locale) })}</button> : null; })()}
                    </div>
                    <DiscussionThread comments={reservation.comments} currentUserName={getCurrentActorName(trip)} onAdd={(message) => addReservationComment(reservation, message)} onRemove={(commentId) => removeReservationComment(reservation.id, commentId)} />
                  </div>
                </Card>
                {editingId === reservation.id && renderEditor('reservation-editor--inline')}
              </Fragment>
            );
          })}
        </div>
      ) : reservations.length > 0 ? (
        <section className="workspace-large-empty workspace-large-empty--compact">
          <span><Icon name="search" size={28} /></span>
          <h3>{t('reservations.noMatchTitle')}</h3>
          <p>{t('reservations.noMatchText')}</p>
        </section>
      ) : (
        <section className="workspace-large-empty">
          <span><Icon name="ticket" size={28} /></span>
          <h3>{t('reservations.emptyTitle')}</h3>
          <p>{t('reservations.emptyText')}</p>
          <Button icon="plus" onClick={openCreateForm}>{t('reservations.addFirst')}</Button>
        </section>
      )}

      <ReservationImportDialog
        isOpen={isImportOpen}
        trip={trip}
        onClose={() => setImportOpen(false)}
        onConfirm={confirmImportedReservation}
      />
    </div>
  );
}

function Field({ label, hint = '', className = '', children }) {
  return (
    <label className={`workspace-field ${className}`.trim()}>
      <span>{label}</span>
      {children}
      {hint && <small className="workspace-field__hint">{hint}</small>}
    </label>
  );
}

function normalizeMoney(value) {
  if (value === '') return '';
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number).toFixed(2) : '';
}


function findLinkedItinerarySource(itinerary, reservation) {
  for (const day of itinerary || []) {
    const item = (day.items || []).find((candidate) => isActivityLinkedToReservation(candidate, reservation));
    if (item) return { day, item };
  }
  return null;
}

function isActivityLinkedToReservation(activity, reservation) {
  if (!activity || !reservation) return false;
  if (activity.linkedReservationId && activity.linkedReservationId === reservation.id) return true;
  if (reservation.sourceActivityId && activity.id === reservation.sourceActivityId) return true;
  if (reservation.sourceActivitySeriesId && activity.seriesId === reservation.sourceActivitySeriesId) return true;
  return false;
}

function synchronizeReservationLinks({ trip, previousReservation, reservation, oldGeneratedDocumentTitle, newGeneratedDocumentTitle }) {
  const linkedSource = findLinkedItinerarySource(trip.itinerary, previousReservation);
  const changed = (field) => reservation[field] !== previousReservation[field];
  const activityRelevantChange = ['type', 'title', 'startDate', 'startTime', 'endDate', 'endTime', 'location', 'latitude', 'longitude', 'amount', 'notes'].some(changed);
  const expenseRelevantChange = ['type', 'title', 'startDate', 'amount', 'notes'].some(changed);
  const documentRelevantChange = ['title', 'confirmationNumber', 'startDate', 'endDate', 'url', 'notes'].some(changed);
  let itinerary = [...(trip.itinerary || [])];
  let updatedCount = 0;

  if (linkedSource && activityRelevantChange) {
    const baseItinerary = itinerary.map((day) => {
      const filtered = (day.items || []).filter((item) => !isActivityLinkedToReservation(item, previousReservation));
      return filtered.length === (day.items || []).length ? day : { ...day, items: filtered, routePlan: null };
    });

    if (reservation.startDate) {
      const activityType = mapReservationTypeToActivityType(reservation.type);
      const root = linkedSource.item;
      const activity = {
        ...root,
        id: reservation.sourceActivityId || root.id,
        type: changed('type') ? activityType : root.type,
        title: changed('title') ? reservation.title : root.title,
        location: changed('location') ? reservation.location : root.location,
        latitude: changed('latitude') ? reservation.latitude : root.latitude,
        longitude: changed('longitude') ? reservation.longitude : root.longitude,
        time: changed('startTime') ? (reservation.startTime || '') : (root.checkInTime || root.time || ''),
        endTime: activityType === 'hotel' ? '' : (changed('endTime') ? (reservation.endTime || '') : (root.endTime || '')),
        checkInTime: activityType === 'hotel' ? (changed('startTime') ? (reservation.startTime || '') : (root.checkInTime || root.time || '')) : '',
        checkOutTime: activityType === 'hotel' ? (changed('endTime') ? (reservation.endTime || '') : (root.checkOutTime || '')) : '',
        durationMinutes: activityType === 'hotel' ? 0 : Math.max(0, Number(root.durationMinutes) || 60),
        estimatedCost: changed('amount') ? Math.max(0, Number(reservation.amount) || 0) : Math.max(0, Number(root.estimatedCost) || 0),
        notes: changed('notes') ? (reservation.notes || '') : (root.notes || ''),
        linkedReservationId: reservation.id,
        seriesId: activityType === 'hotel' ? (reservation.sourceActivitySeriesId || root.seriesId || null) : null,
      };

      if (activityType === 'hotel') {
        const oldStart = root.stayStartDate || previousReservation.startDate || reservation.startDate;
        const oldEnd = root.stayEndDate || previousReservation.endDate || oldStart;
        const startDate = changed('startDate') ? reservation.startDate : oldStart;
        const requestedEnd = changed('endDate') ? reservation.endDate : oldEnd;
        const endDate = requestedEnd && requestedEnd >= startDate ? requestedEnd : startDate;
        itinerary = upsertActivityAcrossDates(baseItinerary, startDate, endDate, activity);
      } else {
        const date = changed('startDate') ? reservation.startDate : (linkedSource.day.date || reservation.startDate);
        itinerary = upsertActivityInItinerary(baseItinerary, date, activity);
      }
    } else {
      itinerary = baseItinerary;
    }
    updatedCount += 1;
  }

  const expenses = (trip.expenses || []).map((expense) => {
    const linked = expense.linkedReservationId === previousReservation.id
      || (previousReservation.sourceActivityId && expense.sourceActivityId === previousReservation.sourceActivityId)
      || (previousReservation.sourceActivitySeriesId && expense.sourceActivitySeriesId === previousReservation.sourceActivitySeriesId);
    if (!linked || !expenseRelevantChange) return expense;
    updatedCount += 1;
    return {
      ...expense,
      label: changed('title') ? reservation.title : expense.label,
      category: changed('type') ? mapReservationTypeToExpenseCategory(reservation.type) : expense.category,
      amount: changed('amount') ? Math.max(0, Number(reservation.amount) || 0) : expense.amount,
      date: changed('startDate') ? (reservation.startDate || '') : expense.date,
      notes: changed('notes') ? (reservation.notes || '') : expense.notes,
      linkedReservationId: reservation.id,
      sourceActivityId: reservation.sourceActivityId || null,
      sourceActivitySeriesId: reservation.sourceActivitySeriesId || null,
    };
  });

  const documents = (trip.documents || []).map((document) => {
    if (document.linkedReservationId !== previousReservation.id || !documentRelevantChange) return document;
    updatedCount += 1;
    const generatedTitle = !document.title || document.title === oldGeneratedDocumentTitle;
    return {
      ...document,
      title: changed('title') && generatedTitle ? newGeneratedDocumentTitle : document.title,
      reference: changed('confirmationNumber') ? (reservation.confirmationNumber || '') : document.reference,
      url: changed('url') ? (reservation.url || '') : document.url,
      expiryDate: changed('endDate') || changed('startDate') ? (reservation.endDate || reservation.startDate || '') : document.expiryDate,
      notes: changed('notes') ? (reservation.notes || '') : document.notes,
      linkedReservationId: reservation.id,
    };
  });

  return { itinerary, expenses, documents, updatedCount };
}

function compareReservations(left, right) {
  const leftKey = `${left.startDate || '9999-12-31'}T${left.startTime || '23:59'}`;
  const rightKey = `${right.startDate || '9999-12-31'}T${right.startTime || '23:59'}`;
  return leftKey.localeCompare(rightKey);
}

function formatReservationDate(reservation, locale, t) {
  if (!reservation.startDate) return formatLocalizedTime(reservation.startTime, t('reservations.timeToConfirm'));
  const date = formatLocalizedDate(reservation.startDate, locale, 'short');
  return reservation.startTime ? `${date} · ${formatLocalizedTime(reservation.startTime)}` : date;
}

function getReservationIcon(type) {
  return { flight: 'plane', accommodation: 'hotel', transport: 'car', activity: 'ticket' }[type] || 'ticket';
}

function getStatusTone(status) {
  return { confirmed: 'success', pending: 'warning', cancelled: 'neutral' }[status] || 'neutral';
}