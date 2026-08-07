import { createContext, useCallback, useMemo, useState } from 'react';
import { affiliateService } from '../services/affiliate/AffiliateService.js';

export const AffiliateContext = createContext(null);

export function AffiliateProvider({ children }) {
  const [settings, setSettings] = useState(() => affiliateService.getSettings());
  const [analytics, setAnalytics] = useState(() => affiliateService.summarizeAnalytics());

  const refresh = useCallback(() => {
    setSettings(affiliateService.getSettings());
    setAnalytics(affiliateService.summarizeAnalytics());
  }, []);

  const updateProvider = useCallback((providerId, patch) => {
    const next = affiliateService.updateProvider(providerId, patch);
    setSettings(next);
    return next;
  }, []);

  const resetProviders = useCallback(() => {
    const next = affiliateService.resetSettings();
    setSettings(next);
    return next;
  }, []);

  const clearAnalytics = useCallback(() => {
    affiliateService.clearAnalytics();
    setAnalytics(affiliateService.summarizeAnalytics());
  }, []);

  const recordClick = useCallback((payload) => {
    affiliateService.recordEvent('click', payload);
    setAnalytics(affiliateService.summarizeAnalytics());
  }, []);

  const recordConversion = useCallback((payload) => {
    affiliateService.recordEvent('conversion', payload);
    setAnalytics(affiliateService.summarizeAnalytics());
  }, []);

  const value = useMemo(() => ({
    providers: settings.providers,
    disclosureEnabled: settings.disclosureEnabled,
    analytics,
    updateProvider,
    resetProviders,
    clearAnalytics,
    buildProviderLink: (providerId, trip, locale) => affiliateService.buildProviderLink(providerId, trip, locale),
    recordClick,
    recordConversion,
    refresh,
  }), [
    settings.providers,
    settings.disclosureEnabled,
    analytics,
    updateProvider,
    resetProviders,
    clearAnalytics,
    recordClick,
    recordConversion,
    refresh,
  ]);

  return <AffiliateContext.Provider value={value}>{children}</AffiliateContext.Provider>;
}
