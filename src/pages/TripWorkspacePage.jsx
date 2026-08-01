import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CollaborationPanel } from '../components/tripWorkspace/CollaborationPanel.jsx';
import { CalendarPanel } from '../components/tripWorkspace/CalendarPanel.jsx';
import { BookingPanel } from '../components/tripWorkspace/BookingPanel.jsx';
import { BudgetPanel } from '../components/tripWorkspace/BudgetPanel.jsx';
import { ChecklistPanel } from '../components/tripWorkspace/ChecklistPanel.jsx';
import { DocumentsPanel } from '../components/tripWorkspace/DocumentsPanel.jsx';
import { ItineraryPanel } from '../components/tripWorkspace/ItineraryPanel.jsx';
import { MapPanel } from '../components/tripWorkspace/MapPanel.jsx';
import { NotesPanel } from '../components/tripWorkspace/NotesPanel.jsx';
import { OverviewPanel } from '../components/tripWorkspace/OverviewPanel.jsx';
import { ReservationsPanel } from '../components/tripWorkspace/ReservationsPanel.jsx';
import { RouteOptimizerPanel } from '../components/tripWorkspace/RouteOptimizerPanel.jsx';
import { SavedPlacesPanel } from '../components/tripWorkspace/SavedPlacesPanel.jsx';
import { SharedExpensesPanel } from '../components/tripWorkspace/SharedExpensesPanel.jsx';
import { StatisticsPanel } from '../components/tripWorkspace/StatisticsPanel.jsx';
import { TravelToolsPanel } from '../components/tripWorkspace/TravelToolsPanel.jsx';
import { TripHero } from '../components/tripWorkspace/TripHero.jsx';
import { TodayPanel } from '../components/tripWorkspace/TodayPanel.jsx';
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
  const tabsRef = useRef(null);
  const shouldFocusTabsRef = useRef(false);
  const trip = getTripById(tripId);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [tripId]);

  useEffect(() => {
    if (!shouldFocusTabsRef.current) return;
    shouldFocusTabsRef.current = false;
    window.requestAnimationFrame(() => {
      tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      tabsRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    });
  }, [activeTab]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (TRIP_TABS.some((item) => item.id === tab) && tab !== activeTab) {
      shouldFocusTabsRef.current = true;
      setActiveTab(tab);
    }
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
    shouldFocusTabsRef.current = true;
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
      <TripTabs navRef={tabsRef} activeTab={activeTab} onChange={handleTabChange} />

      <div
        id={`trip-panel-${activeTab}`}
        className="trip-workspace__content"
        role="tabpanel"
        aria-labelledby={`trip-tab-${activeTab}`}
        tabIndex="0"
      >
        {activeTab === 'overview' && <OverviewPanel trip={trip} onOpenTab={handleTabChange} />}
        {activeTab === 'today' && <TodayPanel trip={trip} onUpdate={handleUpdate} onOpenTab={handleTabChange} />}
        {activeTab === 'itinerary' && <ItineraryPanel trip={trip} onUpdate={handleUpdate} />}
        {activeTab === 'route' && <RouteOptimizerPanel trip={trip} onUpdate={handleUpdate} onOpenTab={handleTabChange} />}
        {activeTab === 'calendar' && <CalendarPanel trip={trip} onOpenTab={handleTabChange} onUpdate={handleUpdate} />}
        {activeTab === 'map' && <MapPanel trip={trip} onUpdate={handleUpdate} onOpenTab={handleTabChange} />}
        {activeTab === 'places' && <SavedPlacesPanel trip={trip} onUpdate={handleUpdate} onOpenTab={handleTabChange} />}
        {activeTab === 'tools' && <TravelToolsPanel trip={trip} onOpenTab={handleTabChange} />}
        {activeTab === 'booking' && <BookingPanel trip={trip} onUpdate={handleUpdate} />}
        {activeTab === 'reservations' && <ReservationsPanel trip={trip} onUpdate={handleUpdate} />}
        {activeTab === 'budget' && <BudgetPanel trip={trip} onUpdate={handleUpdate} />}
        {activeTab === 'expenses' && <SharedExpensesPanel trip={trip} onUpdate={handleUpdate} />}
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
