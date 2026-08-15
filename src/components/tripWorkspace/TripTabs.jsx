import { useRef } from 'react';
import { useI18n } from '../../hooks/useI18n.js';
import { Icon } from '../common/Icon.jsx';

/**
 * Four stable product spaces. The detailed tools remain available through
 * contextual navigation instead of competing in the main tab bar.
 */
export const TRIP_TABS = Object.freeze([
  { id: 'overview', labelKey: 'workspace.overview', icon: 'dashboard' },
  { id: 'planning', labelKey: 'workspace.planning', icon: 'calendarDays' },
  { id: 'booking', labelKey: 'workspace.booking', icon: 'externalLink' },
  { id: 'trip', labelKey: 'workspace.myTrip', icon: 'trips' },
]);

export const WORKSPACE_VIEWS = Object.freeze({
  planning: Object.freeze({
    primary: Object.freeze([
      { id: 'itinerary', labelKey: 'workspace.itinerary', icon: 'calendarDays' },
      { id: 'map', labelKey: 'workspace.map', icon: 'map' },
      { id: 'calendar', labelKey: 'workspace.calendar', icon: 'calendarRange' },
    ]),
    more: Object.freeze([
      { id: 'today', labelKey: 'workspace.today', icon: 'activity' },
      { id: 'route', labelKey: 'workspace.route', icon: 'route' },
      { id: 'places', labelKey: 'workspace.places', icon: 'pin' },
    ]),
  }),
  booking: Object.freeze({
    primary: Object.freeze([
      { id: 'booking', labelKey: 'workspace.compare', icon: 'search' },
      { id: 'reservations', labelKey: 'workspace.reservations', icon: 'ticket' },
    ]),
    more: Object.freeze([]),
  }),
  trip: Object.freeze({
    primary: Object.freeze([
      { id: 'budget', labelKey: 'workspace.budget', icon: 'wallet' },
      { id: 'checklist', labelKey: 'workspace.checklistTab', icon: 'checklist' },
      { id: 'documents', labelKey: 'workspace.documents', icon: 'folder' },
      { id: 'notes', labelKey: 'workspace.notes', icon: 'notebook' },
    ]),
    more: Object.freeze([
      { id: 'tools', labelKey: 'workspace.tools', icon: 'globe' },
      { id: 'collaboration', labelKey: 'workspace.collaboration', icon: 'users' },
      { id: 'statistics', labelKey: 'workspace.statistics', icon: 'chart' },
    ]),
  }),
});

export function getWorkspaceGroupForView(viewId) {
  if (!viewId) return null;
  if (viewId === 'overview') return 'overview';
  for (const [groupId, views] of Object.entries(WORKSPACE_VIEWS)) {
    if ([...views.primary, ...views.more].some((view) => view.id === viewId)) return groupId;
  }
  return null;
}

export function getWorkspaceViewIds(groupId) {
  const group = WORKSPACE_VIEWS[groupId];
  return group ? [...group.primary, ...group.more].map((view) => view.id) : [];
}

export function getDefaultViewForGroup(groupId) {
  if (groupId === 'overview') return 'overview';
  return WORKSPACE_VIEWS[groupId]?.primary?.[0]?.id || 'overview';
}

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

export function TripSubNavigation({ activeGroup, activeView, onChange }) {
  const { t } = useI18n();
  const group = WORKSPACE_VIEWS[activeGroup];
  if (!group) return null;

  const moreIsActive = group.more.some((item) => item.id === activeView);

  const renderButton = (item, className = '') => (
    <button
      key={item.id}
      type="button"
      className={`trip-subnav__button${activeView === item.id ? ' trip-subnav__button--active' : ''}${className ? ` ${className}` : ''}`}
      aria-current={activeView === item.id ? 'page' : undefined}
      onClick={() => onChange(item.id)}
    >
      <Icon name={item.icon} size={16} />
      <span>{t(item.labelKey)}</span>
    </button>
  );

  return (
    <nav className="trip-subnav" aria-label={t('workspace.sectionNavigation')}>
      <div className="trip-subnav__primary">
        {group.primary.map((item) => renderButton(item))}
      </div>

      {group.more.length > 0 && (
        <details className="trip-subnav__more" open={moreIsActive || undefined}>
          <summary className={moreIsActive ? 'trip-subnav__more-summary trip-subnav__more-summary--active' : 'trip-subnav__more-summary'}>
            <Icon name="more" size={17} />
            <span>{t('workspace.more')}</span>
            <Icon name="chevronDown" size={15} />
          </summary>
          <div className="trip-subnav__more-menu">
            {group.more.map((item) => renderButton(item, 'trip-subnav__button--menu'))}
          </div>
        </details>
      )}
    </nav>
  );
}
