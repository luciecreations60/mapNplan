import { useEffect, useState } from 'react';
import { AFFILIATE_TEMPLATE_TOKENS } from '../../config/affiliate.config.js';
import { useAffiliate } from '../../hooks/useAffiliate.js';
import { useI18n } from '../../hooks/useI18n.js';
import { Button } from '../common/Button.jsx';
import { Card } from '../common/Card.jsx';
import { Icon } from '../common/Icon.jsx';
import { InlineNotice } from '../feedback/InlineNotice.jsx';

export function AffiliateSettingsCard() {
  const { locale, t } = useI18n();
  const {
    providers,
    analytics,
    updateProvider,
    resetProviders,
    clearAnalytics,
  } = useAffiliate();
  const [drafts, setDrafts] = useState(() => Object.fromEntries(providers.map((provider) => [provider.id, provider])));
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    setDrafts(Object.fromEntries(providers.map((provider) => [provider.id, provider])));
  }, [providers]);

  function patchDraft(providerId, patch) {
    setDrafts((current) => ({
      ...current,
      [providerId]: { ...current[providerId], ...patch },
    }));
  }

  function saveProvider(providerId) {
    updateProvider(providerId, drafts[providerId]);
    setFeedback({ tone: 'success', title: t('affiliate.settingsSaved'), message: t('affiliate.settingsSavedText') });
  }

  function handleResetProviders() {
    if (!window.confirm(t('affiliate.resetProvidersConfirm'))) return;
    resetProviders();
    setFeedback({ tone: 'success', title: t('affiliate.providersReset'), message: t('affiliate.providersResetText') });
  }

  function handleClearAnalytics() {
    if (!window.confirm(t('affiliate.clearAnalyticsConfirm'))) return;
    clearAnalytics();
    setFeedback({ tone: 'success', title: t('affiliate.analyticsCleared'), message: t('affiliate.analyticsClearedText') });
  }

  function formatDeclaredValues(values = {}) {
    const entries = Object.entries(values);
    if (entries.length === 0) return '—';
    return entries
      .slice(0, 3)
      .map(([currency, amount]) => {
        try {
          return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(Number(amount) || 0);
        } catch {
          return `${Number(amount) || 0} ${currency}`;
        }
      })
      .join(' · ');
  }

  return (
    <Card className="settings-card affiliate-settings-card" id="affiliate-partners">
      <header>
        <span className="settings-card__icon"><Icon name="externalLink" /></span>
        <div>
          <h2>{t('affiliate.settingsTitle')}</h2>
          <p>{t('affiliate.settingsIntro')}</p>
        </div>
      </header>

      {feedback && (
        <InlineNotice tone={feedback.tone} title={feedback.title}>
          {feedback.message}
        </InlineNotice>
      )}

      <div className="affiliate-analytics-grid">
        <div><span>{t('affiliate.clicks')}</span><strong>{analytics.clicks}</strong></div>
        <div><span>{t('affiliate.declaredConversions')}</span><strong>{analytics.conversions}</strong></div>
        <div><span>{t('affiliate.declaredBookingValue')}</span><strong>{formatDeclaredValues(analytics.declaredValueByCurrency)}</strong></div>
        <div><span>{t('affiliate.enabledPartners')}</span><strong>{providers.filter((provider) => provider.enabled).length}</strong></div>
      </div>

      <InlineNotice tone="warning" title={t('affiliate.noAgreementTitle')}>
        {t('affiliate.noAgreementText')}
      </InlineNotice>

      <div className="affiliate-provider-settings">
        {providers.map((provider) => {
          const draft = drafts[provider.id] || provider;
          const providerAnalytics = analytics.byProvider?.[provider.id] || { clicks: 0, conversions: 0 };
          return (
            <details key={provider.id} className="affiliate-provider-setting">
              <summary>
                <span className={draft.enabled ? 'affiliate-provider-setting__status affiliate-provider-setting__status--active' : 'affiliate-provider-setting__status'} />
                <div><strong>{provider.name}</strong><small>{t(`affiliate.categories.${provider.category}`)} · {providerAnalytics.clicks} {t('affiliate.clicks').toLocaleLowerCase()}</small></div>
                <span>{draft.enabled ? t('affiliate.enabled') : t('affiliate.disabled')}</span>
              </summary>
              <div className="affiliate-provider-setting__body">
                <label className="workspace-checkbox-field">
                  <input type="checkbox" checked={Boolean(draft.enabled)} onChange={(event) => patchDraft(provider.id, { enabled: event.target.checked })} />
                  <span><strong>{t('affiliate.enableProvider')}</strong><small>{t('affiliate.enableProviderText')}</small></span>
                </label>
                <div className="affiliate-settings-form-grid">
                  <label className="workspace-field"><span>{t('affiliate.homepageUrl')}</span><input type="url" value={draft.homepageUrl || ''} onChange={(event) => patchDraft(provider.id, { homepageUrl: event.target.value })} /></label>
                  <label className="workspace-field workspace-form__full"><span>{t('affiliate.searchTemplate')}</span><input value={draft.searchUrlTemplate || ''} onChange={(event) => patchDraft(provider.id, { searchUrlTemplate: event.target.value })} placeholder={t('affiliate.searchTemplatePlaceholder')} /></label>
                  <label className="workspace-field"><span>{t('affiliate.trackingParameter')}</span><input value={draft.affiliateParameter || ''} onChange={(event) => patchDraft(provider.id, { affiliateParameter: event.target.value })} placeholder="aid" /></label>
                  <label className="workspace-field"><span>{t('affiliate.trackingValue')}</span><input value={draft.affiliateValue || ''} onChange={(event) => patchDraft(provider.id, { affiliateValue: event.target.value })} /></label>
                </div>
                <p className="affiliate-template-help"><Icon name="info" size={15} /> {t('affiliate.templateTokens')}: {AFFILIATE_TEMPLATE_TOKENS.map((token) => `{{${token}}}`).join(', ')}</p>
                <div className="affiliate-provider-setting__actions">
                  <Button size="small" icon="save" onClick={() => saveProvider(provider.id)}>{t('affiliate.saveProvider')}</Button>
                </div>
              </div>
            </details>
          );
        })}
      </div>

      <div className="settings-actions affiliate-settings-actions">
        <div><strong>{t('affiliate.resetProviders')}</strong><p>{t('affiliate.resetProvidersText')}</p></div>
        <Button variant="secondary" icon="refresh" onClick={handleResetProviders}>{t('affiliate.resetProviders')}</Button>
      </div>
      <div className="settings-actions affiliate-settings-actions">
        <div><strong>{t('affiliate.clearAnalytics')}</strong><p>{t('affiliate.clearAnalyticsText')}</p></div>
        <Button variant="danger" icon="trash" onClick={handleClearAnalytics}>{t('affiliate.clearAnalytics')}</Button>
      </div>
    </Card>
  );
}
