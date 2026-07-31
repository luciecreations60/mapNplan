
import { APP_CONFIG } from '../config/app.config.js';
import { createId } from './id.js';

/**
 * Returns the display name used for local collaboration actions.
 * A real authenticated account can replace this lookup without changing panels.
 */
export function getCurrentActorName(trip) {
  return trip?.collaboration?.members?.find((member) => member.role === 'owner')?.name
    || APP_CONFIG.demoUserName;
}

/**
 * Creates a language-neutral activity entry. UI translations are applied only
 * while rendering so the same log remains readable after changing language.
 */
export function createActivityEntry({ action, actorName, entityType, entityId = '', targetTitle = '' }) {
  return {
    id: createId('activity-log'),
    action,
    actorName: String(actorName || APP_CONFIG.demoUserName).trim(),
    entityType: String(entityType || 'trip').trim(),
    entityId: String(entityId || '').trim(),
    targetTitle: String(targetTitle || '').trim(),
    createdAt: new Date().toISOString(),
  };
}

export function appendActivityEntry(collaboration, entry, maximumEntries = 100) {
  const currentLog = Array.isArray(collaboration?.activityLog)
    ? collaboration.activityLog
    : [];

  return {
    ...(collaboration || {}),
    activityLog: [entry, ...currentLog].slice(0, maximumEntries),
  };
}

export function getCollaborationTabForEntity(entityType) {
  return {
    activity: 'itinerary',
    reservation: 'reservations',
    member: 'collaboration',
    share: 'collaboration',
  }[entityType] || 'collaboration';
}
