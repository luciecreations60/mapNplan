import {
  AFFILIATE_CONFIG_SCHEMA_VERSION,
  AFFILIATE_TEMPLATE_TOKENS,
  DEFAULT_AFFILIATE_PROVIDERS,
} from '../../config/affiliate.config.js';
import { normalizeExternalUrl } from '../../utils/url.js';
import { createId } from '../../utils/id.js';
import { localStorageService } from '../storage/LocalStorageService.js';

const SETTINGS_KEY = 'affiliate-settings';
const ANALYTICS_KEY = 'affiliate-analytics';
const MAX_ANALYTICS_EVENTS = 1000;

function normalizeProvider(provider, fallback = {}) {
  const category = String(provider?.category || fallback.category || 'other').trim();
  return {
    id: String(provider?.id || fallback.id || createId('provider')).trim(),
    name: String(provider?.name || fallback.name || 'Partner').trim(),
    category,
    enabled: Boolean(provider?.enabled),
    affiliateCapable: provider?.affiliateCapable ?? fallback.affiliateCapable ?? true,
    homepageUrl: normalizeExternalUrl(provider?.homepageUrl || fallback.homepageUrl || '') || '',
    searchUrlTemplate: String(provider?.searchUrlTemplate || '').trim(),
    affiliateParameter: String(provider?.affiliateParameter || '').trim(),
    affiliateValue: String(provider?.affiliateValue || '').trim(),
  };
}

function replaceTemplateTokens(template, values) {
  return AFFILIATE_TEMPLATE_TOKENS.reduce((result, token) => {
    const encodedValue = encodeURIComponent(String(values[token] ?? ''));
    return result
      .replaceAll(`{{${token}}}`, encodedValue)
      .replaceAll(`{${token}}`, encodedValue);
  }, template);
}

class AffiliateService {
  getSettings() {
    const stored = localStorageService.get(SETTINGS_KEY, null);
    const storedProviders = Array.isArray(stored?.providers) ? stored.providers : [];
    const storedById = new Map(storedProviders.map((provider) => [provider.id, provider]));

    const providers = DEFAULT_AFFILIATE_PROVIDERS.map((provider) => (
      normalizeProvider({ ...provider, ...(storedById.get(provider.id) || {}) }, provider)
    ));

    for (const provider of storedProviders) {
      if (!providers.some((item) => item.id === provider.id)) {
        providers.push(normalizeProvider(provider));
      }
    }

    const settings = {
      schemaVersion: AFFILIATE_CONFIG_SCHEMA_VERSION,
      disclosureEnabled: stored?.disclosureEnabled !== false,
      providers,
      updatedAt: stored?.updatedAt || new Date().toISOString(),
    };
    localStorageService.set(SETTINGS_KEY, settings);
    return settings;
  }

  updateProvider(providerId, patch) {
    const settings = this.getSettings();
    const providers = settings.providers.map((provider) => (
      provider.id === providerId ? normalizeProvider({ ...provider, ...patch }, provider) : provider
    ));
    const updated = { ...settings, providers, updatedAt: new Date().toISOString() };
    localStorageService.set(SETTINGS_KEY, updated);
    return updated;
  }

  resetSettings() {
    localStorageService.remove(SETTINGS_KEY);
    return this.getSettings();
  }

  buildProviderLink(providerId, trip, locale = 'en-GB') {
    const provider = this.getSettings().providers.find((item) => item.id === providerId);
    if (!provider) return { provider: null, url: null, isAffiliate: false, reason: 'missing-provider' };
    if (!provider.enabled) return { provider, url: null, isAffiliate: false, reason: 'disabled' };

    const values = {
      destination: trip?.destination || '',
      country: trip?.country || '',
      startDate: trip?.startDate || '',
      endDate: trip?.endDate || '',
      travelers: trip?.travelers || 1,
      currency: trip?.currency || 'EUR',
      locale,
      category: provider.category,
    };

    const template = provider.searchUrlTemplate || provider.homepageUrl;
    const replaced = replaceTemplateTokens(template, values);
    const normalized = normalizeExternalUrl(replaced);
    if (!normalized) return { provider, url: null, isAffiliate: false, reason: 'invalid-url' };

    const isAffiliate = Boolean(
      provider.affiliateCapable
      && provider.affiliateParameter
      && provider.affiliateValue,
    );

    if (!isAffiliate) return { provider, url: normalized, isAffiliate: false, reason: null };

    try {
      const url = new URL(normalized);
      url.searchParams.set(provider.affiliateParameter, provider.affiliateValue);
      return { provider, url: url.toString(), isAffiliate: true, reason: null };
    } catch {
      return { provider, url: normalized, isAffiliate: false, reason: null };
    }
  }

  getAnalytics() {
    const stored = localStorageService.get(ANALYTICS_KEY, null);
    const events = Array.isArray(stored?.events) ? stored.events : [];
    return { schemaVersion: 1, events };
  }

  recordEvent(type, payload = {}) {
    const analytics = this.getAnalytics();
    const event = {
      id: createId('affiliate-event'),
      type,
      providerId: String(payload.providerId || ''),
      tripId: String(payload.tripId || ''),
      optionId: String(payload.optionId || ''),
      category: String(payload.category || ''),
      value: Math.max(0, Number(payload.value) || 0),
      currency: String(payload.currency || '').trim().toUpperCase(),
      createdAt: new Date().toISOString(),
    };
    const next = {
      schemaVersion: 1,
      events: [...analytics.events, event].slice(-MAX_ANALYTICS_EVENTS),
    };
    localStorageService.set(ANALYTICS_KEY, next);
    return next;
  }

  clearAnalytics() {
    localStorageService.remove(ANALYTICS_KEY);
    return this.getAnalytics();
  }

  summarizeAnalytics() {
    const events = this.getAnalytics().events;
    const conversionEvents = events.filter((event) => event.type === 'conversion');
    const declaredValueByCurrency = conversionEvents.reduce((summary, event) => {
      const currency = event.currency || 'EUR';
      summary[currency] = (summary[currency] || 0) + event.value;
      return summary;
    }, {});

    return {
      clicks: events.filter((event) => event.type === 'click').length,
      conversions: conversionEvents.length,
      declaredValueByCurrency,
      byProvider: events.reduce((summary, event) => {
        const current = summary[event.providerId] || { clicks: 0, conversions: 0, declaredValueByCurrency: {} };
        if (event.type === 'click') current.clicks += 1;
        if (event.type === 'conversion') {
          current.conversions += 1;
          const currency = event.currency || 'EUR';
          current.declaredValueByCurrency[currency] = (current.declaredValueByCurrency[currency] || 0) + event.value;
        }
        summary[event.providerId] = current;
        return summary;
      }, {}),
    };
  }
}

export const affiliateService = new AffiliateService();
