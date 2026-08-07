import { useRef } from 'react';
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
  { id: 'checklist', labelKey: 'workspace.checklistTab', icon: 'checklist' },
  { id: 'documents', labelKey: 'workspace.documents', icon: 'folder' },
  { id: 'notes', labelKey: 'workspace.notes', icon: 'notebook' },
  { id: 'collaboration', labelKey: 'workspace.collaboration', icon: 'users' },
  { id: 'statistics', labelKey: 'workspace.statistics', icon: 'chart' },
]);

export function TripTabs({ navRef, activeTab, onChange }) {
  const { t } = useI18n();
  const buttonRefs = useRef([]);

  function activateAt(index) {
    const nextTab = TRIP_TABS[index];
    if (!nextTab) return;
    onChange(nextTab.id);
    window.requestAnimationFrame(() => buttonRefs.current[index]?.focus({ preventScroll: true }));
  }

  function handleKeyDown(event, index) {
    const keyActions = {
      ArrowRight: () => activateAt((index + 1) % TRIP_TABS.length),
      ArrowLeft: () => activateAt((index - 1 + TRIP_TABS.length) % TRIP_TABS.length),
      Home: () => activateAt(0),
      End: () => activateAt(TRIP_TABS.length - 1),
    };

    const action = keyActions[event.key];
    if (!action) return;
    event.preventDefault();
    action();
  }

  return (
    <nav ref={navRef} className="trip-tabs" role="tablist" aria-label={t('workspace.aria')}>
      {TRIP_TABS.map((tab, index) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            ref={(element) => { buttonRefs.current[index] = element; }}
            id={`trip-tab-${tab.id}`}
            type="button"
            role="tab"
            className={isActive ? 'trip-tabs__button trip-tabs__button--active' : 'trip-tabs__button'}
            aria-controls={`trip-panel-${tab.id}`}
            aria-current={isActive ? 'page' : undefined}
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            <Icon name={tab.icon} size={18} />
            <span>{t(tab.labelKey)}</span>
          </button>
        );
      })}
    </nav>
  );
}
