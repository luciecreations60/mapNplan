import { useRef, useState } from 'react';
import { Button } from '../components/common/Button.jsx';
import { Card } from '../components/common/Card.jsx';
import { Icon } from '../components/common/Icon.jsx';
import { InlineNotice } from '../components/feedback/InlineNotice.jsx';
import { APP_CONFIG } from '../config/app.config.js';
import { useTheme } from '../hooks/useTheme.js';
import { useTrips } from '../hooks/useTrips.js';

const THEMES = [
  { id: 'light', label: 'Light', icon: 'sun', description: 'Always use the light interface.' },
  { id: 'dark', label: 'Dark', icon: 'moon', description: 'Always use the dark interface.' },
  { id: 'system', label: 'System', icon: 'monitor', description: 'Follow your device preference.' },
];

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { resetDemoData, exportBackup, importBackup, trips } = useTrips();
  const fileInputRef = useRef(null);
  const [feedback, setFeedback] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  function showFeedback(tone, title, message) {
    setFeedback({ tone, title, message });
  }

  function handleReset() {
    const confirmed = window.confirm(
      'Reset demo data? All trips stored in this browser will be replaced by the original demonstration trips.',
    );

    if (!confirmed) return;
    resetDemoData();
    showFeedback('success', 'Demo data restored', 'The original demonstration trips are available again.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleExport() {
    exportBackup();
    showFeedback('success', 'Backup created', `${trips.length} trip${trips.length === 1 ? '' : 's'} exported to a JSON file.`);
  }

  async function handleImport(event) {
    const [file] = event.target.files || [];
    if (!file) return;

    const confirmed = window.confirm(
      'Import this backup? The trips currently stored in this browser will be replaced.',
    );

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
        'Backup imported',
        `${importedTrips.length} trip${importedTrips.length === 1 ? '' : 's'} restored successfully.`,
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      showFeedback('danger', 'Import failed', error.message || 'The selected backup could not be imported.');
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  }

  return (
    <div className="page-stack settings-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1>Settings</h1>
          <p>Personalise the application and manage the data stored on this device.</p>
        </div>
      </section>

      {feedback && (
        <InlineNotice tone={feedback.tone} title={feedback.title}>
          {feedback.message}
        </InlineNotice>
      )}

      <Card className="settings-card">
        <header>
          <span className="settings-card__icon"><Icon name="monitor" /></span>
          <div><h2>Appearance</h2><p>Choose how the interface looks on this device.</p></div>
        </header>
        <div className="theme-options">
          {THEMES.map((option) => (
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
          <div><h2>Application configuration</h2><p>These values are centralised and can later be connected to an admin panel.</p></div>
        </header>
        <dl className="configuration-list">
          <div><dt>Code name</dt><dd>{APP_CONFIG.codeName}</dd></div>
          <div><dt>Version</dt><dd>{APP_CONFIG.version}</dd></div>
          <div><dt>Default currency</dt><dd>{APP_CONFIG.defaultCurrency}</dd></div>
          <div><dt>Storage</dt><dd>Browser local storage</dd></div>
        </dl>
      </Card>

      <Card className="settings-card">
        <header>
          <span className="settings-card__icon"><Icon name="download" /></span>
          <div>
            <h2>Backup and restore</h2>
            <p>Move your trips between devices or keep a copy before a major update.</p>
          </div>
        </header>

        <div className="settings-actions">
          <div>
            <strong>Export a JSON backup</strong>
            <p>Downloads all trips currently stored in this browser.</p>
          </div>
          <Button variant="secondary" icon="download" onClick={handleExport}>Export backup</Button>
        </div>

        <div className="settings-actions">
          <div>
            <strong>Import a JSON backup</strong>
            <p>Replaces the current local trips after validation.</p>
          </div>
          <Button variant="secondary" icon="upload" disabled={isImporting} onClick={() => fileInputRef.current?.click()}>
            {isImporting ? 'Importing…' : 'Import backup'}
          </Button>
          <input
            ref={fileInputRef}
            className="sr-only"
            type="file"
            accept="application/json,.json"
            onChange={handleImport}
          />
        </div>
      </Card>

      <Card className="settings-card settings-card--danger" id="reset-demo-data">
        <header>
          <span className="settings-card__icon"><Icon name="trash" /></span>
          <div>
            <h2>Reset demo data</h2>
            <p>Replace all locally stored trips with the original V0.1 demonstration data.</p>
          </div>
        </header>
        <Button variant="danger" icon="trash" onClick={handleReset}>Reset demo data</Button>
      </Card>
    </div>
  );
}
