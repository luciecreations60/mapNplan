/**
 * Search-engine optimisation configuration.
 *
 * The final production domain is deliberately configurable because TripFlow
 * remains a code name. Change `siteBaseUrl` when the commercial brand and
 * domain are selected; exported pages, canonical URLs and sitemaps will then
 * use the new value without component changes.
 */
export const SEO_CONFIG = Object.freeze({
  schemaVersion: 1,
  siteBaseUrl: 'https://example.com',
  defaultLanguage: 'en',
  supportedLanguages: Object.freeze(['en', 'fr']),
  title: Object.freeze({ minimum: 35, recommendedMaximum: 60 }),
  description: Object.freeze({ minimum: 120, recommendedMaximum: 160 }),
  minimumArticleWords: 300,
  storageKey: 'seo-content-library',
  exportFormatVersion: 1,
  publicPathPrefix: '/guides',
});
