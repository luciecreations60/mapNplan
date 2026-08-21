import { useMemo, useState } from 'react';
import { useI18n } from '../../hooks/useI18n.js';
import { formatCurrency } from '../../utils/currency.js';
import { formatLocalizedDate } from '../../utils/date.js';
import { normalizeExternalUrl } from '../../utils/url.js';
import { normalizeBookingOption } from '../../utils/bookingOptions.js';
import { syncBookedOptionToTrip } from '../../utils/bookingReservations.js';
import {
  AMENITIES,
  LODGING_TYPES,
  buildStayGroups,
  countNights,
} from '../../utils/accommodationComparison.js';
import { Badge } from '../common/Badge.jsx';
import { Button } from '../common/Button.jsx';
import { Card } from '../common/Card.jsx';
import { Icon } from '../common/Icon.jsx';
import { InlineNotice } from '../feedback/InlineNotice.jsx';
import { Modal } from '../common/Modal.jsx';
import { LocationAutocomplete } from '../common/LocationAutocomplete.jsx';

function emptyCandidate(trip) {
  return {
    title: '',
    lodgingType: 'hotel',
    location: '',
    latitude: null,
    longitude: null,
    startDate: trip.startDate || '',
    endDate: trip.endDate || '',
    pricePerNight: '',
    extraCosts: '',
    rating: '',
    amenities: [],
    url: '',
    notes: '',
    travelers: Math.max(1, Number(trip.travelers) || 1),
  };
}

