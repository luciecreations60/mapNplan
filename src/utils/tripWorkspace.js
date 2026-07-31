export const EXPENSE_CATEGORIES = Object.freeze([
  { id: 'transport', label: 'Transport' },
  { id: 'accommodation', label: 'Accommodation' },
  { id: 'food', label: 'Food' },
  { id: 'activities', label: 'Activities' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'other', label: 'Other' },
]);

export const CHECKLIST_CATEGORIES = Object.freeze([
  { id: 'documents', label: 'Documents' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'packing', label: 'Packing' },
  { id: 'technology', label: 'Technology' },
  { id: 'money', label: 'Money' },
  { id: 'transport', label: 'Transport' },
  { id: 'activities', label: 'Activities' },
  { id: 'other', label: 'Other' },
]);

export const ACTIVITY_TYPES = Object.freeze([
  { id: 'map', label: 'Place' },
  { id: 'food', label: 'Food' },
  { id: 'hotel', label: 'Hotel' },
  { id: 'plane', label: 'Flight' },
  { id: 'car', label: 'Transport' },
  { id: 'ticket', label: 'Activity' },
]);

export const RESERVATION_TYPES = Object.freeze([
  { id: 'flight', label: 'Flight' },
  { id: 'accommodation', label: 'Accommodation' },
  { id: 'transport', label: 'Transport' },
  { id: 'activity', label: 'Activity' },
]);

export const RESERVATION_STATUSES = Object.freeze([
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'pending', label: 'Pending' },
  { id: 'cancelled', label: 'Cancelled' },
]);

export const DOCUMENT_TYPES = Object.freeze([
  { id: 'passport', label: 'Passport' },
  { id: 'identity', label: 'Identity' },
  { id: 'ticket', label: 'Ticket' },
  { id: 'booking', label: 'Booking' },
  { id: 'insurance', label: 'Insurance' },
  { id: 'other', label: 'Other' },
]);

export function getCategoryLabel(collection, id) {
  return collection.find((item) => item.id === id)?.label || 'Other';
}

export function getItineraryItemCount(itinerary = []) {
  return itinerary.reduce((total, day) => total + day.items.length, 0);
}

export function getPaidExpenseTotal(expenses = []) {
  return expenses
    .filter((expense) => expense.paid)
    .reduce((total, expense) => total + expense.amount, 0);
}

export function getPlannedExpenseTotal(expenses = []) {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
}

export function getConfirmedReservationCount(reservations = []) {
  return reservations.filter((reservation) => reservation.status === 'confirmed').length;
}
