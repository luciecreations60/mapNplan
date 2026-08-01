import { PROJECT_CONFIG } from '../../project.config.js';

/**
 * Search-engine optimisation configuration.
 *
 * The public URL is read from the shared root configuration so exported pages,
 * canonical links, sitemaps and the GitHub Pages build always agree. Replace it
 * once the final commercial domain is connected.
 */
export const SEO_CONFIG = Object.freeze({
  schemaVersion: 2,
  publicationFormatVersion: 1,
  siteBaseUrl: PROJECT_CONFIG.deployment.siteBaseUrl,
  publicIndexingEnabled: PROJECT_CONFIG.release.publicIndexingEnabled,
  googleSiteVerification: PROJECT_CONFIG.deployment.googleSiteVerification,
  defaultSocialImageUrl: PROJECT_CONFIG.deployment.defaultSocialImageUrl,
  defaultLanguage: 'en',
  supportedLanguages: Object.freeze(['en', 'fr']),
  title: Object.freeze({ minimum: 35, recommendedMaximum: 60 }),
  description: Object.freeze({ minimum: 120, recommendedMaximum: 160 }),
  minimumArticleWords: 300,
  recommendedArticleWords: 700,
  storageKey: 'seo-content-library',
  exportFormatVersion: 1,
  publicPathPrefix: '/guides',
  publicationFilePath: 'content/seo-pages.json',
});