export function AccommodationComparisonPanel({ trip, onUpdate, onOpenTab }) {
  const { locale, t } = useI18n();
  const [isEditorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(() => emptyCandidate(trip));
  const [notice, setNotice] = useState(null);

  const options = Array.isArray(trip.bookingOptions) ? trip.bookingOptions : [];

  // Distances are measured from the trip's main destination unless the trip
  // has none, in which case the column simply stays empty rather than showing
  // a misleading number.
  const referencePoint = useMemo(() => {
    const latitude = Number(trip.destinationLatitude);
    const longitude = Number(trip.destinationLongitude);
    return Number.isFinite(latitude) && Number.isFinite(longitude)
      ? { latitude, longitude }
      : null;
  }, [trip.destinationLatitude, trip.destinationLongitude]);

  const groups = useMemo(
    () => buildStayGroups(options, referencePoint),
    [options, referencePoint],
  );

  function openCreate() {
    setEditingId(null);
    setForm(emptyCandidate(trip));
    setEditorOpen(true);
  }

  function openEdit(candidate) {
    setEditingId(candidate.id);
    setForm({
      title: candidate.title || '',
      lodgingType: candidate.lodgingType || 'hotel',
      location: candidate.location || '',
      latitude: candidate.latitude ?? null,
      longitude: candidate.longitude ?? null,
      startDate: candidate.startDate || trip.startDate || '',
      endDate: candidate.endDate || trip.endDate || '',
      pricePerNight: candidate.pricePerNight || '',
      extraCosts: candidate.extraCosts || '',
      rating: candidate.rating || '',
      amenities: candidate.amenities || [],
      url: candidate.url || '',
      notes: candidate.notes || '',
      travelers: candidate.travelers || Math.max(1, Number(trip.travelers) || 1),
    });
    setEditorOpen(true);
  }

  function submitCandidate(event) {
    event.preventDefault();
    if (!form.title.trim() || !form.location.trim() || !form.startDate || !form.endDate) return;
    if (form.endDate <= form.startDate) {
      setNotice({ tone: 'warning', text: t('stays.invalidDates') });
      return;
    }

    const existing = editingId ? options.find((option) => option.id === editingId) : null;
    const candidate = normalizeBookingOption({
      ...(existing || {}),
      id: existing?.id,
      category: 'hotels',
      providerId: existing?.providerId || 'manual',
      providerName: existing?.providerName || t('stays.manualEntry'),
      title: form.title.trim(),
      lodgingType: form.lodgingType,
      location: form.location.trim(),
      latitude: form.latitude,
      longitude: form.longitude,
      startDate: form.startDate,
      endDate: form.endDate,
      pricePerNight: Number(form.pricePerNight) || 0,
      extraCosts: Number(form.extraCosts) || 0,
      rating: Number(form.rating) || 0,
      amenities: form.amenities,
      url: form.url.trim(),
      notes: form.notes.trim(),
      travelers: Number(form.travelers) || 1,
      currency: existing?.currency || trip.currency,
      status: existing?.status || 'saved',
      source: existing?.source || 'stays',
      updatedAt: new Date().toISOString(),
    }, trip.currency);

    const nextOptions = existing
      ? options.map((option) => (option.id === existing.id ? candidate : option))
      : [...options, candidate];

    onUpdate({ bookingOptions: nextOptions });
    setEditorOpen(false);
    setNotice({ tone: 'success', text: t(existing ? 'stays.candidateUpdated' : 'stays.candidateAdded', { name: candidate.title }) });
  }

  function removeCandidate(candidate) {
    if (!window.confirm(t('stays.deleteConfirm', { name: candidate.title }))) return;
    onUpdate({ bookingOptions: options.filter((option) => option.id !== candidate.id) });
  }

  function toggleShortlist(candidate) {
    const nextStatus = candidate.status === 'shortlisted' ? 'saved' : 'shortlisted';
    onUpdate({
      bookingOptions: options.map((option) => (
        option.id === candidate.id ? { ...option, status: nextStatus } : option
      )),
    });
  }

  /**
   * Choosing a candidate marks it as booked and reuses the existing booking
   * synchronisation, so the stay lands in the itinerary, the reservations and
   * the budget without any re-entry. Sibling candidates for the same stay are
   * set aside rather than deleted, so the comparison stays auditable.
   */
  function chooseCandidate(group, candidate) {
    const chosen = normalizeBookingOption({
      ...candidate,
      status: 'booked',
      price: candidate.cost.total,
      bookedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, trip.currency);

    const siblingIds = new Set(group.candidates.map((item) => item.id));
    const nextOptions = options.map((option) => {
      if (option.id === chosen.id) return chosen;
      if (siblingIds.has(option.id) && option.status !== 'rejected') {
        return { ...option, status: 'rejected', updatedAt: new Date().toISOString() };
      }
      return option;
    });

    const { reservations, itinerary } = syncBookedOptionToTrip({ ...trip, bookingOptions: nextOptions }, chosen);
    onUpdate({ bookingOptions: nextOptions, reservations, itinerary });
    setNotice({ tone: 'success', text: t('stays.chosen', { name: chosen.title }) });
  }

  function toggleAmenity(id) {
    setForm((current) => ({
      ...current,
      amenities: current.amenities.includes(id)
        ? current.amenities.filter((amenity) => amenity !== id)
        : [...current.amenities, id],
    }));
  }

  const formNights = countNights(form.startDate, form.endDate);
  const formTotal = (Number(form.pricePerNight) || 0) * Math.max(1, formNights) + (Number(form.extraCosts) || 0);

  return (
    <div className="workspace-section stays-panel">
      <section className="workspace-section__heading">
        <div>
          <p className="eyebrow">{t('stays.eyebrow')}</p>
          <h2>{t('stays.title')}</h2>
          <p>{t('stays.intro')}</p>
        </div>
        <Button icon="plus" onClick={openCreate}>{t('stays.addCandidate')}</Button>
      </section>

      {notice && (
        <InlineNotice tone={notice.tone} className="page-notice">{notice.text}</InlineNotice>
      )}

      {groups.length === 0 ? (
        <section className="workspace-large-empty">
          <span><Icon name="hotel" size={30} /></span>
          <h3>{t('stays.emptyTitle')}</h3>
          <p>{t('stays.emptyText')}</p>
          <Button icon="plus" onClick={openCreate}>{t('stays.addCandidate')}</Button>
        </section>
      ) : (
        groups.map((group) => (
          <Card key={group.key} className="stay-group">
            <header className="stay-group__header">
              <div>
                <p className="eyebrow">{t('stays.stayLabel')}</p>
                <h3>{group.location || t('stays.unnamedStay')}</h3>
                <p className="stay-group__meta">
                  {group.startDate && group.endDate && (
                    <>
                      {formatLocalizedDate(group.startDate, locale, 'compact')} → {formatLocalizedDate(group.endDate, locale, 'compact')}
                      {' · '}
                    </>
                  )}
                  {t(group.nights === 1 ? 'stays.night' : 'stays.nights', { count: group.nights })}
                  {' · '}
                  {t('stays.travelers', { count: group.travelers })}
                </p>
              </div>
              <Badge tone="primary">{t('stays.candidateCount', { count: group.candidates.length })}</Badge>
            </header>

            <div className="stay-compare-scroll">
              <table className="stay-compare-table">
                <thead>
                  <tr>
                    <th scope="col">{t('stays.criterion')}</th>
                    {group.candidates.map((candidate) => (
                      <th key={candidate.id} scope="col">
                        <div className="stay-compare-table__name">
                          <strong>{candidate.title}</strong>
                          {candidate.status === 'booked' && <Badge tone="success">{t('stays.selected')}</Badge>}
                          {candidate.status === 'rejected' && <Badge tone="neutral">{t('stays.setAside')}</Badge>}
                          {candidate.status === 'shortlisted' && <Badge tone="warning">{t('stays.shortlisted')}</Badge>}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">{t('stays.totalCost')}</th>
                    {group.candidates.map((candidate) => (
                      <td key={candidate.id} className={candidate.isCheapest ? 'stay-cell--best' : ''}>
                        <strong>{formatCurrency(candidate.cost.total, candidate.currency, locale)}</strong>
                        {candidate.isCheapest && <small>{t('stays.cheapest')}</small>}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">{t('stays.perNight')}</th>
                    {group.candidates.map((candidate) => (
                      <td key={candidate.id}>{formatCurrency(candidate.cost.pricePerNight, candidate.currency, locale)}</td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">{t('stays.extras')}</th>
                    {group.candidates.map((candidate) => (
                      <td key={candidate.id}>
                        {candidate.cost.extras > 0
                          ? formatCurrency(candidate.cost.extras, candidate.currency, locale)
                          : '—'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">{t('stays.lodgingType')}</th>
                    {group.candidates.map((candidate) => {
                      const type = LODGING_TYPES.find((item) => item.id === candidate.lodgingType);
                      return (
                        <td key={candidate.id}>
                          {type ? <><Icon name={type.icon} size={15} /> {t(type.labelKey)}</> : '—'}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <th scope="row">{t('stays.rating')}</th>
                    {group.candidates.map((candidate) => (
                      <td key={candidate.id} className={candidate.isBestRated ? 'stay-cell--best' : ''}>
                        {Number(candidate.rating) > 0 ? `${candidate.rating}/10` : '—'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">{t('stays.distance')}</th>
                    {group.candidates.map((candidate) => (
                      <td key={candidate.id}>
                        {Number.isFinite(candidate.distanceKm)
                          ? t('stays.kmFromReference', { distance: candidate.distanceKm.toFixed(1) })
                          : '—'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">{t('stays.amenities')}</th>
                    {group.candidates.map((candidate) => (
                      <td key={candidate.id}>
                        <ul className="stay-amenity-list">
                          {AMENITIES.map((amenity) => {
                            const has = (candidate.amenities || []).includes(amenity.id);
                            return (
                              <li key={amenity.id} className={has ? 'is-present' : 'is-absent'} title={t(amenity.labelKey)}>
                                <Icon name={has ? 'check' : 'close'} size={13} />
                                <span>{t(amenity.labelKey)}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">{t('common.notes')}</th>
                    {group.candidates.map((candidate) => (
                      <td key={candidate.id} className="stay-cell--notes">{candidate.notes || '—'}</td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">{t('stays.actions')}</th>
                    {group.candidates.map((candidate) => {
                      const safeUrl = normalizeExternalUrl(candidate.url);
                      return (
                        <td key={candidate.id}>
                          <div className="stay-candidate-actions">
                            {candidate.status !== 'booked' && (
                              <Button size="small" icon="check" onClick={() => chooseCandidate(group, candidate)}>
                                {t('stays.chooseThis')}
                              </Button>
                            )}
                            <div className="stay-candidate-actions__row">
                              <button
                                className={`icon-button icon-button--small${candidate.status === 'shortlisted' ? ' icon-button--active' : ''}`}
                                type="button"
                                aria-label={t(candidate.status === 'shortlisted' ? 'stays.removeShortlist' : 'stays.addShortlist', { name: candidate.title })}
                                title={t('stays.shortlisted')}
                                onClick={() => toggleShortlist(candidate)}
                              >
                                <Icon name="star" size={15} />
                              </button>
                              {safeUrl && (
                                <a
                                  className="icon-button icon-button--small"
                                  href={safeUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  aria-label={t('stays.openListing', { name: candidate.title })}
                                >
                                  <Icon name="externalLink" size={15} />
                                </a>
                              )}
                              <button
                                className="icon-button icon-button--small"
                                type="button"
                                aria-label={t('common.edit')}
                                onClick={() => openEdit(candidate)}
                              >
                                <Icon name="edit" size={15} />
                              </button>
                              <button
                                className="icon-button icon-button--small"
                                type="button"
                                aria-label={t('common.delete')}
                                onClick={() => removeCandidate(candidate)}
                              >
                                <Icon name="trash" size={15} />
                              </button>
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        ))
      )}

      <Modal
        isOpen={isEditorOpen}
        title={t(editingId ? 'stays.editCandidate' : 'stays.addCandidate')}
        description={t('stays.editorDescription')}
        onClose={() => setEditorOpen(false)}
        size="large"
      >
        <form className="workspace-form stays-form" onSubmit={submitCandidate}>
          <div className="workspace-form__grid">
            <label className="workspace-field workspace-form__wide">
              <span>{t('stays.name')}</span>
              <input value={form.title} onChange={(event) => setForm((c) => ({ ...c, title: event.target.value }))} required />
            </label>

            <label className="workspace-field">
              <span>{t('stays.lodgingType')}</span>
              <select value={form.lodgingType} onChange={(event) => setForm((c) => ({ ...c, lodgingType: event.target.value }))}>
                {LODGING_TYPES.map((type) => <option key={type.id} value={type.id}>{t(type.labelKey)}</option>)}
              </select>
            </label>

            <label className="workspace-field">
              <span>{t('stays.ratingOutOfTen')}</span>
              <input type="number" min="0" max="10" step="0.1" value={form.rating} onChange={(event) => setForm((c) => ({ ...c, rating: event.target.value }))} />
            </label>

            <div className="workspace-field workspace-form__wide">
              <LocationAutocomplete
                id="stay-location"
                label={t('common.location')}
                value={form.location}
                onValueChange={(value) => setForm((c) => ({ ...c, location: value }))}
                onPlaceSelect={(place) => setForm((c) => ({
                  ...c,
                  location: place?.label || c.location,
                  latitude: place?.latitude ?? c.latitude,
                  longitude: place?.longitude ?? c.longitude,
                }))}
                required
              />
            </div>

            <label className="workspace-field">
              <span>{t('itinerary.startDate')}</span>
              <input type="date" value={form.startDate} onChange={(event) => setForm((c) => ({ ...c, startDate: event.target.value }))} required />
            </label>
            <label className="workspace-field">
              <span>{t('itinerary.endDate')}</span>
              <input type="date" value={form.endDate} min={form.startDate} onChange={(event) => setForm((c) => ({ ...c, endDate: event.target.value }))} required />
            </label>

            <label className="workspace-field">
              <span>{t('stays.perNight')} ({trip.currency})</span>
              <input type="number" min="0" step="0.01" value={form.pricePerNight} onChange={(event) => setForm((c) => ({ ...c, pricePerNight: event.target.value }))} />
            </label>
            <label className="workspace-field">
              <span>{t('stays.extrasLabel')} ({trip.currency})</span>
              <input type="number" min="0" step="0.01" value={form.extraCosts} onChange={(event) => setForm((c) => ({ ...c, extraCosts: event.target.value }))} />
            </label>

            <fieldset className="workspace-field workspace-form__wide stays-amenities">
              <legend>{t('stays.amenities')}</legend>
              <div className="stays-amenities__grid">
                {AMENITIES.map((amenity) => (
                  <label key={amenity.id} className="stays-amenity-toggle">
                    <input
                      type="checkbox"
                      checked={form.amenities.includes(amenity.id)}
                      onChange={() => toggleAmenity(amenity.id)}
                    />
                    <Icon name={amenity.icon} size={15} />
                    <span>{t(amenity.labelKey)}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="workspace-field workspace-form__wide">
              <span>{t('stays.listingUrl')}</span>
              <input type="url" inputMode="url" placeholder="https://" value={form.url} onChange={(event) => setForm((c) => ({ ...c, url: event.target.value }))} />
            </label>

            <label className="workspace-field workspace-form__wide">
              <span>{t('common.notes')}</span>
              <textarea rows="2" value={form.notes} onChange={(event) => setForm((c) => ({ ...c, notes: event.target.value }))} />
            </label>
          </div>

          {formNights > 0 && (
            <div className="stays-form__preview">
              <Icon name="calculator" size={16} />
              <span>
                {t('stays.costPreview', {
                  nights: formNights,
                  total: formatCurrency(formTotal, trip.currency, locale),
                })}
              </span>
            </div>
          )}

          <div className="workspace-form__actions">
            <Button variant="ghost" onClick={() => setEditorOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit" icon="save">{t('common.save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
