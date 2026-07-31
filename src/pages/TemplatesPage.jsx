import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button.jsx';
import { ConfirmDialog } from '../components/common/ConfirmDialog.jsx';
import { Icon } from '../components/common/Icon.jsx';
import { LocationAutocomplete } from '../components/common/LocationAutocomplete.jsx';
import { Modal } from '../components/common/Modal.jsx';
import { TextField } from '../components/common/TextField.jsx';
import { InlineNotice } from '../components/feedback/InlineNotice.jsx';
import { SUPPORTED_CURRENCIES } from '../config/external-services.config.js';
import {
  createBuiltInDayTemplates,
  createBuiltInTripTemplates,
  createChecklistPreset,
} from '../data/builtInTemplates.js';
import { useI18n } from '../hooks/useI18n.js';
import { useTemplates } from '../hooks/useTemplates.js';
import { useTrips } from '../hooks/useTrips.js';

const CHECKLIST_TYPES = ['city', 'road', 'beach', 'business'];

/**
 * Reusable trip and day template library.
 *
 * Templates remain local in V0.1 but use their own repository boundary so a
 * future account-based marketplace can replace storage without changing this
 * page or the trip workspace.
 */
export function TemplatesPage() {
  const navigate = useNavigate();
  const importInputRef = useRef(null);
  const { locale, t } = useI18n();
  const { trips, createTrip, updateTrip } = useTrips();
  const {
    tripTemplates,
    dayTemplates,
    saveTripAsTemplate,
    saveDayFromTrip,
    removeTripTemplate,
    removeDayTemplate,
    materializeTrip,
    applyDayTemplate,
    exportTemplates,
    importTemplates,
  } = useTemplates();
  const builtInTripTemplates = useMemo(() => createBuiltInTripTemplates(t), [t]);
  const builtInDayTemplates = useMemo(() => createBuiltInDayTemplates(t), [t]);
  const activeTrips = useMemo(() => trips.filter((trip) => !trip.archivedAt), [trips]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedDayTemplate, setSelectedDayTemplate] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [notice, setNotice] = useState(null);
  const [isSaveTripOpen, setSaveTripOpen] = useState(false);
  const [isSaveDayOpen, setSaveDayOpen] = useState(false);
  const [isChecklistOpen, setChecklistOpen] = useState(false);
  const [checklistType, setChecklistType] = useState('city');

  async function handleImport(event) {
    const [file] = event.target.files || [];
    event.target.value = '';
    if (!file) return;

    try {
      const result = await importTemplates(file);
      setNotice({
        tone: 'success',
        title: t('templates.importSuccessTitle'),
        message: t('templates.importSuccessText', {
          trips: result.tripTemplateCount,
          days: result.dayTemplateCount,
        }),
      });
    } catch {
      setNotice({ tone: 'error', title: t('templates.importFailedTitle'), message: t('templates.importFailedText') });
    }
  }

  function executeDelete() {
    if (!pendingDelete) return;
    const removed = pendingDelete.kind === 'trip'
      ? removeTripTemplate(pendingDelete.template.id)
      : removeDayTemplate(pendingDelete.template.id);
    if (removed) {
      setNotice({
        tone: 'success',
        title: t('templates.deletedTitle'),
        message: t('templates.deletedText', { name: pendingDelete.template.name }),
      });
    }
    setPendingDelete(null);
  }

  return (
    <div className="page-stack template-library-page">
      <section className="page-heading template-library-heading">
        <div>
          <p className="eyebrow">{t('templates.eyebrow')}</p>
          <h1>{t('templates.title')}</h1>
          <p>{t('templates.intro')}</p>
        </div>
        <div className="template-library-heading__actions">
          <Button variant="secondary" icon="upload" onClick={() => importInputRef.current?.click()}>
            {t('templates.import')}
          </Button>
          <Button variant="secondary" icon="download" onClick={() => {
            exportTemplates();
            setNotice({ tone: 'success', title: t('templates.exportedTitle'), message: t('templates.exportedText') });
          }}>
            {t('templates.export')}
          </Button>
          <input ref={importInputRef} type="file" accept="application/json,.json" hidden onChange={handleImport} />
        </div>
      </section>

      {notice && (
        <InlineNotice tone={notice.tone || 'success'} title={notice.title} className="page-notice">
          {notice.message}
        </InlineNotice>
      )}

      <section className="template-section">
        <header className="template-section__header">
          <div>
            <p className="eyebrow">{t('templates.starterEyebrow')}</p>
            <h2>{t('templates.starterTitle')}</h2>
            <p>{t('templates.starterText')}</p>
          </div>
        </header>
        <div className="template-card-grid">
          {builtInTripTemplates.map((template) => (
            <TripTemplateCard
              key={template.id}
              template={template}
              locale={locale}
              t={t}
              onUse={() => setSelectedTemplate(template)}
            />
          ))}
        </div>
      </section>

      <section className="template-section">
        <header className="template-section__header template-section__header--actions">
          <div>
            <p className="eyebrow">{t('templates.personalEyebrow')}</p>
            <h2>{t('templates.personalTitle')}</h2>
            <p>{t('templates.personalText')}</p>
          </div>
          <Button icon="plus" disabled={activeTrips.length === 0} onClick={() => setSaveTripOpen(true)}>
            {t('templates.saveTrip')}
          </Button>
        </header>

        {tripTemplates.length > 0 ? (
          <div className="template-card-grid">
            {tripTemplates.map((template) => (
              <TripTemplateCard
                key={template.id}
                template={template}
                locale={locale}
                t={t}
                onUse={() => setSelectedTemplate(template)}
                onDelete={() => setPendingDelete({ kind: 'trip', template })}
              />
            ))}
          </div>
        ) : (
          <EmptyTemplateState icon="copy" title={t('templates.noPersonalTitle')} text={t('templates.noPersonalText')} />
        )}
      </section>

      <section className="template-section">
        <header className="template-section__header template-section__header--actions">
          <div>
            <p className="eyebrow">{t('templates.checklistEyebrow')}</p>
            <h2>{t('templates.checklistTitle')}</h2>
            <p>{t('templates.checklistText')}</p>
          </div>
        </header>
        <div className="checklist-preset-grid">
          {CHECKLIST_TYPES.map((type) => (
            <button
              key={type}
              className="checklist-preset-card"
              type="button"
              disabled={activeTrips.length === 0}
              onClick={() => {
                setChecklistType(type);
                setChecklistOpen(true);
              }}
            >
              <span className={`checklist-preset-card__icon checklist-preset-card__icon--${type}`}>
                <Icon name={type === 'road' ? 'car' : type === 'business' ? 'trips' : type === 'beach' ? 'sun' : 'building'} />
              </span>
              <strong>{t(`templates.categories.${type}`)}</strong>
              <span>{t(`templates.checklistPreset.${type}`)}</span>
              <small>{t('templates.applyChecklist')}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="template-section">
        <header className="template-section__header template-section__header--actions">
          <div>
            <p className="eyebrow">{t('templates.dayEyebrow')}</p>
            <h2>{t('templates.dayTitle')}</h2>
            <p>{t('templates.dayText')}</p>
          </div>
          <Button variant="secondary" icon="plus" disabled={!activeTrips.some((trip) => trip.itinerary.length > 0)} onClick={() => setSaveDayOpen(true)}>
            {t('templates.saveDay')}
          </Button>
        </header>

        <div className="day-template-grid">
          {[...builtInDayTemplates, ...dayTemplates].map((template) => (
            <DayTemplateCard
              key={template.id}
              template={template}
              t={t}
              onUse={() => setSelectedDayTemplate(template)}
              onDelete={template.builtIn ? null : () => setPendingDelete({ kind: 'day', template })}
            />
          ))}
        </div>
      </section>

      <CreateFromTemplateDialog
        template={selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
        onCreate={(payload) => {
          const materialized = materializeTrip(selectedTemplate, payload);
          const created = createTrip(materialized.payload);
          updateTrip(created.id, materialized.details);
          setSelectedTemplate(null);
          navigate(`/trips/${created.id}`);
        }}
      />

      <SaveTripTemplateDialog
        isOpen={isSaveTripOpen}
        trips={activeTrips}
        onClose={() => setSaveTripOpen(false)}
        onSave={(trip, options) => {
          const saved = saveTripAsTemplate(trip, options);
          setNotice({ tone: 'success', title: t('templates.savedTitle'), message: t('templates.savedText', { name: saved.name }) });
        }}
      />

      <SaveDayTemplateDialog
        isOpen={isSaveDayOpen}
        trips={activeTrips}
        onClose={() => setSaveDayOpen(false)}
        onSave={(day, options) => {
          const saved = saveDayFromTrip(day, options);
          setNotice({ tone: 'success', title: t('templates.daySavedTitle'), message: t('templates.daySavedText', { name: saved.name }) });
        }}
      />

      <InsertDayDialog
        template={selectedDayTemplate}
        trips={activeTrips}
        onClose={() => setSelectedDayTemplate(null)}
        onInsert={(trip, date) => {
          const itinerary = applyDayTemplate(trip, selectedDayTemplate, date);
          updateTrip(trip.id, { itinerary });
          setSelectedDayTemplate(null);
          setNotice({ tone: 'success', title: t('templates.dayInsertedTitle'), message: t('templates.dayInsertedText', { name: selectedDayTemplate.name, trip: trip.name }) });
        }}
      />

      <ApplyChecklistDialog
        isOpen={isChecklistOpen}
        type={checklistType}
        trips={activeTrips}
        onClose={() => setChecklistOpen(false)}
        onApply={(trip) => {
          const preset = createChecklistPreset(t, checklistType);
          const knownLabels = new Set(trip.checklist.map((item) => item.label.toLocaleLowerCase(locale)));
          const additions = preset
            .filter((item) => !knownLabels.has(item.label.toLocaleLowerCase(locale)))
            .map((item, index) => ({ ...item, id: `preset-${Date.now()}-${index}` }));
          updateTrip(trip.id, { checklist: [...trip.checklist, ...additions] });
          setChecklistOpen(false);
          setNotice({ tone: 'success', title: t('templates.checklistAppliedTitle'), message: t('templates.checklistAppliedText', { count: additions.length, name: trip.name }) });
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        title={t('templates.deleteTitle')}
        description={pendingDelete ? t('templates.deleteText', { name: pendingDelete.template.name }) : ''}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        tone="danger"
        onClose={() => setPendingDelete(null)}
        onConfirm={executeDelete}
      />
    </div>
  );
}

function TripTemplateCard({ template, locale, t, onUse, onDelete }) {
  const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: template.currency || 'EUR', maximumFractionDigits: 0 });
  return (
    <article className={`template-card template-card--${template.accent || 'violet'}`}>
      <div className="template-card__topline">
        <span className="template-card__category">{t(`templates.categories.${template.category}`, { defaultValue: template.category })}</span>
        {template.builtIn && <span className="template-card__badge">{t('templates.builtInBadge')}</span>}
      </div>
      <div>
        <h3>{template.name}</h3>
        <p>{template.description || template.summary || t('templates.noDescription')}</p>
      </div>
      <dl className="template-card__facts">
        <div><dt>{t('templates.duration')}</dt><dd>{t('templates.daysCount', { count: template.durationDays })}</dd></div>
        <div><dt>{t('templates.activities')}</dt><dd>{template.itineraryDays.reduce((sum, day) => sum + day.items.length, 0)}</dd></div>
        <div><dt>{t('templates.checklistItems')}</dt><dd>{template.checklist.length}</dd></div>
        <div><dt>{t('templates.exampleBudget')}</dt><dd>{currencyFormatter.format(template.budget || 0)}</dd></div>
      </dl>
      <footer className="template-card__actions">
        <Button icon="plus" onClick={onUse}>{t('templates.useTemplate')}</Button>
        {onDelete && (
          <button className="icon-button icon-button--danger" type="button" aria-label={t('templates.deleteAria', { name: template.name })} onClick={onDelete}>
            <Icon name="trash" size={18} />
          </button>
        )}
      </footer>
    </article>
  );
}

function DayTemplateCard({ template, t, onUse, onDelete }) {
  return (
    <article className="day-template-card">
      <div className="day-template-card__icon"><Icon name="calendarDays" /></div>
      <div className="day-template-card__content">
        <div className="day-template-card__heading">
          <div>
            <span>{t(`templates.dayCategories.${template.category}`, { defaultValue: template.category })}</span>
            <h3>{template.name}</h3>
          </div>
          {template.builtIn && <span className="template-card__badge">{t('templates.builtInBadge')}</span>}
        </div>
        <p>{template.description || t('templates.noDescription')}</p>
        <ol className="day-template-card__timeline">
          {template.items.slice(0, 4).map((item, index) => (
            <li key={`${item.time}-${item.title}-${index}`}><time>{item.time || '—'}</time><span>{item.title}</span></li>
          ))}
        </ol>
      </div>
      <div className="day-template-card__actions">
        <Button variant="secondary" icon="plus" onClick={onUse}>{t('templates.insertDay')}</Button>
        {onDelete && (
          <button className="icon-button icon-button--danger" type="button" aria-label={t('templates.deleteAria', { name: template.name })} onClick={onDelete}>
            <Icon name="trash" size={18} />
          </button>
        )}
      </div>
    </article>
  );
}

function EmptyTemplateState({ icon, title, text }) {
  return (
    <div className="template-empty-state">
      <span><Icon name={icon} /></span>
      <div><h3>{title}</h3><p>{text}</p></div>
    </div>
  );
}

function CreateFromTemplateDialog({ template, onClose, onCreate }) {
  const { locale, t } = useI18n();
  const [form, setForm] = useState(() => buildCreationForm(template));
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setForm(buildCreationForm(template));
    setSubmitted(false);
  }, [template]);

  if (!template) return null;

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
    if (!form.name.trim() || !form.destination.trim() || !form.startDate) return;
    onCreate({
      ...form,
      travelers: Number(form.travelers),
      budget: Number(form.budget),
      destinationLatitude: form.destinationLatitude === '' ? null : Number(form.destinationLatitude),
      destinationLongitude: form.destinationLongitude === '' ? null : Number(form.destinationLongitude),
    });
  }

  const currencyNames = new Intl.DisplayNames([locale], { type: 'currency' });

  return (
    <Modal isOpen title={t('templates.createTitle', { name: template.name })} description={t('templates.createText')} onClose={onClose}>
      <form className="trip-form" onSubmit={handleSubmit} noValidate>
        <div className="template-dialog-summary">
          <Icon name="copy" />
          <div><strong>{template.name}</strong><span>{t('templates.daysCount', { count: template.durationDays })}</span></div>
        </div>
        <div className="trip-form__grid">
          <TextField id="template-trip-name" name="name" label={t('createTrip.name')} value={form.name} error={submitted && !form.name.trim() ? t('createTrip.nameRequired') : ''} onChange={updateField} />
          <LocationAutocomplete
            id="template-trip-destination"
            label={t('createTrip.destination')}
            value={form.destination}
            error={submitted && !form.destination.trim() ? t('createTrip.destinationRequired') : ''}
            required
            onValueChange={(value) => setForm((current) => ({ ...current, destination: value, destinationLatitude: '', destinationLongitude: '' }))}
            onPlaceSelect={(place) => place && setForm((current) => ({
              ...current,
              destination: place.label,
              destinationLatitude: place.latitude,
              destinationLongitude: place.longitude,
              country: place.country || current.country,
              countryCode: place.countryCode || current.countryCode,
            }))}
          />
          <TextField id="template-start-date" name="startDate" type="date" label={t('createTrip.departure')} value={form.startDate} error={submitted && !form.startDate ? t('createTrip.departureRequired') : ''} onChange={updateField} />
          <TextField id="template-travelers" name="travelers" type="number" min="1" max="30" label={t('createTrip.travellers')} value={form.travelers} onChange={updateField} />
          <TextField id="template-budget" name="budget" type="number" min="0" step="50" label={t('createTrip.budget')} value={form.budget} onChange={updateField} />
          <label className="field">
            <span className="field__label">{t('createTrip.budgetCurrency')}</span>
            <select className="field__input" name="currency" value={form.currency} onChange={updateField}>
              {SUPPORTED_CURRENCIES.map((currency) => <option key={currency.code} value={currency.code}>{currency.code} — {currencyNames.of(currency.code) || currency.label}</option>)}
            </select>
          </label>
        </div>
        <footer className="modal__footer">
          <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" icon="plus">{t('templates.createAction')}</Button>
        </footer>
      </form>
    </Modal>
  );
}

function SaveTripTemplateDialog({ isOpen, trips, onClose, onSave }) {
  const { t } = useI18n();
  const [tripId, setTripId] = useState(trips[0]?.id || '');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('custom');
  const [includeItinerary, setIncludeItinerary] = useState(true);
  const [includeChecklist, setIncludeChecklist] = useState(true);
  const [includeBudget, setIncludeBudget] = useState(false);

  const selectedTrip = trips.find((trip) => trip.id === tripId) || trips[0];

  function handleSubmit(event) {
    event.preventDefault();
    if (!selectedTrip || !name.trim()) return;
    onSave(selectedTrip, { name, description, category, includeItinerary, includeChecklist, includeBudget });
    setName('');
    setDescription('');
    onClose();
  }

  return (
    <Modal isOpen={isOpen} title={t('templates.saveTripTitle')} description={t('templates.saveTripText')} onClose={onClose}>
      <form className="template-form" onSubmit={handleSubmit}>
        <label className="field"><span className="field__label">{t('templates.sourceTrip')}</span><select className="field__input" value={selectedTrip?.id || ''} onChange={(event) => { setTripId(event.target.value); const trip = trips.find((item) => item.id === event.target.value); if (trip && !name) setName(`${trip.name} — ${t('templates.templateSuffix')}`); }}>{trips.map((trip) => <option key={trip.id} value={trip.id}>{trip.name}</option>)}</select></label>
        <TextField id="trip-template-name" label={t('templates.templateName')} value={name} required onChange={(event) => setName(event.target.value)} />
        <label className="field"><span className="field__label">{t('templates.description')}</span><textarea className="field__input" rows="3" value={description} onChange={(event) => setDescription(event.target.value)} /></label>
        <label className="field"><span className="field__label">{t('templates.category')}</span><select className="field__input" value={category} onChange={(event) => setCategory(event.target.value)}>{['custom', ...CHECKLIST_TYPES].map((item) => <option key={item} value={item}>{t(`templates.categories.${item}`)}</option>)}</select></label>
        <div className="template-option-list">
          <label><input type="checkbox" checked={includeItinerary} onChange={(event) => setIncludeItinerary(event.target.checked)} /> <span><strong>{t('templates.includeItinerary')}</strong><small>{t('templates.includeItineraryText')}</small></span></label>
          <label><input type="checkbox" checked={includeChecklist} onChange={(event) => setIncludeChecklist(event.target.checked)} /> <span><strong>{t('templates.includeChecklist')}</strong><small>{t('templates.includeChecklistText')}</small></span></label>
          <label><input type="checkbox" checked={includeBudget} onChange={(event) => setIncludeBudget(event.target.checked)} /> <span><strong>{t('templates.includeBudget')}</strong><small>{t('templates.includeBudgetText')}</small></span></label>
        </div>
        <footer className="modal__footer"><Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button><Button type="submit" icon="save" disabled={!selectedTrip || !name.trim()}>{t('templates.saveTemplate')}</Button></footer>
      </form>
    </Modal>
  );
}

function SaveDayTemplateDialog({ isOpen, trips, onClose, onSave }) {
  const { t } = useI18n();
  const tripsWithDays = trips.filter((trip) => trip.itinerary.length > 0);
  const [tripId, setTripId] = useState(tripsWithDays[0]?.id || '');
  const selectedTrip = tripsWithDays.find((trip) => trip.id === tripId) || tripsWithDays[0];
  const [dayId, setDayId] = useState(selectedTrip?.itinerary[0]?.id || '');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('custom');
  const selectedDay = selectedTrip?.itinerary.find((day) => day.id === dayId) || selectedTrip?.itinerary[0];

  function selectTrip(nextTripId) {
    const trip = tripsWithDays.find((item) => item.id === nextTripId);
    setTripId(nextTripId);
    setDayId(trip?.itinerary[0]?.id || '');
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!selectedDay || !name.trim()) return;
    onSave(selectedDay, { name, description, category });
    setName('');
    setDescription('');
    onClose();
  }

  return (
    <Modal isOpen={isOpen} title={t('templates.saveDayTitle')} description={t('templates.saveDayText')} onClose={onClose}>
      <form className="template-form" onSubmit={handleSubmit}>
        <label className="field"><span className="field__label">{t('templates.sourceTrip')}</span><select className="field__input" value={selectedTrip?.id || ''} onChange={(event) => selectTrip(event.target.value)}>{tripsWithDays.map((trip) => <option key={trip.id} value={trip.id}>{trip.name}</option>)}</select></label>
        <label className="field"><span className="field__label">{t('templates.sourceDay')}</span><select className="field__input" value={selectedDay?.id || ''} onChange={(event) => setDayId(event.target.value)}>{(selectedTrip?.itinerary || []).map((day) => <option key={day.id} value={day.id}>{day.date} — {day.title || t('templates.untitledDay')}</option>)}</select></label>
        <TextField id="day-template-name" label={t('templates.templateName')} value={name} required onChange={(event) => setName(event.target.value)} />
        <label className="field"><span className="field__label">{t('templates.description')}</span><textarea className="field__input" rows="3" value={description} onChange={(event) => setDescription(event.target.value)} /></label>
        <label className="field"><span className="field__label">{t('templates.category')}</span><select className="field__input" value={category} onChange={(event) => setCategory(event.target.value)}>{['custom', 'arrival', 'culture', 'relaxed'].map((item) => <option key={item} value={item}>{t(`templates.dayCategories.${item}`)}</option>)}</select></label>
        <footer className="modal__footer"><Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button><Button type="submit" icon="save" disabled={!selectedDay || !name.trim()}>{t('templates.saveTemplate')}</Button></footer>
      </form>
    </Modal>
  );
}

