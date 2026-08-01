import { PROJECT_CONFIG } from '../project.config.js';
import { SEO_CONFIG } from '../src/config/seo.config.js';
import {
  buildBreadcrumbSchema,
  buildCanonicalUrl,
  buildDestinationSchema,
  buildFaqSchema,
  escapeHtml,
  normalizeBaseUrl,
  paragraphsToHtml,
  safeJsonLd,
} from '../src/utils/seoContent.js';

export function normalizePublicationArticle(article) {
  return {
    ...article,
    id: String(article?.id || ''),
    slug: String(article?.slug || '').trim(),
    language: SEO_CONFIG.supportedLanguages.includes(article?.language) ? article.language : SEO_CONFIG.defaultLanguage,
    status: article?.status === 'published' ? 'published' : 'draft',
    title: String(article?.title || '').trim(),
    metaTitle: String(article?.metaTitle || article?.title || '').trim(),
    metaDescription: String(article?.metaDescription || '').trim(),
    destination: String(article?.destination || '').trim(),
    country: String(article?.country || '').trim(),
    primaryKeyword: String(article?.primaryKeyword || '').trim(),
    secondaryKeywords: Array.isArray(article?.secondaryKeywords) ? article.secondaryKeywords.map(String) : [],
    heroImageUrl: String(article?.heroImageUrl || '').trim(),
    heroAlt: String(article?.heroAlt || '').trim(),
    excerpt: String(article?.excerpt || '').trim(),
    introduction: String(article?.introduction || '').trim(),
    itineraryBody: String(article?.itineraryBody || '').trim(),
    practicalTips: String(article?.practicalTips || '').trim(),
    faq: Array.isArray(article?.faq) ? article.faq : [],
    affiliateCategories: Array.isArray(article?.affiliateCategories) ? article.affiliateCategories : [],
    createdAt: article?.createdAt || new Date().toISOString(),
    updatedAt: article?.updatedAt || article?.createdAt || new Date().toISOString(),
    publishedAt: article?.publishedAt || article?.updatedAt || article?.createdAt || new Date().toISOString(),
  };
}

