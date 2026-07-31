import { useMemo, useState } from 'react';
import { Button } from '../components/common/Button.jsx';
import { CreateTripDialog } from '../components/trips/CreateTripDialog.jsx';
import { TripCard } from '../components/trips/TripCard.jsx';
import { useI18n } from '../hooks/useI18n.js';
import { useTrips } from '../hooks/useTrips.js';
import { getTripStatus, sortTripsByStartDate } from '../utils/date.js';

export function TripsPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [isCreateOpen, setCreateOpen] = useState(false);
  const { t } = useI18n();
  const { trips, deleteTrip } = useTrips();
  const filters = [
    { id: 'all', label: t('trips.all') },
    { id: 'upcoming', label: t('trips.upcoming') },
    { id: 'past', label: t('trips.past') },
  ];

  const filteredTrips = useMemo(() => {
    const sortedTrips = sortTripsByStartDate(trips);
    if (activeFilter === 'all') return sortedTrips;
    if (activeFilter === 'upcoming') {
      return sortedTrips.filter((trip) => ['upcoming', 'ongoing'].includes(getTripStatus(trip)));
    }
    return sortedTrips.filter((trip) => getTripStatus(trip) === 'past');
  }, [activeFilter, trips]);

  function handleDelete(id) {
    const trip = trips.find((item) => item.id === id);
    if (trip && window.confirm(t('trips.deleteConfirm', { name: trip.name }))) deleteTrip(id);
  }

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
          {filteredTrips.map((trip) => <TripCard key={trip.id} trip={trip} onDelete={handleDelete} />)}
        </div>
      ) : (
        <section className="empty-state">
          <span>✈</span>
          <h2>{t('trips.emptyTitle')}</h2>
          <p>{t('trips.emptyText')}</p>
          <Button icon="plus" onClick={() => setCreateOpen(true)}>{t('trips.create')}</Button>
        </section>
      )}

      <CreateTripDialog isOpen={isCreateOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