function InsertDayDialog({ template, trips, onClose, onInsert }) {
  const { t } = useI18n();
  const [tripId, setTripId] = useState(trips[0]?.id || '');
  const selectedTrip = trips.find((trip) => trip.id === tripId) || trips[0];
  const [date, setDate] = useState(selectedTrip?.startDate || '');
  if (!template) return null;

  return (
    <Modal isOpen title={t('templates.insertDayTitle', { name: template.name })} description={t('templates.insertDayText')} onClose={onClose}>
      <form className="template-form" onSubmit={(event) => { event.preventDefault(); if (selectedTrip && date) onInsert(selectedTrip, date); }}>
        <label className="field"><span className="field__label">{t('templates.targetTrip')}</span><select className="field__input" value={selectedTrip?.id || ''} onChange={(event) => { const trip = trips.find((item) => item.id === event.target.value); setTripId(event.target.value); setDate(trip?.startDate || ''); }}>{trips.map((trip) => <option key={trip.id} value={trip.id}>{trip.name}</option>)}</select></label>
        <TextField id="day-template-date" type="date" label={t('templates.targetDate')} value={date} min={selectedTrip?.startDate || undefined} max={selectedTrip?.endDate || undefined} onChange={(event) => setDate(event.target.value)} />
        <div className="template-dialog-summary"><Icon name="calendarDays" /><div><strong>{template.name}</strong><span>{t('templates.activityCount', { count: template.items.length })}</span></div></div>
        <footer className="modal__footer"><Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button><Button type="submit" icon="plus" disabled={!selectedTrip || !date}>{t('templates.insertDay')}</Button></footer>
      </form>
    </Modal>
  );
}

