import { useI18n } from '../../hooks/useI18n.js';
import { Icon } from '../common/Icon.jsx';

export const TRIP_TABS = Object.freeze([
  { id: 'overview', labelKey: 'workspace.overview', icon: 'dashboard' },
  { id: 'today', labelKey: 'workspace.today', icon: 'activity' },
  { id: 'itinerary', labelKey: 'workspace.itinerary', icon: 'calendarDays' },
  { id: 'route', labelKey: 'workspace.route', icon: 'route' },
  { id: 'calendar', labelKey: 'workspace.calendar', icon: 'calendarRange' },
  { id: 'map', labelKey: 'workspace.map', icon: 'map' },
  { id: 'places', labelKey: 'workspace.places', icon: 'pin' },
  { id: 'tools', labelKey: 'workspace.tools', icon: 'globe' },
  { id: 'booking', labelKey: 'workspace.booking', icon: 'externalLink' },
  { id: 'reservations', labelKey: 'workspace.reservations', icon: 'ticket' },
  { id: 'budget', labelKey: 'workspace.budget', icon: 'wallet' },
  { id: 'expenses', labelKey: 'workspace.sharedExpenses', icon: 'receipt' },
  { id: 'statistics', labelKey: 'workspace.statistics', icon: 'chart' },
  { id: 'checklist', labelKey: 'workspace.checklistTab', icon: 'checklist' },
  { id: 'documents', labelKey: 'workspace.documents', icon: 'folder' },
  { id: 'notes', labelKey: 'workspace.notes', icon: 'notebook' },
  { id: 'collaboration', labelKey: 'workspace.collaboration', icon: 'users' },
]);

export function TripTabs({ navRef, activeTab, onChange }) {
  const { t } = useI18n();

  return (
    <nav ref={navRef} className="trip-tabs" aria-label={t('workspace.aria')}>
      {TRIP_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={activeTab === tab.id ? 'trip-tabs__button trip-tabs__button--active' : 'trip-tabs__button'}
          aria-current={activeTab === tab.id ? 'page' : undefined}
          onClick={() => onChange(tab.id)}
        >
          <Icon name={tab.icon} size={18} />
          <span>{t(tab.labelKey)}</span>
        </button>
      ))}
    </nav>
  );
}
