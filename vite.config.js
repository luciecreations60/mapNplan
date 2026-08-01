import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { PROJECT_CONFIG } from './project.config.js';

/**
 * GitHub Pages hosts project repositories under /<repository-name>/.
 * Local development remains available at the root path.
 */
const base = process.env.GITHUB_ACTIONS
  ? `/${PROJECT_CONFIG.repositoryName}/`
  : '/';

function rootSeoPlugin() {
  return {
    name: 'tripflow-root-seo',
    transformIndexHtml(html) {
      const siteBaseUrl = PROJECT_CONFIG.deployment.siteBaseUrl.replace(/\/+$/, '');
      const verification = PROJECT_CONFIG.deployment.googleSiteVerification
        ? `<meta name="google-site-verification" content="${PROJECT_CONFIG.deployment.googleSiteVerification}">`
        : '';
      const schema = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: PROJECT_CONFIG.brandName,
        description: PROJECT_CONFIG.tagline,
        url: `${siteBaseUrl}/`,
        applicationCategory: 'TravelApplication',
        operatingSystem: 'Any',
      }).replaceAll('<', '\\u003c');
      return html.replace(
        '<!-- SEO_BUILD_METADATA -->',
        `<link rel="canonical" href="${siteBaseUrl}/">\n    ${verification}\n    <script type="application/ld+json">${schema}</script>`,
      );
    },
  };
}

export default defineConfig({
  base,
  plugins: [react(), rootSeoPlugin()],
  build: {
    sourcemap: true,
    target: 'es2022',
  },
});
