/**
 * Shared project configuration.
 *
 * Branding, deployment and release switches are centralized here so a future
 * domain/name change does not require edits throughout the application.
 */
export const PROJECT_CONFIG = Object.freeze({
  repositoryName: 'travel-planner',
  codeName: 'TripFlow',
  brandName: 'TripFlow',
  tagline: 'Every journey starts here.',
  version: '0.1.23',
  release: Object.freeze({
    stage: 'release-candidate',
    candidate: 'rc.2',
    brandFinalized: false,
    publicIndexingEnabled: false,
    productionDomain: '',
  }),
  deployment: Object.freeze({
    siteBaseUrl: 'https://luciecreations60.github.io/travel-planner',
    googleSiteVerification: '',
    defaultSocialImageUrl: '',
  }),
});
