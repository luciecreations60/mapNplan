import { useMemo } from 'react';
import { useAffiliate } from '../../hooks/useAffiliate.js';
import { useI18n } from '../../hooks/useI18n.js';
import { formatLocalizedDate } from '../../utils/date.js';
import { inferBookingCategories, normalizeBookingContext } from '../../utils/bookingContext.js';
import { Button } from '../common/Button.jsx';
import { Icon } from '../common/Icon.jsx';

export function BookingContextCard({ trip, context, categories = null, compact = false, onOpenBooking = null, onRememberSearch = null }) {
  const { locale, t } = useI18n();
  const { providers, buildProviderLink, recordClick } = useAffiliate();
  const normalizedContext = useMemo(() => normalizeBookingContext(context, trip), [context, trip]);
  const relevantCategories = categories?.length ? categories : inferBookingCategories(normalizedContext);

  if (!normalizedContext || !relevantCategories.length) return null;

  const enabledProviders = providers.filter((provider) => (
    provider.enabled && relevantCategories.includes(provider.category)
  ));

  function openProvider(provider) {
    const result = buildProviderLink(provider.id, trip, locale, normalizedContext);
    if (!result.url) {
      onOpenBooking?.(normalizedContext);
      return;
    }
    recordClick({
      providerId: provider.id,
      tripId: trip.id,
      category: provider.category,
    });
    onRememberSearch?.({ provider, url: result.url, context: normalizedContext });
    window.open(result.url, '_blank', 'noopener,noreferrer');
  }

  const dateLabel = normalizedContext.startDate
    ? `${formatLocalizedDate(normalizedContext.startDate, locale, 'numeric')}${normalizedContext.endDate && normalizedContext.endDate !== normalizedContext.startDate ? ` → ${formatLocalizedDate(normalizedContext.endDate, locale, 'numeric')}` : ''}`
    : '';

  return (
    <aside className={`booking-context-card${compact ? ' booking-context-card--compact' : ''}`}>
      <div className="booking-context-card__heading">
        <span className="booking-context-card__icon"><Icon name="sparkles" size={18} /></span>
        <div>
          <p className="eyebrow">{t('affiliate.contextEyebrow')}</p>
          <strong>{normalizedContext.location || trip.destination}</strong>
          <small>
            {[dateLabel, t(normalizedContext.travelers === 1 ? 'trips.traveller' : 'trips.travellers', { count: normalizedContext.travelers })]
              .filter(Boolean)
              .join(' · ')}
          </small>
        </div>
      </div>

      <p className="booking-context-card__text">{t('affiliate.contextText')}</p>

      <div className="booking-context-card__actions">
        {enabledProviders.slice(0, compact ? 2 : 4).map((provider) => (
          <Button key={provider.id} size="small" variant="secondary" icon="externalLink" onClick={() => openProvider(provider)}>
            {provider.name}
          </Button>
        ))}
        {onOpenBooking && (
          <Button size="small" variant={enabledProviders.length ? 'ghost' : 'secondary'} icon="search" onClick={() => onOpenBooking(normalizedContext)}>
            {t('affiliate.compareAll')}
          </Button>
        )}
      </div>
    </aside>
  );
}
