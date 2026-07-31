import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CollaborationPanel } from '../components/tripWorkspace/CollaborationPanel.jsx';
import { CalendarPanel } from '../components/tripWorkspace/CalendarPanel.jsx';
import { BudgetPanel } from '../components/tripWorkspace/BudgetPanel.jsx';
import { ChecklistPanel } from '../components/tripWorkspace/ChecklistPanel.jsx';
import { DocumentsPanel } from '../components/tripWorkspace/DocumentsPanel.jsx';
import { ItineraryPanel } from '../components/tripWorkspace/ItineraryPanel.jsx';
import { MapPanel } from '../components/tripWorkspace/MapPanel.jsx';
import { NotesPanel } from '../components/tripWorkspace/NotesPanel.jsx';
import { OverviewPanel } from '../components/tripWorkspace/OverviewPanel.jsx';
import { ReservationsPanel } from '../components/tripWorkspace/ReservationsPanel.jsx';
import { StatisticsPanel } from '../components/tripWorkspace/StatisticsPanel.jsx';
import { TravelToolsPanel } from '../components/tripWorkspace/TravelToolsPanel.jsx';
import { TripHero } from '../components/tripWorkspace/TripHero.jsx';
import { EditTripDialog } from '../components/trips/EditTripDialog.jsx';
import { InlineNotice } from '../components/feedback/InlineNotice.jsx';
import { TRIP_TABS, TripTabs } from '../components/tripWorkspace/TripTabs.jsx';
import { useI18n } from '../hooks/useI18n.js';
import { useTrips } from '../hooks/useTrips.js';

export function TripWorkspacePage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useI18n();
  const { getTripById, updateTrip } = useTrips();
  const requestedTab = searchParams.get('tab');
  const initialTab = TRIP_TABS.some((tab) => tab.id === requestedTab) ? requestedTab : 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isEditOpen, setEditOpen] = useState(false);
  const [notice, setNotice] = useState(null);
  const trip = getTripById(tripId);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab, tripId]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (TRIP_TABS.some((item) => item.id === tab) && tab !== activeTab) setActiveTab(tab);
  }, [activeTab, searchParams]);

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

  function handleTabChange(tab) {
    setActiveTab(tab);
    if (tab === 'overview') setSearchParams({}, { replace: true });
    else setSearchParams({ tab }, { replace: true });
  }

  return (
    <div className="trip-workspace">
      {notice && (
        <InlineNotice tone="success" title={notice.title} className="page-notice">
          {notice.message}
        </InlineNotice>
      )}
      <TripHero trip={trip} onEdit={() => setEditOpen(true)} />
      <TripTabs activeTab={activeTab} onChange={handleTabChange} />

      <div className="trip-workspace__content">
        {activeTab === 'overview' && <OverviewPanel trip={trip} onOpenTab={handleTabChange} />}
        {activeTab === 'itinerary' && <ItineraryPanel trip={trip} onUpdate={handleUpdate} />}
        {activeTab === 'calendar' && <CalendarPanel trip={trip} onOpenTab={handleTabChange} />}
        {activeTab === 'map' && <MapPanel trip={trip} onOpenTab={handleTabChange} />}
        {activeTab === 'tools' && <TravelToolsPanel trip={trip} onOpenTab={handleTabChange} />}
        {activeTab === 'reservations' && <ReservationsPanel trip={trip} onUpdate={handleUpdate} />}
        {activeTab === 'budget' && <BudgetPanel trip={trip} onUpdate={handleUpdate} />}
        {activeTab === 'statistics' && <StatisticsPanel trip={trip} />}
        {activeTab === 'checklist' && <ChecklistPanel trip={trip} onUpdate={handleUpdate} />}
        {activeTab === 'documents' && <DocumentsPanel trip={trip} onUpdate={handleUpdate} />}
        {activeTab === 'notes' && <NotesPanel trip={trip} onUpdate={handleUpdate} />}
        {activeTab === 'collaboration' && <CollaborationPanel trip={trip} onUpdate={handleUpdate} />}
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
