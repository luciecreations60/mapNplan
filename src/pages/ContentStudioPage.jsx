import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button.jsx';
import { Card } from '../components/common/Card.jsx';
import { ConfirmDialog } from '../components/common/ConfirmDialog.jsx';
import { Icon } from '../components/common/Icon.jsx';
import { Modal } from '../components/common/Modal.jsx';
import { InlineNotice } from '../components/feedback/InlineNotice.jsx';
import { SEO_CONFIG } from '../config/seo.config.js';
import { useContentStudio } from '../hooks/useContentStudio.js';
import { useI18n } from '../hooks/useI18n.js';
import { createId } from '../utils/id.js';
import { scoreSeoArticle, slugify } from '../utils/seoContent.js';

const EMPTY_ARTICLE = Object.freeze({
  id: '',
  slug: '',
  language: 'en',
  status: 'draft',
  title: '',
  metaTitle: '',
  metaDescription: '',
  destination: '',
  country: '',
  primaryKeyword: '',
  secondaryKeywords: [],
  heroImageUrl: '',
  heroAlt: '',
  excerpt: '',
  introduction: '',
  itineraryBody: '',
  practicalTips: '',
  faq: [],
  affiliateCategories: [],
});

export function ContentStudioPage() {
  const navigate = useNavigate();
  const importInputRef = useRef(null);
  const { locale, t } = useI18n();
  const {
    articles,
    saveArticle,
    deleteArticle,
    duplicateArticle,
    exportLibrary,
    exportPublication,
    auditPublication,
    importLibrary,
    downloadHtml,
    downloadSitemap,
    downloadRobots,
  } = useContentStudio();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [notice, setNotice] = useState(null);
  const [baseUrl, setBaseUrl] = useState(SEO_CONFIG.siteBaseUrl);

  const filteredArticles = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return articles
      .filter((article) => statusFilter === 'all' || article.status === statusFilter)
      .filter((article) => languageFilter === 'all' || article.language === languageFilter)
      .filter((article) => !needle || [article.title, article.destination, article.country, article.primaryKeyword]
        .some((value) => String(value || '').toLowerCase().includes(needle)))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [articles, languageFilter, query, statusFilter]);

  const summary = useMemo(() => ({
    total: articles.length,
    published: articles.filter((article) => article.status === 'published').length,
    drafts: articles.filter((article) => article.status === 'draft').length,
    averageScore: articles.length
      ? Math.round(articles.reduce((sum, article) => sum + scoreSeoArticle(article).score, 0) / articles.length)
      : 0,
  }), [articles]);

  const publicationAudit = useMemo(
    () => auditPublication(baseUrl),
    [articles, auditPublication, baseUrl],
  );

  async function handleImport(event) {
    const [file] = event.target.files || [];
    event.target.value = '';
    if (!file) return;
    try {
      const result = await importLibrary(file);
      setNotice({ tone: 'success', title: t('seoStudio.importedTitle'), message: t('seoStudio.importedText', { count: result.articles.length }) });
    } catch {
      setNotice({ tone: 'danger', title: t('seoStudio.importFailedTitle'), message: t('seoStudio.importFailedText') });
    }
  }

  function handleSave(payload) {
    const saved = saveArticle(payload);
    setEditing(null);
    setNotice({ tone: 'success', title: t('seoStudio.savedTitle'), message: t('seoStudio.savedText', { title: saved.title }) });
  }

  function handleDelete() {
    if (!pendingDelete) return;
    deleteArticle(pendingDelete.id);
    setNotice({ tone: 'success', title: t('seoStudio.deletedTitle'), message: t('seoStudio.deletedText', { title: pendingDelete.title }) });
    setPendingDelete(null);
  }

  return (
    <div className="page-stack seo-studio-page">
      <section className="page-heading seo-studio-heading">
        <div>
          <p className="eyebrow">{t('seoStudio.eyebrow')}</p>
          <h1>{t('seoStudio.title')}</h1>
          <p>{t('seoStudio.intro')}</p>
        </div>
        <div className="seo-studio-heading__actions">
          <Button variant="secondary" icon="upload" onClick={() => importInputRef.current?.click()}>{t('seoStudio.import')}</Button>
          <Button variant="secondary" icon="download" onClick={() => {
            exportLibrary();
            setNotice({ tone: 'success', title: t('seoStudio.exportedTitle'), message: t('seoStudio.exportedText') });
          }}>{t('seoStudio.export')}</Button>
          <Button icon="plus" onClick={() => setEditing({ ...EMPTY_ARTICLE, language: locale.startsWith('fr') ? 'fr' : 'en' })}>{t('seoStudio.newPage')}</Button>
          <input ref={importInputRef} type="file" accept="application/json,.json" hidden onChange={handleImport} />
        </div>
      </section>

      {notice && <InlineNotice tone={notice.tone} title={notice.title} className="page-notice">{notice.message}</InlineNotice>}

      <section className="seo-studio-summary" aria-label={t('seoStudio.summaryAria')}>
        <SeoSummaryCard icon="fileText" label={t('seoStudio.total')} value={summary.total} />
        <SeoSummaryCard icon="globe" label={t('seoStudio.published')} value={summary.published} />
        <SeoSummaryCard icon="edit" label={t('seoStudio.drafts')} value={summary.drafts} />
        <SeoSummaryCard icon="chart" label={t('seoStudio.averageScore')} value={`${summary.averageScore}/100`} />
      </section>

      <Card className="seo-export-tools">
        <div>
          <p className="eyebrow">{t('seoStudio.technicalEyebrow')}</p>
          <h2>{t('seoStudio.technicalTitle')}</h2>
          <p>{t('seoStudio.technicalText')}</p>
        </div>
        <label className="workspace-field">
          <span>{t('seoStudio.baseUrl')}</span>
          <input value={baseUrl} placeholder="https://example.com" onChange={(event) => setBaseUrl(event.target.value)} />
        </label>
        <div className="seo-export-tools__actions">
          <Button variant="secondary" icon="download" onClick={() => {
            const payload = exportPublication();
            setNotice({ tone: 'success', title: t('seoStudio.publicationExportedTitle'), message: t('seoStudio.publicationExportedText', { count: payload.articles.length }) });
          }}>{t('seoStudio.publicationFile')}</Button>
          <Button variant="secondary" icon="download" onClick={() => downloadSitemap(baseUrl)}>{t('seoStudio.sitemap')}</Button>
          <Button variant="secondary" icon="download" onClick={() => downloadRobots(baseUrl)}>{t('seoStudio.robots')}</Button>
        </div>
      </Card>

      <Card className="seo-publication-guide">
        <div className="seo-publication-guide__header">
          <span><Icon name="globe" size={22} /></span>
          <div>
            <p className="eyebrow">{t('seoStudio.publicationEyebrow')}</p>
            <h2>{t('seoStudio.publicationTitle')}</h2>
            <p>{t('seoStudio.publicationText')}</p>
          </div>
          <strong className={`seo-publication-status ${publicationAudit.passed ? 'is-ready' : 'has-errors'}`}>
            {publicationAudit.passed ? t('seoStudio.readyToPublish') : t('seoStudio.needsAttention')}
          </strong>
        </div>
        <ol className="seo-publication-steps">
          <li><strong>1</strong><span>{t('seoStudio.publicationStep1')}</span></li>
          <li><strong>2</strong><span>{t('seoStudio.publicationStep2')}</span></li>
          <li><strong>3</strong><span>{t('seoStudio.publicationStep3')}</span></li>
          <li><strong>4</strong><span>{t('seoStudio.publicationStep4')}</span></li>
        </ol>
        <div className="seo-publication-audit">
          {publicationAudit.checks.map((check) => (
            <span key={check.id} className={check.passed ? 'is-passed' : 'is-failed'}>
              <Icon name={check.passed ? 'checkCircle' : 'alertTriangle'} size={15} />
              {t(`seoStudio.publicationChecks.${check.id}`)}
            </span>
          ))}
        </div>
        <p className="seo-publication-path"><code>{SEO_CONFIG.publicationFilePath}</code> · {publicationAudit.publishedCount} {t('seoStudio.publishedPagesLabel')}</p>
      </Card>

      <Card className="seo-studio-filters">
        <label className="seo-studio-search">
          <Icon name="search" size={17} />
          <input value={query} placeholder={t('seoStudio.searchPlaceholder')} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label={t('seoStudio.filterStatus')}>
          <option value="all">{t('seoStudio.allStatuses')}</option>
          <option value="draft">{t('seoStudio.statuses.draft')}</option>
          <option value="published">{t('seoStudio.statuses.published')}</option>
        </select>
        <select value={languageFilter} onChange={(event) => setLanguageFilter(event.target.value)} aria-label={t('seoStudio.filterLanguage')}>
          <option value="all">{t('seoStudio.allLanguages')}</option>
          <option value="en">English</option>
          <option value="fr">Français</option>
        </select>
      </Card>

      {filteredArticles.length > 0 ? (
        <section className="seo-article-grid">
          {filteredArticles.map((article) => (
            <SeoArticleCard
              key={article.id}
              article={article}
              t={t}
              locale={locale}
              onPreview={() => navigate(`/guides/${article.slug}`)}
              onEdit={() => setEditing(article)}
              onDownload={() => downloadHtml(article, { baseUrl, locale })}
              onDuplicate={() => {
                const duplicated = duplicateArticle(article.id);
                setNotice({ tone: 'success', title: t('seoStudio.duplicatedTitle'), message: t('seoStudio.duplicatedText', { title: duplicated.title }) });
              }}
              onDelete={() => setPendingDelete(article)}
            />
          ))}
        </section>
      ) : (
        <section className="workspace-large-empty">
          <span><Icon name="fileText" size={28} /></span>
          <h3>{t('seoStudio.emptyTitle')}</h3>
          <p>{t('seoStudio.emptyText')}</p>
          <Button icon="plus" onClick={() => setEditing({ ...EMPTY_ARTICLE, language: locale.startsWith('fr') ? 'fr' : 'en' })}>{t('seoStudio.newPage')}</Button>
        </section>
      )}

      <ArticleEditor
        article={editing}
        t={t}
        onClose={() => setEditing(null)}
        onSave={handleSave}
      />

      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        title={t('seoStudio.deleteTitle')}
        description={t('seoStudio.deleteText', { title: pendingDelete?.title || '' })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleDelete}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
}

