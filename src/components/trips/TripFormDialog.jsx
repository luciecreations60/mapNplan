import { useEffect, useMemo, useState } from 'react';
import { SUPPORTED_CURRENCIES } from '../../config/external-services.config.js';
import { useI18n } from '../../hooks/useI18n.js';
import { Button } from '../common/Button.jsx';
import { LocationAutocomplete } from '../common/LocationAutocomplete.jsx';
import { Modal } from '../common/Modal.jsx';
import { TextField } from '../common/TextField.jsx';

const EMPTY_FORM = Object.freeze({
  name: '',
  destination: '',
  destinationLatitude: '',
  destinationLongitude: '',
  country: '',
  countryCode: '',
  startDate: '',
  endDate: '',
  travelers: 2,
  budget: 0,
  currency: 'EUR',
  destinationCurrency: 'EUR',
  accent: 'violet',
  summary: '',
  coverImageUrl: '',
});

const ACCENTS = Object.freeze(['violet', 'aqua', 'coral']);

/**
 * Shared trip form used for both creation and edition.
 * Keeping a single form avoids validation and field drift between workflows.
 */
export function TripFormDialog({ isOpen, mode = 'create', trip = null, onSubmit, onClose }) {
  const { locale, t } = useI18n();
  const currencyNames = useMemo(
    () => new Intl.DisplayNames([locale], { type: 'currency' }),
    [locale],
  );
  const [form, setForm] = useState(() => buildForm(trip));
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm(buildForm(trip));
    setSubmitted(false);
  }, [isOpen, trip]);

  const errors = useMemo(() => ({
    name: !form.name.trim() ? t('createTrip.nameRequired') : '',
    destination: !form.destination.trim() ? t('createTrip.destinationRequired') : '',
    startDate: !form.startDate ? t('createTrip.departureRequired') : '',
    endDate: !form.endDate
      ? t('createTrip.returnRequired')
      : form.startDate && form.endDate < form.startDate
        ? t('createTrip.dateOrder')
        : '',
  }), [form, t]);

  const hasErrors = Object.values(errors).some(Boolean);
  const isEdit = mode === 'edit';

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleClose() {
    setSubmitted(false);
    onClose();
  }

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
    if (hasErrors) return;

    onSubmit({
      ...form,
      name: form.name.trim(),
      destination: form.destination.trim(),
      destinationLatitude: form.destinationLatitude === '' ? null : Number(form.destinationLatitude),
      destinationLongitude: form.destinationLongitude === '' ? null : Number(form.destinationLongitude),
      country: form.country.trim(),
      countryCode: form.countryCode.trim().toUpperCase(),
      travelers: Math.max(1, Number(form.travelers) || 1),
      budget: Math.max(0, Number(form.budget) || 0),
      summary: form.summary.trim(),
      coverImageUrl: form.coverImageUrl.trim(),
    });
    handleClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      title={t(isEdit ? 'editTrip.title' : 'createTrip.title')}
      description={t(isEdit ? 'editTrip.description' : 'createTrip.description')}
      onClose={handleClose}
    >
      <form className="trip-form" onSubmit={handleSubmit} noValidate>
        <div className="trip-form__grid">
          <TextField id="trip-name" label={t('createTrip.name')} name="name" placeholder={t('createTrip.namePlaceholder')} value={form.name} error={submitted ? errors.name : ''} onChange={updateField} />
          <LocationAutocomplete
            id="trip-destination"
            label={t('createTrip.destination')}
            value={form.destination}
            placeholder={t('createTrip.destinationPlaceholder')}
            error={submitted ? errors.destination : ''}
            required
            hint={t('placeSearch.destinationHint')}
            onValueChange={(value) => setForm((current) => ({
              ...current,
              destination: value,
              destinationLatitude: '',
              destinationLongitude: '',
            }))}
            onPlaceSelect={(place) => {
              if (!place) return;
              setForm((current) => ({
                ...current,
                destination: place.label,
                destinationLatitude: place.latitude,
                destinationLongitude: place.longitude,
                country: place.country || current.country,
                countryCode: place.countryCode || current.countryCode,
              }));
            }}
          />
          <TextField id="trip-country" label={t('createTrip.country')} name="country" placeholder={t('createTrip.countryPlaceholder')} value={form.country} onChange={updateField} />
          <TextField id="trip-country-code" label={t('editTrip.countryCode')} name="countryCode" placeholder="FR, JP, US…" maxLength="3" value={form.countryCode} onChange={updateField} />
          <TextField id="trip-travelers" label={t('createTrip.travellers')} name="travelers" type="number" min="1" max="30" value={form.travelers} onChange={updateField} />
          <TextField id="trip-start" label={t('createTrip.departure')} name="startDate" type="date" value={form.startDate} error={submitted ? errors.startDate : ''} onChange={updateField} />
          <TextField id="trip-end" label={t('createTrip.return')} name="endDate" type="date" value={form.endDate} error={submitted ? errors.endDate : ''} onChange={updateField} />
          <TextField id="trip-budget" label={t('createTrip.budget')} name="budget" type="number" min="0" step="50" value={form.budget} onChange={updateField} />

          <div className="field">
            <label className="field__label" htmlFor="trip-currency">{t('createTrip.budgetCurrency')}</label>
            <select id="trip-currency" className="field__input" name="currency" value={form.currency} onChange={updateField}>
              {SUPPORTED_CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} — {currencyNames.of(currency.code) || currency.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="trip-destination-currency">{t('createTrip.destinationCurrency')}</label>
            <select id="trip-destination-currency" className="field__input" name="destinationCurrency" value={form.destinationCurrency} onChange={updateField}>
              {SUPPORTED_CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} — {currencyNames.of(currency.code) || currency.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="trip-accent">{t('editTrip.accent')}</label>
            <select id="trip-accent" className="field__input" name="accent" value={form.accent} onChange={updateField}>
              {ACCENTS.map((accent) => (
                <option key={accent} value={accent}>{t(`editTrip.accents.${accent}`)}</option>
              ))}
            </select>
          </div>

          <div className="field trip-form__full">
            <label className="field__label" htmlFor="trip-cover-image">{t('editTrip.coverImage')}</label>
            <input id="trip-cover-image" className="field__input" name="coverImageUrl" type="url" value={form.coverImageUrl} onChange={updateField} placeholder={t('editTrip.coverImagePlaceholder')} />
          </div>

          <div className="field trip-form__full">
            <label className="field__label" htmlFor="trip-summary">{t('editTrip.summary')}</label>
            <textarea id="trip-summary" className="field__input" name="summary" rows="3" value={form.summary} onChange={updateField} placeholder={t('editTrip.summaryPlaceholder')} />
          </div>
        </div>

        <footer className="modal__footer">
          <Button variant="ghost" onClick={handleClose}>{t('common.cancel')}</Button>
          <Button type="submit" icon={isEdit ? 'save' : 'plus'}>
            {t(isEdit ? 'editTrip.submit' : 'createTrip.submit')}
          </Button>
        </footer>
      </form>
    </Modal>
  );
}

function buildForm(trip) {
  if (!trip) return { ...EMPTY_FORM };
  return {
    name: trip.name || '',
    destination: trip.destination || '',
    destinationLatitude: trip.destinationLatitude ?? '',
    destinationLongitude: trip.destinationLongitude ?? '',
    country: trip.country || '',
    countryCode: trip.countryCode || '',
    startDate: trip.startDate || '',
    endDate: trip.endDate || '',
    travelers: trip.travelers || 1,
    budget: trip.budget || 0,
    currency: trip.currency || 'EUR',
    destinationCurrency: trip.destinationCurrency || trip.currency || 'EUR',
    accent: trip.accent || 'violet',
    summary: trip.summary || '',
    coverImageUrl: trip.coverImageUrl || '',
  };
}
