import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_CONFIG } from '../../config/map.config.js';
import { useI18n } from '../../hooks/useI18n.js';
import { formatLocalizedDate, getTripStatus } from '../../utils/date.js';
import { Icon } from '../common/Icon.jsx';

const STATUS_COLORS = Object.freeze({
  ongoing: '#1aa181',
  upcoming: '#1f90ad',
  past: '#697386',
  draft: '#c96574',
  archived: '#8a8f9d',
});

export function TripsMap({ trips }) {
  const { locale, t } = useI18n();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef(null);

  const mappedTrips = useMemo(() => trips.filter((trip) => (
    Number.isFinite(Number(trip.destinationLatitude))
    && Number.isFinite(Number(trip.destinationLongitude))
  )), [trips]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;
    const map = L.map(containerRef.current, {
      center: MAP_CONFIG.defaultCenter,
      zoom: MAP_CONFIG.defaultZoom,
      zoomControl: false,
    });
    L.control.zoom({
      zoomInTitle: t('map.zoomIn'),
      zoomOutTitle: t('map.zoomOut'),
    }).addTo(map);
    L.tileLayer(MAP_CONFIG.tileUrl, {
      ...MAP_CONFIG.tileOptions,
      attribution: MAP_CONFIG.attribution,
    }).addTo(map);
    layersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      layersRef.current = null;
    };
  }, [t]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layersRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    if (mappedTrips.length === 0) {
      map.setView(MAP_CONFIG.defaultCenter, MAP_CONFIG.defaultZoom);
      return;
    }

    const bounds = [];
    mappedTrips.forEach((trip) => {
      const coordinates = [Number(trip.destinationLatitude), Number(trip.destinationLongitude)];
      const status = trip.archivedAt ? 'archived' : getTripStatus(trip);
      bounds.push(coordinates);
      const marker = L.circleMarker(coordinates, {
        radius: 10,
        weight: 3,
        color: '#ffffff',
        fillColor: STATUS_COLORS[status] || STATUS_COLORS.draft,
        fillOpacity: 0.96,
      });
      marker.bindTooltip(trip.name, { direction: 'top', offset: [0, -8] });
      marker.bindPopup(createTripPopup(trip, status, locale, t));
      marker.on('click', () => {
        marker.openPopup();
      });
      marker.on('dblclick', () => navigate(`/trips/${trip.id}`));
      marker.addTo(layer);
    });

    if (bounds.length === 1) map.setView(bounds[0], 6);
    else map.fitBounds(bounds, { padding: [44, 44], maxZoom: 6 });
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
