
import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../hooks/useI18n.js';
import { useTrips } from '../../hooks/useTrips.js';
import { localStorageService } from '../../services/storage/LocalStorageService.js';
import { getCollaborationTabForEntity } from '../../utils/collaboration.js';
import { Icon } from '../common/Icon.jsx';

const LAST_READ_STORAGE_KEY = 'notifications:lastReadAt';

/**
 * Local notification centre derived from trip activity logs.
 * Replacing this component with server notifications will not alter trip data.
 */
export function NotificationCenter() {
  const { trips } = useTrips();
  const { locale, t } = useI18n();
  const [isOpen, setOpen] = useState(false);
  const [lastReadAt, setLastReadAt] = useState(() => localStorageService.get(LAST_READ_STORAGE_KEY, ''));
  const panelRef = useRef(null);
  const notifications = useMemo(() => trips
    .flatMap((trip) => (trip.collaboration?.activityLog || []).map((entry) => ({ ...entry, tripId: trip.id, tripName: trip.name })))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 20), [trips]);
  const unreadCount = notifications.filter((entry) => !lastReadAt || entry.createdAt > lastReadAt).length;

  function togglePanel() {
    setOpen((current) => {
      const next = !current;
      if (next && notifications[0]?.createdAt) {
        localStorageService.set(LAST_READ_STORAGE_KEY, notifications[0].createdAt);
        setLastReadAt(notifications[0].createdAt);
      }
      return next;
    });
  }

  return (
    <div className="notification-center" ref={panelRef}>
      <button className="icon-button" type="button" aria-label={t('nav.notifications')} aria-expanded={isOpen} onClick={togglePanel}>
        <Icon name="bell" />
        {unreadCount > 0 && <span className="notification-count">{Math.min(unreadCount, 9)}{unreadCount > 9 ? '+' : ''}</span>}
      </button>

      {isOpen && (
        <div className="notification-panel">
          <header>
            <div><p className="eyebrow">{t('notifications.eyebrow')}</p><h2>{t('notifications.title')}</h2></div>
            <button className="icon-button icon-button--small" type="button" aria-label={t('common.close')} onClick={() => setOpen(false)}><Icon name="close" size={16} /></button>
          </header>
          {notifications.length > 0 ? (
            <div className="notification-list">
              {notifications.map((entry) => (
                <Link
                  key={`${entry.tripId}-${entry.id}`}
                  className="notification-item"
                  to={`/trips/${entry.tripId}?tab=${getCollaborationTabForEntity(entry.entityType)}`}
                  onClick={() => setOpen(false)}
                >
                  <span><Icon name={getActivityIcon(entry.action)} size={16} /></span>
                  <div>
                    <p>{translateActivity(entry, t)}</p>
                    <small>{entry.tripName} · {new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(entry.createdAt))}</small>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="notification-empty"><Icon name="bell" size={24} /><strong>{t('notifications.empty')}</strong><p>{t('notifications.emptyText')}</p></div>
          )}
          <footer>{t('notifications.localOnly')}</footer>
        </div>
      )}
    </div>
  );
}

function getActivityIcon(action) {
  return { memberAdded: 'userPlus', memberRemoved: 'userMinus', memberRoleChanged: 'users', commentAdded: 'message', shareCreated: 'share' }[action] || 'activity';
}

function translateActivity(entry, t) {
  return t(`collaboration.activityActions.${entry.action}`, { actor: entry.actorName, target: entry.targetTitle });
}
