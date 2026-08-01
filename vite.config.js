import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { PROJECT_CONFIG } from './project.config.js';

/** GitHub Pages hosts project repositories under /<repository-name>/. */
const base = process.env.GITHUB_ACTIONS
  ? `/${PROJECT_CONFIG.repositoryName}/`
  : '/';

function rootMetadataPlugin() {
  return {
    name: 'tripflow-root-metadata',
    transformIndexHtml(html) {
      const siteBaseUrl = PROJECT_CONFIG.deployment.siteBaseUrl.replace(/\/+$/, '');
      const indexingEnabled = PROJECT_CONFIG.release.publicIndexingEnabled;
      const verification = indexingEnabled && PROJECT_CONFIG.deployment.googleSiteVerification
        ? `<meta name="google-site-verification" content="${PROJECT_CONFIG.deployment.googleSiteVerification}">`
        : '';
      const canonical = indexingEnabled
        ? `<link rel="canonical" href="${siteBaseUrl}/">`
        : '<!-- Canonical intentionally omitted until the final brand and domain are approved. -->';
      const schema = indexingEnabled
        ? `<script type="application/ld+json">${JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: PROJECT_CONFIG.brandName,
            description: PROJECT_CONFIG.tagline,
            url: `${siteBaseUrl}/`,
            applicationCategory: 'TravelApplication',
            operatingSystem: 'Any',
          }).replaceAll('<', '\u003c')}</script>`
        : '<!-- Structured public brand metadata disabled during stabilization. -->';
      return html.replace(
        '<!-- SEO_BUILD_METADATA -->',
        `${canonical}
    ${verification}
    ${schema}`,
      );
    },
  };
}

export default defineConfig({
  base,
  plugins: [react(), rootMetadataPlugin()],
  build: {
    sourcemap: true,
    target: 'es2022',
    chunkSizeWarningLimit: 900,
  },
});
