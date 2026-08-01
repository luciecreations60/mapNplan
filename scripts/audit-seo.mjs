import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEO_CONFIG } from '../src/config/seo.config.js';
import { auditSeoPublication } from '../src/utils/seoContent.js';
import { normalizePublicationArticle } from './seo-shared.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const payload = JSON.parse(await fs.readFile(path.join(root, SEO_CONFIG.publicationFilePath), 'utf8'));
const articles = (payload.articles || []).map(normalizePublicationArticle);
const report = auditSeoPublication(articles, SEO_CONFIG.siteBaseUrl);

for (const check of report.checks) {
  console.log(`${check.passed ? 'PASS' : check.severity === 'error' ? 'ERROR' : 'WARN'}  ${check.id}`);
}
for (const article of report.articles) {
  console.log(`${article.score >= 70 ? 'PASS' : 'WARN'}  ${article.slug}: ${article.score}/100 (${article.wordCount} words)`);
}
if (!report.passed) process.exitCode = 1;
