import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CollaborationPanel } from '../components/tripWorkspace/CollaborationPanel.jsx';
import { CalendarPanel } from '../components/tripWorkspace/CalendarPanel.jsx';
import { BookingPanel } from '../components/tripWorkspace/BookingPanel.jsx';
import { BudgetHubPanel } from '../components/tripWorkspace/BudgetHubPanel.jsx';
import { ChecklistPanel } from '../components/tripWorkspace/ChecklistPanel.jsx';
import { DocumentsPanel } from '../components/tripWorkspace/DocumentsPanel.jsx';
import { ItineraryPanel } from '../components/tripWorkspace/ItineraryPanel.jsx';
import { MapPanel } from '../components/tripWorkspace/MapPanel.jsx';
import { NotesPanel } from '../components/tripWorkspace/NotesPanel.jsx';
import { OverviewPanel } from '../components/tripWorkspace/OverviewPanel.jsx';
import { ReservationsPanel } from '../components/tripWorkspace/ReservationsPanel.jsx';
import { RouteOptimizerPanel } from '../components/tripWorkspace/RouteOptimizerPanel.jsx';
import { SavedPlacesPanel } from '../components/tripWorkspace/SavedPlacesPanel.jsx';
import { StatisticsPanel } from '../components/tripWorkspace/StatisticsPanel.jsx';
import { TravelToolsPanel } from '../components/tripWorkspace/TravelToolsPanel.jsx';
import { TripHero } from '../components/tripWorkspace/TripHero.jsx';
import { TodayPanel } from '../components/tripWorkspace/TodayPanel.jsx';
import { AccommodationComparisonPanel } from '../components/tripWorkspace/AccommodationComparisonPanel.jsx';
import { EditTripDialog } from '../components/trips/EditTripDialog.jsx';
import { InlineNotice } from '../components/feedback/InlineNotice.jsx';
import {
  TRIP_TABS,
  TripSubNavigation,
  TripTabs,
  getDefaultViewForGroup,
  getWorkspaceGroupForView,
  getWorkspaceViewIds,
} from '../components/tripWorkspace/TripTabs.jsx';
import { useI18n } from '../hooks/useI18n.js';
import { useTrips } from '../hooks/useTrips.js';
import { rememberProviderSearch } from '../utils/bookingOptions.js';

function resolveWorkspaceLocation(requestedTab, requestedView) {
  const requestedGroup = TRIP_TABS.some((tab) => tab.id === requestedTab)
    ? requestedTab
    : getWorkspaceGroupForView(requestedTab);
  const activeGroup = requestedGroup || 'overview';
  const viewIds = getWorkspaceViewIds(activeGroup);
  const legacyView = viewIds.includes(requestedTab) ? requestedTab : null;
  const activeView = viewIds.includes(requestedView)
    ? requestedView
    : legacyView || getDefaultViewForGroup(activeGroup);

  return { activeGroup, activeView };
}

