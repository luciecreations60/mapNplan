import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BudgetPanel } from '../components/tripWorkspace/BudgetPanel.jsx';
import { ChecklistPanel } from '../components/tripWorkspace/ChecklistPanel.jsx';
import { DocumentsPanel } from '../components/tripWorkspace/DocumentsPanel.jsx';
import { ItineraryPanel } from '../components/tripWorkspace/ItineraryPanel.jsx';
import { MapPanel } from '../components/tripWorkspace/MapPanel.jsx';
import { NotesPanel } from '../components/tripWorkspace/NotesPanel.jsx';
import { OverviewPanel } from '../components/tripWorkspace/OverviewPanel.jsx';
import { ReservationsPanel } from '../components/tripWorkspace/ReservationsPanel.jsx';
import { TripHero } from '../components/tripWorkspace/TripHero.jsx';
import { TripTabs } from '../components/tripWorkspace/TripTabs.jsx';
import { useTrips } from '../hooks/useTrips.js';

/**
 * Main trip workspace.
 *
 * This page owns module navigation only. Every business area stays isolated so
 * future collaboration, remote storage and affiliate services can be added
 * without turning the route component into a monolith.
 */
export function TripWorkspacePage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { getTripById, updateTrip } = useTrips();
  const [activeTab, setActiveTab] = useState('overview');
  const trip = getTripById(tripId);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab, tripId]);

  if (!trip) {
    return (
      <section className="empty-state empty-state--page">
        <span>?</span>
        <h1>Trip not found</h1>
        <p>This journey may have been deleted or the link is no longer valid.</p>
        <button className="button button--primary button--medium" type="button" onClick={() => navigate('/trips')}>
          Return to my trips
        </button>
      </section>
    );
  }

  function handleUpdate(patch) {
    updateTrip(trip.id, patch);
  }

  return (
    <div className="trip-workspace">
      <TripHero trip={trip} />
      <TripTabs activeTab={activeTab} onChange={setActiveTab} />

      <div className="trip-workspace__content">
        {activeTab === 'overview' && <OverviewPanel trip={trip} onOpenTab={setActiveTab} />}
        {activeTab === 'itinerary' && <ItineraryPanel trip={trip} onUpdate={handleUpdate} />}
        {activeTab === 'map' && <MapPanel trip={trip} onOpenTab={setActiveTab} />}
        {activeTab === 'reservations' && <ReservationsPanel trip={trip} onUpdate={handleUpdate} />}
        {activeTab === 'budget' && <BudgetPanel trip={trip} onUpdate={handleUpdate} />}
        {activeTab === 'checklist' && <ChecklistPanel trip={trip} onUpdate={handleUpdate} />}
        {activeTab === 'documents' && <DocumentsPanel trip={trip} onUpdate={handleUpdate} />}
        {activeTab === 'notes' && <NotesPanel trip={trip} onUpdate={handleUpdate} />}
      </div>
    </div>
  );
}
