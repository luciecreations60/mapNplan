import { useRef, useState } from 'react';
import { Button } from '../components/common/Button.jsx';
import { Card } from '../components/common/Card.jsx';
import { Icon } from '../components/common/Icon.jsx';
import { InlineNotice } from '../components/feedback/InlineNotice.jsx';
import { APP_CONFIG } from '../config/app.config.js';
import { useI18n } from '../hooks/useI18n.js';
import { useTheme } from '../hooks/useTheme.js';
import { useTrips } from '../hooks/useTrips.js';

export function SettingsPage() {
  const { language, locale, setLanguage, supportedLanguages, t } = useI18n();
  const { theme, setTheme } = useTheme();
  const { resetDemoData, exportBackup, importBackup, trips } = useTrips();
  const fileInputRef = useRef(null);
  const [feedback, setFeedback] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  const themes = [
    { id: 'light', label: t('theme.light'), icon: 'sun', description: t('theme.lightDescription') },
    { id: 'dark', label: t('theme.dark'), icon: 'moon', description: t('theme.darkDescription') },
    { id: 'system', label: t('theme.system'), icon: 'monitor', description: t('theme.systemDescription') },
  ];

  function showFeedback(tone, title, message) {
    setFeedback({ tone, title, message });
  }

  function handleLanguageChange(nextLanguage) {
    setLanguage(nextLanguage);
    setFeedback({
      tone: 'success',
      title: nextLanguage === 'fr' ? 'Langue mise à jour' : 'Language updated',
      message: nextLanguage === 'fr'
        ? 'La langue de l’interface a été mise à jour.'
        : 'The interface language has been updated.',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleReset() {
    const confirmed = window.confirm(t('settings.resetConfirm'));
    if (!confirmed) return;
    resetDemoData();
    showFeedback('success', t('settings.resetSuccessTitle'), t('settings.resetSuccessText'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleExport() {
    exportBackup();
    showFeedback(
      'success',
      t('settings.exportSuccessTitle'),
      t(trips.length === 1 ? 'settings.exportSuccessOne' : 'settings.exportSuccessMany', { count: trips.length }),
    );
  }

  async function handleImport(event) {
    const [file] = event.target.files || [];
    if (!file) return;

    const confirmed = window.confirm(t('settings.importConfirm'));
    if (!confirmed) {
      event.target.value = '';
      return;
    }

    setIsImporting(true);
    setFeedback(null);

    try {
      const importedTrips = await importBackup(file);
      showFeedback(
        'success',
        t('settings.importSuccessTitle'),
        t(importedTrips.length === 1 ? 'settings.importSuccessOne' : 'settings.importSuccessMany', { count: importedTrips.length }),
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      showFeedback('danger', t('settings.importFailed'), error.message || t('settings.importFailedText'));
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  }

  return (
    <div className="page-stack settings-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">{t('settings.eyebrow')}</p>
          <h1>{t('settings.title')}</h1>
          <p>{t('settings.intro')}</p>
        </div>
      </section>

      {feedback && (
        <InlineNotice tone={feedback.tone} title={feedback.title}>
          {feedback.message}
        </InlineNotice>
      )}

      <Card className="settings-card">
        <header>
          <span className="settings-card__icon"><Icon name="globe" /></span>
          <div>
            <h2>{t('language.title')}</h2>
            <p>{t('language.description')}</p>
          </div>
        </header>
        <div className="language-options" role="radiogroup" aria-label={t('language.title')}>
          {supportedLanguages.map((option) => (
            <button
              key={option.id}
              className={language === option.id ? 'language-option language-option--active' : 'language-option'}
              type="button"
              role="radio"
              aria-checked={language === option.id}
              onClick={() => handleLanguageChange(option.id)}
            >
              <span>{option.shortLabel}</span>
              <div>
                <strong>{option.label}</strong>
                <small>{option.locale}</small>
              </div>
              <i aria-hidden="true" />
            </button>
          ))}
        </div>
        <p className="settings-helper"><Icon name="info" size={16} /> {t('language.browserDetected')}</p>
      </Card>

      <Card className="settings-card">
        <header>
          <span className="settings-card__icon"><Icon name="monitor" /></span>
          <div><h2>{t('settings.appearance')}</h2><p>{t('settings.appearanceText')}</p></div>
        </header>
        <div className="theme-options">
          {themes.map((option) => (
            <button
              key={option.id}
              className={theme === option.id ? 'theme-option theme-option--active' : 'theme-option'}
              type="button"
              onClick={() => setTheme(option.id)}
            >
              <span><Icon name={option.icon} /></span>
              <div><strong>{option.label}</strong><small>{option.description}</small></div>
              <i aria-hidden="true" />
            </button>
          ))}
        </div>
      </Card>

      <Card className="settings-card">
        <header>
          <span className="settings-card__icon"><Icon name="settings" /></span>
          <div><h2>{t('settings.configuration')}</h2><p>{t('settings.configurationText')}</p></div>
        </header>
        <dl className="configuration-list">
          <div><dt>{t('settings.codeName')}</dt><dd>{APP_CONFIG.codeName}</dd></div>
          <div><dt>{t('settings.version')}</dt><dd>{APP_CONFIG.version}</dd></div>
          <div><dt>{t('settings.defaultCurrency')}</dt><dd>{APP_CONFIG.defaultCurrency}</dd></div>
          <div><dt>{t('language.title')}</dt><dd>{locale}</dd></div>
          <div><dt>{t('settings.storage')}</dt><dd>{t('settings.localStorage')}</dd></div>
        </dl>
      </Card>

      <Card className="settings-card">
        <header>
          <span className="settings-card__icon"><Icon name="download" /></span>
          <div>
            <h2>{t('settings.backup')}</h2>
            <p>{t('settings.backupText')}</p>
          </div>
        </header>

        <div className="settings-actions">
          <div>
            <strong>{t('settings.exportTitle')}</strong>
            <p>{t('settings.exportText')}</p>
          </div>
          <Button variant="secondary" icon="download" onClick={handleExport}>{t('settings.exportButton')}</Button>
        </div>

        <div className="settings-actions">
          <div>
            <strong>{t('settings.importTitle')}</strong>
            <p>{t('settings.importText')}</p>
          </div>
          <Button variant="secondary" icon="upload" disabled={isImporting} onClick={() => fileInputRef.current?.click()}>
            {isImporting ? t('settings.importing') : t('settings.importButton')}
          </Button>
          <input ref={fileInputRef} className="sr-only" type="file" accept="application/json,.json" onChange={handleImport} />
        </div>
      </Card>

      <Card className="settings-card settings-card--danger" id="reset-demo-data">
        <header>
          <span className="settings-card__icon"><Icon name="trash" /></span>
          <div>
            <h2>{t('settings.reset')}</h2>
            <p>{t('settings.resetText')}</p>
          </div>
        </header>
        <Button variant="danger" icon="trash" onClick={handleReset}>{t('settings.reset')}</Button>
      </Card>
    </div>
  );
}
