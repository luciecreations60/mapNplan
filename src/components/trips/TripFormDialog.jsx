import { useEffect, useMemo, useState } from 'react';
import { SUPPORTED_CURRENCIES } from '../../config/external-services.config.js';
import { useI18n } from '../../hooks/useI18n.js';
import { geocodingService } from '../../services/geocoding/GeocodingService.js';
import { createTripCoverDataUrl } from '../../utils/image.js';
import { Button } from '../common/Button.jsx';
import { DateRangeField } from '../common/DateRangeField.jsx';
import { LocationAutocomplete } from '../common/LocationAutocomplete.jsx';
import { Modal } from '../common/Modal.jsx';
import { TextField } from '../common/TextField.jsx';
import { InlineNotice } from '../feedback/InlineNotice.jsx';
import { TripAccentPicker } from './TripAccentPicker.jsx';

const EMPTY_FORM = Object.freeze({
  name: '', destination: '', destinationLatitude: '', destinationLongitude: '',
  country: '', countryCode: '', startDate: '', endDate: '', travelers: 1,
  budget: 0, currency: 'EUR', destinationCurrency: 'EUR', accent: 'violet',
  summary: '', coverImageUrl: '',
});

/** Shared trip form used for both creation and edition. */
export function TripFormDialog({ isOpen, mode = 'create', trip = null, initialValues = null, onSubmit, onClose }) {
  const { language, locale, t } = useI18n();
  const currencyNames = useMemo(() => new Intl.DisplayNames([locale], { type: 'currency' }), [locale]);
  const [form, setForm] = useState(() => buildForm(trip, initialValues));
  const [submitted, setSubmitted] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [coverError, setCoverError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setForm(buildForm(trip, initialValues));
    setSubmitted(false);
    setSaving(false);
    setCoverError('');
  }, [initialValues, isOpen, trip]);

  const errors = useMemo(() => ({
    name: !form.name.trim() ? t('createTrip.nameRequired') : '',
    destination: !form.destination.trim() ? t('createTrip.destinationRequired') : '',
    startDate: !form.startDate ? t('createTrip.departureRequired') : '',
    endDate: !form.endDate
      ? t('createTrip.returnRequired')
      : form.startDate && form.endDate < form.startDate
        ? t('createTrip.dateOrder') : '',
  }), [form, t]);
  const hasErrors = Object.values(errors).some(Boolean);
  const isEdit = mode === 'edit';

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleClose() {
    if (isSaving) return;
    setSubmitted(false);
    onClose();
  }

  async function selectCoverFile(event) {
    const [file] = [...(event.target.files || [])];
    event.target.value = '';
    if (!file) return;
    setCoverError('');
    try {
      const coverImageUrl = await createTripCoverDataUrl(file);
      setForm((current) => ({ ...current, coverImageUrl }));
    } catch (error) {
      setCoverError(t(error.message === 'image-too-large' ? 'editTrip.coverTooLarge' : 'editTrip.coverInvalid'));
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
    if (hasErrors || isSaving) return;
    setSaving(true);

    let destinationLatitude = form.destinationLatitude === '' ? null : Number(form.destinationLatitude);
    let destinationLongitude = form.destinationLongitude === '' ? null : Number(form.destinationLongitude);
    let country = form.country.trim();
    let countryCode = form.countryCode.trim().toUpperCase();

    if (!Number.isFinite(destinationLatitude) || !Number.isFinite(destinationLongitude)) {
      try {
        const [place] = await geocodingService.search(form.destination, {
          language,
          limit: 1,
          countryCode,
        });
        if (place) {
          destinationLatitude = place.latitude;
          destinationLongitude = place.longitude;
          country ||= place.country || '';
          countryCode ||= place.countryCode || '';
        }
      } catch {
        // A typed destination remains valid even when the public geocoder is temporarily unavailable.
      }
    }

    try {
      await onSubmit({
        ...form,
        name: form.name.trim(),
        destination: form.destination.trim(),
        destinationLatitude,
        destinationLongitude,
        country,
        countryCode,
        travelers: Math.max(1, Number(form.travelers) || 1),
        budget: Math.max(0, Number(form.budget) || 0),
        summary: form.summary.trim(),
        coverImageUrl: form.coverImageUrl.trim(),
      });
      setSaving(false);
      setSubmitted(false);
      onClose();
    } catch {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} title={t(isEdit ? 'editTrip.title' : 'createTrip.title')} description={t(isEdit ? 'editTrip.description' : 'createTrip.description')} onClose={handleClose}>
      <form className="trip-form" onSubmit={handleSubmit} noValidate>
        <div className="trip-form__grid">
          <TextField id="trip-name" label={t('createTrip.name')} name="name" placeholder={t('createTrip.namePlaceholder')} value={form.name} error={submitted ? errors.name : ''} onChange={updateField} />
          <LocationAutocomplete
            id="trip-destination" label={t('createTrip.destination')} value={form.destination}
            placeholder={t('createTrip.destinationPlaceholder')} error={submitted ? errors.destination : ''}
            required hint={t('placeSearch.destinationHint')}
            onValueChange={(value) => setForm((current) => ({ ...current, destination: value, destinationLatitude: '', destinationLongitude: '' }))}
            onPlaceSelect={(place) => place && setForm((current) => ({
              ...current, destination: place.label, destinationLatitude: place.latitude,
              destinationLongitude: place.longitude, country: place.country || current.country,
              countryCode: place.countryCode || current.countryCode,
            }))}
          />
          <TextField id="trip-country" label={t('createTrip.country')} name="country" placeholder={t('createTrip.countryPlaceholder')} value={form.country} onChange={updateField} />
          <TextField id="trip-country-code" label={t('editTrip.countryCode')} name="countryCode" placeholder="FR, JP, US…" maxLength="3" value={form.countryCode} onChange={updateField} />
          <TextField id="trip-travelers" label={t('createTrip.travellers')} name="travelers" type="number" min="1" max="30" value={form.travelers} onChange={updateField} />
          <DateRangeField
            label={t('createTrip.travelDates')}
            startDate={form.startDate}
            endDate={form.endDate}
            locale={locale}
            error={submitted ? (errors.startDate || errors.endDate) : ''}
            startLabel={t('createTrip.departure')}
            endLabel={t('createTrip.return')}
            previousMonthLabel={t('createTrip.previousMonth')}
            nextMonthLabel={t('createTrip.nextMonth')}
            instruction={t('createTrip.dateRangeHint')}
            onChange={({ startDate, endDate }) => setForm((current) => ({ ...current, startDate, endDate }))}
          />
          <TextField id="trip-budget" label={t('createTrip.budget')} name="budget" type="number" min="0" step="50" value={form.budget} onChange={updateField} />

          <div className="field"><label className="field__label" htmlFor="trip-currency">{t('createTrip.budgetCurrency')}</label><select id="trip-currency" className="field__input" name="currency" value={form.currency} onChange={updateField}>{SUPPORTED_CURRENCIES.map((currency) => <option key={currency.code} value={currency.code}>{currency.code} — {currencyNames.of(currency.code) || currency.label}</option>)}</select></div>
          <div className="field"><label className="field__label" htmlFor="trip-destination-currency">{t('createTrip.destinationCurrency')}</label><select id="trip-destination-currency" className="field__input" name="destinationCurrency" value={form.destinationCurrency} onChange={updateField}>{SUPPORTED_CURRENCIES.map((currency) => <option key={currency.code} value={currency.code}>{currency.code} — {currencyNames.of(currency.code) || currency.label}</option>)}</select></div>
          <TripAccentPicker
            value={form.accent}
            label={t('editTrip.accent')}
            getLabel={(accent) => t(`editTrip.accents.${accent}`)}
            onChange={(accent) => setForm((current) => ({ ...current, accent }))}
          />

          <div className="field trip-form__full trip-cover-field">
            <span className="field__label">{t('editTrip.coverImage')}</span>
            <div className="trip-cover-field__actions">
              <label className="button button--secondary button--medium" htmlFor="trip-cover-file">{t('editTrip.chooseCover')}</label>
              <input id="trip-cover-file" className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={selectCoverFile} />
              {form.coverImageUrl && <Button type="button" variant="ghost" icon="trash" onClick={() => setForm((current) => ({ ...current, coverImageUrl: '' }))}>{t('editTrip.removeCover')}</Button>}
            </div>
            <label className="trip-cover-field__url" htmlFor="trip-cover-image"><span>{t('editTrip.coverOrUrl')}</span><input id="trip-cover-image" className="field__input" name="coverImageUrl" type="text" value={form.coverImageUrl.startsWith('data:') ? '' : form.coverImageUrl} onChange={updateField} placeholder={t('editTrip.coverImagePlaceholder')} /></label>
            {form.coverImageUrl && <div className="trip-cover-preview"><img src={form.coverImageUrl} alt={t('editTrip.coverPreview')} /></div>}
            <small className="field-hint">{t('editTrip.coverHint')}</small>
            {coverError && <InlineNotice tone="danger" title={t('editTrip.coverErrorTitle')}>{coverError}</InlineNotice>}
          </div>

          <div className="field trip-form__full"><label className="field__label" htmlFor="trip-summary">{t('editTrip.summary')}</label><textarea id="trip-summary" className="field__input" name="summary" rows="3" value={form.summary} onChange={updateField} placeholder={t('editTrip.summaryPlaceholder')} /></div>
        </div>
        <footer className="modal__footer"><Button variant="ghost" onClick={handleClose}>{t('common.cancel')}</Button><Button type="submit" icon={isEdit ? 'save' : 'plus'} disabled={isSaving}>{isSaving ? t('common.saving') : t(isEdit ? 'editTrip.submit' : 'createTrip.submit')}</Button></footer>
      </form>
    </Modal>
  );
}

function buildForm(trip, initialValues = null) {
  if (!trip) return { ...EMPTY_FORM, ...(initialValues || {}) };
  return {
    name: trip.name || '', destination: trip.destination || '', destinationLatitude: trip.destinationLatitude ?? '',
    destinationLongitude: trip.destinationLongitude ?? '', country: trip.country || '', countryCode: trip.countryCode || '',
    startDate: trip.startDate || '', endDate: trip.endDate || '', travelers: trip.travelers || 1,
    budget: trip.budget || 0, currency: trip.currency || 'EUR', destinationCurrency: trip.destinationCurrency || trip.currency || 'EUR',
    accent: trip.accent || 'violet', summary: trip.summary || '', coverImageUrl: trip.coverImageUrl || '',
  };
}