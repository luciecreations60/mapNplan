import test from 'node:test';
import assert from 'node:assert/strict';
import { PROJECT_CONFIG } from '../project.config.js';
import { buildGuideHtml, buildGuideIndexHtml, buildRobotsTxt, buildSitemapXml } from '../scripts/seo-shared.mjs';

const article = { id: 'a', slug: 'guide', language: 'en', status: 'published', title: 'Guide', metaTitle: 'A complete destination guide for testing', metaDescription: 'A sufficiently descriptive summary used only to confirm that stabilization output is not indexable.', destination: 'Paris', country: 'France', excerpt: 'Guide excerpt', introduction: 'Introduction', itineraryBody: 'Itinerary', practicalTips: 'Tips', faq: [], updatedAt: '2026-08-01T00:00:00.000Z' };

test('stabilization output stays non-indexable', () => {
  assert.equal(PROJECT_CONFIG.release.publicIndexingEnabled, false);
  assert.match(buildGuideHtml(article, [article]), /noindex,nofollow,noarchive/);
  assert.match(buildGuideIndexHtml([article]), /noindex,nofollow,noarchive/);
  assert.doesNotMatch(buildRobotsTxt(), /Sitemap:/);
  assert.doesNotMatch(buildSitemapXml([article]), /<url>/);
});
