import { PROJECT_CONFIG } from '../../project.config.js';
import { SEO_CONFIG } from '../config/seo.config.js';

export function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

export function normalizeKeywords(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
}

export function countWords(article) {
  const source = [
    article?.title,
    article?.excerpt,
    article?.introduction,
    article?.itineraryBody,
    article?.practicalTips,
    ...(article?.faq || []).flatMap((item) => [item.question, item.answer]),
  ].filter(Boolean).join(' ');
  return source.trim() ? source.trim().split(/\s+/).length : 0;
}

export function normalizeBaseUrl(value = SEO_CONFIG.siteBaseUrl) {
  return String(value || SEO_CONFIG.siteBaseUrl).trim().replace(/\/+$/, '');
}

export function buildCanonicalUrl(article, baseUrl = SEO_CONFIG.siteBaseUrl) {
  return `${normalizeBaseUrl(baseUrl)}${SEO_CONFIG.publicPathPrefix}/${article.slug}/`;
}

export function scoreSeoArticle(article) {
  const primaryKeyword = String(article?.primaryKeyword || '').trim().toLowerCase();
  const title = String(article?.metaTitle || article?.title || '').trim();
  const description = String(article?.metaDescription || '').trim();
  const introduction = String(article?.introduction || '').toLowerCase();
  const words = countWords(article);
  const checks = [
    {
      id: 'title-length',
      passed: title.length >= SEO_CONFIG.title.minimum && title.length <= SEO_CONFIG.title.recommendedMaximum,
      score: 15,
    },
    {
      id: 'description-length',
      passed: description.length >= SEO_CONFIG.description.minimum && description.length <= SEO_CONFIG.description.recommendedMaximum,
      score: 15,
    },
    { id: 'keyword-title', passed: Boolean(primaryKeyword && title.toLowerCase().includes(primaryKeyword)), score: 15 },
    { id: 'keyword-introduction', passed: Boolean(primaryKeyword && introduction.includes(primaryKeyword)), score: 10 },
    { id: 'word-count', passed: words >= SEO_CONFIG.minimumArticleWords, score: 15 },
    { id: 'slug', passed: Boolean(article?.slug && article.slug.length <= 75), score: 10 },
    { id: 'hero-alt', passed: !article?.heroImageUrl || Boolean(String(article?.heroAlt || '').trim()), score: 5 },
    { id: 'faq', passed: Array.isArray(article?.faq) && article.faq.some((item) => item.question && item.answer), score: 5 },
    { id: 'sections', passed: Boolean(article?.itineraryBody && article?.practicalTips), score: 10 },
  ];
  return {
    score: checks.reduce((total, check) => total + (check.passed ? check.score : 0), 0),
    checks,
    wordCount: words,
  };
}

/**
 * Returns a publication-level audit. This is deliberately deterministic and
 * can run both in the browser and in the GitHub Actions build.
 */
export function auditSeoPublication(articles, baseUrl = SEO_CONFIG.siteBaseUrl) {
  const published = (Array.isArray(articles) ? articles : []).filter((article) => article.status === 'published');
  const slugCounts = published.reduce((map, article) => {
    const slug = String(article.slug || '');
    map.set(slug, (map.get(slug) || 0) + 1);
    return map;
  }, new Map());
  const url = normalizeBaseUrl(baseUrl);
  const articleResults = published.map((article) => ({
    id: article.id,
    slug: article.slug,
    title: article.title,
    ...scoreSeoArticle(article),
  }));
  const checks = [
    { id: 'https', passed: url.startsWith('https://'), severity: 'error' },
    { id: 'placeholder-domain', passed: !/example\.com/i.test(url), severity: 'error' },
    { id: 'published-pages', passed: published.length > 0, severity: 'warning' },
    { id: 'unique-slugs', passed: [...slugCounts.values()].every((count) => count === 1), severity: 'error' },
    { id: 'quality-score', passed: articleResults.every((result) => result.score >= 70), severity: 'warning' },
  ];
  return {
    baseUrl: url,
    publishedCount: published.length,
    checks,
    articles: articleResults,
    errors: checks.filter((check) => check.severity === 'error' && !check.passed).length,
    warnings: checks.filter((check) => check.severity === 'warning' && !check.passed).length,
    passed: checks.every((check) => check.passed || check.severity !== 'error'),
  };
}

/**
 * Article markup is used because the generated destination guides are
 * editorial pages. `about` keeps the destination context machine-readable.
 */
export function buildDestinationSchema(article, canonicalUrl) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.metaTitle || article.title,
    description: article.metaDescription || article.excerpt,
    url: canonicalUrl,
    mainEntityOfPage: canonicalUrl,
    inLanguage: article.language || SEO_CONFIG.defaultLanguage,
    datePublished: article.publishedAt || article.createdAt,
    dateModified: article.updatedAt || article.publishedAt || article.createdAt,
    author: {
      '@type': 'Organization',
      name: PROJECT_CONFIG.brandName,
    },
    publisher: {
      '@type': 'Organization',
      name: PROJECT_CONFIG.brandName,
    },
    about: {
      '@type': 'Place',
      name: [article.destination, article.country].filter(Boolean).join(', '),
    },
  };
  if (article.heroImageUrl) schema.image = [article.heroImageUrl];
  return schema;
}

export function buildBreadcrumbSchema(article, canonicalUrl, baseUrl = SEO_CONFIG.siteBaseUrl) {
  const base = normalizeBaseUrl(baseUrl);
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: PROJECT_CONFIG.brandName, item: `${base}/` },
      { '@type': 'ListItem', position: 2, name: 'Travel guides', item: `${base}${SEO_CONFIG.publicPathPrefix}/` },
      { '@type': 'ListItem', position: 3, name: article.title, item: canonicalUrl },
    ],
  };
}

export function buildFaqSchema(article) {
  const questions = (article.faq || []).filter((item) => item.question && item.answer);
  if (questions.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function paragraphsToHtml(value) {
  return String(value || '')
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll('\n', '<br>')}</p>`)
    .join('\n');
}

export function safeJsonLd(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}
