import { parseLocalDate } from './date.js';
import { toDateKey } from './tripCalendar.js';

/**
 * Returns the most useful date to display when the travel-day companion opens.
 * The current day is preferred while the trip is in progress. Otherwise the
 * first planned day, then the departure date, is used.
 */
export function getInitialCompanionDate(trip, today = new Date()) {
  const todayKey = toDateKey(today);
  const start = parseLocalDate(trip.startDate);
  const end = parseLocalDate(trip.endDate);
  const current = parseLocalDate(todayKey);

  if (start && end && current && current >= start && current <= end) return todayKey;

  const firstPlannedDate = [...(trip.itinerary || [])]
    .map((day) => day.date)
    .filter(Boolean)
    .sort()[0];

  return firstPlannedDate || trip.startDate || todayKey;
}

export function getCompanionDay(trip, date) {
  const day = (trip.itinerary || []).find((item) => item.date === date) || {
    id: null,
    date,
    title: '',
    items: [],
  };

  const activities = [...(day.items || [])].sort(compareTimedItems);
  const reservations = (trip.reservations || [])
    .filter((reservation) => reservationOccursOnDate(reservation, date))
    .sort((left, right) => compareTime(left.startTime, right.startTime));

  return { ...day, activities, reservations };
}

export function getActivityTimelineState(activities, date, now = new Date()) {
  if (!Array.isArray(activities) || activities.length === 0) {
    return { currentActivity: null, nextActivity: null, states: new Map() };
  }

  const todayKey = toDateKey(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const states = new Map();
  let currentActivity = null;
  let nextActivity = null;

  for (const activity of activities) {
    if (activity.completedAt) {
      states.set(activity.id, 'completed');
      continue;
    }

    if (date !== todayKey || !activity.time) {
      states.set(activity.id, nextActivity ? 'upcoming' : 'next');
      if (!nextActivity) nextActivity = activity;
      continue;
    }

    const startMinutes = parseTimeToMinutes(activity.time);
    const duration = Math.max(15, Number(activity.durationMinutes) || 60);
    const endMinutes = startMinutes + duration;

    if (nowMinutes >= startMinutes && nowMinutes < endMinutes && !currentActivity) {
      currentActivity = activity;
      states.set(activity.id, 'current');
      continue;
    }

    if (startMinutes > nowMinutes && !nextActivity) {
      nextActivity = activity;
      states.set(activity.id, 'next');
      continue;
    }

    states.set(activity.id, startMinutes <= nowMinutes ? 'past' : 'upcoming');
  }

  if (!currentActivity && !nextActivity) {
    nextActivity = activities.find((activity) => !activity.completedAt) || null;
    if (nextActivity) states.set(nextActivity.id, 'next');
  }

  return { currentActivity, nextActivity, states };
}

export function buildCompanionAlerts(trip, date, day) {
  const alerts = [];
  const pendingReservations = day.reservations.filter((reservation) => reservation.status === 'pending');
  const cancelledReservations = day.reservations.filter((reservation) => reservation.status === 'cancelled');
  const unmappedActivities = day.activities.filter((activity) => (
    !Number.isFinite(activity.latitude) || !Number.isFinite(activity.longitude)
  ));
  const incompleteChecklist = (trip.checklist || []).filter((item) => !item.completed);
  const dayMinutes = day.activities.reduce((sum, activity) => (
    sum + Math.max(0, Number(activity.durationMinutes) || 0)
  ), 0);

  if (cancelledReservations.length > 0) {
    alerts.push({ id: 'cancelled', tone: 'danger', count: cancelledReservations.length });
  }
  if (pendingReservations.length > 0) {
    alerts.push({ id: 'pending', tone: 'warning', count: pendingReservations.length });
  }
  if (unmappedActivities.length > 0) {
    alerts.push({ id: 'unmapped', tone: 'neutral', count: unmappedActivities.length });
  }
  if (dayMinutes > 600 || day.activities.length > 7) {
    alerts.push({ id: 'busyDay', tone: 'warning', count: day.activities.length });
  }
  if (incompleteChecklist.length > 0 && date === trip.startDate) {
    alerts.push({ id: 'checklist', tone: 'neutral', count: incompleteChecklist.length });
  }

  return alerts;
}

export function normalizeCompanionSettings(companion) {
  return {
    localEmergencyNumber: String(companion?.localEmergencyNumber || '').trim(),
    emergencyContactName: String(companion?.emergencyContactName || '').trim(),
    emergencyContactPhone: String(companion?.emergencyContactPhone || '').trim(),
    insuranceProvider: String(companion?.insuranceProvider || '').trim(),
    insurancePolicyNumber: String(companion?.insurancePolicyNumber || '').trim(),
    medicalNotes: String(companion?.medicalNotes || '').trim(),
    lastPreparedAt: companion?.lastPreparedAt || null,
  };
}

export function reservationOccursOnDate(reservation, date) {
  if (!date || !reservation?.startDate) return false;
  const start = reservation.startDate;
  const end = reservation.endDate || start;
  return date >= start && date <= end;
}

function compareTimedItems(left, right) {
  return compareTime(left.time, right.time);
}

function compareTime(left, right) {
  return String(left || '23:59').localeCompare(String(right || '23:59'));
}

function parseTimeToMinutes(value) {
  const [hours, minutes] = String(value || '').split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return Number.MAX_SAFE_INTEGER;
  return hours * 60 + minutes;
}

/**
 * Minutes remaining before an activity starts, for the day currently shown.
 *
 * Returns null when the countdown would be meaningless: a different day than
 * today, an activity with no recorded time, or a start time already passed.
 */
export function getMinutesUntilActivity(activity, date, now = new Date()) {
  if (!activity?.time) return null;
  if (date !== toDateKey(now)) return null;

  const startMinutes = parseTimeToMinutes(activity.time);
  if (startMinutes === Number.MAX_SAFE_INTEGER) return null;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const remaining = startMinutes - nowMinutes;
  return remaining > 0 ? remaining : null;
}

export function formatCountdown(minutes, t) {
  if (!Number.isFinite(minutes) || minutes <= 0) return '';
  if (minutes < 60) return t('companion.inMinutes', { count: minutes });

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (remainder === 0) return t('companion.inHours', { count: hours });
  return t('companion.inHoursMinutes', { hours, minutes: remainder });
}
