/**
 * Shared project configuration.
 */
export const PROJECT_CONFIG = Object.freeze({
  repositoryName: 'mapnplan',
  codeName: 'mapNplan',
  brandName: 'mapNplan',
  tagline: 'Planifiez. Explorez. Profitez.',
  version: '0.1.28',
  release: Object.freeze({
    stage: 'release-candidate',
    candidate: 'rc.7',
    brandFinalized: true,

    // false tant que tu n'as pas branché le domaine + Search Console
    publicIndexingEnabled: false,

    // mets ton domaine final ici ce week-end (ex: 'www.mapnplan.com')
    productionDomain: '',
  }),
  deployment: Object.freeze({
    // Pendant GitHub Pages repo URL:
    siteBaseUrl: 'https://luciecreations60.github.io/mapnplan',

    // À remplir après création propriété Search Console
    googleSiteVerification: '',

    // image sociale absolue quand prête
    defaultSocialImageUrl: '',
  }),
});
