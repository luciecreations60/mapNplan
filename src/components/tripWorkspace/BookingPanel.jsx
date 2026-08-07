import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AFFILIATE_CATEGORIES } from '../../config/affiliate.config.js';
import { useAffiliate } from '../../hooks/useAffiliate.js';
import { useI18n } from '../../hooks/useI18n.js';
import {
  BOOKING_OPTION_CATEGORIES,
  normalizeBookingOption,
  summarizeBookingOptions,
} from '../../utils/bookingOptions.js';
import { Button } from '../common/Button.jsx';
import { Card } from '../common/Card.jsx';
import { Icon } from '../common/Icon.jsx';
import { InlineNotice } from '../feedback/InlineNotice.jsx';

const EMPTY_FORM = Object.freeze({
  category: 'hotels',
  providerId: 'other',
  providerName: '',
  title: '',
  price: '',
  currency: '',
  url: '',
  status: 'saved',
  notes: '',
});

export function BookingPanel({ trip, onUpdate }) {
  const navigate = useNavigate();
  const { locale, t } = useI18n();
  const {
    providers,
    disclosureEnabled,
    buildProviderLink,
    recordClick,
    recordConversion,
  } = useAffiliate();
  const [activeCategory, setActiveCategory] = useState('all');
  const [form, setForm] = useState({ ...EMPTY_FORM, currency: trip.currency });
  const [editingId, setEditingId] = useState(null);
  const [notice, setNotice] = useState(null);

  const options = Array.isArray(trip.bookingOptions) ? trip.bookingOptions : [];
  const summary = useMemo(() => summarizeBookingOptions(options), [options]);
  const visibleProviders = providers.filter((provider) => (
    activeCategory === 'all' || provider.category === activeCategory
  ));
  const visibleOptions = options
    .filter((option) => activeCategory === 'all' || option.category === activeCategory)
    .sort((left, right) => {
      if (left.status === 'booked' && right.status !== 'booked') return -1;
      if (right.status === 'booked' && left.status !== 'booked') return 1;
      return (left.price || Number.MAX_SAFE_INTEGER) - (right.price || Number.MAX_SAFE_INTEGER);
    });

  function patchForm(patch) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function resetForm(category = activeCategory === 'all' ? 'hotels' : activeCategory) {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, category, currency: trip.currency });
  }

  function handleProviderChange(providerId) {
    const provider = providers.find((item) => item.id === providerId);
    patchForm({
      providerId,
      providerName: provider ? provider.name : '',
      category: provider?.category || form.category,
    });
  }

  function saveOption(event) {
    event.preventDefault();
    if (!form.title.trim()) {
      setNotice({ tone: 'danger', title: t('affiliate.validationTitle'), message: t('affiliate.titleRequired') });
      return;
    }

    const provider = providers.find((item) => item.id === form.providerId);
    const normalized = normalizeBookingOption({
      ...form,
      id: editingId || undefined,
      providerName: provider?.name || form.providerName || t('affiliate.otherProvider'),
      price: form.price,
      currency: form.currency || trip.currency,
      createdAt: editingId ? options.find((option) => option.id === editingId)?.createdAt : undefined,
      updatedAt: new Date().toISOString(),
    }, trip.currency);

    const nextOptions = editingId
      ? options.map((option) => (option.id === editingId ? normalized : option))
      : [...options, normalized];
    onUpdate({ bookingOptions: nextOptions });
    const previousOption = editingId ? options.find((option) => option.id === editingId) : null;
    if (normalized.status === 'booked' && previousOption?.status !== 'booked') {
      recordConversion({
        providerId: normalized.providerId,
        tripId: trip.id,
        optionId: normalized.id,
        category: normalized.category,
        value: normalized.price,
        currency: normalized.currency,
      });
    }
    setNotice({
      tone: 'success',
      title: editingId ? t('affiliate.optionUpdated') : t('affiliate.optionAdded'),
      message: t('affiliate.optionSavedText', { name: normalized.title }),
    });
    resetForm(normalized.category);
  }

  function editOption(option) {
    setEditingId(option.id);
    setForm({
      category: option.category,
      providerId: option.providerId,
      providerName: option.providerName,
      title: option.title,
      price: String(option.price || ''),
      currency: option.currency || trip.currency,
      url: option.url || '',
      status: option.status,
      notes: option.notes || '',
    });
    window.requestAnimationFrame(() => {
      document.getElementById('booking-option-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function deleteOption(option) {
    if (!window.confirm(t('affiliate.deleteConfirm', { name: option.title }))) return;
    onUpdate({ bookingOptions: options.filter((item) => item.id !== option.id) });
    if (editingId === option.id) resetForm();
  }

  function updateStatus(option, status) {
    const updated = normalizeBookingOption({
      ...option,
      status,
      bookedAt: status === 'booked' ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    }, trip.currency);
    onUpdate({ bookingOptions: options.map((item) => (item.id === option.id ? updated : item)) });
    if (status === 'booked' && option.status !== 'booked') {
      recordConversion({
        providerId: updated.providerId,
        tripId: trip.id,
        optionId: updated.id,
        category: updated.category,
        value: updated.price,
        currency: updated.currency,
      });
    }
  }

  function openAffiliateSettings() {
    navigate('/settings');
    window.setTimeout(() => {
      document.getElementById('affiliate-partners')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  function openProvider(provider) {
    const result = buildProviderLink(provider.id, trip, locale);
    if (!result.url) {
      setNotice({ tone: 'warning', title: t('affiliate.providerUnavailable'), message: t('affiliate.configureProviderText') });
      return;
    }
    recordClick({ providerId: provider.id, tripId: trip.id, category: provider.category });
    window.open(result.url, '_blank', 'noopener,noreferrer');
  }

  function openOption(option) {
    if (!option.url) return;
    recordClick({ providerId: option.providerId, tripId: trip.id, optionId: option.id, category: option.category });
    window.open(option.url, '_blank', 'noopener,noreferrer');
  }

  function formatMoney(amount, currency) {
    const normalizedCurrency = currency || trip.currency || 'EUR';
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency: normalizedCurrency }).format(Number(amount) || 0);
    } catch {
      return `${Number(amount) || 0} ${normalizedCurrency}`;
    }
  }

  return (
    <section className="workspace-section booking-panel">
      <header className="workspace-section__heading booking-panel__heading">
        <div>
          <p className="eyebrow">{t('affiliate.eyebrow')}</p>
          <h2>{t('affiliate.title')}</h2>
          <p>{t('affiliate.intro')}</p>
        </div>
        <Button variant="secondary" icon="settings" onClick={openAffiliateSettings}>
          {t('affiliate.managePartners')}
        </Button>
      </header>

      {notice && (
        <InlineNotice tone={notice.tone} title={notice.title}>
          {notice.message}
        </InlineNotice>
      )}

      <div className="booking-summary-grid">
        <Card className="booking-summary-card"><span><Icon name="search" /></span><div><strong>{summary.total}</strong><small>{t('affiliate.savedOptions')}</small></div></Card>
        <Card className="booking-summary-card"><span><Icon name="star" /></span><div><strong>{summary.shortlisted}</strong><small>{t('affiliate.shortlisted')}</small></div></Card>
        <Card className="booking-summary-card"><span><Icon name="checkCircle" /></span><div><strong>{summary.booked}</strong><small>{t('affiliate.booked')}</small></div></Card>
        <Card className="booking-summary-card"><span><Icon name="wallet" /></span><div><strong>{formatMoney(summary.bookedValue, trip.currency)}</strong><small>{t('affiliate.bookedValue')}</small></div></Card>
      </div>

      <div className="booking-category-tabs" role="tablist" aria-label={t('affiliate.categoryFilter')}>
        <button type="button" className={activeCategory === 'all' ? 'booking-category-tab booking-category-tab--active' : 'booking-category-tab'} onClick={() => setActiveCategory('all')}>
          <Icon name="globe" size={17} /><span>{t('affiliate.allCategories')}</span>
        </button>
        {AFFILIATE_CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            className={activeCategory === category.id ? 'booking-category-tab booking-category-tab--active' : 'booking-category-tab'}
            onClick={() => setActiveCategory(category.id)}
          >
            <Icon name={category.icon} size={17} /><span>{t(category.labelKey)}</span>
          </button>
        ))}
      </div>

      <Card className="workspace-panel booking-providers-card">
        <header className="workspace-panel__header">
          <div><p className="eyebrow">{t('affiliate.discoveryEyebrow')}</p><h2>{t('affiliate.discoveryTitle')}</h2></div>
          <span className="workspace-count">{visibleProviders.length}</span>
        </header>
        <div className="booking-provider-grid">
          {visibleProviders.map((provider) => {
            const category = AFFILIATE_CATEGORIES.find((item) => item.id === provider.category);
            const link = buildProviderLink(provider.id, trip, locale);
            return (
              <article key={provider.id} className={provider.enabled ? 'booking-provider booking-provider--active' : 'booking-provider'}>
                <span className="booking-provider__icon"><Icon name={category?.icon || 'externalLink'} /></span>
                <div className="booking-provider__body">
                  <div className="booking-provider__title"><strong>{provider.name}</strong><span>{t(`affiliate.categories.${provider.category}`)}</span></div>
                  <p>{provider.enabled ? t('affiliate.providerReady') : t('affiliate.providerDisabled')}</p>
                  <div className="booking-provider__badges">
                    <span>{provider.affiliateCapable ? t('affiliate.affiliateCapable') : t('affiliate.directSearch')}</span>
                    <span>{link.isAffiliate ? t('affiliate.trackedLink') : t('affiliate.noCommission')}</span>
                  </div>
                </div>
                <Button
                  size="small"
                  variant={provider.enabled ? 'secondary' : 'ghost'}
                  icon={provider.enabled ? 'externalLink' : 'settings'}
                  onClick={() => (provider.enabled ? openProvider(provider) : openAffiliateSettings())}
                >
                  {provider.enabled ? t('affiliate.searchProvider') : t('affiliate.configure')}
                </Button>
              </article>
            );
          })}
        </div>
      </Card>

      {disclosureEnabled && (
        <InlineNotice tone="info" title={t('affiliate.disclosureTitle')}>
          {t('affiliate.disclosureText')}
        </InlineNotice>
      )}

      <Card className="workspace-form-card" id="booking-option-form">
        <header className="workspace-panel__header">
          <div>
            <p className="eyebrow">{editingId ? t('affiliate.editEyebrow') : t('affiliate.compareEyebrow')}</p>
            <h2>{editingId ? t('affiliate.editOption') : t('affiliate.addOption')}</h2>
          </div>
        </header>
        <form className="workspace-form" onSubmit={saveOption}>
          <div className="workspace-form__grid booking-option-form-grid">
            <label className="workspace-field"><span>{t('affiliate.category')}</span><select value={form.category} onChange={(event) => patchForm({ category: event.target.value })}>{BOOKING_OPTION_CATEGORIES.map((category) => <option key={category} value={category}>{t(`affiliate.categories.${category}`)}</option>)}</select></label>
            <label className="workspace-field"><span>{t('affiliate.provider')}</span><select value={form.providerId} onChange={(event) => handleProviderChange(event.target.value)}><option value="other">{t('affiliate.otherProvider')}</option>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}</select></label>
            {form.providerId === 'other' && <label className="workspace-field"><span>{t('affiliate.providerName')}</span><input value={form.providerName} onChange={(event) => patchForm({ providerName: event.target.value })} placeholder={t('affiliate.providerPlaceholder')} /></label>}
            <label className="workspace-field workspace-form__wide"><span>{t('affiliate.optionTitle')}</span><input value={form.title} onChange={(event) => patchForm({ title: event.target.value })} placeholder={t('affiliate.optionPlaceholder')} required /></label>
            <label className="workspace-field"><span>{t('affiliate.price')}</span><input type="number" min="0" step="0.01" value={form.price} onChange={(event) => patchForm({ price: event.target.value })} /></label>
            <label className="workspace-field"><span>{t('affiliate.currency')}</span><input maxLength="3" value={form.currency} onChange={(event) => patchForm({ currency: event.target.value.toUpperCase() })} /></label>
            <label className="workspace-field"><span>{t('affiliate.status')}</span><select value={form.status} onChange={(event) => patchForm({ status: event.target.value })}><option value="saved">{t('affiliate.statuses.saved')}</option><option value="shortlisted">{t('affiliate.statuses.shortlisted')}</option><option value="booked">{t('affiliate.statuses.booked')}</option><option value="rejected">{t('affiliate.statuses.rejected')}</option></select></label>
            <label className="workspace-field workspace-form__wide"><span>{t('affiliate.url')}</span><input type="url" value={form.url} onChange={(event) => patchForm({ url: event.target.value })} placeholder="https://" /></label>
            <label className="workspace-field workspace-form__full"><span>{t('affiliate.notes')}</span><textarea value={form.notes} onChange={(event) => patchForm({ notes: event.target.value })} placeholder={t('affiliate.notesPlaceholder')} /></label>
          </div>
          <div className="workspace-form__actions">
            {editingId && <Button variant="ghost" onClick={() => resetForm()}>{t('common.cancel')}</Button>}
            <Button type="submit" icon="save">{editingId ? t('affiliate.saveChanges') : t('affiliate.saveOption')}</Button>
          </div>
        </form>
      </Card>

      <Card className="workspace-panel booking-comparison-card">
        <header className="workspace-panel__header">
          <div><p className="eyebrow">{t('affiliate.comparisonEyebrow')}</p><h2>{t('affiliate.comparisonTitle')}</h2></div>
          <span className="workspace-count">{visibleOptions.length}</span>
        </header>
        {visibleOptions.length === 0 ? (
          <div className="workspace-empty"><span><Icon name="search" /></span><h3>{t('affiliate.emptyTitle')}</h3><p>{t('affiliate.emptyText')}</p></div>
        ) : (
          <div className="booking-option-grid">
            {visibleOptions.map((option) => {
              const category = AFFILIATE_CATEGORIES.find((item) => item.id === option.category);
              return (
                <article key={option.id} className={`booking-option booking-option--${option.status}`}>
                  <div className="booking-option__heading">
                    <span><Icon name={category?.icon || 'ticket'} /></span>
                    <div><small>{option.providerName}</small><h3>{option.title}</h3></div>
                    <strong>{formatMoney(option.price, option.currency)}</strong>
                  </div>
                  <div className="booking-option__meta"><span>{t(`affiliate.categories.${option.category}`)}</span><span>{t(`affiliate.statuses.${option.status}`)}</span></div>
                  {option.notes && <p>{option.notes}</p>}
                  <div className="booking-option__actions">
                    {option.url && <Button size="small" variant="secondary" icon="externalLink" onClick={() => openOption(option)}>{t('affiliate.openOffer')}</Button>}
                    {option.status !== 'shortlisted' && option.status !== 'booked' && <Button size="small" variant="ghost" icon="star" onClick={() => updateStatus(option, 'shortlisted')}>{t('affiliate.shortlist')}</Button>}
                    {option.status !== 'booked' && <Button size="small" variant="ghost" icon="checkCircle" onClick={() => updateStatus(option, 'booked')}>{t('affiliate.markBooked')}</Button>}
                    <button className="icon-button icon-button--small" type="button" aria-label={t('common.edit')} onClick={() => editOption(option)}><Icon name="edit" size={16} /></button>
                    <button className="icon-button icon-button--small icon-button--danger" type="button" aria-label={t('common.delete')} onClick={() => deleteOption(option)}><Icon name="trash" size={16} /></button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Card>
    </section>
  );
}
