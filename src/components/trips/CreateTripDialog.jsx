import { useMemo, useState } from 'react';
import { SUPPORTED_CURRENCIES } from '../../config/external-services.config.js';
import { useTrips } from '../../hooks/useTrips.js';
import { Button } from '../common/Button.jsx';
import { Modal } from '../common/Modal.jsx';
import { TextField } from '../common/TextField.jsx';

const INITIAL_FORM = {
  name: '',
  destination: '',
  country: '',
  startDate: '',
  endDate: '',
  travelers: 2,
  budget: 0,
  currency: 'EUR',
  destinationCurrency: 'EUR',
  accent: 'violet',
};

export function CreateTripDialog({ isOpen, onClose }) {
  const { createTrip } = useTrips();
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);

  const errors = useMemo(() => ({
    name: !form.name.trim() ? 'Give this trip a name.' : '',
    destination: !form.destination.trim() ? 'Add at least one destination.' : '',
    startDate: !form.startDate ? 'Choose a departure date.' : '',
    endDate: !form.endDate
      ? 'Choose a return date.'
      : form.startDate && form.endDate < form.startDate
        ? 'The return date must be after departure.'
        : '',
  }), [form]);

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
      summary: 'A new journey ready to be planned.',
    });
    handleClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      title="Create a trip"
      description="Start with the essentials. Every detail can be refined later."
      onClose={handleClose}
    >
      <form className="trip-form" onSubmit={handleSubmit} noValidate>
        <div className="trip-form__grid">
          <TextField
            id="trip-name"
            label="Trip name"
            name="name"
            placeholder="Japan Discovery"
            value={form.name}
            error={submitted ? errors.name : ''}
            onChange={updateField}
          />
          <TextField
            id="trip-destination"
            label="Destination"
            name="destination"
            placeholder="Tokyo, Kyoto & Osaka"
            value={form.destination}
            error={submitted ? errors.destination : ''}
            onChange={updateField}
          />
          <TextField
            id="trip-country"
            label="Country"
            name="country"
            placeholder="Japan"
            value={form.country}
            onChange={updateField}
          />
          <TextField
            id="trip-travelers"
            label="Travellers"
            name="travelers"
            type="number"
            min="1"
            max="30"
            value={form.travelers}
            onChange={updateField}
          />
          <TextField
            id="trip-start"
            label="Departure"
            name="startDate"
            type="date"
            value={form.startDate}
            error={submitted ? errors.startDate : ''}
            onChange={updateField}
          />
          <TextField
            id="trip-end"
            label="Return"
            name="endDate"
            type="date"
            value={form.endDate}
            error={submitted ? errors.endDate : ''}
            onChange={updateField}
          />
          <TextField
            id="trip-budget"
            label="Estimated budget"
            name="budget"
            type="number"
            min="0"
            step="50"
            value={form.budget}
            onChange={updateField}
          />
          <div className="field">
            <label className="field__label" htmlFor="trip-currency">Budget currency</label>
            <select id="trip-currency" className="field__input" name="currency" value={form.currency} onChange={updateField}>
              {SUPPORTED_CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>{currency.code} — {currency.label}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="trip-destination-currency">Destination currency</label>
            <select
              id="trip-destination-currency"
              className="field__input"
              name="destinationCurrency"
              value={form.destinationCurrency}
              onChange={updateField}
            >
              {SUPPORTED_CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>{currency.code} — {currency.label}</option>
              ))}
            </select>
          </div>
        </div>

        <footer className="modal__footer">
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
          <Button type="submit" icon="plus">Create trip</Button>
        </footer>
      </form>
    </Modal>
  );
}
