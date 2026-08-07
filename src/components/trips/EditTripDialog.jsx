import { useTrips } from '../../hooks/useTrips.js';
import { TripFormDialog } from './TripFormDialog.jsx';

/**
 * Edition adapter around the shared trip form.
 */
export function EditTripDialog({ isOpen, trip, onClose, onSaved }) {
  const { updateTrip } = useTrips();

  function handleEdit(payload) {
    if (!trip) return;
    const updatedTrip = updateTrip(trip.id, payload);
    onSaved?.(updatedTrip);
  }

  return (
    <TripFormDialog
      isOpen={isOpen}
      mode="edit"
      trip={trip}
      onClose={onClose}
      onSubmit={handleEdit}
    />
  );
}
