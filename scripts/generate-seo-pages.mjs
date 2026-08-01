import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEO_CONFIG } from '../src/config/seo.config.js';
import { auditSeoPublication } from '../src/utils/seoContent.js';
import {
  buildGuideHtml,
  buildGuideIndexHtml,
  buildRobotsTxt,
  buildSitemapXml,
  normalizePublicationArticle,
} from './seo-shared.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, SEO_CONFIG.publicationFilePath);
const publicDir = path.join(root, 'public');
const guidesDir = path.join(publicDir, 'guides');
const generatedAt = new Date().toISOString().slice(0, 10);

const payload = JSON.parse(await fs.readFile(sourcePath, 'utf8'));
if (payload?.format !== 'tripflow-seo-publication' || !Array.isArray(payload?.articles)) {
  throw new Error(`Invalid SEO publication file: ${SEO_CONFIG.publicationFilePath}`);
}

const articles = payload.articles
  .map(normalizePublicationArticle)
  .filter((article) => article.status === 'published');
const audit = auditSeoPublication(articles, SEO_CONFIG.siteBaseUrl);
if (!audit.passed) {
  throw new Error(`SEO publication contains ${audit.errors} blocking error(s). Run npm run seo:audit for details.`);
}

await fs.rm(guidesDir, { recursive: true, force: true });
await fs.mkdir(guidesDir, { recursive: true });

for (const article of articles) {
  const targetDir = path.join(guidesDir, article.slug);
  await fs.mkdir(targetDir, { recursive: true });
  await fs.writeFile(path.join(targetDir, 'index.html'), buildGuideHtml(article, articles), 'utf8');
}

await fs.writeFile(path.join(guidesDir, 'index.html'), buildGuideIndexHtml(articles), 'utf8');
await fs.writeFile(path.join(publicDir, 'sitemap.xml'), buildSitemapXml(articles, { generatedAt }), 'utf8');
await fs.writeFile(path.join(publicDir, 'robots.txt'), buildRobotsTxt(), 'utf8');
await fs.writeFile(path.join(publicDir, 'seo-status.json'), `${JSON.stringify({ generatedAt: new Date().toISOString(), baseUrl: SEO_CONFIG.siteBaseUrl, publicIndexingEnabled: SEO_CONFIG.publicIndexingEnabled, publishedPages: articles.length, audit }, null, 2)}
`, 'utf8');

console.log(`Generated ${articles.length} public SEO page(s) in public/guides.`);
console.log(SEO_CONFIG.publicIndexingEnabled
  ? `Sitemap: ${SEO_CONFIG.siteBaseUrl}/sitemap.xml`
  : 'Public indexing is locked: generated pages contain noindex metadata.');
