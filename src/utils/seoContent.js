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

export function buildCanonicalUrl(article, baseUrl = SEO_CONFIG.siteBaseUrl) {
  const base = String(baseUrl || SEO_CONFIG.siteBaseUrl).replace(/\/$/, '');
  return `${base}${SEO_CONFIG.publicPathPrefix}/${article.slug}`;
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
    { id: 'hero-alt', passed: Boolean(String(article?.heroAlt || '').trim()), score: 5 },
    { id: 'faq', passed: Array.isArray(article?.faq) && article.faq.some((item) => item.question && item.answer), score: 5 },
    { id: 'sections', passed: Boolean(article?.itineraryBody && article?.practicalTips), score: 10 },
  ];
  return {
    score: checks.reduce((total, check) => total + (check.passed ? check.score : 0), 0),
    checks,
    wordCount: words,
  };
}

export function buildDestinationSchema(article, canonicalUrl) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'TravelAction',
    name: article.metaTitle || article.title,
    description: article.metaDescription || article.excerpt,
    url: canonicalUrl,
    inLanguage: article.language || SEO_CONFIG.defaultLanguage,
    toLocation: {
      '@type': 'Place',
      name: [article.destination, article.country].filter(Boolean).join(', '),
    },
  };
  if (article.heroImageUrl) schema.image = article.heroImageUrl;
  return schema;
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
