export const EXPENSE_CATEGORIES = Object.freeze([
  { id: 'transport', label: 'Transport', labelKey: 'options.transport' },
  { id: 'accommodation', label: 'Accommodation', labelKey: 'options.accommodation' },
  { id: 'food', label: 'Food', labelKey: 'options.food' },
  { id: 'activities', label: 'Activities', labelKey: 'options.activities' },
  { id: 'shopping', label: 'Shopping', labelKey: 'options.shopping' },
  { id: 'other', label: 'Other', labelKey: 'options.other' },
]);

export const CHECKLIST_CATEGORIES = Object.freeze([
  { id: 'documents', label: 'Documents', labelKey: 'options.documents' },
  { id: 'bookings', label: 'Bookings', labelKey: 'options.bookings' },
  { id: 'packing', label: 'Packing', labelKey: 'options.packing' },
  { id: 'technology', label: 'Technology', labelKey: 'options.technology' },
  { id: 'money', label: 'Money', labelKey: 'options.money' },
  { id: 'transport', label: 'Transport', labelKey: 'options.transport' },
  { id: 'activities', label: 'Activities', labelKey: 'options.activities' },
  { id: 'other', label: 'Other', labelKey: 'options.other' },
]);

export const ACTIVITY_TYPES = Object.freeze([
  { id: 'map', label: 'Place', labelKey: 'options.place' },
  { id: 'food', label: 'Food', labelKey: 'options.food' },
  { id: 'hotel', label: 'Hotel', labelKey: 'options.hotel' },
  { id: 'plane', label: 'Flight', labelKey: 'options.flight' },
  { id: 'car', label: 'Transport', labelKey: 'options.transport' },
  { id: 'ticket', label: 'Activity', labelKey: 'options.activity' },
]);

export const RESERVATION_TYPES = Object.freeze([
  { id: 'flight', label: 'Flight', labelKey: 'options.flight' },
  { id: 'accommodation', label: 'Accommodation', labelKey: 'options.accommodation' },
  { id: 'transport', label: 'Transport', labelKey: 'options.transport' },
  { id: 'activity', label: 'Activity', labelKey: 'options.activity' },
]);

export const RESERVATION_STATUSES = Object.freeze([
  { id: 'confirmed', label: 'Confirmed', labelKey: 'options.confirmed' },
  { id: 'pending', label: 'Pending', labelKey: 'options.pending' },
  { id: 'cancelled', label: 'Cancelled', labelKey: 'options.cancelled' },
]);

export const DOCUMENT_TYPES = Object.freeze([
  { id: 'passport', label: 'Passport', labelKey: 'options.passport' },
  { id: 'identity', label: 'Identity', labelKey: 'options.identity' },
  { id: 'ticket', label: 'Ticket', labelKey: 'options.ticket' },
  { id: 'booking', label: 'Booking', labelKey: 'options.booking' },
  { id: 'insurance', label: 'Insurance', labelKey: 'options.insurance' },
  { id: 'other', label: 'Other', labelKey: 'options.other' },
]);

export function getOptionLabel(collection, id, t = (key) => key) {
  const option = collection.find((item) => item.id === id);
  return option ? t(option.labelKey) : t('options.other');
}

export function calculateChecklistProgress(checklist = []) {
  if (!checklist.length) return 0;
  const completed = checklist.filter((item) => item.completed).length;
  return Math.round((completed / checklist.length) * 100);
}

export function calculatePlannedExpenses(expenses = []) {
  return expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
}

export function calculatePaidExpenses(expenses = []) {
  return expenses.reduce((sum, expense) => {
    const amount = Math.max(0, Number(expense.amount) || 0);
    const paidAmount = expense.paidAmount === null || expense.paidAmount === undefined
      ? (expense.paid ? amount : 0)
      : Math.min(amount, Math.max(0, Number(expense.paidAmount) || 0));
    return sum + paidAmount;
  }, 0);
}

export function countConfirmedReservations(reservations = []) {
  return reservations.filter((reservation) => reservation.status === 'confirmed').length;
}

export function getCategoryLabel(collection, id, t = null) {
  const option = collection.find((item) => item.id === id);
  if (!option) return t ? t('options.other') : 'Other';
  return t ? t(option.labelKey) : option.label;
}

export function getItineraryItemCount(itinerary = []) {
  return itinerary.reduce((total, day) => total + day.items.length, 0);
}

export function getPaidExpenseTotal(expenses = []) {
  return calculatePaidExpenses(expenses);
}

export function getPlannedExpenseTotal(expenses = []) {
  return expenses.reduce((total, expense) => total + Number(expense.amount || 0), 0);
}

export function getConfirmedReservationCount(reservations = []) {
  return reservations.filter((reservation) => reservation.status === 'confirmed').length;
}
