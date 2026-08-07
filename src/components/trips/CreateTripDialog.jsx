import { useI18n } from '../../hooks/useI18n.js';
import { useTrips } from '../../hooks/useTrips.js';
import { TripFormDialog } from './TripFormDialog.jsx';

/**
 * Creation adapter around the shared trip form.
 */
export function CreateTripDialog({ isOpen, onClose }) {
  const { t } = useI18n();
  const { createTrip } = useTrips();

  function handleCreate(payload) {
    createTrip({
      ...payload,
      spent: 0,
      checklistCompleted: 0,
      checklistTotal: 0,
      summary: payload.summary || t('trips.newSummary'),
    });
  }

  return (
    <TripFormDialog
      isOpen={isOpen}
      mode="create"
      onClose={onClose}
      onSubmit={handleCreate}
    />
  );
}
