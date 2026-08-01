/**
 * Shared project configuration.
 *
 * This file is imported by Vite, the static SEO generator and the browser
 * application. Keep deployment and branding values here so a future domain or
 * brand change does not require edits throughout the codebase.
 */
export const PROJECT_CONFIG = Object.freeze({
  repositoryName: 'travel-planner',
  codeName: 'TripFlow',
  brandName: 'TripFlow',
  tagline: 'Every journey starts here.',
  version: '0.1.18',
  deployment: Object.freeze({
    siteBaseUrl: 'https://luciecreations60.github.io/travel-planner',
    googleSiteVerification: '',
    defaultSocialImageUrl: '',
  }),
});