function SeoSummaryCard({ icon, label, value }) {
  return (
    <Card className="seo-summary-card">
      <span><Icon name={icon} size={20} /></span>
      <div><strong>{value}</strong><small>{label}</small></div>
    </Card>
  );
}

function SeoArticleCard({ article, t, locale, onPreview, onEdit, onDownload, onDuplicate, onDelete }) {
  const result = scoreSeoArticle(article);
  return (
    <Card className="seo-article-card">
      <header>
        <span className="seo-article-card__icon"><Icon name="globe" size={20} /></span>
        <div>
          <small>{article.language.toUpperCase()} · {t(`seoStudio.statuses.${article.status}`)}</small>
          <h2>{article.title}</h2>
          <p>{article.destination}{article.country ? `, ${article.country}` : ''}</p>
        </div>
        <strong className={`seo-score seo-score--${result.score >= 80 ? 'good' : result.score >= 55 ? 'medium' : 'low'}`}>{result.score}</strong>
      </header>
      <p className="seo-article-card__excerpt">{article.excerpt || article.metaDescription}</p>
      <div className="seo-article-card__meta">
        <span><Icon name="search" size={14} /> {article.primaryKeyword || t('seoStudio.keywordMissing')}</span>
        <span><Icon name="fileText" size={14} /> {t('seoStudio.words', { count: result.wordCount })}</span>
        <span><Icon name="calendar" size={14} /> {new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(article.updatedAt))}</span>
      </div>
      <div className="seo-article-card__actions">
        <Button size="small" icon="eye" onClick={onPreview}>{t('seoStudio.preview')}</Button>
        <Button size="small" variant="secondary" icon="download" onClick={onDownload}>{t('seoStudio.html')}</Button>
        <button className="icon-button" type="button" aria-label={t('common.edit')} onClick={onEdit}><Icon name="edit" size={17} /></button>
        <button className="icon-button" type="button" aria-label={t('seoStudio.duplicate')} onClick={onDuplicate}><Icon name="copy" size={17} /></button>
        <button className="icon-button icon-button--danger" type="button" aria-label={t('common.delete')} onClick={onDelete}><Icon name="trash" size={17} /></button>
      </div>
    </Card>
  );
}

