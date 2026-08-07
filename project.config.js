/**
 * Shared project configuration.
 *
 * Central metadata for the mapNplan release candidate.
 * The application intentionally starts with a clean local trip library in this test release.
 */
export const PROJECT_CONFIG = Object.freeze({
  repositoryName: 'travel-planner',
  codeName: 'mapNplan',
  brandName: 'mapNplan',
  tagline: 'Planifiez. Explorez. Profitez.',
  version: '0.1.27',
  release: Object.freeze({
    stage: 'release-candidate',
    candidate: 'rc.6',
    brandFinalized: true,
    publicIndexingEnabled: false,
    productionDomain: '',
  }),
  deployment: Object.freeze({
    siteBaseUrl: 'https://luciecreations60.github.io/travel-planner',
    googleSiteVerification: '',
    defaultSocialImageUrl: '',
  }),
});
