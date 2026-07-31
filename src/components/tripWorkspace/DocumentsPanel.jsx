import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../hooks/useI18n.js';
import { attachmentStorageService } from '../../services/storage/AttachmentStorageService.js';
import { createId } from '../../utils/id.js';
import { DOCUMENT_TYPES, getCategoryLabel } from '../../utils/tripWorkspace.js';
import { normalizeExternalUrl } from '../../utils/url.js';
import { Button } from '../common/Button.jsx';
import { Card } from '../common/Card.jsx';
import { Icon } from '../common/Icon.jsx';
import { Modal } from '../common/Modal.jsx';
import { InlineNotice } from '../feedback/InlineNotice.jsx';

const EMPTY_FORM = Object.freeze({
  type: 'booking', title: '', reference: '', url: '', expiryDate: '', notes: '', linkedReservationId: '',
});

export function DocumentsPanel({ trip, onUpdate }) {
  const { locale, t } = useI18n();
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [attachmentsByDocument, setAttachmentsByDocument] = useState({});
  const [uploadTargetId, setUploadTargetId] = useState(null);
  const [busyAttachmentId, setBusyAttachmentId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [preview, setPreview] = useState(null);
  const formAnchorRef = useRef(null);
  const fileInputRef = useRef(null);

  const documents = useMemo(
    () => [...trip.documents].sort((left, right) => left.title.localeCompare(right.title)),
    [trip.documents],
  );

  const refreshAttachments = useCallback(async () => {
    try {
      const records = await attachmentStorageService.listByTrip(trip.id);
      const grouped = records.reduce((result, record) => {
        const key = record.documentId;
        result[key] = [...(result[key] || []), attachmentStorageService.toMetadata(record)]
          .sort((left, right) => left.name.localeCompare(right.name));
        return result;
      }, {});
      setAttachmentsByDocument(grouped);
    } catch (error) {
      setFeedback({ tone: 'danger', title: t('documents.storageErrorTitle'), message: error.message });
    }
  }, [trip.id, t]);

  useEffect(() => {
    refreshAttachments();
  }, [refreshAttachments, trip.documents]);

  useEffect(() => () => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
  }, [preview]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function openCreateForm() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setFormOpen(true);
  }

  function openEditForm(document) {
    setEditingId(document.id);
    setForm({
      type: document.type || 'other',
      title: document.title || '',
      reference: document.reference || '',
      url: document.url || '',
      expiryDate: document.expiryDate || '',
      notes: document.notes || '',
      linkedReservationId: document.linkedReservationId || '',
    });
    setFormOpen(true);
    window.requestAnimationFrame(() => formAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  function closeForm() {
    setEditingId(null);
    setFormOpen(false);
  }

  async function submitDocument(event) {
    event.preventDefault();
    if (!form.title.trim()) return;

    const previousDocument = trip.documents.find((document) => document.id === editingId);
    const document = {
      id: editingId || createId('document'),
      type: form.type,
      title: form.title.trim(),
      reference: form.reference.trim(),
      url: normalizeExternalUrl(form.url),
      expiryDate: form.expiryDate,
      notes: form.notes.trim(),
      linkedReservationId: form.linkedReservationId || null,
      attachments: previousDocument?.attachments || [],
      createdAt: previousDocument?.createdAt || new Date().toISOString(),
    };

    const nextDocuments = editingId
      ? trip.documents.map((item) => item.id === editingId ? document : item)
      : [...trip.documents, document];

    onUpdate({ documents: nextDocuments });
    if (editingId && previousDocument?.linkedReservationId !== document.linkedReservationId) {
      try {
        await attachmentStorageService.updateDocumentAssociation(
          editingId,
          document.linkedReservationId,
        );
      } catch (error) {
        setFeedback({ tone: 'danger', title: t('documents.storageErrorTitle'), message: error.message });
      }
    }
    closeForm();
  }

  async function removeDocument(document) {
    if (!window.confirm(t('documents.deleteConfirm', { name: document.title }))) return;
    try {
      await attachmentStorageService.deleteByDocument(document.id);
      onUpdate({ documents: trip.documents.filter((item) => item.id !== document.id) });
      setFeedback({ tone: 'success', title: t('documents.deletedTitle'), message: t('documents.deletedText') });
      await refreshAttachments();
    } catch (error) {
      setFeedback({ tone: 'danger', title: t('documents.storageErrorTitle'), message: error.message });
    }
  }

  function chooseFiles(documentId) {
    setUploadTargetId(documentId);
    window.requestAnimationFrame(() => fileInputRef.current?.click());
  }

  async function uploadFiles(event) {
    const files = [...(event.target.files || [])].slice(0, 5);
    event.target.value = '';
    const document = trip.documents.find((item) => item.id === uploadTargetId);
    if (!document || files.length === 0) return;

    setBusyAttachmentId(`upload-${document.id}`);
    setFeedback(null);
    const savedMetadata = [];

    try {
      for (const file of files) {
        const metadata = await attachmentStorageService.saveFile({
          file,
          tripId: trip.id,
          documentId: document.id,
          reservationId: document.linkedReservationId,
        });
        savedMetadata.push(metadata);
      }

      onUpdate({
        documents: trip.documents.map((item) => item.id === document.id
          ? { ...item, attachments: [...(item.attachments || []), ...savedMetadata] }
          : item),
      });
      setFeedback({
        tone: 'success',
        title: t('documents.uploadSuccessTitle'),
        message: t(savedMetadata.length === 1 ? 'documents.uploadSuccessOne' : 'documents.uploadSuccessMany', { count: savedMetadata.length }),
      });
      await refreshAttachments();
    } catch (error) {
      setFeedback({ tone: 'danger', title: t('documents.uploadFailed'), message: localizeAttachmentError(error, t) });
    } finally {
      setBusyAttachmentId(null);
      setUploadTargetId(null);
    }
  }

  async function previewAttachment(attachment) {
    setBusyAttachmentId(attachment.id);
    try {
      const record = await attachmentStorageService.get(attachment.id);
      if (!record) throw new Error(t('documents.fileMissing'));
      if (!record.type.startsWith('image/') && record.type !== 'application/pdf') {
        downloadRecord(record);
        return;
      }
      const url = URL.createObjectURL(record.blob);
      setPreview({ ...attachmentStorageService.toMetadata(record), url });
    } catch (error) {
      setFeedback({ tone: 'danger', title: t('documents.storageErrorTitle'), message: error.message });
    } finally {
      setBusyAttachmentId(null);
    }
  }

  async function downloadAttachment(attachment) {
    setBusyAttachmentId(attachment.id);
    try {
      const record = await attachmentStorageService.get(attachment.id);
      if (!record) throw new Error(t('documents.fileMissing'));
      downloadRecord(record);
    } catch (error) {
      setFeedback({ tone: 'danger', title: t('documents.storageErrorTitle'), message: error.message });
    } finally {
      setBusyAttachmentId(null);
    }
  }

  async function renameAttachment(document, attachment) {
    const nextName = window.prompt(t('documents.renamePrompt'), attachment.name)?.trim();
    if (!nextName || nextName === attachment.name) return;
    setBusyAttachmentId(attachment.id);
    try {
      const metadata = await attachmentStorageService.rename(attachment.id, nextName);
      onUpdate({
        documents: trip.documents.map((item) => item.id === document.id
          ? { ...item, attachments: (item.attachments || []).map((file) => file.id === attachment.id ? metadata : file) }
          : item),
      });
      await refreshAttachments();
    } catch (error) {
      setFeedback({ tone: 'danger', title: t('documents.storageErrorTitle'), message: error.message });
    } finally {
      setBusyAttachmentId(null);
    }
  }

  async function removeAttachment(document, attachment) {
    if (!window.confirm(t('documents.deleteFileConfirm', { name: attachment.name }))) return;
    setBusyAttachmentId(attachment.id);
    try {
      await attachmentStorageService.delete(attachment.id);
      onUpdate({
        documents: trip.documents.map((item) => item.id === document.id
          ? { ...item, attachments: (item.attachments || []).filter((file) => file.id !== attachment.id) }
          : item),
      });
      setFeedback({ tone: 'success', title: t('documents.fileDeletedTitle'), message: t('documents.fileDeletedText') });
      await refreshAttachments();
    } catch (error) {
      setFeedback({ tone: 'danger', title: t('documents.storageErrorTitle'), message: error.message });
    } finally {
      setBusyAttachmentId(null);
    }
  }

  function closePreview() {
    if (preview?.url) URL.revokeObjectURL(preview.url);
    setPreview(null);
  }

  return (
    <div className="workspace-section">
      <section className="workspace-section__heading">
        <div>
          <p className="eyebrow">{t('documents.eyebrow')}</p>
          <h2>{t('documents.title')}</h2>
          <p>{t('documents.intro')}</p>
        </div>
        <Button icon={isFormOpen ? 'close' : 'plus'} onClick={() => (isFormOpen ? closeForm() : openCreateForm())}>
          {isFormOpen ? t('common.close') : t('documents.add')}
        </Button>
      </section>

      {feedback && <InlineNotice tone={feedback.tone} title={feedback.title}>{feedback.message}</InlineNotice>}

      <input
        ref={fileInputRef}
        className="sr-only"
        type="file"
        multiple
        accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx,.txt"
        onChange={uploadFiles}
      />

      {isFormOpen && (
        <>
          <div ref={formAnchorRef} className="workspace-form-anchor" />
          <Card className="workspace-form-card">
            <form className="workspace-form" onSubmit={submitDocument}>
              <div className="workspace-form__title-row">
                <div>
                  <p className="eyebrow">{t(editingId ? 'documents.editEyebrow' : 'documents.newEyebrow')}</p>
                  <h3>{t(editingId ? 'documents.editTitle' : 'documents.newTitle')}</h3>
                </div>
              </div>
              <div className="workspace-form__grid">
                <Field label={t('documents.type')}>
                  <select name="type" value={form.type} onChange={updateField}>
                    {DOCUMENT_TYPES.map((type) => <option key={type.id} value={type.id}>{t(type.labelKey)}</option>)}
                  </select>
                </Field>
                <Field label={t('documents.titleLabel')} className="workspace-form__wide">
                  <input name="title" value={form.title} onChange={updateField} placeholder={t('documents.titlePlaceholder')} required />
                </Field>
                <Field label={t('common.reference')}>
                  <input name="reference" value={form.reference} onChange={updateField} placeholder={t('documents.referencePlaceholder')} />
                </Field>
                <Field label={t('documents.expiry')}>
                  <input name="expiryDate" type="date" value={form.expiryDate} onChange={updateField} />
                </Field>
                <Field label={t('documents.linkedReservation')} className="workspace-form__wide">
                  <select name="linkedReservationId" value={form.linkedReservationId} onChange={updateField}>
                    <option value="">{t('documents.noLinkedReservation')}</option>
                    {trip.reservations.map((reservation) => (
                      <option key={reservation.id} value={reservation.id}>{reservation.title}</option>
                    ))}
                  </select>
                </Field>
                <Field label={t('documents.secureLink')} className="workspace-form__wide">
                  <input name="url" type="url" value={form.url} onChange={updateField} placeholder={t('documents.linkPlaceholder')} />
                </Field>
                <Field label={t('common.notes')} className="workspace-form__full">
                  <textarea name="notes" rows="3" value={form.notes} onChange={updateField} placeholder={t('documents.notesPlaceholder')} />
                </Field>
              </div>
              <div className="workspace-form__actions">
                <Button variant="ghost" onClick={closeForm}>{t('common.cancel')}</Button>
                <Button type="submit" icon={editingId ? 'save' : 'plus'}>
                  {t(editingId ? 'documents.saveChanges' : 'documents.save')}
                </Button>
              </div>
            </form>
          </Card>
        </>
      )}

      {documents.length > 0 ? (
        <div className="document-grid document-grid--vault">
          {documents.map((document) => {
            const safeUrl = normalizeExternalUrl(document.url);
            const attachments = attachmentsByDocument[document.id] || [];
            const linkedReservation = trip.reservations.find((reservation) => reservation.id === document.linkedReservationId);
            return (
              <Card key={document.id} className="document-card document-card--vault">
                <div className="document-card__icon"><Icon name={getDocumentIcon(document.type)} size={22} /></div>
                <div className="document-card__content">
                  <small>{getCategoryLabel(DOCUMENT_TYPES, document.type, t)}</small>
                  <h3>{document.title}</h3>
                  {document.reference && <p>{t('documents.reference')} <strong>{document.reference}</strong></p>}
                  {document.expiryDate && <p><Icon name="calendar" size={14} /> {t('documents.expires', { date: formatDate(document.expiryDate, locale) })}</p>}
                  {linkedReservation && <p><Icon name="receipt" size={14} /> {t('documents.linkedTo', { name: linkedReservation.title })}</p>}
                  {document.notes && <span>{document.notes}</span>}
                </div>
                <div className="document-card__actions">
                  {safeUrl && (
                    <a className="icon-button icon-button--small" href={safeUrl} target="_blank" rel="noreferrer" aria-label={`${t('documents.open')} ${document.title}`}>
                      <Icon name="externalLink" size={16} />
                    </a>
                  )}
                  <button className="icon-button icon-button--small" type="button" aria-label={t('documents.addFile')} onClick={() => chooseFiles(document.id)}>
                    <Icon name="paperclip" size={16} />
                  </button>
                  <button className="icon-button icon-button--small" type="button" aria-label={`${t('common.edit')} ${document.title}`} onClick={() => openEditForm(document)}>
                    <Icon name="edit" size={16} />
                  </button>
                  <button className="icon-button icon-button--small" type="button" aria-label={`${t('common.delete')} ${document.title}`} onClick={() => removeDocument(document)}>
                    <Icon name="trash" size={16} />
                  </button>
                </div>

                <div className="attachment-vault">
                  <div className="attachment-vault__heading">
                    <div>
                      <strong>{t('documents.localFiles')}</strong>
                      <small>{t(attachments.length === 1 ? 'documents.fileCountOne' : 'documents.fileCountMany', { count: attachments.length })}</small>
                    </div>
                    <Button
                      size="small"
                      variant="secondary"
                      icon="upload"
                      disabled={busyAttachmentId === `upload-${document.id}`}
                      onClick={() => chooseFiles(document.id)}
                    >
                      {busyAttachmentId === `upload-${document.id}` ? t('documents.uploading') : t('documents.addFile')}
                    </Button>
                  </div>

                  {attachments.length > 0 ? (
                    <ul className="attachment-list">
                      {attachments.map((attachment) => (
                        <li key={attachment.id} className="attachment-item">
                          <span className="attachment-item__icon"><Icon name={getAttachmentIcon(attachment.type)} size={18} /></span>
                          <div className="attachment-item__copy">
                            <strong title={attachment.name}>{attachment.name}</strong>
                            <small>{formatBytes(attachment.size, locale)} · {formatDateTime(attachment.createdAt, locale)}</small>
                          </div>
                          <div className="attachment-item__actions">
                            <button className="icon-button icon-button--small" type="button" disabled={busyAttachmentId === attachment.id} aria-label={t('documents.previewFile', { name: attachment.name })} onClick={() => previewAttachment(attachment)}>
                              <Icon name="eye" size={15} />
                            </button>
                            <button className="icon-button icon-button--small" type="button" disabled={busyAttachmentId === attachment.id} aria-label={t('documents.downloadFile', { name: attachment.name })} onClick={() => downloadAttachment(attachment)}>
                              <Icon name="download" size={15} />
                            </button>
                            <button className="icon-button icon-button--small" type="button" disabled={busyAttachmentId === attachment.id} aria-label={t('documents.renameFile', { name: attachment.name })} onClick={() => renameAttachment(document, attachment)}>
                              <Icon name="edit" size={15} />
                            </button>
                            <button className="icon-button icon-button--small" type="button" disabled={busyAttachmentId === attachment.id} aria-label={t('documents.deleteFile', { name: attachment.name })} onClick={() => removeAttachment(document, attachment)}>
                              <Icon name="trash" size={15} />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="attachment-vault__empty"><Icon name="hardDrive" size={16} /> {t('documents.noLocalFiles')}</p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <section className="workspace-large-empty">
          <span><Icon name="folder" size={28} /></span>
          <h3>{t('documents.emptyTitle')}</h3>
          <p>{t('documents.emptyText')}</p>
          <Button icon="plus" onClick={openCreateForm}>{t('documents.addFirst')}</Button>
        </section>
      )}

      <Modal
        isOpen={Boolean(preview)}
        title={preview?.name || t('documents.preview')}
        description={preview ? `${formatBytes(preview.size, locale)} · ${preview.type}` : ''}
        onClose={closePreview}
      >
        {preview?.type?.startsWith('image/')
          ? <img className="attachment-preview attachment-preview--image" src={preview.url} alt={preview.name} />
          : <iframe className="attachment-preview attachment-preview--pdf" src={preview?.url} title={preview?.name} />}
        <div className="workspace-form__actions">
          <Button variant="secondary" icon="download" onClick={() => downloadAttachment(preview)}>{t('documents.download')}</Button>
          <Button onClick={closePreview}>{t('common.close')}</Button>
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, className = '', children }) {
  return <label className={`workspace-field ${className}`.trim()}><span>{label}</span>{children}</label>;
}

function getDocumentIcon(type) {
  return { passport: 'shield', ticket: 'ticket', booking: 'receipt', insurance: 'heartPulse', identity: 'userRound', other: 'file' }[type] || 'file';
}

function getAttachmentIcon(type) {
  if (String(type).startsWith('image/')) return 'fileImage';
  if (type === 'application/pdf') return 'fileText';
  return 'file';
}

function downloadRecord(record) {
  const url = URL.createObjectURL(record.blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = record.name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function formatDate(date, locale) {
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' })
    .format(new Date(`${date}T12:00:00`));
}

function formatDateTime(date, locale) {
  if (!date) return '';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));
}

function formatBytes(bytes, locale) {
  const value = Math.max(0, Number(bytes) || 0);
  if (value < 1024) return `${value} B`;
  const units = ['KB', 'MB', 'GB'];
  let size = value / 1024;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: size >= 10 ? 1 : 2 }).format(size)} ${units[unitIndex]}`;
}

function localizeAttachmentError(error, t) {
  const message = String(error?.message || '');
  if (message.includes('15 MB')) return t('documents.fileTooLarge');
  if (message.includes('not supported')) return t('documents.fileTypeUnsupported');
  if (message.includes('IndexedDB')) return t('documents.storageUnsupported');
  return message || t('documents.uploadFailedText');
}
