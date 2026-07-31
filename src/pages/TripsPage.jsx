import { useMemo, useState } from 'react';
import { Button } from '../components/common/Button.jsx';
import { ConfirmDialog } from '../components/common/ConfirmDialog.jsx';
import { InlineNotice } from '../components/feedback/InlineNotice.jsx';
import { CreateTripDialog } from '../components/trips/CreateTripDialog.jsx';
import { EditTripDialog } from '../components/trips/EditTripDialog.jsx';
import { TripCard } from '../components/trips/TripCard.jsx';
import { useI18n } from '../hooks/useI18n.js';
import { useTrips } from '../hooks/useTrips.js';
import { getTripStatus, sortTripsByStartDate } from '../utils/date.js';

export function TripsPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [notice, setNotice] = useState(null);
  const { t } = useI18n();
  const {
    trips,
    duplicateTrip,
    archiveTrip,
    restoreTrip,
    deleteTrip,
  } = useTrips();

  const filters = [
    { id: 'all', label: t('trips.all') },
    { id: 'upcoming', label: t('trips.upcoming') },
    { id: 'past', label: t('trips.past') },
    { id: 'archived', label: t('trips.archived') },
  ];

  const filteredTrips = useMemo(() => {
    const sortedTrips = sortTripsByStartDate(trips);
    if (activeFilter === 'archived') return sortedTrips.filter((trip) => trip.archivedAt);

    const activeTrips = sortedTrips.filter((trip) => !trip.archivedAt);
    if (activeFilter === 'all') return activeTrips;
    if (activeFilter === 'upcoming') {
      return activeTrips.filter((trip) => ['upcoming', 'ongoing'].includes(getTripStatus(trip)));
    }
    return activeTrips.filter((trip) => getTripStatus(trip) === 'past');
  }, [activeFilter, trips]);

  function requestAction(type, trip) {
    setPendingAction({ type, trip });
  }

  function executePendingAction() {
    if (!pendingAction) return;
    const { type, trip } = pendingAction;

    if (type === 'duplicate') {
      const duplicated = duplicateTrip(trip.id, t('trips.copyName', { name: trip.name }));
      if (duplicated) setNotice({ title: t('trips.duplicatedTitle'), message: t('trips.duplicatedMessage', { name: trip.name }) });
    }

    if (type === 'archive') {
      archiveTrip(trip.id);
      setNotice({ title: t('trips.archivedTitle'), message: t('trips.archivedMessage', { name: trip.name }) });
    }

    if (type === 'restore') {
      restoreTrip(trip.id);
      setNotice({ title: t('trips.restoredTitle'), message: t('trips.restoredMessage', { name: trip.name }) });
    }

    if (type === 'delete') {
      deleteTrip(trip.id);
      setNotice({ title: t('trips.deletedTitle'), message: t('trips.deletedMessage', { name: trip.name }) });
    }

    setPendingAction(null);
  }

  const actionCopy = getActionCopy(pendingAction, t);

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <p className="eyebrow">{t('trips.eyebrow')}</p>
          <h1>{t('trips.title')}</h1>
          <p>{t('trips.intro')}</p>
        </div>
        <Button icon="plus" onClick={() => setCreateOpen(true)}>{t('trips.create')}</Button>
      </section>

      {notice && (
        <InlineNotice tone="success" title={notice.title} className="page-notice">
          {notice.message}
        </InlineNotice>
      )}

      <div className="filter-tabs" role="tablist" aria-label={t('trips.filtersAria')}>
        {filters.map((filter) => (
          <button
            key={filter.id}
            className={activeFilter === filter.id ? 'filter-tabs__button filter-tabs__button--active' : 'filter-tabs__button'}
            type="button"
            role="tab"
            aria-selected={activeFilter === filter.id}
            onClick={() => setActiveFilter(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {filteredTrips.length > 0 ? (
        <div className="trip-grid">
          {filteredTrips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onEdit={setEditingTrip}
              onDuplicate={(item) => requestAction('duplicate', item)}
              onArchive={(item) => requestAction('archive', item)}
              onRestore={(item) => requestAction('restore', item)}
              onDelete={(item) => requestAction('delete', item)}
            />
          ))}
        </div>
      ) : (
        <section className="empty-state">
          <span>{activeFilter === 'archived' ? '▣' : '✈'}</span>
          <h2>{t(activeFilter === 'archived' ? 'trips.archivedEmptyTitle' : 'trips.emptyTitle')}</h2>
          <p>{t(activeFilter === 'archived' ? 'trips.archivedEmptyText' : 'trips.emptyText')}</p>
          {activeFilter !== 'archived' && <Button icon="plus" onClick={() => setCreateOpen(true)}>{t('trips.create')}</Button>}
        </section>
      )}

      <CreateTripDialog isOpen={isCreateOpen} onClose={() => setCreateOpen(false)} />
      <EditTripDialog
        isOpen={Boolean(editingTrip)}
        trip={editingTrip}
        onClose={() => setEditingTrip(null)}
        onSaved={(trip) => {
          if (trip) setNotice({ title: t('editTrip.savedTitle'), message: t('editTrip.savedMessage', { name: trip.name }) });
        }}
      />
      <ConfirmDialog
        isOpen={Boolean(pendingAction)}
        title={actionCopy.title}
        description={actionCopy.description}
        confirmLabel={actionCopy.confirmLabel}
        cancelLabel={t('common.cancel')}
        tone={pendingAction?.type === 'delete' ? 'danger' : 'primary'}
        onClose={() => setPendingAction(null)}
        onConfirm={executePendingAction}
      />
    </div>
  );
}

function getActionCopy(pendingAction, t) {
  if (!pendingAction) return { title: '', description: '', confirmLabel: '' };
  const { type, trip } = pendingAction;
  return {
    duplicate: {
      title: t('trips.duplicateTitle'),
      description: t('trips.duplicateConfirm', { name: trip.name }),
      confirmLabel: t('trips.duplicate'),
    },
    archive: {
      title: t('trips.archiveTitle'),
      description: t('trips.archiveConfirm', { name: trip.name }),
      confirmLabel: t('trips.archive'),
    },
    restore: {
      title: t('trips.restoreTitle'),
      description: t('trips.restoreConfirm', { name: trip.name }),
      confirmLabel: t('trips.restore'),
    },
    delete: {
      title: t('trips.deleteTitle'),
      description: t('trips.deleteConfirm', { name: trip.name }),
      confirmLabel: t('common.delete'),
    },
  }[type];
}
