import { SEO_CONFIG } from '../../config/seo.config.js';
import { createBuiltInSeoArticles } from '../../data/builtInSeoContent.js';
import { affiliateService } from '../affiliate/AffiliateService.js';
import { localStorageService } from '../storage/LocalStorageService.js';
import { createId } from '../../utils/id.js';
import {
  buildCanonicalUrl,
  buildDestinationSchema,
  buildBreadcrumbSchema,
  buildFaqSchema,
  escapeHtml,
  normalizeKeywords,
  paragraphsToHtml,
  safeJsonLd,
  slugify,
  auditSeoPublication,
} from '../../utils/seoContent.js';

function nowIso() {
  return new Date().toISOString();
}

function normalizeFaq(items) {
  return (Array.isArray(items) ? items : [])
    .map((item) => ({
      id: String(item?.id || createId('faq')),
      question: String(item?.question || '').trim(),
      answer: String(item?.answer || '').trim(),
    }))
    .filter((item) => item.question || item.answer);
}

function normalizeArticle(article, fallback = {}) {
  const title = String(article?.title || fallback.title || '').trim();
  const status = article?.status === 'published' ? 'published' : 'draft';
  const slug = slugify(article?.slug || title || fallback.slug || createId('guide'));
  return {
    id: String(article?.id || fallback.id || createId('seo-article')),
    slug,
    language: SEO_CONFIG.supportedLanguages.includes(article?.language) ? article.language : SEO_CONFIG.defaultLanguage,
    status,
    title,
    metaTitle: String(article?.metaTitle || title).trim(),
    metaDescription: String(article?.metaDescription || '').trim(),
    destination: String(article?.destination || '').trim(),
    country: String(article?.country || '').trim(),
    primaryKeyword: String(article?.primaryKeyword || '').trim(),
    secondaryKeywords: normalizeKeywords(article?.secondaryKeywords),
    heroImageUrl: String(article?.heroImageUrl || '').trim(),
    heroAlt: String(article?.heroAlt || '').trim(),
    excerpt: String(article?.excerpt || '').trim(),
    introduction: String(article?.introduction || '').trim(),
    itineraryBody: String(article?.itineraryBody || '').trim(),
    practicalTips: String(article?.practicalTips || '').trim(),
    faq: normalizeFaq(article?.faq),
    affiliateCategories: Array.isArray(article?.affiliateCategories)
      ? [...new Set(article.affiliateCategories.map(String))]
      : [],
    createdAt: article?.createdAt || fallback.createdAt || nowIso(),
    updatedAt: article?.updatedAt || nowIso(),
    publishedAt: status === 'published' ? (article?.publishedAt || nowIso()) : null,
  };
}

function createLibrary(articles) {
  return {
    schemaVersion: SEO_CONFIG.schemaVersion,
    articles: articles.map((article) => normalizeArticle(article)),
    updatedAt: nowIso(),
  };
}

