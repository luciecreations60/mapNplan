import { PROJECT_CONFIG } from '../../project.config.js';

/**
 * Runtime application configuration.
 * Keep business-neutral settings here; provider credentials will later live in
 * dedicated environment-aware configuration modules.
 */
export const APP_CONFIG = Object.freeze({
  ...PROJECT_CONFIG,
  fallbackLocale: 'en-GB',
  supportedLocales: ['fr-FR', 'en-GB'],
  defaultCurrency: 'EUR',
  storageNamespace: 'mapnplan',
  defaultTheme: 'system',
  demoUserName: 'Lucie',
  features: Object.freeze({
    pwa: true,
    demoData: true,
    maps: true,
    reservations: true,
    documents: true,
    weather: true,
    currencyConverter: true,
    dataBackup: true,
    globalSearch: true,
    travelCalendar: true,
    tripStatistics: true,
    printableTripPlan: true,
    localCollaboration: true,
    readOnlySharing: true,
    discussions: true,
    localNotifications: true,
    placeAutocomplete: true,
    itineraryOptimization: true,
    sharedExpenses: true,
    travelDayCompanion: true,
    localFileVault: true,
    reusableTemplates: true,
    calendarInteroperability: true,
    savedPlacesLibrary: true,
    affiliateLinks: true,
    seoContentStudio: false,
    staticSeoExport: true,
    aiAssistant: false,
  }),
});
