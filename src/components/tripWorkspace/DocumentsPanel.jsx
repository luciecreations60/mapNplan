import { useMemo, useState } from 'react';
import { useI18n } from '../../hooks/useI18n.js';
import { createId } from '../../utils/id.js';
import { DOCUMENT_TYPES, getCategoryLabel } from '../../utils/tripWorkspace.js';
import { normalizeExternalUrl } from '../../utils/url.js';
import { Button } from '../common/Button.jsx';
import { Card } from '../common/Card.jsx';
import { Icon } from '../common/Icon.jsx';

const EMPTY_FORM = {
  type: 'booking', title: '', reference: '', url: '', expiryDate: '', notes: '',
};

export function DocumentsPanel({ trip, onUpdate }) {
  const { locale, t } = useI18n();
  const [form, setForm] = useState(EMPTY_FORM);
  const [isFormOpen, setFormOpen] = useState(false);
  const documents = useMemo(
    () => [...trip.documents].sort((left, right) => left.title.localeCompare(right.title)),
    [trip.documents],
  );

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function submitDocument(event) {
    event.preventDefault();
    if (!form.title.trim()) return;
    onUpdate({
      documents: [...trip.documents, {
        id: createId('document'),
        type: form.type,
        title: form.title.trim(),
        reference: form.reference.trim(),
        url: normalizeExternalUrl(form.url),
        expiryDate: form.expiryDate,
        notes: form.notes.trim(),
        createdAt: new Date().toISOString(),
      }],
    });
    setForm(EMPTY_FORM);
    setFormOpen(false);
  }

  function removeDocument(documentId) {
    onUpdate({ documents: trip.documents.filter((document) => document.id !== documentId) });
  }

  return (
    <div className="workspace-section">
      <section className="workspace-section__heading">
        <div>
          <p className="eyebrow">{t('documents.eyebrow')}</p>
          <h2>{t('documents.title')}</h2>
          <p>{t('documents.intro')}</p>
        </div>
        <Button icon={isFormOpen ? 'close' : 'plus'} onClick={() => setFormOpen((value) => !value)}>
          {isFormOpen ? t('common.close') : t('documents.add')}
        </Button>
      </section>

      {isFormOpen && (
        <Card className="workspace-form-card">
          <form className="workspace-form" onSubmit={submitDocument}>
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
              <Field label={t('documents.secureLink')} className="workspace-form__wide">
                <input name="url" type="url" value={form.url} onChange={updateField} placeholder={t('documents.linkPlaceholder')} />
              </Field>
              <Field label={t('common.notes')} className="workspace-form__full">
                <textarea name="notes" rows="3" value={form.notes} onChange={updateField} placeholder={t('documents.notesPlaceholder')} />
              </Field>
            </div>
            <div className="workspace-form__actions">
              <Button variant="ghost" onClick={() => setFormOpen(false)}>{t('common.cancel')}</Button>
              <Button type="submit" icon="plus">{t('documents.save')}</Button>
            </div>
          </form>
        </Card>
      )}

      {documents.length > 0 ? (
        <div className="document-grid">
          {documents.map((document) => {
            const safeUrl = normalizeExternalUrl(document.url);
            return (
              <Card key={document.id} className="document-card">
                <div className="document-card__icon"><Icon name={getDocumentIcon(document.type)} size={22} /></div>
                <div className="document-card__content">
                  <small>{getCategoryLabel(DOCUMENT_TYPES, document.type, t)}</small>
                  <h3>{document.title}</h3>
                  {document.reference && <p>{t('documents.reference')} <strong>{document.reference}</strong></p>}
                  {document.expiryDate && <p><Icon name="calendar" size={14} /> {t('documents.expires', { date: formatDate(document.expiryDate, locale) })}</p>}
                  {document.notes && <span>{document.notes}</span>}
                </div>
                <div className="document-card__actions">
                  {safeUrl && (
                    <a className="icon-button icon-button--small" href={safeUrl} target="_blank" rel="noreferrer" aria-label={`${t('documents.open')} ${document.title}`}>
                      <Icon name="externalLink" size={16} />
                    </a>
                  )}
                  <button className="icon-button icon-button--small" type="button" aria-label={`${t('common.delete')} ${document.title}`} onClick={() => removeDocument(document.id)}>
                    <Icon name="trash" size={16} />
                  </button>
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
          <Button icon="plus" onClick={() => setFormOpen(true)}>{t('documents.addFirst')}</Button>
        </section>
      )}
    </div>
  );
}

function Field({ label, className = '', children }) {
  return <label className={`workspace-field ${className}`.trim()}><span>{label}</span>{children}</label>;
}

function getDocumentIcon(type) {
  return { passport: 'shield', ticket: 'ticket', booking: 'receipt', insurance: 'heartPulse', identity: 'userRound', other: 'file' }[type] || 'file';
}

function formatDate(date, locale) {
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' })
    .format(new Date(`${date}T12:00:00`));
}
