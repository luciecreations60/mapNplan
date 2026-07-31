import { useMemo, useState } from 'react';
import { SUPPORTED_CURRENCIES } from '../../config/external-services.config.js';
import { useI18n } from '../../hooks/useI18n.js';
import { useTrips } from '../../hooks/useTrips.js';
import { Button } from '../common/Button.jsx';
import { Modal } from '../common/Modal.jsx';
import { TextField } from '../common/TextField.jsx';

const INITIAL_FORM = {
  name: '', destination: '', country: '', startDate: '', endDate: '', travelers: 2,
  budget: 0, currency: 'EUR', destinationCurrency: 'EUR', accent: 'violet',
};

export function CreateTripDialog({ isOpen, onClose }) {
  const { locale, t } = useI18n();
  const currencyNames = useMemo(() => new Intl.DisplayNames([locale], { type: 'currency' }), [locale]);
  const { createTrip } = useTrips();
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);

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

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleClose() {
    setSubmitted(false);
    setForm(INITIAL_FORM);
    onClose();
  }

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
    if (hasErrors) return;

    createTrip({
      ...form,
      travelers: Number(form.travelers),
      budget: Number(form.budget),
      spent: 0,
      checklistCompleted: 0,
      checklistTotal: 8,
      summary: t('trips.newSummary'),
    });
    handleClose();
  }

  return (
    <Modal isOpen={isOpen} title={t('createTrip.title')} description={t('createTrip.description')} onClose={handleClose}>
      <form className="trip-form" onSubmit={handleSubmit} noValidate>
        <div className="trip-form__grid">
          <TextField id="trip-name" label={t('createTrip.name')} name="name" placeholder={t('createTrip.namePlaceholder')} value={form.name} error={submitted ? errors.name : ''} onChange={updateField} />
          <TextField id="trip-destination" label={t('createTrip.destination')} name="destination" placeholder={t('createTrip.destinationPlaceholder')} value={form.destination} error={submitted ? errors.destination : ''} onChange={updateField} />
          <TextField id="trip-country" label={t('createTrip.country')} name="country" placeholder={t('createTrip.countryPlaceholder')} value={form.country} onChange={updateField} />
          <TextField id="trip-travelers" label={t('createTrip.travellers')} name="travelers" type="number" min="1" max="30" value={form.travelers} onChange={updateField} />
          <TextField id="trip-start" label={t('createTrip.departure')} name="startDate" type="date" value={form.startDate} error={submitted ? errors.startDate : ''} onChange={updateField} />
          <TextField id="trip-end" label={t('createTrip.return')} name="endDate" type="date" value={form.endDate} error={submitted ? errors.endDate : ''} onChange={updateField} />
          <TextField id="trip-budget" label={t('createTrip.budget')} name="budget" type="number" min="0" step="50" value={form.budget} onChange={updateField} />
          <div className="field">
            <label className="field__label" htmlFor="trip-currency">{t('createTrip.budgetCurrency')}</label>
            <select id="trip-currency" className="field__input" name="currency" value={form.currency} onChange={updateField}>
              {SUPPORTED_CURRENCIES.map((currency) => <option key={currency.code} value={currency.code}>{currency.code} — {currencyNames.of(currency.code) || currency.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="trip-destination-currency">{t('createTrip.destinationCurrency')}</label>
            <select id="trip-destination-currency" className="field__input" name="destinationCurrency" value={form.destinationCurrency} onChange={updateField}>
              {SUPPORTED_CURRENCIES.map((currency) => <option key={currency.code} value={currency.code}>{currency.code} — {currencyNames.of(currency.code) || currency.label}</option>)}
            </select>
          </div>
        </div>

        <footer className="modal__footer">
          <Button variant="ghost" onClick={handleClose}>{t('common.cancel')}</Button>
          <Button type="submit" icon="plus">{t('createTrip.submit')}</Button>
        </footer>
      </form>
    </Modal>
  );
}