export function buildGuideHtml(article, allPublished, options = {}) {
  const baseUrl = normalizeBaseUrl(options.baseUrl || SEO_CONFIG.siteBaseUrl);
  const canonicalUrl = buildCanonicalUrl(article, baseUrl);
  const guideIndexUrl = `${baseUrl}${SEO_CONFIG.publicPathPrefix}/`;
  const labels = article.language === 'fr'
    ? {
        guides: 'Guides de voyage', overview: 'Vue d’ensemble', itinerary: 'Itinéraire suggéré',
        tips: 'Conseils pratiques', faq: 'Questions fréquentes', related: 'Autres guides',
        plan: 'Organiser un voyage', updated: 'Mis à jour le', home: 'Accueil',
      }
    : {
        guides: 'Travel guides', overview: 'Overview', itinerary: 'Suggested itinerary',
        tips: 'Practical planning tips', faq: 'Frequently asked questions', related: 'More travel guides',
        plan: 'Plan a trip', updated: 'Updated', home: 'Home',
      };
  const schemas = [
    buildDestinationSchema(article, canonicalUrl),
    buildBreadcrumbSchema(article, canonicalUrl, baseUrl),
    buildFaqSchema(article),
  ].filter(Boolean);
  const title = escapeHtml(article.metaTitle || article.title);
  const description = escapeHtml(article.metaDescription || article.excerpt);
  const image = article.heroImageUrl || SEO_CONFIG.defaultSocialImageUrl;
  const imageMeta = image
    ? `<meta property="og:image" content="${escapeHtml(image)}">\n<meta name="twitter:image" content="${escapeHtml(image)}">`
    : '';
  const verification = SEO_CONFIG.googleSiteVerification
    ? `<meta name="google-site-verification" content="${escapeHtml(SEO_CONFIG.googleSiteVerification)}">`
    : '';
  const hero = article.heroImageUrl
    ? `<figure class="hero-image"><img src="${escapeHtml(article.heroImageUrl)}" alt="${escapeHtml(article.heroAlt)}" width="1200" height="675"></figure>`
    : '';
  const faq = article.faq.length
    ? `<section><h2>${escapeHtml(labels.faq)}</h2>${article.faq.map((item) => `<details><summary>${escapeHtml(item.question)}</summary><p>${escapeHtml(item.answer)}</p></details>`).join('')}</section>`
    : '';
  const related = allPublished
    .filter((item) => item.slug !== article.slug)
    .slice(0, 4);
  const relatedHtml = related.length
    ? `<section><h2>${escapeHtml(labels.related)}</h2><div class="related">${related.map((item) => `<a href="${escapeHtml(buildCanonicalUrl(item, baseUrl))}"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml([item.destination, item.country].filter(Boolean).join(', '))}</span></a>`).join('')}</div></section>`
    : '';
  const jsonLd = schemas.map((schema) => `<script type="application/ld+json">${safeJsonLd(schema)}</script>`).join('\n');
  const appUrl = `${baseUrl}/#/dashboard`;

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
<meta property="og:site_name" content="${escapeHtml(PROJECT_CONFIG.brandName)}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${escapeHtml(canonicalUrl)}">
<meta name="twitter:card" content="summary_large_image">
${imageMeta}
${verification}
${jsonLd}
<style>
:root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#17211e;background:#f6f8f7;line-height:1.5}*{box-sizing:border-box}body{margin:0}a{color:#28624f}.site-nav{border-bottom:1px solid #dfe8e4;background:#fff}.site-nav>div{display:flex;width:min(980px,calc(100% - 32px));margin:auto;align-items:center;justify-content:space-between;padding:16px 0;gap:16px}.brand{font-weight:900;text-decoration:none;color:#17211e}.site-nav nav{display:flex;gap:14px;align-items:center}.site-nav nav a{font-size:.88rem;font-weight:750;text-decoration:none}.cta{padding:9px 14px;border-radius:999px;background:#28624f;color:white}.breadcrumbs{font-size:.78rem;color:#65746f}.breadcrumbs a{text-decoration:none}main{width:min(900px,calc(100% - 32px));margin:auto;padding:48px 0 80px}.eyebrow{font-size:.78rem;font-weight:850;letter-spacing:.12em;text-transform:uppercase;color:#4e7f70}h1{font-size:clamp(2.25rem,6vw,4.7rem);line-height:1.03;margin:.3em 0}.lead{max-width:760px;font-size:1.16rem;line-height:1.7;color:#52615d}.updated{display:block;margin-top:12px;color:#75817d;font-size:.76rem}.hero-image{margin:30px 0}.hero-image img{display:block;width:100%;height:auto;max-height:520px;object-fit:cover;border-radius:24px}section{margin-top:30px;padding:28px;border:1px solid #dce5e1;border-radius:20px;background:white;box-shadow:0 18px 50px rgba(35,56,50,.07)}section h2{margin-top:0}p{line-height:1.78}details{padding:14px 0;border-bottom:1px solid #e6ece9}summary{font-weight:780;cursor:pointer}.related{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.related a{display:grid;gap:4px;padding:15px;border:1px solid #e2e9e6;border-radius:14px;text-decoration:none}.related span{font-size:.78rem;color:#65746f}footer{padding:26px 16px;border-top:1px solid #dfe8e4;text-align:center;color:#65746f;font-size:.78rem;background:white}@media(max-width:650px){.site-nav nav a:not(.cta){display:none}main{padding-top:30px}section{padding:20px}.related{grid-template-columns:1fr}}
</style>
</head>
<body>
<header class="site-nav"><div><a class="brand" href="${escapeHtml(baseUrl)}/">${escapeHtml(PROJECT_CONFIG.brandName)}</a><nav><a href="${escapeHtml(guideIndexUrl)}">${escapeHtml(labels.guides)}</a><a class="cta" href="${escapeHtml(appUrl)}">${escapeHtml(labels.plan)}</a></nav></div></header>
<main>
<nav class="breadcrumbs"><a href="${escapeHtml(baseUrl)}/">${escapeHtml(labels.home)}</a> / <a href="${escapeHtml(guideIndexUrl)}">${escapeHtml(labels.guides)}</a> / ${escapeHtml(article.destination)}</nav>
<header><p class="eyebrow">${escapeHtml([article.destination, article.country].filter(Boolean).join(' · '))}</p><h1>${escapeHtml(article.title)}</h1><p class="lead">${escapeHtml(article.excerpt)}</p><time class="updated" datetime="${escapeHtml(article.updatedAt)}">${escapeHtml(labels.updated)} ${escapeHtml(new Date(article.updatedAt).toLocaleDateString(article.language === 'fr' ? 'fr-FR' : 'en-GB'))}</time></header>
${hero}
<section><h2>${escapeHtml(labels.overview)}</h2>${paragraphsToHtml(article.introduction)}</section>
<section><h2>${escapeHtml(labels.itinerary)}</h2>${paragraphsToHtml(article.itineraryBody)}</section>
<section><h2>${escapeHtml(labels.tips)}</h2>${paragraphsToHtml(article.practicalTips)}</section>
${faq}
${relatedHtml}
</main>
<footer>© ${new Date().getFullYear()} ${escapeHtml(PROJECT_CONFIG.brandName)} · ${escapeHtml(PROJECT_CONFIG.tagline)}</footer>
</body>
</html>`;
}

export function buildGuideIndexHtml(articles, options = {}) {
  const baseUrl = normalizeBaseUrl(options.baseUrl || SEO_CONFIG.siteBaseUrl);
  const canonical = `${baseUrl}${SEO_CONFIG.publicPathPrefix}/`;
  const cards = articles.map((article) => `<article><p>${escapeHtml([article.destination, article.country].filter(Boolean).join(' · '))}</p><h2><a href="${escapeHtml(buildCanonicalUrl(article, baseUrl))}">${escapeHtml(article.title)}</a></h2><span>${escapeHtml(article.excerpt)}</span></article>`).join('');
  const itemSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${PROJECT_CONFIG.brandName} travel guides`,
    url: canonical,
    hasPart: articles.map((article) => ({ '@type': 'Article', name: article.title, url: buildCanonicalUrl(article, baseUrl) })),
  };
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Travel guides and itineraries | ${escapeHtml(PROJECT_CONFIG.brandName)}</title><meta name="description" content="Practical destination guides and realistic travel itineraries created with ${escapeHtml(PROJECT_CONFIG.brandName)}."><meta name="robots" content="index,follow"><link rel="canonical" href="${escapeHtml(canonical)}"><script type="application/ld+json">${safeJsonLd(itemSchema)}</script><style>:root{font-family:Inter,system-ui,sans-serif;color:#17211e;background:#f6f8f7}*{box-sizing:border-box}body{margin:0}main{width:min(1000px,calc(100% - 32px));margin:auto;padding:60px 0}a{color:#28624f}h1{font-size:clamp(2.2rem,6vw,4.5rem);margin-bottom:8px}.lead{color:#52615d;font-size:1.1rem}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:36px}article{padding:22px;border:1px solid #dce5e1;border-radius:18px;background:#fff}article p{font-size:.72rem;font-weight:800;text-transform:uppercase;color:#4e7f70}article h2{font-size:1.2rem}article h2 a{text-decoration:none}article span{color:#5c6965;line-height:1.6}@media(max-width:680px){.grid{grid-template-columns:1fr}}</style></head><body><main><a href="${escapeHtml(baseUrl)}/">← ${escapeHtml(PROJECT_CONFIG.brandName)}</a><h1>Travel guides and itineraries</h1><p class="lead">Useful planning pages designed around realistic days, clear priorities and flexible travel.</p><section class="grid">${cards}</section></main></body></html>`;
}

export function buildSitemapXml(articles, options = {}) {
  const baseUrl = normalizeBaseUrl(options.baseUrl || SEO_CONFIG.siteBaseUrl);
  const urls = [
    { loc: `${baseUrl}/`, lastmod: options.generatedAt },
    { loc: `${baseUrl}${SEO_CONFIG.publicPathPrefix}/`, lastmod: options.generatedAt },
    ...articles.map((article) => ({ loc: buildCanonicalUrl(article, baseUrl), lastmod: String(article.updatedAt || '').slice(0, 10) })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(({ loc, lastmod }) => `  <url>\n    <loc>${escapeHtml(loc)}</loc>${lastmod ? `\n    <lastmod>${escapeHtml(lastmod)}</lastmod>` : ''}\n  </url>`).join('\n')}\n</urlset>\n`;
}

export function buildRobotsTxt(options = {}) {
  const baseUrl = normalizeBaseUrl(options.baseUrl || SEO_CONFIG.siteBaseUrl);
  return `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`;
}
