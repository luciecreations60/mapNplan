/**
 * Shared project configuration.
 *
 * The public brand is now mapNplan. The repository name and legacy local
 * storage identifiers are migrated automatically so existing installations and data keep
 * working while the future production domain is still undecided.
 */
export const PROJECT_CONFIG = Object.freeze({
  repositoryName: 'travel-planner',
  codeName: 'mapNplan',
  brandName: 'mapNplan',
  tagline: 'Planifiez. Explorez. Profitez.',
  version: '0.1.26',
  release: Object.freeze({
    stage: 'release-candidate',
    candidate: 'rc.5',
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
