import { Icon } from '../common/Icon.jsx';

export const TRIP_TABS = Object.freeze([
  { id: 'overview', label: 'Overview', icon: 'dashboard' },
  { id: 'itinerary', label: 'Itinerary', icon: 'calendarDays' },
  { id: 'map', label: 'Map', icon: 'map' },
  { id: 'tools', label: 'Travel tools', icon: 'globe' },
  { id: 'reservations', label: 'Reservations', icon: 'ticket' },
  { id: 'budget', label: 'Budget', icon: 'wallet' },
  { id: 'checklist', label: 'Checklist', icon: 'checklist' },
  { id: 'documents', label: 'Documents', icon: 'folder' },
  { id: 'notes', label: 'Notes', icon: 'notebook' },
]);

export function TripTabs({ activeTab, onChange }) {
  return (
    <nav className="trip-tabs" aria-label="Trip workspace">
      {TRIP_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={activeTab === tab.id ? 'trip-tabs__button trip-tabs__button--active' : 'trip-tabs__button'}
          aria-current={activeTab === tab.id ? 'page' : undefined}
          onClick={() => onChange(tab.id)}
        >
          <Icon name={tab.icon} size={18} />
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
