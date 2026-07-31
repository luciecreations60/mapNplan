import { useMemo, useState } from 'react';
import { Button } from '../components/common/Button.jsx';
import { CreateTripDialog } from '../components/trips/CreateTripDialog.jsx';
import { TripCard } from '../components/trips/TripCard.jsx';
import { useTrips } from '../hooks/useTrips.js';
import { getTripStatus, sortTripsByStartDate } from '../utils/date.js';

const FILTERS = [
  { id: 'all', label: 'All trips' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
];

export function TripsPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [isCreateOpen, setCreateOpen] = useState(false);
  const { trips, deleteTrip } = useTrips();

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
    if (trip && window.confirm(`Delete “${trip.name}”?`)) deleteTrip(id);
  }

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Travel library</p>
          <h1>My trips</h1>
          <p>Plan future adventures and keep completed journeys close.</p>
        </div>
        <Button icon="plus" onClick={() => setCreateOpen(true)}>Create a trip</Button>
      </section>

      <div className="filter-tabs" role="tablist" aria-label="Trip filters">
        {FILTERS.map((filter) => (
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
          <h2>No journeys here yet</h2>
          <p>Create a trip and start turning ideas into a clear plan.</p>
          <Button icon="plus" onClick={() => setCreateOpen(true)}>Create a trip</Button>
        </section>
      )}

      <CreateTripDialog isOpen={isCreateOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
