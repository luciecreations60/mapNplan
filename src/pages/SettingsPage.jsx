import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '../components/common/Button.jsx';
import { Card } from '../components/common/Card.jsx';
import { Icon } from '../components/common/Icon.jsx';
import { InlineNotice } from '../components/feedback/InlineNotice.jsx';
import { AffiliateSettingsCard } from '../components/settings/AffiliateSettingsCard.jsx';
import { APP_CONFIG } from '../config/app.config.js';
import { useI18n } from '../hooks/useI18n.js';
import { useTheme } from '../hooks/useTheme.js';
import { useTrips } from '../hooks/useTrips.js';
import { attachmentStorageService } from '../services/storage/AttachmentStorageService.js';
import { storageHealthService } from '../services/storage/StorageHealthService.js';

export function SettingsPage() {
  const { language, locale, setLanguage, supportedLanguages, t } = useI18n();
  const { theme, setTheme } = useTheme();
  const { clearLocalTripData, exportBackup, importBackup, trips } = useTrips();
  const fileInputRef = useRef(null);
  const [feedback, setFeedback] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [storageUsage, setStorageUsage] = useState(null);
  const [storageHealth, setStorageHealth] = useState(null);
  const [isCheckingStorage, setIsCheckingStorage] = useState(false);
  const [isCleaningStorage, setIsCleaningStorage] = useState(false);
  const [isRequestingPersistence, setIsRequestingPersistence] = useState(false);

  const themes = [
    { id: 'light', label: t('theme.light'), icon: 'sun', description: t('theme.lightDescription') },
    { id: 'dark', label: t('theme.dark'), icon: 'moon', description: t('theme.darkDescription') },
    { id: 'system', label: t('theme.system'), icon: 'monitor', description: t('theme.systemDescription') },
  ];

  const refreshStorageUsage = useCallback(async () => {
    try {
      setStorageUsage(await attachmentStorageService.getUsage());
    } catch {
      setStorageUsage({ supported: false, attachmentCount: 0, attachmentBytes: 0, originUsage: 0, quota: 0 });
    }
  }, []);

  const refreshStorageHealth = useCallback(async () => {
    setIsCheckingStorage(true);
    try {
      setStorageHealth(await storageHealthService.analyse(trips));
    } catch (error) {
      setStorageHealth(null);
      showFeedback('danger', t('settings.storageCheckFailedTitle'), error.message || t('settings.storageCheckFailedText'));
    } finally {
      setIsCheckingStorage(false);
    }
  }, [t, trips]);

  useEffect(() => {
    refreshStorageUsage();
    refreshStorageHealth();
  }, [refreshStorageHealth, refreshStorageUsage, trips]);

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

  async function handleReset() {
    const confirmed = window.confirm(t('settings.resetConfirm'));
    if (!confirmed) return;
    setIsResetting(true);
    try {
      await clearLocalTripData();
      showFeedback('success', t('settings.resetSuccessTitle'), t('settings.resetSuccessText'));
      await refreshStorageUsage();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      showFeedback('danger', t('settings.resetFailedTitle'), error.message || t('settings.resetFailedText'));
    } finally {
      setIsResetting(false);
    }
  }

  async function handleStorageCleanup() {
    const confirmed = window.confirm(t('settings.storageCleanupConfirm'));
    if (!confirmed) return;
    setIsCleaningStorage(true);
    try {
      const result = await storageHealthService.clean(trips);
      showFeedback(
        'success',
        t('settings.storageCleanupSuccessTitle'),
        t('settings.storageCleanupSuccessText', {
          files: result.deletedAttachments,
          cache: result.removedCacheEntries,
          recovery: result.removedRecoveryEntries,
        }),
      );
      await Promise.all([refreshStorageUsage(), refreshStorageHealth()]);
    } catch (error) {
      showFeedback('danger', t('settings.storageCleanupFailedTitle'), error.message || t('settings.storageCleanupFailedText'));
    } finally {
      setIsCleaningStorage(false);
    }
  }

  async function handlePersistentStorage() {
    setIsRequestingPersistence(true);
    try {
      const persisted = await storageHealthService.requestPersistentStorage();
      showFeedback(
        persisted ? 'success' : 'warning',
        persisted ? t('settings.persistenceEnabledTitle') : t('settings.persistenceUnavailableTitle'),
        persisted ? t('settings.persistenceEnabledText') : t('settings.persistenceUnavailableText'),
      );
      await refreshStorageHealth();
    } finally {
      setIsRequestingPersistence(false);
    }
  }

  async function handleExport() {
    setIsExporting(true);
    setFeedback(null);
    try {
      const backup = await exportBackup();
      const attachmentCount = backup.attachments?.length || 0;
      showFeedback(
        'success',
        t('settings.exportSuccessTitle'),
        t('settings.exportSuccessWithFiles', { count: trips.length, files: attachmentCount }),
      );
    } catch (error) {
      showFeedback('danger', t('settings.exportFailedTitle'), error.message || t('settings.exportFailedText'));
    } finally {
      setIsExporting(false);
    }
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
      const result = await importBackup(file);
      showFeedback(
        'success',
        t('settings.importSuccessTitle'),
        t('settings.importSuccessWithFiles', { count: result.trips.length, files: result.attachmentCount }),
      );
      await refreshStorageUsage();
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
          <div><dt>{t('settings.storage')}</dt><dd>{t('settings.hybridStorage')}</dd></div>
        </dl>
      </Card>

      <Card className="settings-card">
        <header>
          <span className="settings-card__icon"><Icon name="hardDrive" /></span>
          <div>
            <h2>{t('settings.fileStorageTitle')}</h2>
            <p>{t('settings.fileStorageText')}</p>
          </div>
        </header>

        {storageUsage?.supported ? (
          <div className="storage-overview">
            <div><span>{t('settings.localFiles')}</span><strong>{storageUsage.attachmentCount}</strong></div>
            <div><span>{t('settings.fileStorageUsed')}</span><strong>{formatBytes(storageUsage.attachmentBytes, locale)}</strong></div>
            <div><span>{t('settings.originStorageUsed')}</span><strong>{formatBytes(storageUsage.originUsage, locale)}</strong></div>
            <div><span>{t('settings.availableQuota')}</span><strong>{storageUsage.quota ? formatBytes(storageUsage.quota, locale) : '—'}</strong></div>
          </div>
        ) : (
          <InlineNotice tone="warning" title={t('settings.storageUnavailableTitle')}>
            {t('settings.storageUnavailableText')}
          </InlineNotice>
        )}

        <p className="settings-helper"><Icon name="info" size={16} /> {t('settings.localFilesPrivate')}</p>
        <Button variant="secondary" icon="refresh" onClick={refreshStorageUsage}>{t('settings.refreshStorage')}</Button>
      </Card>

      <Card className="settings-card storage-health-card">
        <header>
          <span className="settings-card__icon"><Icon name="shield" /></span>
          <div>
            <h2>{t('settings.storageHealthTitle')}</h2>
            <p>{t('settings.storageHealthText')}</p>
          </div>
        </header>

        {storageHealth ? (
          <>
            <InlineNotice
              tone={storageHealth.status === 'healthy' ? 'success' : 'warning'}
              title={storageHealth.status === 'healthy'
                ? t('settings.storageHealthyTitle')
                : t('settings.storageAttentionTitle')}
            >
              {storageHealth.status === 'healthy'
                ? t('settings.storageHealthyText')
                : t('settings.storageAttentionText', { count: storageHealth.indexedDb.orphanCount })}
            </InlineNotice>

            <div className="storage-health-grid">
              <div><span>{t('settings.localDataSize')}</span><strong>{formatBytes(storageHealth.localStorage.bytes, locale)}</strong></div>
              <div><span>{t('settings.recoverySnapshots')}</span><strong>{storageHealth.localStorage.recoveryCount}</strong></div>
              <div><span>{t('settings.orphanFiles')}</span><strong>{storageHealth.indexedDb.orphanCount}</strong></div>
              <div><span>{t('settings.cacheEntries')}</span><strong>{storageHealth.cache.entryCount}</strong></div>
              <div><span>{t('settings.activitiesStored')}</span><strong>{storageHealth.volume.activities}</strong></div>
              <div><span>{t('settings.persistentStorage')}</span><strong>{storageHealth.persistence.persisted ? t('common.yes') : t('common.no')}</strong></div>
            </div>
          </>
        ) : (
          <p className="settings-helper">{t('settings.storageHealthPending')}</p>
        )}

        <div className="settings-card__button-row">
          <Button variant="secondary" icon="refresh" disabled={isCheckingStorage} onClick={refreshStorageHealth}>
            {isCheckingStorage ? t('settings.checkingStorage') : t('settings.checkStorage')}
          </Button>
          <Button variant="secondary" icon="trash" disabled={isCleaningStorage} onClick={handleStorageCleanup}>
            {isCleaningStorage ? t('settings.cleaningStorage') : t('settings.cleanStorage')}
          </Button>
          {storageHealth?.persistence.supported && !storageHealth.persistence.persisted && (
            <Button variant="secondary" icon="hardDrive" disabled={isRequestingPersistence} onClick={handlePersistentStorage}>
              {isRequestingPersistence ? t('settings.requestingPersistence') : t('settings.requestPersistence')}
            </Button>
          )}
        </div>
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
            <p>{t('settings.exportTextWithFiles')}</p>
          </div>
          <Button variant="secondary" icon="download" disabled={isExporting} onClick={handleExport}>
            {isExporting ? t('settings.exporting') : t('settings.exportButton')}
          </Button>
        </div>

        <div className="settings-actions">
          <div>
            <strong>{t('settings.importTitle')}</strong>
            <p>{t('settings.importTextWithFiles')}</p>
          </div>
          <Button variant="secondary" icon="upload" disabled={isImporting} onClick={() => fileInputRef.current?.click()}>
            {isImporting ? t('settings.importing') : t('settings.importButton')}
          </Button>
          <input ref={fileInputRef} className="sr-only" type="file" accept="application/json,.json" onChange={handleImport} />
        </div>
      </Card>

      <AffiliateSettingsCard />

      <Card className="settings-card settings-card--danger" id="clear-local-trip-data">
        <header>
          <span className="settings-card__icon"><Icon name="trash" /></span>
          <div>
            <h2>{t('settings.reset')}</h2>
            <p>{t('settings.resetTextWithFiles')}</p>
          </div>
        </header>
        <Button variant="danger" icon="trash" disabled={isResetting} onClick={handleReset}>
          {isResetting ? t('settings.resetting') : t('settings.reset')}
        </Button>
      </Card>
    </div>
  );
}

function formatBytes(bytes, locale) {
  const value = Math.max(0, Number(bytes) || 0);
  if (value < 1024) return `${value} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let size = value / 1024;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: size >= 10 ? 1 : 2 }).format(size)} ${units[unitIndex]}`;
}
