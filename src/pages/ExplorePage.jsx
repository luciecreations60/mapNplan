import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button.jsx';
import { Card } from '../components/common/Card.jsx';
import { Icon } from '../components/common/Icon.jsx';
import { LocationAutocomplete } from '../components/common/LocationAutocomplete.jsx';
import { InlineNotice } from '../components/feedback/InlineNotice.jsx';
import { useI18n } from '../hooks/useI18n.js';
import { useTrips } from '../hooks/useTrips.js';
import { createSavedPlace, SAVED_PLACE_CATEGORIES } from '../utils/savedPlaces.js';

const DESTINATIONS = [
  { city: 'Kyoto', country: 'Japan', tagKey: 'explore.cultureFood', accent: 'violet', range: '5–7' },
  { city: 'Reykjavík', country: 'Iceland', tagKey: 'explore.natureRoadTrip', accent: 'aqua', range: '7–10' },
  { city: 'Florence', country: 'Italy', tagKey: 'explore.artFood', accent: 'coral', range: '3–5' },
];

export function ExplorePage() {
  const { t } = useI18n();
  const { trips, updateTrip } = useTrips();
  const navigate = useNavigate();
  const activeTrips = trips.filter((trip) => !trip.archivedAt);
  const [targetTripId, setTargetTripId] = useState(activeTrips[0]?.id || '');
  const [locationValue, setLocationValue] = useState('');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('sight');
  const [list, setList] = useState('ideas');
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState(null);

  const allSavedPlaces = useMemo(() => activeTrips
    .flatMap((trip) => (trip.savedPlaces || []).map((place) => ({ ...place, tripId: trip.id, tripName: trip.name })))
    .filter((place) => {
      const normalizedQuery = query.trim().toLocaleLowerCase();
      if (!normalizedQuery) return true;
      return [place.name, place.label, place.city, place.country, place.tripName, ...(place.tags || [])]
        .some((value) => String(value || '').toLocaleLowerCase().includes(normalizedQuery));
    })
    .sort((left, right) => String(right.updatedAt || '').localeCompare(String(left.updatedAt || ''))), [activeTrips, query]);

  function handlePlaceSelect(place) {
    setSelectedPlace(place);
    if (place) {
      setName(place.name);
      setLocationValue(place.label);
    }
  }

  function saveInspiration(event) {
    event.preventDefault();
    const trip = activeTrips.find((item) => item.id === targetTripId);
    if (!trip || !selectedPlace || !name.trim()) return;

    const savedPlace = createSavedPlace({
      ...selectedPlace,
      name: name.trim(),
      category,
      list,
      priority: 'medium',
      status: 'idea',
    });
    updateTrip(trip.id, { savedPlaces: [...(trip.savedPlaces || []), savedPlace] });
    setNotice({
      title: t('places.savedTitle'),
      message: t('places.savedToTrip', { name: savedPlace.name, trip: trip.name }),
    });
    setLocationValue('');
    setSelectedPlace(null);
    setName('');
  }

  function useStarterIdea(destination) {
    setLocationValue(`${destination.city}, ${destination.country}`);
    setName(destination.city);
    setSelectedPlace(null);
    window.requestAnimationFrame(() => document.getElementById('explore-place-search')?.focus());
  }

  return (
    <div className="page-stack explore-page">
      <section className="explore-hero">
        <div>
          <p className="eyebrow">{t('explore.eyebrow')}</p>
          <h1>{t('explore.title')}</h1>
          <p>{t('explore.intro')}</p>
          <div className="explore-search explore-search--library">
            <Icon name="search" size={20} />
            <input value={query} aria-label={t('places.searchLibrary')} placeholder={t('places.searchLibrary')} onChange={(event) => setQuery(event.target.value)} />
            <span>{t('places.savedCount', { count: allSavedPlaces.length })}</span>
          </div>
        </div>
        <div className="explore-hero__art" aria-hidden="true">
          <span className="explore-hero__globe"><Icon name="globe" size={86} strokeWidth={1.15} /></span>
          <span className="explore-hero__pin explore-hero__pin--one"><Icon name="pin" size={24} /></span>
          <span className="explore-hero__pin explore-hero__pin--two"><Icon name="pin" size={20} /></span>
          <span className="explore-hero__plane"><Icon name="plane" size={36} /></span>
        </div>
      </section>

      {notice && <InlineNotice tone="success" title={notice.title}>{notice.message}</InlineNotice>}

      <section className="content-section explore-save-section">
        <header className="section-heading">
          <div>
            <p className="eyebrow">{t('places.quickSaveEyebrow')}</p>
            <h2>{t('places.quickSaveTitle')}</h2>
            <p>{t('places.quickSaveText')}</p>
          </div>
        </header>
        <Card className="explore-save-card">
          {activeTrips.length > 0 ? (
            <form className="explore-save-form" onSubmit={saveInspiration}>
              <LocationAutocomplete
                id="explore-place-search"
                variant="workspace"
                label={t('places.location')}
                value={locationValue}
                required
                placeholder={t('places.locationPlaceholder')}
                onValueChange={(value) => {
                  setLocationValue(value);
                  if (selectedPlace && value !== selectedPlace.label) setSelectedPlace(null);
                }}
                onPlaceSelect={handlePlaceSelect}
              />
              <label className="workspace-field">
                <span>{t('places.name')}</span>
                <input required value={name} placeholder={t('places.namePlaceholder')} onChange={(event) => setName(event.target.value)} />
              </label>
              <label className="workspace-field">
                <span>{t('places.targetTrip')}</span>
                <select value={targetTripId} onChange={(event) => setTargetTripId(event.target.value)}>
                  {activeTrips.map((trip) => <option key={trip.id} value={trip.id}>{trip.name}</option>)}
                </select>
              </label>
              <label className="workspace-field">
                <span>{t('places.category')}</span>
                <select value={category} onChange={(event) => setCategory(event.target.value)}>
                  {SAVED_PLACE_CATEGORIES.map((item) => <option key={item} value={item}>{t(`places.categories.${item}`)}</option>)}
                </select>
              </label>
              <label className="workspace-field">
                <span>{t('places.list')}</span>
                <input value={list} onChange={(event) => setList(event.target.value)} />
              </label>
              <Button type="submit" icon="star" disabled={!selectedPlace}>{t('places.saveInspiration')}</Button>
            </form>
          ) : (
            <div className="template-empty-state">
              <span><Icon name="trips" size={20} /></span>
              <div><h3>{t('places.noTripTitle')}</h3><p>{t('places.noTripText')}</p></div>
              <Button onClick={() => navigate('/trips')} icon="plus">{t('trips.create')}</Button>
            </div>
          )}
        </Card>
      </section>

      <section className="content-section">
        <header className="section-heading">
          <div>
            <p className="eyebrow">{t('places.libraryEyebrow')}</p>
            <h2>{t('places.libraryTitle')}</h2>
          </div>
        </header>
        {allSavedPlaces.length > 0 ? (
          <div className="inspiration-library-grid">
            {allSavedPlaces.map((place) => (
              <Card key={`${place.tripId}-${place.id}`} className="inspiration-library-card">
                <span className="inspiration-library-card__icon"><Icon name={place.category === 'food' ? 'food' : 'pin'} size={21} /></span>
                <div>
                  <small>{place.tripName} · {t(`places.statuses.${place.status}`)}</small>
                  <h3>{place.name}</h3>
                  <p>{place.label || [place.city, place.country].filter(Boolean).join(', ')}</p>
                  <div>{(place.tags || []).map((tag) => <span key={tag}>{tag}</span>)}</div>
                </div>
                <button className="text-link" type="button" onClick={() => navigate(`/trips/${place.tripId}?tab=places`)}>
                  {t('places.openLibrary')} <Icon name="arrowRight" size={16} />
                </button>
              </Card>
            ))}
          </div>
        ) : (
          <section className="workspace-large-empty">
            <span><Icon name="star" size={28} /></span>
            <h3>{t('places.libraryEmptyTitle')}</h3>
            <p>{t('places.libraryEmptyText')}</p>
          </section>
        )}
      </section>

      <section className="content-section">
        <header className="section-heading">
          <div>
            <p className="eyebrow">{t('explore.ideas')}</p>
            <h2>{t('explore.destinations')}</h2>
          </div>
        </header>
        <div className="destination-grid">
          {DESTINATIONS.map((destination) => (
            <Card key={destination.city} className={`destination-card destination-card--${destination.accent}`}>
              <div className="destination-card__art"><Icon name="map" size={42} /></div>
              <div className="destination-card__body">
                <span>{t(destination.tagKey)}</span>
                <h3>{destination.city}</h3>
                <p>{destination.country} · {t('explore.days', { range: destination.range })}</p>
                <button className="text-link" type="button" onClick={() => useStarterIdea(destination)}>{t('places.saveIdea')} <Icon name="arrowRight" size={16} /></button>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
