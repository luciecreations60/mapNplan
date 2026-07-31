import { useMemo, useState } from 'react';
import { Button } from '../common/Button.jsx';
import { Card } from '../common/Card.jsx';
import { Icon } from '../common/Icon.jsx';
import { createId } from '../../utils/id.js';
import { normalizeExternalUrl } from '../../utils/url.js';
import { DOCUMENT_TYPES, getCategoryLabel } from '../../utils/tripWorkspace.js';

const EMPTY_FORM = {
  type: 'booking',
  title: '',
  reference: '',
  url: '',
  expiryDate: '',
  notes: '',
};

export function DocumentsPanel({ trip, onUpdate }) {
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

    const document = {
      id: createId('document'),
      type: form.type,
      title: form.title.trim(),
      reference: form.reference.trim(),
      url: normalizeExternalUrl(form.url),
      expiryDate: form.expiryDate,
      notes: form.notes.trim(),
      createdAt: new Date().toISOString(),
    };

    onUpdate({ documents: [...trip.documents, document] });
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
          <p className="eyebrow">Travel wallet</p>
          <h2>Documents</h2>
          <p>Keep safe links and references together. Binary file storage will arrive with user accounts.</p>
        </div>
        <Button icon={isFormOpen ? 'close' : 'plus'} onClick={() => setFormOpen((value) => !value)}>
          {isFormOpen ? 'Close' : 'Add document'}
        </Button>
      </section>

      {isFormOpen && (
        <Card className="workspace-form-card">
          <form className="workspace-form" onSubmit={submitDocument}>
            <div className="workspace-form__grid">
              <Field label="Document type">
                <select name="type" value={form.type} onChange={updateField}>
                  {DOCUMENT_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
                </select>
              </Field>
              <Field label="Title" className="workspace-form__wide">
                <input name="title" value={form.title} onChange={updateField} placeholder="Travel insurance, boarding pass…" required />
              </Field>
              <Field label="Reference">
                <input name="reference" value={form.reference} onChange={updateField} placeholder="Optional number or identifier" />
              </Field>
              <Field label="Expiry date">
                <input name="expiryDate" type="date" value={form.expiryDate} onChange={updateField} />
              </Field>
              <Field label="Secure link" className="workspace-form__wide">
                <input name="url" type="url" value={form.url} onChange={updateField} placeholder="https://…" />
              </Field>
              <Field label="Notes" className="workspace-form__full">
                <textarea name="notes" rows="3" value={form.notes} onChange={updateField} placeholder="Where the original is stored, emergency contact…" />
              </Field>
            </div>
            <div className="workspace-form__actions">
              <Button variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button type="submit" icon="plus">Save document</Button>
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
                  <small>{getCategoryLabel(DOCUMENT_TYPES, document.type)}</small>
                  <h3>{document.title}</h3>
                  {document.reference && <p>Reference: <strong>{document.reference}</strong></p>}
                  {document.expiryDate && <p><Icon name="calendar" size={14} /> Expires {formatDate(document.expiryDate)}</p>}
                  {document.notes && <span>{document.notes}</span>}
                </div>
                <div className="document-card__actions">
                  {safeUrl && (
                    <a className="icon-button icon-button--small" href={safeUrl} target="_blank" rel="noreferrer" aria-label={`Open ${document.title}`}>
                      <Icon name="externalLink" size={16} />
                    </a>
                  )}
                  <button className="icon-button icon-button--small" type="button" aria-label={`Delete ${document.title}`} onClick={() => removeDocument(document.id)}>
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
          <h3>Your travel wallet is empty</h3>
          <p>Save useful document links and references before departure.</p>
          <Button icon="plus" onClick={() => setFormOpen(true)}>Add first document</Button>
        </section>
      )}
    </div>
  );
}

function Field({ label, className = '', children }) {
  return (
    <label className={`workspace-field ${className}`.trim()}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function getDocumentIcon(type) {
  return {
    passport: 'shield',
    ticket: 'ticket',
    booking: 'receipt',
    insurance: 'heartPulse',
    identity: 'userRound',
    other: 'file',
  }[type] || 'file';
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' })
    .format(new Date(`${date}T12:00:00`));
}
