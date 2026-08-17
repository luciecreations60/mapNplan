import { useTrips } from '../../hooks/useTrips.js';
import { TripFormDialog } from './TripFormDialog.jsx';

/**
 * Creation adapter around the shared trip form.
 */
export function CreateTripDialog({ isOpen, initialValues = null, onClose, onCreated = null }) {
  const { createTrip } = useTrips();

  function handleCreate(payload) {
    const createdTrip = createTrip({
      ...payload,
      spent: 0,
      checklistCompleted: 0,
      checklistTotal: 0,
      summary: payload.summary || '',
    });
    onCreated?.(createdTrip);
    return createdTrip;
  }

  return (
    <TripFormDialog
      isOpen={isOpen}
      mode="create"
      initialValues={initialValues}
      onClose={onClose}
      onSubmit={handleCreate}
    />
  );
}