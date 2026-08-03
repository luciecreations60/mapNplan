import { useMemo, useState } from 'react';
import { Button } from '../components/common/Button.jsx';
import { ConfirmDialog } from '../components/common/ConfirmDialog.jsx';
import { Icon } from '../components/common/Icon.jsx';
import { InlineNotice } from '../components/feedback/InlineNotice.jsx';
import { CreateTripDialog } from '../components/trips/CreateTripDialog.jsx';
import { EditTripDialog } from '../components/trips/EditTripDialog.jsx';
import { TripCard } from '../components/trips/TripCard.jsx';
import { TripsMap } from '../components/trips/TripsMap.jsx';
import { useI18n } from '../hooks/useI18n.js';
import { useTrips } from '../hooks/useTrips.js';
import { getTripStatus, parseLocalDate } from '../utils/date.js';
import { tripMatchesQuery } from '../utils/tripSearch.js';

const SORT_OPTIONS = ['smart', 'startAsc', 'startDesc', 'updatedDesc', 'nameAsc'];

export function TripsPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('smart');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [notice, setNotice] = useState(null);
  const [viewMode, setViewMode] = useState('cards');
  const { locale, t } = useI18n();
  const {
    trips,
    duplicateTrip,
    toggleTripFavorite,
    toggleTripPinned,
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
    let nextTrips = trips.filter((trip) => (
      activeFilter === 'archived' ? Boolean(trip.archivedAt) : !trip.archivedAt
    ));

    if (activeFilter === 'upcoming') {
      nextTrips = nextTrips.filter((trip) => ['upcoming', 'ongoing'].includes(getTripStatus(trip)));
    }
    if (activeFilter === 'past') {
      nextTrips = nextTrips.filter((trip) => getTripStatus(trip) === 'past');
    }
    if (favoritesOnly) nextTrips = nextTrips.filter((trip) => trip.isFavorite);
    if (query.trim()) nextTrips = nextTrips.filter((trip) => tripMatchesQuery(trip, query));

    return sortTrips(nextTrips, sortBy, locale);
  }, [activeFilter, favoritesOnly, locale, query, sortBy, trips]);

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

  function handleFavorite(trip) {
    const updated = toggleTripFavorite(trip.id);
    if (!updated) return;
    setNotice({
      title: t(updated.isFavorite ? 'tripLibrary.favoriteAddedTitle' : 'tripLibrary.favoriteRemovedTitle'),
      message: t(updated.isFavorite ? 'tripLibrary.favoriteAddedText' : 'tripLibrary.favoriteRemovedText', { name: trip.name }),
    });
  }

  function handlePinned(trip) {
    const updated = toggleTripPinned(trip.id);
    if (!updated) return;
    setNotice({
      title: t(updated.pinnedAt ? 'tripLibrary.pinnedTitle' : 'tripLibrary.unpinnedTitle'),
      message: t(updated.pinnedAt ? 'tripLibrary.pinnedText' : 'tripLibrary.unpinnedText', { name: trip.name }),
    });
  }

  function resetFilters() {
    setQuery('');
    setSortBy('smart');
    setFavoritesOnly(false);
  }

  const actionCopy = getActionCopy(pendingAction, t);
  const hasActiveControls = Boolean(query.trim()) || sortBy !== 'smart' || favoritesOnly;

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

      <section className="trip-library-controls" aria-label={t('tripLibrary.controlsAria')}>
        <label className="trip-library-search">
          <Icon name="search" size={18} />
          <input
            type="search"
            value={query}
            placeholder={t('tripLibrary.searchPlaceholder')}
            aria-label={t('tripLibrary.searchPlaceholder')}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && (
            <button type="button" aria-label={t('search.clear')} onClick={() => setQuery('')}>
              <Icon name="close" size={16} />
            </button>
          )}
        </label>

        <label className="trip-library-select">
          <span>{t('tripLibrary.sortLabel')}</span>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            {SORT_OPTIONS.map((option) => (
              <option key={option} value={option}>{t(`tripLibrary.sort.${option}`)}</option>
            ))}
          </select>
        </label>

        <button
          className={favoritesOnly ? 'trip-library-favorite trip-library-favorite--active' : 'trip-library-favorite'}
          type="button"
          aria-pressed={favoritesOnly}
          onClick={() => setFavoritesOnly((value) => !value)}
        >
          <Icon name="star" size={17} />
          {t('tripLibrary.favoritesOnly')}
        </button>

        {hasActiveControls && (
          <button className="trip-library-reset" type="button" onClick={resetFilters}>
            {t('tripLibrary.resetFilters')}
          </button>
        )}
      </section>

      <div className="trip-library-view-row">
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
        <div className="trip-library-view-actions">
          <span className="trip-library-count">
            {t(filteredTrips.length === 1 ? 'tripLibrary.resultOne' : 'tripLibrary.resultMany', { count: filteredTrips.length })}
          </span>
          <div className="view-toggle" role="group" aria-label={t('tripMap.viewAria')}>
            <button type="button" className={viewMode === 'cards' ? 'view-toggle__button view-toggle__button--active' : 'view-toggle__button'} aria-pressed={viewMode === 'cards'} onClick={() => setViewMode('cards')}><Icon name="trips" size={16} /> {t('tripMap.cards')}</button>
            <button type="button" className={viewMode === 'map' ? 'view-toggle__button view-toggle__button--active' : 'view-toggle__button'} aria-pressed={viewMode === 'map'} onClick={() => setViewMode('map')}><Icon name="map" size={16} /> {t('tripMap.map')}</button>
          </div>
        </div>
      </div>

      {filteredTrips.length > 0 ? (
        viewMode === 'map' ? <TripsMap trips={filteredTrips} /> : (
        <div className="trip-grid">
          {filteredTrips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onEdit={setEditingTrip}
              onDuplicate={(item) => requestAction('duplicate', item)}
              onToggleFavorite={handleFavorite}
              onTogglePinned={handlePinned}
              onArchive={(item) => requestAction('archive', item)}
              onRestore={(item) => requestAction('restore', item)}
              onDelete={(item) => requestAction('delete', item)}
            />
          ))}
        </div>)
      ) : (
        <section className="empty-state">
          <span>{activeFilter === 'archived' ? '▣' : '✈'}</span>
          <h2>{t(hasActiveControls ? 'tripLibrary.noMatchTitle' : activeFilter === 'archived' ? 'trips.archivedEmptyTitle' : 'trips.emptyTitle')}</h2>
          <p>{t(hasActiveControls ? 'tripLibrary.noMatchText' : activeFilter === 'archived' ? 'trips.archivedEmptyText' : 'trips.emptyText')}</p>
          {hasActiveControls ? (
            <Button variant="secondary" onClick={resetFilters}>{t('tripLibrary.resetFilters')}</Button>
          ) : activeFilter !== 'archived' && (
            <Button icon="plus" onClick={() => setCreateOpen(true)}>{t('trips.create')}</Button>
          )}
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

function sortTrips(trips, sortBy, locale) {
  return [...trips].sort((left, right) => {
    if (sortBy === 'smart') {
      const pinnedDifference = Number(Boolean(right.pinnedAt)) - Number(Boolean(left.pinnedAt));
      if (pinnedDifference) return pinnedDifference;
      if (left.pinnedAt && right.pinnedAt) {
        const pinDateDifference = new Date(right.pinnedAt) - new Date(left.pinnedAt);
        if (pinDateDifference) return pinDateDifference;
      }
      const favoriteDifference = Number(right.isFavorite) - Number(left.isFavorite);
      if (favoriteDifference) return favoriteDifference;
      return getStartTime(left) - getStartTime(right);
    }
    if (sortBy === 'startDesc') return getStartTime(right) - getStartTime(left);
    if (sortBy === 'updatedDesc') return new Date(right.updatedAt || 0) - new Date(left.updatedAt || 0);
    if (sortBy === 'nameAsc') return left.name.localeCompare(right.name, locale, { sensitivity: 'base' });
    return getStartTime(left) - getStartTime(right);
  });
}

function getStartTime(trip) {
  return parseLocalDate(trip.startDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
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
