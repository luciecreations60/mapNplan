import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../hooks/useI18n.js';
import { reservationDocumentImportService } from '../../services/import/ReservationDocumentImportService.js';
import { findLikelyDuplicateReservation } from '../../utils/reservationImport.js';
import { formatCurrency } from '../../utils/currency.js';
import { RESERVATION_STATUSES, RESERVATION_TYPES, getCategoryLabel } from '../../utils/tripWorkspace.js';
import { Button } from '../common/Button.jsx';
import { Icon } from '../common/Icon.jsx';
import { LocationAutocomplete } from '../common/LocationAutocomplete.jsx';
import { Modal } from '../common/Modal.jsx';
import { InlineNotice } from '../feedback/InlineNotice.jsx';

const EMPTY_DRAFT = Object.freeze({
  type: 'activity', status: 'confirmed', title: '', provider: '', confirmationNumber: '',
  startDate: '', startTime: '', endDate: '', endTime: '', location: '', amount: 0,
  detectedCurrency: '', url: '', latitude: null, longitude: null, notes: '', warnings: [], extractedText: '',
});

export function ReservationImportDialog({ isOpen, trip, onClose, onConfirm }) {
  const { language, locale, t } = useI18n();
  const [file, setFile] = useState(null);
  const [draft, setDraft] = useState({ ...EMPTY_DRAFT });
  const [analysisResult, setAnalysisResult] = useState(null);
  const [stage, setStage] = useState('select');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [isDragging, setDragging] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [duplicateConfirmed, setDuplicateConfirmed] = useState(false);
  const [targets, setTargets] = useState({ itinerary: true, expense: true, document: true });
  const inputRef = useRef(null);

  const duplicate = useMemo(
    () => analysisResult ? findLikelyDuplicateReservation(trip.reservations, draft) : null,
    [analysisResult, draft, trip.reservations],
  );

  useEffect(() => {
    if (isOpen) return;
    setFile(null);
    setDraft({ ...EMPTY_DRAFT });
    setAnalysisResult(null);
    setStage('select');
    setProgress(0);
    setError('');
    setDragging(false);
    setSaving(false);
    setDuplicateConfirmed(false);
    setTargets({ itinerary: true, expense: true, document: true });
  }, [isOpen]);

  function updateDraft(event) {
    const { name, value } = event.target;
    setDraft((current) => ({
      ...current,
      [name]: name === 'amount' ? value : value,
    }));
  }

  function updateTarget(name) {
    setTargets((current) => ({ ...current, [name]: !current[name] }));
  }

  async function selectFile(selectedFile) {
    if (!selectedFile) return;
    setFile(selectedFile);
    setAnalysisResult(null);
    setDraft({ ...EMPTY_DRAFT });
    setError('');
    setDuplicateConfirmed(false);
    setProgress(0);
    setStage('analyzing');

    try {
      const result = await reservationDocumentImportService.analyze(selectedFile, {
        currency: trip.currency,
        tripStartDate: trip.startDate,
        tripEndDate: trip.endDate,
        language,
        onProgress: ({ stage: nextStage, progress: nextProgress }) => {
          setStage(nextStage || 'analyzing');
          setProgress(Math.max(0, Math.min(1, Number(nextProgress) || 0)));
        },
      });
      setAnalysisResult(result);
      setDraft({ ...EMPTY_DRAFT, ...result.draft, amount: result.draft.amount > 0 ? String(result.draft.amount) : '' });
      setTargets({
        itinerary: Boolean(result.draft.startDate),
        expense: Number(result.draft.amount) > 0,
        document: true,
      });
      setStage('review');
      setProgress(1);
    } catch (analysisError) {
      setStage('select');
      setError(analysisError?.message || t('reservations.importErrorText'));
    }
  }

  async function confirmImport() {
    if (!file || !draft.title.trim() || isSaving) return;
    setSaving(true);
    setError('');
    try {
      await onConfirm({
        file,
        draft: {
          ...draft,
          title: draft.title.trim(),
          provider: draft.provider.trim(),
          confirmationNumber: draft.confirmationNumber.trim(),
          location: draft.location.trim(),
          amount: Math.max(0, Number(String(draft.amount).replace(',', '.')) || 0),
          notes: draft.notes.trim(),
          latitude: draft.latitude === '' || draft.latitude === null ? null : Number(draft.latitude),
          longitude: draft.longitude === '' || draft.longitude === null ? null : Number(draft.longitude),
        },
        targets,
        extractionMethod: analysisResult?.extractionMethod || '',
      });
      onClose();
    } catch (saveError) {
      setError(saveError?.message || t('reservations.importSaveErrorText'));
    } finally {
      setSaving(false);
    }
  }

  const stageLabel = t(`reservations.importStages.${stage}`);
  const currencyMismatch = draft.detectedCurrency && trip.currency && draft.detectedCurrency !== trip.currency;

  return (
    <Modal
      isOpen={isOpen}
      title={t('reservations.importTitle')}
      description={t('reservations.importDescription')}
      onClose={isSaving ? () => {} : onClose}
      size="large"
    >
      <div className="reservation-import">
        {error && <InlineNotice tone="danger" title={t('reservations.importErrorTitle')}>{error}</InlineNotice>}

        {!analysisResult ? (
          <>
            <button
              type="button"
              className={`reservation-import-dropzone${isDragging ? ' reservation-import-dropzone--dragging' : ''}`}
              onClick={() => inputRef.current?.click()}
              onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
              onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
              onDragLeave={(event) => { event.preventDefault(); setDragging(false); }}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                selectFile(event.dataTransfer.files?.[0]);
              }}
              disabled={stage !== 'select'}
            >
              <span className="reservation-import-dropzone__icon"><Icon name="upload" size={28} /></span>
              <strong>{t('reservations.importDropTitle')}</strong>
              <span>{t('reservations.importDropText')}</span>
              <small>{t('reservations.importSupported')}</small>
            </button>
            <input
              ref={inputRef}
              className="sr-only"
              type="file"
              accept="application/pdf,image/*,.txt,text/plain"
              onChange={(event) => {
                const selected = event.target.files?.[0];
                event.target.value = '';
                selectFile(selected);
              }}
            />

            {stage !== 'select' && (
              <div className="reservation-import-progress" aria-live="polite">
                <div className="reservation-import-progress__row">
                  <span><Icon name="sparkles" size={17} /> {stageLabel}</span>
                  <strong>{Math.round(progress * 100)}%</strong>
                </div>
                <progress max="1" value={progress} />
                {file && <small>{file.name}</small>}
              </div>
            )}

            <div className="reservation-import-privacy">
              <Icon name="shield" size={18} />
              <p><strong>{t('reservations.importLocalTitle')}</strong><span>{t('reservations.importLocalText')}</span></p>
            </div>
          </>
        ) : (
          <>
            <div className="reservation-import-filebar">
              <span><Icon name={file?.type?.startsWith('image/') ? 'fileImage' : 'fileText'} size={20} /></span>
              <div><strong>{file?.name}</strong><small>{t(`reservations.importMethods.${analysisResult.extractionMethod}`)}</small></div>
              <Button variant="ghost" size="small" icon="refresh" onClick={() => { setAnalysisResult(null); setFile(null); setDraft({ ...EMPTY_DRAFT }); setStage('select'); }}>{t('reservations.importAnother')}</Button>
            </div>

            <InlineNotice tone="info" title={t('reservations.importReviewTitle')}>{t('reservations.importReviewText')}</InlineNotice>
            {duplicate && (
              <div className="reservation-import-duplicate">
                <InlineNotice tone="warning" title={t('reservations.importDuplicateTitle')}>
                  {t('reservations.importDuplicateText', { name: duplicate.reservation.title })}
                </InlineNotice>
                <label><input type="checkbox" checked={duplicateConfirmed} onChange={(event) => setDuplicateConfirmed(event.target.checked)} /> <span>{t('reservations.importDuplicateConfirm')}</span></label>
              </div>
            )}
            {currencyMismatch && (
              <InlineNotice tone="warning" title={t('reservations.importCurrencyTitle')}>
                {t('reservations.importCurrencyText', { detected: draft.detectedCurrency, trip: trip.currency })}
              </InlineNotice>
            )}

            <div className="reservation-import-review-grid">
              <Field label={t('reservations.type')}>
                <select name="type" value={draft.type} onChange={updateDraft}>
                  {RESERVATION_TYPES.map((type) => <option key={type.id} value={type.id}>{getCategoryLabel(RESERVATION_TYPES, type.id, t)}</option>)}
                </select>
              </Field>
              <Field label={t('common.status')}>
                <select name="status" value={draft.status} onChange={updateDraft}>
                  {RESERVATION_STATUSES.map((status) => <option key={status.id} value={status.id}>{getCategoryLabel(RESERVATION_STATUSES, status.id, t)}</option>)}
                </select>
              </Field>
              <Field label={t('reservations.titleLabel')} className="workspace-form__wide"><input name="title" value={draft.title} onChange={updateDraft} required /></Field>
              <Field label={t('common.provider')}><input name="provider" value={draft.provider} onChange={updateDraft} /></Field>
              <Field label={t('reservations.confirmationNumber')}><input name="confirmationNumber" value={draft.confirmationNumber} onChange={updateDraft} /></Field>
              <LocationAutocomplete
                id="reservation-import-location"
                variant="workspace"
                className="workspace-form__wide"
                label={t('common.location')}
                value={draft.location}
                placeholder={t('reservations.locationPlaceholder')}
                bias={{ latitude: trip.destinationLatitude, longitude: trip.destinationLongitude }}
                hint={t('placeSearch.locationHint')}
                onValueChange={(value) => setDraft((current) => ({ ...current, location: value, latitude: null, longitude: null }))}
                onPlaceSelect={(place) => place && setDraft((current) => ({
                  ...current,
                  location: place.label,
                  title: current.title.trim() ? current.title : (place.name || place.primaryLabel || place.label),
                  latitude: place.latitude,
                  longitude: place.longitude,
                }))}
              />
              <Field label={t('reservations.startDate')}><input name="startDate" type="date" value={draft.startDate} onChange={updateDraft} /></Field>
              <Field label={t('reservations.startTime')}><input name="startTime" type="time" value={draft.startTime} onChange={updateDraft} /></Field>
              <Field label={t('reservations.endDate')}><input name="endDate" type="date" value={draft.endDate} onChange={updateDraft} /></Field>
              <Field label={t('reservations.endTime')}><input name="endTime" type="time" value={draft.endTime} onChange={updateDraft} /></Field>
              <Field label={`${t('tools.amount')} (${trip.currency})`}><input name="amount" inputMode="decimal" value={draft.amount} onChange={updateDraft} /></Field>
              <Field label={t('reservations.bookingLink')}><input name="url" type="url" value={draft.url} onChange={updateDraft} /></Field>
              <Field label={t('common.notes')} className="workspace-form__full"><textarea name="notes" rows="3" value={draft.notes} onChange={updateDraft} /></Field>
            </div>

            <section className="reservation-import-targets" aria-labelledby="reservation-import-targets-title">
              <div>
                <p className="eyebrow">{t('reservations.importTargetsEyebrow')}</p>
                <h3 id="reservation-import-targets-title">{t('reservations.importTargetsTitle')}</h3>
                <p>{t('reservations.importTargetsText')}</p>
              </div>
              <div className="reservation-import-targets__grid">
                <Target icon="ticket" title={t('reservations.importTargetReservation')} text={t('reservations.importTargetReservationText')} checked disabled />
                <Target icon="calendarDays" title={t('reservations.importTargetItinerary')} text={t('reservations.importTargetItineraryText')} checked={targets.itinerary} disabled={!draft.startDate} onChange={() => updateTarget('itinerary')} />
                <Target icon="wallet" title={t('reservations.importTargetExpense')} text={t('reservations.importTargetExpenseText')} checked={targets.expense} disabled={Number(String(draft.amount).replace(',', '.')) <= 0} onChange={() => updateTarget('expense')} />
                <Target icon="folder" title={t('reservations.importTargetDocument')} text={t('reservations.importTargetDocumentText')} checked={targets.document} onChange={() => updateTarget('document')} />
              </div>
            </section>

            {Number(String(draft.amount).replace(',', '.')) > 0 && (
              <p className="reservation-import-amount-note">
                <Icon name="wallet" size={15} /> {t('reservations.importExpensePreview', { amount: formatCurrency(Number(String(draft.amount).replace(',', '.')) || 0, trip.currency, locale) })}
              </p>
            )}

            <details className="reservation-import-source">
              <summary>{t('reservations.importShowExtracted')}</summary>
              <pre>{analysisResult.extractedText}</pre>
            </details>

            <div className="workspace-form__actions reservation-import__actions">
              <Button variant="ghost" onClick={onClose} disabled={isSaving}>{t('common.cancel')}</Button>
              <Button icon="check" onClick={confirmImport} disabled={!draft.title.trim() || isSaving || (Boolean(duplicate) && !duplicateConfirmed)}>
                {isSaving ? t('common.loading') : t('reservations.importConfirm')}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

function Field({ label, className = '', children }) {
  return <label className={`workspace-field ${className}`.trim()}><span>{label}</span>{children}</label>;
}

function Target({ icon, title, text, checked, disabled = false, onChange = null }) {
  return (
    <label className={`reservation-import-target${disabled ? ' reservation-import-target--disabled' : ''}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={onChange || (() => {})} />
      <span className="reservation-import-target__icon"><Icon name={icon} size={18} /></span>
      <span><strong>{title}</strong><small>{text}</small></span>
    </label>
  );
}
