import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { PROJECT_CONFIG } from './project.config.js';

/** GitHub Pages hosts project repositories under /<repository-name>/. */
const base = `/${PROJECT_CONFIG.repositoryName}/`;

function rootMetadataPlugin() {
  return {
    name: 'mapnplan-root-metadata',
    transformIndexHtml(html) {
      const siteBaseUrl = PROJECT_CONFIG.deployment.siteBaseUrl.replace(/\/+$/, '');
      const indexingEnabled = PROJECT_CONFIG.release.publicIndexingEnabled;

      const robots = '';

      const verification = indexingEnabled && PROJECT_CONFIG.deployment.googleSiteVerification
        ? `<meta name="google-site-verification" content="${PROJECT_CONFIG.deployment.googleSiteVerification}">`
        : '';

      const canonical = indexingEnabled
        ? `<link rel="canonical" href="${siteBaseUrl}/">`
        : '<!-- Canonical intentionally omitted until domain/indexing is enabled. -->';

      const schema = indexingEnabled
        ? `<script type="application/ld+json">${JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: PROJECT_CONFIG.brandName,
            description: PROJECT_CONFIG.tagline,
            url: `${siteBaseUrl}/`,
            applicationCategory: 'TravelApplication',
            operatingSystem: 'Any',
          }).replaceAll('<', '\\u003c')}</script>`
        : '<!-- Structured data disabled until public indexing is enabled. -->';

      return html
        .replace('<!-- SEO_ROBOTS -->', robots)
        .replace(
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
    chunkSizeWarningLimit: 750,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              test: /node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/,
              name: 'react-vendor',
            },
            {
              test: /node_modules[\\/]maplibre-gl[\\/]/,
              name: 'map-vendor',
            },
            {
              test: /node_modules[\\/]lucide-react[\\/]/,
              name: 'icons-vendor',
            },
          ],
        },
      },
    },
  },
});