function ApplyChecklistDialog({ isOpen, type, trips, onClose, onApply }) {
  const { t } = useI18n();
  const [tripId, setTripId] = useState(trips[0]?.id || '');
  const selectedTrip = trips.find((trip) => trip.id === tripId) || trips[0];
  const preset = createChecklistPreset(t, type);

  return (
    <Modal isOpen={isOpen} title={t('templates.applyChecklistTitle', { type: t(`templates.categories.${type}`) })} description={t('templates.applyChecklistText')} onClose={onClose}>
      <div className="template-form">
        <label className="field"><span className="field__label">{t('templates.targetTrip')}</span><select className="field__input" value={selectedTrip?.id || ''} onChange={(event) => setTripId(event.target.value)}>{trips.map((trip) => <option key={trip.id} value={trip.id}>{trip.name}</option>)}</select></label>
        <ul className="checklist-preset-preview">{preset.map((item) => <li key={`${item.category}-${item.label}`}><Icon name="checkCircle" size={17} /><span>{item.label}</span></li>)}</ul>
        <footer className="modal__footer"><Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button><Button icon="check" disabled={!selectedTrip} onClick={() => onApply(selectedTrip)}>{t('templates.applyChecklist')}</Button></footer>
      </div>
    </Modal>
  );
}

function buildCreationForm(template) {
  return {
    name: template ? `${template.name}` : '',
    destination: '',
    destinationLatitude: '',
    destinationLongitude: '',
    country: '',
    countryCode: '',
    startDate: '',
    travelers: template?.travelers || 2,
    budget: template?.budget || 0,
    currency: template?.currency || 'EUR',
    destinationCurrency: template?.destinationCurrency || template?.currency || 'EUR',
    accent: template?.accent || 'violet',
    summary: template?.summary || '',
  };
}
