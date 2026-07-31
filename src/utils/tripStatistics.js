import { parseLocalDate } from './date.js';
import { hasValidCoordinates } from './map.js';
import {
  EXPENSE_CATEGORIES,
  RESERVATION_STATUSES,
  calculateChecklistProgress,
} from './tripWorkspace.js';

function getTripDuration(startDate, endDate) {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  if (!start || !end || end < start) return 0;
  return Math.floor((end - start) / 86400000) + 1;
}

export function buildTripStatistics(trip) {
  const activities = (trip.itinerary || []).flatMap((day) => day.items || []);
  const reservations = trip.reservations || [];
  const expenses = trip.expenses || [];
  const tripDays = getTripDuration(trip.startDate, trip.endDate);
  const plannedDays = (trip.itinerary || []).filter((day) => day.items?.length > 0).length;
  const mappedActivities = activities.filter((item) => hasValidCoordinates(item.latitude, item.longitude)).length;
  const mappedReservations = reservations.filter((item) => hasValidCoordinates(item.latitude, item.longitude)).length;
  const plannedExpense = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const paidExpense = expenses.filter((item) => item.paid).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const estimatedActivityCost = activities.reduce((sum, item) => sum + Number(item.estimatedCost || 0), 0);
  const totalActivityMinutes = activities.reduce((sum, item) => sum + Number(item.durationMinutes || 0), 0);

  return {
    tripDays,
    plannedDays,
    activities: activities.length,
    averageActivitiesPerPlannedDay: plannedDays ? activities.length / plannedDays : 0,
    mappedPlaces: mappedActivities + mappedReservations,
    reservations: reservations.length,
    confirmedReservations: reservations.filter((item) => item.status === 'confirmed').length,
    documents: (trip.documents || []).length,
    checklistProgress: calculateChecklistProgress(trip.checklist || []),
    plannedExpense,
    paidExpense,
    estimatedActivityCost,
    totalActivityMinutes,
    budgetUsage: trip.budget > 0 ? Math.min(100, (plannedExpense / trip.budget) * 100) : 0,
    expenseCategories: EXPENSE_CATEGORIES.map((category) => ({
      ...category,
      amount: expenses
        .filter((expense) => expense.category === category.id)
        .reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
    })).filter((category) => category.amount > 0),
    reservationStatuses: RESERVATION_STATUSES.map((status) => ({
      ...status,
      count: reservations.filter((reservation) => reservation.status === status.id).length,
    })),
  };
}
