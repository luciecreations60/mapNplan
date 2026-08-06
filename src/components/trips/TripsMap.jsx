import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import maplibregl from 'maplibre-gl';
import { MAP_CONFIG } from '../../config/map.config.js';
import { useI18n } from '../../hooks/useI18n.js';
import { formatLocalizedDate, getTripStatus } from '../../utils/date.js';
import { applyMapLanguage, createMapMarkerElement } from '../../utils/mapLanguage.js';
import { Icon } from '../common/Icon.jsx';

const STATUS_COLORS = Object.freeze({
  ongoing: '#1aa181',
  upcoming: '#1f90ad',
  past: '#697386',
  draft: '#c96574',
  archived: '#8a8f9d',
});

export function TripsMap({ trips }) {
  const { language, locale, t } = useI18n();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  const mappedTrips = useMemo(() => trips.filter((trip) => (
    Number.isFinite(Number(trip.destinationLatitude))
    && Number.isFinite(Number(trip.destinationLongitude))
  )), [trips]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_CONFIG.styleUrl,
      center: MAP_CONFIG.defaultCenter,
      zoom: MAP_CONFIG.defaultZoom,
      maxZoom: MAP_CONFIG.maxZoom,
      attributionControl: true,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.on('load', () => applyMapLanguage(map, language));
    map.on('styledata', () => applyMapLanguage(map, language));
    mapRef.current = map;

    const observer = new ResizeObserver(() => map.resize());
    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const updateLanguage = () => applyMapLanguage(map, language);
    if (map.isStyleLoaded()) updateLanguage();
    else map.once('load', updateLanguage);
  }, [language]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (mappedTrips.length === 0) {
      map.easeTo({ center: MAP_CONFIG.defaultCenter, zoom: MAP_CONFIG.defaultZoom, duration: 350 });
      return;
    }

    const bounds = new maplibregl.LngLatBounds();
    mappedTrips.forEach((trip) => {
      const coordinates = [Number(trip.destinationLongitude), Number(trip.destinationLatitude)];
      const status = trip.archivedAt ? 'archived' : getTripStatus(trip);
      bounds.extend(coordinates);
      const element = createMapMarkerElement({ color: STATUS_COLORS[status] || STATUS_COLORS.draft, size: 22, label: trip.name });
      element.addEventListener('click', (event) => {
        event.stopPropagation();
        map.flyTo({ center: coordinates, zoom: MAP_CONFIG.tripOverviewZoom, essential: true });
      });
      element.addEventListener('dblclick', (event) => {
        event.stopPropagation();
        navigate(`/trips/${trip.id}`);
      });

      const marker = new maplibregl.Marker({ element, anchor: 'center' })
        .setLngLat(coordinates)
        .setPopup(new maplibregl.Popup({ offset: 20 }).setDOMContent(createTripPopup(trip, status, locale, t)))
        .addTo(map);
      markersRef.current.push(marker);
    });

    if (mappedTrips.length === 1) {
      map.easeTo({ center: bounds.getCenter(), zoom: MAP_CONFIG.tripOverviewZoom, duration: 450 });
    } else {
      map.fitBounds(bounds, { padding: 64, maxZoom: MAP_CONFIG.tripOverviewZoom, duration: 550 });
    }
  }, [locale, mappedTrips, navigate, t]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    function handleOpenTrip(event) {
      const tripId = event.target.closest('[data-trip-id]')?.dataset.tripId;
      if (tripId) navigate(`/trips/${tripId}`);
    }
    container.addEventListener('click', handleOpenTrip);
    return () => container.removeEventListener('click', handleOpenTrip);
  }, [navigate]);

  return (
    <section className="trips-map-view" aria-label={t('tripMap.title')}>
      <div ref={containerRef} className="trips-map-view__map" aria-label={t('tripMap.aria')} />
      <div className="trips-map-view__legend">
        {['ongoing', 'upcoming', 'past'].map((status) => (
          <span key={status}><i style={{ background: STATUS_COLORS[status] }} />{t(`tripMap.status.${status}`)}</span>
        ))}
      </div>
      {mappedTrips.length === 0 && (
        <div className="trips-map-view__empty">
          <Icon name="map" size={28} />
          <strong>{t('tripMap.emptyTitle')}</strong>
          <span>{t('tripMap.emptyText')}</span>
        </div>
      )}
      {mappedTrips.length < trips.length && (
        <p className="trips-map-view__hint">{t('tripMap.unmapped', { count: trips.length - mappedTrips.length })}</p>
      )}
    </section>
  );
}

function createTripPopup(trip, status, locale, t) {
  const wrapper = document.createElement('div');
  wrapper.className = 'trips-map-popup';
  const badge = document.createElement('small');
  badge.textContent = t(`tripMap.status.${status}`);
  const title = document.createElement('strong');
  title.textContent = trip.name;
  const destination = document.createElement('span');
  destination.textContent = trip.destination || trip.country || t('common.destination');
  const dates = document.createElement('span');
  dates.textContent = trip.startDate
    ? `${formatLocalizedDate(trip.startDate, locale, 'short')} – ${formatLocalizedDate(trip.endDate, locale, 'short')}`
    : t('trips.datesTbc');
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.tripId = trip.id;
  button.textContent = t('tripMap.openTrip');
  wrapper.append(badge, title, destination, dates, button);
  return wrapper;
}
