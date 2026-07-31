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
import { TravelToolsPanel } from '../components/tripWorkspace/TravelToolsPanel.jsx';
import { TripHero } from '../components/tripWorkspace/TripHero.jsx';
import { EditTripDialog } from '../components/trips/EditTripDialog.jsx';
import { InlineNotice } from '../components/feedback/InlineNotice.jsx';
import { TripTabs } from '../components/tripWorkspace/TripTabs.jsx';
import { useI18n } from '../hooks/useI18n.js';
import { useTrips } from '../hooks/useTrips.js';

export function TripWorkspacePage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { getTripById, updateTrip } = useTrips();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditOpen, setEditOpen] = useState(false);
  const [notice, setNotice] = useState(null);
  const trip = getTripById(tripId);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab, tripId]);

  if (!trip) {
    return (
      <section className="empty-state empty-state--page">
        <span>?</span>
        <h1>{t('workspace.notFound')}</h1>
        <p>{t('workspace.notFoundText')}</p>
        <button className="button button--primary button--medium" type="button" onClick={() => navigate('/trips')}>
          {t('workspace.backTrips')}
        </button>
      </section>
    );
  }

  function handleUpdate(patch) {
    updateTrip(trip.id, patch);
  }

  return (
    <div className="trip-workspace">
      {notice && (
        <InlineNotice tone="success" title={notice.title} className="page-notice">
          {notice.message}
        </InlineNotice>
      )}
      <TripHero trip={trip} onEdit={() => setEditOpen(true)} />
      <TripTabs activeTab={activeTab} onChange={setActiveTab} />

      <div className="trip-workspace__content">
        {activeTab === 'overview' && <OverviewPanel trip={trip} onOpenTab={setActiveTab} />}
        {activeTab === 'itinerary' && <ItineraryPanel trip={trip} onUpdate={handleUpdate} />}
        {activeTab === 'map' && <MapPanel trip={trip} onOpenTab={setActiveTab} />}
        {activeTab === 'tools' && <TravelToolsPanel trip={trip} onOpenTab={setActiveTab} />}
        {activeTab === 'reservations' && <ReservationsPanel trip={trip} onUpdate={handleUpdate} />}
        {activeTab === 'budget' && <BudgetPanel trip={trip} onUpdate={handleUpdate} />}
        {activeTab === 'checklist' && <ChecklistPanel trip={trip} onUpdate={handleUpdate} />}
        {activeTab === 'documents' && <DocumentsPanel trip={trip} onUpdate={handleUpdate} />}
        {activeTab === 'notes' && <NotesPanel trip={trip} onUpdate={handleUpdate} />}
      </div>

      <EditTripDialog
        isOpen={isEditOpen}
        trip={trip}
        onClose={() => setEditOpen(false)}
        onSaved={(updatedTrip) => {
          if (updatedTrip) {
            setNotice({
              title: t('editTrip.savedTitle'),
              message: t('editTrip.savedMessage', { name: updatedTrip.name }),
            });
          }
        }}
      />
    </div>
  );
}