function ArticleEditor({ article, t, onClose, onSave }) {
  const [form, setForm] = useState(article || EMPTY_ARTICLE);

  useEffect(() => {
    setForm(article || EMPTY_ARTICLE);
  }, [article]);

  if (!article) return null;

  const score = scoreSeoArticle(form);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  function handleTitle(value) {
    setForm((current) => ({
      ...current,
      title: value,
      metaTitle: current.metaTitle || value,
      slug: current.slug || slugify(value),
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSave({
      ...form,
      slug: slugify(form.slug || form.title),
      secondaryKeywords: String(form.secondaryKeywords || '').split(',').map((item) => item.trim()).filter(Boolean),
      faq: (form.faq || []).filter((item) => item.question || item.answer),
    });
  }

  return (
    <Modal isOpen title={form.id ? t('seoStudio.editTitle') : t('seoStudio.createTitle')} description={t('seoStudio.editorText')} onClose={onClose}>
      <form className="seo-editor" onSubmit={handleSubmit}>
        <aside className="seo-editor-score">
          <div className={`seo-editor-score__value seo-score--${score.score >= 80 ? 'good' : score.score >= 55 ? 'medium' : 'low'}`}>{score.score}/100</div>
          <strong>{t('seoStudio.scoreTitle')}</strong>
          <small>{t('seoStudio.words', { count: score.wordCount })}</small>
          <ul>{score.checks.map((check) => <li key={check.id} className={check.passed ? 'is-passed' : ''}><Icon name={check.passed ? 'checkCircle' : 'circle'} size={15} /> {t(`seoStudio.checks.${check.id}`)}</li>)}</ul>
        </aside>

        <div className="seo-editor__body">
          <fieldset><legend>{t('seoStudio.general')}</legend><div className="seo-editor-grid">
            <label className="workspace-field workspace-form__wide"><span>{t('seoStudio.articleTitle')}</span><input required value={form.title} onChange={(event) => handleTitle(event.target.value)} /></label>
            <label className="workspace-field"><span>{t('seoStudio.destination')}</span><input required value={form.destination} onChange={(event) => update('destination', event.target.value)} /></label>
            <label className="workspace-field"><span>{t('seoStudio.country')}</span><input value={form.country} onChange={(event) => update('country', event.target.value)} /></label>
            <label className="workspace-field"><span>{t('seoStudio.language')}</span><select value={form.language} onChange={(event) => update('language', event.target.value)}><option value="en">English</option><option value="fr">Français</option></select></label>
            <label className="workspace-field"><span>{t('seoStudio.status')}</span><select value={form.status} onChange={(event) => update('status', event.target.value)}><option value="draft">{t('seoStudio.statuses.draft')}</option><option value="published">{t('seoStudio.statuses.published')}</option></select></label>
            <label className="workspace-field workspace-form__full"><span>{t('seoStudio.excerpt')}</span><textarea rows="3" value={form.excerpt} onChange={(event) => update('excerpt', event.target.value)} /></label>
          </div></fieldset>

          <fieldset><legend>{t('seoStudio.seoFields')}</legend><div className="seo-editor-grid">
            <label className="workspace-field workspace-form__wide"><span>{t('seoStudio.metaTitle')}</span><input required value={form.metaTitle} onChange={(event) => update('metaTitle', event.target.value)} /><small>{form.metaTitle.length}/{SEO_CONFIG.title.recommendedMaximum}</small></label>
            <label className="workspace-field"><span>{t('seoStudio.slug')}</span><input required value={form.slug} onChange={(event) => update('slug', slugify(event.target.value))} /></label>
            <label className="workspace-field"><span>{t('seoStudio.primaryKeyword')}</span><input required value={form.primaryKeyword} onChange={(event) => update('primaryKeyword', event.target.value)} /></label>
            <label className="workspace-field workspace-form__full"><span>{t('seoStudio.metaDescription')}</span><textarea required rows="3" value={form.metaDescription} onChange={(event) => update('metaDescription', event.target.value)} /><small>{form.metaDescription.length}/{SEO_CONFIG.description.recommendedMaximum}</small></label>
            <label className="workspace-field workspace-form__full"><span>{t('seoStudio.secondaryKeywords')}</span><input value={Array.isArray(form.secondaryKeywords) ? form.secondaryKeywords.join(', ') : form.secondaryKeywords} onChange={(event) => update('secondaryKeywords', event.target.value)} /></label>
            <label className="workspace-field workspace-form__wide"><span>{t('seoStudio.heroImage')}</span><input type="url" value={form.heroImageUrl} onChange={(event) => update('heroImageUrl', event.target.value)} /></label>
            <label className="workspace-field"><span>{t('seoStudio.heroAlt')}</span><input value={form.heroAlt} onChange={(event) => update('heroAlt', event.target.value)} /></label>
          </div></fieldset>

          <fieldset><legend>{t('seoStudio.content')}</legend><div className="seo-editor-grid">
            <label className="workspace-field workspace-form__full"><span>{t('seoStudio.introduction')}</span><textarea rows="6" value={form.introduction} onChange={(event) => update('introduction', event.target.value)} /></label>
            <label className="workspace-field workspace-form__full"><span>{t('seoStudio.itinerary')}</span><textarea rows="8" value={form.itineraryBody} onChange={(event) => update('itineraryBody', event.target.value)} /></label>
            <label className="workspace-field workspace-form__full"><span>{t('seoStudio.tips')}</span><textarea rows="6" value={form.practicalTips} onChange={(event) => update('practicalTips', event.target.value)} /></label>
          </div></fieldset>

          <fieldset><legend>{t('seoStudio.faq')}</legend><div className="seo-faq-editor">
            {(form.faq || []).map((item, index) => (
              <div key={item.id || index} className="seo-faq-editor__item">
                <label className="workspace-field"><span>{t('seoStudio.question')}</span><input value={item.question} onChange={(event) => updateFaq(setForm, index, 'question', event.target.value)} /></label>
                <label className="workspace-field"><span>{t('seoStudio.answer')}</span><textarea rows="3" value={item.answer} onChange={(event) => updateFaq(setForm, index, 'answer', event.target.value)} /></label>
                <button type="button" className="icon-button icon-button--danger" aria-label={t('common.delete')} onClick={() => setForm((current) => ({ ...current, faq: current.faq.filter((_, itemIndex) => itemIndex !== index) }))}><Icon name="trash" size={16} /></button>
              </div>
            ))}
            <Button type="button" variant="secondary" size="small" icon="plus" onClick={() => setForm((current) => ({ ...current, faq: [...(current.faq || []), { id: createId('faq'), question: '', answer: '' }] }))}>{t('seoStudio.addQuestion')}</Button>
          </div></fieldset>

          <fieldset><legend>{t('seoStudio.monetisation')}</legend><div className="seo-affiliate-options">
            {['hotels', 'flights', 'activities', 'cars', 'esim', 'insurance'].map((category) => (
              <label key={category}><input type="checkbox" checked={form.affiliateCategories.includes(category)} onChange={(event) => setForm((current) => ({ ...current, affiliateCategories: event.target.checked ? [...current.affiliateCategories, category] : current.affiliateCategories.filter((item) => item !== category) }))} /> <span>{t(`affiliate.categories.${category}`)}</span></label>
            ))}
          </div><p className="settings-helper"><Icon name="info" size={16} /> {t('seoStudio.affiliateHelp')}</p></fieldset>

          <footer className="modal__footer modal__footer--standalone"><Button type="button" variant="ghost" onClick={onClose}>{t('common.cancel')}</Button><Button type="submit" icon="save">{t('common.save')}</Button></footer>
        </div>
      </form>
    </Modal>
  );
}

function updateFaq(setForm, index, key, value) {
  setForm((current) => ({
    ...current,
    faq: current.faq.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)),
  }));
}