export function TripWorkspacePage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useI18n();
  const { getTripById, updateTrip } = useTrips();
  const requestedTab = searchParams.get('tab');
  const requestedView = searchParams.get('view');
  const { activeGroup, activeView } = useMemo(
    () => resolveWorkspaceLocation(requestedTab, requestedView),
    [requestedTab, requestedView],
  );
  const [isEditOpen, setEditOpen] = useState(false);
  const [notice, setNotice] = useState(null);
  const [bookingContext, setBookingContext] = useState(null);
  const [itineraryCreateRequest, setItineraryCreateRequest] = useState(null);
  const tabsRef = useRef(null);
  const shouldFocusTabsRef = useRef(false);
  const trip = getTripById(tripId);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    setBookingContext(null);
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
  }, [activeGroup, activeView]);

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

  function handleTabChange(target) {
    const targetIsGroup = TRIP_TABS.some((item) => item.id === target);
    const targetGroup = targetIsGroup ? target : getWorkspaceGroupForView(target);
    if (!targetGroup) return;

    const targetView = targetIsGroup
      ? getDefaultViewForGroup(targetGroup)
      : target;
    const nextParams = new URLSearchParams(searchParams);

    nextParams.delete('reservation');
    nextParams.delete('document');

    if (targetGroup === 'overview') {
      nextParams.delete('tab');
      nextParams.delete('view');
    } else {
      nextParams.set('tab', targetGroup);
      if (targetView && targetView !== getDefaultViewForGroup(targetGroup)) nextParams.set('view', targetView);
      else nextParams.delete('view');
    }

    shouldFocusTabsRef.current = true;
    setSearchParams(nextParams, { replace: true });
  }

  function handleAddCalendarEvent(date) {
    const targetDate = date || trip.startDate || '';
    setItineraryCreateRequest({ id: `${Date.now()}-${targetDate}`, date: targetDate });
    handleTabChange('itinerary');
  }

  function handleOpenBookingContext(context) {
    setBookingContext(context || null);
    handleTabChange('booking');
  }

  function handleRememberBookingSearch(payload) {
    const nextOptions = rememberProviderSearch(trip.bookingOptions || [], payload, trip.currency);
    if (nextOptions !== trip.bookingOptions) handleUpdate({ bookingOptions: nextOptions });
  }

  function handleOpenReservation(reservationId) {
    if (!reservationId) return;
    shouldFocusTabsRef.current = true;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', 'booking');
    nextParams.set('view', 'reservations');
    nextParams.set('reservation', reservationId);
    nextParams.delete('document');
    setSearchParams(nextParams, { replace: true });
  }

  function handleOpenDocument(documentId) {
    if (!documentId) return;
    shouldFocusTabsRef.current = true;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', 'trip');
    nextParams.set('view', 'documents');
    nextParams.delete('reservation');
    nextParams.set('document', documentId);
    setSearchParams(nextParams, { replace: true });
  }

  return (
    <div className="trip-workspace">
      {notice && (
        <InlineNotice tone="success" title={notice.title} className="page-notice">
          {notice.message}
        </InlineNotice>
      )}
      <TripHero trip={trip} onEdit={() => setEditOpen(true)} />
      <TripTabs navRef={tabsRef} activeTab={activeGroup} onChange={handleTabChange} />
      <TripSubNavigation activeGroup={activeGroup} activeView={activeView} onChange={handleTabChange} />

      <div
        id={`trip-panel-${activeGroup}`}
        className="trip-workspace__content"
        role="tabpanel"
        aria-labelledby={`trip-tab-${activeGroup}`}
        tabIndex="0"
      >
        {activeGroup === 'overview' && <OverviewPanel trip={trip} onOpenTab={handleTabChange} />}

        {activeGroup === 'planning' && activeView === 'today' && <TodayPanel trip={trip} onUpdate={handleUpdate} onOpenTab={handleTabChange} />}
        {activeGroup === 'planning' && activeView === 'itinerary' && (
          <ItineraryPanel
            trip={trip}
            onUpdate={handleUpdate}
            onOpenReservation={handleOpenReservation}
            onOpenBooking={handleOpenBookingContext}
            createRequest={itineraryCreateRequest}
          />
        )}
        {activeGroup === 'planning' && activeView === 'route' && <RouteOptimizerPanel trip={trip} onUpdate={handleUpdate} onOpenTab={handleTabChange} />}
        {activeGroup === 'planning' && activeView === 'calendar' && <CalendarPanel trip={trip} onOpenTab={handleTabChange} onUpdate={handleUpdate} onAddEvent={handleAddCalendarEvent} />}
        {activeGroup === 'planning' && activeView === 'map' && (
          <MapPanel trip={trip} onUpdate={handleUpdate} onOpenTab={handleTabChange} onOpenBooking={handleOpenBookingContext} onRememberBookingSearch={handleRememberBookingSearch} />
        )}
        {activeGroup === 'planning' && activeView === 'places' && <SavedPlacesPanel trip={trip} onUpdate={handleUpdate} onOpenTab={handleTabChange} />}

        {activeGroup === 'booking' && activeView === 'booking' && (
          <BookingPanel trip={trip} onUpdate={handleUpdate} context={bookingContext} onClearContext={() => setBookingContext(null)} />
        )}
        {activeGroup === 'booking' && activeView === 'stays' && (
          <AccommodationComparisonPanel trip={trip} onUpdate={handleUpdate} onOpenTab={handleTabChange} />
        )}
        {activeGroup === 'booking' && activeView === 'reservations' && (
          <ReservationsPanel
            trip={trip}
            onUpdate={handleUpdate}
            onOpenDocument={handleOpenDocument}
            focusedReservationId={searchParams.get('reservation')}
          />
        )}

        {activeGroup === 'trip' && activeView === 'budget' && <BudgetHubPanel trip={trip} onUpdate={handleUpdate} />}
        {activeGroup === 'trip' && activeView === 'statistics' && <StatisticsPanel trip={trip} />}
        {activeGroup === 'trip' && activeView === 'checklist' && <ChecklistPanel trip={trip} onUpdate={handleUpdate} />}
        {activeGroup === 'trip' && activeView === 'documents' && <DocumentsPanel trip={trip} onUpdate={handleUpdate} focusedDocumentId={searchParams.get('document')} />}
        {activeGroup === 'trip' && activeView === 'notes' && <NotesPanel trip={trip} onUpdate={handleUpdate} />}
        {activeGroup === 'trip' && activeView === 'collaboration' && <CollaborationPanel trip={trip} onUpdate={handleUpdate} />}
        {activeGroup === 'trip' && activeView === 'tools' && <TravelToolsPanel trip={trip} onOpenTab={handleTabChange} />}
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
