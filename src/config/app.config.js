import { PROJECT_CONFIG } from '../../project.config.js';

/**
 * Runtime application configuration.
 * Keep business-neutral settings here; provider credentials will later live in
 * dedicated environment-aware configuration modules.
 */
export const APP_CONFIG = Object.freeze({
  ...PROJECT_CONFIG,
  defaultLocale: 'en-GB',
  supportedLocales: ['en-GB', 'fr-FR'],
  defaultCurrency: 'EUR',
  storageNamespace: 'tripflow',
  defaultTheme: 'system',
  demoUserName: 'Lucie',
  features: Object.freeze({
    pwa: true,
    demoData: true,
    affiliateLinks: false,
    aiAssistant: false,
  }),
});
