import { Card } from '../components/common/Card.jsx';
import { Icon } from '../components/common/Icon.jsx';
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
  const { resetDemoData } = useTrips();

  function handleReset() {
    if (window.confirm('Restore the original demonstration trips? Your current local trips will be replaced.')) {
      resetDemoData();
    }
  }

  return (
    <div className="page-stack settings-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1>Settings</h1>
          <p>Personalise the application without changing its source code.</p>
        </div>
      </section>

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

      <Card className="settings-card settings-card--danger">
        <header>
          <span className="settings-card__icon"><Icon name="trash" /></span>
          <div><h2>Demonstration data</h2><p>Restore the sample trips included in V0.1.</p></div>
        </header>
        <button className="button button--danger button--medium" type="button" onClick={handleReset}>Restore demo trips</button>
      </Card>
    </div>
  );
}
