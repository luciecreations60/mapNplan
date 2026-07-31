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

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    sourcemap: true,
    target: 'es2022',
  },
});