function downloadText(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

class ContentStudioService {
  getLibrary() {
    const stored = localStorageService.get(SEO_CONFIG.storageKey, null);
    if (Array.isArray(stored?.articles)) {
      const normalized = createLibrary(stored.articles);
      localStorageService.set(SEO_CONFIG.storageKey, normalized);
      return normalized;
    }
    const initial = createLibrary(createBuiltInSeoArticles());
    localStorageService.set(SEO_CONFIG.storageKey, initial);
    return initial;
  }

  getArticles() {
    return this.getLibrary().articles;
  }

  findBySlug(slug) {
    return this.getArticles().find((article) => article.slug === slug) || null;
  }

  saveArticle(payload) {
    const library = this.getLibrary();
    const existing = payload?.id ? library.articles.find((article) => article.id === payload.id) : null;
    const candidate = normalizeArticle({ ...existing, ...payload, updatedAt: nowIso() }, existing || {});
    const duplicateSlug = library.articles.some((article) => article.id !== candidate.id && article.slug === candidate.slug);
    if (duplicateSlug) candidate.slug = `${candidate.slug}-${candidate.id.slice(-5)}`;
    const articles = existing
      ? library.articles.map((article) => (article.id === candidate.id ? candidate : article))
      : [candidate, ...library.articles];
    localStorageService.set(SEO_CONFIG.storageKey, createLibrary(articles));
    return candidate;
  }

  duplicateArticle(id) {
    const source = this.getArticles().find((article) => article.id === id);
    if (!source) return null;
    return this.saveArticle({
      ...source,
      id: undefined,
      title: `${source.title} — Copy`,
      slug: `${source.slug}-copy`,
      status: 'draft',
      publishedAt: null,
      createdAt: nowIso(),
    });
  }

  deleteArticle(id) {
    const library = this.getLibrary();
    const articles = library.articles.filter((article) => article.id !== id);
    if (articles.length === library.articles.length) return false;
    localStorageService.set(SEO_CONFIG.storageKey, createLibrary(articles));
    return true;
  }

  exportLibrary() {
    const payload = {
      format: 'tripflow-seo-content',
      formatVersion: SEO_CONFIG.exportFormatVersion,
      exportedAt: nowIso(),
      articles: this.getArticles(),
    };
    downloadText('tripflow-seo-content.json', `${JSON.stringify(payload, null, 2)}\n`, 'application/json');
    return payload;
  }

  async importLibrary(file) {
    const parsed = JSON.parse(await file.text());
    if (parsed?.format !== 'tripflow-seo-content' || !Array.isArray(parsed?.articles)) {
      throw new Error('Unsupported SEO content file.');
    }
    const current = this.getArticles();
    const byId = new Map(current.map((article) => [article.id, article]));
    parsed.articles.map((article) => normalizeArticle(article)).forEach((article) => byId.set(article.id, article));
    const next = createLibrary([...byId.values()]);
    localStorageService.set(SEO_CONFIG.storageKey, next);
    return next;
  }

  exportPublication() {
    const articles = this.getArticles().filter((article) => article.status === 'published');
    const payload = {
      format: 'tripflow-seo-publication',
      formatVersion: SEO_CONFIG.publicationFormatVersion,
      exportedAt: nowIso(),
      articles,
    };
    downloadText('seo-pages.json', `${JSON.stringify(payload, null, 2)}\n`, 'application/json');
    return payload;
  }

  auditPublication(baseUrl = SEO_CONFIG.siteBaseUrl) {
    return auditSeoPublication(this.getArticles(), baseUrl);
  }

  buildAffiliateLinks(article, locale = 'en-GB') {
    const pseudoTrip = {
      destination: article.destination,
      country: article.country,
      startDate: '',
      endDate: '',
      travelers: 2,
      currency: 'EUR',
    };
    return affiliateService.getSettings().providers
      .filter((provider) => article.affiliateCategories.includes(provider.category))
      .map((provider) => affiliateService.buildProviderLink(provider.id, pseudoTrip, locale))
      .filter((result) => result.provider && result.url);
  }

  generateHtml(article, options = {}) {
    const canonicalUrl = buildCanonicalUrl(article, options.baseUrl || SEO_CONFIG.siteBaseUrl);
    const travelSchema = buildDestinationSchema(article, canonicalUrl);
    const breadcrumbSchema = buildBreadcrumbSchema(article, canonicalUrl, options.baseUrl || SEO_CONFIG.siteBaseUrl);
    const faqSchema = buildFaqSchema(article);
    const affiliateLinks = this.buildAffiliateLinks(article, options.locale);
    const labels = article.language === 'fr'
      ? {
          overview: 'Vue d’ensemble', itinerary: 'Itinéraire suggéré', tips: 'Conseils pratiques',
          faq: 'Questions fréquentes', continuePlanning: 'Continuer la préparation',
          disclosure: 'Certains liens ci-dessous peuvent devenir des liens partenaires lorsqu’un programme vérifié est configuré.',
        }
      : {
          overview: 'Overview', itinerary: 'Suggested itinerary', tips: 'Practical planning tips',
          faq: 'Frequently asked questions', continuePlanning: 'Continue planning',
          disclosure: 'Some links below may become partner links when a verified programme is configured.',
        };
    const title = escapeHtml(article.metaTitle || article.title);
    const description = escapeHtml(article.metaDescription || article.excerpt);
    const imageMeta = article.heroImageUrl
      ? `<meta property="og:image" content="${escapeHtml(article.heroImageUrl)}">\n<meta name="twitter:image" content="${escapeHtml(article.heroImageUrl)}">`
      : '';
    const hero = article.heroImageUrl
      ? `<figure class="hero-image"><img src="${escapeHtml(article.heroImageUrl)}" alt="${escapeHtml(article.heroAlt)}"></figure>`
      : '';
    const affiliateSection = affiliateLinks.length > 0
      ? `<aside class="booking-box"><p class="disclosure">${escapeHtml(labels.disclosure)}</p><h2>${escapeHtml(labels.continuePlanning)}</h2><div class="booking-links">${affiliateLinks.map((item) => `<a rel="sponsored nofollow" href="${escapeHtml(item.url)}">${escapeHtml(item.provider.name)}</a>`).join('')}</div></aside>`
      : '';
    const faq = article.faq.length > 0
      ? `<section><h2>${escapeHtml(labels.faq)}</h2>${article.faq.map((item) => `<details><summary>${escapeHtml(item.question)}</summary><p>${escapeHtml(item.answer)}</p></details>`).join('')}</section>`
      : '';
    const jsonLd = [travelSchema, breadcrumbSchema, faqSchema].filter(Boolean)
      .map((schema) => `<script type="application/ld+json">${safeJsonLd(schema)}</script>`)
      .join('\n');

    return `<!doctype html>
<html lang="${escapeHtml(article.language)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="${escapeHtml(canonicalUrl)}">
<meta property="og:type" content="article">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${escapeHtml(canonicalUrl)}">
<meta name="twitter:card" content="summary_large_image">
${imageMeta}
${jsonLd}
<style>
:root{font-family:Inter,system-ui,sans-serif;color:#18211f;background:#f6f8f7}*{box-sizing:border-box}body{margin:0}a{color:#356859}main{width:min(900px,calc(100% - 32px));margin:auto;padding:56px 0 80px}.eyebrow{font-size:.78rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#4e7f70}h1{font-size:clamp(2.2rem,6vw,4.5rem);line-height:1.04;margin:.3em 0}.lead{font-size:1.2rem;line-height:1.7;color:#52615d}.hero-image img{width:100%;max-height:520px;object-fit:cover;border-radius:24px}section,.booking-box{margin-top:36px;padding:28px;border:1px solid #dce5e1;border-radius:20px;background:white;box-shadow:0 18px 50px rgba(35,56,50,.07)}p{line-height:1.75}details{padding:14px 0;border-bottom:1px solid #e6ece9}summary{font-weight:750;cursor:pointer}.booking-links{display:flex;flex-wrap:wrap;gap:10px}.booking-links a{padding:12px 16px;border-radius:999px;background:#e7f3ef;text-decoration:none;font-weight:750}.disclosure{font-size:.78rem;color:#6b7773}@media(max-width:600px){main{padding-top:32px}section,.booking-box{padding:20px}}
</style>
</head>
<body>
<main>
<header><p class="eyebrow">${escapeHtml([article.destination, article.country].filter(Boolean).join(' · '))}</p><h1>${escapeHtml(article.title)}</h1><p class="lead">${escapeHtml(article.excerpt)}</p></header>
${hero}
<section><h2>${escapeHtml(labels.overview)}</h2>${paragraphsToHtml(article.introduction)}</section>
<section><h2>${escapeHtml(labels.itinerary)}</h2>${paragraphsToHtml(article.itineraryBody)}</section>
<section><h2>${escapeHtml(labels.tips)}</h2>${paragraphsToHtml(article.practicalTips)}</section>
${affiliateSection}
${faq}
</main>
</body>
</html>`;
  }

  downloadHtml(article, options = {}) {
    const html = this.generateHtml(article, options);
    downloadText(`${article.slug || 'destination-guide'}.html`, html, 'text/html');
    return html;
  }

  downloadSitemap(baseUrl = SEO_CONFIG.siteBaseUrl) {
    const published = this.getArticles().filter((article) => article.status === 'published');
    const urls = published.map((article) => `  <url>\n    <loc>${escapeHtml(buildCanonicalUrl(article, baseUrl))}</loc>\n    <lastmod>${escapeHtml(article.updatedAt.slice(0, 10))}</lastmod>\n  </url>`).join('\n');
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
    downloadText('sitemap.xml', xml, 'application/xml');
    return xml;
  }

  downloadRobots(baseUrl = SEO_CONFIG.siteBaseUrl) {
    const base = String(baseUrl || SEO_CONFIG.siteBaseUrl).replace(/\/$/, '');
    const text = `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`;
    downloadText('robots.txt', text, 'text/plain');
    return text;
  }
}

export const contentStudioService = new ContentStudioService();
