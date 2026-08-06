import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Icon } from '../components/common/Icon.jsx';
import { SEO_CONFIG } from '../config/seo.config.js';
import publication from '../../content/seo-pages.json';
import { useI18n } from '../hooks/useI18n.js';
import { buildCanonicalUrl, buildDestinationSchema, buildFaqSchema, safeJsonLd } from '../utils/seoContent.js';

export function PublicDestinationPage() {
  const { slug } = useParams();
  const { t } = useI18n();
  const article = publication.articles.find((entry) => entry.slug === slug && entry.status === 'published') || null;

  useEffect(() => {
    if (!article) return undefined;
    const originalTitle = document.title;
    document.title = article.metaTitle || article.title;
    const restorers = [
      setMeta('name', 'description', article.metaDescription || article.excerpt),
      setMeta('property', 'og:title', article.metaTitle || article.title),
      setMeta('property', 'og:description', article.metaDescription || article.excerpt),
    ];
    return () => {
      document.title = originalTitle;
      restorers.forEach((restore) => restore());
    };
  }, [article]);

  if (!article) {
    return <main className="public-guide public-guide--empty"><Icon name="fileText" size={34} /><h1>{t('publicGuide.missingTitle')}</h1><p>{t('publicGuide.missingText')}</p><Link to="/explore">{t('navigation.explore')}</Link></main>;
  }

  const canonical = buildCanonicalUrl(article, SEO_CONFIG.siteBaseUrl);
  const schemas = [buildDestinationSchema(article, canonical), buildFaqSchema(article)].filter(Boolean);

  return (
    <main className="public-guide">
      {schemas.map((schema, index) => <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }} />)}
      <nav className="public-guide__nav"><Link to="/explore"><Icon name="arrowLeft" size={17} /> {t('navigation.explore')}</Link><span>{t('publicGuide.badge')}</span></nav>
      <article>
        <header className="public-guide__hero">
          <p className="eyebrow">{[article.destination, article.country].filter(Boolean).join(' · ')}</p>
          <h1>{article.title}</h1>
          <p>{article.excerpt}</p>
          <div><span>{article.primaryKeyword}</span><span>{article.language.toUpperCase()}</span><span>{t(`publicGuide.statuses.${article.status}`)}</span></div>
        </header>
        {article.heroImageUrl && <figure className="public-guide__image"><img src={article.heroImageUrl} alt={article.heroAlt} /></figure>}
        <GuideSection title={t('publicGuide.overview')} body={article.introduction} />
        <GuideSection title={t('publicGuide.itinerary')} body={article.itineraryBody} />
        <GuideSection title={t('publicGuide.tips')} body={article.practicalTips} />
        {article.affiliateCategories.length > 0 && <aside className="public-guide__affiliate"><Icon name="info" size={18} /><div><strong>{t('publicGuide.affiliateTitle')}</strong><p>{t('publicGuide.affiliateText')}</p></div></aside>}
        {article.faq.length > 0 && <section className="public-guide__section"><h2>{t('publicGuide.faq')}</h2>{article.faq.map((item) => <details key={item.id}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</section>}
      </article>
    </main>
  );
}

function GuideSection({ title, body }) {
  if (!body) return null;
  return <section className="public-guide__section"><h2>{title}</h2>{body.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</section>;
}

function setMeta(attribute, key, content) {
  if (!content) return () => {};
  const existing = document.head.querySelector(`meta[${attribute}="${key}"]`);
  const previous = existing?.getAttribute('content') ?? null;
  const element = existing || document.createElement('meta');
  if (!existing) {
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
  return () => {
    if (existing && previous !== null) element.setAttribute('content', previous);
    else element.remove();
  };
}
